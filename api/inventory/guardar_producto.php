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
require_once __DIR__ . '/../config/validator.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$rawNombre = trim($data['name'] ?? $data['nombre'] ?? '');
$rawCodigo = trim($data['code'] ?? $data['codigo'] ?? '');
$categoria = trim($data['category'] ?? $data['categoria'] ?? 'cat_panaderia');
$unidad = trim($data['unit'] ?? $data['unidad'] ?? 'Und');
$precio = (float)($data['price'] ?? $data['salePrice'] ?? $data['precio_unitario'] ?? 0);
$stock = max(0.0, (float)($data['stock'] ?? $data['stock_actual'] ?? 0));
$minStock = max(0.0, (float)($data['minStock'] ?? $data['stock_minimo'] ?? 10));
$icono = trim($data['icon'] ?? $data['icono'] ?? 'package');

$nombreCheck = validate_string($rawNombre, 100, false);
if (!$nombreCheck['valid']) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Nombre de producto inválido: ' . $nombreCheck['error']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
$nombre = $nombreCheck['value'];

$codigoCheck = validate_string($rawCodigo, 50, true);
$codigo = $codigoCheck['value'];

if ($precio <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'El precio de venta del producto debe ser estrictamente superior a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Si viene código, verificar si ya existe
    $existing = null;
    if (!empty($codigo)) {
        $stmtChk = $pdo->prepare("SELECT id, codigo, nombre, categoria_id, unidad_medida, precio_unitario, stock_actual, stock_minimo FROM productos WHERE codigo = :code LIMIT 1");
        $stmtChk->execute([':code' => $codigo]);
        $existing = $stmtChk->fetch(PDO::FETCH_ASSOC);
    }

    if ($existing) {
        $oldPrice = (float)$existing['precio_unitario'];
        $oldStock = (float)$existing['stock_actual'];
        $priceChanged = (abs($oldPrice - $precio) > 0.001);

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

        $accion = $priceChanged ? 'CAMBIO_PRECIO_PRODUCTO' : 'ACTUALIZAR_PRODUCTO';
        $severidad = $priceChanged ? 'WARNING' : 'INFO';
        $desc = $priceChanged 
            ? "Modificación de precio de venta en '{$nombre}' ({$existing['codigo']}): \${$oldPrice} -> \${$precio}"
            : "Actualización de producto '{$nombre}' ({$existing['codigo']}) en catálogo.";

        log_bitacora(
            modulo: 'INVENTARIO',
            accion: $accion,
            descripcion: $desc,
            severidad: $severidad,
            datosPrevios: [
                'id' => $existing['id'],
                'codigo' => $existing['codigo'],
                'nombre' => $existing['nombre'],
                'precio_anterior' => $oldPrice,
                'stock_anterior' => $oldStock,
                'stock_minimo' => (float)$existing['stock_minimo']
            ],
            datosNuevos: [
                'nombre' => $nombre,
                'precio_nuevo' => $precio,
                'stock_nuevo' => $stock,
                'stock_minimo' => $minStock,
                'unidad' => $unidad
            ]
        );

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

        log_bitacora(
            modulo: 'INVENTARIO',
            accion: 'CREAR_PRODUCTO',
            descripcion: "Nuevo producto '{$nombre}' ({$codigo}) creado con precio de venta \${$precio} y stock inicial {$stock} {$unidad}",
            severidad: 'INFO',
            datosPrevios: null,
            datosNuevos: [
                'id' => $newId,
                'codigo' => $codigo,
                'nombre' => $nombre,
                'precio_nuevo' => $precio,
                'stock_nuevo' => $stock,
                'stock_minimo' => $minStock,
                'categoria' => $categoria,
                'unidad' => $unidad
            ]
        );

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
