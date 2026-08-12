<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT ACTUALIZACIÓN DATOS EMPRESA (UPDATE_EMPRESA.PHP)
   Recibe los campos fiscales desde el Módulo 9 y actualiza la base de datos
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

$nombre = isset($data['nombre']) ? trim($data['nombre']) : '';
$rif = isset($data['rif']) ? trim($data['rif']) : '';
$direccion = isset($data['direccion']) ? trim($data['direccion']) : '';
$telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
$modoTasa = isset($data['modo_tasa']) ? strtolower(trim($data['modo_tasa'])) : 'auto';
$tasaManual = isset($data['tasa_manual']) && is_numeric($data['tasa_manual']) ? floatval($data['tasa_manual']) : 761.21;

if (empty($nombre) || empty($rif)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'El nombre y el RIF de la empresa son requeridos.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    require_once __DIR__ . '/config/conexion.php';
    $pdo = getDbConnection();

    // Intentar actualizar la fila con ID 1 o insertarla si no existe
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

    // También actualizar tabla auxiliar de configuraciones si existe
    try {
        $pdo->exec("INSERT INTO configuraciones (clave, valor) VALUES ('bcv_rate_mode', '$modoTasa'), ('bcv_manual_rate', '$tasaManual') ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
    } catch (Exception $ex) {}

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Datos fiscales y configuración de tasa cambiaria actualizados en MySQL.',
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
        'message' => 'Error al guardar los datos en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
