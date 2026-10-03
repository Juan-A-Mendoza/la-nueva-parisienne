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
$orderNumber = isset($data['orderNumber']) ? trim($data['orderNumber']) : (isset($data['order_number']) ? trim($data['order_number']) : (isset($data['codigo']) ? trim($data['codigo']) : 'FAC-2026-' . rand(1000, 9999)));
$userId = isset($data['userId']) ? trim($data['userId']) : (isset($data['user_id']) ? trim($data['user_id']) : 'usr_cashier');
$subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : 0.0;
$tax = isset($data['tax']) ? (float)$data['tax'] : (isset($data['iva']) ? (float)$data['iva'] : 0.0);
$discount = isset($data['discount']) ? (float)$data['discount'] : (isset($data['descuento']) ? (float)$data['descuento'] : 0.0);
$total = isset($data['total']) ? (float)$data['total'] : (isset($data['total_usd']) ? (float)$data['total_usd'] : 0.0);
$paymentMethod = isset($data['paymentMethod']) ? trim($data['paymentMethod']) : (isset($data['payment_method']) ? trim($data['payment_method']) : (isset($data['metodo_pago']) ? trim($data['metodo_pago']) : 'Efectivo'));
$tenderAmount = isset($data['tenderAmount']) ? (float)$data['tenderAmount'] : (isset($data['tender_amount']) ? (float)$data['tender_amount'] : (isset($data['monto_pagado']) ? (float)$data['monto_pagado'] : $total));
$changeDue = isset($data['changeDue']) ? (float)$data['changeDue'] : (isset($data['change_due']) ? (float)$data['change_due'] : (isset($data['cambio']) ? (float)$data['cambio'] : 0.0));
$orderType = isset($data['orderType']) ? trim($data['orderType']) : (isset($data['order_type']) ? trim($data['order_type']) : 'Para Llevar');
$bcvRate = isset($data['bcv_rate']) ? (float)$data['bcv_rate'] : (isset($data['tasa_bcv']) ? (float)$data['tasa_bcv'] : 1.0);
if ($bcvRate <= 0) $bcvRate = 1.0;
$totalBs = round($total * $bcvRate, 2);

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
    $stmtUser = $pdo->prepare("SELECT id, nombre, turno FROM usuarios WHERE id = :uid LIMIT 1");
    $stmtUser->execute([':uid' => $userId]);
    $userRow = $stmtUser->fetch();
    if (!$userRow) {
        $userId = 'usr_ana';
        $userRow = ['id' => 'usr_ana', 'nombre' => 'Ana Ramírez', 'turno' => 'Mañana (07:00 - 15:00)'];
    }

    $saleId = 'sale_' . time() . '_' . rand(100, 999);
    $now = date('Y-m-d H:i:s');

    // Iniciar Transacción Atómica
    $pdo->beginTransaction();

    // 1. Insertar Encabezado de Venta en la tabla 'ventas' (Bimonetario)
    $sqlVenta = "INSERT INTO ventas 
                    (id, codigo, usuario_id, fecha_hora, subtotal, iva, descuento, total, tasa_bcv, total_bs, metodo_pago, monto_pagado, cambio, tipo_pedido) 
                 VALUES 
                    (:id, :codigo, :usuario_id, :fecha_hora, :subtotal, :iva, :descuento, :total, :tasa_bcv, :total_bs, :metodo_pago, :monto_pagado, :cambio, :tipo_pedido)";
    
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
        ':tasa_bcv' => $bcvRate,
        ':total_bs' => $totalBs,
        ':metodo_pago' => $paymentMethod,
        ':monto_pagado' => $tenderAmount,
        ':cambio' => $changeDue,
        ':tipo_pedido' => $orderType
    ]);

    // 2. Insertar Renglones de Detalle e Inventario
    $sqlDetalle1 = "INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal_linea) VALUES (:vid, :pid, :qty, :precio, :subtotal)";
    $sqlUpdateStock = "UPDATE productos SET stock_actual = GREATEST(0, stock_actual - :qty) WHERE id = :pid";

    $stmtD1 = $pdo->prepare($sqlDetalle1);
    $stmtStock = $pdo->prepare($sqlUpdateStock);
    $stmtProduct = $pdo->prepare(
        "SELECT id FROM productos
         WHERE id = :id OR codigo = :codigo OR nombre = :nombre
         ORDER BY CASE WHEN id = :preferred_id THEN 0 WHEN codigo = :preferred_code THEN 1 ELSE 2 END
         LIMIT 1"
    );

    foreach ($items as $item) {
        $candidateId = trim((string)($item['id'] ?? $item['productId'] ?? $item['product_id'] ?? ($item['product']['id'] ?? '')));
        $candidateCode = trim((string)($item['code'] ?? $item['productCode'] ?? $item['product_code'] ?? ($item['product']['code'] ?? '')));
        $candidateName = trim((string)($item['name'] ?? $item['productName'] ?? $item['product_name'] ?? ($item['product']['name'] ?? '')));
        $stmtProduct->execute([
            ':id' => $candidateId,
            ':codigo' => $candidateCode,
            ':nombre' => $candidateName,
            ':preferred_id' => $candidateId,
            ':preferred_code' => $candidateCode
        ]);
        $productRow = $stmtProduct->fetch();
        if (!$productRow) {
            throw new RuntimeException('El producto no existe en el catálogo MySQL: ' . ($candidateName ?: $candidateId ?: $candidateCode));
        }
        $pid = $productRow['id'];
        $qty = isset($item['quantity']) ? (int)$item['quantity'] : (isset($item['qty']) ? (int)$item['qty'] : 1);
        $price = isset($item['price']) ? (float)$item['price'] : (isset($item['unit_price']) ? (float)$item['unit_price'] : (isset($item['product']['price']) ? (float)$item['product']['price'] : 0.0));
        $subtotalLinea = isset($item['subtotal']) ? (float)$item['subtotal'] : ($qty * $price);

        // Insertar renglón en ventas_detalle
        $stmtD1->execute([
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

    // 2b. Registrar Metadatos de la Venta en reportes_caja_venta_meta (Caja, Turno, Estatus)
    $sqlMeta = "INSERT INTO reportes_caja_venta_meta 
                    (venta_id, caja_id, turno, referencia_lote, estatus, actualizado_por, actualizado_en) 
                VALUES 
                    (:vid, :caja_id, :turno, :ref_lote, 'COMPLETADA', :uid, :now)";
    $stmtMeta = $pdo->prepare($sqlMeta);
    $stmtMeta->execute([
        ':vid' => $saleId,
        ':caja_id' => 'POS-PRINCIPAL',
        ':turno' => $userRow['turno'] ?? 'Mañana (07:00 - 15:00)',
        ':ref_lote' => 'LOTE-' . date('Ymd'),
        ':uid' => $userId,
        ':now' => $now
    ]);

    // 2c. Registrar Evento en reportes_caja_eventos para Cuadres y Auditoría de Caja
    $sqlEvento = "INSERT INTO reportes_caja_eventos 
                    (id, venta_id, codigo_venta, caja_id, turno, usuario_id, tipo_evento, estatus, metodo_pago, referencia_lote, monto, motivo, fecha_hora, registrado_por) 
                  VALUES 
                    (:eid, :vid, :c_venta, :caja_id, :turno, :uid, 'VENTA_REGISTRADA', 'COMPLETADA', :metodo, :ref_lote, :monto, 'Venta cobrada en caja', :now, :registrado_por)";
    $stmtEvento = $pdo->prepare($sqlEvento);
    $stmtEvento->execute([
        ':eid' => 'ev_' . time() . '_' . rand(100, 999),
        ':vid' => $saleId,
        ':c_venta' => $orderNumber,
        ':caja_id' => 'POS-PRINCIPAL',
        ':turno' => $userRow['turno'] ?? 'Mañana (07:00 - 15:00)',
        ':uid' => $userId,
        ':metodo' => $paymentMethod,
        ':ref_lote' => 'LOTE-' . date('Ymd'),
        ':monto' => $total,
        ':now' => $now,
        ':registrado_por' => $userRow['nombre'] ?? 'Cajero'
    ]);

    // 3. Generación Automática de Asiento Contable en Partida Doble
    $asientoId = 'as_pos_' . time();
    $asientoCodigo = 'AS-POS-' . date('Ymd-His');
    $concepto = "Venta POS Mostrador (Comprobante $orderNumber) - $orderType";

    $sqlAsiento = "INSERT INTO asientos_contables 
                     (id, codigo, fecha_hora, concepto, modulo_origen, icono, total_debe, total_haber) 
                   VALUES 
                     (:id, :codigo, :fecha, :concepto, 'Punto de Venta (POS)', 'shopping-cart', :debe, :haber)";
    
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
