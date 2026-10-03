<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA DE PERSONAL (GET_STAFF.PHP)
   Retorna nómina de empleados y perfiles activos desde MySQL
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

    $sql = "
        SELECT u.id, u.codigo AS code, u.nombre AS name,
               r.nombre AS role, r.codigo AS roleCode,
               r.descripcion AS department,
               COALESCE(u.turno, 'Turno Completo') AS shift,
               u.telefono AS phone, u.email,
               u.estado AS status,
               u.icono AS avatar
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        ORDER BY u.codigo ASC
    ";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    $staff = array_map(function($r) {
        $isActive = ($r['status'] === 'active');
        return [
            'id' => $r['id'],
            'code' => $r['code'],
            'name' => $r['name'],
            'role' => $r['role'],
            'roleCode' => $r['roleCode'],
            'department' => $r['department'] ?: 'Operaciones',
            'shift' => $r['shift'],
            'phone' => $r['phone'] ?: 'N/A',
            'email' => $r['email'],
            'status' => $r['status'],
            'statusText' => $isActive ? 'Activo' : 'Inactivo',
            'avatar' => $r['avatar'] ?: 'user'
        ];
    }, $rows);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($staff),
        'staff' => $staff
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar personal desde MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
