<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA DE INVENTARIO COMPLETO (GET_INVENTORY.PHP)
   Retorna materias primas y productos terminados desde MySQL
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

try {
    $pdo = getDbConnection();

    $sql = "
        SELECT mp.id, mp.codigo AS code, mp.nombre AS name, 'raw_material' AS category,
               'Materias Primas' AS categoryName, mp.unidad_medida AS unit,
               mp.stock_actual AS currentStock, mp.stock_minimo AS minStock,
               mp.costo_unitario AS unitPrice, mp.ubicacion AS location,
               mp.icono AS icon, mp.descripcion AS description
        FROM materias_primas mp

        UNION ALL

        SELECT p.id, p.codigo AS code, p.nombre AS name, 'finished_product' AS category,
               c.nombre AS categoryName, p.unidad_medida AS unit,
               p.stock_actual AS currentStock, p.stock_minimo AS minStock,
               p.precio_unitario AS unitPrice, p.ubicacion AS location,
               p.icono AS icon, p.descripcion AS description
        FROM productos p
        INNER JOIN categorias_producto c ON p.categoria_id = c.id
        ORDER BY category ASC, code ASC
    ";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    $inventory = array_map(function($r) {
        $current = (float)$r['currentStock'];
        $min = (float)$r['minStock'];

        $status = 'optimal';
        if ($current <= ($min * 0.5)) {
            $status = 'critical';
        } elseif ($current <= $min) {
            $status = 'low_stock';
        }

        return [
            'id' => $r['id'],
            'code' => $r['code'],
            'name' => $r['name'],
            'category' => $r['category'],
            'categoryName' => $r['categoryName'],
            'unit' => $r['unit'],
            'currentStock' => $current,
            'minStock' => $min,
            'unitPrice' => (float)$r['unitPrice'],
            'status' => $status,
            'location' => $r['location'] ?: 'Almacén Principal',
            'icon' => $r['icon'] ?: 'package',
            'description' => $r['description'] ?: ''
        ];
    }, $rows);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($inventory),
        'inventory' => $inventory
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener inventario desde MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
