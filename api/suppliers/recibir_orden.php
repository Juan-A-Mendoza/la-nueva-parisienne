<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT RECEPCIÓN DE ORDEN DE COMPRA (RECIBIR_ORDEN.PHP)
   Marca la orden como 'received' e incrementa el stock de insumos en materias_primas
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$orderId = trim($data['orderId'] ?? $data['id'] ?? $data['order_id'] ?? $data['orden_id'] ?? '');
$orderCode = trim($data['code'] ?? $data['orderCode'] ?? $data['order_code'] ?? $data['codigo'] ?? '');

if (empty($orderId) && empty($orderCode)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el ID o código de la orden de compra.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // 1. Buscar la orden
    $stmtOrder = $pdo->prepare("SELECT id, codigo, proveedor_id, estado, monto_total FROM ordenes_compra WHERE id = :id OR codigo = :code LIMIT 1");
    $stmtOrder->execute([':id' => $orderId, ':code' => $orderCode]);
    $order = $stmtOrder->fetch();

    if (!$order) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Orden de compra no encontrada en MySQL.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $actualOrderId = $order['id'];

    // 2. Actualizar estado de la orden a 'received'
    $stmtUpd = $pdo->prepare("UPDATE ordenes_compra SET estado = 'received' WHERE id = :id");
    $stmtUpd->execute([':id' => $actualOrderId]);

    // 3. Buscar los renglones de la orden y sumar stock a materias_primas
    $stmtItems = $pdo->prepare("
        SELECT d.materia_prima_id, d.cantidad, d.precio, mp.nombre, mp.stock_actual, mp.unidad_medida
        FROM ordenes_compra_detalle d
        LEFT JOIN materias_primas mp ON d.materia_prima_id = mp.id
        WHERE d.orden_id = :oid
    ");
    $stmtItems->execute([':oid' => $actualOrderId]);
    $items = $stmtItems->fetchAll();

    $itemsUpdated = [];
    $stmtAddStock = $pdo->prepare("UPDATE materias_primas SET stock_actual = stock_actual + :qty WHERE id = :mpid");

    foreach ($items as $it) {
        $mpId = $it['materia_prima_id'];
        $qty = (float)$it['cantidad'];

        if (!empty($mpId) && $qty > 0) {
            $stmtAddStock->execute([':qty' => $qty, ':mpid' => $mpId]);
            $itemsUpdated[] = [
                'id' => $mpId,
                'name' => $it['nombre'] ?: 'Insumo',
                'quantityAdded' => $qty,
                'unit' => $it['unidad_medida'] ?: 'kg'
            ];
        }
    }

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Orden {$order['codigo']} recibida con éxito. Se incrementaron los insumos en el almacén de materias primas.",
        'orderId' => $actualOrderId,
        'orderCode' => $order['codigo'],
        'itemsUpdated' => $itemsUpdated
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al recibir orden de compra en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
