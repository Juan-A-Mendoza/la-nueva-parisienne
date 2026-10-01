<?php
/* ============================================================================
   LA NUEVA PARISIENNE - UTILIDADES EXCLUSIVAS DE REPORTES DE CAJA
   No participa en ventas, cobros, turnos ni inventario.
   ============================================================================ */

function reportJson($payload, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit();
}

function reportInput() {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        return $_GET;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}

function reportText($value, $default = '') {
    if (is_array($value) || is_object($value)) return $default;
    $text = trim((string)$value);
    return $text === '' ? $default : $text;
}

function reportRole($value) {
    return strtoupper(trim((string)$value));
}

function reportIsCashier($role) {
    return in_array(reportRole($role), ['POS', 'CASHIER'], true);
}

function reportIsManager($role) {
    return reportRole($role) === 'ADMIN';
}

function reportValidDate($value, $fallback) {
    $value = reportText($value, $fallback);
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value ? $value : $fallback;
}

function reportResolveActor(PDO $pdo, array $input) {
    $userId = reportText($input['user_id'] ?? $input['userId'] ?? '');
    $requestedRole = reportRole($input['role_code'] ?? $input['roleCode'] ?? '');
    $requestedName = reportText($input['user_name'] ?? $input['userName'] ?? 'Usuario del sistema', 'Usuario del sistema');
    $requestedShift = reportText($input['shift'] ?? $input['turno'] ?? '');

    if ($userId !== '') {
        $stmt = $pdo->prepare(
            "SELECT u.id, u.nombre, u.turno, r.codigo AS role_code
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = :user_id AND u.estado = 'active'
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch();
        if ($row) {
            return [
                'id' => $row['id'],
                'name' => $row['nombre'],
                'role' => reportRole($row['role_code']),
                'shift' => reportText($row['turno'], $requestedShift)
            ];
        }
    }

    // La interfaz local puede usar un identificador distinto al de MySQL.
    // Resolver por nombre permite recuperar el turno real sin abrir el alcance
    // del cajero a otros turnos.
    if ($requestedName !== '' && $requestedName !== 'Usuario del sistema') {
        $stmt = $pdo->prepare(
            "SELECT u.id, u.nombre, u.turno, r.codigo AS role_code
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.nombre = :user_name AND u.estado = 'active'
             LIMIT 1"
        );
        $stmt->execute(['user_name' => $requestedName]);
        $row = $stmt->fetch();
        if ($row) {
            return [
                'id' => $row['id'],
                'name' => $row['nombre'],
                'role' => reportRole($row['role_code']),
                'shift' => reportText($row['turno'], $requestedShift)
            ];
        }
    }

    // El POS local histórico usa usr_002 para la cajera, mientras que el
    // catálogo MySQL vigente conserva ese perfil como usr_ana. Es el mismo
    // respaldo utilizado por el endpoint de persistencia de ventas.
    if (reportIsCashier($requestedRole)) {
        $stmt = $pdo->prepare(
            "SELECT u.id, u.nombre, u.turno, r.codigo AS role_code
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = 'usr_ana' AND u.estado = 'active'
             LIMIT 1"
        );
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            return [
                'id' => $row['id'],
                'name' => $row['nombre'],
                'role' => reportRole($row['role_code']),
                'shift' => reportText($row['turno'], $requestedShift)
            ];
        }
    }

    // El sistema actual también puede operar con sesión local. En ese caso
    // conservamos la validación exclusiva del reporte por rol, sin cambiar el login.
    if (reportIsCashier($requestedRole) || reportIsManager($requestedRole)) {
        return [
            'id' => $userId !== '' ? $userId : 'report-local-user',
            'name' => $requestedName,
            'role' => $requestedRole,
            'shift' => $requestedShift
        ];
    }

    reportJson([
        'success' => false,
        'code' => 'REPORT_UNAUTHORIZED',
        'message' => 'No tiene permisos para consultar reportes de caja.'
    ], 403);
}

function reportRequireContext(array $actor, $context) {
    $allowed = $context === 'caja'
        ? reportIsCashier($actor['role'])
        : reportIsManager($actor['role']);

    if (!$allowed) {
        reportJson([
            'success' => false,
            'code' => 'REPORT_ROLE_FORBIDDEN',
            'message' => $context === 'caja'
                ? 'El reporte de Caja solo está disponible para cajeros.'
                : 'El reporte gerencial solo está disponible para el Gerente.'
        ], 403);
    }
}

