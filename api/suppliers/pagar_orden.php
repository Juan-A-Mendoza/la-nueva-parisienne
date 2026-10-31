<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT REGISTRO Y LIQUIDACIÓN DE PAGO (PAGAR_ORDEN.PHP)
   Marca la orden de compra como 'paid' y genera el asiento contable por partida doble:
     - DEBE:  2205 Proveedores Nacionales (Disminución de Pasivo)
     - HABER: 1110 Bancos Nacionales / 1105 Caja General (Salida de Activo)
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$orderId = trim($data['orderId'] ?? $data['id'] ?? $data['order_id'] ?? $data['orden_id'] ?? '');
$orderCode = trim($data['code'] ?? $data['orderCode'] ?? $data['order_code'] ?? $data['codigo'] ?? '');
$metodoPago = strtolower(trim($data['metodoPago'] ?? $data['metodo_pago'] ?? $data['paymentMethod'] ?? 'banco'));
$bancoNombre = trim($data['banco'] ?? $data['bancoNombre'] ?? $data['bank'] ?? 'Bancos Nacionales');
$referencia = trim($data['referencia'] ?? $data['reference'] ?? $data['ref'] ?? 'S/REF');
$fechaPago = trim($data['fechaPago'] ?? $data['fecha_pago'] ?? date('Y-m-d'));
$notas = trim($data['notas'] ?? $data['observaciones'] ?? '');
$montoCustom = isset($data['monto']) ? (float)$data['monto'] : (isset($data['amount']) ? (float)$data['amount'] : 0);

if (empty($orderId) && empty($orderCode)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el identificador o código de la orden de compra a liquidar.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // 1. Buscar la orden de compra y el proveedor asociado
    $stmtOrder = $pdo->prepare("
        SELECT o.id, o.codigo, o.proveedor_id, o.estado, o.monto_total,
               p.nombre AS proveedor_nombre, p.rif AS proveedor_rif
        FROM ordenes_compra o
        LEFT JOIN proveedores p ON o.proveedor_id = p.id
        WHERE o.id = :id OR o.codigo = :code
        LIMIT 1
    ");
    $stmtOrder->execute([':id' => $orderId, ':code' => $orderCode]);
    $order = $stmtOrder->fetch();

    if (!$order) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Orden de compra no encontrada en el sistema.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($order['estado'] === 'paid') {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "La orden {$order['codigo']} ya se encuentra pagada y liquidada contablemente."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $actualOrderId = $order['id'];
    $montoTotal = $montoCustom > 0 ? $montoCustom : (float)$order['monto_total'];
    $proveedorNombre = $order['proveedor_nombre'] ?: 'Proveedor Nacional';

    // 2. Determinar cuentas contables
    // Cuenta Pasivo Proveedor: 2205 (Proveedores Nacionales)
    $cuentaPasivo = '2205';

    // Cuenta Salida de Fondos: 1110 (Bancos Nacionales) o 1105 (Caja General)
    if ($metodoPago === 'caja' || $metodoPago === 'efectivo' || $metodoPago === 'cash') {
        $cuentaSalida = '1105';
        $metodoLabel = 'Efectivo Caja General';
    } elseif ($metodoPago === 'pago_movil' || $metodoPago === 'pagomovil') {
        $cuentaSalida = '1110';
        $metodoLabel = 'Pago Móvil Interbancario (' . ($bancoNombre ?: 'Bancos Nac.') . ')';
    } else {
        $cuentaSalida = '1110';
        $metodoLabel = 'Transferencia Bancaria (' . ($bancoNombre ?: 'Bancos Nac.') . ')';
    }

    // 3. Actualizar estado de la orden a 'paid'
    $stmtUpd = $pdo->prepare("UPDATE ordenes_compra SET estado = 'paid' WHERE id = :id");
    $stmtUpd->execute([':id' => $actualOrderId]);

    // 4. Generación Automática del Asiento Contable por Partida Doble
    $asientoId = 'as_pag_' . time() . '_' . substr(md5(uniqid()), 0, 4);
    $asientoCodigo = 'AS-PAG-' . date('Ymd-His');
    $nowDateTime = date('Y-m-d H:i:s');
    
    $concepto = "Pago Orden {$order['codigo']} a {$proveedorNombre} - {$metodoLabel} [Ref: {$referencia}]";
    if (!empty($notas)) {
        $concepto .= " - Nota: {$notas}";
    }

    // Insertar encabezado del comprobante diario
    $stmtAsiento = $pdo->prepare("
        INSERT INTO asientos_contables 
          (id, codigo, fecha_hora, concepto, modulo_origen, icono, total_debe, total_haber) 
        VALUES 
          (:id, :codigo, :fecha, :concepto, 'Proveedores y Compras', 'credit-card', :debe, :haber)
    ");
    $stmtAsiento->execute([
        ':id' => $asientoId,
        ':codigo' => $asientoCodigo,
        ':fecha' => $nowDateTime,
        ':concepto' => $concepto,
        ':debe' => $montoTotal,
        ':haber' => $montoTotal
    ]);

    // Insertar renglones de partida doble
    $stmtDetalle = $pdo->prepare("
        INSERT INTO asientos_detalle (asiento_id, cuenta_codigo, debe, haber)
        VALUES (:aid, :cuenta, :debe, :haber)
    ");

    // Renglón 1: DEBE a Proveedores Nacionales (2205) -> Cancela / Disminuye la obligación
    $stmtDetalle->execute([
        ':aid' => $asientoId,
        ':cuenta' => $cuentaPasivo,
        ':debe' => $montoTotal,
        ':haber' => 0.00
    ]);

    // Renglón 2: HABER a Bancos (1110) o Caja (1105) -> Salida de dinero real
    $stmtDetalle->execute([
        ':aid' => $asientoId,
        ':cuenta' => $cuentaSalida,
        ':debe' => 0.00,
        ':haber' => $montoTotal
    ]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Pago de la orden {$order['codigo']} registrado y contabilizado con éxito.",
        'orderId' => $actualOrderId,
        'orderCode' => $order['codigo'],
        'status' => 'paid',
        'statusText' => 'Pagada',
        'montoPagado' => $montoTotal,
        'asientoCodigo' => $asientoCodigo,
        'asientoId' => $asientoId,
        'partidaDoble' => [
            'debeCuenta' => $cuentaPasivo,
            'debeNombre' => 'Proveedores Nacionales',
            'haberCuenta' => $cuentaSalida,
            'haberNombre' => $cuentaSalida === '1105' ? 'Caja General' : 'Bancos Nacionales',
            'monto' => $montoTotal
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar el pago en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
