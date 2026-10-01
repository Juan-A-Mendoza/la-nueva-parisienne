<?php
/* Reporte unificado de Ventas y Cobros. Solo lectura; no modifica tablas operativas. */

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

function reportEventScope(array $actor, array $input, $context, array &$where, array &$params) {
    if ($context === 'gerente') {
        $from = reportValidDate($input['date_from'] ?? $input['fecha_desde'] ?? '', date('Y-m-01'));
        $to = reportValidDate($input['date_to'] ?? $input['fecha_hasta'] ?? '', date('Y-m-d'));
        if ($from > $to) { $swap = $from; $from = $to; $to = $swap; }
        $where[] = 'e.fecha_hora >= :event_from';
        $where[] = 'e.fecha_hora < DATE_ADD(:event_to, INTERVAL 1 DAY)';
        $params['event_from'] = $from . ' 00:00:00';
        $params['event_to'] = $to . ' 00:00:00';

        $box = reportText($input['caja_id'] ?? $input['caja'] ?? '');
        if ($box !== '') { $where[] = "COALESCE(e.caja_id, 'POS-PRINCIPAL') = :event_box"; $params['event_box'] = $box; }
        $cashier = reportText($input['cajero_id'] ?? $input['cashier_id'] ?? '');
        if ($cashier !== '') { $where[] = 'e.usuario_id = :event_cashier'; $params['event_cashier'] = $cashier; }
        $shift = reportText($input['turno'] ?? $input['shift'] ?? '');
        if ($shift !== '') { $where[] = "COALESCE(e.turno, 'SIN TURNO') = :event_shift"; $params['event_shift'] = $shift; }
    } else {
        $date = reportValidDate($input['date'] ?? $input['fecha'] ?? '', date('Y-m-d'));
        $where[] = 'e.fecha_hora >= :event_date_from';
        $where[] = 'e.fecha_hora < :event_date_to';
        $params['event_date_from'] = $date . ' 00:00:00';
        $params['event_date_to'] = date('Y-m-d H:i:s', strtotime($date . ' +1 day'));
        $shift = reportText($actor['shift']);
        if ($shift !== '') { $where[] = "COALESCE(e.turno, 'SIN TURNO') = :event_shift"; $params['event_shift'] = $shift; }
    }

    $status = reportText($input['estatus'] ?? $input['status'] ?? '');
    if ($status !== '') { $where[] = 'e.estatus = :event_status'; $params['event_status'] = $status; }
    $payment = reportText($input['metodo_pago'] ?? $input['payment_method'] ?? '');
    if ($payment !== '') { $where[] = 'COALESCE(e.metodo_pago, \'\') = :event_payment'; $params['event_payment'] = $payment; }
    $reference = reportText($input['referencia_lote'] ?? $input['reference'] ?? '');
    if ($reference !== '') { $where[] = 'COALESCE(e.referencia_lote, \'\') LIKE :event_reference'; $params['event_reference'] = '%' . $reference . '%'; }
}

function reportDetailBaseSql() {
    return "FROM ventas v
            INNER JOIN usuarios u ON u.id = v.usuario_id
            LEFT JOIN reportes_caja_venta_meta rvm ON rvm.venta_id = v.id
            LEFT JOIN ventas_detalle vd ON vd.venta_id = v.id
            LEFT JOIN productos p ON p.id = vd.producto_id
            LEFT JOIN categorias_producto c ON c.id = p.categoria_id";
}

