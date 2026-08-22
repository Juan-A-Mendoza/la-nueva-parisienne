<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ARCHIVO DE CONEXIÓN MYSQL (CONEXION.PHP / LARAGON)
   Conexión relacional PDO con manejo de excepciones try-catch
   ========================================================================== */

$host = '127.0.0.1';
$dbname = 'la_nueva_parisienne';
$username = 'root';
$password = '';
$charset = 'utf8mb4';

try {
    $dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión MySQL (Laragon): ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (!function_exists('getDbConnection')) {
    function getDbConnection() {
        global $pdo;
        return $pdo;
    }
}
