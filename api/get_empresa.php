<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA DATOS EMPRESA (GET_EMPRESA.PHP)
   Retorna los datos fiscales principales de la empresa en JSON
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
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

    // 1. Obtener datos fiscales de la empresa
    $stmt = $pdo->query("SELECT nombre, rif, direccion, telefono FROM configuracion_empresa WHERE id = 1 LIMIT 1");
    $empresaRow = $stmt->fetch();

    // 2. Obtener configuración cambiaria de la tabla configuraciones (2FN)
    $stmtConf = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $confPairs = $stmtConf->fetchAll(PDO::FETCH_KEY_PAIR);

    $modoTasa = $confPairs['bcv_rate_mode'] ?? 'auto';
    $tasaManual = isset($confPairs['bcv_manual_rate']) ? floatval(str_replace(',', '.', $confPairs['bcv_manual_rate'])) : 761.21;

    $empresa = [
        'nombre' => $empresaRow['nombre'] ?? $defaultEmpresa['nombre'],
        'rif' => $empresaRow['rif'] ?? $defaultEmpresa['rif'],
        'direccion' => $empresaRow['direccion'] ?? $defaultEmpresa['direccion'],
        'telefono' => $empresaRow['telefono'] ?? $defaultEmpresa['telefono'],
        'modo_tasa' => $modoTasa,
        'tasa_manual' => $tasaManual > 0 ? $tasaManual : 761.21
    ];

    echo json_encode([
        'success' => true,
        'empresa' => $empresa
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode([
        'success' => true,
        'empresa' => $defaultEmpresa,
        'warning' => 'Cargando datos por defecto: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
