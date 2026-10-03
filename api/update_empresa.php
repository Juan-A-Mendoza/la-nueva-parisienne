<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT ACTUALIZACIÓN DATOS EMPRESA & TASA BCV (UPDATE_EMPRESA.PHP)
   Soporta actualizaciones completas y parciales de modo de tasa cambiaria
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Datos JSON no válidos o vacíos.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    require_once __DIR__ . '/config/conexion.php';
    $pdo = getDbConnection();

    // Obtener valores actuales de la base de datos
    $stmtCur = $pdo->query("SELECT nombre, rif, direccion, telefono FROM configuracion_empresa WHERE id = 1 LIMIT 1");
    $currentEmpresa = $stmtCur->fetch(PDO::FETCH_ASSOC) ?: [
        'nombre' => 'La Nueva Parisienne C.A.',
        'rif' => 'J-40123456-7',
        'direccion' => 'Barquisimeto, Edo. Lara',
        'telefono' => '(0251) 555-1234'
    ];

    $stmtConf = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $confPairs = $stmtConf->fetchAll(PDO::FETCH_KEY_PAIR);

    $nombre = !empty($data['nombre']) ? trim($data['nombre']) : $currentEmpresa['nombre'];
    $rif = !empty($data['rif']) ? trim($data['rif']) : $currentEmpresa['rif'];
    $direccion = isset($data['direccion']) ? trim($data['direccion']) : $currentEmpresa['direccion'];
    $telefono = isset($data['telefono']) ? trim($data['telefono']) : $currentEmpresa['telefono'];
    $modoTasa = isset($data['modo_tasa']) ? strtolower(trim($data['modo_tasa'])) : ($confPairs['bcv_rate_mode'] ?? 'auto');
    
    $tasaManual = isset($confPairs['bcv_manual_rate']) ? floatval(str_replace(',', '.', $confPairs['bcv_manual_rate'])) : 761.21;
    if (isset($data['tasa_manual'])) {
        $rawManual = str_replace(',', '.', (string)$data['tasa_manual']);
        if (is_numeric($rawManual) && floatval($rawManual) > 0) {
            $tasaManual = floatval($rawManual);
        }
    }

    // 1. Guardar datos fiscales en configuracion_empresa (2FN)
    $sql = "INSERT INTO configuracion_empresa (id, nombre, rif, direccion, telefono) 
            VALUES (1, :nombre, :rif, :direccion, :telefono)
            ON DUPLICATE KEY UPDATE 
                nombre = VALUES(nombre),
                rif = VALUES(rif),
                direccion = VALUES(direccion),
                telefono = VALUES(telefono)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':rif' => $rif,
        ':direccion' => $direccion,
        ':telefono' => $telefono
    ]);

    // 2. Guardar configuración de tasa de forma segura con prepared statement
    $stmtRate = $pdo->prepare("
        INSERT INTO configuraciones (clave, valor) 
        VALUES ('bcv_rate_mode', :mode), ('bcv_manual_rate', :rate) 
        ON DUPLICATE KEY UPDATE valor = VALUES(valor)
    ");
    $stmtRate->execute([
        ':mode' => $modoTasa,
        ':rate' => strval($tasaManual)
    ]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Configuración cambiaria y datos de empresa actualizados con éxito en MySQL.',
        'empresa' => [
            'nombre' => $nombre,
            'rif' => $rif,
            'direccion' => $direccion,
            'telefono' => $telefono,
            'modo_tasa' => $modoTasa,
            'tasa_manual' => $tasaManual
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
