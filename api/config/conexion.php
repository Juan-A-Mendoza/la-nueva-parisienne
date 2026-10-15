<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - CONFIGURACIÓN DE CONEXIÓN A BASE DE DATOS MYSQL (PDO)
   Conexión relacional segura con manejo de excepciones y codificación UTF-8
   ========================================================================== */

date_default_timezone_set('America/Caracas');

require_once __DIR__ . '/security.php';

// SEGURIDAD: En producción, mover credenciales a variables de entorno o archivo .env
// y crear un usuario MySQL dedicado con permisos mínimos (no usar root).
define('DB_HOST', getenv('LNP_DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('LNP_DB_NAME') ?: 'la_nueva_parisienne');
define('DB_USER', getenv('LNP_DB_USER') ?: 'root');
define('DB_PASS', getenv('LNP_DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Retorna la instancia de conexión PDO a MySQL
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, time_zone = '-04:00'"
        ];
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('[LNP DB ERROR] Conexión: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Error de conexión a la base de datos. Contacte al administrador.'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    
    return $pdo;
}

// Validación automática de autenticación para TODOS los endpoints.
// Los endpoints públicos (login, perfiles, tasa BCV) deben definir:
//   define('LNP_PUBLIC', true);
// ANTES de incluir este archivo para saltarse la verificación.
if (!defined('LNP_PUBLIC')) {
    require_auth();
}
