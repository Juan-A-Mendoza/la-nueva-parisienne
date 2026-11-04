<?php
/* ==========================================================================
   LA NUEVA PARISIENNE - REPORTE OFICIAL EN PDF / IMPRESIÓN (EXPORT_PDF.PHP)
   Genera vista ejecutiva de auditoría forense con membrete de lujo,
   resumen KPI, cadena de custodia HMAC-SHA256 y firmas de certificación.
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

    // 1. Obtener datos de la empresa para el membrete
    $empresa = [
        'nombre'    => 'La Nueva Parisienne C.A.',
        'rif'       => 'J-40123456-7',
        'direccion' => 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara',
        'telefono'  => '(0251) 555-1234'
    ];
    try {
        $stmtEmp = $pdo->query("SELECT * FROM configuracion_empresa LIMIT 1");
        $empRow = $stmtEmp->fetch(PDO::FETCH_ASSOC);
        if ($empRow) {
            $empresa = array_merge($empresa, array_filter($empRow));
        }
    } catch (Exception $e) {
        // Fallback a valores por defecto
    }

    // 2. Parámetros de filtros aplicados
    $modulo = trim($_GET['modulo'] ?? '');
    $severidad = strtoupper(trim($_GET['severidad'] ?? ''));
    $search = trim($_GET['search'] ?? '');
    $fechaInicio = trim($_GET['fecha_inicio'] ?? '');
    $fechaFin = trim($_GET['fecha_fin'] ?? '');
    $usuario = trim($_GET['usuario'] ?? '');
    $autoPrint = isset($_GET['auto_print']) && $_GET['auto_print'] == '1';

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

    // 3. Consultar registros filtrados (hasta 1,000 para reporte ejecutivo)
    $sql = "
        SELECT 
            id, user_id, usuario, rol, modulo, accion, 
            descripcion, severidad, datos_previos, datos_nuevos, 
            ip_origen, user_agent, hash_previo, hash_firma, creado_en 
        FROM `bitacora` 
        {$whereSql} 
        ORDER BY id DESC 
        LIMIT 1000
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Métricas del reporte
    $totalReporte = count($logs);
    $countDanger = 0;
    $countWarning = 0;
    $countInfo = 0;

    foreach ($logs as $l) {
        $sev = strtoupper($l['severidad'] ?? 'INFO');
        if ($sev === 'DANGER') $countDanger++;
        elseif ($sev === 'WARNING') $countWarning++;
        else $countInfo++;
    }

    // Sellado criptográfico actual
    $stmtLast = $pdo->query("SELECT `hash_firma` FROM `bitacora` WHERE `hash_firma` IS NOT NULL AND `hash_firma` != '' ORDER BY `id` DESC LIMIT 1");
    $ultimoSello = $stmtLast->fetchColumn() ?: 'N/A';
    $hashGenesis = hash('sha256', LNP_GENESIS_HASH);

    $currentUser = $_SESSION['username'] ?? ($_SESSION['user_name'] ?? 'Administrador');
    $currentRole = $_SESSION['role'] ?? ($_SESSION['role_code'] ?? 'Super Administrador');
    $fechaEmision = date('d/m/Y H:i:s');

    // Registrar en auditoría la generación del informe
    log_bitacora(
        'SEGURIDAD',
        'EXPORTAR_REPORTE_PDF',
        "Generación de informe oficial de auditoría en PDF. Total de eventos exportados: {$totalReporte}.",
        'INFO'
    );

} catch (Exception $e) {
    http_response_code(500);
    echo "<h1>Error al generar el informe de auditoría: " . htmlspecialchars($e->getMessage()) . "</h1>";
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Oficial de Auditoría y Trazabilidad - La Nueva Parisienne</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">

  <style>
    /* ==========================================================================
       ESTILOS DEL INFORME DE AUDITORÍA (OPTIMIZADO PARA PANTALLA Y PDF PRINT)
       ========================================================================== */
    :root {
      --color-espresso: #2C1D11;
      --color-gold: #D49B54;
      --color-cream: #FFFDF9;
      --color-surface: #F9F5F0;
      --color-border: #E8DCC4;
      --color-muted: #6B5E51;
      --color-danger: #C62828;
      --color-warning: #B57B36;
      --color-success: #2E7D32;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F4EFEA;
      color: var(--color-espresso);
      font-size: 11pt;
      line-height: 1.45;
      padding: 20px;
    }

    /* BARRA DE ACCIONES SUPERIOR (SOLO PANTALLA) */
    .print-toolbar {
      max-width: 1100px;
      margin: 0 auto 20px auto;
      background: var(--color-espresso);
      padding: 12px 24px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 16px rgba(44, 29, 17, 0.25);
    }

    .print-toolbar-title {
      color: #FFFFFF;
      font-size: 13pt;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .print-toolbar-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-action {
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 10pt;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-action.primary {
      background: linear-gradient(135deg, #D49B54 0%, #B57B36 100%);
      color: var(--color-espresso);
    }

    .btn-action.primary:hover {
      background: linear-gradient(135deg, #E2AA63 0%, #C4873E 100%);
      transform: translateY(-1px);
    }

    .btn-action.secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .btn-action.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* HOJA PRINCIPAL DEL DOCUMENTO */
    .report-sheet {
      max-width: 1100px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 40px 48px;
      border-radius: 6px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--color-border);
    }

    /* MEMBRETE INSTITUCIONAL */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--color-espresso);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .brand-block h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24pt;
      color: var(--color-espresso);
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }

    .brand-block .tagline {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--color-gold);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .brand-block .legal-meta {
      font-size: 8.5pt;
      color: var(--color-muted);
      line-height: 1.35;
    }

    .report-title-block {
      text-align: right;
    }

    .report-badge {
      display: inline-block;
      background: rgba(212, 155, 84, 0.15);
      border: 1px solid var(--color-gold);
      color: var(--color-espresso);
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .report-title-block h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15pt;
      color: var(--color-espresso);
      margin-bottom: 4px;
    }

    .report-title-block .meta-date {
      font-size: 8.5pt;
      color: var(--color-muted);
    }

    /* TARJETA DE METADATOS Y FILTROS */
    .report-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .meta-item {
      font-size: 8.5pt;
    }

    .meta-item label {
      display: block;
      color: var(--color-muted);
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .meta-item strong {
      color: var(--color-espresso);
      font-size: 9pt;
    }

    /* BARRA DE KPIS DEL REPORTE */
    .kpi-summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-box {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 10px 14px;
      text-align: center;
      background: #FFFFFF;
    }

    .kpi-box.total { border-left: 4px solid var(--color-espresso); }
    .kpi-box.danger { border-left: 4px solid var(--color-danger); }
    .kpi-box.warning { border-left: 4px solid var(--color-warning); }
    .kpi-box.info { border-left: 4px solid var(--color-success); }

    .kpi-box-num {
      font-size: 16pt;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 2px;
    }

    .kpi-box.total .kpi-box-num { color: var(--color-espresso); }
    .kpi-box.danger .kpi-box-num { color: var(--color-danger); }
    .kpi-box.warning .kpi-box-num { color: var(--color-warning); }
    .kpi-box.info .kpi-box-num { color: var(--color-success); }

    .kpi-box-lbl {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--color-muted);
      letter-spacing: 0.5px;
    }

    /* BANNER DE CADENA DE CUSTODIA CRIPTOGRÁFICA */
    .crypto-custody-banner {
      background: #FAFAFA;
      border: 1px dashed var(--color-gold);
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 24px;
      font-size: 8pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .crypto-custody-title {
      font-weight: 700;
      color: var(--color-espresso);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .crypto-hashes-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-family: monospace;
      color: var(--color-muted);
      font-size: 7.5pt;
    }

    .crypto-hashes-wrap strong {
      color: var(--color-espresso);
    }

    /* TABLA DE AUDITORÍA */
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 28px;
    }

    .audit-table th {
      background: var(--color-espresso);
      color: #FFFFFF;
      text-align: left;
      padding: 8px 10px;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      border: 1px solid var(--color-espresso);
    }

    .audit-table td {
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      vertical-align: top;
      line-height: 1.35;
    }

    .audit-table tbody tr:nth-child(even) {
      background: rgba(249, 245, 240, 0.5);
    }

    .badge-sev {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-sev.info {
      background: rgba(46, 125, 50, 0.12);
      color: var(--color-success);
    }

    .badge-sev.warning {
      background: rgba(181, 123, 54, 0.15);
      color: #8C5617;
    }

    .badge-sev.danger {
      background: rgba(198, 40, 40, 0.12);
      color: var(--color-danger);
    }

    .col-id { width: 5%; text-align: center; font-weight: 700; }
    .col-fecha { width: 13%; white-space: nowrap; font-size: 8pt; }
    .col-sev { width: 8%; text-align: center; }
    .col-mod { width: 14%; font-weight: 600; }
    .col-usr { width: 14%; }
    .col-desc { width: 34%; }
    .col-ip { width: 12%; font-family: monospace; font-size: 7.5pt; color: var(--color-muted); }

    /* SECCIÓN DE FIRMAS Y CERTIFICACIÓN */
    .signatures-section {
      margin-top: 40px;
      border-top: 1px dashed var(--color-border);
      padding-top: 24px;
      page-break-inside: avoid;
    }

    .certification-disclaimer {
      font-size: 8pt;
      color: var(--color-muted);
      text-align: justify;
      margin-bottom: 40px;
      line-height: 1.4;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
    }

    .signature-box {
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid var(--color-espresso);
      margin-bottom: 8px;
    }

    .sig-name {
      font-weight: 700;
      font-size: 9.5pt;
      color: var(--color-espresso);
    }

    .sig-role {
      font-size: 8pt;
      color: var(--color-muted);
    }

    /* FOOTER */
    .report-footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: var(--color-muted);
    }

    /* REGLAS EXCLUSIVAS DE IMPRESIÓN (@MEDIA PRINT) */
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
        font-size: 9pt;
      }

      .no-print {
        display: none !important;
      }

      .report-sheet {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }

      @page {
        size: letter landscape;
        margin: 10mm 12mm 10mm 12mm;
      }

      .audit-table th {
        background-color: #2C1D11 !important;
        color: #FFFFFF !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .audit-table tbody tr:nth-child(even) {
        background-color: #F8F5F1 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .badge-sev.danger {
        color: #C62828 !important;
        font-weight: 800;
      }

      .badge-sev.warning {
        color: #B57B36 !important;
        font-weight: 800;
      }

      .badge-sev.info {
        color: #2E7D32 !important;
        font-weight: 800;
      }
    }
  </style>
