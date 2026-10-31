<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - VERIFICACIÓN DE TERCER FACTOR (PATRÓN GESTUAL 3x3)
   Valida el tercer factor de seguridad exclusivo para Superadministrador.
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
$inputPattern = trim($data['pattern'] ?? $data['patron'] ?? '');

if (empty($inputPattern)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Debe trazar su patrón gestual de seguridad.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Rate Limiting para 3FA
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateKey = "3fa_{$clientIp}_" . (!empty($userId) ? strtolower($userId) : md5($tempToken));
$rateCheck = security_check_rate_limit($rateKey, 5, 60);

if (!$rateCheck['allowed']) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Demasiados intentos fallidos de patrón gestual. Espere {$rateCheck['retry_after']} segundos antes de intentar nuevamente.",
        'retry_after' => $rateCheck['retry_after']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // 2. Localizar datos del usuario pendiente de 3FA
    $pendingSession = $_SESSION['lnp_3fa_pending'] ?? null;
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

    // 3. Consultar datos de usuario en MySQL
    $stmt = $pdo->prepare("
        SELECT u.id, u.codigo, u.username, u.nombre, u.email, u.icono, u.turno, 
               u.patron_seguridad, r.redirect_url, u.estado, r.codigo AS rol_codigo, r.nombre AS rol_nombre 
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

    // Normalizar patrones para comparación (eliminar espacios y guiones inconsistentes)
    $cleanInput = preg_replace('/[^0-8]/', '', $inputPattern);
    $savedPattern = !empty($userRow['patron_seguridad']) ? $userRow['patron_seguridad'] : '0-3-6-7-8';
    $cleanSaved = preg_replace('/[^0-8]/', '', $savedPattern);

    $isPatternValid = ($cleanInput === $cleanSaved);

    if ($isPatternValid) {
        security_clear_rate_limit($rateKey);
        unset($_SESSION['lnp_2fa_pending']);
        unset($_SESSION['lnp_3fa_pending']);

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
        security_log_access($userRow['id'], $userRow['username'], $clientIp, 'patron_seguridad', 'exitoso', "Patrón Gestual 3x3 validado exitosamente para {$userRow['nombre']}.");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => '¡Patrón gestual verificado con éxito! Acceso autorizado.',
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

    } else {
        security_record_failed_attempt($rateKey, 60);
        $remaining = max(0, $rateCheck['remaining'] - 1);

        security_log_access($userRow['id'], $userRow['username'], $clientIp, 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.');

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => "Patrón gestual incorrecto. Intentos restantes antes del bloqueo: {$remaining}.",
            'remaining_attempts' => $remaining
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno al validar patrón gestual: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
