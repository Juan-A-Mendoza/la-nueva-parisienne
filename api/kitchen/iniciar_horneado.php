<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - INICIAR HORNEADO (INICIAR_HORNEADO.PHP)
   Asigna un lote a un horno disponible y lo pone en estado 'baking' en MySQL
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

$ovenId = trim($data['ovenId'] ?? '');
$batchId = trim($data['batchId'] ?? '');
$productName = trim($data['productName'] ?? 'Lote Activo');
$productCode = trim($data['productCode'] ?? $data['codigo_producto'] ?? '');
$temp = (int)($data['temp'] ?? 200);
$timeMin = (int)($data['timeMin'] ?? 15);
$units = (int)($data['units'] ?? 50);

if (empty($ovenId)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el identificador del horno.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // 1. Verificar si el horno está disponible
    $stmtCheck = $pdo->prepare("SELECT id, nombre, estado FROM estado_hornos WHERE id = :id");
    $stmtCheck->execute([':id' => $ovenId]);
    $oven = $stmtCheck->fetch();

    if (!$oven) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Horno no encontrado.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($oven['estado'] === 'baking' || $oven['estado'] === 'ready') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "El {$oven['nombre']} ya se encuentra en uso activo."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $timeSeconds = $timeMin * 60;

    // 2. Si no viene lote_id, o viene temporal, crear o enlazar en lotes_produccion
    if (empty($batchId) || strpos($batchId, 'batch_') === false) {
        $batchId = 'batch_' . time() . '_' . rand(100, 999);
        $stmtInsLote = $pdo->prepare("INSERT INTO lotes_produccion (id, codigo, producto, codigo_producto, icono, cantidad, estado_leudado, temperatura_recomendada, tiempo_recomendado_min) VALUES (:id, :code, :prod, :pcode, 'croissant', :qty, 'En Horneado Activo', :temp, :timeMin)");
        $stmtInsLote->execute([
            ':id' => $batchId,
            ':code' => 'LOTE-' . date('His'),
            ':prod' => $productName,
            ':pcode' => $productCode,
            ':qty' => $units,
            ':temp' => $temp,
            ':timeMin' => $timeMin
        ]);
    } else {
        // Actualizar el lote existente a En Horneado y asignar codigo_producto si no lo tenía
        $stmtUpdLote = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'En Horneado Activo', codigo_producto = COALESCE(NULLIF(:pcode, ''), codigo_producto) WHERE id = :id");
        $stmtUpdLote->execute([':id' => $batchId, ':pcode' => $productCode]);
    }

    // 3. Actualizar estado_hornos en MySQL con marcas de tiempo reales
    $stmtUpdOven = $pdo->prepare("
        UPDATE estado_hornos 
        SET estado = 'baking', 
            temperatura_actual = :temp, 
            temperatura_objetivo = :targetTemp, 
            tiempo_restante = :remaining, 
            tiempo_total = :total, 
            lote_id = :loteId,
            inicio_en = NOW(),
            fin_estimado = DATE_ADD(NOW(), INTERVAL :timeSeconds SECOND)
        WHERE id = :ovenId
    ");
    $stmtUpdOven->execute([
        ':temp' => $temp,
        ':targetTemp' => $temp,
        ':remaining' => $timeSeconds,
        ':total' => $timeSeconds,
        ':loteId' => $batchId,
        ':timeSeconds' => $timeSeconds,
        ':ovenId' => $ovenId
    ]);

    $nowTs = time();
    $endTs = $nowTs + $timeSeconds;

    echo json_encode([
        'success' => true,
        'message' => "El ciclo de horneado para '{$productName}' ha iniciado con éxito en {$oven['nombre']}.",
        'oven' => [
            'id' => $ovenId,
            'name' => $oven['nombre'],
            'status' => 'baking',
            'currentTemp' => $temp,
            'targetTemp' => $temp,
            'remainingSeconds' => $timeSeconds,
            'totalTimeSeconds' => $timeSeconds,
            'loteId' => $batchId,
            'productCode' => $productCode,
            'productName' => $productName,
            'units' => $units,
            'startTime' => date('c', $nowTs),
            'endTime' => date('c', $endTs)
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al iniciar horneado en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
