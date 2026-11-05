/* ==========================================================================
   LA NUEVA PARISIENNE - MÓDULO JS DE BITÁCORA Y AUDITORÍA (BITACORA.JS)
   Control de filtrado en tiempo real, visor diff JSON, exportación y paginación.
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';
import { bindDateRangeValidation, getLocalDateIso, validateDateRange } from '../core/date-validator.js';

// ESTADO GLOBAL DEL MÓDULO
const state = {
  page: 1,
  limit: 20,
  totalPages: 1,
  totalRecords: 0,
  search: '',
  modulo: 'ALL',
  severidad: 'ALL',
  fechaInicio: '',
  fechaFin: '',
  activeKpi: 'all',
  currentLog: null,
  activeTab: 'visual',
  hideUnchanged: true,
  logs: [],
  kpis: {
    total_general: 0,
    total_hoy: 0,
    total_danger: 0,
    total_warning: 0,
    total_info: 0
  },
  maintenanceStats: null
};

let searchDebounceTimeout = null;
let toastTimeout = null;
let dateRangeController = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBitacora();
  });
} else {
  initBitacora();
}

/**
 * Inicialización principal
 */
async function initBitacora() {
  // 1. Validar sesión y permisos RBAC
  const session = SessionStore.getSession();
  const user = session?.user;

  if (!user) {
    window.location.replace('../index.html');
    return;
  }

  const roleCode = String(user.roleCode || user.role_code || '').toUpperCase();
  const isSuperadmin = roleCode === 'SUPERADMIN' || String(user.id || '').includes('superadmin');
  const isAdmin = isSuperadmin || roleCode === 'ADMIN' || String(user.role || '').toLowerCase().includes('gerente');

  if (!isAdmin) {
    alert('Acceso restringido: La bitácora y auditoría es de uso exclusivo para Administradores.');
    window.location.replace('dashboard.html');
    return;
  }

  // 2. Pintar datos de cabecera
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  if (userNameEl) userNameEl.textContent = user.name || user.username || 'Administrador';
  if (userRoleEl) userRoleEl.textContent = `● ${user.role || 'Gerente General'}`;

  // 3. Tasa BCV
  initBcvRate();

  // 4. Vincular Eventos de la Interfaz
  bindEvents();

  // 5. Cargar primera tanda de registros
  await loadLogs();
}

/**
 * Obtiene el contexto de autenticación activo para peticiones a la API
 */
function getAuthContext() {
  const session = SessionStore.getSession();
  const user = session?.user;
  const userId = user?.id || user?.username || 'usr_superadmin';
  const roleCode = String(user?.roleCode || user?.role_code || 'SUPERADMIN').toUpperCase();
  return { userId, roleCode, user, token: session?.token || '' };
}

/**
 * Inicializa la tasa BCV en la barra superior con sincronización en tiempo real
 */
function initBcvRate() {
  const bcvValEl = document.getElementById('bcvRateVal');
  const bcvBadge = document.getElementById('bcvRateBadge');
  if (!bcvValEl) return;

  const updateBcvDisplay = (rate, isManual = false) => {
    const numRate = Number(rate) || 0;
    if (numRate > 0) {
      bcvValEl.textContent = `Bs. ${numRate.toFixed(2)}`;
      if (bcvBadge) {
        bcvBadge.className = isManual ? 'bcv-rate-badge warning' : 'bcv-rate-badge';
      }
    }
  };

  // 1. Suscribirse a BcvRateStore centralizado
  if (BcvRateStore) {
    if (typeof BcvRateStore.subscribe === 'function') {
      BcvRateStore.subscribe((data) => {
        if (data?.rate) {
          updateBcvDisplay(data.rate, data.mode === 'manual');
        }
      });
    }
    // Disparar consulta en vivo a la API BCV si está en modo automático
    if (typeof BcvRateStore.fetchRate === 'function') {
      BcvRateStore.fetchRate();
    }
  }

  // 2. Escuchar evento custom de cambio de tasa
  window.addEventListener('bcvRateChanged', (e) => {
    if (e.detail?.rate) {
      updateBcvDisplay(e.detail.rate, e.detail?.mode === 'manual');
    }
  });

  // 3. Escuchar cambios entre pestañas en localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'modo_tasa' || e.key === 'tasa_manual' || e.key === 'tasa_auto' || e.key === 'bcv_current_rate') {
      if (BcvRateStore?.fetchRate) {
        BcvRateStore.fetchRate();
      }
    }
  });

  // 4. Canal Broadcast en tiempo real (lnp_bcv_channel)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const rateChannel = new BroadcastChannel('lnp_bcv_channel');
      rateChannel.onmessage = (e) => {
        if (e.data?.rate) {
          updateBcvDisplay(e.data.rate, e.data?.mode === 'manual');
        }
      };
    } catch (err) { }
  }
}

/**
 * Vinculación de listeners interactivos
 */
