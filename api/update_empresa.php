<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT ACTUALIZACIÓN DATOS EMPRESA & TASA BCV (UPDATE_EMPRESA.PHP)
   Soporta actualizaciones completas y parciales de modo de tasa cambiaria
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
    $stmtCur = $pdo->query("SELECT nombre, rif, direccion, telefono, modo_tasa, tasa_manual FROM configuracion_empresa WHERE id = 1 LIMIT 1");
    $currentConfig = $stmtCur->fetch(PDO::FETCH_ASSOC) ?: [
        'nombre' => 'La Nueva Parisienne C.A.',
        'rif' => 'J-40123456-7',
        'direccion' => 'Barquisimeto, Edo. Lara',
        'telefono' => '(0251) 555-1234',
        'modo_tasa' => 'auto',
        'tasa_manual' => 761.21
    ];

    $nombre = !empty($data['nombre']) ? trim($data['nombre']) : $currentConfig['nombre'];
    $rif = !empty($data['rif']) ? trim($data['rif']) : $currentConfig['rif'];
    $direccion = isset($data['direccion']) ? trim($data['direccion']) : $currentConfig['direccion'];
    $telefono = isset($data['telefono']) ? trim($data['telefono']) : $currentConfig['telefono'];
    $modoTasa = isset($data['modo_tasa']) ? strtolower(trim($data['modo_tasa'])) : $currentConfig['modo_tasa'];
    
    $tasaManual = $currentConfig['tasa_manual'];
    if (isset($data['tasa_manual'])) {
        $rawManual = str_replace(',', '.', (string)$data['tasa_manual']);
        if (is_numeric($rawManual) && floatval($rawManual) > 0) {
            $tasaManual = floatval($rawManual);
        }
    }

    $sql = "INSERT INTO configuracion_empresa (id, nombre, rif, direccion, telefono, modo_tasa, tasa_manual) 
            VALUES (1, :nombre, :rif, :direccion, :telefono, :modo_tasa, :tasa_manual)
            ON DUPLICATE KEY UPDATE 
                nombre = VALUES(nombre),
                rif = VALUES(rif),
                direccion = VALUES(direccion),
                telefono = VALUES(telefono),
                modo_tasa = VALUES(modo_tasa),
                tasa_manual = VALUES(tasa_manual)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':rif' => $rif,
        ':direccion' => $direccion,
        ':telefono' => $telefono,
        ':modo_tasa' => $modoTasa,
        ':tasa_manual' => $tasaManual
    ]);

    // Actualizar tabla auxiliar de configuraciones si existe
    try {
        $pdo->exec("INSERT INTO configuraciones (clave, valor) VALUES ('bcv_rate_mode', '$modoTasa'), ('bcv_manual_rate', '$tasaManual') ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
    } catch (Exception $ex) {}

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
