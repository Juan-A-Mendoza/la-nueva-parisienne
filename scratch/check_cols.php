<?php
define('LNP_PUBLIC', true);
require_once __DIR__ . '/../api/config/conexion.php';
$pdo = getDbConnection();
$cols = $pdo->query('SHOW COLUMNS FROM usuarios')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($cols, JSON_PRETTY_PRINT);
