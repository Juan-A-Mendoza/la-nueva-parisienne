<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CAMBIAR PIN DE EMPLEADO (CAMBIAR_PIN.PHP)
   Actualiza el PIN de acceso del usuario en MySQL
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
require_once __DIR__ . '/../config/security.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$empId = trim($data['empId'] ?? $data['id'] ?? $data['userId'] ?? $data['user_id'] ?? $data['empleado_id'] ?? '');
$newPin = trim($data['newPin'] ?? $data['pin'] ?? $data['nuevo_pin'] ?? '');

if (empty($empId) || empty($newPin)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el ID del empleado y el nuevo PIN.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    $hashedPin = security_hash_password($newPin);
    $stmt = $pdo->prepare("UPDATE usuarios SET pin = :pin WHERE id = :id OR codigo = :code");
    $stmt->execute([':pin' => $hashedPin, ':id' => $empId, ':code' => $empId]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'PIN de acceso actualizado con éxito en la base de datos MySQL.',
        'empId' => $empId
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar PIN en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
