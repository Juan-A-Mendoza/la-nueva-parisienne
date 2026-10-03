<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API CONSULTA DE PRODUCTOS Y CATEGORÍAS POS
   Retorna el catálogo de productos terminados y categorías desde MySQL en JSON
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

try {
    $pdo = getDbConnection();

    // 1. Mapa de íconos pulcros (Lucide) para categorías de la barra de navegación
    $categoryIcons = [
        'todos' => 'sparkles',
        'cat_panaderia' => 'croissant',
        'cat_pasteleria' => 'cake',
        'cat_cafeteria' => 'coffee',
        'cat_especialidades' => 'utensils'
    ];

    // Emojis/imágenes visuales canónicas para cada producto de panadería y repostería
    $defaultProductEmojis = [
        'PAN-001' => '🥖',
        'PAN-002' => '🥐',
        'PAN-003' => '🍫',
        'PAN-004' => '🍞',
        'PAN-005' => '🫓',
        'PAS-001' => '⚡',
        'PAS-002' => '🍋',
        'PAS-003' => '🍡',
        'PAS-004' => '🍰',
        'BEB-001' => '☕',
        'BEB-002' => '🥛',
        'BEB-003' => '☕',
        'BEB-004' => '🍊',
        'ESP-001' => '🥪',
        'ESP-002' => '🥧'
    ];

    // 2. Consulta de Categorías desde MySQL
    $stmtCat = $pdo->query("SELECT id, nombre AS name, descripcion FROM categorias_producto ORDER BY id ASC");
    $categoriesRaw = $stmtCat->fetchAll();

    $categoriesList = [
        ['id' => 'todos', 'name' => 'Todos los Productos', 'icon' => 'sparkles']
    ];

    foreach ($categoriesRaw as $c) {
        $catKey = str_replace('cat_', '', $c['id']);
        $icon = isset($categoryIcons[$c['id']]) ? $categoryIcons[$c['id']] : 'croissant';
        $categoriesList[] = [
            'id' => $catKey,
            'name' => $c['name'],
            'icon' => $icon
        ];
    }

    // 3. Consulta de Productos Terminados / POS desde MySQL
    $sqlProd = "SELECT p.id, p.codigo AS code, p.nombre AS name, p.precio_unitario AS price, 
                       p.stock_actual AS stock, p.icono AS icon, p.descripcion AS description, 
                       c.id AS category_id, c.nombre AS category_name
                FROM productos p 
                INNER JOIN categorias_producto c ON p.categoria_id = c.id 
                ORDER BY p.codigo ASC";

    $stmtProd = $pdo->query($sqlProd);
    $productsRaw = $stmtProd->fetchAll();

    $productsList = array_map(function($p) use ($defaultProductEmojis) {
        $catSlug = str_replace('cat_', '', $p['category_id']);
        $rawIcon = $p['icon'] ?? '';
        $icon = $rawIcon;
        // Si el ícono en BD es genérico de Lucide o está vacío, restituir el emoji representativo del producto
        if (empty($icon) || in_array($icon, ['croissant', 'sparkles', 'cake', 'coffee', 'utensils', 'glass-water', 'wheat', 'milk', 'shopping-bag'])) {
            $icon = $defaultProductEmojis[$p['code']] ?? ($rawIcon ?: '🥖');
        }

        return [
            'id' => $p['id'],
            'code' => $p['code'],
            'name' => $p['name'],
            'category' => $catSlug,
            'price' => (float)$p['price'],
            'stock' => (int)$p['stock'],
            'icon' => $icon,
            'description' => $p['description'] ? $p['description'] : 'Producto fresco horneado el día de hoy.'
        ];
    }, $productsRaw);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($productsList),
        'categories' => $categoriesList,
        'products' => $productsList
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener catálogo de productos desde MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
