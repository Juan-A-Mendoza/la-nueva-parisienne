<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ELIMINAR / DESACTIVAR EMPLEADO (ELIMINAR_EMPLEADO.PHP)
   Elimina o desactiva de forma segura un usuario en MySQL preservando integridad
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

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$id = trim($data['id'] ?? '');

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el identificador del usuario.'], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($id === 'usr_superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No está permitido eliminar al Super Administrador principal.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // 1. Verificar si el usuario existe
    $stmtCheck = $pdo->prepare("SELECT id, nombre, username FROM usuarios WHERE id = :id");
    $stmtCheck->execute([':id' => $id]);
    $user = $stmtCheck->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'El usuario especificado no existe en la base de datos.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 2. Verificar si tiene ventas o compras asociadas (Foreign Key check)
    $stmtVentas = $pdo->prepare("SELECT COUNT(*) FROM ventas WHERE usuario_id = :id");
    $stmtVentas->execute([':id' => $id]);
    $hasSales = (int)$stmtVentas->fetchColumn() > 0;

    if ($hasSales) {
        // Desactivación lógica (Soft delete)
        $stmtUpd = $pdo->prepare("UPDATE usuarios SET estado = 'inactive' WHERE id = :id");
        $stmtUpd->execute([':id' => $id]);
        $msg = "El usuario '{$user['nombre']}' tiene registros contables o ventas vinculadas. Su estado fue cambiado a Inactivo.";
    } else {
        // Eliminación física directa
        $stmtDel = $pdo->prepare("DELETE FROM usuarios WHERE id = :id");
        $stmtDel->execute([':id' => $id]);
        $msg = "El usuario '{$user['nombre']}' fue eliminado exitosamente del sistema.";
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $msg,
        'id' => $id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al procesar eliminación en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
