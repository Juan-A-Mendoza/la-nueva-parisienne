<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - REGISTRAR NUEVO EMPLEADO (GUARDAR_EMPLEADO.PHP)
   Inserta un nuevo usuario en la tabla usuarios de MySQL
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

$name = trim($data['name'] ?? $data['nombre'] ?? '');
$roleCode = strtoupper(trim($data['roleCode'] ?? $data['rol'] ?? $data['rol_code'] ?? 'CASHIER'));
$shift = trim($data['shift'] ?? $data['turno'] ?? 'Turno Completo');
$pin = trim($data['pin'] ?? '1234');
$email = trim($data['email'] ?? $data['correo'] ?? '');
$phone = trim($data['phone'] ?? $data['telefono'] ?? '(01) 555-PARIS');

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el nombre del empleado.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Buscar rol_id correspondiente
    $stmtRole = $pdo->prepare("SELECT id, nombre, codigo FROM roles WHERE codigo = :code OR LOWER(nombre) LIKE :name LIMIT 1");
    $stmtRole->execute([':code' => $roleCode, ':name' => '%' . strtolower($roleCode) . '%']);
    $roleRow = $stmtRole->fetch();

    $rolId = $roleRow ? $roleRow['id'] : 'rol_cashier';
    $roleName = $roleRow ? $roleRow['nombre'] : 'Personal de Caja / POS';

    $stmtCount = $pdo->query("SELECT COUNT(*) FROM usuarios");
    $count = (int)$stmtCount->fetchColumn();
    $code = 'EMP-00' . ($count + 1);
    $id = 'usr_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode(' ', $name)[0])) . '_' . rand(10, 99);
    $username = strtolower(explode(' ', $name)[0]) . rand(10, 99);
    if (empty($email)) {
        $email = strtolower(explode(' ', $name)[0]) . '@lanuevaparisienne.com';
    }

    $avatar = 'user';
    if ($roleCode === 'BAKER') $avatar = 'chef-hat';
    elseif ($roleCode === 'ADMIN' || $roleCode === 'SUPERADMIN') $avatar = 'shield-check';
    elseif ($roleCode === 'CASHIER') $avatar = 'banknote';
    elseif ($roleCode === 'ACCOUNTANT') $avatar = 'calculator';

    $hashedPin = security_hash_password($pin);

    $stmtIns = $pdo->prepare("
        INSERT INTO usuarios 
            (id, codigo, username, nombre, email, pin, rol_id, icono, turno, estado)
        VALUES 
            (:id, :code, :username, :name, :email, :pin, :rolId, :icon, :shift, 'active')
    ");
    $stmtIns->execute([
        ':id' => $id,
        ':code' => $code,
        ':username' => $username,
        ':name' => $name,
        ':email' => $email,
        ':pin' => $hashedPin,
        ':rolId' => $rolId,
        ':icon' => $avatar,
        ':shift' => $shift
    ]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Empleado '{$name}' registrado con éxito en MySQL con PIN {$pin}.",
        'employee' => [
            'id' => $id,
            'code' => $code,
            'name' => $name,
            'role' => $roleName,
            'roleCode' => $roleCode,
            'shift' => $shift,
            'email' => $email,
            'phone' => $phone,
            'avatar' => $avatar,
            'status' => 'active',
            'statusText' => 'Activo'
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar empleado en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
