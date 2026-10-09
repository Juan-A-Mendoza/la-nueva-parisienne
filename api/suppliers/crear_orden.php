<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - REGISTRAR ORDEN DE COMPRA (CREAR_ORDEN.PHP)
   Inserta una nueva orden de compra en ordenes_compra de MySQL
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

$supplierId = trim($data['supplierId'] ?? $data['proveedor_id'] ?? $data['supplier_id'] ?? '');
$totalAmount = (float)($data['totalAmount'] ?? $data['amount'] ?? $data['total'] ?? $data['monto_total'] ?? 0);
$deliveryDate = trim($data['deliveryDate'] ?? $data['fecha_entrega'] ?? date('Y-m-d', strtotime('+3 days')));
$itemsSummary = trim($data['itemsSummary'] ?? $data['resumen_items'] ?? 'Insumos de panadería');

if (empty($supplierId) || $totalAmount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el proveedor y el monto total mayor a cero.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $stmtCount = $pdo->query("SELECT COUNT(*) FROM ordenes_compra");
    $count = (int)$stmtCount->fetchColumn();
    $code = 'OC-2026-00' . str_pad($count + 91, 2, '0', STR_PAD_LEFT);
    $id = 'po_' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $orderDate = date('Y-m-d');

    $stmtIns = $pdo->prepare("
        INSERT INTO ordenes_compra 
            (id, codigo, proveedor_id, fecha_pedido, fecha_entrega, estado, monto_total)
        VALUES
            (:id, :code, :supId, :orderDate, :deliveryDate, 'in_transit', :total)
    ");
    $stmtIns->execute([
        ':id' => $id,
        ':code' => $code,
        ':supId' => $supplierId,
        ':orderDate' => $orderDate,
        ':deliveryDate' => $deliveryDate,
        ':total' => $totalAmount
    ]);

    // Asociar a materia prima si coincide
    $stmtMat = $pdo->prepare("SELECT id FROM materias_primas LIMIT 1");
    $stmtMat->execute();
    $matRow = $stmtMat->fetch();
    $mpId = $matRow ? $matRow['id'] : 'inv_001';

    $stmtDetail = $pdo->prepare("
        INSERT INTO ordenes_compra_detalle 
            (orden_id, materia_prima_id, cantidad, precio)
        VALUES
            (:oid, :mpid, 50, :price)
    ");
    $stmtDetail->execute([
        ':oid' => $id,
        ':mpid' => $mpId,
        ':price' => $totalAmount
    ]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Orden de compra {$code} emitida con éxito.",
        'order' => [
            'id' => $id,
            'code' => $code,
            'supplierId' => $supplierId,
            'orderDate' => $orderDate,
            'deliveryDate' => $deliveryDate,
            'status' => 'in_transit',
            'totalAmount' => $totalAmount,
            'itemsSummary' => $itemsSummary
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear orden de compra en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
