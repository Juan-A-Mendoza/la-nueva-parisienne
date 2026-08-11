<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - SERVICIO API DE TASA OFICIAL BCV (BCV_RATE.PHP)
   Devuelve la tasa oficial del Banco Central de Venezuela (BCV) en JSON
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Tasa oficial base por defecto de resguardo (fallback)
$defaultRate = 36.50;
$currentRate = $defaultRate;
$source = "Resguardo Oficial BCV";
$fecha = date('d/m/Y');

try {
    // Intentar consultar API de tipo de cambio oficial
    $context = stream_context_create([
        'http' => [
            'timeout' => 3, // 3 segundos tiempo límite
            'user_agent' => 'LaNuevaParisienne/1.0'
        ]
    ]);
    
    $jsonContent = @file_get_contents('https://ve.dolarapi.com/v1/dolares/oficial', false, $context);
    
    if ($jsonContent !== false) {
        $data = json_decode($jsonContent, true);
        if (isset($data['promedio']) && is_numeric($data['promedio']) && $data['promedio'] > 0) {
            $currentRate = floatval($data['promedio']);
            $source = "Banco Central de Venezuela (Oficial API)";
            if (isset($data['fechaActualizacion'])) {
                $fecha = date('d/m/Y', strtotime($data['fechaActualizacion']));
            }
        }
    }
} catch (Exception $e) {
    // Mantener tasa por defecto ante desconexión
}

echo json_encode([
    'success'  => true,
    'rate'     => round($currentRate, 2),
    'currency' => 'VES',
    'symbol'   => 'Bs.',
    'source'   => $source,
    'date'     => $fecha,
    'formatted' => 'Bs. ' . number_format($currentRate, 2, ',', '.') . ' / $1.00 USD'
], JSON_UNESCAPED_UNICODE);
