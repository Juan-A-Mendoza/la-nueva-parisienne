<?php
/* Cierre Z: consulta y generación del histórico exclusivo de reportes. */

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/report_helpers.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

function closureEventScope(array $actor, array $input, $context, array &$where, array &$params) {
    if ($context === 'gerente') {
        $from = reportValidDate($input['date_from'] ?? $input['fecha_desde'] ?? '', date('Y-m-01'));
        $to = reportValidDate($input['date_to'] ?? $input['fecha_hasta'] ?? '', date('Y-m-d'));
        if ($from > $to) { $swap = $from; $from = $to; $to = $swap; }
        $where[] = 'e.fecha_hora >= :close_event_from';
        $where[] = 'e.fecha_hora < DATE_ADD(:close_event_to, INTERVAL 1 DAY)';
        $params['close_event_from'] = $from . ' 00:00:00';
        $params['close_event_to'] = $to . ' 00:00:00';
        $box = reportText($input['caja_id'] ?? $input['caja'] ?? '');
        if ($box !== '') { $where[] = "COALESCE(e.caja_id, 'POS-PRINCIPAL') = :close_event_box"; $params['close_event_box'] = $box; }
        $cashier = reportText($input['cajero_id'] ?? $input['cashier_id'] ?? '');
        if ($cashier !== '') { $where[] = 'e.usuario_id = :close_event_cashier'; $params['close_event_cashier'] = $cashier; }
        $shift = reportText($input['turno'] ?? $input['shift'] ?? '');
        if ($shift !== '') { $where[] = "COALESCE(e.turno, 'SIN TURNO') = :close_event_shift"; $params['close_event_shift'] = $shift; }
    } else {
        $date = reportValidDate($input['date'] ?? $input['fecha'] ?? '', date('Y-m-d'));
        $where[] = 'e.fecha_hora >= :close_event_date_from';
        $where[] = 'e.fecha_hora < :close_event_date_to';
        $params['close_event_date_from'] = $date . ' 00:00:00';
        $params['close_event_date_to'] = date('Y-m-d H:i:s', strtotime($date . ' +1 day'));
        $shift = reportText($actor['shift']);
        if ($shift !== '') { $where[] = "COALESCE(e.turno, 'SIN TURNO') = :close_event_shift"; $params['close_event_shift'] = $shift; }
    }
}

function closureSummary(array $sales, array $events) {
    $summary = [
        'ventas_brutas' => 0, 'descuentos' => 0, 'devoluciones' => 0,
        'ventas_netas' => 0, 'monto_efectivo_esperado' => 0,
        'facturas_emitidas' => 0, 'facturas_anuladas' => 0
    ];
    $payments = [];
    foreach ($sales as $sale) {
        $status = strtoupper((string)$sale['estatus']);
        if ($status === 'ANULADA') {
            $summary['facturas_anuladas']++;
            continue;
        }
        $summary['ventas_brutas'] += (float)$sale['subtotal'];
        $summary['descuentos'] += (float)$sale['descuento'];
        $summary['ventas_netas'] += (float)$sale['total'];
        $summary['facturas_emitidas']++;
        $method = reportPaymentLabel($sale['metodo_pago']);
        if (!isset($payments[$method])) $payments[$method] = ['metodo_pago' => $method, 'transacciones' => 0, 'monto' => 0];
        $payments[$method]['transacciones']++;
        $payments[$method]['monto'] += $method === 'Efectivo'
            ? (float)$sale['monto_pagado'] - (float)$sale['cambio']
            : (float)$sale['total'];
        if (strtolower($method) === 'efectivo') {
            $summary['monto_efectivo_esperado'] += (float)$sale['monto_pagado'] - (float)$sale['cambio'];
        }
    }
    foreach ($events as $event) {
        $type = strtoupper((string)$event['tipo_evento']);
        $amount = (float)$event['monto'];
        if ($type === 'DEVOLUCION') {
            $summary['devoluciones'] += $amount;
            $summary['ventas_netas'] -= $amount;
            $method = reportPaymentLabel($event['metodo_pago']);
            if (strtolower($method) === 'efectivo') $summary['monto_efectivo_esperado'] -= $amount;
        }
        if ($type === 'ANULACION') $summary['facturas_anuladas']++;
    }
    $summary['ventas_brutas'] = round($summary['ventas_brutas'], 2);
    $summary['descuentos'] = round($summary['descuentos'], 2);
    $summary['devoluciones'] = round($summary['devoluciones'], 2);
    $summary['ventas_netas'] = round($summary['ventas_netas'], 2);
    $summary['monto_efectivo_esperado'] = round($summary['monto_efectivo_esperado'], 2);
    foreach ($payments as &$payment) $payment['monto'] = round($payment['monto'], 2);
    unset($payment);
    return [$summary, array_values($payments)];
}

