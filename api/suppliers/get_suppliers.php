<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA DE PROVEEDORES Y ÓRDENES (GET_SUPPLIERS.PHP)
   Retorna el directorio de proveedores y órdenes de compra desde MySQL
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

    // 1. Obtener Proveedores
    $stmtProv = $pdo->query("
        SELECT id, codigo AS code, nombre AS name, categoria AS category,
               contacto AS contactPerson, telefono AS phone, email, rif,
               direccion AS address, condicion_pago AS paymentTerms,
               calificacion AS rating, icono AS icon
        FROM proveedores
        ORDER BY id ASC
    ");
    $suppliers = $stmtProv->fetchAll();

    // 2. Obtener Órdenes de Compra con nombre de proveedor
    $stmtOrders = $pdo->query("
        SELECT o.id, o.codigo AS code, o.proveedor_id AS supplierId,
               p.nombre AS supplierName, p.icono AS supplierIcon,
               o.fecha_pedido AS orderDate, o.fecha_entrega AS deliveryDate,
               o.estado AS status, o.monto_total AS totalAmount
        FROM ordenes_compra o
        LEFT JOIN proveedores p ON o.proveedor_id = p.id
        ORDER BY o.fecha_pedido DESC
    ");
    $ordersRaw = $stmtOrders->fetchAll();

    // 3. Obtener Detalles de las Órdenes (Insumos desde materias_primas)
    $stmtItems = $pdo->query("
        SELECT d.orden_id, d.materia_prima_id AS producto_id, mp.nombre AS productName, 
               mp.unidad_medida, d.cantidad, d.precio
        FROM ordenes_compra_detalle d
        LEFT JOIN materias_primas mp ON d.materia_prima_id = mp.id
    ");
    $itemsRaw = $stmtItems->fetchAll();

    $itemsPorOrden = [];
    foreach ($itemsRaw as $it) {
        $oid = $it['orden_id'];
        if (!isset($itemsPorOrden[$oid])) {
            $itemsPorOrden[$oid] = [];
        }
        $itemsPorOrden[$oid][] = [
            'productId' => $it['producto_id'],
            'productName' => $it['productName'] ?: 'Insumo',
            'unit' => $it['unidad_medida'] ?: 'kg',
            'quantity' => (float)$it['cantidad'],
            'price' => (float)$it['precio']
        ];
    }

    $orders = [];
    foreach ($ordersRaw as $ord) {
        $oid = $ord['id'];
        $items = $itemsPorOrden[$oid] ?? [];
        $itemsCount = count($items);
        $summary = $itemsCount > 0 ? "{$itemsCount} insumos programados" : "Orden sin renglones";

        $orders[] = [
            'id' => $oid,
            'code' => $ord['code'],
            'supplierId' => $ord['supplierId'],
            'supplierName' => $ord['supplierName'] ?: 'Proveedor',
            'supplierIcon' => $ord['supplierIcon'] ?: 'building-2',
            'orderDate' => $ord['orderDate'],
            'deliveryDate' => $ord['deliveryDate'],
            'status' => $ord['status'],
            'totalAmount' => (float)$ord['totalAmount'],
            'itemsSummary' => $summary,
            'items' => $items
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'suppliers' => $suppliers,
        'orders' => $orders
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar proveedores en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
