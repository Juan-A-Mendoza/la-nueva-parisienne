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

$rawInput = file_get_contents('php://input');
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

    // 1. Localizar el producto terminado en la tabla `productos`
    $stmtFindProd = $pdo->prepare("SELECT id, codigo, nombre, stock_actual FROM productos WHERE codigo = :code OR nombre LIKE :name LIMIT 1");
    $stmtFindProd->execute([
        ':code' => $productCode,
        ':name' => '%' . $productName . '%'
    ]);
    $prod = $stmtFindProd->fetch();

    $prevStock = 0;
    $newStock = 0;
    $matchedProdName = $productName;

    if ($prod) {
        $prevStock = (float)$prod['stock_actual'];
        $newStock = $prevStock + $netQty;
        $matchedProdName = $prod['nombre'];

        // Actualizar stock en productos
        $stmtUpdProd = $pdo->prepare("UPDATE productos SET stock_actual = :newStock WHERE id = :id");
        $stmtUpdProd->execute([':newStock' => $newStock, ':id' => $prod['id']]);
    }

    // 2. Liberar el horno en `estado_hornos`
    $stmtUpdOven = $pdo->prepare("UPDATE estado_hornos SET estado = 'idle', lote_id = NULL, tiempo_restante = 0, tiempo_total = 0 WHERE id = :ovenId");
    $stmtUpdOven->execute([':ovenId' => $ovenId]);

    // 3. Si hubo lote_id en el horno, marcarlo como completado en `lotes_produccion`
    $stmtGetLote = $pdo->prepare("SELECT lote_id FROM estado_hornos WHERE id = :ovenId");
    $stmtGetLote->execute([':ovenId' => $ovenId]);
    $loteRow = $stmtGetLote->fetch();
    if (!empty($loteRow['lote_id'])) {
        $stmtUpdLote = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'Entregado a Vitrina' WHERE id = :loteId");
        $stmtUpdLote->execute([':loteId' => $loteRow['lote_id']]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "¡Lote horneado con éxito! Se ingresaron {$netQty} unidades de '{$matchedProdName}' a la vitrina del POS.",
        'ovenId' => $ovenId,
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
