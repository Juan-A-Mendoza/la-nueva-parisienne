<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - EXPORTACIÓN DE BITÁCORA A CSV / EXCEL (EXPORT_LOGS.PHP)
   Genera descarga directa de eventos de auditoría con formato compatible con Excel.
   Exclusivo para roles: SUPERADMIN y ADMIN.
   ========================================================================== */

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

// Verificación RBAC: Solo Superadmin y Administrador / Gerente
require_auth(['ADMIN', 'SUPERADMIN']);

try {
    $pdo = getDbConnection();
    ensure_bitacora_table($pdo);

    // Parámetros de filtros (mismos que get_logs.php)
    $modulo = trim($_GET['modulo'] ?? '');
    $severidad = strtoupper(trim($_GET['severidad'] ?? ''));
    $search = trim($_GET['search'] ?? '');
    $fechaInicio = trim($_GET['fecha_inicio'] ?? '');
    $fechaFin = trim($_GET['fecha_fin'] ?? '');
    $usuario = trim($_GET['usuario'] ?? '');

    $whereClauses = [];
    $params = [];

    if (!empty($modulo) && strtoupper($modulo) !== 'ALL') {
        $whereClauses[] = "modulo = :modulo";
        $params[':modulo'] = strtoupper($modulo);
    }

    if (!empty($severidad) && $severidad !== 'ALL' && in_array($severidad, ['INFO', 'WARNING', 'DANGER'], true)) {
        $whereClauses[] = "severidad = :severidad";
        $params[':severidad'] = $severidad;
    }

    if (!empty($usuario) && strtoupper($usuario) !== 'ALL') {
        $whereClauses[] = "(user_id = :usr OR usuario LIKE :usr_like)";
        $params[':usr'] = $usuario;
        $params[':usr_like'] = "%{$usuario}%";
    }

    if (!empty($search)) {
        $whereClauses[] = "(
            descripcion LIKE :search 
            OR accion LIKE :search_acc 
            OR usuario LIKE :search_usr 
            OR ip_origen LIKE :search_ip
        )";
        $searchParam = "%{$search}%";
        $params[':search'] = $searchParam;
        $params[':search_acc'] = $searchParam;
        $params[':search_usr'] = $searchParam;
        $params[':search_ip'] = $searchParam;
    }

    if (!empty($fechaInicio)) {
        $whereClauses[] = "DATE(creado_en) >= :fecha_inicio";
        $params[':fecha_inicio'] = $fechaInicio;
    }

    if (!empty($fechaFin)) {
        $whereClauses[] = "DATE(creado_en) <= :fecha_fin";
        $params[':fecha_fin'] = $fechaFin;
    }

    $whereSql = !empty($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

    $sql = "
        SELECT 
            id, creado_en, severidad, modulo, accion, 
            usuario, rol, descripcion, ip_origen, user_agent, 
            datos_previos, datos_nuevos
        FROM `bitacora`
        {$whereSql}
        ORDER BY id DESC
        LIMIT 5000
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Preparar cabeceras HTTP para descarga de CSV
    $timestamp = date('Ymd_His');
    $filename = "bitacora_auditoria_{$timestamp}.csv";

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Salida directa con BOM UTF-8 para compatibilidad total con Excel
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Cabecera del archivo CSV
    fputcsv($output, [
        'ID',
        'Fecha y Hora',
        'Severidad',
        'Módulo',
        'Acción',
        'Usuario',
        'Rol',
        'Descripción del Evento',
        'IP Origen',
        'Dispositivo / Agente',
        'Datos Previos (Antes)',
        'Datos Nuevos (Después)'
    ], ';');

    foreach ($rows as $r) {
        fputcsv($output, [
            $r['id'],
            $r['creado_en'],
            $r['severidad'],
            $r['modulo'],
            $r['accion'],
            $r['usuario'],
            $r['rol'],
            $r['descripcion'],
            $r['ip_origen'],
            $r['user_agent'],
            $r['datos_previos'] ?: 'N/A',
            $r['datos_nuevos'] ?: 'N/A'
        ], ';');
    }

    fclose($output);
    exit();

} catch (Exception $e) {
    http_response_code(500);
    echo "Error al exportar la bitácora: " . htmlspecialchars($e->getMessage());
    exit();
}
