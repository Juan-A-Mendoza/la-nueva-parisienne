<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CREAR COMANDA / ENCARGO MANUAL (CREAR_COMANDA.PHP)
   Permite al chef o cajero registrar un pedido especial o comanda para cocina
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

$detalles = trim($data['detalles_pedido'] ?? $data['detalles'] ?? '');
$numeroFactura = trim($data['numero_factura'] ?? $data['numero'] ?? ('ENC-' . date('His')));
$estado = trim($data['estado'] ?? 'pending');

if (empty($detalles)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Se requiere especificar los detalles del pedido o productos.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    $id = 'com_' . time() . '_' . rand(100, 999);
    $now = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO comandas_cocina (id, numero_factura, detalles_pedido, estado_preparacion, fecha_hora) VALUES (:id, :num, :det, :est, :fh)");
    $stmt->execute([
        ':id' => $id,
        ':num' => $numeroFactura,
        ':det' => $detalles,
        ':est' => $estado,
        ':fh' => $now
    ]);

    echo json_encode([
        'success' => true,
        'message' => "Encargo registrado en cocina con éxito ({$numeroFactura}).",
        'comanda' => [
            'id' => $id,
            'numero_factura' => $numeroFactura,
            'detalles_pedido' => $detalles,
            'estado_preparacion' => $estado,
            'fecha_hora' => $now
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear comanda en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
