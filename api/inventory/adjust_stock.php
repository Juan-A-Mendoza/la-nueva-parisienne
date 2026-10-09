<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT AJUSTE DE STOCK E INVENTARIO (ADJUST_STOCK.PHP)
   Actualiza existencias y mermas directamente en la tabla productos de MySQL
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

if (!$data) {
    $data = $_POST;
}

$productId = trim($data['productId'] ?? $data['id'] ?? '');
$qty = (float)($data['quantity'] ?? $data['qty'] ?? 0);
$type = strtolower(trim($data['type'] ?? 'add')); // 'add', 'subtract', 'set'
$reason = trim($data['reason'] ?? 'Ajuste manual');

if (empty($productId) || $qty <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Parámetros inválidos. Se requiere producto y cantidad mayor a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Buscar primero en materias_primas por ID, código o palabras clave
    $tokens = array_values(array_filter(explode(' ', str_replace(['mat_', 'prod_', '_', '-'], ' ', strtolower($productId)))));
    $primaryToken = '%' . ($tokens[0] ?? $productId) . '%';
    $secondaryToken = '%' . ($tokens[1] ?? ($tokens[0] ?? $productId)) . '%';

    $targetTable = 'materias_primas';
    $stmtFind = $pdo->prepare("SELECT id, nombre, stock_actual FROM materias_primas WHERE id = :id OR codigo = :code OR LOWER(nombre) LIKE :tok1 OR LOWER(nombre) LIKE :tok2 LIMIT 1");
    $stmtFind->execute([':id' => $productId, ':code' => $productId, ':tok1' => $primaryToken, ':tok2' => $secondaryToken]);
    $item = $stmtFind->fetch();

    if (!$item) {
        // Si no es materia prima, buscar en productos terminados
        $targetTable = 'productos';
        $stmtFind = $pdo->prepare("SELECT id, nombre, stock_actual FROM productos WHERE id = :id OR codigo = :code OR LOWER(nombre) LIKE :tok1 OR LOWER(nombre) LIKE :tok2 LIMIT 1");
        $stmtFind->execute([':id' => $productId, ':code' => $productId, ':tok1' => $primaryToken, ':tok2' => $secondaryToken]);
        $item = $stmtFind->fetch();
    }

    if (!$item) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Ítem no encontrado en materias primas ni en productos terminados.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $currentStock = (float)$item['stock_actual'];
    $newStock = $currentStock;

    if ($type === 'add') {
        $newStock = $currentStock + $qty;
    } elseif ($type === 'subtract') {
        $newStock = max(0, $currentStock - $qty);
    } elseif ($type === 'set') {
        $newStock = max(0, $qty);
    }

    $stmtUpdate = $pdo->prepare("UPDATE {$targetTable} SET stock_actual = :stock WHERE id = :id");
    $stmtUpdate->execute([':stock' => $newStock, ':id' => $item['id']]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Stock de '{$item['nombre']}' actualizado a {$newStock} ({$targetTable}).",
        'productId' => $item['id'],
        'productName' => $item['nombre'],
        'table' => $targetTable,
        'previousStock' => $currentStock,
        'newStock' => $newStock,
        'reason' => $reason
    ], JSON_UNESCAPED_UNICODE);
    exit();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al ajustar stock en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
