<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ELIMINAR ITEM DE INVENTARIO (ELIMINAR_ITEM.PHP)
   Eliminación controlada en MySQL para productos y materias primas
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

$id = trim($data['id'] ?? $data['code'] ?? $data['codigo'] ?? '');
$tipo = trim($data['type'] ?? $data['tipo'] ?? 'product');

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Identificador de ítem no especificado.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    if ($tipo === 'raw_material' || $tipo === 'materia_prima' || str_starts_with($id, 'MAT-')) {
        $stmt = $pdo->prepare("DELETE FROM materias_primas WHERE id = :id OR codigo = :id2");
        $stmt->execute([':id' => $id, ':id2' => $id]);
    } else {
        $stmt = $pdo->prepare("DELETE FROM productos WHERE id = :id OR codigo = :id2");
        $stmt->execute([':id' => $id, ':id2' => $id]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Ítem eliminado con éxito de la base de datos.',
        'deletedId' => $id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al eliminar ítem en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
