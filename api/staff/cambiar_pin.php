<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - GESTIÓN Y MODIFICACIÓN DE PINS POR SUPERADMIN (CAMBIAR_PIN.PHP)
   Permite al Super Administrador modificar:
     - PIN Primario de Acceso (Paso 1)
     - Código / PIN 2FA (Paso 2)
     - PIN Maestro de Seguridad (Exclusivo Superadmin)
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$empId = trim($data['empId'] ?? $data['id'] ?? $data['userId'] ?? $data['user_id'] ?? $data['empleado_id'] ?? '');
$tipoPin = strtolower(trim($data['tipoPin'] ?? $data['pinType'] ?? $data['tipo'] ?? 'primario'));
$newPin = trim($data['newPin'] ?? $data['pin'] ?? $data['nuevo_pin'] ?? '');
$newPattern = trim($data['newPattern'] ?? $data['pattern'] ?? $data['patron'] ?? '');
$newMfaTipo = strtolower(trim($data['newMfaTipo'] ?? $data['mfaTipo'] ?? $data['mfa_tipo'] ?? ''));

$requestingUser = trim($data['requestingUser'] ?? $_SESSION['username'] ?? '');
$requestingRole = strtoupper(trim($data['requestingRole'] ?? $_SESSION['role_code'] ?? ''));

// Verificación de autorización: SUPERADMIN o ADMIN o sesión activa
$isAuthorized = ($requestingRole === 'SUPERADMIN' 
              || $requestingRole === 'ADMIN' 
              || in_array(strtolower($requestingUser), ['superadmin', 'admin'])
              || !empty($_SESSION['user_id'])
              || !empty($_SESSION['lnp_user_id']));

if (!$isAuthorized) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Acceso denegado: Se requieren permisos administrativos para modificar credenciales de seguridad.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (empty($empId)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el identificador del usuario o empleado.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (empty($newPin) && empty($newPattern) && empty($newMfaTipo)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Debe ingresar el nuevo parámetro de seguridad a configurar.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // 1. Localizar al usuario objetivo
    $stmt = $pdo->prepare("
        SELECT u.id, u.codigo, u.username, u.nombre, r.codigo AS rol_codigo, r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE u.id = :id OR u.codigo = :code OR u.username = :uname
        LIMIT 1
    ");
    $stmt->execute([':id' => $empId, ':code' => $empId, ':uname' => $empId]);
    $targetUser = $stmt->fetch();

    if (!$targetUser) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'El empleado o usuario indicado no existe en la base de datos.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $isTargetSuperadmin = ($targetUser['rol_codigo'] === 'SUPERADMIN' || strtolower($targetUser['username'] ?? '') === 'superadmin');
    $updatedTypes = [];

    // 2. Modificación de PIN Primario (Paso 1)
    if (!empty($newPin) && ($tipoPin === 'primario' || $tipoPin === 'todos' || $tipoPin === 'all')) {
        $hashedPin = security_hash_password($newPin);
        $stmtUpd = $pdo->prepare("UPDATE usuarios SET pin = :pin WHERE id = :id");
        $stmtUpd->execute([':pin' => $hashedPin, ':id' => $targetUser['id']]);
        $updatedTypes[] = 'PIN Primario (Paso 1)';
    }



    // 5. Modificación de Patrón Gestual 3x3
    $valPattern = !empty($newPattern) ? $newPattern : ($tipoPin === 'patron' ? $newPin : '');
    if (!empty($valPattern)) {
        $cleanPattern = preg_replace('/[^0-8\-]/', '', $valPattern);
        if (strlen(str_replace('-', '', $cleanPattern)) < 4) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El patrón gestual debe conectar al menos 4 puntos.'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $stmtUpd = $pdo->prepare("UPDATE usuarios SET patron_seguridad = :pat WHERE id = :id");
        $stmtUpd->execute([':pat' => $cleanPattern, ':id' => $targetUser['id']]);
        $updatedTypes[] = 'Patrón Gestual 3x3';
    }

    // 6. Modificación de Modalidad de Autenticación (MFA: totp, patron, ambos)
    $valMfa = !empty($newMfaTipo) ? $newMfaTipo : ($tipoPin === 'mfa_tipo' || $tipoPin === 'mfa' ? $newPin : '');
    if (!empty($valMfa)) {
        $allowedMfa = ['totp', 'patron', 'ambos'];
        if (!in_array($valMfa, $allowedMfa)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Modalidad de 2FA no válida. Siempre deben haber mínimo 2 factores activos. Opciones permitidas: totp (Google Authenticator), patron (Patrón 3x3) o ambos.'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $totpFlag = in_array($valMfa, ['totp', 'ambos']) ? 1 : 0;
        $stmtUpd = $pdo->prepare("UPDATE usuarios SET mfa_tipo = :mfa, totp_enabled = :totp WHERE id = :id");
        $stmtUpd->execute([':mfa' => $valMfa, ':totp' => $totpFlag, ':id' => $targetUser['id']]);
        $updatedTypes[] = "Modalidad MFA ({$valMfa})";
    }

    // 5. Registrar acción en auditoría
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $detallesAudit = "Superadmin actualizó: " . implode(', ', $updatedTypes) . " para {$targetUser['nombre']} ({$targetUser['username']})";
    security_log_access($targetUser['id'], $targetUser['username'], $clientIp, 'cambio_pin', 'exitoso', $detallesAudit);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Credenciales actualizadas exitosamente en MySQL para {$targetUser['nombre']}.",
        'updatedTypes' => $updatedTypes,
        'employee' => [
            'id' => $targetUser['id'],
            'code' => $targetUser['codigo'],
            'name' => $targetUser['nombre'],
            'username' => $targetUser['username'],
            'role' => $targetUser['rol_nombre']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar credenciales en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
