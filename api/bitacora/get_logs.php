<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - ENDPOINT API CONSULTA DE BITÁCORA (GET_LOGS.PHP)
   Retorna eventos de auditoría con filtrado, paginación y métricas KPI.
   Exclusivo para roles: SUPERADMIN y ADMIN.
   ========================================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('LNP_PUBLIC', true);
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/security.php';

// Verificación RBAC: Solo Superadmin y Administrador / Gerente
require_auth(['ADMIN', 'SUPERADMIN']);

try {
    $pdo = getDbConnection();
    ensure_bitacora_table($pdo);

    // 1. Obtener parámetros de paginación
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(5, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    // 2. Parámetros de filtros
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

    // 3. Conteo total con filtros aplicados
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM `bitacora` {$whereSql}");
    $stmtCount->execute($params);
    $totalRecords = (int)$stmtCount->fetchColumn();

    // 4. Consulta de registros paginados
    $sqlLogs = "
        SELECT 
            id, user_id, usuario, rol, modulo, accion, 
            descripcion, severidad, datos_previos, datos_nuevos, 
            ip_origen, user_agent, hash_previo, hash_firma, creado_en 
        FROM `bitacora` 
        {$whereSql} 
        ORDER BY id DESC 
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmtLogs = $pdo->prepare($sqlLogs);
    $stmtLogs->execute($params);
    $rawLogs = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);

    // Procesar JSON para el cliente
    $logs = array_map(function($row) {
        $row['datos_previos_parsed'] = !empty($row['datos_previos']) ? json_decode($row['datos_previos'], true) : null;
        $row['datos_nuevos_parsed'] = !empty($row['datos_nuevos']) ? json_decode($row['datos_nuevos'], true) : null;
        $row['tiene_diff'] = (!empty($row['datos_previos_parsed']) || !empty($row['datos_nuevos_parsed']));
        return $row;
    }, $rawLogs);

    // 5. KPIs de auditoría para el panel
    $stmtKpi = $pdo->query("
        SELECT 
            COUNT(*) as total_general,
            SUM(CASE WHEN DATE(creado_en) = CURDATE() THEN 1 ELSE 0 END) as total_hoy,
            SUM(CASE WHEN severidad = 'DANGER' THEN 1 ELSE 0 END) as total_danger,
            SUM(CASE WHEN severidad = 'WARNING' THEN 1 ELSE 0 END) as total_warning,
            SUM(CASE WHEN severidad = 'INFO' THEN 1 ELSE 0 END) as total_info
        FROM `bitacora`
    ");
    $kpisRaw = $stmtKpi->fetch(PDO::FETCH_ASSOC) ?: [];

    $kpis = [
        'total_general' => (int)($kpisRaw['total_general'] ?? 0),
        'total_hoy'     => (int)($kpisRaw['total_hoy'] ?? 0),
        'total_danger'  => (int)($kpisRaw['total_danger'] ?? 0),
        'total_warning' => (int)($kpisRaw['total_warning'] ?? 0),
        'total_info'    => (int)($kpisRaw['total_info'] ?? 0)
    ];

    // 6. Lista de módulos únicos para rellenar los selectores dinámicamente
    $stmtMods = $pdo->query("SELECT DISTINCT modulo FROM `bitacora` ORDER BY modulo ASC");
    $availableModules = $stmtMods->fetchAll(PDO::FETCH_COLUMN) ?: [];

    echo json_encode([
        'success'      => true,
        'logs'         => $logs,
        'total'        => $totalRecords,
        'page'         => $page,
        'limit'        => $limit,
        'totalPages'   => (int)ceil($totalRecords / $limit),
        'kpis'         => $kpis,
        'modules'      => $availableModules
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar la bitácora: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
