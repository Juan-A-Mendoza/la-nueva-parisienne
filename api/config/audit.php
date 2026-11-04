<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - MÓDULO CENTRAL DE AUDITORÍA Y BITÁCORA (AUDIT.PHP)
   Registra operaciones críticas, cambios de estado y eventos de seguridad.
   Incluye Cadena de Custodia Criptográfica (HMAC-SHA256 Hash Chaining) anti-tampering.
   ========================================================================== */

if (!defined('LNP_AUDIT_SECRET')) {
    define('LNP_AUDIT_SECRET', getenv('LNP_AUDIT_SECRET') ?: 'lnp_sec_audit_ledger_key_2026_9882a7f0c1e45b');
}

if (!defined('LNP_GENESIS_HASH')) {
    define('LNP_GENESIS_HASH', 'GENESIS_LNP_PARISIENNE_2026_0000000000000000000000000000000000000000');
}

/**
 * Calcula la firma criptográfica HMAC-SHA256 encadenada de un registro.
 */
function compute_bitacora_hash(
    string $prevHash,
    string $userId,
    string $usuario,
    string $rol,
    string $modulo,
    string $accion,
    string $descripcion,
    string $severidad,
    ?string $jsonPrevios,
    ?string $jsonNuevos,
    string $ip,
    string $creadoEn
): string {
    $dataToSign = implode('||', [
        $prevHash,
        trim($userId),
        trim($usuario),
        strtoupper(trim($rol)),
        strtoupper(trim($modulo)),
        strtoupper(trim($accion)),
        trim($descripcion),
        strtoupper(trim($severidad)),
        $jsonPrevios ?? '',
        $jsonNuevos ?? '',
        trim($ip),
        trim($creadoEn)
    ]);

    return hash_hmac('sha256', $dataToSign, LNP_AUDIT_SECRET);
}

/**
 * Garantiza que la tabla de bitácora exista y posea las columnas criptográficas.
 * Se ejecuta de forma idempotente con bajo costo.
 */