try {
    $pdo = getDbConnection();
    $input = reportInput();
    $actor = reportResolveActor($pdo, $input);
    $context = reportText($input['context'] ?? 'caja', 'caja');
    reportRequireContext($actor, $context);
    $tab = reportText($input['tab'] ?? 'ventas', 'ventas');
    if (!in_array($tab, ['ventas', 'cobros'], true)) $tab = 'ventas';

    $where = [];
    $params = [];
    reportApplySaleScope($actor, $input, $where, $params, $context);
    reportApplyDetailFilters($input, $where, $params);
    $whereSql = ' WHERE ' . implode(' AND ', $where);

    if ($tab === 'ventas') {
        $sql = "SELECT v.id, v.codigo, v.fecha_hora, v.subtotal, v.iva, v.descuento, v.total,
                       v.metodo_pago, v.monto_pagado, v.cambio,
                       u.id AS cajero_id, u.nombre AS cajero,
                       COALESCE(rvm.caja_id, 'POS-PRINCIPAL') AS caja_id,
                       COALESCE(rvm.turno, u.turno, 'SIN TURNO') AS turno,
                       COALESCE(rvm.referencia_lote, '') AS referencia_lote,
                       COALESCE(rvm.estatus, 'COMPLETADA') AS estatus,
                       p.id AS producto_id, p.nombre AS producto, c.id AS categoria_id,
                       COALESCE(c.nombre, 'Sin categoría') AS categoria,
                       vd.cantidad, vd.precio_unitario, vd.subtotal_linea
                " . reportDetailBaseSql() . $whereSql .
                " ORDER BY v.fecha_hora DESC, v.codigo DESC, p.nombre ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $eventWhere = [];
        $eventParams = [];
        reportEventScope($actor, $input, $context, $eventWhere, $eventParams);
        if (reportText($input['producto_id'] ?? $input['product_id'] ?? '') !== '' || reportText($input['categoria_id'] ?? $input['category_id'] ?? '') !== '') {
            $eventWhere[] = '1 = 0';
        }
        $eventSql = "SELECT e.id, e.codigo_venta AS codigo, e.fecha_hora, e.tipo_evento, e.estatus,
                            e.monto, e.caja_id, COALESCE(e.turno, 'SIN TURNO') AS turno,
                            e.metodo_pago, e.referencia_lote, e.motivo,
                            COALESCE(eu.nombre, 'No especificado') AS registrado_por
                     FROM reportes_caja_eventos e
                     LEFT JOIN usuarios eu ON eu.id = e.registrado_por
                     WHERE " . implode(' AND ', $eventWhere) .
                     " ORDER BY e.fecha_hora DESC";
        $eventStmt = $pdo->prepare($eventSql);
        $eventStmt->execute($eventParams);
        $events = $eventStmt->fetchAll();

        $categoryTotals = [];
        $saleIds = [];
        $totals = ['subtotal' => 0, 'descuentos' => 0, 'impuestos' => 0, 'total' => 0];
        foreach ($rows as $row) {
            $saleIds[$row['id']] = true;
            $category = $row['categoria'];
            if (!isset($categoryTotals[$category])) $categoryTotals[$category] = ['categoria' => $category, 'cantidad' => 0, 'total' => 0];
            $categoryTotals[$category]['cantidad'] += (float)($row['cantidad'] ?? 0);
            $categoryTotals[$category]['total'] += (float)($row['subtotal_linea'] ?? 0);
            $totals['subtotal'] += (float)$row['subtotal'];
            $totals['descuentos'] += (float)$row['descuento'];
            $totals['impuestos'] += (float)$row['iva'];
            $totals['total'] += (float)$row['total'];
        }
        $totals['transacciones'] = count($saleIds);
        $totals['eventos'] = count($events);
        $hasData = count($rows) > 0 || count($events) > 0;
        reportAudit($pdo, 'DETALLE_VENTAS_COBROS', 'CONSULTA', $actor, $input);
        reportJson([
            'success' => true,
            'has_data' => $hasData,
            'message' => $hasData ? null : 'No hay ventas registradas en este turno.',
            'rows' => $rows,
            'events' => $events,
            'category_totals' => array_values($categoryTotals),
            'totals' => $totals,
            'sealed_at' => date('Y-m-d H:i:s')
        ]);
    }

    // Cobros: una fila por transacción, evitando duplicar por sus renglones de venta.
    $sql = "SELECT DISTINCT v.id, v.codigo, v.fecha_hora, v.subtotal, v.iva, v.descuento, v.total,
                   v.metodo_pago, v.monto_pagado, v.cambio,
                   u.id AS cajero_id, u.nombre AS cajero,
                   COALESCE(rvm.caja_id, 'POS-PRINCIPAL') AS caja_id,
                   COALESCE(rvm.turno, u.turno, 'SIN TURNO') AS turno,
                   COALESCE(rvm.referencia_lote, '') AS referencia_lote,
                   COALESCE(rvm.estatus, 'COMPLETADA') AS estatus
            FROM ventas v
            INNER JOIN usuarios u ON u.id = v.usuario_id
            LEFT JOIN reportes_caja_venta_meta rvm ON rvm.venta_id = v.id
            LEFT JOIN ventas_detalle vd ON vd.venta_id = v.id
            LEFT JOIN productos p ON p.id = vd.producto_id
            LEFT JOIN categorias_producto c ON c.id = p.categoria_id" . $whereSql .
            " ORDER BY v.fecha_hora DESC, v.codigo DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $groups = [];
    $totalSystem = 0;
    $totalChannel = 0;
    foreach ($rows as &$row) {
        $method = reportPaymentLabel($row['metodo_pago']);
        $channelAmount = $method === 'Efectivo'
            ? (float)$row['monto_pagado'] - (float)$row['cambio']
            : (float)$row['total'];
        $row['monto_canal'] = $channelAmount;
        $row['monto_sistema'] = (float)$row['total'];
        $row['diferencia'] = $channelAmount - (float)$row['total'];
        if (!isset($groups[$method])) $groups[$method] = ['metodo_pago' => $method, 'transacciones' => 0, 'referencias' => [], 'monto_canal' => 0, 'monto_sistema' => 0, 'diferencia' => 0];
        $groups[$method]['transacciones']++;
        if ($row['referencia_lote'] !== '') $groups[$method]['referencias'][$row['referencia_lote']] = true;
        $groups[$method]['monto_canal'] += $channelAmount;
        $groups[$method]['monto_sistema'] += (float)$row['total'];
        $groups[$method]['diferencia'] += $row['diferencia'];
        $totalChannel += $channelAmount;
        $totalSystem += (float)$row['total'];
    }
    unset($row);
    foreach ($groups as &$group) $group['referencias'] = implode(', ', array_keys($group['referencias']));
    unset($group);
    $hasData = count($rows) > 0;
    reportAudit($pdo, 'DETALLE_VENTAS_COBROS', 'CONSULTA', $actor, $input);
    reportJson([
        'success' => true,
        'has_data' => $hasData,
        'message' => $hasData ? null : 'No hay ventas registradas en este turno.',
        'rows' => $rows,
        'groups' => array_values($groups),
        'totals' => [
            'transacciones' => count($rows),
            'monto_canal' => $totalChannel,
            'monto_sistema' => $totalSystem,
            'diferencia' => $totalChannel - $totalSystem
        ],
        'note' => 'La base actual no registra liquidación externa por canal; la diferencia se calcula contra lo registrado en ventas.',
        'sealed_at' => date('Y-m-d H:i:s')
    ]);
} catch (Throwable $e) {
    reportJson(['success' => false, 'message' => 'No fue posible generar el detalle de ventas y cobros: ' . $e->getMessage()], 500);
}
