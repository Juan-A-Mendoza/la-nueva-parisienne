<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA ESTADO DE COCINA (GET_ESTADO_COCINA.PHP)
   Consulta y retorna en formato JSON el estado de hornos y lotes de producción
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Datos por defecto (fallback seguro en caso de BD no inicializada)
$defaultOvens = [
    [
        'id' => 'oven_01',
        'name' => 'Horno 1 (Giratorio A)',
        'type' => 'Giratorio Industrial',
        'currentTemp' => 220,
        'targetTemp' => 220,
        'status' => 'baking',
        'batch' => [
            'id' => 'batch_042',
            'productName' => 'Baguette Tradicional Parisina',
            'icon' => '🥖',
            'units' => 50,
            'totalTimeSeconds' => 1200,
            'remainingSeconds' => 255
        ]
    ],
    [
        'id' => 'oven_02',
        'name' => 'Horno 2 (Convección B)',
        'type' => 'Convección Fina',
        'currentTemp' => 190,
        'targetTemp' => 190,
        'status' => 'baking',
        'batch' => [
            'id' => 'batch_043',
            'productName' => 'Croissant de Mantequilla',
            'icon' => '🥐',
            'units' => 60,
            'totalTimeSeconds' => 900,
            'remainingSeconds' => 760
        ]
    ],
    [
        'id' => 'oven_03',
        'name' => 'Horno 3 (Piedra C)',
        'type' => 'Bóveda de Piedra',
        'currentTemp' => 240,
        'targetTemp' => 240,
        'status' => 'ready',
        'batch' => [
            'id' => 'batch_044',
            'productName' => 'Focaccia de Romero y Aceitunas',
            'icon' => '🫓',
            'units' => 20,
            'totalTimeSeconds' => 1500,
            'remainingSeconds' => 0
        ]
    ],
    [
        'id' => 'oven_04',
        'name' => 'Horno 4 (Pastelero D)',
        'type' => 'Convección Digital',
        'currentTemp' => 160,
        'targetTemp' => 175,
        'status' => 'preheating',
        'batch' => null
    ]
];

$defaultStagingBatches = [
    [
        'id' => 'stage_045',
        'code' => 'Lote #045',
        'productName' => 'Pain au Chocolat',
        'icon' => '🍫',
        'units' => 40,
        'prepStatus' => 'Leudado Completo (100%)',
        'recommendedTemp' => 190,
        'recommendedTimeMin' => 15
    ],
    [
        'id' => 'stage_046',
        'code' => 'Lote #046',
        'productName' => 'Brioche de Vainilla',
        'icon' => '🍞',
        'units' => 25,
        'prepStatus' => 'Barnizado con Huevo Listo',
        'recommendedTemp' => 180,
        'recommendedTimeMin' => 22
    ],
    [
        'id' => 'stage_047',
        'code' => 'Lote #047',
        'productName' => 'Masa de Éclairs (Choux)',
        'icon' => '⚡',
        'units' => 35,
        'prepStatus' => 'Reposo en Bandeja (15 min)',
        'recommendedTemp' => 200,
        'recommendedTimeMin' => 18
    ]
];

try {
    require_once __DIR__ . '/config/conexion.php';
    $pdo = getDbConnection();

    // 1. Consultar Hornos con su Lote asignado
    $queryHornos = "
        SELECT 
            h.id AS oven_id,
            h.nombre AS oven_name,
            h.tipo AS oven_type,
            h.temperatura_actual,
            h.temperatura_objetivo,
            h.tiempo_restante,
            h.tiempo_total,
            h.estado AS oven_status,
            l.id AS batch_id,
            l.producto AS batch_product,
            l.icono AS batch_icon,
            l.cantidad AS batch_units
        FROM estado_hornos h
        LEFT JOIN lotes_produccion l ON h.lote_id = l.id
        ORDER BY h.id ASC
    ";
    
    $stmtHornos = $pdo->query($queryHornos);
    $dbHornos = $stmtHornos->fetchAll();

    $hornos = [];
    if (!empty($dbHornos)) {
        foreach ($dbHornos as $row) {
            $batch = null;
            if (!empty($row['batch_id'])) {
                $batch = [
                    'id' => $row['batch_id'],
                    'productName' => $row['batch_product'],
                    'icon' => $row['batch_icon'] ?? '🥐',
                    'units' => intval($row['batch_units']),
                    'totalTimeSeconds' => intval($row['tiempo_total']),
                    'remainingSeconds' => intval($row['tiempo_restante'])
                ];
            }

            $hornos[] = [
                'id' => $row['oven_id'],
                'name' => $row['oven_name'],
                'type' => $row['oven_type'],
                'currentTemp' => intval($row['temperatura_actual']),
                'targetTemp' => intval($row['temperatura_objetivo']),
                'status' => $row['oven_status'],
                'batch' => $batch
            ];
        }
    } else {
        $hornos = $defaultOvens;
    }

    // 2. Consultar Lotes en Staging (no asignados a horno o listos para horneado)
    $queryLotes = "
        SELECT 
            id,
            codigo,
            producto,
            icono,
            cantidad,
            estado_leudado,
            temperatura_recomendada,
            tiempo_recomendado_min
        FROM lotes_produccion
        WHERE id NOT IN (SELECT lote_id FROM estado_hornos WHERE lote_id IS NOT NULL)
        ORDER BY creado_en ASC
    ";
    
    $stmtLotes = $pdo->query($queryLotes);
    $dbLotes = $stmtLotes->fetchAll();

    $lotesStaging = [];
    if (!empty($dbLotes)) {
        foreach ($dbLotes as $r) {
            $lotesStaging[] = [
                'id' => $r['id'],
                'code' => $r['codigo'],
                'productName' => $r['producto'],
                'icon' => $r['icono'] ?? '🍞',
                'units' => intval($r['cantidad']),
                'prepStatus' => $r['estado_leudado'],
                'recommendedTemp' => intval($r['temperatura_recomendada']),
                'recommendedTimeMin' => intval($r['tiempo_recomendado_min'])
            ];
        }
    } else {
        $lotesStaging = $defaultStagingBatches;
    }

    echo json_encode([
        'success' => true,
        'hornos' => $hornos,
        'lotes_staging' => $lotesStaging
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => true,
        'hornos' => $defaultOvens,
        'lotes_staging' => $defaultStagingBatches,
        'warning' => 'Respondiendo con datos por defecto: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