try {
    $pdo = getDbConnection();
    $input = reportInput();
    $actor = reportResolveActor($pdo, $input);
    $context = reportText($input['context'] ?? 'caja', 'caja');
    reportRequireContext($actor, $context);
    $action = strtoupper(reportText($input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'POST' ? 'generate' : 'preview')));

    $where = [];
    $params = [];
    reportApplySaleScope($actor, $input, $where, $params, $context);
    $salesSql = "SELECT v.id, v.codigo, v.fecha_hora, v.subtotal, v.descuento, v.total,
                        v.metodo_pago, v.monto_pagado, v.cambio,
                        COALESCE(rvm.estatus, 'COMPLETADA') AS estatus,
                        COALESCE(rvm.caja_id, 'POS-PRINCIPAL') AS caja_id,
                        COALESCE(rvm.turno, u.turno, 'SIN TURNO') AS turno
                 FROM ventas v
                 INNER JOIN usuarios u ON u.id = v.usuario_id
                 LEFT JOIN reportes_caja_venta_meta rvm ON rvm.venta_id = v.id
                 WHERE " . implode(' AND ', $where) .
                 " ORDER BY v.fecha_hora ASC";
    $stmt = $pdo->prepare($salesSql);
    $stmt->execute($params);
    $sales = $stmt->fetchAll();

    $eventWhere = [];
    $eventParams = [];
    closureEventScope($actor, $input, $context, $eventWhere, $eventParams);
    $eventSql = "SELECT e.id, e.codigo_venta, e.tipo_evento, e.estatus, e.metodo_pago,
                        e.monto, e.fecha_hora, e.caja_id, e.turno
                 FROM reportes_caja_eventos e
                 WHERE " . implode(' AND ', $eventWhere) .
                 " ORDER BY e.fecha_hora ASC";
    $eventStmt = $pdo->prepare($eventSql);
    $eventStmt->execute($eventParams);
    $events = $eventStmt->fetchAll();

    [$summary, $payments] = closureSummary($sales, $events);
    $hasData = count($sales) > 0 || count($events) > 0;
    $date = reportValidDate($input['date'] ?? $input['fecha'] ?? '', date('Y-m-d'));
    $shift = reportText($input['turno'] ?? $input['shift'] ?? $actor['shift'] ?? '', 'Turno General');
    $box = reportText($input['caja_id'] ?? $input['caja'] ?? 'POS-PRINCIPAL', 'POS-PRINCIPAL');
    $tasaBcv = (float)($input['tasa_bcv'] ?? $input['bcv_rate'] ?? 1.0);
    if ($tasaBcv <= 0) $tasaBcv = 1.0;
    $totalBs = round($summary['ventas_netas'] * $tasaBcv, 2);

    if ($action === 'GENERATE' || $action === 'GENERAR') {
        $confirmEmpty = filter_var($input['confirm_empty'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $forceReclose = filter_var($input['force'] ?? $input['force_reclose'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Verificar si ya existe cierre previo para alertar al usuario (a menos que fuerce re-cierre)
        $duplicate = $pdo->prepare("SELECT id, codigo_reporte, generado_en, ventas_netas FROM reportes_caja_cierres WHERE fecha_turno = :fecha AND caja_id = :caja AND turno = :turno ORDER BY generado_en DESC LIMIT 1");
        $duplicate->execute(['fecha' => $date, 'caja' => $box, 'turno' => $shift]);
        $existing = $duplicate->fetch();
        if ($existing && !$forceReclose) {
            reportAudit($pdo, 'CIERRE_CAJA_Z', 'CONSULTA', $actor, $input);
            reportJson([
                'success' => false,
                'code' => 'ALREADY_CLOSED',
                'message' => 'Ya existe un Cierre Z registrado para este turno.',
                'closure' => $existing
            ], 409);
        }

        if (!$hasData && !$confirmEmpty) {
            reportJson(['success' => false, 'code' => 'CONFIRM_EMPTY', 'message' => 'No hay ventas registradas en el turno. ¿Deseas generar el cierre de caja de todos modos?'], 409);
        }

        if (!$hasData) {
            $summary = ['ventas_brutas' => 0, 'descuentos' => 0, 'devoluciones' => 0, 'ventas_netas' => 0, 'monto_efectivo_esperado' => 0, 'facturas_emitidas' => 0, 'facturas_anuladas' => 0];
        }

        $montoReal = isset($input['monto_efectivo_real']) ? round((float)$input['monto_efectivo_real'], 2) : $summary['monto_efectivo_esperado'];
        $diferencia = round($montoReal - $summary['monto_efectivo_esperado'], 2);
        $observaciones = reportText($input['observaciones'] ?? $input['notas'] ?? '');
        $firmaCajero = reportText($input['firma_cajero'] ?? $actor['name'] ?? 'Cajero Principal', 'Cajero');

        $id = 'cz_' . date('YmdHis') . '_' . bin2hex(random_bytes(3));
        $code = 'Z-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $message = $hasData ? 'Cierre Z generado y sellado exitosamente.' : 'Turno cerrado sin ventas registradas.';

        $insert = $pdo->prepare(
            "INSERT INTO reportes_caja_cierres
             (id, codigo_reporte, fecha_turno, caja_id, turno, ventas_brutas, descuentos, devoluciones, ventas_netas,
              total_bs, tasa_bcv, monto_efectivo_esperado, monto_efectivo_real, diferencia_efectivo,
              facturas_emitidas, facturas_anuladas, cerrado_sin_ventas, mensaje_cierre, observaciones, detalle_pagos_json,
              firma_cajero, firma_supervisor, generado_por)
             VALUES (:id, :codigo, :fecha, :caja, :turno, :brutas, :descuentos, :devoluciones, :netas,
                     :total_bs, :tasa_bcv, :efectivo_esperado, :efectivo_real, :diferencia,
                     :emitidas, :anuladas, :sin_ventas, :mensaje, :observaciones, :detalle_pagos,
                     :firma, :firma_sup, :generado_por)"
        );
        $insert->execute([
            'id' => $id,
            'codigo' => $code,
            'fecha' => $date,
            'caja' => $box,
            'turno' => $shift,
            'brutas' => $summary['ventas_brutas'],
            'descuentos' => $summary['descuentos'],
            'devoluciones' => $summary['devoluciones'],
            'netas' => $summary['ventas_netas'],
            'total_bs' => $totalBs,
            'tasa_bcv' => $tasaBcv,
            'efectivo_esperado' => $summary['monto_efectivo_esperado'],
            'efectivo_real' => $montoReal,
            'diferencia' => $diferencia,
            'emitidas' => $summary['facturas_emitidas'],
            'anuladas' => $summary['facturas_anuladas'],
            'sin_ventas' => $hasData ? 0 : 1,
            'mensaje' => $message,
            'observaciones' => $observaciones,
            'detalle_pagos' => json_encode($payments, JSON_UNESCAPED_UNICODE),
            'firma' => $firmaCajero,
            'firma_sup' => null,
            'generado_por' => $actor['id']
        ]);

        $summary['id'] = $id;
        $summary['codigo_reporte'] = $code;
        $summary['fecha_turno'] = $date;
        $summary['caja_id'] = $box;
        $summary['turno'] = $shift;
        $summary['total_bs'] = $totalBs;
        $summary['tasa_bcv'] = $tasaBcv;
        $summary['monto_efectivo_real'] = $montoReal;
        $summary['diferencia_efectivo'] = $diferencia;
        $summary['observaciones'] = $observaciones;
        $summary['firma_cajero'] = $firmaCajero;
        $summary['firma_supervisor'] = null;
        $summary['generado_en'] = date('Y-m-d H:i:s');
        $summary['mensaje_cierre'] = $message;

        reportAudit($pdo, 'CIERRE_CAJA_Z', 'GENERACION', $actor, $input);
        reportJson([
            'success' => true,
            'has_data' => $hasData,
            'message' => $message,
            'closure' => $summary,
            'payments' => $payments,
            'sealed_at' => $summary['generado_en']
        ]);
    }

    $closures = [];
    if ($context === 'caja') {
        $closureSql = "SELECT * FROM reportes_caja_cierres WHERE fecha_turno = :fecha ORDER BY generado_en DESC";
        $closureStmt = $pdo->prepare($closureSql);
        $closureStmt->execute(['fecha' => $date]);
        $closures = $closureStmt->fetchAll();
    } else {
        $from = reportValidDate($input['date_from'] ?? '', date('Y-m-01'));
        $to = reportValidDate($input['date_to'] ?? '', date('Y-m-d'));
        if ($from > $to) { $swap = $from; $from = $to; $to = $swap; }
        $closureWhere = ['fecha_turno BETWEEN :closure_from AND :closure_to'];
        $closureParams = ['closure_from' => $from, 'closure_to' => $to];
        $boxFilter = reportText($input['caja_id'] ?? $input['caja'] ?? '');
        if ($boxFilter !== '') { $closureWhere[] = 'caja_id = :closure_box'; $closureParams['closure_box'] = $boxFilter; }
        $shiftFilter = reportText($input['turno'] ?? $input['shift'] ?? '');
        if ($shiftFilter !== '') { $closureWhere[] = 'turno = :closure_shift'; $closureParams['closure_shift'] = $shiftFilter; }
        $closureStmt = $pdo->prepare("SELECT * FROM reportes_caja_cierres WHERE " . implode(' AND ', $closureWhere) . " ORDER BY fecha_turno DESC, generado_en DESC");
        $closureStmt->execute($closureParams);
        $closures = $closureStmt->fetchAll();
    }
    reportAudit($pdo, 'CIERRE_CAJA_Z', 'CONSULTA', $actor, $input);
    reportJson([
        'success' => true,
        'has_data' => $hasData || count($closures) > 0,
        'message' => $hasData || count($closures) > 0 ? null : 'No hay ventas registradas en este turno.',
        'summary' => $summary,
        'payments' => $payments,
        'sales_count' => count($sales),
        'events_count' => count($events),
        'total_bs' => $totalBs,
        'tasa_bcv' => $tasaBcv,
        'closures' => $closures,
        'sealed_at' => date('Y-m-d H:i:s')
    ]);
} catch (Throwable $e) {
    reportJson(['success' => false, 'message' => 'No fue posible consultar el Cierre de Caja: ' . $e->getMessage()], 500);
}
