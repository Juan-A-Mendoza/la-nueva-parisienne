<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SERVICIO API DE TASA MAESTRA BCV (BCV_RATE.PHP)
   Devuelve la tasa oficial del Banco Central de Venezuela respetando los modos
   'auto' (API oficial con validación >= 100) y 'manual' (Persistido en MySQL).
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

require_once __DIR__ . '/config/conexion.php';

// Valores de resguardo por defecto
$mode = 'auto';
$manualRate = 761.21;
$currentRate = $manualRate;
$source = "Resguardo Oficial BCV";
$fecha = date('d/m/Y');
$warning = null;

try {
    $pdo = getDbConnection();
    
    // Consultar configuraciones maestras de tasa en MySQL
    $stmt = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $config = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    if (isset($config['bcv_rate_mode'])) {
        $mode = strtolower(trim($config['bcv_rate_mode']));
    }
    if (isset($config['bcv_manual_rate']) && is_numeric($config['bcv_manual_rate'])) {
        $manualRate = floatval($config['bcv_manual_rate']);
    }
} catch (Exception $e) {
    // Si la BD no está lista, mantener valores de resguardo
}

// LÓGICA DE DECISIÓN DE TASA MAESTRA
if ($mode === 'manual') {
    // MODO MANUAL: Nunca intenta conectar a la API externa
    $currentRate = $manualRate > 0 ? $manualRate : 761.21;
    $source = "Manual (Editada)";
} else {
    // MODO AUTOMÁTICO: Intentar consultar API oficial ve.dolarapi.com
    $apiSuccess = false;
    
    try {
        $context = stream_context_create([
            'http' => [
                'timeout' => 3, // 3 segundos tiempo máximo
                'user_agent' => 'LaNuevaParisienne/1.0'
            ]
        ]);
        
        $jsonContent = @file_get_contents('https://ve.dolarapi.com/v1/dolares/oficial', false, $context);
        
        if ($jsonContent !== false) {
            $data = json_decode($jsonContent, true);
            if (is_array($data) && isset($data['promedio']) && is_numeric($data['promedio'])) {
                $promedio = floatval($data['promedio']);
                
                // VALIDACIÓN DE CRUCE DE SEGURIDAD: Tasa debe ser >= 100
                if ($promedio >= 100) {
                    $currentRate = $promedio;
                    $source = "BCV Oficial (API)";
                    $apiSuccess = true;
                    if (isset($data['fechaActualizacion'])) {
                        $fecha = date('d/m/Y', strtotime($data['fechaActualizacion']));
                    }
                } else {
                    $warning = "La tasa obtenida de la API (" . number_format($promedio, 2) . ") es menor a 100 y fue rechazada por seguridad.";
                }
            } else {
                $warning = "Respuesta de la API no contiene el formato JSON ni la propiedad 'promedio' esperada.";
            }
        } else {
            $warning = "No se pudo establecer conexión con https://ve.dolarapi.com/v1/dolares/oficial.";
        }
    } catch (Exception $e) {
        $warning = "Error al ejecutar la petición a la API BCV: " . $e->getMessage();
    }
    
    // Si el modo auto falla o devuelve tasa < 100, usar respaldo de tasa manual o por defecto
    if (!$apiSuccess) {
        $currentRate = $manualRate > 0 ? $manualRate : 761.21;
        $source = "Resguardo BCV (Offline / Fallback)";
    }
}

echo json_encode([
    'success'   => true,
    'mode'      => $mode,
    'rate'      => round($currentRate, 2),
    'currency'  => 'VES',
    'symbol'    => 'Bs.',
    'source'    => $source,
    'date'      => $fecha,
    'warning'   => $warning,
    'formatted' => 'Bs. ' . number_format($currentRate, 2, ',', '.') . ' / $1.00 USD'
], JSON_UNESCAPED_UNICODE);
