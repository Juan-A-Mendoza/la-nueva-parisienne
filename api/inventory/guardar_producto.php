<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CREAR / EDITAR PRODUCTO TERMINADO (GUARDAR_PRODUCTO.PHP)
   Persistencia directa en MySQL (tabla `productos`)
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
$categoria = trim($data['category'] ?? $data['categoria'] ?? 'cat_panaderia');
$unidad = trim($data['unit'] ?? $data['unidad'] ?? 'Und');
$precio = (float)($data['price'] ?? $data['salePrice'] ?? $data['precio_unitario'] ?? 0);
$stock = (float)($data['stock'] ?? $data['stock_actual'] ?? 0);
$minStock = (float)($data['minStock'] ?? $data['stock_minimo'] ?? 10);
$icono = trim($data['icon'] ?? $data['icono'] ?? 'package');

if (empty($nombre) || $precio <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere el nombre del producto y un precio de venta mayor a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Si viene código, verificar si ya existe
    $existing = null;
    if (!empty($codigo)) {
        $stmtChk = $pdo->prepare("SELECT id, codigo FROM productos WHERE codigo = :code LIMIT 1");
        $stmtChk->execute([':code' => $codigo]);
        $existing = $stmtChk->fetch(PDO::FETCH_ASSOC);
    }

    if ($existing) {
        // Actualizar
        $stmtUpd = $pdo->prepare("
            UPDATE productos 
            SET nombre = :nombre, 
                categoria_id = :cat, 
                unidad_medida = :um, 
                precio_unitario = :precio, 
                stock_actual = :stock, 
                stock_minimo = :min_stock,
                icono = :icono
            WHERE id = :id
        ");
        $stmtUpd->execute([
            ':nombre' => $nombre,
            ':cat' => $categoria,
            ':um' => $unidad,
            ':precio' => $precio,
            ':stock' => $stock,
            ':min_stock' => $minStock,
            ':icono' => $icono,
            ':id' => $existing['id']
        ]);

        echo json_encode([
            'success' => true,
            'action' => 'updated',
            'message' => "Producto '{$nombre}' actualizado con éxito.",
            'item' => [
                'id' => $existing['id'],
                'code' => $existing['codigo'],
                'name' => $nombre,
                'category' => $categoria,
                'price' => $precio,
                'stock' => $stock,
                'minStock' => $minStock,
                'unit' => $unidad,
                'icon' => $icono
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // Generar código si no viene
        if (empty($codigo)) {
            $count = (int)$pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
            $codigo = 'PROD-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        }

        $newId = 'prod_' . time() . '_' . rand(100, 999);
        $stmtIns = $pdo->prepare("
            INSERT INTO productos 
                (id, codigo, categoria_id, nombre, unidad_medida, stock_actual, stock_minimo, precio_unitario, tipo, icono) 
            VALUES 
                (:id, :codigo, :cat, :nombre, :um, :stock, :min_stock, :precio, 'finished_good', :icono)
        ");
        $stmtIns->execute([
            ':id' => $newId,
            ':codigo' => $codigo,
            ':cat' => $categoria,
            ':nombre' => $nombre,
            ':um' => $unidad,
            ':stock' => $stock,
            ':min_stock' => $minStock,
            ':precio' => $precio,
            ':icono' => $icono
        ]);

        echo json_encode([
            'success' => true,
            'action' => 'created',
            'message' => "Producto '{$nombre}' registrado con éxito en el catálogo.",
            'item' => [
                'id' => $newId,
                'code' => $codigo,
                'name' => $nombre,
                'category' => $categoria,
                'price' => $precio,
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
        'message' => 'Error al guardar producto en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
