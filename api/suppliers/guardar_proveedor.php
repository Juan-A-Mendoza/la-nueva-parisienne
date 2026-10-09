<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - REGISTRAR NUEVO PROVEEDOR (GUARDAR_PROVEEDOR.PHP)
   Inserta un nuevo contacto comercial en la tabla proveedores de MySQL
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
if (!$data) $data = $_POST;

$name = trim($data['name'] ?? $data['nombre'] ?? $data['nombre_empresa'] ?? '');
$category = trim($data['category'] ?? $data['categoria'] ?? 'Insumos Generales');
$contact = trim($data['contactPerson'] ?? $data['contact'] ?? $data['contacto'] ?? '');
$phone = trim($data['phone'] ?? $data['telefono'] ?? '');
$email = trim($data['email'] ?? $data['correo'] ?? '');
$rif = trim($data['rif'] ?? ('J-' . rand(10000000, 99999999) . '-' . rand(0, 9)));
$address = trim($data['address'] ?? $data['direccion'] ?? 'Barquisimeto, Edo. Lara');
$paymentTerms = trim($data['paymentTerms'] ?? $data['condicion_pago'] ?? 'Crédito 30 días');
$icon = trim($data['icon'] ?? $data['icono'] ?? 'building-2');

if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el nombre y teléfono del proveedor.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();

    // Generar código
    $stmtCount = $pdo->query("SELECT COUNT(*) FROM proveedores");
    $count = (int)$stmtCount->fetchColumn();
    $code = 'PROV-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $id = 'sup_' . str_pad($count + 1, 2, '0', STR_PAD_LEFT);

    $stmtIns = $pdo->prepare("
        INSERT INTO proveedores 
            (id, codigo, nombre, categoria, contacto, telefono, email, rif, direccion, condicion_pago, calificacion, icono)
        VALUES
            (:id, :code, :name, :cat, :contact, :phone, :email, :rif, :addr, :terms, 5.0, :icon)
    ");
    $stmtIns->execute([
        ':id' => $id,
        ':code' => $code,
        ':name' => $name,
        ':cat' => $category,
        ':contact' => $contact,
        ':phone' => $phone,
        ':email' => $email,
        ':rif' => $rif,
        ':addr' => $address,
        ':terms' => $paymentTerms,
        ':icon' => $icon
    ]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Proveedor '{$name}' ({$code}) registrado con éxito en MySQL.",
        'supplier' => [
            'id' => $id,
            'code' => $code,
            'name' => $name,
            'category' => $category,
            'contactPerson' => $contact,
            'phone' => $phone,
            'email' => $email,
            'rif' => $rif,
            'address' => $address,
            'paymentTerms' => $paymentTerms,
            'rating' => '5.0',
            'icon' => $icon
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar proveedor en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
