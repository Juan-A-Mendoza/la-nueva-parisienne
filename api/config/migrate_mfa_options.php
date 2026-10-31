<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/conexion.php';

try {
    $pdo = getDbConnection();

    // 1. Verificar y agregar columna mfa_tipo
    $cols = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'mfa_tipo'")->fetchAll();
    if (empty($cols)) {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN mfa_tipo VARCHAR(20) NOT NULL DEFAULT 'totp' AFTER patron_seguridad");
        echo "Columna mfa_tipo agregada exitosamente.\n";
    } else {
        echo "Columna mfa_tipo ya existe.\n";
    }

    // 2. Asegurar que superadmin tenga mfa_tipo = 'ambos' por defecto
    $pdo->exec("UPDATE usuarios SET mfa_tipo = 'ambos' WHERE username = 'superadmin' OR rol_id = 'rol_superadmin'");
    echo "Superadmin configurado con mfa_tipo = 'ambos'.\n";

    // 3. Asegurar que los demás usuarios tengan mfa_tipo = 'totp' si está vacío
    $pdo->exec("UPDATE usuarios SET mfa_tipo = 'totp' WHERE (mfa_tipo IS NULL OR mfa_tipo = '') AND username != 'superadmin'");
    echo "Usuarios actualizados con mfa_tipo = 'totp'.\n";

    // 4. Asegurar que todos tengan un patron_seguridad por defecto
    $pdo->exec("UPDATE usuarios SET patron_seguridad = '0-3-6-7-8' WHERE patron_seguridad IS NULL OR patron_seguridad = ''");
    echo "Patrón por defecto '0-3-6-7-8' asegurado para todos los usuarios.\n";

    // 5. Mostrar estado final
    $users = $pdo->query("SELECT id, username, rol_id, totp_enabled, patron_seguridad, mfa_tipo FROM usuarios")->fetchAll(PDO::FETCH_ASSOC);
    echo "\nEstado actual de usuarios:\n";
    foreach ($users as $u) {
        echo "- {$u['username']} ({$u['rol_id']}): MFA={$u['mfa_tipo']}, TOTP_ACTIVO={$u['totp_enabled']}, PATRÓN={$u['patron_seguridad']}\n";
    }

} catch (Exception $e) {
    echo "Error en migración: " . $e->getMessage() . "\n";
}
