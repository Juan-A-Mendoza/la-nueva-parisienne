<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SERVICIO API EN VIVO DE TASA BCV (BCV_RATE.PHP / BCMRATE.PHP)
   Consulta en tiempo real la API oficial ve.dolarapi.com via cURL estricto,
   normaliza decimales con coma/punto y valida la lectura con fallback a Tasa Manual.
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

// 1. Obtener Configuración Persistida desde MySQL (tabla configuraciones - 2FN)
try {
    $pdo = getDbConnection();
    $stmtAux = $pdo->query("SELECT clave, valor FROM configuraciones WHERE clave IN ('bcv_rate_mode', 'bcv_manual_rate')");
    $aux = $stmtAux->fetchAll(PDO::FETCH_KEY_PAIR);
    if (!empty($aux['bcv_rate_mode'])) {
        $mode = strtolower(trim($aux['bcv_rate_mode']));
    }
    if (isset($aux['bcv_manual_rate'])) {
        $val = floatval(str_replace(',', '.', (string)$aux['bcv_manual_rate']));
        if ($val > 0) {
            $manualRate = $val;
        }
    }
} catch (Exception $e) {
    // Si falla la conexión a MySQL, se procede con valores seguros
}

// 2. Lógica de Selección de Tasa (Manual vs Caché Local vs cURL Rápido)
$cacheFile = __DIR__ . '/cache_bcv.json';
$cacheTtlSeconds = 900; // 15 minutos de caché para evitar consultas lentas a internet

if ($mode === 'manual') {
    $currentRate = $manualRate;
    $source = "Tasa Manual (Definida por Gerencia)";
} else {
    // Verificar si existe caché local reciente para responder en 1 milisegundo
    $cachedData = null;
    if (file_exists($cacheFile)) {
        $rawCache = @file_get_contents($cacheFile);
        if ($rawCache) {
            $cachedData = @json_decode($rawCache, true);
        }
    }

    if ($cachedData && isset($cachedData['rate']) && floatval($cachedData['rate']) > 0 && (time() - intval($cachedData['timestamp'] ?? 0) < $cacheTtlSeconds)) {
        $currentRate = floatval($cachedData['rate']);
        $source = "BCV Oficial (Caché local - Ultra Rápido)";
    } else {
        // MODO AUTOMÁTICO: CONSULTA cURL RÁPIDA (TIMEOUT ESTRICTO DE 2 SEGUNDOS)
        $apiRate = fetchLiveBcvRateViaCurl();
        
        if ($apiRate !== null && $apiRate > 0) {
            $currentRate = $apiRate;
            $source = "BCV Oficial (ve.dolarapi.com - En Vivo)";
            // Guardar en caché local
            @file_put_contents($cacheFile, json_encode([
                'rate' => $currentRate,
                'source' => $source,
                'timestamp' => time()
            ]));
        } elseif ($cachedData && isset($cachedData['rate']) && floatval($cachedData['rate']) > 0) {
            // Si la API externa falló pero tenemos caché previo (aunque sea viejo), lo usamos
            $currentRate = floatval($cachedData['rate']);
            $source = "BCV Oficial (Último registro en caché)";
        } else {
            $currentRate = $manualRate;
            $mode = 'auto_fallback';
            $source = "Resguardo BCV (Offline / Fallback)";
            $warning = "La API en vivo no respondió a tiempo. Usando tasa de resguardo.";
        }
    }
}

/**
 * Consulta cURL robusta a la API oficial con timeout ultrarrápido (máx 2s)
 */
function fetchLiveBcvRateViaCurl() {
    $urls = [
        'https://ve.dolarapi.com/v1/dolares/oficial',
        'https://bcv-api.vercel.app/api/bcv'
    ];
    
    foreach ($urls as $url) {
        $parsed = executeCurlRequest($url);
        if ($parsed !== null && $parsed > 0) {
            return $parsed;
        }
    }
    
    return null;
}

function executeCurlRequest($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
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
            $parsed = parseNumericRateFromJson($data);
            if ($parsed !== null) return $parsed;
        }
    }
    
    // Fallback con stream context y timeout estricto de 2s
    $opts = [
        'http' => [
            'method' => 'GET',
            'timeout' => 2,
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
        return parseNumericRateFromJson($data);
    }
    
    return null;
}

function parseNumericRateFromJson($data) {
    if (!is_array($data)) return null;

    $possibleKeys = ['promedio', 'precio', 'monto', 'price', 'rate'];
    foreach ($possibleKeys as $key) {
        if (isset($data[$key])) {
            $raw = str_replace(',', '.', (string)$data[$key]);
            if (is_numeric($raw) && floatval($raw) > 0) {
                return floatval($raw);
            }
        }
    }

    return null;
}

echo json_encode([
    'success'            => true,
    'mode'               => $mode,
    'promedio'           => floatval($currentRate),
    'rate'               => round($currentRate, 2),
    'currency'           => 'VES',
    'symbol'             => 'Bs.',
    'source'             => $source,
    'date'               => $fecha,
    'fechaActualizacion' => date('c'),
    'warning'            => $warning,
    'formatted'          => 'Bs. ' . number_format($currentRate, 2, ',', '.') . ' / $1.00 USD'
], JSON_UNESCAPED_UNICODE);