function ensure_bitacora_table(PDO $pdo): void {
    static $checked = false;
    if ($checked) return;

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `bitacora` (
                `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `user_id` VARCHAR(50) NULL,
                `usuario` VARCHAR(100) NOT NULL,
                `rol` VARCHAR(50) NOT NULL,
                `modulo` VARCHAR(50) NOT NULL,
                `accion` VARCHAR(50) NOT NULL,
                `descripcion` TEXT NOT NULL,
                `severidad` ENUM('INFO', 'WARNING', 'DANGER') NOT NULL DEFAULT 'INFO',
                `datos_previos` LONGTEXT NULL,
                `datos_nuevos` LONGTEXT NULL,
                `ip_origen` VARCHAR(45) NOT NULL,
                `user_agent` VARCHAR(255) NULL,
                `hash_previo` VARCHAR(64) NULL,
                `hash_firma` VARCHAR(64) NULL,
                `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_modulo_accion` (`modulo`, `accion`),
                INDEX `idx_usuario` (`user_id`),
                INDEX `idx_fecha` (`creado_en`),
                INDEX `idx_severidad` (`severidad`),
                INDEX `idx_hash_firma` (`hash_firma`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Verificar columnas hash_previo y hash_firma para migraciones dinámicas
        $stmtChk = $pdo->query("SHOW COLUMNS FROM `bitacora` LIKE 'hash_firma'");
        if (!$stmtChk->fetch()) {
            $pdo->exec("
                ALTER TABLE `bitacora` 
                ADD COLUMN `hash_previo` VARCHAR(64) NULL AFTER `user_agent`,
                ADD COLUMN `hash_firma` VARCHAR(64) NULL AFTER `hash_previo`,
                ADD INDEX `idx_hash_firma` (`hash_firma`);
            ");
        }

        // Sellar automáticamente registros históricos sin hash
        seal_legacy_bitacora_records($pdo);

        $checked = true;
    } catch (Exception $e) {
        error_log('[LNP AUDIT DDL ERROR] ' . $e->getMessage());
    }
}

/**
 * Sella cronológicamente registros antiguos que aún no tenían firma criptográfica
 */
function seal_legacy_bitacora_records(PDO $pdo): void {
    try {
        $stmtUnsealed = $pdo->query("SELECT * FROM `bitacora` WHERE `hash_firma` IS NULL OR `hash_firma` = '' ORDER BY `id` ASC");
        $rows = $stmtUnsealed->fetchAll(PDO::FETCH_ASSOC);
        if (empty($rows)) return;

        $stmtPrev = $pdo->query("SELECT `hash_firma` FROM `bitacora` WHERE `hash_firma` IS NOT NULL AND `hash_firma` != '' ORDER BY `id` DESC LIMIT 1");
        $runningHash = $stmtPrev->fetchColumn() ?: hash('sha256', LNP_GENESIS_HASH);

        $stmtUpd = $pdo->prepare("UPDATE `bitacora` SET `hash_previo` = :prev, `hash_firma` = :firma WHERE `id` = :id");

        foreach ($rows as $r) {
            $h = compute_bitacora_hash(
                $runningHash,
                $r['user_id'] ?? '',
                $r['usuario'],
                $r['rol'],
                $r['modulo'],
                $r['accion'],
                $r['descripcion'],
                $r['severidad'],
                $r['datos_previos'],
                $r['datos_nuevos'],
                $r['ip_origen'],
                $r['creado_en']
            );

            $stmtUpd->execute([
                ':prev' => $runningHash,
                ':firma' => $h,
                ':id' => $r['id']
            ]);

            $runningHash = $h;
        }
    } catch (Exception $e) {
        error_log('[LNP AUDIT SEAL ERROR] ' . $e->getMessage());
    }
}

/**
 * Registra una entrada en la bitácora de auditoría con sello criptográfico encadenado.
 *
 * @param string      $modulo       Módulo de origen (AUTH, INVENTARIO, POS, PROVEEDORES, etc.)
 * @param string      $accion       Acción realizada (LOGIN, AJUSTE_STOCK, CAMBIO_PRECIO, etc.)
 * @param string      $descripcion  Explicación legible para humanos del evento
 * @param string      $severidad    INFO, WARNING o DANGER
 * @param array|null  $datosPrevios Datos antes de la modificación (diff)
 * @param array|null  $datosNuevos  Datos después de la modificación (diff)
 * @param string|null $userId       ID de usuario explícito (opcional, se toma de $_SESSION)
 * @param string|null $usuario      Nombre de usuario explícito (opcional, se toma de $_SESSION)
 * @param string|null $rol          Rol del usuario explícito (opcional, se toma de $_SESSION)
 * @return bool True si se registró con éxito, false en caso contrario
 */
function log_bitacora(
    string $modulo,
    string $accion,
    string $descripcion,
    string $severidad = 'INFO',
    ?array $datosPrevios = null,
    ?array $datosNuevos = null,
    ?string $userId = null,
    ?string $usuario = null,
    ?string $rol = null
): bool {
    try {
        if (!function_exists('getDbConnection')) {
            require_once __DIR__ . '/conexion.php';
        }

        $pdo = getDbConnection();
        ensure_bitacora_table($pdo);

        // 1. Resolver usuario y rol de la sesión actual si no se pasaron explícitamente
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            @session_start();
        }

        $finalUserId = $userId 
            ?: ($_SESSION['user_id'] ?? ($_SESSION['lnp_2fa_pending']['user_id'] ?? ($_SESSION['lnp_3fa_pending']['user_id'] ?? null)));
        
        $finalUsuario = $usuario 
            ?: ($_SESSION['username'] ?? ($_SESSION['user_name'] ?? ($_SESSION['lnp_2fa_pending']['username'] ?? ($_SESSION['lnp_3fa_pending']['username'] ?? 'Sistema / Anónimo'))));

        $finalRol = $rol 
            ?: ($_SESSION['role_code'] ?? ($_SESSION['role'] ?? ($_SESSION['lnp_2fa_pending']['roleCode'] ?? ($_SESSION['lnp_3fa_pending']['roleCode'] ?? 'INVITADO'))));

        // 2. Normalizar severidad
        $validSeverities = ['INFO', 'WARNING', 'DANGER'];
        $severidadUpper = strtoupper($severidad);
        if (!in_array($severidadUpper, $validSeverities, true)) {
            $severidadUpper = 'INFO';
        }

        // 3. Capturar IP y User Agent
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
        if (strpos($ip, ',') !== false) {
            $ipParts = explode(',', $ip);
            $ip = trim($ipParts[0]);
        }
        $ip = substr($ip, 0, 45);

        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido', 0, 255);

        // 4. Serializar JSON seguro para diff
        $jsonPrevios = null;
        if ($datosPrevios !== null && !empty($datosPrevios)) {
            $jsonPrevios = json_encode($datosPrevios, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $jsonNuevos = null;
        if ($datosNuevos !== null && !empty($datosNuevos)) {
            $jsonNuevos = json_encode($datosNuevos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        // 5. Cadena de Custodia: Obtener hash de la última fila insertada
        $stmtLast = $pdo->query("SELECT `hash_firma` FROM `bitacora` WHERE `hash_firma` IS NOT NULL AND `hash_firma` != '' ORDER BY `id` DESC LIMIT 1");
        $prevHash = $stmtLast->fetchColumn() ?: hash('sha256', LNP_GENESIS_HASH);

        $creadoEn = date('Y-m-d H:i:s');
        $hashFirma = compute_bitacora_hash(
            $prevHash,
            $finalUserId ?: '',
            $finalUsuario,
            $finalRol,
            $modulo,
            $accion,
            $descripcion,
            $severidadUpper,
            $jsonPrevios,
            $jsonNuevos,
            $ip,
            $creadoEn
        );

        // 6. Inserción preparada con sello criptográfico
        $stmt = $pdo->prepare("
            INSERT INTO `bitacora` (
                `user_id`, `usuario`, `rol`, `modulo`, `accion`, 
                `descripcion`, `severidad`, `datos_previos`, `datos_nuevos`, 
                `ip_origen`, `user_agent`, `hash_previo`, `hash_firma`, `creado_en`
            ) VALUES (
                :user_id, :usuario, :rol, :modulo, :accion, 
                :descripcion, :severidad, :datos_previos, :datos_nuevos, 
                :ip_origen, :user_agent, :hash_previo, :hash_firma, :creado_en
            )
        ");

        $stmt->execute([
            ':user_id'       => $finalUserId ? substr($finalUserId, 0, 50) : null,
            ':usuario'       => substr($finalUsuario, 0, 100),
            ':rol'           => substr(strtoupper($finalRol), 0, 50),
            ':modulo'        => substr(strtoupper($modulo), 0, 50),
            ':accion'        => substr(strtoupper($accion), 0, 50),
            ':descripcion'   => $descripcion,
            ':severidad'     => $severidadUpper,
            ':datos_previos' => $jsonPrevios,
            ':datos_nuevos'  => $jsonNuevos,
            ':ip_origen'     => $ip,
            ':user_agent'    => $userAgent,
            ':hash_previo'   => $prevHash,
            ':hash_firma'    => $hashFirma,
            ':creado_en'     => $creadoEn
        ]);

        return true;

    } catch (Exception $e) {
        error_log('[LNP AUDIT LOG EXCEPTION] ' . $e->getMessage());
        return false;
    }
}
