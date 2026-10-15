<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT REGISTRO DE ASIENTO MANUAL (CREAR_ASIENTO.PHP)
   Inserta un nuevo asiento contable con partida doble en MySQL
   ========================================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

// Verificación RBAC: Solo Contabilidad y Gerencia pueden registrar asientos contables
require_auth(['ADMIN', 'SUPERADMIN', 'ACCOUNTANT']);

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$concept = trim($data['concept'] ?? 'Asiento Contable Manual');
$fechaInput = trim($data['date'] ?? $data['fecha'] ?? '');
$fechaHora = !empty($fechaInput) ? date('Y-m-d H:i:s', strtotime($fechaInput)) : date('Y-m-d H:i:s');
$sourceModule = trim($data['sourceModule'] ?? 'Manual Contador');
$icon = trim($data['icon'] ?? 'file-edit');

$items = [];

// Si se envía array de renglones/items
if (!empty($data['items']) && is_array($data['items'])) {
    foreach ($data['items'] as $item) {
        $cCode = trim($item['accountCode'] ?? $item['cuenta_codigo'] ?? '');
        $d = (float)($item['debe'] ?? 0);
        $h = (float)($item['haber'] ?? 0);
        if (!empty($cCode) && ($d > 0 || $h > 0)) {
            $items[] = [
                'code' => $cCode,
                'debe' => round($d, 2),
                'haber' => round($h, 2)
            ];
        }
    }
} else {
    // Modo simple de 2 partidas
    $debeCode = trim($data['debeCode'] ?? '');
    $debeAmount = (float)($data['debeAmount'] ?? 0);
    $haberCode = trim($data['haberCode'] ?? '');
    $haberAmount = (float)($data['haberAmount'] ?? 0);

    if (!empty($debeCode) && $debeAmount > 0) {
        $items[] = ['code' => $debeCode, 'debe' => round($debeAmount, 2), 'haber' => 0.00];
    }
    if (!empty($haberCode) && $haberAmount > 0) {
        $items[] = ['code' => $haberCode, 'debe' => 0.00, 'haber' => round($haberAmount, 2)];
    }
}

if (empty($items) || count($items) < 2) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'El asiento requiere al menos dos partidas contables (débito y crédito).'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$totalDebe = 0.00;
$totalHaber = 0.00;
foreach ($items as $it) {
    $totalDebe += $it['debe'];
    $totalHaber += $it['haber'];
}

$totalDebe = round($totalDebe, 2);
$totalHaber = round($totalHaber, 2);

if ($totalDebe <= 0 || $totalHaber <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Montos inválidos. El total de débitos y créditos debe ser superior a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (abs($totalDebe - $totalHaber) > 0.01) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Principio de Partida Doble no cumplido: Total Debe ($' . number_format($totalDebe, 2) . ') debe ser igual al Total Haber ($' . number_format($totalHaber, 2) . ').'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // Generar código correlativo de Asiento
    $stmtSeq = $pdo->query("SELECT COUNT(*) AS total FROM asientos_contables");
    $seqRow = $stmtSeq->fetch();
    $seqNum = ($seqRow ? (int)$seqRow['total'] : 0) + 1;
    $codigo = 'AS-' . date('Y') . '-' . str_pad($seqNum, 4, '0', STR_PAD_LEFT);

    // Verificar unicidad por si acaso
    $stmtCheck = $pdo->prepare("SELECT id FROM asientos_contables WHERE codigo = :c");
    $stmtCheck->execute([':c' => $codigo]);
    if ($stmtCheck->fetch()) {
        $codigo .= '-' . rand(10, 99);
    }

    $asientoId = 'as_man_' . time() . '_' . rand(100, 999);

    $stmtAsiento = $pdo->prepare("
        INSERT INTO asientos_contables 
            (id, codigo, fecha_hora, concepto, modulo_origen, icono, total_debe, total_haber) 
        VALUES 
            (:id, :codigo, :fecha, :concepto, :origen, :icono, :debe, :haber)
    ");
    $stmtAsiento->execute([
        ':id' => $asientoId,
        ':codigo' => $codigo,
        ':fecha' => $fechaHora,
        ':concepto' => $concept,
        ':origen' => $sourceModule,
        ':icono' => $icon,
        ':debe' => $totalDebe,
        ':haber' => $totalHaber
    ]);

    $stmtDetalle = $pdo->prepare("
        INSERT INTO asientos_detalle (asiento_id, cuenta_codigo, debe, haber) 
        VALUES (:aid, :cuenta, :debe, :haber)
    ");

    foreach ($items as $it) {
        $stmtDetalle->execute([
            ':aid' => $asientoId,
            ':cuenta' => $it['code'],
            ':debe' => $it['debe'],
            ':haber' => $it['haber']
        ]);
    }

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Asiento contable registrado con éxito en MySQL.',
        'asientoId' => $asientoId,
        'codigo' => $codigo
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar el asiento contable: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