function bindEvents() {
  // Búsqueda en vivo con debounce
  const inputSearch = document.getElementById('inputSearch');
  inputSearch?.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadLogs();
    }, 350);
  });

  // Selector de Módulo
  const selectModulo = document.getElementById('selectModulo');
  selectModulo?.addEventListener('change', (e) => {
    state.modulo = e.target.value;
    state.page = 1;
    loadLogs();
  });

  // Selector de Severidad
  const selectSeveridad = document.getElementById('selectSeveridad');
  selectSeveridad?.addEventListener('change', (e) => {
    state.severidad = e.target.value;
    state.page = 1;
    loadLogs();
  });

  // Rango de Fechas - Sincronización reactiva y prevención de fechas imposibles
  dateRangeController = bindDateRangeValidation({
    fromInput: '#inputFechaInicio',
    toInput: '#inputFechaFin',
    allowFuture: false,
    minDate: '2024-01-01',
    maxRangeDays: 366,
    onChange: ({ from, to }) => {
      state.fechaInicio = from;
      state.fechaFin = to;
      state.page = 1;
      loadLogs();
    },
    onError: (errorMessage) => {
      showToast(errorMessage, 'warning');
    }
  });

  // Botón Limpiar Filtros
  const btnResetFilters = document.getElementById('btnResetFilters');
  btnResetFilters?.addEventListener('click', () => {
    resetFilters();
  });

  // Chips de Período Rápido
  const chipButtons = document.querySelectorAll('.btn-chip');
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyQuickPeriod(btn.dataset.period);
    });
  });

  // Tarjetas KPI Clicables para Filtrado Rápido
  const kpiCards = document.querySelectorAll('.bitacora-kpi-card[data-kpi]');
  kpiCards.forEach(card => {
    const handleKpiAction = () => {
      const kpiType = card.dataset.kpi;
      applyKpiFilter(kpiType);
    };

    card.addEventListener('click', handleKpiAction);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleKpiAction();
      }
    });
  });

  // Botón Recargar
  const btnRefreshLogs = document.getElementById('btnRefreshLogs');
  btnRefreshLogs?.addEventListener('click', () => {
    loadLogs();
  });

  // Botón Exportar PDF (Membrete Oficial)
  const btnExportPdf = document.getElementById('btnExportPdf');
  btnExportPdf?.addEventListener('click', () => {
    exportToPdf();
  });

  // Botón Exportar CSV
  const btnExportCsv = document.getElementById('btnExportCsv');
  btnExportCsv?.addEventListener('click', () => {
    exportToCsv();
  });

  // Botón Abrir Mantenimiento & Archivado
  const btnMaintenance = document.getElementById('btnMaintenance');
  btnMaintenance?.addEventListener('click', () => {
    openMaintenanceModal();
  });

  // Pestañas del Modal (Comparador Visual vs JSON Crudo)
  const tabBtnVisual = document.getElementById('tabBtnVisual');
  const tabBtnJson = document.getElementById('tabBtnJson');
  const panelVisualDiff = document.getElementById('panelVisualDiff');
  const panelJsonDiff = document.getElementById('panelJsonDiff');

  tabBtnVisual?.addEventListener('click', () => {
    state.activeTab = 'visual';
    tabBtnVisual.classList.add('active');
    tabBtnJson?.classList.remove('active');
    panelVisualDiff?.classList.add('active');
    panelJsonDiff?.classList.remove('active');
    refreshIcons();
  });

  tabBtnJson?.addEventListener('click', () => {
    state.activeTab = 'json';
    tabBtnJson.classList.add('active');
    tabBtnVisual?.classList.remove('active');
    panelJsonDiff?.classList.add('active');
    panelVisualDiff?.classList.remove('active');
    refreshIcons();
  });

  // Toggle "Solo campos modificados"
  const chkOnlyModified = document.getElementById('chkOnlyModified');
  chkOnlyModified?.addEventListener('change', (e) => {
    state.hideUnchanged = e.target.checked;
    const wrapper = document.querySelector('.visual-diff-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('hide-unchanged', state.hideUnchanged);
    }
  });

  // Botón Copiar Resumen Completo
  document.getElementById('btnCopyDetail')?.addEventListener('click', () => {
    copyLogSummary();
  });

  // Botón Copiar JSON Previo
  document.getElementById('btnCopyPriorJson')?.addEventListener('click', () => {
    const text = document.getElementById('modalJsonPrevios')?.textContent;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('JSON previo copiado al portapapeles.', 'success');
      });
    }
  });

  // Botón Copiar JSON Nuevo
  document.getElementById('btnCopyNewJson')?.addEventListener('click', () => {
    const text = document.getElementById('modalJsonNuevos')?.textContent;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('JSON nuevo copiado al portapapeles.', 'success');
      });
    }
  });

  // Botón Copiar Firma Criptográfica HMAC
  document.getElementById('btnCopyHashFirma')?.addEventListener('click', () => {
    const text = document.getElementById('modalMetaHashFirma')?.textContent;
    if (text && text !== '--' && !text.includes('Sin firma')) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Firma criptográfica HMAC copiada al portapapeles.', 'success');
      }).catch(() => {
        showToast('No se pudo copiar la firma.', 'error');
      });
    }
  });

  // Botón Abrir Verificador Forense de Integridad
  document.getElementById('btnVerifyIntegrity')?.addEventListener('click', () => {
    openIntegrityVerifier();
  });

  // Botón Re-verificar en el Modal
  document.getElementById('btnReVerifyIntegrity')?.addEventListener('click', () => {
    runIntegrityVerification();
  });

  // Modal Integridad Cerrar
  const btnCloseIntegrity = document.getElementById('btnCloseIntegrityModal');
  const btnCloseIntegrityBtn = document.getElementById('btnCloseIntegrityModalBtn');
  const modalIntegrityOverlay = document.getElementById('integrityModal');

  btnCloseIntegrity?.addEventListener('click', closeIntegrityModal);
  btnCloseIntegrityBtn?.addEventListener('click', closeIntegrityModal);
  modalIntegrityOverlay?.addEventListener('click', (e) => {
    if (e.target === modalIntegrityOverlay) closeIntegrityModal();
  });

  // Modal Mantenimiento Eventos
  const btnCloseMaintenance = document.getElementById('btnCloseMaintenanceModal');
  const btnCloseMaintenanceBtn = document.getElementById('btnCloseMaintenanceModalBtn');
  const modalMaintenanceOverlay = document.getElementById('maintenanceModal');

  btnCloseMaintenance?.addEventListener('click', closeMaintenanceModal);
  btnCloseMaintenanceBtn?.addEventListener('click', closeMaintenanceModal);
  modalMaintenanceOverlay?.addEventListener('click', (e) => {
    if (e.target === modalMaintenanceOverlay) closeMaintenanceModal();
  });

  document.getElementById('btnRefreshMaintenanceStats')?.addEventListener('click', () => {
    loadMaintenanceStats();
  });

  document.getElementById('btnDownloadBackupJson')?.addEventListener('click', () => {
    downloadBackupJson();
  });

  document.getElementById('selectArchiveDays')?.addEventListener('change', () => {
    updateArchiveCandidatesBadge();
  });

  document.getElementById('btnExecuteArchiving')?.addEventListener('click', () => {
    executeArchiving();
  });

  // Modal Detalle Cerrar
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalOverlay = document.getElementById('bitacoraDetailModal');

  btnCloseModal?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalMaintenanceOverlay?.classList.contains('active')) {
        closeMaintenanceModal();
      } else if (modalIntegrityOverlay?.classList.contains('active')) {
        closeIntegrityModal();
      } else if (modalOverlay?.classList.contains('active')) {
        closeModal();
      }
    }
  });

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    if (window.SessionStore) {
      window.SessionStore.logout();
    } else {
      localStorage.removeItem('LN_PARISIENNE_SESSION');
      localStorage.removeItem('usuario_activo');
      sessionStorage.clear();
      window.location.href = '../index.html';
    }
  });
}

/**
 * Restablece todos los filtros de búsqueda
 */
function resetFilters() {
  state.search = '';
  state.modulo = 'ALL';
  state.severidad = 'ALL';
  state.fechaInicio = '';
  state.fechaFin = '';
  state.activeKpi = 'all';
  state.page = 1;

  const inputSearch = document.getElementById('inputSearch');
  const selectModulo = document.getElementById('selectModulo');
  const selectSeveridad = document.getElementById('selectSeveridad');

  if (inputSearch) inputSearch.value = '';
  if (selectModulo) selectModulo.value = 'ALL';
  if (selectSeveridad) selectSeveridad.value = 'ALL';

  if (dateRangeController) {
    dateRangeController.reset();
  } else {
    const inputFechaInicio = document.getElementById('inputFechaInicio');
    const inputFechaFin = document.getElementById('inputFechaFin');
    if (inputFechaInicio) inputFechaInicio.value = '';
    if (inputFechaFin) inputFechaFin.value = '';
  }

  const chipButtons = document.querySelectorAll('.btn-chip');
  chipButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'all'));

  loadLogs();
}

/**
 * Aplica rangos preestablecidos a los inputs de fecha
 */
function applyQuickPeriod(period) {
  const today = new Date();
  let start = '';
  let end = '';

  if (period === 'today') {
    start = getLocalDateIso(today);
    end = getLocalDateIso(today);
  } else if (period === '7days') {
    const prior7 = new Date();
    prior7.setDate(today.getDate() - 7);
    start = getLocalDateIso(prior7);
    end = getLocalDateIso(today);
  } else if (period === 'month') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    start = getLocalDateIso(firstDay);
    end = getLocalDateIso(today);
  } else {
    // all
    start = '';
    end = '';
  }

  state.fechaInicio = start;
  state.fechaFin = end;

  if (dateRangeController) {
    dateRangeController.setRange(start, end, false);
  } else {
    const inputFechaInicio = document.getElementById('inputFechaInicio');
    const inputFechaFin = document.getElementById('inputFechaFin');
    if (inputFechaInicio) inputFechaInicio.value = start;
    if (inputFechaFin) inputFechaFin.value = end;
  }

  state.page = 1;
  loadLogs();
}

/**
 * Consulta la API get_logs.php y renderiza resultados
 */
