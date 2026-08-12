<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA DATOS EMPRESA (GET_EMPRESA.PHP)
   Retorna los datos fiscales principales de la empresa en JSON
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$defaultEmpresa = [
    'nombre' => 'La Nueva Parisienne Panadería & Pastelería C.A.',
    'rif' => 'J-40123456-7',
    'direccion' => 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara',
    'telefono' => '(0251) 555-1234',
    'modo_tasa' => 'auto',
    'tasa_manual' => 761.21
];

try {
    require_once __DIR__ . '/config/conexion.php';
    $pdo = getDbConnection();

    $stmt = $pdo->query("SELECT nombre, rif, direccion, telefono, modo_tasa, tasa_manual FROM configuracion_empresa WHERE id = 1 LIMIT 1");
    $empresa = $stmt->fetch();

    if ($empresa && !empty($empresa['nombre'])) {
        $empresa['tasa_manual'] = floatval($empresa['tasa_manual'] ?? 761.21);
        echo json_encode([
            'success' => true,
            'empresa' => $empresa
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => true,
            'empresa' => $defaultEmpresa
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => true,
        'empresa' => $defaultEmpresa,
        'warning' => 'Cargando datos por defecto: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
