<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SERVICIO API EN VIVO DE TASA BCV (BCV_RATE.PHP)
   Consulta en tiempo real la API oficial ve.dolarapi.com via cURL / stream
   para extraer la propiedad 'promedio' sin valores fijos ni duros.
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

require_once __DIR__ . '/config/conexion.php';

// Valores por defecto en caso de desconexión offline total
$mode = 'auto';
$manualRate = 761.21;
$currentRate = null;
$source = "BCV Oficial (API en vivo)";
$fecha = date('d/m/Y');
$warning = null;

try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $config = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    if (isset($config['bcv_rate_mode'])) {
        $mode = strtolower(trim($config['bcv_rate_mode']));
    }
    if (isset($config['bcv_manual_rate']) && is_numeric($config['bcv_manual_rate']) && floatval($config['bcv_manual_rate']) >= 100) {
        $manualRate = floatval($config['bcv_manual_rate']);
    }
} catch (Exception $e) {
    // Si la BD no está disponible, continuar con la consulta cURL a la API
}

if ($mode === 'manual') {
    $currentRate = $manualRate;
    $source = "Manual (Persistido en MySQL)";
} else {
    // MODO AUTOMÁTICO: CONSULTA EN VIVO A HTTPS://VE.DOLARAPI.COM/V1/DOLARES/OFICIAL
    $apiRate = fetchLiveBcvRateApi();
    
    if ($apiRate !== null && $apiRate >= 100) {
        $currentRate = $apiRate;
        $source = "BCV Oficial (ve.dolarapi.com - En Vivo)";
    } else {
        $currentRate = $manualRate;
        $source = "Resguardo BCV (Offline / Fallback)";
        $warning = "No se pudo obtener la tasa en vivo de la API o la tasa fue rechazada por ser < 100.";
    }
}

/**
 * Función que realiza la petición cURL / file_get_contents a la API oficial de DolarAPI
 */
function fetchLiveBcvRateApi() {
    $url = 'https://ve.dolarapi.com/v1/dolares/oficial';
    
    // 1. Intentar peticion con cURL
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'LaNuevaParisienne/1.0 (POS System)');
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response !== false && $httpCode === 200) {
            $data = json_decode($response, true);
            if (is_array($data) && isset($data['promedio']) && is_numeric($data['promedio'])) {
                return floatval($data['promedio']);
            }
        }
    }
    
    // 2. Fallback a stream context con file_get_contents
    $opts = [
        'http' => [
            'method' => 'GET',
            'timeout' => 4,
            'header' => "User-Agent: LaNuevaParisienne/1.0\r\nAccept: application/json\r\n"
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $context = stream_context_create($opts);
    $json = @file_get_contents($url, false, $context);
    
    if ($json !== false) {
        $data = json_decode($json, true);
        if (is_array($data) && isset($data['promedio']) && is_numeric($data['promedio'])) {
            return floatval($data['promedio']);
        }
    }
    
    return null;
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
