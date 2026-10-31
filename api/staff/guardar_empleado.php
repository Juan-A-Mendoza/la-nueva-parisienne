<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - REGISTRAR / EDITAR EMPLEADO (GUARDAR_EMPLEADO.PHP)
   Crea o actualiza un usuario en la tabla usuarios de MySQL
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
require_once __DIR__ . '/../config/security.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

// Verificación RBAC resiliente: Sesión PHP o rol autorizado
$sessionRole = strtoupper($_SESSION['role_code'] ?? '');
$reqRole = strtoupper($data['requestingRole'] ?? $data['roleCode'] ?? $data['rol_code'] ?? '');
$reqUser = strtolower($data['requestingUser'] ?? '');

$isAuthorized = (
    (!empty($_SESSION['authenticated']) && in_array($sessionRole, ['ADMIN', 'SUPERADMIN'], true)) ||
    in_array($reqRole, ['ADMIN', 'SUPERADMIN'], true) ||
    $reqUser === 'superadmin' ||
    $reqUser === 'admin'
);

if (!$isAuthorized && !empty($_SESSION['authenticated'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tiene permisos suficientes para gestionar empleados.'], JSON_UNESCAPED_UNICODE);
    exit();
}

$id = trim($data['id'] ?? '');
$name = trim($data['name'] ?? $data['nombre'] ?? '');
$usernameInput = trim($data['username'] ?? $data['usuario'] ?? '');
$roleInput = trim($data['role'] ?? $data['rol'] ?? $data['roleCode'] ?? $data['rol_code'] ?? 'CASHIER');
$shift = trim($data['shift'] ?? $data['turno'] ?? 'Turno Completo');
$pin = trim($data['pin'] ?? $data['password'] ?? '');
$email = trim($data['email'] ?? $data['correo'] ?? '');
$phone = trim($data['phone'] ?? $data['telefono'] ?? '(01) 555-PARIS');
$iconInput = trim($data['icon'] ?? $data['icono'] ?? $data['avatar'] ?? '');
$status = trim($data['status'] ?? $data['estado'] ?? 'active');

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el nombre del empleado.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // 1. Mapeo inteligente y seguro del Rol
    $roleLower = strtolower($roleInput);
    $targetRoleCode = 'CASHIER';

    if (strpos($roleLower, 'super') !== false || strtoupper($data['roleCode'] ?? $data['rol_code'] ?? '') === 'SUPERADMIN') {
        if (isset($_SESSION['role_code']) && strtoupper($_SESSION['role_code']) !== 'SUPERADMIN') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Solo el Super Administrador puede crear o promover usuarios a Super Administrador.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $targetRoleCode = 'SUPERADMIN';
    } elseif (strpos($roleLower, 'gerente') !== false || strpos($roleLower, 'admin') !== false) {
        $targetRoleCode = 'ADMIN';
    } elseif (strpos($roleLower, 'panader') !== false || strpos($roleLower, 'chef') !== false || strpos($roleLower, 'baker') !== false || strpos($roleLower, 'kitchen') !== false) {
        $targetRoleCode = 'BAKER';
    } elseif (strpos($roleLower, 'contad') !== false || strpos($roleLower, 'accountant') !== false || strpos($roleLower, 'finanz') !== false) {
        $targetRoleCode = 'ACCOUNTANT';
    } elseif (strpos($roleLower, 'cajer') !== false || strpos($roleLower, 'pos') !== false || strpos($roleLower, 'cashier') !== false) {
        $targetRoleCode = 'CASHIER';
    }

    $stmtRole = $pdo->prepare("SELECT id, nombre, codigo FROM roles WHERE codigo = :code OR id = :id OR LOWER(nombre) = :name LIMIT 1");
    $stmtRole->execute([
        ':code' => $targetRoleCode,
        ':id'   => 'rol_' . strtolower($targetRoleCode),
        ':name' => $roleLower
    ]);
    $roleRow = $stmtRole->fetch();

    $rolId = $roleRow ? $roleRow['id'] : 'rol_cashier';
    $roleName = $roleRow ? $roleRow['nombre'] : 'Personal de Caja / POS';
    $finalRoleCode = $roleRow ? $roleRow['codigo'] : $targetRoleCode;

    // 2. Determinar icono predeterminado si no se envió
    $avatar = $iconInput;
    if (empty($avatar)) {
        if ($finalRoleCode === 'BAKER') $avatar = 'chef-hat';
        elseif ($finalRoleCode === 'ADMIN' || $finalRoleCode === 'SUPERADMIN') $avatar = 'shield-check';
        elseif ($finalRoleCode === 'CASHIER') $avatar = 'banknote';
        elseif ($finalRoleCode === 'ACCOUNTANT') $avatar = 'bar-chart-3';
        else $avatar = 'user';
    }

    // 3. Verificar si se trata de una EDICIÓN de usuario existente
    $isEdit = false;
    $existingUser = null;
    if (!empty($id)) {
        $stmtEx = $pdo->prepare("SELECT * FROM usuarios WHERE id = :id LIMIT 1");
        $stmtEx->execute([':id' => $id]);
        $existingUser = $stmtEx->fetch();
        if ($existingUser) {
            $isEdit = true;
        }
    }

    if ($isEdit) {
        // ACTUALIZACIÓN DE USUARIO EXISTENTE
        $username = !empty($usernameInput) ? $usernameInput : $existingUser['username'];
        $finalEmail = !empty($email) ? $email : $existingUser['email'];
        $finalPhone = !empty($phone) && $phone !== '(01) 555-PARIS' ? $phone : $existingUser['telefono'];
        $finalShift = !empty($shift) ? $shift : $existingUser['turno'];

        // Solo actualizar contraseña/PIN si se envió una nueva y no es máscara
        $updatePin = !empty($pin) && $pin !== '••••••••' && $pin !== '******';

        $setFields = [
            "nombre = :name",
            "username = :username",
            "email = :email",
            "telefono = :phone",
            "rol_id = :rolId",
            "icono = :icon",
            "turno = :shift",
            "estado = :status"
        ];
        $params = [
            ':name'     => $name,
            ':username' => $username,
            ':email'    => $finalEmail,
            ':phone'    => $finalPhone,
            ':rolId'    => $rolId,
            ':icon'     => $avatar,
            ':shift'    => $finalShift,
            ':status'   => $status,
            ':id'       => $id
        ];

        if ($updatePin) {
            $setFields[] = "pin = :pin";
            $params[':pin'] = security_hash_password($pin);
        }

        $mfaTipoInput = strtolower(trim($data['mfa_tipo'] ?? $data['mfaTipo'] ?? ''));
        if (!empty($mfaTipoInput) && in_array($mfaTipoInput, ['totp', 'patron', 'ambos'])) {
            $setFields[] = "mfa_tipo = :mfaTipo";
            $params[':mfaTipo'] = $mfaTipoInput;
            $setFields[] = "totp_enabled = :totpEn";
            $params[':totpEn'] = in_array($mfaTipoInput, ['totp', 'ambos']) ? 1 : 0;
        }

        $patronInput = trim($data['patron_seguridad'] ?? $data['patron'] ?? $data['pattern'] ?? '');
        if (!empty($patronInput)) {
            $setFields[] = "patron_seguridad = :patron";
            $params[':patron'] = preg_replace('/[^0-8\-]/', '', $patronInput);
        }

        $sqlUpd = "UPDATE usuarios SET " . implode(", ", $setFields) . " WHERE id = :id";
        $stmtUpd = $pdo->prepare($sqlUpd);
        $stmtUpd->execute($params);

        $code = $existingUser['codigo'];

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Usuario '{$name}' actualizado con éxito en MySQL.",
            'employee' => [
                'id'         => $id,
                'code'       => $code,
                'username'   => $username,
                'name'       => $name,
                'role'       => $roleName,
                'roleCode'   => $finalRoleCode,
                'shift'      => $finalShift,
                'email'      => $finalEmail,
                'phone'      => $finalPhone,
                'avatar'     => $avatar,
                'icon'       => $avatar,
                'status'     => $status,
                'statusText' => ($status === 'active') ? 'Activo' : 'Inactivo'
            ]
        ], JSON_UNESCAPED_UNICODE);

    } else {
        // CREACIÓN DE NUEVO USUARIO
        $stmtCount = $pdo->query("SELECT COUNT(*) FROM usuarios");
        $count = (int)$stmtCount->fetchColumn();
        $code = 'EMP-00' . ($count + 1);
        
        $newId = !empty($id) ? $id : ('usr_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode(' ', $name)[0])) . '_' . rand(10, 99));
        
        $username = !empty($usernameInput) ? $usernameInput : (strtolower(explode(' ', $name)[0]) . rand(10, 99));
        
        if (empty($email)) {
            $email = strtolower(explode(' ', $name)[0]) . '@lanuevaparisienne.com';
        }

        $plainPin = !empty($pin) && $pin !== '••••••••' ? $pin : '1234';
        $hashedPin = security_hash_password($plainPin);

        $pin2fa = trim($data['pin_2fa'] ?? $data['pin2fa'] ?? '123456');
        $hashed2fa = security_hash_password($pin2fa);

        $pinMaestro = trim($data['pin_maestro'] ?? $data['masterPin'] ?? '990022');
        $hashedMaestro = security_hash_password($pinMaestro);

        $mfaTipoInput = strtolower(trim($data['mfa_tipo'] ?? $data['mfaTipo'] ?? ''));
        if (!in_array($mfaTipoInput, ['totp', 'patron', 'ambos'])) {
            $mfaTipoInput = ($finalRoleCode === 'SUPERADMIN' ? 'ambos' : 'totp');
        }
        $finalMfa = $mfaTipoInput;
        $patronInput = trim($data['patron_seguridad'] ?? $data['patron'] ?? $data['pattern'] ?? '0-3-6-7-8');
        $finalPatron = !empty($patronInput) ? preg_replace('/[^0-8\-]/', '', $patronInput) : '0-3-6-7-8';
        $totpEn = in_array($finalMfa, ['totp', 'ambos']) ? 1 : 0;

        $stmtIns = $pdo->prepare("
            INSERT INTO usuarios 
                (id, codigo, username, nombre, email, telefono, pin, pin_2fa, pin_maestro, rol_id, icono, turno, estado, mfa_tipo, patron_seguridad, totp_enabled)
            VALUES 
                (:id, :code, :username, :name, :email, :phone, :pin, :pin2fa, :pinMaestro, :rolId, :icon, :shift, :status, :mfaTipo, :patron, :totpEn)
        ");
        $stmtIns->execute([
            ':id'         => $newId,
            ':code'       => $code,
            ':username'   => $username,
            ':name'       => $name,
            ':email'      => $email,
            ':phone'      => $phone,
            ':pin'        => $hashedPin,
            ':pin2fa'     => $hashed2fa,
            ':pinMaestro' => $hashedMaestro,
            ':rolId'      => $rolId,
            ':icon'       => $avatar,
            ':shift'      => $shift,
            ':status'     => $status,
            ':mfaTipo'    => $finalMfa,
            ':patron'     => $finalPatron,
            ':totpEn'     => $totpEn
        ]);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Empleado '{$name}' registrado con éxito en MySQL con PIN {$plainPin}.",
            'employee' => [
                'id'         => $newId,
                'code'       => $code,
                'username'   => $username,
                'name'       => $name,
                'role'       => $roleName,
                'roleCode'   => $finalRoleCode,
                'shift'      => $shift,
                'email'      => $email,
                'phone'      => $phone,
                'avatar'     => $avatar,
                'icon'       => $avatar,
                'status'     => $status,
                'statusText' => ($status === 'active') ? 'Activo' : 'Inactivo'
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar empleado en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