async function loadLogs() {
  const tableBody = document.getElementById('bitacoraTableBody');
  if (!tableBody) return;

  // Pre-validar coherencia de fechas antes de consultar la API
  const rangeCheck = validateDateRange(state.fechaInicio, state.fechaFin, {
    allowFuture: false,
    minDate: '2024-01-01',
    maxRangeDays: 366
  });

  if (!rangeCheck.valid) {
    showToast(rangeCheck.error, 'warning');
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--color-warning, #B57B36);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <i data-lucide="alert-circle" class="icon-md"></i>
            <strong>Filtro de fechas inválido</strong>
            <span style="font-size: 0.85rem; color: var(--color-muted);">${rangeCheck.error}</span>
          </div>
        </td>
      </tr>
    `;
    refreshIcons();
    return;
  }

  // Estado de carga visual
  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 3rem;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: var(--color-muted);">
          <i data-lucide="loader" class="icon-sm" style="animation: spin 1s linear infinite;"></i>
          <span>Consultando registros de auditoría en MySQL...</span>
        </div>
      </td>
    </tr>
  `;
  refreshIcons();

  try {
    const auth = getAuthContext();
    const queryParams = new URLSearchParams({
      page: state.page,
      limit: state.limit,
      modulo: state.modulo,
      severidad: state.severidad,
      search: state.search,
      fecha_inicio: state.fechaInicio,
      fecha_fin: state.fechaFin,
      user_id: auth.userId,
      role_code: auth.roleCode
    });

    const response = await fetch(`../api/bitacora/get_logs.php?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-User-Id': auth.userId,
        'X-User-Role': auth.roleCode
      }
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}: Error al recuperar datos de bitácora.`;
      try {
        const errJson = await response.json();
        if (errJson.error || errJson.message) {
          errDetail = errJson.error || errJson.message;
        }
      } catch (e) { }
      throw new Error(errDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'No se pudieron recuperar los registros.');
    }

    state.logs = data.logs || [];
    state.totalRecords = data.total || 0;
    state.totalPages = data.totalPages || 1;
    state.kpis = data.kpis || state.kpis;

    // Actualizar select de módulos si vienen nuevos
    if (Array.isArray(data.modules) && data.modules.length > 0) {
      populateModuleSelect(data.modules);
    }

    // Renderizar
    renderKPIs();
    renderTable();
    renderPagination();

  } catch (error) {
    console.error('[Bitácora Error]', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--color-danger);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <i data-lucide="alert-triangle" class="icon-md"></i>
            <strong>Error al cargar la bitácora</strong>
            <span style="font-size: 0.85rem; color: var(--color-muted);">${error.message}</span>
            <button class="btn-bitacora secondary" style="margin-top: 0.5rem;" onclick="window.location.reload()">
              Reintentar
            </button>
          </div>
        </td>
      </tr>
    `;
    refreshIcons();
  }
}

/**
 * Llena dinámicamente las opciones del selector de módulos
 */
function populateModuleSelect(modules) {
  const selectModulo = document.getElementById('selectModulo');
  if (!selectModulo) return;

  const currentVal = selectModulo.value;
  const standardModules = ['AUTH', 'INVENTARIO', 'POS', 'PROVEEDORES', 'CONTABILIDAD', 'COCINA', 'PERSONAL', 'CONFIGURACION'];
  const allModules = Array.from(new Set([...standardModules, ...modules])).sort();

  let html = `<option value="ALL">Todos los Módulos</option>`;
  allModules.forEach(mod => {
    html += `<option value="${mod}" ${currentVal === mod ? 'selected' : ''}>${mod}</option>`;
  });
  selectModulo.innerHTML = html;
}

/**
 * Renderiza los 4 KPIs superiores y actualiza el resaltado interactivo
 */
function renderKPIs() {
  const kpiGeneral = document.getElementById('kpiTotalGeneral');
  const kpiDanger = document.getElementById('kpiTotalDanger');
  const kpiWarning = document.getElementById('kpiTotalWarning');
  const kpiHoy = document.getElementById('kpiTotalHoy');

  if (kpiGeneral) kpiGeneral.textContent = state.kpis.total_general.toLocaleString('es-VE');
  if (kpiDanger) kpiDanger.textContent = state.kpis.total_danger.toLocaleString('es-VE');
  if (kpiWarning) kpiWarning.textContent = state.kpis.total_warning.toLocaleString('es-VE');
  if (kpiHoy) kpiHoy.textContent = state.kpis.total_hoy.toLocaleString('es-VE');

  updateActiveKpiHighlight();
}

/**
 * Renderiza las filas de la tabla de auditoría
 */
function renderTable() {
  const tableBody = document.getElementById('bitacoraTableBody');
  if (!tableBody) return;

  if (state.logs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="bitacora-empty-state">
            <i data-lucide="inbox"></i>
            <h4>No se encontraron eventos en la bitácora</h4>
            <p>No hay registros que coincidan con los criterios de búsqueda o fecha seleccionados.</p>
            <button type="button" class="btn-bitacora secondary" id="btnEmptyReset">
              Restablecer Filtros
            </button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('btnEmptyReset')?.addEventListener('click', resetFilters);
    refreshIcons();
    return;
  }

  const rowsHtml = state.logs.map(log => {
    const formattedDate = formatTimestamp(log.creado_en);
    const severityClass = (log.severidad || 'INFO').toLowerCase();
    const severityIcon = severityClass === 'danger' ? 'alert-octagon' : (severityClass === 'warning' ? 'alert-triangle' : 'info');
    const moduloCode = (log.modulo || 'SISTEMA').toUpperCase();
    const userInitial = (log.usuario || 'U').charAt(0).toUpperCase();

    const hasDiff = log.tiene_diff;

    return `
      <tr data-log-id="${log.id}">
        <!-- Fecha y Hora -->
        <td style="white-space: nowrap; font-size: 0.82rem; font-weight: 600;">
          ${formattedDate.date}<br>
          <span style="color: var(--color-muted); font-size: 0.74rem;">${formattedDate.time}</span>
        </td>

        <!-- Severidad -->
        <td>
          <span class="badge-severity ${severityClass}">
            <i data-lucide="${severityIcon}" class="icon-xs"></i>
            <span>${log.severidad}</span>
          </span>
        </td>

        <!-- Módulo -->
        <td>
          <span class="badge-module ${moduloCode}">
            ${moduloCode}
          </span>
        </td>

        <!-- Acción -->
        <td>
          <span class="action-code-tag">${escapeHtml(log.accion)}</span>
        </td>

        <!-- Usuario / Rol -->
        <td>
          <div class="user-meta-cell">
            <div class="user-avatar-mini">${userInitial}</div>
            <div class="user-names">
              <strong>${escapeHtml(log.usuario)}</strong>
              <span>${escapeHtml(log.rol || 'N/A')}</span>
            </div>
          </div>
        </td>

        <!-- Descripción -->
        <td style="max-width: 380px;">
          <div style="font-size: 0.86rem; line-height: 1.4; color: var(--color-espresso);">
            ${escapeHtml(log.descripcion)}
          </div>
        </td>

        <!-- IP / Origen -->
        <td style="font-family: monospace; font-size: 0.78rem; color: var(--color-muted); white-space: nowrap;">
          <i data-lucide="globe" class="icon-xs" style="vertical-align: middle;"></i> ${escapeHtml(log.ip_origen)}
        </td>

        <!-- Acción / Diff -->
        <td style="text-align: center;">
          <button type="button" class="btn-view-diff btn-open-detail" data-log-id="${log.id}" title="Ver trazabilidad completa">
            <i data-lucide="${hasDiff ? 'git-commit' : 'eye'}" class="icon-xs"></i>
            <span>${hasDiff ? 'Ver Diff' : 'Ver'}</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = rowsHtml;

  // Asignar listeners a los botones de detalle
  document.querySelectorAll('.btn-open-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logId = parseInt(btn.dataset.logId, 10);
      openDetail(logId);
    });
  });

  refreshIcons();
}

/**
 * Renderiza la barra de paginación
 */
