<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - COMPLETAR HORNEADO E INGRESO A VITRINA (COMPLETAR_HORNEADO.PHP)
   Descarga un lote del horno, registra mermas y suma las unidades al POS
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

$rawInput = preg_replace('/^\xEF\xBB\xBF/', '', file_get_contents('php://input'));
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$ovenId = trim($data['ovenId'] ?? $data['horno_id'] ?? '');
$productCode = trim($data['productCode'] ?? $data['codigo_producto'] ?? '');
$productName = trim($data['productName'] ?? $data['nombre_producto'] ?? '');
$totalBaked = (int)($data['totalBaked'] ?? $data['cantidad_total'] ?? 0);
$wasteQty = (int)($data['wasteQty'] ?? $data['cantidad_merma'] ?? 0);
$wasteReason = trim($data['wasteReason'] ?? $data['motivo_merma'] ?? 'Sin merma');
$bakerName = trim($data['bakerName'] ?? 'Carlos Eduardo Rivas');

if (empty($ovenId) || $totalBaked <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Parámetros inválidos. Se requiere identificación del horno y cantidad horneada mayor a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$netQty = max(0, $totalBaked - $wasteQty);

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // 0. Extraer lote_id del horno antes de limpiarlo
    $stmtGetLote = $pdo->prepare("SELECT lote_id FROM estado_hornos WHERE id = :ovenId");
    $stmtGetLote->execute([':ovenId' => $ovenId]);
    $loteRow = $stmtGetLote->fetch();
    $loteId = !empty($loteRow['lote_id']) ? $loteRow['lote_id'] : null;

    // Si no vino productCode o productName, intentar leerlos del lote
    if ((empty($productCode) || empty($productName)) && $loteId) {
        $stmtLoteInfo = $pdo->prepare("SELECT producto, codigo_producto FROM lotes_produccion WHERE id = :lid");
        $stmtLoteInfo->execute([':lid' => $loteId]);
        $li = $stmtLoteInfo->fetch();
        if ($li) {
            if (empty($productName)) $productName = $li['producto'];
            if (empty($productCode)) $productCode = $li['codigo_producto'] ?? '';
        }
    }

    // 1. Localizar el producto terminado en la tabla `productos` con coincidencia robusta
    $prod = null;
    $cleanName = trim(preg_replace('/^\d+x\s*/i', '', $productName));

    if (!empty($productCode)) {
        $stmtFindCode = $pdo->prepare("SELECT id, codigo, nombre, stock_actual FROM productos WHERE codigo = :code LIMIT 1");
        $stmtFindCode->execute([':code' => $productCode]);
        $prod = $stmtFindCode->fetch();
    }
    if (!$prod && !empty($cleanName)) {
        $stmtFindName = $pdo->prepare("SELECT id, codigo, nombre, stock_actual FROM productos WHERE nombre = :name OR nombre LIKE :likename OR :name2 LIKE CONCAT('%', nombre, '%') OR :cleanname LIKE CONCAT('%', nombre, '%') LIMIT 1");
        $stmtFindName->execute([
            ':name' => $cleanName,
            ':likename' => '%' . $cleanName . '%',
            ':name2' => $productName,
            ':cleanname' => $cleanName
        ]);
        $prod = $stmtFindName->fetch();
    }
    if (!$prod) {
        $pLower = strtolower($cleanName ?: $productName);
        $kw = '';
        if (strpos($pLower, 'baguette') !== false) $kw = 'Baguette';
        elseif (strpos($pLower, 'croissant') !== false) $kw = 'Croissant';
        elseif (strpos($pLower, 'chocolat') !== false) $kw = 'Chocolat';
        elseif (strpos($pLower, 'brioche') !== false) $kw = 'Brioche';
        elseif (strpos($pLower, 'focaccia') !== false) $kw = 'Focaccia';
        elseif (strpos($pLower, 'eclair') !== false || strpos($pLower, 'éclair') !== false) $kw = 'Éclair';
        
        if ($kw) {
            $stmtKw = $pdo->prepare("SELECT id, codigo, nombre, stock_actual FROM productos WHERE nombre LIKE :kw LIMIT 1");
            $stmtKw->execute([':kw' => '%' . $kw . '%']);
            $prod = $stmtKw->fetch();
        }
    }

    $prevStock = 0;
    $newStock = 0;
    $matchedProdCode = $productCode ?: 'PAN-001';
    $matchedProdName = $cleanName ?: $productName;

    if ($prod) {
        $prevStock = (float)$prod['stock_actual'];
        $newStock = $prevStock + $netQty;
        $matchedProdCode = $prod['codigo'];
        $matchedProdName = $prod['nombre'];

        // Actualizar stock en productos MySQL
        $stmtUpdProd = $pdo->prepare("UPDATE productos SET stock_actual = :newStock WHERE id = :id");
        $stmtUpdProd->execute([':newStock' => $newStock, ':id' => $prod['id']]);
    } else {
        // Si no existía en el catálogo previo, insertarlo para que aparezca en POS e Inventario
        $newProdId = 'prod_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $productCode ?: $cleanName));
        $pCode = $productCode ?: ('PAN-' . rand(100, 999));
        $stmtInsProd = $pdo->prepare("INSERT INTO productos (id, codigo, categoria_id, nombre, descripcion, precio_unitario, stock_actual, stock_minimo, unidad_medida, icono, ubicacion) VALUES (:id, :code, 'cat_panaderia', :name, 'Horneado fresco en cocina', 2.50, :stock, 15, 'Und', 'croissant', 'Vitrina POS')");
        $stmtInsProd->execute([
            ':id' => $newProdId,
            ':code' => $pCode,
            ':name' => $cleanName,
            ':stock' => $netQty
        ]);
        $newStock = $netQty;
        $matchedProdCode = $pCode;
        $matchedProdName = $cleanName;
    }

    // 2. Liberar el horno en `estado_hornos`
    $stmtUpdOven = $pdo->prepare("UPDATE estado_hornos SET estado = 'idle', lote_id = NULL, tiempo_restante = 0, tiempo_total = 0, inicio_en = NULL, fin_estimado = NULL WHERE id = :ovenId");
    $stmtUpdOven->execute([':ovenId' => $ovenId]);

    // 3. Marcar lote completado en `lotes_produccion`
    if (!empty($loteId)) {
        $stmtUpdLote = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'Entregado a Vitrina' WHERE id = :loteId");
        $stmtUpdLote->execute([':loteId' => $loteId]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "¡Lote horneado con éxito! Se ingresaron {$netQty} unidades de '{$matchedProdName}' a la vitrina del POS.",
        'ovenId' => $ovenId,
        'productCode' => $matchedProdCode,
        'productName' => $matchedProdName,
        'totalBaked' => $totalBaked,
        'wasteQty' => $wasteQty,
        'wasteReason' => $wasteReason,
        'netQty' => $netQty,
        'previousStock' => $prevStock,
        'newStock' => $newStock,
        'bakerName' => $bakerName,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al procesar descarga de horno en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
