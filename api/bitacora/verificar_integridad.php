<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - VERIFICADOR DE INTEGRIDAD FORENSE (VERIFICAR_INTEGRIDAD.PHP)
   Ejecuta la validación matemática de la Cadena de Custodia Criptográfica (HMAC-SHA256)
   en toda la bitácora de auditoría. Detecta registros alterados, eliminados o inyectados.
   Exclusivo para roles: ADMIN y SUPERADMIN.
   ========================================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

// Verificación RBAC: Solo Superadmin y Administrador / Auditor
require_auth(['ADMIN', 'SUPERADMIN']);

try {
    $pdo = getDbConnection();
    ensure_bitacora_table($pdo);

    $startTime = microtime(true);

    // 1. Obtener todos los registros en estricto orden cronológico ascendente
    $stmt = $pdo->query("
        SELECT 
            id, user_id, usuario, rol, modulo, accion, 
            descripcion, severidad, datos_previos, datos_nuevos, 
            ip_origen, hash_previo, hash_firma, creado_en 
        FROM `bitacora` 
        ORDER BY id ASC
    ");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalRecords = count($logs);
    $verifiedCount = 0;
    $anomalies = [];

    $expectedPrevHash = hash('sha256', LNP_GENESIS_HASH);
    $latestSeal = $expectedPrevHash;

    foreach ($logs as $row) {
        $rowId = (int)$row['id'];
        $storedPrev = (string)($row['hash_previo'] ?? '');
        $storedSign = (string)($row['hash_firma'] ?? '');

        // Validación 1: Verificar enlace de continuidad con el bloque previo
        $continuityValid = hash_equals($expectedPrevHash, $storedPrev);

        // Validación 2: Recalcular firma criptográfica de los datos almacenados
        $recalculatedHash = compute_bitacora_hash(
            $expectedPrevHash,
            $row['user_id'] ?? '',
            $row['usuario'] ?? '',
            $row['rol'] ?? '',
            $row['modulo'] ?? '',
            $row['accion'] ?? '',
            $row['descripcion'] ?? '',
            $row['severidad'] ?? 'INFO',
            $row['datos_previos'],
            $row['datos_nuevos'],
            $row['ip_origen'] ?? '',
            $row['creado_en'] ?? ''
        );

        $signatureValid = hash_equals($recalculatedHash, $storedSign);

        if (!$continuityValid || !$signatureValid) {
            $reason = [];
            if (!$continuityValid) {
                $reason[] = "Ruptura de continuidad (hash_previo inválido o registro previo eliminado/insertado).";
            }
            if (!$signatureValid) {
                $reason[] = "Firma HMAC alterada (datos del registro modificados directamente en base de datos).";
            }

            $anomalies[] = [
                'id'             => $rowId,
                'usuario'        => $row['usuario'],
                'modulo'         => $row['modulo'],
                'accion'         => $row['accion'],
                'creado_en'      => $row['creado_en'],
                'motivo'         => implode(' ', $reason),
                'hash_previo_db' => $storedPrev,
                'hash_previo_exp'=> $expectedPrevHash,
                'hash_firma_db'  => $storedSign,
                'hash_firma_calc'=> $recalculatedHash
            ];

            // Para continuar analizando los subsiguientes, actualizamos el puntero al almacenado
            $expectedPrevHash = !empty($storedSign) ? $storedSign : $recalculatedHash;
        } else {
            $verifiedCount++;
            $expectedPrevHash = $storedSign;
        }

        $latestSeal = $storedSign;
    }

    $durationMs = round((microtime(true) - $startTime) * 1000, 2);

    $isCompromised = count($anomalies) > 0;
    $status = ($totalRecords === 0) ? 'VACIA' : ($isCompromised ? 'COMPROMETIDA' : 'INTEGRA');

    $currentUser = $_SESSION['username'] ?? ($_SESSION['user_name'] ?? 'Administrador');

    // Registrar en la propia bitácora la auditoría realizada
    if ($totalRecords > 0) {
        $descAuditoria = $isCompromised
            ? "ALERTA FORENSE: Verificación criptográfica completada con {$verifiedCount}/{$totalRecords} registros válidos y " . count($anomalies) . " anomalías detectadas en {$durationMs}ms."
            : "Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra ({$verifiedCount} registros verificados en {$durationMs}ms).";
        
        log_bitacora(
            'SEGURIDAD',
            'VERIFICACION_INTEGRIDAD',
            $descAuditoria,
            $isCompromised ? 'DANGER' : 'INFO'
        );
    }

    echo json_encode([
        'success'           => true,
        'status'            => $status, // INTEGRA | COMPROMETIDA | VACIA
        'total_registros'   => $totalRecords,
        'registros_validos' => $verifiedCount,
        'registros_danados' => count($anomalies),
        'anomalias'         => $anomalies,
        'tiempo_ms'         => $durationMs,
        'algoritmo'         => 'HMAC-SHA256 (Merkle Hash Chaining)',
        'hash_genesis'      => hash('sha256', LNP_GENESIS_HASH),
        'ultimo_sello'      => $latestSeal,
        'verificado_en'     => date('Y-m-d H:i:s'),
        'verificado_por'    => $currentUser
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error durante el análisis forense de la bitácora: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
