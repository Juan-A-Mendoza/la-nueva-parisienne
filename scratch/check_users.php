<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/../api/config/conexion.php';
$pdo = getDbConnection();
$st = $pdo->query('SELECT id, codigo, username, nombre, pin, pin_2fa, pin_maestro, totp_secret, totp_enabled FROM usuarios');
echo json_encode($st->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
