<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - GESTIÓN INTEGRAL DE LOTES DE PRODUCCIÓN (GESTIONAR_LOTE.PHP)
   Permite crear lotes manuales, avanzar fases (Amasado->Leudado->Listo) o descartar
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

$action = trim($data['action'] ?? 'advance');

try {
    $pdo = getDbConnection();

    if ($action === 'create') {
        $producto = trim($data['producto'] ?? 'Pan Artesanal');
        $cantidad = (int)($data['cantidad'] ?? 50);
        $temp = (int)($data['temperatura_recomendada'] ?? 200);
        $tiempoMin = (int)($data['tiempo_recomendado_min'] ?? 20);
        $icono = trim($data['icono'] ?? 'croissant');
        
        $batchId = 'batch_' . time() . '_' . rand(100, 999);
        $batchCode = 'Lote #' . date('d') . '-' . rand(10, 99);

        $stmt = $pdo->prepare("INSERT INTO lotes_produccion (id, codigo, producto, icono, cantidad, estado_leudado, temperatura_recomendada, tiempo_recomendado_min) VALUES (:id, :code, :prod, :ico, :qty, 'Amasado y División en Mesa', :temp, :timeMin)");
        $stmt->execute([
            ':id' => $batchId,
            ':code' => $batchCode,
            ':prod' => $producto,
            ':ico' => $icono,
            ':qty' => $cantidad,
            ':temp' => $temp,
            ':timeMin' => $tiempoMin
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Lote {$batchCode} creado en producción.",
            'lote' => [
                'id' => $batchId,
                'codigo' => $batchCode,
                'producto' => $producto,
                'icono' => $icono,
                'cantidad' => $cantidad,
                'estado_leudado' => 'Amasado y División en Mesa',
                'temperatura_recomendada' => $temp,
                'tiempo_recomendado_min' => $tiempoMin
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'advance') {
        $loteId = trim($data['id'] ?? $data['lote_id'] ?? '');
        $nuevaFase = (int)($data['fase'] ?? 2); // 2: Leudado, 3: Listo Horno
        $nuevoEstado = trim($data['estado_leudado'] ?? ($nuevaFase === 2 ? 'En Cámara de Fermentación' : 'Leudado Completo (Listo para Horno)'));

        if (empty($loteId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de lote no proporcionado.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = :est WHERE id = :id");
        $stmt->execute([':est' => $nuevoEstado, ':id' => $loteId]);

        echo json_encode([
            'success' => true,
            'message' => "Fase del lote actualizada a {$nuevoEstado}.",
            'loteId' => $loteId,
            'estado_leudado' => $nuevoEstado,
            'fase' => $nuevaFase
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'discard') {
        $loteId = trim($data['id'] ?? $data['lote_id'] ?? '');
        if (empty($loteId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de lote no proporcionado.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Marcar como descartado para historial o eliminar
        $stmt = $pdo->prepare("UPDATE lotes_produccion SET estado_leudado = 'Descartado' WHERE id = :id");
        $stmt->execute([':id' => $loteId]);

        echo json_encode([
            'success' => true,
            'message' => "Lote descartado de producción.",
            'loteId' => $loteId
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción no reconocida.'], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al gestionar lote en MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
