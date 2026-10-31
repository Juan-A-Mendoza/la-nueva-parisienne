<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - VERIFICACIÓN DE SEGUNDO FACTOR (VERIFICAR_2FA.PHP)
   Valida el segundo paso de autenticación:
     - Para Usuarios Regulares: Código / PIN 2FA (por defecto 123456)
     - Para Superadministrador: PIN Maestro de Alta Dirección (por defecto 990022)
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

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$tempToken = trim($data['tempToken'] ?? $data['temp_token'] ?? '');
$userId = trim($data['userId'] ?? $data['username'] ?? $data['user'] ?? '');
$inputCode = trim($data['code'] ?? $data['pin_2fa'] ?? $data['masterPin'] ?? $data['master_pin'] ?? '');

if (empty($inputCode)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Debe ingresar el código de verificación o PIN requerido.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Rate Limiting para 2FA
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateKey = "2fa_{$clientIp}_" . (!empty($userId) ? strtolower($userId) : md5($tempToken));
$rateCheck = security_check_rate_limit($rateKey, 5, 60);

if (!$rateCheck['allowed']) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Demasiados intentos fallidos de 2FA. Espere {$rateCheck['retry_after']} segundos antes de intentar nuevamente.",
        'retry_after' => $rateCheck['retry_after']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    
    // 2. Localizar datos del usuario pendiente de 2FA
    $pendingSession = $_SESSION['lnp_2fa_pending'] ?? null;
    $targetUserId = null;

    if ($pendingSession && !empty($pendingSession['user_id'])) {
        if (!empty($tempToken) && ($pendingSession['temp_token'] ?? '') === $tempToken) {
            $targetUserId = $pendingSession['user_id'];
        } elseif (empty($tempToken) && !empty($userId) && strtolower($pendingSession['username']) === strtolower($userId)) {
            $targetUserId = $pendingSession['user_id'];
        }
    }

    if (!$targetUserId && !empty($userId)) {
        $targetUserId = $userId;
    }

    if (empty($targetUserId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'La sesión temporal de verificación ha expirado. Por favor inicie sesión nuevamente.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

require_once __DIR__ . '/../config/totp.php';

    // 3. Consultar datos actualizados del usuario en MySQL
    $stmt = $pdo->prepare("
        SELECT u.id, u.codigo, u.username, u.nombre, u.email, u.icono, u.turno, 
               u.pin, u.pin_2fa, u.pin_maestro, u.totp_secret, u.totp_enabled, u.patron_seguridad, u.mfa_tipo,
               r.redirect_url, u.estado, r.codigo AS rol_codigo, r.nombre AS rol_nombre 
        FROM usuarios u 
        INNER JOIN roles r ON u.rol_id = r.id 
        WHERE (u.id = :uid OR u.codigo = :uidCode OR u.username = :uidUser OR u.email = :uidEmail) 
          AND u.estado = 'active' 
        LIMIT 1
    ");
    $stmt->execute([
        ':uid' => $targetUserId,
        ':uidCode' => $targetUserId,
        ':uidUser' => $targetUserId,
        ':uidEmail' => $targetUserId
    ]);
    $userRow = $stmt->fetch();

    if (!$userRow) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Usuario no encontrado o no activo.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $isSuperadmin = (strtoupper($userRow['rol_codigo']) === 'SUPERADMIN' || strtolower($userRow['username'] ?? '') === 'superadmin');
    $mfaTipo = strtolower(trim($userRow['mfa_tipo'] ?? ''));
    if (empty($mfaTipo)) {
        $mfaTipo = $isSuperadmin ? 'ambos' : 'totp';
    }

    // 4. Verificación del segundo factor (Google Authenticator TOTP)
    $isSecondFactorValid = false;
    $metodoValidacion = 'desconocido';

    if (!empty($userRow['totp_secret']) && !empty($userRow['totp_enabled'])) {
        if (TOTP::verifyCode($userRow['totp_secret'], $inputCode, 4)) {
            $isSecondFactorValid = true;
            $metodoValidacion = 'google_authenticator_totp';
        }
    } elseif (!empty($userRow['pin_2fa']) && !$isSuperadmin) {
        // Fallback exclusivamente para empleados que aún no han configurado su TOTP
        if ($inputCode === $userRow['pin_2fa'] || password_verify($inputCode, $userRow['pin_2fa'])) {
            $isSecondFactorValid = true;
            $metodoValidacion = 'pin_2fa_backup';
        }
    }

    if ($isSecondFactorValid) {
        // Limpiar rate limit
        security_clear_rate_limit($rateKey);

        // Si el usuario tiene configurado AMBOS factores (TOTP + Patrón): transicionar al Patrón Gestual 3x3
        if ($mfaTipo === 'ambos') {
            if (session_status() === PHP_SESSION_NONE) {
                @session_start();
            }
            $_SESSION['lnp_3fa_pending'] = [
                'temp_token' => $tempToken,
                'user_id' => $userRow['id'],
                'username' => $userRow['username'] ?: ($userRow['codigo'] ?: $userRow['id']),
                'name' => $userRow['nombre'],
                'email' => $userRow['email'],
                'roleCode' => $userRow['rol_codigo'],
                'role' => $userRow['rol_nombre'],
                'icon' => $userRow['icono'],
                'shift' => $userRow['turno'],
                'redirectUrl' => $userRow['redirect_url'],
                'is_superadmin' => $isSuperadmin,
                'mfa_tipo' => 'ambos',
                'expires' => time() + 300
            ];

            // Registrar en auditoría
            security_log_access($userRow['id'], $userRow['username'], $clientIp, 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).');

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'requires_3fa' => true,
                'factor3_type' => 'pattern',
                'temp_token' => $tempToken,
                'message' => 'Código de Google Authenticator verificado correctamente. Trace su Patrón Gestual para acceder.',
                'user' => [
                    'id' => $userRow['id'],
                    'code' => $userRow['codigo'],
                    'name' => $userRow['nombre'],
                    'email' => $userRow['email'],
                    'role' => $userRow['rol_nombre'],
                    'roleCode' => $userRow['rol_codigo'],
                    'icon' => $userRow['icono'],
                    'shift' => $userRow['turno'],
                    'isSuperadmin' => $isSuperadmin,
                    'redirectUrl' => $userRow['redirect_url']
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Si es usuario regular: acceso completado con 2 factores
        unset($_SESSION['lnp_2fa_pending']);

        // Crear la sesión definitiva en PHP
        $csrfToken = auth_create_session([
            'id' => $userRow['id'],
            'username' => $userRow['username'] ?: ($userRow['codigo'] ?: $userRow['id']),
            'name' => $userRow['nombre'],
            'roleCode' => $userRow['rol_codigo'],
            'role' => $userRow['rol_nombre']
        ]);

        $token = security_generate_token();

        // Registrar en bitácora de auditoría
        security_log_access($userRow['id'], $userRow['username'], $clientIp, 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)');

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'requires_3fa' => false,
            'message' => 'Código de Google Authenticator verificado correctamente. Sesión iniciada.',
            'user' => [
                'id' => $userRow['id'],
                'code' => $userRow['codigo'],
                'name' => $userRow['nombre'],
                'email' => $userRow['email'],
                'role' => $userRow['rol_nombre'],
                'roleCode' => $userRow['rol_codigo'],
                'icon' => $userRow['icono'],
                'shift' => $userRow['turno'],
                'isSuperadmin' => $isSuperadmin,
                'redirectUrl' => $userRow['redirect_url']
            ],
            'token' => $token,
            'csrf_token' => $csrfToken,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit();

    } else {
        security_record_failed_attempt($rateKey, 60);
        $remaining = max(0, $rateCheck['remaining'] - 1);

        security_log_access($userRow['id'], $userRow['username'], $clientIp, 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto');

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => "Código de Google Authenticator incorrecto. Intentos restantes antes del bloqueo: {$remaining}.",
            'remaining_attempts' => $remaining
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno al validar segundo factor: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