function renderPagination() {
  const counterEl = document.getElementById('paginationCounter');
  const controlsEl = document.getElementById('paginationControls');
  if (!counterEl || !controlsEl) return;

  const startRecord = state.totalRecords === 0 ? 0 : (state.page - 1) * state.limit + 1;
  const endRecord = Math.min(state.page * state.limit, state.totalRecords);

  counterEl.textContent = `Mostrando ${startRecord} - ${endRecord} de ${state.totalRecords.toLocaleString('es-VE')} eventos`;

  let buttonsHtml = '';

  // Botón Anterior
  buttonsHtml += `
    <button type="button" class="btn-page" id="btnPagePrev" ${state.page <= 1 ? 'disabled' : ''} title="Página anterior">
      <i data-lucide="chevron-left" class="icon-xs"></i>
    </button>
  `;

  // Páginas numeradas
  const maxButtons = 5;
  let startPage = Math.max(1, state.page - 2);
  let endPage = Math.min(state.totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    buttonsHtml += `
      <button type="button" class="btn-page ${i === state.page ? 'active' : ''}" data-goto-page="${i}">
        ${i}
      </button>
    `;
  }

  // Botón Siguiente
  buttonsHtml += `
    <button type="button" class="btn-page" id="btnPageNext" ${state.page >= state.totalPages ? 'disabled' : ''} title="Página siguiente">
      <i data-lucide="chevron-right" class="icon-xs"></i>
    </button>
  `;

  controlsEl.innerHTML = buttonsHtml;

  // Listeners de paginación
  document.getElementById('btnPagePrev')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadLogs();
    }
  });

  document.getElementById('btnPageNext')?.addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      loadLogs();
    }
  });

  controlsEl.querySelectorAll('[data-goto-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.gotoPage, 10);
      loadLogs();
    });
  });

  refreshIcons();
}

/**
 * Abre el modal de detalle con comparación Visual Diff y JSON crudo
 */
function openDetail(logId) {
  const log = state.logs.find(l => l.id == logId);
  if (!log) return;

  state.currentLog = log;
  const modal = document.getElementById('bitacoraDetailModal');
  if (!modal) return;

  // 1. Llenar metadatos en el encabezado del modal
  document.getElementById('modalMetaId').textContent = `#${log.id}`;
  document.getElementById('modalMetaFecha').textContent = log.creado_en;
  document.getElementById('modalMetaModuloAccion').textContent = `${log.modulo} / ${log.accion}`;

  const metaSev = document.getElementById('modalMetaSeveridad');
  if (metaSev) {
    const sev = log.severidad || 'INFO';
    metaSev.innerHTML = `<span class="badge-severity ${sev.toLowerCase()}">${sev}</span>`;
  }

  document.getElementById('modalMetaUsuario').textContent = `${log.usuario} (${log.rol || 'Sin Rol'})`;
  document.getElementById('modalMetaIp').textContent = log.ip_origen;
  document.getElementById('modalMetaDescripcion').textContent = log.descripcion;
  document.getElementById('modalMetaUserAgent').textContent = log.user_agent || 'No disponible';

  // Sello Criptográfico & Cadena de Custodia
  const metaHashFirma = document.getElementById('modalMetaHashFirma');
  const metaHashPrevio = document.getElementById('modalMetaHashPrevio');
  if (metaHashFirma) metaHashFirma.textContent = log.hash_firma || '(Sin firma criptográfica)';
  if (metaHashPrevio) metaHashPrevio.textContent = log.hash_previo || '(Sin hash previo)';

  // 2. Parsear objetos de datos previos y nuevos
  let prevObj = log.datos_previos_parsed;
  if (!prevObj && log.datos_previos) {
    try {
      prevObj = JSON.parse(log.datos_previos);
    } catch (e) {
      prevObj = log.datos_previos;
    }
  }

  let newObj = log.datos_nuevos_parsed;
  if (!newObj && log.datos_nuevos) {
    try {
      newObj = JSON.parse(log.datos_nuevos);
    } catch (e) {
      newObj = log.datos_nuevos;
    }
  }

  // 3. Prellenar bloques JSON crudo
  const prePrevios = document.getElementById('modalJsonPrevios');
  const preNuevos = document.getElementById('modalJsonNuevos');

  if (prePrevios) {
    prePrevios.textContent = prevObj
      ? (typeof prevObj === 'object' ? JSON.stringify(prevObj, null, 2) : String(prevObj))
      : '(Sin datos previos registrados para esta acción)';
  }

  if (preNuevos) {
    preNuevos.textContent = newObj
      ? (typeof newObj === 'object' ? JSON.stringify(newObj, null, 2) : String(newObj))
      : '(Sin datos nuevos registrados para esta acción)';
  }

  // 4. Renderizar el Comparador Visual Diff Inteligente
  renderVisualDiff(prevObj, newObj, log);

  // 5. Restablecer pestaña a 'visual'
  const tabBtnVisual = document.getElementById('tabBtnVisual');
  const tabBtnJson = document.getElementById('tabBtnJson');
  const panelVisualDiff = document.getElementById('panelVisualDiff');
  const panelJsonDiff = document.getElementById('panelJsonDiff');

  tabBtnVisual?.classList.add('active');
  tabBtnJson?.classList.remove('active');
  panelVisualDiff?.classList.add('active');
  panelJsonDiff?.classList.remove('active');

  modal.classList.add('active');
  refreshIcons();
}

/**
 * Cierra el modal de detalle del log
 */
function closeModal() {
  const modal = document.getElementById('bitacoraDetailModal');
  modal?.classList.remove('active');
  state.currentLog = null;
}

/**
 * Abre el modal de auditoría forense y ejecuta la validación
 */
function openIntegrityVerifier() {
  const modal = document.getElementById('integrityModal');
  if (!modal) return;
  modal.classList.add('active');
  runIntegrityVerification();
}

/**
 * Cierra el modal de auditoría forense
 */
function closeIntegrityModal() {
  const modal = document.getElementById('integrityModal');
  modal?.classList.remove('active');
}

/**
 * Llama al endpoint de verificación de integridad criptográfica y muestra el reporte
 */
