<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SERVICIO API EN VIVO DE TASA BCV (BCV_RATE.PHP / BCMRATE.PHP)
   Consulta en tiempo real la API oficial ve.dolarapi.com via cURL estricto
   y valida la lectura del campo 'promedio' con fallback a Tasa Manual persisitida.
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

require_once __DIR__ . '/config/conexion.php';

$mode = 'auto';
$manualRate = 761.21;
$currentRate = null;
$source = "BCV Oficial (API en vivo)";
$fecha = date('d/m/Y H:i');
$warning = null;

// 1. Obtener Configuración Persistida desde MySQL (configuracion_empresa / configuraciones)
try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT modo_tasa, tasa_manual FROM configuracion_empresa WHERE id = 1 LIMIT 1");
    $empresaConfig = $stmt->fetch();
    
    if ($empresaConfig) {
        if (!empty($empresaConfig['modo_tasa'])) {
            $mode = strtolower(trim($empresaConfig['modo_tasa']));
        }
        if (isset($empresaConfig['tasa_manual']) && is_numeric($empresaConfig['tasa_manual']) && floatval($empresaConfig['tasa_manual']) >= 100) {
            $manualRate = floatval($empresaConfig['tasa_manual']);
        }
    } else {
        // Fallback a tabla auxiliares configuraciones
        $stmtAux = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
        $aux = $stmtAux->fetchAll(PDO::FETCH_KEY_PAIR);
        if (isset($aux['bcv_rate_mode'])) $mode = strtolower(trim($aux['bcv_rate_mode']));
        if (isset($aux['bcv_manual_rate']) && is_numeric($aux['bcv_manual_rate'])) $manualRate = floatval($aux['bcv_manual_rate']);
    }
} catch (Exception $e) {
    // Si falla la conexión a MySQL, se procede con valores seguros
}

// 2. Lógica de Selección de Tasa (Manual vs Automática via cURL)
if ($mode === 'manual') {
    $currentRate = $manualRate;
    $source = "Tasa Manual (Persistida en MySQL)";
} else {
    // MODO AUTOMÁTICO: CONSULTA cURL A HTTPS://VE.DOLARAPI.COM/V1/DOLARES/OFICIAL
    $apiRate = fetchLiveBcvRateViaCurl();
    
    if ($apiRate !== null && $apiRate >= 100) {
        $currentRate = $apiRate;
        $source = "BCV Oficial (ve.dolarapi.com - En Vivo)";
    } else {
        $currentRate = $manualRate;
        $mode = 'auto_fallback';
        $source = "Resguardo BCV (Offline / Fallback)";
        $warning = "La API de ve.dolarapi.com no respondió o devolvió una tasa inválida (< 100). Usando tasa de resguardo.";
    }
}

/**
 * Consulta cURL robusta a https://ve.dolarapi.com/v1/dolares/oficial
 */
function fetchLiveBcvRateViaCurl() {
    $url = 'https://ve.dolarapi.com/v1/dolares/oficial';
    
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LaNuevaParisienne/1.0');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Cache-Control: no-cache'
        ]);
        
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
    
    // Fallback secundario vía file_get_contents con stream context
    $opts = [
        'http' => [
            'method' => 'GET',
            'timeout' => 5,
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
