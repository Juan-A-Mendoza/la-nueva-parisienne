<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CONSULTA INTEGRAL DE COCINA Y DEMANDA (GET_ESTADO_COMPLETO.PHP)
   Retorna hornos, lotes en preparación, alertas de vitrina y encargos
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

try {
    $pdo = getDbConnection();

    // 1. Hornos industriales y su lote cargado
    $stmtHornos = $pdo->query("
        SELECT 
            h.id, 
            h.nombre, 
            h.tipo, 
            h.temperatura_actual, 
            h.temperatura_objetivo, 
            h.tiempo_restante, 
            h.tiempo_total, 
            h.estado, 
            h.lote_id,
            h.inicio_en,
            h.fin_estimado,
            TIMESTAMPDIFF(SECOND, NOW(), h.fin_estimado) AS seg_restantes_calc,
            l.codigo AS lote_codigo,
            l.producto AS lote_producto,
            l.codigo_producto AS lote_codigo_producto,
            l.icono AS lote_icono,
            l.cantidad AS lote_cantidad
        FROM estado_hornos h
        LEFT JOIN lotes_produccion l ON h.lote_id = l.id
        ORDER BY h.id ASC
    ");
    $hornosDb = $stmtHornos->fetchAll(PDO::FETCH_ASSOC);

    $hornos = [];
    foreach ($hornosDb as $h) {
        $estado = $h['estado'];
        $remSeconds = (int)($h['tiempo_restante'] ?? 0);
        $totalSeconds = (int)($h['tiempo_total'] > 0 ? $h['tiempo_total'] : 1200);

        // Cálculo dinámico en tiempo real según fin_estimado y TIMESTAMPDIFF de MySQL
        if ($estado === 'baking') {
            if ($h['fin_estimado'] !== null) {
                $diff = (int)$h['seg_restantes_calc'];
                if ($diff <= 0) {
                    $estado = 'ready';
                    $remSeconds = 0;
                    $pdo->prepare("UPDATE estado_hornos SET estado = 'ready', tiempo_restante = 0 WHERE id = :id")->execute([':id' => $h['id']]);
                    if (!empty($h['lote_id'])) {
                        $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'Horneado Listo' WHERE id = :lid")->execute([':lid' => $h['lote_id']]);
                    }
                } else {
                    $remSeconds = $diff;
                    $pdo->prepare("UPDATE estado_hornos SET tiempo_restante = :rem WHERE id = :id")->execute([':rem' => $diff, ':id' => $h['id']]);
                }
            } else {
                if ($remSeconds > 0) {
                    $pdo->prepare("UPDATE estado_hornos SET inicio_en = NOW(), fin_estimado = DATE_ADD(NOW(), INTERVAL :rem SECOND) WHERE id = :id")->execute([':rem' => $remSeconds, ':id' => $h['id']]);
                } else {
                    $estado = 'ready';
                    $remSeconds = 0;
                    $pdo->prepare("UPDATE estado_hornos SET estado = 'ready', tiempo_restante = 0 WHERE id = :id")->execute([':id' => $h['id']]);
                }
            }
        }

        $batch = null;
        if (!empty($h['lote_producto']) || !empty($h['lote_id'])) {
            $batch = [
                'id' => $h['lote_id'],
                'code' => $h['lote_codigo'] ?? 'LOTE-ACTIVO',
                'productName' => $h['lote_producto'] ?? 'Lote en Horneado',
                'productCode' => $h['lote_codigo_producto'] ?? '',
                'icon' => $h['lote_icono'] ?? 'croissant',
                'units' => (int)($h['lote_cantidad'] ?? 50),
                'totalTimeSeconds' => $totalSeconds,
                'remainingSeconds' => $remSeconds
            ];
        }

        $hornos[] = [
            'id' => $h['id'],
            'name' => $h['nombre'],
            'type' => $h['tipo'],
            'currentTemp' => (int)$h['temperatura_actual'],
            'targetTemp' => (int)$h['temperatura_objetivo'],
            'status' => $estado,
            'startTime' => $h['inicio_en'] ? date('c', strtotime($h['inicio_en'])) : null,
            'endTime' => $h['fin_estimado'] ? date('c', strtotime($h['fin_estimado'])) : null,
            'batch' => $batch
        ];
    }

    // 2. Lotes en preparación y leudado (Amasado, Leudado, Listo Horno)
    $stmtLotes = $pdo->query("
        SELECT id, codigo, producto, icono, cantidad, estado_leudado, temperatura_recomendada, tiempo_recomendado_min, creado_en
        FROM lotes_produccion
        WHERE estado_leudado NOT IN ('Entregado a Vitrina', 'Descartado', 'En Horneado Activo', 'Horneado Listo')
          AND (id NOT IN (SELECT lote_id FROM estado_hornos WHERE lote_id IS NOT NULL))
        ORDER BY creado_en DESC
        LIMIT 10
    ");
    $lotesDb = $stmtLotes->fetchAll(PDO::FETCH_ASSOC);

    // 3. Alertas de reposición de vitrina (Stock bajo en POS)
    $stmtAlertas = $pdo->query("
        SELECT id, codigo, nombre, stock_actual, stock_minimo, precio_unitario, categoria_id
        FROM productos
        WHERE stock_actual <= (stock_minimo * 1.2) OR stock_actual <= 15
        ORDER BY (stock_actual / GREATEST(stock_minimo, 1)) ASC
        LIMIT 6
    ");
    $alertasDb = $stmtAlertas->fetchAll(PDO::FETCH_ASSOC);

    $alertasReposicion = [];
    foreach ($alertasDb as $a) {
        $actual = (float)$a['stock_actual'];
        $min = (float)$a['stock_minimo'];
        $isCritical = $actual <= ($min * 0.5) || $actual <= 5;
        $suggestedBatch = max(30, ceil(($min * 2) - $actual));

        $alertasReposicion[] = [
            'id' => $a['id'],
            'code' => $a['codigo'],
            'name' => $a['nombre'],
            'currentStock' => $actual,
            'minStock' => $min,
            'isCritical' => $isCritical,
            'statusText' => $isCritical ? 'Stock Crítico en Mostrador' : 'Stock Bajo (Reponer)',
            'suggestedBatch' => $suggestedBatch,
            'icon' => (stripos($a['nombre'], 'croissant') !== false) ? 'croissant' : ((stripos($a['nombre'], 'café') !== false) ? 'coffee' : 'wheat')
        ];
    }

    // 4. Encargos y pedidos especiales activos (KDS)
    $stmtComandas = $pdo->query("
        SELECT id, numero_factura, detalles_pedido, estado_preparacion, fecha_hora
        FROM comandas_cocina
        WHERE estado_preparacion NOT IN ('delivered', 'archived', 'cancelada')
        ORDER BY fecha_hora DESC
        LIMIT 10
    ");
    $comandasDb = $stmtComandas->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'hornos' => $hornos,
        'lotes' => $lotesDb,
        'alertas_reposicion' => $alertasReposicion,
        'encargos' => $comandasDb,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar estado de cocina en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
