<?php
require_once __DIR__ . '/../api/config/conexion.php';

try {
    $pdo = getDbConnection();
    
    // 1. Ampliar columna pin a VARCHAR(255) para soportar hashes bcrypt seguros
    echo "1. Ampliando columna 'pin' a VARCHAR(255)...\n";
    $pdo->exec("ALTER TABLE usuarios MODIFY COLUMN pin VARCHAR(255) NOT NULL");
    echo "Columna 'pin' ampliada con éxito.\n\n";

    // 2. Buscar usuarios con contraseñas en texto plano
    $stmt = $pdo->query("SELECT id, username, nombre, pin FROM usuarios");
    $users = $stmt->fetchAll();

    $migrated = 0;
    $alreadyHashed = 0;

    $stmtUpd = $pdo->prepare("UPDATE usuarios SET pin = :hash WHERE id = :id");

    echo "2. Hasheando contraseñas en texto plano con BCRYPT:\n";
    foreach ($users as $u) {
        $currentPin = (string)$u['pin'];
        // Los hashes de bcrypt comienzan con $2y$, $2a$ o $2b$ y tienen longitud >= 60
        if (preg_match('/^\$2[ayb]\$\d{2}\$[A-Za-z0-9\.\/]{53}$/', $currentPin)) {
            $alreadyHashed++;
            echo " - [YA HASHEADO] {$u['id']} ({$u['nombre']})\n";
        } else {
            $hash = password_hash($currentPin, PASSWORD_BCRYPT, ['cost' => 10]);
            $stmtUpd->execute([':hash' => $hash, ':id' => $u['id']]);
            $migrated++;
            echo " - [MIGRADO A BCRYPT] {$u['id']} ({$u['nombre']}) [Clave original: '{$currentPin}' -> Hash: " . substr($hash, 0, 15) . "...]\n";
        }
    }

    echo "\nRESUMEN DE MIGRACIÓN:\n";
    echo "Total usuarios: " . count($users) . "\n";
    echo "Migrados a hash BCRYPT: {$migrated}\n";
    echo "Ya estaban hasheados: {$alreadyHashed}\n";

} catch (Exception $e) {
    echo "Error en migración: " . $e->getMessage() . "\n";
}
