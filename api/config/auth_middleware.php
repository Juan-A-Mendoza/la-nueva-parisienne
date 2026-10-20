<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MIDDLEWARE DE AUTENTICACIÓN (AUTH_MIDDLEWARE.PHP)
   Gestión de sesiones PHP, validación de autenticación y protección CSRF.
   Se carga automáticamente desde security.php en cada petición.
   ========================================================================== */

// Configuración segura de sesiones PHP
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');

    session_set_cookie_params([
        'lifetime' => 28800,        // 8 horas (jornada laboral completa)
        'path'     => '/',
        'httponly'  => true,         // No accesible desde JavaScript (XSS)
        'samesite' => 'Strict'      // Protección contra CSRF
    ]);
    session_start();
}

/**
 * Valida que la petición tenga una sesión autenticada activa.
 * Llamar al inicio de cada endpoint que requiera autenticación.
 * Los endpoints públicos deben definir LNP_PUBLIC antes de incluir conexion.php.
 * @param array $allowedRoles Roles permitidos (vacío = cualquier rol autenticado)
 */
function require_auth(array $allowedRoles = []): void {
    if (empty($_SESSION['authenticated']) || empty($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no autenticada. Inicie sesión para continuar.',
            'code'    => 'AUTH_REQUIRED'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Verificar expiración de sesión (8 horas máximo)
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > 28800) {
        auth_destroy_session();
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'message' => 'Su sesión ha expirado. Inicie sesión nuevamente.',
            'code'    => 'SESSION_EXPIRED'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Verificar restricción por rol (SUPERADMIN siempre tiene acceso total)
    if (!empty($allowedRoles)) {
        $userRole = strtoupper($_SESSION['role_code'] ?? '');
        if ($userRole !== 'SUPERADMIN' && !in_array($userRole, $allowedRoles, true)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos suficientes para realizar esta acción.',
                'code'    => 'INSUFFICIENT_PERMISSIONS'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }

    // OPTIMIZACIÓN DE RENDIMIENTO (SESSION LOCK RELEASE):
    // Liberamos el candado de escritura del archivo de sesión en disco.
    // $_SESSION sigue disponible en memoria durante todo el script.
    // Esto permite que múltiples peticiones AJAX concurrentes de la misma pestaña
    // se ejecuten en paralelo inmediato en Apache en vez de encolarse secuencialmente.
    if (session_status() === PHP_SESSION_ACTIVE && !defined('LNP_KEEP_SESSION_OPEN')) {
        session_write_close();
    }
}

/**
 * Crea una sesión autenticada para el usuario tras login exitoso.
 * Regenera el ID de sesión para prevenir ataques de fijación de sesión.
 * @return string Token CSRF generado para enviar al cliente
 */
function auth_create_session(array $userData): string {
    session_regenerate_id(true);

    $_SESSION['user_id']       = $userData['id'] ?? '';
    $_SESSION['username']      = $userData['username'] ?? '';
    $_SESSION['name']          = $userData['name'] ?? '';
    $_SESSION['role_code']     = $userData['roleCode'] ?? '';
    $_SESSION['role_name']     = $userData['role'] ?? '';
    $_SESSION['authenticated'] = true;
    $_SESSION['login_time']    = time();
    $_SESSION['ip_address']    = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    // Generar token CSRF criptográficamente seguro
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    return $_SESSION['csrf_token'];
}

/**
 * Destruye la sesión actual de forma segura (logout completo)
 */
function auth_destroy_session(): void {
    if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
        @session_start();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'] ?? '',
            $params['secure'] ?? false, $params['httponly'] ?? true
        );
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

/**
 * Retorna la información del usuario autenticado o null si no hay sesión
 */
function auth_get_current_user(): ?array {
    if (empty($_SESSION['authenticated'])) return null;
    return [
        'id'       => $_SESSION['user_id'] ?? '',
        'username' => $_SESSION['username'] ?? '',
        'name'     => $_SESSION['name'] ?? '',
        'roleCode' => $_SESSION['role_code'] ?? '',
        'role'     => $_SESSION['role_name'] ?? ''
    ];
}

/**
 * Valida el token CSRF para peticiones de escritura (POST/PUT/DELETE).
 * El token debe enviarse en el header X-CSRF-Token.
 */
function require_csrf(): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['POST', 'PUT', 'DELETE'], true)) return;

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'message' => 'Token de seguridad inválido o expirado. Recargue la página e intente nuevamente.',
            'code'    => 'INVALID_CSRF'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
