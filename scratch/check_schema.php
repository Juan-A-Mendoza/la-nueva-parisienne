<?php
require_once __DIR__ . '/../api/config/conexion.php';
$pdo = getDbConnection();
echo "COLUMNS OF usuarios:\n";
foreach($pdo->query('DESCRIBE usuarios') as $col) {
    echo $col['Field'] . ' | ' . $col['Type'] . ' | ' . $col['Null'] . "\n";
}
echo "\nUSERS SAMPLE:\n";
foreach($pdo->query('SELECT id, username, nombre, pin, rol_id FROM usuarios LIMIT 10') as $u) {
    echo $u['id'] . ' | ' . $u['username'] . ' | ' . $u['nombre'] . ' | PIN: ' . $u['pin'] . "\n";
}
