<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CREAR / EDITAR MATERIA PRIMA (GUARDAR_MATERIA_PRIMA.PHP)
   Persistencia directa en MySQL (tabla `materias_primas`)
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

$nombre = trim($data['name'] ?? $data['nombre'] ?? '');
$codigo = trim($data['code'] ?? $data['codigo'] ?? '');
$unidad = trim($data['unit'] ?? $data['unidad'] ?? 'kg');
$costo = (float)($data['unitCost'] ?? $data['costo_unitario'] ?? 0);
$stock = (float)($data['stock'] ?? $data['stock_actual'] ?? 0);
$minStock = (float)($data['minStock'] ?? $data['stock_minimo'] ?? 10);
$icono = trim($data['icon'] ?? $data['icono'] ?? 'wheat');

if (empty($nombre) || $costo <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el nombre del insumo y un costo unitario mayor a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Si viene código, verificar si ya existe
    $existing = null;
    if (!empty($codigo)) {
        $stmtChk = $pdo->prepare("SELECT id, codigo FROM materias_primas WHERE codigo = :code LIMIT 1");
        $stmtChk->execute([':code' => $codigo]);
        $existing = $stmtChk->fetch(PDO::FETCH_ASSOC);
    }

    if ($existing) {
        // Actualizar
        $stmtUpd = $pdo->prepare("
            UPDATE materias_primas 
            SET nombre = :nombre, 
                unidad_medida = :um, 
                costo_unitario = :costo, 
                stock_actual = :stock, 
                stock_minimo = :min_stock,
                icono = :icono
            WHERE id = :id
        ");
        $stmtUpd->execute([
            ':nombre' => $nombre,
            ':um' => $unidad,
            ':costo' => $costo,
            ':stock' => $stock,
            ':min_stock' => $minStock,
            ':icono' => $icono,
            ':id' => $existing['id']
        ]);

        echo json_encode([
            'success' => true,
            'action' => 'updated',
            'message' => "Materia prima '{$nombre}' actualizada con éxito.",
            'item' => [
                'id' => $existing['id'],
                'code' => $existing['codigo'],
                'name' => $nombre,
                'unitCost' => $costo,
                'stock' => $stock,
                'minStock' => $minStock,
                'unit' => $unidad,
                'icon' => $icono
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // Generar código si no viene
        if (empty($codigo)) {
            $count = (int)$pdo->query("SELECT COUNT(*) FROM materias_primas")->fetchColumn();
            $codigo = 'MAT-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        }

        $newId = 'mat_' . time() . '_' . rand(100, 999);
        $stmtIns = $pdo->prepare("
            INSERT INTO materias_primas 
                (id, codigo, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario, ubicacion, icono) 
            VALUES 
                (:id, :codigo, :nombre, :um, :stock, :min_stock, :costo, 'Almacén Central', :icono)
        ");
        $stmtIns->execute([
            ':id' => $newId,
            ':codigo' => $codigo,
            ':nombre' => $nombre,
            ':um' => $unidad,
            ':stock' => $stock,
            ':min_stock' => $minStock,
            ':costo' => $costo,
            ':icono' => $icono
        ]);

        echo json_encode([
            'success' => true,
            'action' => 'created',
            'message' => "Materia prima '{$nombre}' registrada con éxito en el almacén.",
            'item' => [
                'id' => $newId,
                'code' => $codigo,
                'name' => $nombre,
                'unitCost' => $costo,
                'stock' => $stock,
                'minStock' => $minStock,
                'unit' => $unidad,
                'icon' => $icono
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar materia prima en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
