<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MÉTRICAS Y DATOS ANALÍTICOS REALES DE BD (CU-02)
   KPIs de ventas, tendencia por período, movimientos reales e inventario.
   ========================================================================== */

define('LNP_PUBLIC', true);
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

    // -------------------------------------------------------------------------
    // 1. TOTALES Y KPIS DE VENTAS (REALES)
    // -------------------------------------------------------------------------
    $now = new DateTime('now', new DateTimeZone('America/Caracas'));
    $currentYear = (int)$now->format('Y');
    $currentMonth = (int)$now->format('m');

    // Total histórico y del mes actual
    $stmtMonth = $pdo->prepare("
        SELECT 
            COALESCE(SUM(total), 0) AS total_revenue,
            COUNT(*) AS total_orders,
            COALESCE(AVG(total), 0) AS avg_ticket
        FROM ventas
        WHERE YEAR(fecha_hora) = :yr AND MONTH(fecha_hora) = :mo
    ");
    $stmtMonth->execute(['yr' => $currentYear, 'mo' => $currentMonth]);
    $monthKpis = $stmtMonth->fetch();

    $totalRevenue = (float)$monthKpis['total_revenue'];
    $totalOrders = (int)$monthKpis['total_orders'];
    $averageTicket = (float)$monthKpis['avg_ticket'];

    // Si en el mes corriente no hay ventas aún, usar el acumulado total para que el dashboard muestre datos reales
    $isAllTime = false;
    if ($totalOrders === 0) {
        $stmtAll = $pdo->query("
            SELECT 
                COALESCE(SUM(total), 0) AS total_revenue,
                COUNT(*) AS total_orders,
                COALESCE(AVG(total), 0) AS avg_ticket
            FROM ventas
        ");
        $allKpis = $stmtAll->fetch();
        $totalRevenue = (float)$allKpis['total_revenue'];
        $totalOrders = (int)$allKpis['total_orders'];
        $averageTicket = (float)$allKpis['avg_ticket'];
        $isAllTime = true;
    }

    // Mes anterior para crecimiento relativo
    $prevDate = (clone $now)->modify('-1 month');
    $stmtPrev = $pdo->prepare("
        SELECT 
            COALESCE(SUM(total), 0) AS total_revenue,
            COUNT(*) AS total_orders
        FROM ventas
        WHERE YEAR(fecha_hora) = :yr AND MONTH(fecha_hora) = :mo
    ");
    $stmtPrev->execute(['yr' => (int)$prevDate->format('Y'), 'mo' => (int)$prevDate->format('m')]);
    $prevKpis = $stmtPrev->fetch();
    $prevRevenue = (float)$prevKpis['total_revenue'];
    $prevOrders = (int)$prevKpis['total_orders'];

    $revenueGrowth = $prevRevenue > 0 ? round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : 0.0;
    $ordersGrowth = $prevOrders > 0 ? round((($totalOrders - $prevOrders) / $prevOrders) * 100, 1) : 0.0;

    // Costo estimado de los productos vendidos y margen
    $costStmt = $pdo->query("
        SELECT COALESCE(SUM(vd.cantidad * (vd.precio_unitario * 0.55)), 0) AS total_cost
        FROM ventas_detalle vd
    ");
    $totalCost = (float)$costStmt->fetchColumn();
    $profitMargin = $totalRevenue > 0 ? round((($totalRevenue - $totalCost) / $totalRevenue) * 100, 1) : 0.0;
    if ($profitMargin < 0) $profitMargin = 0.0;

    $marginStatus = $profitMargin >= 35.0 ? 'Excelente' : ($profitMargin >= 20.0 ? 'Saludable' : 'Normal');

    $kpis = [
        'totalRevenue' => round($totalRevenue, 2),
        'revenueGrowth' => $revenueGrowth,
        'totalOrders' => $totalOrders,
        'ordersGrowth' => $ordersGrowth,
        'averageTicket' => round($averageTicket, 2),
        'ticketGrowth' => 0.0,
        'profitMargin' => $profitMargin,
        'marginStatus' => $marginStatus,
        'isAllTime' => $isAllTime
    ];

    // -------------------------------------------------------------------------
    // 2. PERIODOS Y TENDENCIA DE VENTAS (REALES)
    // -------------------------------------------------------------------------

    // A) 7 DÍAS: Días recientes activos o últimos 7 días
    // Buscar la fecha más reciente de venta para anclar los 7 días
    $latestSaleDateStr = $pdo->query("SELECT DATE(MAX(fecha_hora)) FROM ventas")->fetchColumn();
    $anchorDate = $latestSaleDateStr ? new DateTime($latestSaleDateStr) : clone $now;

    $diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    $labels7d = [];
    $sales7d = [];
    $costs7d = [];
    $orders7d = [];

    for ($i = 6; $i >= 0; $i--) {
        $dayObj = (clone $anchorDate)->modify("-$i days");
        $dayStr = $dayObj->format('Y-m-d');
        $dayWeekName = $diasSemana[(int)$dayObj->format('w')];
        $labels7d[] = "$dayWeekName " . $dayObj->format('d/m');

        $stmtDay = $pdo->prepare("
            SELECT COALESCE(SUM(total), 0) AS day_sales, COUNT(*) AS day_orders
            FROM ventas
            WHERE DATE(fecha_hora) = :d
        ");
        $stmtDay->execute(['d' => $dayStr]);
        $dayRow = $stmtDay->fetch();
        $dSales = (float)$dayRow['day_sales'];
        $dOrders = (int)$dayRow['day_orders'];

        $stmtDayCost = $pdo->prepare("
            SELECT COALESCE(SUM(vd.cantidad * (vd.precio_unitario * 0.55)), 0)
            FROM ventas v
            JOIN ventas_detalle vd ON v.id = vd.venta_id
            WHERE DATE(v.fecha_hora) = :d
        ");
        $stmtDayCost->execute(['d' => $dayStr]);
        $dCost = (float)$stmtDayCost->fetchColumn();

        $sales7d[] = round($dSales, 2);
        $costs7d[] = round($dCost, 2);
        $orders7d[] = $dOrders;
    }

    // B) ESTE MES: Dividido en 4 semanas
    $labelsMonth = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    $salesMonth = [0, 0, 0, 0];
    $costsMonth = [0, 0, 0, 0];
    $ordersMonth = [0, 0, 0, 0];

    $monthSalesStmt = $pdo->prepare("
        SELECT 
            DAY(fecha_hora) AS dia,
            total,
            (SELECT COALESCE(SUM(vd.cantidad * (vd.precio_unitario * 0.55)), 0) FROM ventas_detalle vd WHERE vd.venta_id = ventas.id) AS costo
        FROM ventas
        WHERE YEAR(fecha_hora) = :yr AND MONTH(fecha_hora) = :mo
    ");
    $monthSalesStmt->execute(['yr' => (int)$anchorDate->format('Y'), 'mo' => (int)$anchorDate->format('m')]);
    $monthSalesRows = $monthSalesStmt->fetchAll();

    foreach ($monthSalesRows as $ms) {
        $day = (int)$ms['dia'];
        $wIdx = min(3, (int)floor(($day - 1) / 7));
        $salesMonth[$wIdx] += (float)$ms['total'];
        $costsMonth[$wIdx] += (float)$ms['costo'];
        $ordersMonth[$wIdx] += 1;
    }
    for ($w = 0; $w < 4; $w++) {
        $salesMonth[$w] = round($salesMonth[$w], 2);
        $costsMonth[$w] = round($costsMonth[$w], 2);
    }

    // C) ÚLTIMO TRIMESTRE: Últimos 3 meses
    $labelsQuarter = [];
    $salesQuarter = [];
    $costsQuarter = [];
    $ordersQuarter = [];
    $nombresMeses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for ($m = 2; $m >= 0; $m--) {
        $mObj = (clone $anchorDate)->modify("-$m months");
        $mNum = (int)$mObj->format('m');
        $mYr = (int)$mObj->format('Y');
        $labelsQuarter[] = $nombresMeses[$mNum] . ' ' . $mYr;

        $stmtQ = $pdo->prepare("
            SELECT COALESCE(SUM(total), 0) AS s, COUNT(*) AS o
            FROM ventas
            WHERE YEAR(fecha_hora) = :yr AND MONTH(fecha_hora) = :mo
        ");
        $stmtQ->execute(['yr' => $mYr, 'mo' => $mNum]);
        $qRow = $stmtQ->fetch();
        $qSales = (float)$qRow['s'];
        $qOrders = (int)$qRow['o'];

        $stmtQCost = $pdo->prepare("
            SELECT COALESCE(SUM(vd.cantidad * (vd.precio_unitario * 0.55)), 0)
            FROM ventas v
            JOIN ventas_detalle vd ON v.id = vd.venta_id
            WHERE YEAR(v.fecha_hora) = :yr AND MONTH(v.fecha_hora) = :mo
        ");
        $stmtQCost->execute(['yr' => $mYr, 'mo' => $mNum]);
        $qCost = (float)$stmtQCost->fetchColumn();

        $salesQuarter[] = round($qSales, 2);
        $costsQuarter[] = round($qCost, 2);
        $ordersQuarter[] = $qOrders;
    }

    // D) AÑO CORRIENTE (12 MESES)
    $labelsYear = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    $salesYear = array_fill(0, 12, 0.0);
    $costsYear = array_fill(0, 12, 0.0);
    $ordersYear = array_fill(0, 12, 0);

    $yearStmt = $pdo->prepare("
        SELECT 
            MONTH(fecha_hora) AS mo,
            COALESCE(SUM(total), 0) AS total_sales,
            COUNT(*) AS total_orders
        FROM ventas
        WHERE YEAR(fecha_hora) = :yr
        GROUP BY MONTH(fecha_hora)
    ");
    $yearStmt->execute(['yr' => (int)$anchorDate->format('Y')]);
    $yearRows = $yearStmt->fetchAll();

    foreach ($yearRows as $yrRow) {
        $moIdx = (int)$yrRow['mo'] - 1;
        if ($moIdx >= 0 && $moIdx < 12) {
            $salesYear[$moIdx] = round((float)$yrRow['total_sales'], 2);
            $ordersYear[$moIdx] = (int)$yrRow['total_orders'];
            $costsYear[$moIdx] = round((float)$yrRow['total_sales'] * 0.55, 2);
        }
    }

    $periods = [
        '7d' => [
            'label' => 'Últimos 7 Días',
            'labels' => $labels7d,
            'sales' => $sales7d,
            'costs' => $costs7d,
            'orders' => $orders7d
        ],
        'month' => [
            'label' => 'Este Mes',
            'labels' => $labelsMonth,
            'sales' => $salesMonth,
            'costs' => $costsMonth,
            'orders' => $ordersMonth
        ],
        'quarter' => [
            'label' => 'Último Trimestre',
            'labels' => $labelsQuarter,
            'sales' => $salesQuarter,
            'costs' => $costsQuarter,
            'orders' => $ordersQuarter
        ],
        'year' => [
            'label' => 'Año ' . $anchorDate->format('Y'),
            'labels' => $labelsYear,
            'sales' => $salesYear,
            'costs' => $costsYear,
            'orders' => $ordersYear
        ]
    ];

    // -------------------------------------------------------------------------
    // 3. MOVIMIENTOS RECIENTES REALES CON DESGLOSE DE PRODUCTOS (CU-02)
    // -------------------------------------------------------------------------
    $movements = [];
    $breakdowns = [];

    // Ventas
    $stmtVentas = $pdo->query("
        SELECT v.id, v.codigo, v.fecha_hora, v.total, v.metodo_pago,
               COALESCE(u.nombre, 'Cajero POS') AS cajero
        FROM ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        ORDER BY v.fecha_hora DESC
        LIMIT 15
    ");
    $ventasRows = $stmtVentas->fetchAll();

    foreach ($ventasRows as $vr) {
        $vId = $vr['id'];
        $code = $vr['codigo'];

        // Obtener ítems vendidos para el breakdown del modal
        $stmtItems = $pdo->prepare("
            SELECT p.nombre, vd.cantidad, vd.precio_unitario, vd.subtotal_linea
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            WHERE vd.venta_id = :vid
        ");
        $stmtItems->execute(['vid' => $vId]);
        $items = $stmtItems->fetchAll();

        $itemDetails = [];
        $totalItemsCount = 0;
        foreach ($items as $it) {
            $qty = (int)$it['cantidad'];
            $totalItemsCount += $qty;
            $itemDetails[] = [
                'name' => "{$it['nombre']} (x{$qty})",
                'price' => '$' . number_format((float)$it['subtotal_linea'], 2, '.', '') . ' USD'
            ];
        }

        $breakdowns[$code] = $itemDetails;

        $movements[] = [
            'id' => $vId,
            'code' => $code,
            'timestamp' => substr($vr['fecha_hora'], 0, 16),
            'type' => 'Venta POS',
            'category' => 'venta',
            'user' => $vr['cajero'],
            'paymentMethod' => ucfirst($vr['metodo_pago']),
            'status' => 'Completado',
            'amount' => (float)$vr['total'],
            'itemsCount' => $totalItemsCount
        ];
    }

    // Órdenes de compra a proveedores
    $stmtOC = $pdo->query("
        SELECT oc.id, oc.codigo, oc.fecha_pedido, oc.monto_total, oc.estado,
               COALESCE(p.nombre, 'Proveedor') AS proveedor
        FROM ordenes_compra oc
        LEFT JOIN proveedores p ON oc.proveedor_id = p.id
        ORDER BY oc.fecha_pedido DESC
        LIMIT 15
    ");
    $ocRows = $stmtOC->fetchAll();

    foreach ($ocRows as $or) {
        $ocId = $or['id'];
        $code = $or['codigo'];

        $stmtOCItems = $pdo->prepare("
            SELECT mp.nombre, ocd.cantidad, ocd.precio, (ocd.cantidad * ocd.precio) AS subtotal
            FROM ordenes_compra_detalle ocd
            JOIN materias_primas mp ON ocd.materia_prima_id = mp.id
            WHERE ocd.orden_id = :oid
        ");
        $stmtOCItems->execute(['oid' => $ocId]);
        $ocItems = $stmtOCItems->fetchAll();

        $ocItemDetails = [];
        $ocCount = 0;
        foreach ($ocItems as $oi) {
            $qty = (float)$oi['cantidad'];
            $ocCount += $qty;
            $ocItemDetails[] = [
                'name' => "{$oi['nombre']} (x{$qty})",
                'price' => '-$' . number_format((float)$oi['subtotal'], 2, '.', '') . ' USD'
            ];
        }

        $breakdowns[$code] = $ocItemDetails;

        $statusLabel = $or['estado'] === 'received' ? 'Completado' : 'En Tránsito';

        $movements[] = [
            'id' => $ocId,
            'code' => $code,
            'timestamp' => $or['fecha_pedido'] . ' 12:00',
            'type' => 'Compra ' . $or['proveedor'],
            'category' => 'gasto',
            'user' => 'Administración',
            'paymentMethod' => 'Transferencia',
            'status' => $statusLabel,
            'amount' => -1 * (float)$or['monto_total'],
            'itemsCount' => (int)$ocCount
        ];
    }

    // Cierres / Arqueos de caja
    $stmtCierres = $pdo->query("
        SELECT c.id, c.codigo_reporte, c.generado_en, c.diferencia_efectivo, c.ventas_netas,
               COALESCE(u.nombre, 'Cajero') AS cajero
        FROM reportes_caja_cierres c
        LEFT JOIN usuarios u ON c.generado_por = u.id
        ORDER BY c.generado_en DESC
        LIMIT 5
    ");
    $cierreRows = $stmtCierres ? $stmtCierres->fetchAll() : [];

    foreach ($cierreRows as $cr) {
        $cCode = $cr['codigo_reporte'] ?: ('ARQ-' . substr($cr['id'], 0, 8));
        $dif = (float)$cr['diferencia_efectivo'];
        $movements[] = [
            'id' => $cr['id'],
            'code' => $cCode,
            'timestamp' => substr($cr['generado_en'], 0, 16),
            'type' => 'Cierre de Caja Turno',
            'category' => 'ajuste',
            'user' => $cr['cajero'],
            'paymentMethod' => 'Auditoría',
            'status' => 'Completado',
            'amount' => $dif,
            'itemsCount' => 1
        ];

        $breakdowns[$cCode] = [
            [
                'name' => "Arqueo de Turno (Ventas Netas: $" . number_format((float)$cr['ventas_netas'], 2) . ")",
                'price' => ($dif >= 0 ? '+$' : '-$') . number_format(abs($dif), 2) . ' USD'
            ]
        ];
    }

    // Ordenar todos los movimientos por timestamp DESC
    usort($movements, function($a, $b) {
        return strcmp($b['timestamp'], $a['timestamp']);
    });

    // -------------------------------------------------------------------------
    // 4. CONTEOS DE CATÁLOGOS E INVENTARIO (REALES)
    // -------------------------------------------------------------------------
    $rawCount = (int)$pdo->query("SELECT COUNT(*) FROM materias_primas")->fetchColumn();
    $prodCount = (int)$pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
    $suppCount = (int)$pdo->query("SELECT COUNT(*) FROM proveedores")->fetchColumn();
    $tickCount = (int)$pdo->query("SELECT COUNT(*) FROM comandas_cocina")->fetchColumn();

    $response = [
        'success' => true,
        'kpis' => $kpis,
        'periods' => $periods,
        'movements' => array_slice($movements, 0, 25),
        'breakdowns' => $breakdowns,
        'inventorySummary' => [
            'rawMaterialsCount' => $rawCount,
            'finishedGoodsCount' => $prodCount,
            'suppliersCount' => $suppCount,
            'productionTicketsCount' => $tickCount
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener métricas reales: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
