<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/conexion.php';

try {
    $pdo = getDbConnection();
    $cols = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'patron_seguridad'")->fetchAll();
    if (empty($cols)) {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN patron_seguridad VARCHAR(64) NULL DEFAULT '0-3-6-7-8' AFTER totp_enabled");
        echo "Columna patron_seguridad agregada.\n";
    } else {
        echo "Columna patron_seguridad ya existe.\n";
    }

    $pdo->exec("UPDATE usuarios SET patron_seguridad = '0-3-6-7-8' WHERE username = 'superadmin' AND (patron_seguridad IS NULL OR patron_seguridad = '')");
    echo "Patrón de Superadmin configurado con éxito (por defecto '0-3-6-7-8', forma de 'L').\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
