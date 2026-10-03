<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT REGISTRO DE ASIENTO MANUAL (CREAR_ASIENTO.PHP)
   Inserta un nuevo asiento contable con partida doble en MySQL
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

$concept = trim($data['concept'] ?? 'Asiento Contable Manual');
$debeCode = trim($data['debeCode'] ?? '');
$debeAmount = (float)($data['debeAmount'] ?? 0);
$haberCode = trim($data['haberCode'] ?? '');
$haberAmount = (float)($data['haberAmount'] ?? 0);

if (empty($debeCode) || empty($haberCode) || $debeAmount <= 0 || $haberAmount <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Cuentas o montos inválidos. Debe y Haber deben ser mayores a cero.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (round($debeAmount, 2) !== round($haberAmount, 2)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Principio de Partida Doble no cumplido: El Debe debe ser igual al Haber.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $asientoId = 'as_man_' . time() . '_' . rand(100, 999);
    $codigo = 'AS-' . date('Y') . '-' . rand(1000, 9999);
    $now = date('Y-m-d H:i:s');

    $stmtAsiento = $pdo->prepare("
        INSERT INTO asientos_contables 
            (id, codigo, fecha_hora, concepto, modulo_origen, icono, total_debe, total_haber) 
        VALUES 
            (:id, :codigo, :fecha, :concepto, 'Manual Administrador', 'file-edit', :debe, :haber)
    ");
    $stmtAsiento->execute([
        ':id' => $asientoId,
        ':codigo' => $codigo,
        ':fecha' => $now,
        ':concepto' => $concept,
        ':debe' => $debeAmount,
        ':haber' => $haberAmount
    ]);

    $stmtDetalle = $pdo->prepare("
        INSERT INTO asientos_detalle (asiento_id, cuenta_codigo, debe, haber) 
        VALUES (:aid, :cuenta, :debe, :haber)
    ");

    // Renglón Débito
    $stmtDetalle->execute([
        ':aid' => $asientoId,
        ':cuenta' => $debeCode,
        ':debe' => $debeAmount,
        ':haber' => 0.00
    ]);

    // Renglón Crédito
    $stmtDetalle->execute([
        ':aid' => $asientoId,
        ':cuenta' => $haberCode,
        ':debe' => 0.00,
        ':haber' => $haberAmount
    ]);

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
