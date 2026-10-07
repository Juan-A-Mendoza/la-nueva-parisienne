<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - FORZAR / FINALIZAR HORNEADO (FORZAR_HORNEADO_LISTO.PHP)
   Permite al maestro panadero marcar un lote activo como "Horneado Listo"
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

$rawInput = preg_replace('/^\xEF\xBB\xBF/', '', file_get_contents('php://input'));
$data = json_decode($rawInput, true);
if (!$data) {
    $data = $_POST;
}

$ovenId = trim($data['ovenId'] ?? $data['horno_id'] ?? '');

if (empty($ovenId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el ID del horno.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    
    // Consultar horno
    $stmt = $pdo->prepare("SELECT id, nombre, estado, lote_id FROM estado_hornos WHERE id = :id");
    $stmt->execute([':id' => $ovenId]);
    $oven = $stmt->fetch();

    if (!$oven) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Horno no encontrado.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Actualizar estado a 'ready'
    $stmtUpd = $pdo->prepare("
        UPDATE estado_hornos 
        SET estado = 'ready', 
            tiempo_restante = 0, 
            fin_estimado = NOW() 
        WHERE id = :id
    ");
    $stmtUpd->execute([':id' => $ovenId]);

    if (!empty($oven['lote_id'])) {
        $stmtLote = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'Horneado Listo' WHERE id = :lid");
        $stmtLote->execute([':lid' => $oven['lote_id']]);
    }

    echo json_encode([
        'success' => true,
        'message' => "El {$oven['nombre']} ha sido marcado como ¡HORNEADO LISTO! Listo para descargar a vitrina.",
        'ovenId' => $ovenId,
        'status' => 'ready'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar horno: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
