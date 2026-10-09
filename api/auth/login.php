<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API DE AUTENTICACIÓN POR CREDENCIALES (LOGIN.PHP)
   Procesa la validación de credenciales consultando directamente MySQL
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
    $sql = "SELECT u.id, u.codigo, u.username, u.nombre, u.email, u.pin, u.icono, u.turno, 
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
        ':userIdRole5' => $userId
    ]);
    $userRow = $stmt->fetch();
    
    if (!$userRow) {
        security_record_failed_attempt($rateKey, 60);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'El perfil o usuario ingresado no existe o no se encuentra activo.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    // 2. Validación criptográfica segura de PIN/contraseña con BCRYPT
    $isValid = security_verify_password($inputPin, $userRow['pin']);

    if ($isValid) {
        // Limpiar registro de intentos fallidos
        security_clear_rate_limit($rateKey);

        // Si la clave estaba en texto plano o necesita actualización de coste, rehashear a BCRYPT
        if (security_needs_rehash($userRow['pin']) || !preg_match('/^\$2[ayb]\$/', $userRow['pin'])) {
            $newSecureHash = security_hash_password($inputPin);
            $stmtUpd = $pdo->prepare("UPDATE usuarios SET pin = :newHash WHERE id = :uid");
            $stmtUpd->execute([':newHash' => $newSecureHash, ':uid' => $userRow['id']]);
        }

        $token = security_generate_token();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Autenticación exitosa y validada con BCRYPT en MySQL',
            'user' => [
                'id' => $userRow['id'],
                'code' => $userRow['codigo'],
                'name' => $userRow['nombre'],
                'email' => $userRow['email'],
                'role' => $userRow['rol_nombre'],
                'roleCode' => $userRow['rol_codigo'],
                'icon' => $userRow['icono'],
                'shift' => $userRow['turno'],
                'redirectUrl' => $userRow['redirect_url']
            ],
            'token' => $token,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
    } else {
        security_record_failed_attempt($rateKey, 60);
        $remaining = max(0, $rateCheck['remaining'] - 1);

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
