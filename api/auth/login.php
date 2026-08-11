<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API DE AUTENTICACIÓN POR PIN (LOGIN.PHP)
   Procesa la validación de credenciales consultando directamente MySQL
   ========================================================================== */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejo de peticiones preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/conexion.php';

// Obtener datos del cuerpo de la petición POST (JSON o Form Data)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$userId = isset($data['userId']) ? trim($data['userId']) : '';
$inputPin = isset($data['inputPin']) ? trim($data['inputPin']) : '';

if (empty($userId) || empty($inputPin)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Parámetros de autenticación incompletos (userId e inputPin requeridos).'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = getDbConnection();
    
    // Consulta SQL preparada contra las tablas usuarios y roles
    $sql = "SELECT u.id, u.nombre, u.email, u.pin, u.icono, u.turno, u.redirect_url, u.estado, 
                   r.codigo AS rol_codigo, r.nombre AS rol_nombre 
            FROM usuarios u 
            INNER JOIN roles r ON u.rol_id = r.id 
            WHERE u.id = :userId AND u.estado = 'active' 
            LIMIT 1";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':userId' => $userId]);
    $userRow = $stmt->fetch();
    
    if (!$userRow) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'El perfil de usuario seleccionado no se encuentra activo o no existe en la base de datos.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    // Validación de PIN
    if ($userRow['pin'] === $inputPin) {
        $token = 'AUTH_MYSQL_' . time() . '_' . bin2hex(random_bytes(6));
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Autenticación exitosa en MySQL',
            'user' => [
                'id' => $userRow['id'],
                'name' => $userRow['nombre'],
                'role' => $userRow['rol_nombre'],
                'roleCode' => $userRow['rol_codigo'],
                'icon' => $userRow['icono'],
                'redirectUrl' => $userRow['redirect_url']
            ],
            'token' => $token,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'PIN de acceso incorrecto. Por favor reintente nuevamente.'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno al procesar autenticación: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