async function runIntegrityVerification() {
  const heroBanner = document.getElementById('integrityHeroBanner');
  const heroIcon = document.getElementById('integrityHeroIcon');
  const heroTitle = document.getElementById('integrityHeroTitle');
  const heroSubtitle = document.getElementById('integrityHeroSubtitle');

  const metricTotal = document.getElementById('metricTotalVerified');
  const metricTime = document.getElementById('metricComputeTime');
  const metricStatus = document.getElementById('metricLedgerStatus');
  const metricSub = document.getElementById('metricLedgerSub');

  const hashGenesis = document.getElementById('integrityGenesisHash');
  const latestSeal = document.getElementById('integrityLatestSeal');
  const auditorName = document.getElementById('integrityAuditorName');
  const timestampEl = document.getElementById('integrityTimestamp');

  const anomaliesSection = document.getElementById('integrityAnomaliesSection');
  const anomaliesCount = document.getElementById('anomaliesCount');
  const anomaliesList = document.getElementById('integrityAnomaliesList');

  // Estado de carga inicial
  if (heroBanner) heroBanner.className = 'integrity-hero-banner status-loading';
  if (heroIcon) heroIcon.innerHTML = `<i data-lucide="loader" class="icon-lg spin-icon"></i>`;
  if (heroTitle) heroTitle.textContent = 'Ejecutando Verificación Forense...';
  if (heroSubtitle) heroSubtitle.textContent = 'Calculando algoritmos HMAC-SHA256 encadenados y comprobando continuidad matemática...';

  if (metricTotal) metricTotal.textContent = '...';
  if (metricTime) metricTime.textContent = '...';
  if (metricStatus) {
    metricStatus.textContent = 'Evaluando...';
    metricStatus.className = 'metric-value status-badge';
  }
  if (metricSub) metricSub.textContent = 'Procesando cadena';

  if (anomaliesSection) anomaliesSection.style.display = 'none';

  refreshIcons();

  try {
    const auth = getAuthContext();
    const response = await fetch(`../api/bitacora/verificar_integridad.php?user_id=${encodeURIComponent(auth.userId)}&role_code=${encodeURIComponent(auth.roleCode)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-User-Id': auth.userId,
        'X-User-Role': auth.roleCode
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al conectar con el verificador de auditoría.`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error desconocido al comprobar integridad.');
    }

    // Actualizar campos comunes
    if (metricTotal) metricTotal.textContent = `${data.registros_validos} / ${data.total_registros}`;
    if (metricTime) metricTime.textContent = `${data.tiempo_ms} ms`;
    if (hashGenesis) hashGenesis.textContent = data.hash_genesis || '--';
    if (latestSeal) latestSeal.textContent = data.ultimo_sello || '--';
    if (auditorName) auditorName.textContent = data.verificado_por || 'Administrador';
    if (timestampEl) timestampEl.textContent = data.verificado_en || '--';

    if (data.status === 'INTEGRA') {
      if (heroBanner) heroBanner.className = 'integrity-hero-banner status-valid';
      if (heroIcon) heroIcon.innerHTML = `<i data-lucide="shield-check" class="icon-lg"></i>`;
      if (heroTitle) heroTitle.textContent = 'Cadena de Custodia 100% Íntegra';
      if (heroSubtitle) {
        heroSubtitle.textContent = `Todos los ${data.registros_validos} registros evaluados concuerdan con su firma matemática HMAC-SHA256. No existen alteraciones, eliminaciones ni inserciones ilegítimas.`;
      }
      if (metricStatus) {
        metricStatus.textContent = '100% ÍNTEGRO';
        metricStatus.className = 'metric-value status-badge valid';
      }
      if (metricSub) metricSub.textContent = 'Sin adulteraciones';
      if (anomaliesSection) anomaliesSection.style.display = 'none';

      showToast(`Cadena de custodia verificada: 100% íntegra (${data.tiempo_ms} ms)`, 'success');

    } else if (data.status === 'COMPROMETIDA') {
      if (heroBanner) heroBanner.className = 'integrity-hero-banner status-compromised';
      if (heroIcon) heroIcon.innerHTML = `<i data-lucide="alert-octagon" class="icon-lg"></i>`;
      if (heroTitle) heroTitle.textContent = `¡Alerta! ${data.registros_danados} Discrepancia(s) Criptográfica(s)`;
      if (heroSubtitle) {
        heroSubtitle.textContent = 'Se han detectado registros cuya firma HMAC-SHA256 no coincide o cuya continuidad de enlace fue rota directamente en la base de datos.';
      }
      if (metricStatus) {
        metricStatus.textContent = 'COMPROMETIDO';
        metricStatus.className = 'metric-value status-badge compromised';
      }
      if (metricSub) metricSub.textContent = 'Alteraciones detectadas';

      if (anomaliesSection) anomaliesSection.style.display = 'block';
      if (anomaliesCount) anomaliesCount.textContent = data.registros_danados;

      if (anomaliesList && Array.isArray(data.anomalias)) {
        anomaliesList.innerHTML = data.anomalias.map(anom => `
          <div class="anomaly-item">
            <div class="anomaly-item-header">
              <span>Registro #${anom.id} — [${escapeHtml(anom.modulo)} / ${escapeHtml(anom.accion)}]</span>
              <small style="color: var(--color-muted);">${escapeHtml(anom.creado_en)}</small>
            </div>
            <div class="anomaly-item-reason">
              <strong>Motivo:</strong> ${escapeHtml(anom.motivo)}
            </div>
            <div style="font-family: monospace; font-size: 0.72rem; color: var(--color-muted); margin-top: 0.25rem;">
              <span>Firma DB: ${escapeHtml(anom.hash_firma_db || '(Vacío)')}</span><br>
              <span>Firma Calculada: ${escapeHtml(anom.hash_firma_calc || '(N/A)')}</span>
            </div>
          </div>
        `).join('');
      }

      showToast(`¡Alerta! Se detectaron ${data.registros_danados} anomalías en la bitácora.`, 'error');

    } else {
      // Estado vacío
      if (heroBanner) heroBanner.className = 'integrity-hero-banner status-loading';
      if (heroIcon) heroIcon.innerHTML = `<i data-lucide="inbox" class="icon-lg"></i>`;
      if (heroTitle) heroTitle.textContent = 'Bitácora Sin Registros';
      if (heroSubtitle) heroSubtitle.textContent = 'Aún no se han generado registros en el libro mayor de auditoría.';
      if (metricStatus) {
        metricStatus.textContent = 'SIN REGISTROS';
        metricStatus.className = 'metric-value status-badge empty';
      }
      if (metricSub) metricSub.textContent = 'Libro nuevo';
      if (anomaliesSection) anomaliesSection.style.display = 'none';
    }

    refreshIcons();

    // Recargar tabla de auditoría silenciosamente para mostrar el evento de auditoría recién registrado
    loadLogs();

  } catch (err) {
    console.error('[Integrity Verification Error]', err);
    if (heroBanner) heroBanner.className = 'integrity-hero-banner status-compromised';
    if (heroIcon) heroIcon.innerHTML = `<i data-lucide="alert-triangle" class="icon-lg"></i>`;
    if (heroTitle) heroTitle.textContent = 'Error en Análisis Forense';
    if (heroSubtitle) heroSubtitle.textContent = err.message || 'No se pudo completar el análisis.';
    if (metricStatus) {
      metricStatus.textContent = 'ERROR';
      metricStatus.className = 'metric-value status-badge compromised';
    }
    showToast(`Error al verificar integridad: ${err.message}`, 'error');
    refreshIcons();
  }
}


/**
 * Renderiza el motor de Visual Diff amigable
 */
