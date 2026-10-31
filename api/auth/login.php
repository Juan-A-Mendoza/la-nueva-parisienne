<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API DE AUTENTICACIÓN POR CREDENCIALES (LOGIN.PHP)
   Procesa la validación de credenciales consultando directamente MySQL
   ========================================================================== */

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener datos del cuerpo de la petición POST (JSON o Form Data)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$userId = trim($data['userId'] ?? $data['username'] ?? $data['user'] ?? '');
$inputPin = trim($data['inputPin'] ?? $data['password'] ?? $data['pin'] ?? '');

if (empty($userId) || empty($inputPin)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Parámetros de autenticación incompletos (usuario y clave/PIN requeridos).'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Verificación de Rate Limiting (Protección contra fuerza bruta)
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateKey = "login_{$clientIp}_" . strtolower($userId);
$rateCheck = security_check_rate_limit($rateKey, 5, 60);

if (!$rateCheck['allowed']) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Demasiados intentos fallidos de inicio de sesión. Por motivos de seguridad, espere {$rateCheck['retry_after']} segundos antes de intentar nuevamente.",
        'retry_after' => $rateCheck['retry_after']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    
    // Consulta SQL preparada contra las tablas usuarios y roles (redirect_url desde roles - 2FN)
    $sql = "SELECT u.id, u.codigo, u.username, u.nombre, u.email, u.pin, u.pin_2fa, u.pin_maestro, u.totp_secret, u.totp_enabled, u.patron_seguridad, u.mfa_tipo, u.icono, u.turno, 
                   r.redirect_url, u.estado, r.codigo AS rol_codigo, r.nombre AS rol_nombre 
            FROM usuarios u 
            INNER JOIN roles r ON u.rol_id = r.id 
            WHERE (u.id = :userId 
                   OR u.codigo = :userIdCode 
                   OR u.username = :userIdUser 
                   OR u.email = :userIdEmail
                   OR (LOWER(:userIdRole1) = 'admin' AND r.codigo = 'ADMIN')
                   OR (LOWER(:userIdRole2) IN ('cajero', 'cajero1', 'pos') AND r.codigo = 'CASHIER')
                   OR (LOWER(:userIdRole3) IN ('panadero', 'panadero1', 'chef') AND r.codigo = 'BAKER')
                   OR (LOWER(:userIdRole4) IN ('contador', 'contador1') AND r.codigo = 'ACCOUNTANT')
                   OR (LOWER(:userIdRole5) IN ('superadmin', 'super_admin', 'root') AND r.codigo = 'SUPERADMIN')
                  ) 
              AND u.estado = 'active' 
            ORDER BY (CASE WHEN u.username = :userIdOrder OR u.codigo = :userIdOrder2 OR u.id = :userIdOrder3 THEN 1 ELSE 2 END) ASC
            LIMIT 1";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':userId' => $userId,
        ':userIdCode' => $userId,
        ':userIdUser' => $userId,
        ':userIdEmail' => $userId,
        ':userIdRole1' => $userId,
        ':userIdRole2' => $userId,
        ':userIdRole3' => $userId,
        ':userIdRole4' => $userId,
        ':userIdRole5' => $userId,
        ':userIdOrder' => $userId,
        ':userIdOrder2' => $userId,
        ':userIdOrder3' => $userId
    ]);
    $userRow = $stmt->fetch();
    
    if (!$userRow) {
        security_record_failed_attempt($rateKey, 60);
        security_log_access(null, $userId, $clientIp, 'primario', 'fallido', 'Usuario no encontrado o no activo');
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'El perfil o usuario ingresado no existe o no se encuentra activo.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    // 2. Validación criptográfica segura de PIN/contraseña primaria con BCRYPT
    $isValid = security_verify_password($inputPin, $userRow['pin']);

    if ($isValid) {
        // Limpiar registro de intentos fallidos
        security_clear_rate_limit($rateKey);

        $isSuperadmin = (strtoupper($userRow['rol_codigo']) === 'SUPERADMIN' || strtolower($userRow['username'] ?? '') === 'superadmin');
        $mfaTipo = strtolower(trim($userRow['mfa_tipo'] ?? ''));
        if (!in_array($mfaTipo, ['totp', 'patron', 'ambos'])) {
            $mfaTipo = $isSuperadmin ? 'ambos' : 'totp';
        }

        // Iniciar sesión PHP si no está activa
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        $userPayload = [
            'id' => $userRow['id'],
            'code' => $userRow['codigo'],
            'username' => $userRow['username'] ?: ($userRow['codigo'] ?: $userRow['id']),
            'name' => $userRow['nombre'],
            'email' => $userRow['email'],
            'role' => $userRow['rol_nombre'],
            'roleCode' => $userRow['rol_codigo'],
            'icon' => $userRow['icono'],
            'shift' => $userRow['turno'],
            'isSuperadmin' => $isSuperadmin,
            'mfaTipo' => $mfaTipo,
            'redirectUrl' => $userRow['redirect_url']
        ];

        // Generar token temporal para los siguientes pasos (mínimo 2 factores obligatorios)
        $tempToken = '2FA_' . bin2hex(random_bytes(20));

        // RAMA 2: Solo Patrón Gestual 3x3 (Salta el TOTP)
        if ($mfaTipo === 'patron') {
            $_SESSION['lnp_3fa_pending'] = [
                'temp_token' => $tempToken,
                'user_id' => $userRow['id'],
                'username' => $userPayload['username'],
                'name' => $userRow['nombre'],
                'email' => $userRow['email'],
                'roleCode' => $userRow['rol_codigo'],
                'role' => $userRow['rol_nombre'],
                'icon' => $userRow['icono'],
                'shift' => $userRow['turno'],
                'redirectUrl' => $userRow['redirect_url'],
                'is_superadmin' => $isSuperadmin,
                'mfa_tipo' => 'patron',
                'expires' => time() + 300
            ];

            security_log_access($userRow['id'], $userPayload['username'], $clientIp, 'primario', 'exitoso', 'Paso 1 validado. Requiere Patrón Gestual 3x3.');

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'requires_2fa' => false,
                'requires_pattern' => true,
                'mfa_tipo' => 'patron',
                'is_superadmin' => $isSuperadmin,
                'temp_token' => $tempToken,
                'message' => 'Credenciales correctas. Trace su patrón gestual de seguridad.',
                'user' => $userPayload
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // RAMA 3 & 4: TOTP o AMBOS (Requiere Google Authenticator primero)
        $_SESSION['lnp_2fa_pending'] = [
            'temp_token' => $tempToken,
            'user_id' => $userRow['id'],
            'username' => $userPayload['username'],
            'name' => $userRow['nombre'],
            'email' => $userRow['email'],
            'roleCode' => $userRow['rol_codigo'],
            'role' => $userRow['rol_nombre'],
            'icon' => $userRow['icono'],
            'shift' => $userRow['turno'],
            'redirectUrl' => $userRow['redirect_url'],
            'is_superadmin' => $isSuperadmin,
            'pin_2fa' => $userRow['pin_2fa'] ?? '123456',
            'pin_maestro' => $userRow['pin_maestro'] ?? '990022',
            'totp_secret' => $userRow['totp_secret'] ?? '',
            'totp_enabled' => !empty($userRow['totp_enabled']),
            'patron_seguridad' => $userRow['patron_seguridad'] ?? '0-3-6-7-8',
            'mfa_tipo' => $mfaTipo,
            'expires' => time() + 300
        ];

        security_log_access($userRow['id'], $userPayload['username'], $clientIp, 'primario', 'exitoso', "Paso 1 validado. Requiere 2FA (Tipo: {$mfaTipo})");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'requires_2fa' => true,
            'requires_pattern' => ($mfaTipo === 'ambos'),
            'mfa_tipo' => $mfaTipo,
            'is_superadmin' => $isSuperadmin,
            'temp_token' => $tempToken,
            'message' => ($mfaTipo === 'ambos') 
                ? 'Credenciales primarias correctas. Ingrese su código de Google Authenticator (Paso 2 de 3).'
                : 'Credenciales primarias correctas. Ingrese su código de Google Authenticator (Paso 2 de 2).',
            'user' => $userPayload
        ], JSON_UNESCAPED_UNICODE);
        exit();

    } else {
        security_record_failed_attempt($rateKey, 60);
        $remaining = max(0, $rateCheck['remaining'] - 1);

        security_log_access(
            $userRow['id'] ?? null,
            $userRow['username'] ?? $userId,
            $clientIp,
            'primario',
            'fallido',
            'Contraseña o PIN primario incorrecto'
        );

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => "PIN o clave de acceso incorrecta. Intentos restantes antes del bloqueo: {$remaining}.",
            'remaining_attempts' => $remaining
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno al procesar autenticación: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
