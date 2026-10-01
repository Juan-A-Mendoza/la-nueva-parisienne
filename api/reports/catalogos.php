<?php
/* Catálogos de filtros para reportes. Solo lectura. */

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/report_helpers.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    reportJson(['success' => false, 'message' => 'Método no permitido.'], 405);
}

try {
    $pdo = getDbConnection();
    $input = reportInput();
    $actor = reportResolveActor($pdo, $input);
    $context = reportText($input['context'] ?? 'gerente', 'gerente');
    reportRequireContext($actor, $context);

    $cashiers = [];
    if ($context === 'gerente') {
        $stmt = $pdo->query(
            "SELECT u.id, u.nombre, COALESCE(r.codigo, '') AS role_code
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.estado = 'active' AND r.codigo IN ('POS', 'CASHIER')
             ORDER BY u.nombre ASC"
        );
        $cashiers = $stmt->fetchAll();
    }

    $categories = $pdo->query(
        "SELECT id, nombre AS name
         FROM categorias_producto
         WHERE id <> 'cat_insumos'
         ORDER BY nombre ASC"
    )->fetchAll();

    $products = $pdo->query(
        "SELECT p.id, p.nombre AS name, p.categoria_id
         FROM productos p
         WHERE p.tipo = 'finished_product'
         ORDER BY p.nombre ASC"
    )->fetchAll();

    $methods = $pdo->query(
        "SELECT DISTINCT metodo_pago AS value
         FROM ventas
         WHERE metodo_pago IS NOT NULL AND metodo_pago <> ''
         ORDER BY metodo_pago ASC"
    )->fetchAll();

    $shifts = $pdo->query(
        "SELECT DISTINCT turno AS value
         FROM usuarios
         WHERE turno IS NOT NULL AND turno <> ''
         ORDER BY turno ASC"
    )->fetchAll();

    reportAudit($pdo, 'DETALLE_VENTAS_COBROS', 'CONSULTA', $actor, $input);

    reportJson([
        'success' => true,
        'cajas' => [['value' => 'POS-PRINCIPAL', 'label' => 'POS Principal']],
        'turno_actual' => $actor['shift'],
        'cajeros' => $cashiers,
        'turnos' => $shifts,
        'productos' => $products,
        'categorias' => $categories,
        'metodos_pago' => array_map(function ($row) {
            return ['value' => $row['value'], 'label' => reportPaymentLabel($row['value'])];
        }, $methods),
        'estatus' => [
            ['value' => 'COMPLETADA', 'label' => 'Completada'],
            ['value' => 'ANULADA', 'label' => 'Anulada'],
            ['value' => 'DEVUELTA', 'label' => 'Devuelta']
        ]
    ]);
} catch (Throwable $e) {
    reportJson([
        'success' => false,
        'message' => 'No fue posible cargar los filtros de reportes: ' . $e->getMessage()
    ], 500);
}
