<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ELIMINAR ITEM DE INVENTARIO (ELIMINAR_ITEM.PHP)
   Eliminación controlada en MySQL para productos y materias primas
   ========================================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

// Verificación RBAC: Solo Administradores y Super Administradores pueden eliminar ítems
require_auth(['ADMIN', 'SUPERADMIN']);

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$id = trim($data['id'] ?? $data['code'] ?? $data['codigo'] ?? '');
$tipo = trim($data['type'] ?? $data['tipo'] ?? 'product');

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Identificador de ítem no especificado.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    $isRaw = ($tipo === 'raw_material' || $tipo === 'materia_prima' || str_starts_with($id, 'MAT-'));
    $targetTable = $isRaw ? 'materias_primas' : 'productos';

    $stmtInfo = $pdo->prepare("SELECT id, codigo, nombre, stock_actual FROM {$targetTable} WHERE id = :id OR codigo = :id2 LIMIT 1");
    $stmtInfo->execute([':id' => $id, ':id2' => $id]);
    $itemInfo = $stmtInfo->fetch() ?: ['id' => $id, 'codigo' => $id, 'nombre' => 'Desconocido', 'stock_actual' => 0];

    $stmt = $pdo->prepare("DELETE FROM {$targetTable} WHERE id = :id OR codigo = :id2");
    $stmt->execute([':id' => $id, ':id2' => $id]);

    log_bitacora(
        modulo: 'INVENTARIO',
        accion: 'ELIMINAR_ITEM',
        descripcion: "Eliminación definitiva de '{$itemInfo['nombre']}' ({$id}) de la tabla {$targetTable}",
        severidad: 'DANGER',
        datosPrevios: [
            'id' => $itemInfo['id'],
            'codigo' => $itemInfo['codigo'] ?? $id,
            'nombre' => $itemInfo['nombre'],
            'stock_al_eliminar' => $itemInfo['stock_actual'] ?? 0,
            'tabla' => $targetTable
        ],
        datosNuevos: [
            'accion' => 'REGISTRO_ELIMINADO'
        ]
    );

    echo json_encode([
        'success' => true,
        'message' => 'Ítem eliminado con éxito de la base de datos.',
        'deletedId' => $id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al eliminar ítem en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
