<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MANTENIMIENTO Y ARCHIVADO HISTÓRICO (MANTENIMIENTO.PHP)
   Proporciona diagnósticos de almacenamiento, exportación de respaldos sellados
   y archivado transaccional de registros antiguos hacia bitacora_historico.
   Exclusivo para roles: SUPERADMIN y ADMIN con confirmación de credenciales.
   ========================================================================== */

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

    $action = trim($_GET['action'] ?? ($_POST['action'] ?? 'stats'));

    // --------------------------------------------------------------------------
    // ACCIÓN 1: DIAGNÓSTICO DE ALMACENAMIENTO Y REGISTROS HISTÓRICOS
    // --------------------------------------------------------------------------
    if ($action === 'stats') {
        header("Content-Type: application/json; charset=UTF-8");

        // 1. Estadísticas de la bitácora activa
        $stmtStats = $pdo->query("
            SELECT 
                COUNT(*) as total_activos,
                MIN(creado_en) as fecha_mas_antigua,
                MAX(creado_en) as fecha_mas_reciente,
                SUM(CASE WHEN creado_en < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as mayores_30d,
                SUM(CASE WHEN creado_en < DATE_SUB(NOW(), INTERVAL 60 DAY) THEN 1 ELSE 0 END) as mayores_60d,
                SUM(CASE WHEN creado_en < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as mayores_90d,
                SUM(CASE WHEN creado_en < DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 1 ELSE 0 END) as mayores_180d,
                SUM(CASE WHEN creado_en < DATE_SUB(NOW(), INTERVAL 365 DAY) THEN 1 ELSE 0 END) as mayores_365d
            FROM `bitacora`
        ");
        $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);

        // 2. Verificar existencia y conteo de bitacora_historico
        $totalHistorico = 0;
        $stmtHistCheck = $pdo->query("SHOW TABLES LIKE 'bitacora_historico'");
        if ($stmtHistCheck->fetch()) {
            $stmtHistCount = $pdo->query("SELECT COUNT(*) FROM `bitacora_historico`");
            $totalHistorico = (int)$stmtHistCount->fetchColumn();
        }

        // 3. Estimar tamaño de la tabla en disco (MB)
        $tamanioMb = 0.05;
        try {
            $stmtSize = $pdo->prepare("
                SELECT ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb 
                FROM information_schema.TABLES 
                WHERE table_schema = :db AND table_name = 'bitacora'
            ");
            $stmtSize->execute([':db' => DB_NAME]);
            $sizeVal = $stmtSize->fetchColumn();
            if ($sizeVal !== false) {
                $tamanioMb = (float)$sizeVal;
            }
        } catch (Exception $e) {
            // Ignorar si no hay permisos sobre information_schema
        }

        echo json_encode([
            'success'               => true,
            'total_activos'         => (int)($stats['total_activos'] ?? 0),
            'fecha_mas_antigua'     => $stats['fecha_mas_antigua'] ?: 'N/A',
            'fecha_mas_reciente'    => $stats['fecha_mas_reciente'] ?: 'N/A',
            'mayores_30d'           => (int)($stats['mayores_30d'] ?? 0),
            'mayores_60d'           => (int)($stats['mayores_60d'] ?? 0),
            'mayores_90d'           => (int)($stats['mayores_90d'] ?? 0),
            'mayores_180d'          => (int)($stats['mayores_180d'] ?? 0),
            'mayores_365d'          => (int)($stats['mayores_365d'] ?? 0),
            'total_historico'       => $totalHistorico,
            'tamanio_estimado_mb'   => $tamanioMb
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // --------------------------------------------------------------------------
    // ACCIÓN 2: DESCARGAR RESPALDO SELLADO CRIPTOGRÁFICAMENTE (JSON)
    // --------------------------------------------------------------------------
    if ($action === 'backup_json') {
        $dias = max(0, (int)($_GET['dias'] ?? 90));

        if ($dias > 0) {
            $stmt = $pdo->prepare("SELECT * FROM `bitacora` WHERE creado_en < DATE_SUB(NOW(), INTERVAL :dias DAY) ORDER BY id ASC");
            $stmt->execute([':dias' => $dias]);
            $label = "{$dias}dias";
        } else {
            $stmt = $pdo->query("SELECT * FROM `bitacora` ORDER BY id ASC");
            $label = "completo";
        }

        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular hash manifest de todo el paquete
        $allSignatures = array_column($records, 'hash_firma');
        $manifestHash = hash_hmac('sha256', implode('::', $allSignatures), LNP_AUDIT_SECRET);

        $backupPayload = [
            'empresa'            => 'La Nueva Parisienne C.A.',
            'rif'                => 'J-40123456-7',
            'tipo_respaldo'      => 'AUDITORIA_FORENSE_BITACORA',
            'version_esquema'    => '2.0',
            'algoritmo'          => 'HMAC-SHA256 (Merkle Hash Chaining)',
            'corte_dias'         => $dias,
            'fecha_generacion'   => date('Y-m-d H:i:s'),
            'generado_por'       => $_SESSION['username'] ?? 'Administrador',
            'total_registros'    => count($records),
            'hash_manifiesto'    => $manifestHash,
            'hash_genesis'       => hash('sha256', LNP_GENESIS_HASH),
            'registros'          => $records
        ];

        $filename = "bitacora_backup_lnp_{$label}_" . date('Ymd_His') . ".json";

        header('Content-Type: application/json; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo json_encode($backupPayload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit();
    }

    // --------------------------------------------------------------------------
    // ACCIÓN 3: TRASLADO TRANSACCIONAL A BITACORA_HISTORICO (PURGA SEGURA)
    // --------------------------------------------------------------------------
    if ($action === 'archivar') {
        header("Content-Type: application/json; charset=UTF-8");

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $dias = max(30, (int)($input['dias'] ?? 90));
        $password = trim($input['password'] ?? '');

        if (empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Debe ingresar su contraseña o PIN de administrador para autorizar el archivado.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // 1. Validar contraseña / PIN contra administradores activos
        $stmtUsers = $pdo->query("
            SELECT u.id, u.nombre, u.pin, r.codigo as rol_codigo 
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE r.codigo IN ('ADMIN', 'SUPERADMIN') AND u.estado = 'active'
        ");
        $admins = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

        $authorized = false;
        $authorizedUser = '';
        foreach ($admins as $adm) {
            if (security_verify_password($password, $adm['pin'])) {
                $authorized = true;
                $authorizedUser = $adm['nombre'];
                break;
            }
        }

        if (!$authorized) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña o PIN incorrecto. Operación de archivado denegada.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // 2. Garantizar que la tabla bitacora_historico exista con el mismo esquema
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `bitacora_historico` LIKE `bitacora`;
        ");

        // 3. Ejecutar archivado transaccional
        $pdo->beginTransaction();

        $stmtInsert = $pdo->prepare("
            INSERT INTO `bitacora_historico` 
            SELECT * FROM `bitacora` 
            WHERE creado_en < DATE_SUB(NOW(), INTERVAL :dias DAY)
        ");
        $stmtInsert->execute([':dias' => $dias]);
        $movedCount = $stmtInsert->rowCount();

        if ($movedCount > 0) {
            $stmtDelete = $pdo->prepare("
                DELETE FROM `bitacora` 
                WHERE creado_en < DATE_SUB(NOW(), INTERVAL :dias DAY)
            ");
            $stmtDelete->execute([':dias' => $dias]);
        }

        $pdo->commit();

        // 4. Conteo de registros restantes
        $stmtRemain = $pdo->query("SELECT COUNT(*) FROM `bitacora`");
        $remainCount = (int)$stmtRemain->fetchColumn();

        // 5. Auditar el archivado
        log_bitacora(
            'SEGURIDAD',
            'ARCHIVADO_HISTORICO',
            "Mantenimiento ejecutado por {$authorizedUser}: Se trasladaron {$movedCount} registros con más de {$dias} días a 'bitacora_historico'. Registros activos restantes: {$remainCount}.",
            'WARNING'
        );

        echo json_encode([
            'success'            => true,
            'message'            => "Archivado completado con éxito. Se trasladaron {$movedCount} registros al histórico.",
            'registros_movidos'  => $movedCount,
            'registros_activos'  => $remainCount,
            'dias_corte'         => $dias,
            'autorizado_por'     => $authorizedUser
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    throw new Exception("Acción no válida solicitada al módulo de mantenimiento.");

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en operación de mantenimiento: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