function renderVisualDiff(prevData, newData, log) {
  const container = document.getElementById('visualDiffContent');
  const badgeCount = document.getElementById('diffChangesBadge');
  const filterToggle = document.getElementById('visualDiffFilterToggle');
  if (!container) return;

  const hasPrev = prevData && typeof prevData === 'object' && Object.keys(prevData).length > 0;
  const hasNew = newData && typeof newData === 'object' && Object.keys(newData).length > 0;

  // CASO 1: Sin datos previos ni nuevos (Evento puramente informativo)
  if (!hasPrev && !hasNew) {
    if (badgeCount) badgeCount.textContent = 'Informativo';
    if (filterToggle) filterToggle.style.display = 'none';

    container.innerHTML = `
      <div class="diff-banner-card info">
        <div class="diff-banner-header">
          <i data-lucide="info" class="icon-sm" style="color: var(--color-gold);"></i>
          <div>
            <h4>Evento Informativo del Sistema</h4>
            <p>Esta acción no requirió captura de cambios de estado ni alteró estructuras de datos.</p>
          </div>
        </div>
      </div>
    `;
    refreshIcons();
    return;
  }

  // CASO 2: Solo datos nuevos (Registro de Creación / Emisión de Venta / Alta)
  if (!hasPrev && hasNew) {
    const keys = Object.keys(newData);
    if (badgeCount) badgeCount.textContent = `+${keys.length} atributos`;
    if (filterToggle) filterToggle.style.display = 'none';

    container.innerHTML = `
      <div class="diff-banner-card creation">
        <div class="diff-banner-header">
          <i data-lucide="plus-circle" class="icon-sm" style="color: var(--color-success);"></i>
          <div>
            <h4>Nuevo Registro / Parámetros del Evento</h4>
            <p>Se crearon o inicializaron los siguientes valores para este registro:</p>
          </div>
        </div>
        <div class="attributes-card-grid">
          ${renderAttributesGrid(newData)}
        </div>
      </div>
    `;
    refreshIcons();
    return;
  }

  // CASO 3: Solo datos previos (Eliminación / Baja)
  if (hasPrev && !hasNew) {
    const keys = Object.keys(prevData);
    if (badgeCount) badgeCount.textContent = `-${keys.length} eliminados`;
    if (filterToggle) filterToggle.style.display = 'none';

    container.innerHTML = `
      <div class="diff-banner-card deletion">
        <div class="diff-banner-header">
          <i data-lucide="trash-2" class="icon-sm" style="color: var(--color-danger);"></i>
          <div>
            <h4>Registro Eliminado</h4>
            <p>Datos que fueron removidos de la base de datos:</p>
          </div>
        </div>
        <div class="attributes-card-grid">
          ${renderAttributesGrid(prevData)}
        </div>
      </div>
    `;
    refreshIcons();
    return;
  }

  // CASO 4: Ambos objetos existen (Comparación directa de Estado Previo vs Estado Nuevo)
  if (filterToggle) filterToggle.style.display = 'flex';

  const diffRows = [];
  const handledKeysInNew = new Set();
  let changedCount = 0;

  // Parejas lógicas conocidas (ej. stock_anterior <-> stock_nuevo)
  const pairedPatterns = [
    { prevKey: 'stock_anterior', newKey: 'stock_nuevo', label: 'Existencias (Stock)' },
    { prevKey: 'precio_anterior', newKey: 'precio_nuevo', label: 'Precio de Venta ($)' },
    { prevKey: 'costo_anterior', newKey: 'costo_nuevo', label: 'Costo Unitario ($)' },
    { prevKey: 'pin_anterior', newKey: 'pin_nuevo', label: 'Código PIN de Acceso' },
    { prevKey: 'estado_anterior', newKey: 'estado_nuevo', label: 'Estado de Cuenta' }
  ];

  pairedPatterns.forEach(pair => {
    if (prevData[pair.prevKey] !== undefined && newData[pair.newKey] !== undefined) {
      const isMod = !areValuesEqual(prevData[pair.prevKey], newData[pair.newKey]);
      if (isMod) changedCount++;
      handledKeysInNew.add(pair.newKey);

      diffRows.push({
        key: `${pair.prevKey} ➔ ${pair.newKey}`,
        label: pair.label,
        prevVal: prevData[pair.prevKey],
        newVal: newData[pair.newKey],
        status: isMod ? 'changed' : 'unchanged'
      });
    }
  });

  // Claves del objeto previo
  Object.keys(prevData).forEach(key => {
    // Si ya fue manejada por pares lógicos, continuar
    if (pairedPatterns.some(p => p.prevKey === key && newData[p.newKey] !== undefined)) {
      return;
    }

    if (newData[key] !== undefined) {
      handledKeysInNew.add(key);
      const isMod = !areValuesEqual(prevData[key], newData[key]);
      if (isMod) changedCount++;

      diffRows.push({
        key: key,
        label: formatKeyLabel(key),
        prevVal: prevData[key],
        newVal: newData[key],
        status: isMod ? 'changed' : 'unchanged'
      });
    } else {
      // Solo en datos previos (campo removido o no modificado en el update)
      diffRows.push({
        key: key,
        label: formatKeyLabel(key),
        prevVal: prevData[key],
        newVal: null,
        status: 'unchanged'
      });
    }
  });

  // Claves que solo están en datos nuevos
  Object.keys(newData).forEach(key => {
    if (!handledKeysInNew.has(key)) {
      changedCount++;
      diffRows.push({
        key: key,
        label: formatKeyLabel(key),
        prevVal: null,
        newVal: newData[key],
        status: 'added'
      });
    }
  });

  if (badgeCount) {
    badgeCount.textContent = `${changedCount} ${changedCount === 1 ? 'cambio' : 'cambios'}`;
  }

  // Renderizar tabla
  const rowsHtml = diffRows.map(row => {
    const isChanged = (row.status === 'changed' || row.status === 'added' || row.status === 'removed');
    const rowClass = isChanged ? 'row-changed' : 'row-unchanged';

    let prevCell = '';
    let newCell = '';
    let statusBadge = '';

    if (row.status === 'changed') {
      prevCell = `<span class="val-prev-pill">${formatDisplayValue(row.prevVal, row.key)}</span>`;
      newCell = `<span class="val-new-pill">${formatDisplayValue(row.newVal, row.key)}</span>`;
      statusBadge = `<span class="diff-status-badge changed"><i data-lucide="refresh-cw" class="icon-xs"></i> Modificado</span>`;
    } else if (row.status === 'added') {
      prevCell = `<span class="val-neutral-pill" style="color: var(--color-muted);">—</span>`;
      newCell = `<span class="val-new-pill">${formatDisplayValue(row.newVal, row.key)}</span>`;
      statusBadge = `<span class="diff-status-badge added"><i data-lucide="plus" class="icon-xs"></i> Añadido</span>`;
    } else if (row.status === 'removed') {
      prevCell = `<span class="val-prev-pill">${formatDisplayValue(row.prevVal, row.key)}</span>`;
      newCell = `<span class="val-neutral-pill" style="color: var(--color-muted);">—</span>`;
      statusBadge = `<span class="diff-status-badge removed"><i data-lucide="trash-2" class="icon-xs"></i> Removido</span>`;
    } else {
      prevCell = `<span class="val-neutral-pill">${formatDisplayValue(row.prevVal, row.key)}</span>`;
      newCell = `<span class="val-neutral-pill">${formatDisplayValue(row.newVal !== null ? row.newVal : row.prevVal, row.key)}</span>`;
      statusBadge = `<span class="diff-status-badge unchanged"><i data-lucide="check" class="icon-xs"></i> Sin Cambios</span>`;
    }

    return `
      <tr class="${rowClass}">
        <td class="field-label-cell">
          ${escapeHtml(row.label)}
          <span class="field-key-sub">${escapeHtml(row.key)}</span>
        </td>
        <td>${prevCell}</td>
        <td style="text-align: center;">
          <span class="val-arrow-indicator">➔</span>
        </td>
        <td>${newCell}</td>
        <td style="text-align: center;">
          ${statusBadge}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="visual-diff-wrapper ${state.hideUnchanged ? 'hide-unchanged' : ''}">
      <table class="visual-diff-table">
        <thead>
          <tr>
            <th style="width: 26%;">Campo / Atributo</th>
            <th style="width: 31%;">Estado Previo (Antes)</th>
            <th style="width: 5%; text-align: center;"></th>
            <th style="width: 31%;">Estado Nuevo (Después)</th>
            <th style="width: 7%; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  refreshIcons();
}

/**
 * Renderiza atributos clave en tarjetas
 */
function renderAttributesGrid(data) {
  if (!data || typeof data !== 'object') return '';
  return Object.entries(data).map(([key, val]) => {
    return `
      <div class="attr-item">
        <strong>${escapeHtml(formatKeyLabel(key))}</strong>
        <span>${formatDisplayValue(val, key)}</span>
      </div>
    `;
  }).join('');
}

/**
 * Helper: Aplica filtros al hacer clic en las tarjetas KPI (con soporte para alternar/toggle)
 */
function applyKpiFilter(kpiType) {
  const selectSeveridad = document.getElementById('selectSeveridad');
  const inputFechaInicio = document.getElementById('inputFechaInicio');
  const inputFechaFin = document.getElementById('inputFechaFin');
  const chipButtons = document.querySelectorAll('.btn-chip');

  // Si se hace clic en la misma tarjeta ya activa (excepto 'all'), alternar de regreso a 'all'
  if (kpiType !== 'all' && state.activeKpi === kpiType) {
    kpiType = 'all';
  }

  if (kpiType === 'all') {
    state.activeKpi = 'all';
    state.severidad = 'ALL';
    state.fechaInicio = '';
    state.fechaFin = '';
    if (selectSeveridad) selectSeveridad.value = 'ALL';
    if (dateRangeController) {
      dateRangeController.reset();
    } else {
      if (inputFechaInicio) inputFechaInicio.value = '';
      if (inputFechaFin) inputFechaFin.value = '';
    }
    chipButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'all'));
    showToast('Mostrando todos los eventos registrados.', 'info');

  } else if (kpiType === 'danger') {
    state.activeKpi = 'danger';
    state.severidad = 'DANGER';
    state.fechaInicio = '';
    state.fechaFin = '';
    if (selectSeveridad) selectSeveridad.value = 'DANGER';
    if (dateRangeController) {
      dateRangeController.reset();
    } else {
      if (inputFechaInicio) inputFechaInicio.value = '';
      if (inputFechaFin) inputFechaFin.value = '';
    }
    chipButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'all'));
    showToast('Filtrando por eventos críticos (Peligro).', 'error');

  } else if (kpiType === 'warning') {
    state.activeKpi = 'warning';
    state.severidad = 'WARNING';
    state.fechaInicio = '';
    state.fechaFin = '';
    if (selectSeveridad) selectSeveridad.value = 'WARNING';
    if (dateRangeController) {
      dateRangeController.reset();
    } else {
      if (inputFechaInicio) inputFechaInicio.value = '';
      if (inputFechaFin) inputFechaFin.value = '';
    }
    chipButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'all'));
    showToast('Filtrando por advertencias de negocio.', 'warning');

  } else if (kpiType === 'today') {
    state.activeKpi = 'today';
    state.severidad = 'ALL';
    if (selectSeveridad) selectSeveridad.value = 'ALL';

    const today = getLocalDateIso();
    state.fechaInicio = today;
    state.fechaFin = today;
    if (dateRangeController) {
      dateRangeController.setRange(today, today, false);
    } else {
      if (inputFechaInicio) inputFechaInicio.value = today;
      if (inputFechaFin) inputFechaFin.value = today;
    }
    chipButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'today'));
    showToast('Filtrando actividad ocurrida hoy.', 'success');
  }

  state.page = 1;
  loadLogs();
}

/**
 * Helper: Actualiza el borde y resaltado de la tarjeta KPI activa
 */
function updateActiveKpiHighlight() {
  const kpiCards = document.querySelectorAll('.bitacora-kpi-card[data-kpi]');
  kpiCards.forEach(c => c.classList.remove('active-filter'));

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (state.fechaInicio === todayStr && state.fechaFin === todayStr);

  let activeTarget = null;

  if (state.severidad === 'DANGER' && !state.fechaInicio && !state.fechaFin) {
    activeTarget = 'danger';
  } else if (state.severidad === 'WARNING' && !state.fechaInicio && !state.fechaFin) {
    activeTarget = 'warning';
  } else if (isToday && (state.severidad === 'ALL' || !state.severidad)) {
    activeTarget = 'today';
  } else if (state.severidad === 'ALL' && !state.fechaInicio && !state.fechaFin) {
    activeTarget = 'all';
  }

  state.activeKpi = activeTarget || '';

  if (activeTarget) {
    document.querySelector(`.bitacora-kpi-card[data-kpi="${activeTarget}"]`)?.classList.add('active-filter');
  }
}

/**
 * Helper: Copia al portapapeles el resumen estructurado del evento
 */
function copyLogSummary() {
  const log = state.currentLog;
  if (!log) return;

  const lines = [
    `=== LA NUEVA PARISIENNE - AUDITORÍA #${log.id} ===`,
    `Fecha: ${log.creado_en}`,
    `Severidad: ${log.severidad}`,
    `Módulo: ${log.modulo} | Acción: ${log.accion}`,
    `Usuario: ${log.usuario} (${log.rol || 'Sin Rol'})`,
    `IP Origen: ${log.ip_origen}`,
    `Descripción: ${log.descripcion}`,
    `Dispositivo: ${log.user_agent || 'N/A'}`,
    `----------------------------------------`,
    `Datos Previos: ${log.datos_previos || 'N/A'}`,
    `Datos Nuevos: ${log.datos_nuevos || 'N/A'}`
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('Resumen del evento copiado al portapapeles.', 'success');
  }).catch(() => {
    showToast('No se pudo copiar al portapapeles.', 'error');
  });
}

