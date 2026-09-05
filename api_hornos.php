<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - API DE LECTURA DE HORNOS (API_HORNOS.PHP)
   Consulta el estado actual de los hornos desde la tabla `hornos` en MySQL
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Datos de respaldo en memoria si la BD aún no está poblada o durante pruebas locales
$defaultHornos = [
    [
        'id' => 'oven_01',
        'nombre_horno' => 'Horno 1 (Giratorio A)',
        'temperatura_actual' => 220,
        'tiempo_restante' => 255,
        'estado' => 'baking',
        'lote_actual' => 'Baguette Tradicional Parisina (50 ud)',
        'hora_inicio' => '2026-08-22 15:40:00'
    ],
    [
        'id' => 'oven_02',
        'nombre_horno' => 'Horno 2 (Convección B)',
        'temperatura_actual' => 190,
        'tiempo_restante' => 760,
        'estado' => 'baking',
        'lote_actual' => 'Croissant de Mantequilla (60 ud)',
        'hora_inicio' => '2026-08-22 15:45:00'
    ],
    [
        'id' => 'oven_03',
        'nombre_horno' => 'Horno 3 (Piedra C)',
        'temperatura_actual' => 240,
        'tiempo_restante' => 0,
        'estado' => 'ready',
        'lote_actual' => 'Focaccia de Romero y Aceitunas (20 ud)',
        'hora_inicio' => '2026-08-22 15:15:00'
    ],
    [
        'id' => 'oven_04',
        'nombre_horno' => 'Horno 4 (Pastelero D)',
        'temperatura_actual' => 160,
        'tiempo_restante' => 0,
        'estado' => 'preheating',
        'lote_actual' => null,
        'hora_inicio' => null
    ]
];

try {
    if (file_exists(__DIR__ . '/conexion.php')) {
        require_once __DIR__ . '/conexion.php';
    } elseif (file_exists(__DIR__ . '/../conexion.php')) {
        require_once __DIR__ . '/../conexion.php';
    } else {
        require_once __DIR__ . '/api/config/conexion.php';
    }

    $stmt = $pdo->query("SELECT h.id, h.nombre AS nombre_horno, h.temperatura_actual, h.tiempo_restante, h.estado, l.producto AS lote_actual FROM estado_hornos h LEFT JOIN lotes_produccion l ON h.lote_id = l.id ORDER BY h.id ASC");
    $dbHornos = $stmt->fetchAll();

    if (!empty($dbHornos)) {
        echo json_encode([
            'success' => true,
            'hornos' => $dbHornos
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => true,
            'hornos' => $defaultHornos
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => true,
        'hornos' => $defaultHornos,
        'warning' => 'Fallback datos de prueba: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
