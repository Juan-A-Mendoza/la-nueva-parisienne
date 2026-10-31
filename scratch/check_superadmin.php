<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/../api/config/conexion.php';
$pdo = getDbConnection();
$stmt = $pdo->query("SELECT id, username, pin, pin_maestro FROM usuarios WHERE username='superadmin'");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($row);