/**
 * Notificación Toast flotante
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastText');
  const toastIcon = document.getElementById('toastIcon');
  if (!toast || !toastText) return;

  clearTimeout(toastTimeout);
  toastText.textContent = message;

  let iconName = 'check-circle-2';
  if (type === 'error' || type === 'danger') iconName = 'alert-octagon';
  else if (type === 'warning') iconName = 'alert-triangle';
  else if (type === 'info') iconName = 'info';

  if (toastIcon) {
    toastIcon.innerHTML = `<i data-lucide="${iconName}" class="icon-sm"></i>`;
  }

  toast.className = `toast-notification active ${type}`;
  refreshIcons();

  toastTimeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

/**
 * Helper: Formatea etiquetas de campos a nombres humanos y legibles
 */
function formatKeyLabel(key) {
  const KEY_LABELS = {
    'stock_actual': 'Stock Actual',
    'stock_anterior': 'Stock Anterior',
    'stock_nuevo': 'Stock Nuevo',
    'precio_usd': 'Precio de Venta ($)',
    'precio_anterior': 'Precio Anterior ($)',
    'precio_nuevo': 'Precio Nuevo ($)',
    'costo_usd': 'Costo Unitario ($)',
    'total_usd': 'Total Venta ($)',
    'total_bs': 'Total en Bolívares (Bs.)',
    'subtotal': 'Subtotal ($)',
    'descuento': 'Descuento ($)',
    'metodo_pago': 'Método de Pago',
    'numero_orden': 'Número de Orden',
    'tipo_ajuste': 'Tipo de Ajuste',
    'motivo': 'Motivo / Razón',
    'rol': 'Rol Asignado',
    'rol_id': 'ID de Rol',
    'estado': 'Estado de Cuenta',
    'turno': 'Turno de Trabajo',
    'pin_2fa': 'Código 2FA',
    'mfa_tipo': 'Método MFA',
    'email': 'Correo Electrónico',
    'nombre': 'Nombre / Denominación',
    'user_id': 'ID de Usuario',
    'items_count': 'Cantidad de Ítems',
    'tipo_intento': 'Tipo de Intento',
    'costo_anterior': 'Costo Anterior ($)',
    'costo_nuevo': 'Costo Nuevo ($)',
    'monto_pagado': 'Monto Pagado ($)',
    'codigo_orden': 'Código de Orden',
    'asiento_contable': 'Comprobante / Asiento Contable',
    'total_debe': 'Total Débitos (Debe)',
    'total_haber': 'Total Créditos (Haber)',
    'partidas_count': 'Total Renglones Contables',
    'total_horneado': 'Total Piezas Horneadas',
    'merma': 'Cantidad de Merma',
    'motivo_merma': 'Causa de Merma',
    'ingreso_neto': 'Unidades Netas a Vitrina',
    'panadero': 'Panadero Responsable',
    'modo_tasa': 'Modalidad de Tasa Cambiaria',
    'tasa_manual': 'Tasa Manual (Bs./$)',
    'condicion_pago': 'Condición de Pago',
    'resumen_items': 'Resumen de Mercancía',
    'items_recibidos': 'Ítems Recibidos en Almacén',
    'fecha_entrega': 'Fecha Estimada de Entrega',
    'fecha_pedido': 'Fecha de Emisión de Orden'
  };

  if (KEY_LABELS[key]) return KEY_LABELS[key];

  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Helper: Formatea valores para visualización amigable
 */
function formatDisplayValue(val, key = '') {
  if (val === null || val === undefined || val === '') {
    return '<em>(Vacío / Nulo)</em>';
  }
  if (typeof val === 'boolean') {
    return val ? 'Sí / Activo' : 'No / Inactivo';
  }
  if (typeof val === 'number') {
    const keyLower = String(key).toLowerCase();
    if (keyLower.includes('precio') || keyLower.includes('costo') || keyLower.includes('total') || keyLower.includes('subtotal') || keyLower.includes('descuento')) {
      return `$${val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.toLocaleString('es-VE');
  }
  if (typeof val === 'object') {
    try {
      return `<code>${escapeHtml(JSON.stringify(val))}</code>`;
    } catch (e) {
      return escapeHtml(String(val));
    }
  }
  return escapeHtml(String(val));
}

/**
 * Helper: Compara si dos valores son equivalentes
 */
function areValuesEqual(v1, v2) {
  if (v1 === v2) return true;
  if (typeof v1 === 'number' && typeof v2 === 'number') {
    return Math.abs(v1 - v2) < 0.0001;
  }
  if (typeof v1 === 'object' && typeof v2 === 'object') {
    return JSON.stringify(v1) === JSON.stringify(v2);
  }
  return String(v1).trim() === String(v2).trim();
}


/**
 * Exporta los resultados actuales a archivo CSV compatible con Excel
 */
function exportToCsv() {
  const dateCheck = validateDateRange(state.fechaInicio, state.fechaFin, {
    allowFuture: false,
    minDate: '2024-01-01',
    maxRangeDays: 366
  });
  if (!dateCheck.valid) {
    showToast(`No se puede exportar: ${dateCheck.error}`, 'warning');
    return;
  }

  const auth = getAuthContext();
  const queryParams = new URLSearchParams({
    modulo: state.modulo,
    severidad: state.severidad,
    search: state.search,
    fecha_inicio: state.fechaInicio,
    fecha_fin: state.fechaFin,
    user_id: auth.userId,
    role_code: auth.roleCode
  });

  const exportUrl = `../api/bitacora/export_logs.php?${queryParams.toString()}`;
  window.location.href = exportUrl;
}

/**
 * Exporta el reporte filtrado a formato PDF / Vista de Impresión oficial
 */
function exportToPdf() {
  const dateCheck = validateDateRange(state.fechaInicio, state.fechaFin, {
    allowFuture: false,
    minDate: '2024-01-01',
    maxRangeDays: 366
  });
  if (!dateCheck.valid) {
    showToast(`No se puede exportar: ${dateCheck.error}`, 'warning');
    return;
  }

  const auth = getAuthContext();
  const queryParams = new URLSearchParams({
    modulo: state.modulo,
    severidad: state.severidad,
    search: state.search,
    fecha_inicio: state.fechaInicio,
    fecha_fin: state.fechaFin,
    auto_print: '1',
    user_id: auth.userId,
    role_code: auth.roleCode
  });

  const pdfUrl = `../api/bitacora/export_pdf.php?${queryParams.toString()}`;
  window.open(pdfUrl, '_blank');
}

/**
 * Abre el modal de mantenimiento y carga las estadísticas actuales
 */
function openMaintenanceModal() {
  const modal = document.getElementById('maintenanceModal');
  if (!modal) return;
  modal.classList.add('active');
  loadMaintenanceStats();
}

/**
 * Cierra el modal de mantenimiento
 */
function closeMaintenanceModal() {
  const modal = document.getElementById('maintenanceModal');
  modal?.classList.remove('active');
  const passInput = document.getElementById('inputArchivePassword');
  if (passInput) passInput.value = '';
}

/**
 * Consulta las estadísticas de almacenamiento de bitácora
 */
async function loadMaintenanceStats() {
  const totalActivosEl = document.getElementById('diagTotalActivos');
  const rangoFechasEl = document.getElementById('diagRangoFechas');
  const tamanioMbEl = document.getElementById('diagTamanioMb');
  const totalHistoricoEl = document.getElementById('diagTotalHistorico');

  if (totalActivosEl) totalActivosEl.textContent = '...';

  try {
    const auth = getAuthContext();
    const response = await fetch(`../api/bitacora/mantenimiento.php?action=stats&user_id=${encodeURIComponent(auth.userId)}&role_code=${encodeURIComponent(auth.roleCode)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-User-Id': auth.userId,
        'X-User-Role': auth.roleCode
      }
    });
    if (!response.ok) throw new Error('Error al consultar estadísticas de mantenimiento.');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error en diagnóstico.');

    state.maintenanceStats = data;

    if (totalActivosEl) totalActivosEl.textContent = Number(data.total_activos || 0).toLocaleString('es-VE');
    if (tamanioMbEl) tamanioMbEl.textContent = `${Number(data.tamanio_estimado_mb || 0).toFixed(2)} MB`;
    if (totalHistoricoEl) totalHistoricoEl.textContent = Number(data.total_historico || 0).toLocaleString('es-VE');

    if (rangoFechasEl) {
      if (data.fecha_mas_antigua && data.fecha_mas_antigua !== 'N/A') {
        rangoFechasEl.textContent = `Desde ${data.fecha_mas_antigua.split(' ')[0]}`;
      } else {
        rangoFechasEl.textContent = 'Sin eventos';
      }
    }

    updateArchiveCandidatesBadge();
    refreshIcons();

  } catch (err) {
    console.error('[Maintenance Stats Error]', err);
    showToast(err.message, 'error');
  }
}

