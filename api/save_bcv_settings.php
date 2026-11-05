<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - PERSISTENCIA DE CONFIGURACIÓN TASA BCV
   Guarda el modo ('auto' | 'manual') y el valor de tasa manual en MySQL
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

define('LNP_PUBLIC', true);
require_once __DIR__ . '/config/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Cuerpo JSON inválido.']);
    exit();
}

$mode = isset($input['mode']) && in_array(strtolower($input['mode']), ['auto', 'manual']) ? strtolower($input['mode']) : 'auto';

if ($mode === 'manual') {
    if (!isset($input['manualRate']) || !is_numeric($input['manualRate']) || floatval($input['manualRate']) <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Para el modo manual se requiere ingresar una tasa de cambio numérica y superior a cero.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $manualRate = floatval($input['manualRate']);
} else {
    $manualRate = isset($input['manualRate']) && is_numeric($input['manualRate']) && floatval($input['manualRate']) > 0 
        ? floatval($input['manualRate']) 
        : 761.21;
}

try {
    $pdo = getDbConnection();
    
    $stmtOld = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $oldConfig = $stmtOld->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
    $oldMode = $oldConfig['bcv_rate_mode'] ?? 'auto';
    $oldRate = $oldConfig['bcv_manual_rate'] ?? 'no establecida';

    $stmt = $pdo->prepare("
        INSERT INTO configuraciones (clave, valor, descripcion) 
        VALUES ('bcv_rate_mode', :mode, 'Modo de obtención de la tasa BCV: auto o manual')
        ON DUPLICATE KEY UPDATE valor = :mode
    ");
    $stmt->execute([':mode' => $mode]);

    $stmt2 = $pdo->prepare("
        INSERT INTO configuraciones (clave, valor, descripcion) 
        VALUES ('bcv_manual_rate', :rate, 'Valor de la tasa de cambio ingresado manualmente')
        ON DUPLICATE KEY UPDATE valor = :rate
    ");
    $stmt2->execute([':rate' => strval($manualRate)]);

    log_bitacora(
        modulo: 'CONFIGURACION',
        accion: 'CAMBIO_TASABCV',
        descripcion: "Actualización de tasa cambiaria: modo {$oldMode} -> {$mode}, valor {$oldRate} -> {$manualRate} Bs./$",
        severidad: ($mode === 'manual' ? 'WARNING' : 'INFO'),
        datosPrevios: ['modo' => $oldMode, 'tasa' => $oldRate],
        datosNuevos: ['modo' => $mode, 'tasa' => $manualRate]
    );

    echo json_encode([
        'success' => true,
        'message' => 'Configuración de tasa de cambio guardada exitosamente en MySQL.',
        'mode' => $mode,
        'manualRate' => $manualRate
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar la configuración en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
