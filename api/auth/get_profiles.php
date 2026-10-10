<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API PARA LISTAR PERFILES DE USUARIOS (GET_PROFILES.PHP)
   Retorna la lista de empleados activos desde MySQL para la pantalla de inicio
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

try {
    $pdo = getDbConnection();
    
    // Consulta para obtener usuarios activos y sus roles asignados (redirect_url está en roles - 2FN)
    $sql = "SELECT u.id, u.codigo, u.username, u.nombre AS name, u.email, u.telefono, u.icono AS icon, 
                   u.turno, 
                   COALESCE(r.redirect_url, 'modules/dashboard.html') AS redirectUrl, 
                   COALESCE(r.nombre, 'Personal Autorizado') AS role, 
                   COALESCE(r.codigo, 'STAFF') AS roleCode, 
                   COALESCE(r.descripcion, 'Perfil de acceso al sistema La Nueva Parisienne.') AS descripcion
            FROM usuarios u 
            LEFT JOIN roles r ON u.rol_id = r.id 
            WHERE u.estado = 'active' 
            ORDER BY u.nombre ASC";
            
    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll();
    
    // Formatear la lista para el frontend
    $profiles = array_map(function($user) {
        return [
            'id' => $user['id'],
            'code' => $user['codigo'],
            'username' => $user['username'] ?: ($user['codigo'] ?: $user['id']),
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'roleCode' => $user['roleCode'],
            'icon' => $user['icon'] ? $user['icon'] : 'shield-check',
            'description' => $user['descripcion'],
            'redirectUrl' => $user['redirectUrl'],
            'turno' => $user['turno']
        ];
    }, $users);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($profiles),
        'profiles' => $profiles
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener la lista de perfiles desde MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
