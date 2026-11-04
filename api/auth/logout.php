<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT DE CIERRE DE SESIÓN (LOGOUT.PHP)
   Destruye la sesión PHP del usuario de forma segura en el servidor
   ========================================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';

$userId = $_SESSION['user_id'] ?? null;
$userName = $_SESSION['user_name'] ?? ($_SESSION['username'] ?? 'Usuario');
$userRole = $_SESSION['role_code'] ?? 'USUARIO';

if ($userId) {
    log_bitacora(
        modulo: 'AUTH',
        accion: 'LOGOUT',
        descripcion: "Cierre de sesión regular por el usuario {$userName} ({$userRole})",
        severidad: 'INFO',
        userId: $userId,
        usuario: $userName,
        rol: $userRole
    );
}

auth_destroy_session();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Sesión cerrada correctamente.'
], JSON_UNESCAPED_UNICODE);
