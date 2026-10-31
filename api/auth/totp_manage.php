<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - GESTIÓN Y VINCULACIÓN DE GOOGLE AUTHENTICATOR (TOTP)
   Permite ver el código QR, clave secreta, regenerar y sincronizar tiempo
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/totp.php';

$rawInput = file_get_contents('php://input');
$postData = json_decode($rawInput, true);
if (!$postData) $postData = $_POST;

$action = trim($_GET['action'] ?? $postData['action'] ?? 'get_setup');
$userId = trim($_GET['userId'] ?? $_GET['id'] ?? $postData['userId'] ?? $postData['id'] ?? '');

try {
    $pdo = getDbConnection();

    // 1. Obtener sincronización de tiempo en vivo
    if ($action === 'time_sync') {
        echo json_encode([
            'success' => true,
            'serverTime' => time(),
            'remainingSeconds' => TOTP::getRemainingSeconds(),
            'period' => 30
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 2. Localizar usuario objetivo
    if (empty($userId)) {
        // Si no se especifica, usar el usuario de sesión o superadmin por defecto
        $userId = $_SESSION['user_id'] ?? 'usr_superadmin';
    }

    $stmt = $pdo->prepare("
        SELECT id, username, nombre, email, totp_secret, totp_enabled, pin_maestro, pin_2fa 
        FROM usuarios 
        WHERE id = :id OR username = :uname OR email = :email 
        LIMIT 1
    ");
    $stmt->execute([
        ':id' => $userId,
        ':uname' => $userId,
        ':email' => $userId
    ]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Usuario no encontrado.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Asegurar que el usuario tenga un secreto válido
    if (empty($user['totp_secret'])) {
        $user['totp_secret'] = TOTP::generateSecret(16);
        $update = $pdo->prepare("UPDATE usuarios SET totp_secret = :sec, totp_enabled = 1 WHERE id = :id");
        $update->execute([':sec' => $user['totp_secret'], ':id' => $user['id']]);
    }

    // Acción A: Regenerar clave secreta
    if ($action === 'regenerate') {
        $newSecret = TOTP::generateSecret(16);
        $update = $pdo->prepare("UPDATE usuarios SET totp_secret = :sec, totp_enabled = 1 WHERE id = :id");
        $update->execute([':sec' => $newSecret, ':id' => $user['id']]);
        $user['totp_secret'] = $newSecret;
    }

    // Acción B: Probar y validar código de prueba
    if ($action === 'verify_test') {
        $testCode = trim($postData['code'] ?? $_GET['code'] ?? '');
        $isValid = TOTP::verifyCode($user['totp_secret'], $testCode, 4);

        echo json_encode([
            'success' => $isValid,
            'message' => $isValid 
                ? '¡Código TOTP verificado exitosamente! Tu aplicación está sincronizada y lista para iniciar sesión.' 
                : 'Código incorrecto o expirado. Asegúrate de ingresar el código actual de tu aplicación.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Acción C: Retornar datos de configuración para el modal / QR
    $accountLabel = !empty($user['username']) ? $user['username'] : $user['nombre'];
    $otpAuthUrl = TOTP::getOtpAuthUrl($accountLabel, $user['totp_secret'], 'La Nueva Parisienne');
    $currentCode = TOTP::calculateCode($user['totp_secret']); // Para demostración/verificación

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'nombre' => $user['nombre'],
            'totp_enabled' => (bool) $user['totp_enabled'],
            'totp_secret' => $user['totp_secret'],
            'totp_secret_readable' => TOTP::formatSecretReadable($user['totp_secret']),
            'otpauth_url' => $otpAuthUrl,
            'current_valid_code' => $currentCode, // Permite saber el código actual en local
            'remaining_seconds' => TOTP::getRemainingSeconds()
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en gestión TOTP: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
