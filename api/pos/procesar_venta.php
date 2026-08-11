<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API PROCESAMIENTO DE VENTAS (PROCESAR_VENTA.PHP)
   Recibe el carrito de compras del POS en JSON y registra la venta en MySQL
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

// Leer el cuerpo de la petición POST (JSON)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

if (empty($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Cuerpo de la petición vacío o JSON inválido.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Extraer parámetros del pedido
$orderNumber = isset($data['orderNumber']) ? trim($data['orderNumber']) : (isset($data['codigo']) ? trim($data['codigo']) : 'FAC-2026-' . rand(1000, 9999));
$userId = isset($data['userId']) ? trim($data['userId']) : 'usr_cashier';
$subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : 0.0;
$tax = isset($data['tax']) ? (float)$data['tax'] : (isset($data['iva']) ? (float)$data['iva'] : 0.0);
$discount = isset($data['discount']) ? (float)$data['discount'] : (isset($data['descuento']) ? (float)$data['descuento'] : 0.0);
$total = isset($data['total']) ? (float)$data['total'] : 0.0;
$paymentMethod = isset($data['paymentMethod']) ? trim($data['paymentMethod']) : (isset($data['metodo_pago']) ? trim($data['metodo_pago']) : 'Efectivo');
$tenderAmount = isset($data['tenderAmount']) ? (float)$data['tenderAmount'] : (isset($data['monto_pagado']) ? (float)$data['monto_pagado'] : $total);
$changeDue = isset($data['changeDue']) ? (float)$data['changeDue'] : (isset($data['cambio']) ? (float)$data['cambio'] : 0.0);
$orderType = isset($data['orderType']) ? trim($data['orderType']) : 'Para Llevar';
$items = isset($data['items']) ? $data['items'] : (isset($data['cart']) ? $data['cart'] : []);

if (empty($items)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'El pedido debe contener al menos un producto en el carrito.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    
    // Verificar si el usuario existe en MySQL, o asignar usr_cashier / usr_ana por defecto
    $stmtUser = $pdo->prepare("SELECT id FROM usuarios WHERE id = :uid LIMIT 1");
    $stmtUser->execute([':uid' => $userId]);
    if (!$stmtUser->fetch()) {
        $userId = 'usr_ana';
    }

    $saleId = 'sale_' . time() . '_' . rand(100, 999);
    $now = date('Y-m-d H:i:s');

    // Iniciar Transacción Atómica
    $pdo->beginTransaction();

    // 1. Insertar Encabezado de Venta en la tabla 'ventas'
    $sqlVenta = "INSERT INTO ventas 
                    (id, codigo, usuario_id, fecha_hora, subtotal, iva, descuento, total, metodo_pago, monto_pagado, cambio, tipo_pedido) 
                 VALUES 
                    (:id, :codigo, :usuario_id, :fecha_hora, :subtotal, :iva, :descuento, :total, :metodo_pago, :monto_pagado, :cambio, :tipo_pedido)";
    
    $stmtVenta = $pdo->prepare($sqlVenta);
    $stmtVenta->execute([
        ':id' => $saleId,
        ':codigo' => $orderNumber,
        ':usuario_id' => $userId,
        ':fecha_hora' => $now,
        ':subtotal' => $subtotal,
        ':iva' => $tax,
        ':descuento' => $discount,
        ':total' => $total,
        ':metodo_pago' => $paymentMethod,
        ':monto_pagado' => $tenderAmount,
        ':cambio' => $changeDue,
        ':tipo_pedido' => $orderType
    ]);

    // 2. Insertar Renglones de Detalle e Inventario
    $sqlDetalle1 = "INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal_linea) VALUES (:vid, :pid, :qty, :precio, :subtotal)";
    $sqlDetalle2 = "INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal_linea) VALUES (:vid, :pid, :qty, :precio, :subtotal)";
    $sqlUpdateStock = "UPDATE productos SET stock_actual = GREATEST(0, stock_actual - :qty) WHERE id = :pid";

    $stmtD1 = $pdo->prepare($sqlDetalle1);
    $stmtD2 = $pdo->prepare($sqlDetalle2);
    $stmtStock = $pdo->prepare($sqlUpdateStock);

    foreach ($items as $item) {
        $pid = isset($item['id']) ? $item['id'] : (isset($item['productId']) ? $item['productId'] : (isset($item['product']) && isset($item['product']['id']) ? $item['product']['id'] : 'prod_001'));
        $qty = isset($item['quantity']) ? (int)$item['quantity'] : (isset($item['qty']) ? (int)$item['qty'] : 1);
        $price = isset($item['price']) ? (float)$item['price'] : (isset($item['product']) && isset($item['product']['price']) ? (float)$item['product']['price'] : 0.0);
        $subtotalLinea = $qty * $price;

        // Insertar renglón en ventas_detalle
        $stmtD1->execute([
            ':vid' => $saleId,
            ':pid' => $pid,
            ':qty' => $qty,
            ':precio' => $price,
            ':subtotal' => $subtotalLinea
        ]);

        // Insertar renglón en detalles_venta
        $stmtD2->execute([
            ':vid' => $saleId,
            ':pid' => $pid,
            ':qty' => $qty,
            ':precio' => $price,
            ':subtotal' => $subtotalLinea
        ]);

        // Descontar inventario de la tabla productos
        $stmtStock->execute([
            ':qty' => $qty,
            ':pid' => $pid
        ]);
    }

    // 3. Generación Automática de Asiento Contable en Partida Doble
    $asientoId = 'as_pos_' . time();
    $asientoCodigo = 'AS-POS-' . date('Ymd-His');
    $concepto = "Venta POS Mostrador (Comprobante $orderNumber) - $orderType";

    $sqlAsiento = "INSERT INTO asientos_contables 
                     (id, codigo, fecha_hora, concepto, modulo_origen, icono, total_debe, total_haber) 
                   VALUES 
                     (:id, :codigo, :fecha, :concepto, 'Punto de Venta (POS)', '🛒', :debe, :haber)";
    
    $stmtAsiento = $pdo->prepare($sqlAsiento);
    $stmtAsiento->execute([
        ':id' => $asientoId,
        ':codigo' => $asientoCodigo,
        ':fecha' => $now,
        ':concepto' => $concepto,
        ':debe' => $total,
        ':haber' => $total
    ]);

    $sqlDetalleAsiento = "INSERT INTO asientos_detalle (asiento_id, cuenta_codigo, debe, haber) VALUES (:aid, :cuenta, :debe, :haber)";
    $stmtDA = $pdo->prepare($sqlDetalleAsiento);

    // Debe: 1105 (Caja General)
    $stmtDA->execute([':aid' => $asientoId, ':cuenta' => '1105', ':debe' => $total, ':haber' => 0.00]);
    
    // Haber: 4135 (Ventas Mostrador)
    $netSales = $subtotal - $discount;
    $stmtDA->execute([':aid' => $asientoId, ':cuenta' => '4135', ':debe' => 0.00, ':haber' => $netSales]);

    // Haber: 2408 (IVA Débito Fiscal)
    if ($tax > 0) {
        $stmtDA->execute([':aid' => $asientoId, ':cuenta' => '2408', ':debe' => 0.00, ':haber' => $tax]);
    }

    // Confirmar la Transacción en MySQL
    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Venta registrada y contabilizada exitosamente en MySQL.',
        'saleId' => $saleId,
        'orderNumber' => $orderNumber,
        'total' => $total,
        'itemsCount' => count($items),
        'timestamp' => $now
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar la venta en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
