<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ARCHIVO DE CONEXIÓN MYSQL (CONEXION.PHP)
   Enlaza con la configuración canónica en api/config/conexion.php
   ========================================================================== */

require_once __DIR__ . '/api/config/conexion.php';
$pdo = getDbConnection();