function reportApplySaleScope(array $actor, array $input, array &$where, array &$params, $context) {
    $isManager = $context === 'gerente';
    $shiftExpr = "COALESCE(rvm.turno, u.turno, 'SIN TURNO')";
    $boxExpr = "COALESCE(rvm.caja_id, 'POS-PRINCIPAL')";

    if ($isManager) {
        $from = reportValidDate($input['date_from'] ?? $input['fecha_desde'] ?? '', date('Y-m-01'));
        $to = reportValidDate($input['date_to'] ?? $input['fecha_hasta'] ?? '', date('Y-m-d'));
        if ($from > $to) {
            $swap = $from;
            $from = $to;
            $to = $swap;
        }
        $where[] = 'v.fecha_hora >= :scope_from';
        $where[] = 'v.fecha_hora < DATE_ADD(:scope_to, INTERVAL 1 DAY)';
        $params['scope_from'] = $from . ' 00:00:00';
        $params['scope_to'] = $to . ' 00:00:00';

        $box = reportText($input['caja_id'] ?? $input['caja'] ?? '');
        if ($box !== '') {
            $where[] = $boxExpr . ' = :scope_box';
            $params['scope_box'] = $box;
        }

        $cashier = reportText($input['cajero_id'] ?? $input['cashier_id'] ?? '');
        if ($cashier !== '') {
            $where[] = 'v.usuario_id = :scope_cashier';
            $params['scope_cashier'] = $cashier;
        }

        $shift = reportText($input['turno'] ?? $input['shift'] ?? '');
        if ($shift !== '') {
            $where[] = $shiftExpr . ' = :scope_shift';
            $params['scope_shift'] = $shift;
        }

        return ['date_from' => $from, 'date_to' => $to, 'shift' => $shift];
    }

    $date = reportValidDate($input['date'] ?? $input['fecha'] ?? '', date('Y-m-d'));
    $where[] = 'v.fecha_hora >= :scope_date_from';
    $where[] = 'v.fecha_hora < :scope_date_to';
    $params['scope_date_from'] = $date . ' 00:00:00';
    $params['scope_date_to'] = date('Y-m-d H:i:s', strtotime($date . ' +1 day'));

    // En Caja no se filtra por cajero ni por caja. El único alcance operativo
    // permitido es el turno actual del usuario.
    // El turno del cajero nunca proviene de un filtro manipulable: se toma
    // exclusivamente del usuario autenticado resuelto arriba.
    $shift = reportText($actor['shift']);
    if ($shift !== '') {
        $where[] = $shiftExpr . ' = :scope_shift';
        $params['scope_shift'] = $shift;
    }

    return ['date' => $date, 'shift' => $shift];
}

function reportApplyDetailFilters(array $input, array &$where, array &$params) {
    $payment = reportText($input['metodo_pago'] ?? $input['payment_method'] ?? '');
    if ($payment !== '') {
        $where[] = 'v.metodo_pago = :filter_payment';
        $params['filter_payment'] = $payment;
    }

    $reference = reportText($input['referencia_lote'] ?? $input['reference'] ?? '');
    if ($reference !== '') {
        $where[] = 'COALESCE(rvm.referencia_lote, \'\') LIKE :filter_reference';
        $params['filter_reference'] = '%' . $reference . '%';
    }

    $product = reportText($input['producto_id'] ?? $input['product_id'] ?? '');
    if ($product !== '') {
        $where[] = 'p.id = :filter_product';
        $params['filter_product'] = $product;
    }

    $category = reportText($input['categoria_id'] ?? $input['category_id'] ?? '');
    if ($category !== '') {
        $where[] = 'c.id = :filter_category';
        $params['filter_category'] = $category;
    }

    $status = reportText($input['estatus'] ?? $input['status'] ?? '');
    if ($status !== '') {
        $where[] = "COALESCE(rvm.estatus, 'COMPLETADA') = :filter_status";
        $params['filter_status'] = $status;
    }
}

function reportAudit(PDO $pdo, $type, $action, array $actor, array $input) {
    try {
        $params = $input;
        unset($params['pin'], $params['password']);
        $filterText = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $stmt = $pdo->prepare(
            "INSERT INTO reportes_caja_auditoria
             (tipo_reporte, accion, usuario_id, usuario_nombre, rol_codigo, filtros_consulta)
             VALUES (:tipo, :accion, :usuario_id, :usuario_nombre, :rol, :filtros)"
        );
        $stmt->execute([
            'tipo' => $type,
            'accion' => $action,
            'usuario_id' => $actor['id'],
            'usuario_nombre' => $actor['name'],
            'rol' => $actor['role'],
            'filtros' => $filterText
        ]);
    } catch (Throwable $ignored) {
        // La auditoría no debe interrumpir la consulta del reporte.
    }
}

function reportPaymentLabel($method) {
    $method = trim((string)$method);
    if ($method === '') return 'SIN MÉTODO';
    $key = strtolower(strtr($method, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u']));
    if (in_array($key, ['efectivo', 'cash'], true)) return 'Efectivo';
    if (in_array($key, ['debito', 'tarjeta debito', 'tarjeta de debito'], true)) return 'Tarjeta Débito';
    if (in_array($key, ['credito', 'tarjeta credito', 'tarjeta de credito'], true)) return 'Tarjeta Crédito';
    if (in_array($key, ['pagomovil', 'pago movil'], true)) return 'Pago Móvil';
    return $method;
}
