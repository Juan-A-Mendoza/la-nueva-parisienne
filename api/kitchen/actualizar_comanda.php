<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ACTUALIZAR ESTADO DE COMANDA (ACTUALIZAR_COMANDA.PHP)
   Actualiza el ciclo de vida de comandas en la cocina: pending -> in_progress -> ready -> archived/delivered
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

$comandaId = trim($data['id'] ?? $data['comanda_id'] ?? '');
$nuevoEstado = trim($data['estado'] ?? $data['nuevo_estado'] ?? $data['status'] ?? '');

if (empty($comandaId) || empty($nuevoEstado)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el ID de la comanda y el nuevo estado.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    if ($nuevoEstado === 'archived' || $nuevoEstado === 'delivered' || $nuevoEstado === 'deleted') {
        // Opción: borrar o marcar como despachada
        $stmt = $pdo->prepare("UPDATE comandas_cocina SET estado_preparacion = 'delivered' WHERE id = :id");
        $stmt->execute([':id' => $comandaId]);
    } else {
        $stmt = $pdo->prepare("UPDATE comandas_cocina SET estado_preparacion = :estado WHERE id = :id");
        $stmt->execute([':estado' => $nuevoEstado, ':id' => $comandaId]);
    }

    echo json_encode([
        'success' => true,
        'message' => "Comanda actualizada al estado '{$nuevoEstado}'.",
        'comandaId' => $comandaId,
        'nuevoEstado' => $nuevoEstado
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar comanda en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