/**
 * Actualiza el contador de registros candidatos a ser archivados según el selector
 */
function updateArchiveCandidatesBadge() {
  const selectDays = document.getElementById('selectArchiveDays');
  const badgeEl = document.getElementById('archiveCandidatesCount');
  if (!selectDays || !badgeEl || !state.maintenanceStats) return;

  const days = parseInt(selectDays.value, 10);
  let count = 0;
  if (days === 90) count = state.maintenanceStats.mayores_90d || 0;
  else if (days === 180) count = state.maintenanceStats.mayores_180d || 0;
  else if (days === 365) count = state.maintenanceStats.mayores_365d || 0;
  else if (days === 30) count = state.maintenanceStats.mayores_30d || 0;
  else if (days === 60) count = state.maintenanceStats.mayores_60d || 0;

  badgeEl.textContent = `${count} ${count === 1 ? 'registro' : 'registros'}`;
}

/**
 * Descarga el respaldo criptográfico JSON
 */
function downloadBackupJson() {
  const auth = getAuthContext();
  const selectPeriod = document.getElementById('selectBackupPeriod');
  const days = selectPeriod ? selectPeriod.value : 90;
  showToast('Generando respaldo criptográfico inmutable...', 'info');
  window.location.href = `../api/bitacora/mantenimiento.php?action=backup_json&dias=${days}&user_id=${encodeURIComponent(auth.userId)}&role_code=${encodeURIComponent(auth.roleCode)}`;
}

/**
 * Ejecuta el archivado histórico transaccional
 */
async function executeArchiving() {
  const selectDays = document.getElementById('selectArchiveDays');
  const passInput = document.getElementById('inputArchivePassword');
  const days = parseInt(selectDays?.value || 90, 10);
  const password = passInput?.value?.trim() || '';

  if (!password) {
    showToast('Debe ingresar su contraseña o PIN de administrador.', 'error');
    passInput?.focus();
    return;
  }

  const confirmed = window.confirm(
    `¿Confirmar archivado?\n\nLos registros con más de ${days} días serán trasladados transaccionalmente a la tabla 'bitacora_historico'. Esta operación no destruye datos.`
  );
  if (!confirmed) return;

  try {
    showToast('Ejecutando archivado histórico...', 'info');
    const auth = getAuthContext();

    const response = await fetch('../api/bitacora/mantenimiento.php?action=archivar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': auth.userId,
        'X-User-Role': auth.roleCode
      },
      body: JSON.stringify({ dias: days, password, user_id: auth.userId, role_code: auth.roleCode })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al ejecutar el archivado.');
    }

    showToast(`Archivado exitoso: ${data.registros_movidos} registros trasladados al histórico.`, 'success');
    if (passInput) passInput.value = '';

    // Recargar métricas y tabla
    await loadMaintenanceStats();
    await loadLogs();

  } catch (err) {
    console.error('[Archiving Error]', err);
    showToast(err.message, 'error');
  }
}


/**
 * Helper: Formatea marcas de tiempo SQL a formato legible
 */
function formatTimestamp(timestampStr) {
  if (!timestampStr) return { date: '--', time: '--' };
  try {
    const d = new Date(timestampStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return { date: timestampStr, time: '' };

    const dateFormatted = d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const timeFormatted = d.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { date: dateFormatted, time: timeFormatted };
  } catch (e) {
    return { date: timestampStr, time: '' };
  }
}

/**
 * Helper: Sanitiza texto para evitar inyecciones HTML en el visor
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Refresca iconos de Lucide
 */
function refreshIcons() {
  if (window.LucideIcons?.refresh) {
    window.LucideIcons.refresh();
  } else if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}
