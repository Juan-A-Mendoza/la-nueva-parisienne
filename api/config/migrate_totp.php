<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/totp.php';

try {
    $pdo = getDbConnection();
    
    // 1. Agregar columnas si no existen
    $cols = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'totp_secret'")->fetchAll();
    if (empty($cols)) {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN totp_secret VARCHAR(64) NULL DEFAULT NULL AFTER pin_maestro");
        echo "Columna totp_secret agregada.\n";
    } else {
        echo "Columna totp_secret ya existe.\n";
    }

    $cols2 = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'totp_enabled'")->fetchAll();
    if (empty($cols2)) {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER totp_secret");
        echo "Columna totp_enabled agregada.\n";
    } else {
        echo "Columna totp_enabled ya existe.\n";
    }

    // 2. Asignar secretos TOTP a los usuarios que no tengan
    $users = $pdo->query("SELECT id, username, rol_id, totp_secret FROM usuarios")->fetchAll(PDO::FETCH_ASSOC);
    $updateStmt = $pdo->prepare("UPDATE usuarios SET totp_secret = :sec, totp_enabled = 1 WHERE id = :id");

    foreach ($users as $u) {
        if (empty($u['totp_secret'])) {
            // Secret determinista y predecible pero seguro para entorno local de pruebas
            // O un secreto aleatorio estándar de 16 caracteres
            $newSecret = TOTP::generateSecret(16);
            $updateStmt->execute([
                ':sec' => $newSecret,
                ':id' => $u['id']
            ]);
            echo "Usuario {$u['username']} ({$u['id']}) configurado con secreto TOTP: {$newSecret}\n";
        } else {
            echo "Usuario {$u['username']} ya tiene secreto: {$u['totp_secret']}\n";
        }
    }

    echo "Migración TOTP completada con éxito.\n";
} catch (Exception $e) {
    echo "Error en migración: " . $e->getMessage() . "\n";
}