</head>
<body>

  <!-- BARRA DE ACCIONES PARA PANTALLA -->
  <div class="print-toolbar no-print">
    <div class="print-toolbar-title">
      <span>📄 Vista Previa de Informe Oficial de Auditoría</span>
    </div>
    <div class="print-toolbar-buttons">
      <button type="button" class="btn-action secondary" onclick="window.close()">
        Cerrar
      </button>
      <button type="button" class="btn-action primary" onclick="window.print()">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>
  </div>

  <!-- CONTENEDOR DEL INFORME (TAMAÑO CARTA PAISAJE) -->
  <div class="report-sheet">

    <!-- MEMBRETE OFICIAL DE LA EMPRESA -->
    <header class="report-header">
      <div class="brand-block">
        <h1><?= htmlspecialchars($empresa['nombre']) ?></h1>
        <div class="tagline">Panadería, Pastelería &amp; Café Gourmet</div>
        <div class="legal-meta">
          <strong>RIF:</strong> <?= htmlspecialchars($empresa['rif']) ?> &bull; 
          <strong>Dirección:</strong> <?= htmlspecialchars($empresa['direccion']) ?><br>
          <strong>Teléfono:</strong> <?= htmlspecialchars($empresa['telefono']) ?>
        </div>
      </div>

      <div class="report-title-block">
        <span class="report-badge">Libro Mayor de Seguridad</span>
        <h2>Informe de Auditoría &amp; Trazabilidad</h2>
        <div class="meta-date">
          <strong>Emisión:</strong> <?= $fechaEmision ?><br>
          <strong>Auditor:</strong> <?= htmlspecialchars($currentUser) ?> (<?= htmlspecialchars($currentRole) ?>)
        </div>
      </div>
    </header>

    <!-- METADATOS Y CRITERIOS DE FILTRO -->
    <div class="report-meta-grid">
      <div class="meta-item">
        <label>Período Consultado</label>
        <strong><?= (!empty($fechaInicio) || !empty($fechaFin)) ? (htmlspecialchars($fechaInicio ?: 'Inicio') . ' al ' . htmlspecialchars($fechaFin ?: 'Hoy')) : 'Histórico Completo' ?></strong>
      </div>
      <div class="meta-item">
        <label>Módulo</label>
        <strong><?= !empty($modulo) ? htmlspecialchars($modulo) : 'Todos los Módulos' ?></strong>
      </div>
      <div class="meta-item">
        <label>Nivel de Severidad</label>
        <strong><?= !empty($severidad) ? htmlspecialchars($severidad) : 'Todas las Severidades' ?></strong>
      </div>
      <div class="meta-item">
        <label>Filtro de Búsqueda</label>
        <strong><?= !empty($search) ? '"' . htmlspecialchars($search) . '"' : '(Ninguno)' ?></strong>
      </div>
    </div>

    <!-- RESUMEN KPI DEL PERÍODO -->
    <div class="kpi-summary-bar">
      <div class="kpi-box total">
        <div class="kpi-box-num"><?= number_format($totalReporte, 0, ',', '.') ?></div>
        <div class="kpi-box-lbl">Eventos Listados</div>
      </div>
      <div class="kpi-box danger">
        <div class="kpi-box-num"><?= number_format($countDanger, 0, ',', '.') ?></div>
        <div class="kpi-box-lbl">Críticos (Peligro)</div>
      </div>
      <div class="kpi-box warning">
        <div class="kpi-box-num"><?= number_format($countWarning, 0, ',', '.') ?></div>
        <div class="kpi-box-lbl">Advertencias</div>
      </div>
      <div class="kpi-box info">
        <div class="kpi-box-num"><?= number_format($countInfo, 0, ',', '.') ?></div>
        <div class="kpi-box-lbl">Informativos</div>
      </div>
    </div>

    <!-- BANNER DE CADENA DE CUSTODIA -->
    <div class="crypto-custody-banner">
      <div class="crypto-custody-title">
        <span>🔒 Cadena de Custodia Criptográfica (HMAC-SHA256)</span>
      </div>
      <div class="crypto-hashes-wrap">
        <div><strong>Hash Génesis:</strong> <?= substr($hashGenesis, 0, 32) ?>...</div>
        <div><strong>Último Sello del Bloque:</strong> <?= substr($ultimoSello, 0, 32) ?>...</div>
      </div>
    </div>

    <!-- TABLA DE EVENTOS -->
    <table class="audit-table">
      <thead>
        <tr>
          <th class="col-id">#ID</th>
          <th class="col-fecha">Fecha &amp; Hora</th>
          <th class="col-sev">Severidad</th>
          <th class="col-mod">Módulo / Acción</th>
          <th class="col-usr">Usuario / Rol</th>
          <th class="col-desc">Descripción del Evento</th>
          <th class="col-ip">IP Origen</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($logs)): ?>
          <tr>
            <td colspan="7" style="text-align: center; padding: 24px; color: var(--color-muted);">
              No se encontraron eventos registrados con los criterios seleccionados.
            </td>
          </tr>
        <?php else: ?>
          <?php foreach ($logs as $l): ?>
            <?php 
              $sev = strtoupper($l['severidad'] ?? 'INFO');
              $sevClass = strtolower($sev);
            ?>
            <tr>
              <td class="col-id">#<?= $l['id'] ?></td>
              <td class="col-fecha"><?= htmlspecialchars($l['creado_en']) ?></td>
              <td class="col-sev">
                <span class="badge-sev <?= $sevClass ?>"><?= $sev ?></span>
              </td>
              <td class="col-mod">
                <strong><?= htmlspecialchars($l['modulo']) ?></strong><br>
                <small style="color: var(--color-muted);"><?= htmlspecialchars($l['accion']) ?></small>
              </td>
              <td class="col-usr">
                <strong><?= htmlspecialchars($l['usuario']) ?></strong><br>
                <small style="color: var(--color-muted);"><?= htmlspecialchars($l['rol'] ?? 'N/A') ?></small>
              </td>
              <td class="col-desc">
                <?= htmlspecialchars($l['descripcion']) ?>
              </td>
              <td class="col-ip">
                <?= htmlspecialchars($l['ip_origen']) ?>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>

    <!-- SECCIÓN DE FIRMAS Y CERTIFICACIÓN LEGAL / FISCAL -->
    <div class="signatures-section">
      <div class="certification-disclaimer">
        <strong>Certificación de Autenticidad Forense:</strong> Este documento oficial certifica que los registros listados corresponden fielmente a los eventos almacenados en el libro mayor de auditoría de <em><?= htmlspecialchars($empresa['nombre']) ?></em>. Cada registro cuenta con encadenamiento criptográfico determinista HMAC-SHA256 que garantiza su inmutabilidad frente a intentos de borrado o manipulación no autorizada. Documento válido para auditorías internas, revisiones fiscales y peritajes contables.
      </div>

      <div class="signatures-grid">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="sig-name"><?= htmlspecialchars($currentUser) ?></div>
          <div class="sig-role">Auditor Responsable / <?= htmlspecialchars($currentRole) ?></div>
        </div>

        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="sig-name">Gerencia General / Dirección</div>
          <div class="sig-role"><?= htmlspecialchars($empresa['nombre']) ?></div>
        </div>
      </div>
    </div>

    <!-- PIE DE PÁGINA -->
    <footer class="report-footer">
      <span>Sistema Administrativo &amp; ERP La Nueva Parisienne</span>
      <span>Generado el <?= $fechaEmision ?> &bull; Confidencial</span>
    </footer>

  </div>

  <?php if ($autoPrint): ?>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          window.print();
        }, 500);
      });
    </script>
  <?php endif; ?>

</body>
</html>
