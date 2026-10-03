<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT CONSULTA CONTABLE (GET_ACCOUNTING.PHP)
   Consulta asientos contables, plan de cuentas y balance de comprobación desde MySQL
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

    // 1. Obtener Plan Único de Cuentas (PUC)
    $stmtCuentas = $pdo->query("SELECT codigo AS code, nombre AS name, tipo AS type, naturaleza AS nature FROM plan_cuentas ORDER BY codigo ASC");
    $planCuentas = $stmtCuentas->fetchAll();

    // Crear mapa de nombres de cuentas para acceso rápido
    $cuentasMap = [];
    foreach ($planCuentas as $c) {
        $cuentasMap[$c['code']] = $c['name'];
    }

    // 2. Obtener Asientos Contables
    $stmtAsientos = $pdo->query("
        SELECT id, codigo AS code, DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i') AS date, 
               concepto AS concept, modulo_origen AS sourceModule, icono AS icon, 
               total_debe AS totalDebe, total_haber AS totalHaber 
        FROM asientos_contables 
        ORDER BY fecha_hora DESC, id DESC
    ");
    $asientosRows = $stmtAsientos->fetchAll();

    // 3. Obtener Detalles de todos los Asientos
    $stmtDetalles = $pdo->query("
        SELECT d.asiento_id, d.cuenta_codigo AS accountCode, 
               COALESCE(c.nombre, 'Cuenta Sin Nombre') AS accountName,
               d.debe, d.haber 
        FROM asientos_detalle d
        LEFT JOIN plan_cuentas c ON d.cuenta_codigo = c.codigo
        ORDER BY d.id ASC
    ");
    $detallesRaw = $stmtDetalles->fetchAll();

    $detallesPorAsiento = [];
    foreach ($detallesRaw as $det) {
        $aid = $det['asiento_id'];
        if (!isset($detallesPorAsiento[$aid])) {
            $detallesPorAsiento[$aid] = [];
        }
        $detallesPorAsiento[$aid][] = [
            'accountCode' => $det['accountCode'],
            'accountName' => $det['accountName'],
            'debe' => (float)$det['debe'],
            'haber' => (float)$det['haber']
        ];
    }

    $vouchers = [];
    foreach ($asientosRows as $row) {
        $vouchers[] = [
            'id' => $row['id'],
            'code' => $row['code'],
            'date' => $row['date'],
            'concept' => $row['concept'],
            'sourceModule' => $row['sourceModule'],
            'icon' => $row['icon'] ?: 'receipt',
            'details' => $detallesPorAsiento[$row['id']] ?? [],
            'totalDebe' => (float)$row['totalDebe'],
            'totalHaber' => (float)$row['totalHaber']
        ];
    }

    // 4. Calcular Balance de Comprobación Dinámico agrupado por cuenta
    $stmtBalance = $pdo->query("
        SELECT c.codigo AS code, c.nombre AS name, c.naturaleza,
               COALESCE(SUM(d.debe), 0) AS sumDebe,
               COALESCE(SUM(d.haber), 0) AS sumHaber
        FROM plan_cuentas c
        LEFT JOIN asientos_detalle d ON c.codigo = d.cuenta_codigo
        GROUP BY c.codigo, c.nombre, c.naturaleza
        ORDER BY c.codigo ASC
    ");
    $balanceRaw = $stmtBalance->fetchAll();

    $trialBalance = [];
    foreach ($balanceRaw as $b) {
        $debe = (float)$b['sumDebe'];
        $haber = (float)$b['sumHaber'];
        $isDeudor = strtolower($b['naturaleza']) === 'deudor';
        
        $saldoDeudor = 0.00;
        $saldoAcreedor = 0.00;

        if ($isDeudor) {
            $diff = $debe - $haber;
            if ($diff >= 0) {
                $saldoDeudor = $diff;
            } else {
                $saldoAcreedor = abs($diff);
            }
        } else {
            $diff = $haber - $debe;
            if ($diff >= 0) {
                $saldoAcreedor = $diff;
            } else {
                $saldoDeudor = abs($diff);
            }
        }

        $trialBalance[] = [
            'code' => $b['code'],
            'name' => $b['name'],
            'sumDebe' => round($debe, 2),
            'sumHaber' => round($haber, 2),
            'saldoDeudor' => round($saldoDeudor, 2),
            'saldoAcreedor' => round($saldoAcreedor, 2)
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($vouchers),
        'plan_cuentas' => $planCuentas,
        'vouchers' => $vouchers,
        'trial_balance' => $trialBalance
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos contables desde MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
