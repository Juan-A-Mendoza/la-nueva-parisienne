<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CONSUMO DE MATERIA PRIMA POR LOTE (CONSUMIR_MATERIA_PRIMA_LOTE.PHP)
   Descuenta insumos reales al amasar un lote desde el Recetario de Producción
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

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$recipeCode = trim($data['recipeCode'] ?? $data['codigo_receta'] ?? '');
$recipeName = trim($data['recipeName'] ?? $data['nombre_receta'] ?? 'Lote Panadería');
$batchCode = trim($data['batchCode'] ?? ('LOTE-' . date('Ymd-His')));
$units = (int)($data['units'] ?? 50);
$ingredients = $data['ingredients'] ?? [];
$bakingTemp = (int)($data['bakingTemp'] ?? 200);
$bakingTimeMin = (int)($data['bakingTimeMin'] ?? 20);

if ($units <= 0 || empty($ingredients)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Parámetros inválidos. Se requiere receta, unidades mayor a cero e ingredientes.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // 1. Verificar disponibilidad de todas las materias primas
    $missing = [];
    $deductions = [];

    foreach ($ingredients as $ing) {
        $matCode = trim($ing['matCode'] ?? '');
        $name = trim($ing['name'] ?? '');
        $qtyNeeded = (float)($ing['qtyNeeded'] ?? $ing['qty'] ?? 0);

        if (empty($matCode) && empty($name)) continue;

        // Buscar en materias_primas
        $stmtMat = $pdo->prepare("SELECT id, codigo, nombre, stock_actual, unidad_medida FROM materias_primas WHERE codigo = :code OR nombre = :name LIMIT 1");
        $stmtMat->execute([':code' => $matCode, ':name' => $name]);
        $matRow = $stmtMat->fetch();

        if ($matRow) {
            $currentStock = (float)$matRow['stock_actual'];
            if ($currentStock < $qtyNeeded) {
                $missing[] = [
                    'matCode' => $matRow['codigo'],
                    'name' => $matRow['nombre'],
                    'required' => $qtyNeeded,
                    'available' => $currentStock,
                    'unit' => $matRow['unidad_medida'],
                    'deficit' => round($qtyNeeded - $currentStock, 2)
                ];
            } else {
                $deductions[] = [
                    'id' => $matRow['id'],
                    'code' => $matRow['codigo'],
                    'name' => $matRow['nombre'],
                    'currentStock' => $currentStock,
                    'qtyNeeded' => $qtyNeeded,
                    'newStock' => round($currentStock - $qtyNeeded, 3),
                    'unit' => $matRow['unidad_medida']
                ];
            }
        }
    }

    if (!empty($missing)) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'code' => 'INSUFFICIENT_STOCK',
            'message' => 'Stock insuficiente de materias primas para amasar este lote.',
            'missing' => $missing
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 2. Aplicar deducción de inventario en `materias_primas`
    $stmtUpdMat = $pdo->prepare("UPDATE materias_primas SET stock_actual = :newStock WHERE id = :id");
    foreach ($deductions as $d) {
        $stmtUpdMat->execute([':newStock' => $d['newStock'], ':id' => $d['id']]);
    }

    // 3. Crear el lote en `lotes_produccion`
    $batchId = 'batch_' . time() . '_' . rand(100, 999);
    $stmtInsLote = $pdo->prepare("INSERT INTO lotes_produccion (id, codigo, producto, icono, cantidad, estado_leudado, temperatura_recomendada, tiempo_recomendado_min) VALUES (:id, :code, :prod, 'croissant', :qty, 'En Reposo / Fermentación', :temp, :timeMin)");
    $stmtInsLote->execute([
        ':id' => $batchId,
        ':code' => $batchCode,
        ':prod' => $recipeName,
        ':qty' => $units,
        ':temp' => $bakingTemp,
        ':timeMin' => $bakingTimeMin
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Lote '{$batchCode}' amasado con éxito. Se descontaron los insumos de almacén.",
        'batch' => [
            'id' => $batchId,
            'code' => $batchCode,
            'recipeName' => $recipeName,
            'recipeCode' => $recipeCode,
            'units' => $units,
            'prepStatus' => 'En Reposo / Fermentación',
            'recommendedTemp' => $bakingTemp,
            'recommendedTimeMin' => $bakingTimeMin,
            'createdAt' => date('Y-m-d H:i:s')
        ],
        'deductions' => $deductions
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consumir materias primas en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
