/* ==========================================================================
   MÓDULO DE CONTABILIDAD GENERAL Y AUDITORÍA (ACCOUNTING.JS)
   Controlador estilo software administrativo (Saint Contabilidad / Profit Plus)
   Libro Diario, Libro Mayor con Folios y Cuentas T, y Balance de Comprobación
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { PLAN_CUENTAS, AUTOMATIC_ENTRIES, TRIAL_BALANCE_ACCOUNTS } from '../data/accounting-db.js';

function initAccounting() {
  // 1. Verificación de Seguridad y Sesión
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo sesión:', err);
  }

  const activeUser = (session && session.user) ? session.user : {
    name: 'Andrés Felipe Gómez',
    role: 'Contador General',
    roleCode: 'ACCOUNTANT',
    icon: 'user-check'
  };

  const userRole = (activeUser.role || '').toLowerCase();
  const userRoleCode = (activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin');
  const isContador = isSuperadmin || userRoleCode === 'ACCOUNTANT' || userRole.includes('contador');

  if (!isContador) {
    let redirectUrl = 'dashboard.html';
    if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    else if (userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero')) redirectUrl = 'kitchen.html';
    window.location.replace(redirectUrl);
    return;
  }

  // Actualizar datos del usuario activo en UI
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = activeUser.name;
  if (userAvatarEl) {
    userAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'user-check') : '';
    window.LucideIcons?.refresh();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      SessionStore.logout();
    });
  }

  // 2. Estado Contable
  let automaticEntries = JSON.parse(JSON.stringify(AUTOMATIC_ENTRIES));
  let trialBalance = JSON.parse(JSON.stringify(TRIAL_BALANCE_ACCOUNTS));
  let livePlanCuentas = JSON.parse(JSON.stringify(PLAN_CUENTAS));

  // Estados de vistas y filtros
  let activeJournalView = 'vouchers'; // 'vouchers' | 'table'
  let journalFilterText = '';
  let journalFilterType = 'all';

  let activeLedgerView = 'folio'; // 'folio' | 't'
  let ledgerSearchQuery = '';
  let ledgerSelectedAccount = 'all';
  let ledgerFilterCategory = 'with_movements';

  let balanceFilter = 'with_movements';

  // Renglones dinámicos del comprobante en edición (inicializados limpios)
  let modalVoucherRows = [
    { accountCode: '5105', detail: '', debe: 0.00, haber: 0.00 },
    { accountCode: '1105', detail: '', debe: 0.00, haber: 0.00 }
  ];

  // 3. Referencias DOM
  // Control Bar
  const statTotalVouchers = document.getElementById('statTotalVouchers');
  const statTotalDebe = document.getElementById('statTotalDebe');
  const statTotalHaber = document.getElementById('statTotalHaber');
  const statBalanceStatus = document.getElementById('statBalanceStatus');
  const auditStatusBadge = document.getElementById('auditStatusBadge');

  // Libro Diario
  const vouchersListContainer = document.getElementById('vouchersListContainer');
  const journalTableContainer = document.getElementById('journalTableContainer');
  const journalTableBody = document.getElementById('journalTableBody');
  const journalSearchInput = document.getElementById('journalSearchInput');
  const journalFilterTypeEl = document.getElementById('journalFilterType');
  const journalCountBadge = document.getElementById('journalCountBadge');
  const btnViewVouchers = document.getElementById('btnViewVouchers');
  const btnViewJournalTable = document.getElementById('btnViewJournalTable');

  // Libro Mayor
  const ledgerFolioContainer = document.getElementById('ledgerFolioContainer');
  const tAccountsGridContainer = document.getElementById('tAccountsGridContainer');
  const ledgerSearchInput = document.getElementById('ledgerSearchInput');
  const ledgerAccountPicker = document.getElementById('ledgerAccountPicker');
  const ledgerFilterSelect = document.getElementById('ledgerFilterSelect');
  const ledgerCountBadge = document.getElementById('ledgerCountBadge');
  const btnLedgerFolioView = document.getElementById('btnLedgerFolioView');
  const btnLedgerTView = document.getElementById('btnLedgerTView');

  // Balance de Comprobación
  const balanceBody = document.getElementById('balanceBody');
  const balanceFoot = document.getElementById('balanceFoot');
  const balanceFilterSelect = document.getElementById('balanceFilterSelect');
  const verificationDebeTotal = document.getElementById('verificationDebeTotal');
  const verificationHaberTotal = document.getElementById('verificationHaberTotal');
  const verificationDeudorTotal = document.getElementById('verificationDeudorTotal');
  const verificationAcreedorTotal = document.getElementById('verificationAcreedorTotal');

  // PUC
  const pucTableBody = document.getElementById('pucTableBody');

  // Modal Editor de Comprobante
  const manualEntryModal = document.getElementById('manualEntryModal');
  const closeEntryModalBtn = document.getElementById('closeEntryModalBtn');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const manualEntryForm = document.getElementById('manualEntryForm');
  const btnOpenManualEntry = document.getElementById('btnOpenManualEntry');
  const entryDateInput = document.getElementById('entryDateInput');
  const entryTypeSelect = document.getElementById('entryTypeSelect');
  const entryConceptInput = document.getElementById('entryConceptInput');
  const voucherRowsBody = document.getElementById('voucherRowsBody');
  const btnAddEntryRow = document.getElementById('btnAddEntryRow');
  const btnAutoBalanceRow = document.getElementById('btnAutoBalanceRow');
  const editorDebeTotal = document.getElementById('editorDebeTotal');
  const editorHaberTotal = document.getElementById('editorHaberTotal');
  const editorDiffTotal = document.getElementById('editorDiffTotal');
  const editorBalanceBadge = document.getElementById('editorBalanceBadge');

  // Modal Reporte Balance Imprimible
  const btnPrintBalance = document.getElementById('btnPrintBalance');
  const btnPrintBalanceQuick = document.getElementById('btnPrintBalanceQuick');
  const btnExportBalanceExcelTop = document.getElementById('btnExportBalanceExcelTop');
  const btnExportBalanceExcelQuick = document.getElementById('btnExportBalanceExcelQuick');
  const balanceModal = document.getElementById('balanceReportModal');
  const balanceSheet = document.getElementById('balanceReportSheet');
  const btnPrintBalanceModal = document.getElementById('btnPrintBalanceModal');
  const btnExportBalanceExcel = document.getElementById('btnExportBalanceExcel');
  const btnCloseBalanceModal = document.getElementById('btnCloseBalanceModal');

  // Inicializar fecha
  if (entryDateInput) {
    entryDateInput.value = new Date().toISOString().split('T')[0];
  }

  // 4. Carga inicial
  populateLedgerAccountPicker();
  renderAll();
  loadAccountingFromApi();

  // Sincronización API MySQL
  async function loadAccountingFromApi() {
    try {
      const res = await fetch(`../api/accounting/get_accounting.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.vouchers)) automaticEntries = data.vouchers;
          if (Array.isArray(data.trial_balance)) trialBalance = data.trial_balance;
          if (Array.isArray(data.plan_cuentas)) livePlanCuentas = data.plan_cuentas;

          populateLedgerAccountPicker();
          renderAll();
        }
      }
    } catch (err) {
      console.warn('Contabilidad: Operando con respaldo local.', err);
    }
  }

  // Escuchar cambios de POS y compras en vivo
  if (typeof BroadcastChannel !== 'undefined') {
    const movChannel = new BroadcastChannel('lnp_movements_channel');
    movChannel.onmessage = () => loadAccountingFromApi();
  }
  window.addEventListener('movimientosChanged', () => loadAccountingFromApi());

  function renderAll() {
    renderControlBar();
    renderJournal();
    renderLedger();
    renderTrialBalance();
    renderPUCTable();
    window.LucideIcons?.refresh();
  }

  // 5. Franja de Control y Resumen de Auditoría
  function renderControlBar() {
    let totDebe = 0;
    let totHaber = 0;

    automaticEntries.forEach(v => {
      totDebe += Number(v.totalDebe || 0);
      totHaber += Number(v.totalHaber || 0);
    });

    const isBalanced = Math.abs(totDebe - totHaber) < 0.05;

    if (statTotalVouchers) statTotalVouchers.textContent = `${automaticEntries.length} Asientos`;
    if (statTotalDebe) statTotalDebe.textContent = `$${totDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (statTotalHaber) statTotalHaber.textContent = `$${totHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (statBalanceStatus) {
      if (isBalanced) {
        statBalanceStatus.className = 'control-val status-balanced';
        statBalanceStatus.innerHTML = `<i data-lucide="check" class="icon-xs"></i> Cuadrada (Debe = Haber)`;
      } else {
        statBalanceStatus.className = 'control-val status-unbalanced';
        statBalanceStatus.innerHTML = `<i data-lucide="alert-triangle" class="icon-xs"></i> Descuadre en Sumas`;
      }
    }

    if (auditStatusBadge) {
      if (isBalanced) {
        auditStatusBadge.style.color = 'var(--color-success)';
        auditStatusBadge.innerHTML = `<i data-lucide="check-circle-2" class="icon-xs"></i> Ecuación Patrimonial Verificada`;
      } else {
        auditStatusBadge.style.color = '#DC2626';
        auditStatusBadge.innerHTML = `<i data-lucide="alert-circle" class="icon-xs"></i> Descuadre Detectado`;
      }
    }
  }

  // 6. PILAR 1: LIBRO DIARIO GENERAL
  function renderJournal() {
    const query = (journalSearchInput?.value || '').toLowerCase().trim();
    const type = journalFilterTypeEl?.value || 'all';

    const filtered = automaticEntries.filter(entry => {
      // Filtro por tipo/módulo
      if (type !== 'all') {
        const mod = (entry.sourceModule || '').toLowerCase();
        if (type === 'pos' && !mod.includes('pos') && !mod.includes('venta')) return false;
        if (type === 'proveedores' && !mod.includes('proveedor') && !mod.includes('compra')) return false;
        if (type === 'inventario' && !mod.includes('inventario') && !mod.includes('merma') && !mod.includes('cocina')) return false;
        if (type === 'manual' && !mod.includes('manual') && !mod.includes('ajuste') && !mod.includes('contador')) return false;
      }

      // Filtro por texto
      if (!query) return true;
      const matchCode = (entry.code || '').toLowerCase().includes(query);
      const matchConcept = (entry.concept || '').toLowerCase().includes(query);
      const matchDate = (entry.date || '').toLowerCase().includes(query);
      const matchDetails = (entry.details || []).some(d => 
        (d.accountCode || '').toLowerCase().includes(query) ||
        (d.accountName || '').toLowerCase().includes(query)
      );
      return matchCode || matchConcept || matchDate || matchDetails;
    });

    if (journalCountBadge) {
      journalCountBadge.textContent = `${filtered.length} Comprobantes`;
    }

    if (activeJournalView === 'vouchers') {
      vouchersListContainer.style.display = 'flex';
      journalTableContainer.style.display = 'none';
      renderVouchersView(filtered);
    } else {
      vouchersListContainer.style.display = 'none';
      journalTableContainer.style.display = 'block';
      renderContinuousJournalView(filtered);
    }
  }

  // Vista 1: Fichas de Comprobante de Diario (Estilo Parisian Chic & Saint/Profit)
  function renderVouchersView(entries) {
    if (!vouchersListContainer) return;
    vouchersListContainer.innerHTML = '';

    if (entries.length === 0) {
      vouchersListContainer.innerHTML = `
        <div style="background: var(--bg-surface); border: var(--border-glass); border-radius: var(--radius-md); padding: 3rem; text-align: center; color: var(--color-muted);">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--bg-main); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; border: var(--border-glass);">
            <i data-lucide="file-text" class="icon-md" style="color: var(--color-gold);"></i>
          </div>
          <p style="margin: 0; font-weight: 700; font-size: 1rem; color: var(--color-espresso);">No se encontraron comprobantes de diario</p>
          <span style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.35rem; display: block;">Modifique los términos de búsqueda o seleccione otro módulo de origen.</span>
        </div>
      `;
      window.LucideIcons?.refresh();
      return;
    }

    entries.forEach(voucher => {
      const card = document.createElement('div');
      card.className = 'voucher-card';

      const rateHist = Number(voucher.bcvRateHistorical || 761.21);
      const vesTotal = Number(voucher.totalDebe) * rateHist;

      let rowsHtml = '';
      (voucher.details || []).forEach((det, idx) => {
        const isHaber = Number(det.haber) > 0;
        rowsHtml += `
          <tr>
            <td style="width: 40px; text-align: center; color: var(--color-light-muted); font-weight: 600;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 800; width: 95px; color: var(--color-espresso);">${det.accountCode}</td>
            <td style="${isHaber ? 'padding-left: 2rem;' : ''}">
              ${isHaber ? '<span style="color: var(--color-muted); font-style: italic; margin-right: 0.35rem;">a</span>' : ''}<strong>${det.accountName}</strong>
            </td>
            <td class="debe-amount" style="text-align: right; width: 140px;">
              ${Number(det.debe) > 0 ? '$' + Number(det.debe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </td>
            <td class="haber-amount" style="text-align: right; width: 140px;">
              ${Number(det.haber) > 0 ? '$' + Number(det.haber).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </td>
          </tr>
        `;
      });

      card.innerHTML = `
        <div class="voucher-card-header">
          <div class="voucher-code-title">
            <div class="voucher-icon"><i data-lucide="${voucher.icon || 'file-text'}"></i></div>
            <div>
              <strong style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--color-espresso); letter-spacing: -0.01em;">${voucher.code}</strong>
              <div style="font-size: 0.78rem; color: var(--color-muted); margin-top: 0.15rem;">
                Fecha: <strong>${voucher.date}</strong> &bull; Origen: <strong>${voucher.sourceModule}</strong>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <span class="voucher-source-tag">${voucher.sourceModule}</span>
            <div class="voucher-rate-pill">
              <i data-lucide="coins" class="icon-xs" style="color: var(--color-gold);"></i>
              Ref. BCV: Bs. ${rateHist.toFixed(2)}
            </div>
          </div>
        </div>

        <table class="voucher-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="width: 95px;">Código PUC</th>
              <th>Denominación de la Cuenta</th>
              <th style="text-align: right; width: 140px;">Debe ($ USD)</th>
              <th style="text-align: right; width: 140px;">Haber ($ USD)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="voucher-footer-summary">
          <div>
            <span style="color: var(--color-muted); font-style: italic; font-size: 0.82rem; font-weight: 500;">P/R: ${voucher.concept}</span>
            <div style="font-size: 0.74rem; color: var(--color-light-muted); margin-top: 0.2rem; font-weight: 600;">
              Equivalente Fiscal Oficial: <strong style="color: var(--color-espresso);">Bs. ${vesTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <span class="voucher-balanced-badge">
              <i data-lucide="shield-check" class="icon-xs"></i> Partida Doble Cuadrada
            </span>
            <strong style="font-size: 0.96rem; color: var(--color-espresso); font-variant-numeric: tabular-nums;">
              Total: $${Number(voucher.totalDebe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <button type="button" class="btn-print-voucher" data-code="${voucher.code}" title="Ver o imprimir este comprobante de diario oficial">
              <i data-lucide="printer" class="icon-xs"></i> <span>Imprimir Ficha</span>
            </button>
          </div>
        </div>
      `;

      vouchersListContainer.appendChild(card);
    });

    vouchersListContainer.querySelectorAll('.btn-print-voucher').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.currentTarget.dataset.code;
        openVoucherReportModal(code);
      });
    });

    window.LucideIcons?.refresh();
  }

  // Vista 2: Formato Formal Continuo de Libro Diario
  function renderContinuousJournalView(entries) {
    if (!journalTableBody) return;
    journalTableBody.innerHTML = '';

    if (entries.length === 0) {
      journalTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--color-muted);">
            No hay transacciones registradas que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    entries.forEach(voucher => {
      // Fila Encabezado Asiento
      const headerTr = document.createElement('tr');
      headerTr.className = 'journal-entry-row-header';
      headerTr.innerHTML = `
        <td colspan="6" style="padding: 0.65rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><strong style="color: var(--color-espresso);">Comprobante N° ${voucher.code}</strong> &bull; Fecha: ${voucher.date}</span>
            <span class="voucher-source-tag">${voucher.sourceModule}</span>
          </div>
        </td>
      `;
      journalTableBody.appendChild(headerTr);

      // Partidas al Debe
      (voucher.details || []).filter(d => Number(d.debe) > 0).forEach(det => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-family: monospace; color: var(--color-muted); font-size: 0.82rem;">${(voucher.date || '').split(' ')[0]}</td>
          <td style="font-family: monospace; font-weight: 700; font-size: 0.82rem; color: var(--color-espresso);">${voucher.code}</td>
          <td><strong>${det.accountName}</strong></td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: var(--color-espresso);">${det.accountCode}</td>
          <td class="debe-amount" style="text-align: right;">$${Number(det.debe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: var(--color-light-muted);">-</td>
        `;
        journalTableBody.appendChild(tr);
      });

      // Partidas al Haber (con sangría clásica)
      (voucher.details || []).filter(d => Number(d.haber) > 0).forEach(det => {
        const tr = document.createElement('tr');
        tr.className = 'journal-entry-row-credit';
        tr.innerHTML = `
          <td></td>
          <td></td>
          <td class="account-cell" style="padding-left: 2rem;"><span style="color: var(--color-muted); font-style: italic; margin-right: 0.35rem;">a</span> <strong>${det.accountName}</strong></td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: var(--color-espresso);">${det.accountCode}</td>
          <td style="text-align: right; color: var(--color-light-muted);">-</td>
          <td class="haber-amount" style="text-align: right;">$${Number(det.haber).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        journalTableBody.appendChild(tr);
      });

      // Glosa
      const glosaTr = document.createElement('tr');
      glosaTr.className = 'journal-glosa-row';
      glosaTr.innerHTML = `
        <td></td>
        <td></td>
        <td colspan="4" style="padding: 0.55rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><em style="color: var(--color-muted);">P/R: ${voucher.concept}</em></span>
            <strong style="color: var(--color-espresso); font-variant-numeric: tabular-nums;">Sumas Iguales: $${Number(voucher.totalDebe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </td>
      `;
      journalTableBody.appendChild(glosaTr);
    });
    window.LucideIcons?.refresh();
  }

  // 7. PILAR 2: LIBRO MAYOR GENERAL (FOLIOS Y CUENTAS T)
  function populateLedgerAccountPicker() {
    if (!ledgerAccountPicker) return;
    const currentVal = ledgerAccountPicker.value;

    let html = `<option value="all">Todas las Cuentas con Movimiento</option>`;
    (livePlanCuentas || PLAN_CUENTAS).forEach(acc => {
      html += `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`;
    });

    ledgerAccountPicker.innerHTML = html;
    if (currentVal) ledgerAccountPicker.value = currentVal;
  }

  function renderLedger() {
    const query = (ledgerSearchInput?.value || '').toLowerCase().trim();
    const selectedCode = ledgerAccountPicker?.value || 'all';
    const category = ledgerFilterSelect?.value || 'with_movements';

    // Filtrar cuentas para el libro mayor
    const filteredAccounts = trialBalance.filter(acc => {
      const code = String(acc.code || '');
      const name = (acc.name || '').toLowerCase();
      const type = (acc.type || '').toLowerCase();
      const hasMovements = (acc.sumDebe > 0) || (acc.sumHaber > 0);

      // Selector de cuenta única
      if (selectedCode !== 'all' && code !== selectedCode) return false;

      // Buscador
      if (query && !code.includes(query) && !name.includes(query)) return false;

      // Filtro de categoría
      if (category === 'with_movements' && !hasMovements) return false;
      if (category === 'activo' && (!code.startsWith('1') && !type.includes('activo'))) return false;
      if (category === 'pasivo' && (!code.startsWith('2') && !type.includes('pasivo'))) return false;
      if (category === 'patrimonio' && (!code.startsWith('3') && !type.includes('patrimonio'))) return false;
      if (category === 'ingreso' && (!code.startsWith('4') && !type.includes('ingreso'))) return false;
      if (category === 'gasto_costo' && (!code.startsWith('5') && !code.startsWith('6') && !type.includes('gasto') && !type.includes('costo'))) return false;

      return true;
    });

    if (ledgerCountBadge) {
      ledgerCountBadge.textContent = `${filteredAccounts.length} Cuentas`;
    }

    if (activeLedgerView === 'folio') {
      if (ledgerFolioContainer) ledgerFolioContainer.style.display = 'flex';
      if (tAccountsGridContainer) tAccountsGridContainer.style.display = 'none';
      renderLedgerFoliosView(filteredAccounts);
    } else {
      if (ledgerFolioContainer) ledgerFolioContainer.style.display = 'none';
      if (tAccountsGridContainer) tAccountsGridContainer.style.display = 'grid';
      renderLedgerTAccountsView(filteredAccounts);
    }
  }

  // Vista Folio Analítico de Mayor (Con Saldo Acumulado Progresivo)
  function renderLedgerFoliosView(accounts) {
    if (!ledgerFolioContainer) return;
    ledgerFolioContainer.innerHTML = '';

    if (accounts.length === 0) {
      ledgerFolioContainer.innerHTML = `
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 2.5rem; text-align: center; color: #64748B;">
          <p style="margin: 0; font-weight: 600;">No hay cuentas contables que coincidan con la búsqueda en el Libro Mayor.</p>
        </div>
      `;
      return;
    }

    accounts.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'ledger-folio-card';

      const isDeudora = (acc.nature || '').toLowerCase() === 'deudor' || (acc.nature || '').toLowerCase() === 'deudora';

      // Extraer movimientos cronológicos para esta cuenta
      const moves = [];
      automaticEntries.slice().reverse().forEach(voucher => {
        (voucher.details || []).forEach(det => {
          if (det.accountCode === acc.code) {
            moves.push({
              date: voucher.date,
              voucherCode: voucher.code,
              concept: voucher.concept,
              debe: Number(det.debe || 0),
              haber: Number(det.haber || 0)
            });
          }
        });
      });

      let runningBalance = 0.00;
      let rowsHtml = '';

      if (moves.length === 0) {
        rowsHtml = `
          <tr>
            <td colspan="6" style="text-align: center; color: #94A3B8; padding: 1rem;">
              Sin movimientos registrados en el período actual. Saldo inicial: $0.00.
            </td>
          </tr>
        `;
      } else {
        moves.forEach(m => {
          if (isDeudora) {
            runningBalance += (m.debe - m.haber);
          } else {
            runningBalance += (m.haber - m.debe);
          }

          rowsHtml += `
            <tr>
              <td style="font-family: monospace; color: #64748B;">${m.date}</td>
              <td style="font-family: monospace; font-weight: 700;">${m.voucherCode}</td>
              <td>${m.concept}</td>
              <td class="debe-amount" style="text-align: right;">${m.debe > 0 ? '$' + m.debe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td class="haber-amount" style="text-align: right;">${m.haber > 0 ? '$' + m.haber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td style="text-align: right; font-weight: 700; color: var(--color-espresso);">
                $${runningBalance.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          `;
        });
      }

      const saldoDeudor = Number(acc.saldoDeudor || 0);
      const saldoAcreedor = Number(acc.saldoAcreedor || 0);
      const saldoNeto = saldoDeudor > 0 ? saldoDeudor : saldoAcreedor;
      const saldoTipo = saldoDeudor > 0 ? 'Saldo Deudor' : (saldoAcreedor > 0 ? 'Saldo Acreedor' : 'Cuenta Saldada');

      card.innerHTML = `
        <div class="ledger-folio-header">
          <div class="folio-account-title">
            <code>${acc.code}</code> &bull; ${acc.name}
          </div>
          <div class="folio-account-meta">
            <span class="t-account-type-badge">${acc.type || 'Cuenta'}</span>
            <span>Naturaleza: <strong>${acc.nature || 'Deudora'}</strong></span>
          </div>
        </div>

        <table class="ledger-folio-table">
          <thead>
            <tr>
              <th style="width: 140px;">Fecha</th>
              <th style="width: 130px;">Comprobante</th>
              <th>Concepto / Explicación del Movimiento</th>
              <th style="width: 130px; text-align: right;">Debe ($)</th>
              <th style="width: 130px; text-align: right;">Haber ($)</th>
              <th style="width: 140px; text-align: right;">Saldo Progresivo ($)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="ledger-folio-footer">
          <div>
            <span>Sumas del Mayor: </span>
            <span class="highlight-debe" style="margin-right: 1.5rem;">Debe: $${Number(acc.sumDebe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="highlight-haber">Haber: $${Number(acc.sumHaber).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span>${saldoTipo}: </span>
            <strong style="color: ${saldoDeudor > 0 ? '#166534' : (saldoAcreedor > 0 ? '#991B1B' : '#64748B')}; font-size: 0.95rem;">
              $${saldoNeto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      `;

      ledgerFolioContainer.appendChild(card);
    });
  }

  // Vista Cuentas T Clásicas
  function renderLedgerTAccountsView(accounts) {
    if (!tAccountsGridContainer) return;
    tAccountsGridContainer.innerHTML = '';

    accounts.forEach(acc => {
      const card = document.createElement('div');
      card.className = 't-account-card';

      const debits = [];
      const credits = [];

      automaticEntries.forEach(voucher => {
        (voucher.details || []).forEach(det => {
          if (det.accountCode === acc.code) {
            if (Number(det.debe) > 0) debits.push({ ref: voucher.code, val: Number(det.debe) });
            if (Number(det.haber) > 0) credits.push({ ref: voucher.code, val: Number(det.haber) });
          }
        });
      });

      let debitsHtml = debits.length > 0 
        ? debits.map(d => `<div class="t-movement-item"><span class="t-move-ref">${d.ref}</span><span class="debe-amount">$${d.val.toFixed(2)}</span></div>`).join('')
        : `<div style="color: #CBD5E1; font-size: 0.75rem; padding: 0.5rem 0;">- Sin cargos -</div>`;

      let creditsHtml = credits.length > 0 
        ? credits.map(c => `<div class="t-movement-item"><span class="t-move-ref">${c.ref}</span><span class="haber-amount">$${c.val.toFixed(2)}</span></div>`).join('')
        : `<div style="color: #CBD5E1; font-size: 0.75rem; padding: 0.5rem 0;">- Sin abonos -</div>`;

      const saldoDeudor = Number(acc.saldoDeudor || 0);
      const saldoAcreedor = Number(acc.saldoAcreedor || 0);
      let saldoLabel = 'Saldo Cero';
      let saldoMonto = '$0.00';
      let saldoColor = '#64748B';

      if (saldoDeudor > 0) {
        saldoLabel = 'Saldo Deudor:';
        saldoMonto = `$${saldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        saldoColor = '#166534';
      } else if (saldoAcreedor > 0) {
        saldoLabel = 'Saldo Acreedor:';
        saldoMonto = `$${saldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        saldoColor = '#991B1B';
      }

      card.innerHTML = `
        <div class="t-account-header">
          <h4>${acc.code} &bull; ${acc.name}</h4>
          <div class="t-account-meta">${acc.type || 'Cuenta'} (${acc.nature || 'Deudora'})</div>
        </div>

        <div class="t-columns-container">
          <div class="t-col debe">
            <div class="t-col-title">DEBE (Cargos)</div>
            <div>${debitsHtml}</div>
            <div class="t-subtotal-box">
              <span>Σ Debe:</span>
              <span class="debe-amount">$${Number(acc.sumDebe).toFixed(2)}</span>
            </div>
          </div>

          <div class="t-col haber">
            <div class="t-col-title">HABER (Abonos)</div>
            <div>${creditsHtml}</div>
            <div class="t-subtotal-box">
              <span>Σ Haber:</span>
              <span class="haber-amount">$${Number(acc.sumHaber).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="t-account-footer">
          <span style="font-size: 0.78rem; color: #64748B;">${saldoLabel}</span>
          <span style="color: ${saldoColor};">${saldoMonto}</span>
        </div>
      `;

      tAccountsGridContainer.appendChild(card);
    });
  }

  // 8. PILAR 3: BALANCE DE COMPROBACIÓN DE SUMAS Y SALDOS
  function renderTrialBalance() {
    if (!balanceBody) return;
    balanceBody.innerHTML = '';

    const filter = balanceFilterSelect?.value || 'with_movements';

    let totalSumDebe = 0;
    let totalSumHaber = 0;
    let totalSaldoDeudor = 0;
    let totalSaldoAcreedor = 0;

    const filteredAccounts = trialBalance.filter(acc => {
      if (filter === 'with_movements') {
        return (acc.sumDebe > 0) || (acc.sumHaber > 0) || (acc.saldoDeudor > 0) || (acc.saldoAcreedor > 0);
      }
      return true;
    });

    filteredAccounts.forEach(acc => {
      const sumDebe = Number(acc.sumDebe || 0);
      const sumHaber = Number(acc.sumHaber || 0);
      const saldoDeudor = Number(acc.saldoDeudor || 0);
      const saldoAcreedor = Number(acc.saldoAcreedor || 0);

      totalSumDebe += sumDebe;
      totalSumHaber += sumHaber;
      totalSaldoDeudor += saldoDeudor;
      totalSaldoAcreedor += saldoAcreedor;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-code-badge">${acc.code}</td>
        <td><strong>${acc.name}</strong></td>
        <td><span class="t-account-type-badge">${acc.type || 'Cuenta'}</span></td>
        <td class="debe-amount" style="text-align: right;">$${sumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="haber-amount" style="text-align: right;">$${sumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: 700; color: ${saldoDeudor > 0 ? '#166534' : '#94A3B8'};">
          ${saldoDeudor > 0 ? '$' + saldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
        </td>
        <td style="text-align: right; font-weight: 700; color: ${saldoAcreedor > 0 ? '#991B1B' : '#94A3B8'};">
          ${saldoAcreedor > 0 ? '$' + saldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
        </td>
      `;
      balanceBody.appendChild(tr);
    });

    if (balanceFoot) {
      balanceFoot.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: right; text-transform: uppercase; letter-spacing: 0.05em;">
            <strong>TOTALES GENERALES DE COMPROBACIÓN:</strong>
          </td>
          <td style="text-align: right; color: #166534; font-weight: 800;">
            $${totalSumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="text-align: right; color: #991B1B; font-weight: 800;">
            $${totalSumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="text-align: right; color: #166534; font-weight: 800;">
            $${totalSaldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="text-align: right; color: #991B1B; font-weight: 800;">
            $${totalSaldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }

    if (verificationDebeTotal) verificationDebeTotal.textContent = `$${totalSumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (verificationHaberTotal) verificationHaberTotal.textContent = `$${totalSumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (verificationDeudorTotal) verificationDeudorTotal.textContent = `$${totalSaldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (verificationAcreedorTotal) verificationAcreedorTotal.textContent = `$${totalSaldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // 9. PILAR 4: CATÁLOGO DEL PUC
  function renderPUCTable() {
    if (!pucTableBody) return;
    pucTableBody.innerHTML = '';

    const descriptions = {
      '1105': 'Fondos líquidos disponibles en efectivo en punto de venta y bóveda.',
      '1110': 'Cuentas corrientes bancarias para pagos por transferencia y débito.',
      '1435': 'Materia prima: harinas, levaduras, mantequillas, azúcares y empaques.',
      '1440': 'Panes horneados, croissants, pastelería y productos listos para despacho.',
      '2205': 'Obligaciones comerciales pendientes con molinos y proveedores de insumos.',
      '2408': 'Impuesto al Valor Agregado cobrado a clientes retenido para el SENIAT (16%).',
      '3105': 'Aportes constitutivos de los accionistas y patrimonio neto registrado.',
      '4135': 'Ingresos brutos por ventas de panadería y bollería en mostrador POS.',
      '5105': 'Nómina, salarios, bonos y beneficios del personal operativo y administrativo.',
      '5195': 'Pérdidas por caducidad, roturas y productos no conformes retirados de estante.',
      '6135': 'Costo directo acumulado de la harina e insumos horneados vendidos.'
    };

    (livePlanCuentas || PLAN_CUENTAS).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: monospace; font-weight: 700;">${c.code}</td>
        <td><strong>${c.name}</strong></td>
        <td><span class="t-account-type-badge">${c.type}</span></td>
        <td><strong>${c.nature}</strong></td>
        <td style="font-size: 0.8rem; color: #64748B;">${descriptions[c.code] || 'Cuenta habilitada en el catálogo contable.'}</td>
      `;
      pucTableBody.appendChild(tr);
    });
  }

  // 10. EDITOR MULTI-RENGLÓN DE COMPROBANTE DE DIARIO (ESTILO SAINT / PROFIT)
  function captureCurrentModalRows() {
    if (!voucherRowsBody) return;
    const rows = voucherRowsBody.querySelectorAll('tr');
    rows.forEach((tr, i) => {
      if (modalVoucherRows[i]) {
        const sel = tr.querySelector('.row-account-select');
        const detailInp = tr.querySelector('.row-detail-input');
        const debeInp = tr.querySelector('.row-debe-input');
        const haberInp = tr.querySelector('.row-haber-input');

        if (sel) modalVoucherRows[i].accountCode = sel.value;
        if (detailInp) modalVoucherRows[i].detail = detailInp.value;
        if (debeInp) modalVoucherRows[i].debe = parseFloat(debeInp.value) || 0;
        if (haberInp) modalVoucherRows[i].haber = parseFloat(haberInp.value) || 0;
      }
    });
  }

  function renderModalRows() {
    if (!voucherRowsBody) return;
    voucherRowsBody.innerHTML = '';

    const accounts = (livePlanCuentas && livePlanCuentas.length > 0) ? livePlanCuentas : PLAN_CUENTAS;

    modalVoucherRows.forEach((row, idx) => {
      const tr = document.createElement('tr');

      // Generar opciones de cuenta
      let optionsHtml = '';
      accounts.forEach(a => {
        const isSel = a.code === row.accountCode ? 'selected' : '';
        optionsHtml += `<option value="${a.code}" ${isSel}>${a.code} - ${a.name} (${a.nature})</option>`;
      });

      const debeValStr = (row.debe && row.debe > 0) ? Number(row.debe).toFixed(2) : '';
      const haberValStr = (row.haber && row.haber > 0) ? Number(row.haber).toFixed(2) : '';

      tr.innerHTML = `
        <td style="text-align: center; color: var(--color-light-muted); font-weight: 700;">${idx + 1}</td>
        <td>
          <select class="row-account-select" data-index="${idx}">
            ${optionsHtml}
          </select>
        </td>
        <td>
          <input type="text" class="row-detail-input" data-index="${idx}" value="${row.detail || ''}" placeholder="Detalle / Subconcepto">
        </td>
        <td>
          <input type="number" step="0.01" min="0" class="row-debe-input" data-index="${idx}" value="${debeValStr}" placeholder="0.00">
        </td>
        <td>
          <input type="number" step="0.01" min="0" class="row-haber-input" data-index="${idx}" value="${haberValStr}" placeholder="0.00">
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-remove-row" data-index="${idx}" title="Eliminar este renglón">&times;</button>
        </td>
      `;

      voucherRowsBody.appendChild(tr);
    });

    // Event listeners para los inputs de los renglones
    voucherRowsBody.querySelectorAll('.row-account-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.index);
        if (modalVoucherRows[i]) modalVoucherRows[i].accountCode = e.target.value;
      });
    });

    voucherRowsBody.querySelectorAll('.row-detail-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.index);
        if (modalVoucherRows[i]) modalVoucherRows[i].detail = e.target.value;
      });
    });

    voucherRowsBody.querySelectorAll('.row-debe-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.index);
        const val = parseFloat(e.target.value) || 0;
        if (modalVoucherRows[i]) {
          modalVoucherRows[i].debe = val;
          if (val > 0) {
            modalVoucherRows[i].haber = 0;
            const haberInp = voucherRowsBody.querySelector(`.row-haber-input[data-index="${i}"]`);
            if (haberInp) haberInp.value = '';
          }
        }
        updateModalTotals();
      });
    });

    voucherRowsBody.querySelectorAll('.row-haber-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.index);
        const val = parseFloat(e.target.value) || 0;
        if (modalVoucherRows[i]) {
          modalVoucherRows[i].haber = val;
          if (val > 0) {
            modalVoucherRows[i].debe = 0;
            const debeInp = voucherRowsBody.querySelector(`.row-debe-input[data-index="${i}"]`);
            if (debeInp) debeInp.value = '';
          }
        }
        updateModalTotals();
      });
    });

    voucherRowsBody.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        captureCurrentModalRows();
        const i = parseInt(e.currentTarget.dataset.index);
        if (modalVoucherRows.length <= 2) {
          alert('Un comprobante de diario requiere al menos 2 renglones (débito y crédito).');
          return;
        }
        modalVoucherRows.splice(i, 1);
        renderModalRows();
      });
    });

    updateModalTotals();
    window.LucideIcons?.refresh();
  }

  function updateModalTotals() {
    let tDebe = 0;
    let tHaber = 0;

    modalVoucherRows.forEach(r => {
      tDebe += Number(r.debe || 0);
      tHaber += Number(r.haber || 0);
    });

    const diff = Math.abs(tDebe - tHaber);
    const isBalanced = diff < 0.01 && tDebe > 0;

    if (editorDebeTotal) editorDebeTotal.textContent = `$${tDebe.toFixed(2)}`;
    if (editorHaberTotal) editorHaberTotal.textContent = `$${tHaber.toFixed(2)}`;
    if (editorDiffTotal) editorDiffTotal.textContent = `$${diff.toFixed(2)}`;

    if (editorBalanceBadge) {
      if (isBalanced) {
        editorBalanceBadge.className = 'editor-balance-status status-balanced';
        editorBalanceBadge.innerHTML = `<i data-lucide="check-circle-2" class="icon-xs"></i> Comprobante Cuadrado (Partida Doble)`;
      } else {
        editorBalanceBadge.className = 'editor-balance-status status-unbalanced';
        editorBalanceBadge.innerHTML = `<i data-lucide="alert-triangle" class="icon-xs"></i> Descuadre de $${diff.toFixed(2)}`;
      }
      window.LucideIcons?.refresh();
    }
  }

  btnAddEntryRow?.addEventListener('click', () => {
    captureCurrentModalRows();
    modalVoucherRows.push({
      accountCode: '1105',
      detail: '',
      debe: 0.00,
      haber: 0.00
    });
    renderModalRows();
  });

  btnAutoBalanceRow?.addEventListener('click', () => {
    captureCurrentModalRows();

    let tDebe = 0;
    let tHaber = 0;
    modalVoucherRows.forEach(r => {
      tDebe += Number(r.debe || 0);
      tHaber += Number(r.haber || 0);
    });

    const diff = Number((tDebe - tHaber).toFixed(2));
    if (Math.abs(diff) < 0.01 && tDebe > 0) {
      alert('El comprobante ya se encuentra exactamente cuadrado ($0.00 de diferencia).');
      return;
    }

    // Buscar si existe un renglón disponible en cero
    let emptyRowIdx = modalVoucherRows.findIndex(r => Number(r.debe || 0) === 0 && Number(r.haber || 0) === 0);

    if (diff > 0) {
      // Falta Haber (Crédito)
      if (emptyRowIdx !== -1) {
        modalVoucherRows[emptyRowIdx].haber = diff;
        modalVoucherRows[emptyRowIdx].debe = 0;
        if (!modalVoucherRows[emptyRowIdx].detail) modalVoucherRows[emptyRowIdx].detail = 'Contrapartida de cuadre';
      } else {
        modalVoucherRows.push({
          accountCode: '1105',
          detail: 'Contrapartida de cuadre',
          debe: 0.00,
          haber: diff
        });
      }
    } else {
      // Falta Debe (Débito)
      const neededDebe = Math.abs(diff);
      if (emptyRowIdx !== -1) {
        modalVoucherRows[emptyRowIdx].debe = neededDebe;
        modalVoucherRows[emptyRowIdx].haber = 0;
        if (!modalVoucherRows[emptyRowIdx].detail) modalVoucherRows[emptyRowIdx].detail = 'Partida de cuadre';
      } else {
        modalVoucherRows.push({
          accountCode: '5105',
          detail: 'Partida de cuadre',
          debe: neededDebe,
          haber: 0.00
        });
      }
    }

    renderModalRows();
  });

  // Envío del Comprobante Manual a MySQL
  manualEntryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    captureCurrentModalRows();

    const concept = (entryConceptInput?.value || '').trim();
    const dateInputVal = entryDateInput?.value || new Date().toISOString().split('T')[0];
    const type = entryTypeSelect?.value || 'Diario';

    if (!concept) {
      alert('Por favor ingrese la glosa o concepto explicativo del comprobante.');
      entryConceptInput?.focus();
      return;
    }

    let tDebe = 0;
    let tHaber = 0;
    const activeItems = [];

    modalVoucherRows.forEach(r => {
      const d = Number(r.debe || 0);
      const h = Number(r.haber || 0);
      if (d > 0 || h > 0) {
        activeItems.push({
          cuenta_codigo: r.accountCode,
          debe: d,
          haber: h,
          detalle: r.detail || ''
        });
        tDebe += d;
        tHaber += h;
      }
    });

    if (activeItems.length < 2) {
      alert('El comprobante requiere al menos dos partidas contables (débito y crédito).');
      return;
    }

    const hasDebit = activeItems.some(i => i.debe > 0);
    const hasCredit = activeItems.some(i => i.haber > 0);
    if (!hasDebit || !hasCredit) {
      alert('El comprobante debe tener al menos una partida de débito (Debe) y una partida de crédito (Haber).');
      return;
    }

    if (Math.abs(tDebe - tHaber) > 0.01) {
      alert(`Error de Cuadre: El comprobante presenta un descuadre de $${Math.abs(tDebe - tHaber).toFixed(2)}. Debe cuadrar exactamente a cero.`);
      return;
    }

    // Timestamp cronológico exacto
    const todayStr = new Date().toISOString().split('T')[0];
    let fullDateTime = dateInputVal;
    if (dateInputVal === todayStr) {
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
      fullDateTime = `${dateInputVal} ${timePart}`;
    } else {
      fullDateTime = `${dateInputVal} 12:00:00`;
    }

    try {
      const res = await fetch('../api/accounting/crear_asiento.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          date: fullDateTime,
          sourceModule: `Comprobante ${type}`,
          items: activeItems
        })
      });

      const resJson = await res.json();
      if (resJson.success) {
        await loadAccountingFromApi();
        manualEntryForm.reset();
        modalVoucherRows = [
          { accountCode: '5105', detail: '', debe: 0.00, haber: 0.00 },
          { accountCode: '1105', detail: '', debe: 0.00, haber: 0.00 }
        ];
        if (entryDateInput) entryDateInput.value = new Date().toISOString().split('T')[0];
        closeManualEntryModal();
        alert(`Comprobante ${resJson.codigo} guardado exitosamente en el Libro Diario.`);
        return;
      } else {
        alert(`Error al guardar comprobante: ${resJson.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.warn('Fallo de red al guardar en MySQL:', err);
      alert('Error de conexión con el servidor. Verifique MySQL en XAMPP.');
    }
  });

  // Funciones de Apertura y Cierre de Modal
  function openManualEntryModal() {
    if (entryDateInput && !entryDateInput.value) {
      entryDateInput.value = new Date().toISOString().split('T')[0];
    }
    renderModalRows();
    if (manualEntryModal) {
      manualEntryModal.style.display = 'flex';
      manualEntryModal.classList.add('active');
      document.body.classList.add('auth-modal-open');
    }
    window.LucideIcons?.refresh();
  }

  function closeManualEntryModal() {
    if (manualEntryModal) {
      manualEntryModal.style.display = 'none';
      manualEntryModal.classList.remove('active');
      document.body.classList.remove('auth-modal-open');
    }
  }

  btnOpenManualEntry?.addEventListener('click', openManualEntryModal);
  closeEntryModalBtn?.addEventListener('click', closeManualEntryModal);
  btnCancelModal?.addEventListener('click', closeManualEntryModal);
  manualEntryModal?.addEventListener('click', (e) => {
    if (e.target === manualEntryModal) closeManualEntryModal();
  });

  // 11. Conmutación de Pestañas
  document.querySelectorAll('.acc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.acc-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel-content').forEach(panel => {
        panel.style.display = panel.id === targetTab ? 'block' : 'none';
      });

      window.LucideIcons?.refresh();
    });
  });

  // Toggles de vista en Diario
  btnViewVouchers?.addEventListener('click', () => {
    activeJournalView = 'vouchers';
    btnViewVouchers.classList.add('active');
    btnViewJournalTable?.classList.remove('active');
    renderJournal();
    window.LucideIcons?.refresh();
  });

  btnViewJournalTable?.addEventListener('click', () => {
    activeJournalView = 'table';
    btnViewJournalTable.classList.add('active');
    btnViewVouchers?.classList.remove('active');
    renderJournal();
    window.LucideIcons?.refresh();
  });

  // Toggles de vista en Mayor
  btnLedgerFolioView?.addEventListener('click', () => {
    activeLedgerView = 'folio';
    btnLedgerFolioView.classList.add('active');
    btnLedgerTView?.classList.remove('active');
    renderLedger();
    window.LucideIcons?.refresh();
  });

  btnLedgerTView?.addEventListener('click', () => {
    activeLedgerView = 't';
    btnLedgerTView.classList.add('active');
    btnLedgerFolioView?.classList.remove('active');
    renderLedger();
    window.LucideIcons?.refresh();
  });

  // Eventos de Filtro
  journalSearchInput?.addEventListener('input', () => renderJournal());
  journalFilterTypeEl?.addEventListener('change', () => renderJournal());

  ledgerSearchInput?.addEventListener('input', () => renderLedger());
  ledgerAccountPicker?.addEventListener('change', () => renderLedger());
  ledgerFilterSelect?.addEventListener('change', () => renderLedger());

  balanceFilterSelect?.addEventListener('change', () => renderTrialBalance());

  // 12. Impresión Formal y Reporte PDF
  function renderBalanceReportContent() {
    if (!balanceSheet) return;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    let totalSumDebe = 0;
    let totalSumHaber = 0;
    let totalSaldoDeudor = 0;
    let totalSaldoAcreedor = 0;

    const rowsHtml = (trialBalance || []).map(acc => {
      const sumDebe = Number(acc.sumDebe || 0);
      const sumHaber = Number(acc.sumHaber || 0);
      const saldoDeudor = Number(acc.saldoDeudor || 0);
      const saldoAcreedor = Number(acc.saldoAcreedor || 0);

      totalSumDebe += sumDebe;
      totalSumHaber += sumHaber;
      totalSaldoDeudor += saldoDeudor;
      totalSaldoAcreedor += saldoAcreedor;

      const deudorText = saldoDeudor > 0 ? ('$' + saldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '-';
      const acreedorText = saldoAcreedor > 0 ? ('$' + saldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '-';

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 700;">${acc.code}</td>
          <td><strong>${acc.name}</strong></td>
          <td style="text-align: right;">$${sumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right;">$${sumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right;">${deudorText}</td>
          <td style="text-align: right;">${acreedorText}</td>
        </tr>
      `;
    }).join('');

    balanceSheet.innerHTML = `
      <div class="report-header-banner">
        <div>
          <h1 class="report-brand-title">La Nueva Parisienne Panadería &amp; Pastelería C.A.</h1>
          <p class="report-brand-sub">
            RIF: J-40123456-7 &bull; Av. Lara con Calle 8, Barquisimeto, Edo. Lara<br>
            Departamento de Contabilidad &bull; Auditoría y Libros Oficiales Obligatorios
          </p>
        </div>
        <div class="report-meta-box">
          <div style="font-weight: 800; text-transform: uppercase;">BALANCE DE COMPROBACIÓN</div>
          <div>Fecha de Emisión: ${dateFormatted}, ${timeFormatted}</div>
          <div>Moneda: Dólares Americanos ($ USD) &bull; Ref. BCV</div>
          <div>Auditor: ${activeUser.name} (Contador General)</div>
        </div>
      </div>

      <table class="report-data-table">
        <thead>
          <tr>
            <th style="width: 100px;">Código PUC</th>
            <th>Denominación de la Cuenta</th>
            <th style="text-align: right;">Sumas Debe ($)</th>
            <th style="text-align: right;">Sumas Haber ($)</th>
            <th style="text-align: right;">Saldo Deudor ($)</th>
            <th style="text-align: right;">Saldo Acreedor ($)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align: right;"><strong>TOTALES GENERALES DE COMPROBACIÓN:</strong></td>
            <td style="text-align: right;"><strong>$${totalSumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSaldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSaldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #FAF8F5; border: 1px solid #E2E8F0; padding: 0.85rem 1.25rem; font-size: 0.82rem; color: #4B5563; line-height: 1.5; margin: 1.5rem 0;">
        <strong>Certificación de Auditoría Contable:</strong> Se hace constar que el presente Balance de Comprobación de Sumas y Saldos refleja fielmente la totalidad de las operaciones asentadas en el Libro Diario y Mayor de <em>La Nueva Parisienne Panadería &amp; Pastelería C.A.</em>, habiéndose verificado la exactitud matemática de las partidas dobles conforme a las Normas Internacionales de Información Financiera (NIIF para PYMES) y leyes mercantiles vigentes.
      </div>

      <div class="report-signatures-grid">
        <div>
          <div class="report-signature-line"></div>
          <div class="report-signature-name">${activeUser.name}</div>
          <div class="report-signature-role">Contador General &bull; C.P.C. N° 45.892</div>
        </div>
        <div>
          <div class="report-signature-line"></div>
          <div class="report-signature-name">Juan Mendoza</div>
          <div class="report-signature-role">Gerente General &bull; Representante Legal</div>
        </div>
      </div>
    `;

    window.LucideIcons?.refresh();
  }

  function openVoucherReportModal(voucherCode) {
    const voucher = automaticEntries.find(v => v.code === voucherCode);
    if (!voucher || !balanceSheet) return;

    const rateHist = Number(voucher.bcvRateHistorical || 761.21);
    const vesTotal = Number(voucher.totalDebe) * rateHist;

    let rowsHtml = '';
    (voucher.details || []).forEach((det, idx) => {
      const isHaber = Number(det.haber) > 0;
      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: 600; color: var(--color-light-muted);">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 800; color: var(--color-espresso);">${det.accountCode}</td>
          <td style="${isHaber ? 'padding-left: 2rem;' : ''}">
            ${isHaber ? '<span style="color: var(--color-muted); font-style: italic; margin-right: 0.25rem;">a</span> ' : ''}<strong>${det.accountName}</strong>
          </td>
          <td style="text-align: right; font-weight: 800; color: var(--color-success); font-variant-numeric: tabular-nums;">
            ${Number(det.debe) > 0 ? '$' + Number(det.debe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
          </td>
          <td style="text-align: right; font-weight: 800; color: var(--color-terracotta); font-variant-numeric: tabular-nums;">
            ${Number(det.haber) > 0 ? '$' + Number(det.haber).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
          </td>
        </tr>
      `;
    });

    balanceSheet.innerHTML = `
      <div class="report-header-banner">
        <div>
          <h1 class="report-brand-title">La Nueva Parisienne Panadería &amp; Pastelería C.A.</h1>
          <p class="report-brand-sub">
            RIF: J-40123456-7 &bull; Av. Lara con Calle 8, Barquisimeto, Edo. Lara<br>
            Departamento de Contabilidad &bull; Libro Diario General Oficial
          </p>
        </div>
        <div class="report-meta-box">
          <div class="report-meta-badge">COMPROBANTE N° ${voucher.code}</div>
          <div>Fecha: <strong>${voucher.date}</strong></div>
          <div>Origen: <strong>${voucher.sourceModule}</strong></div>
          <div>Tasa Oficial BCV: <strong>Bs. ${rateHist.toFixed(2)}</strong></div>
        </div>
      </div>

      <div style="background: #FAF7F2; border: 1px solid rgba(212, 155, 84, 0.25); border-radius: 8px; padding: 0.95rem 1.25rem; margin-bottom: 1.25rem; font-size: 0.88rem;">
        <strong style="color: var(--color-espresso);">Por Concepto de (Glosa / P/R):</strong>
        <p style="margin: 0.35rem 0 0; color: var(--color-espresso); font-style: italic; font-weight: 500;">${voucher.concept}</p>
      </div>

      <table class="report-data-table">
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">#</th>
            <th style="width: 110px;">Código PUC</th>
            <th>Denominación de la Cuenta Contable</th>
            <th style="text-align: right; width: 140px;">Débito ($ USD)</th>
            <th style="text-align: right; width: 140px;">Crédito ($ USD)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;"><strong>SUMAS IGUALES DEL COMPROBANTE:</strong></td>
            <td style="text-align: right; color: var(--color-success); font-weight: 800;">$${Number(voucher.totalDebe).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right; color: var(--color-terracotta); font-weight: 800;">$${Number(voucher.totalHaber).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #FAF8F5; border: 1px solid rgba(212, 155, 84, 0.2); padding: 0.85rem 1.25rem; font-size: 0.82rem; color: #4B5563; line-height: 1.5; margin: 1.5rem 0; border-radius: 6px;">
        <strong>Certificación de Auditoría Contable:</strong> Se hace constar que el presente comprobante de diario ha sido procesado cumpliendo fielmente con el principio universal de partida doble, registrando débitos y créditos en sumas iguales conforme a las Normas Internacionales de Información Financiera (NIIF para PYMES). Equivalente fiscal: <strong>Bs. ${vesTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
      </div>

      <div class="report-signatures-grid">
        <div>
          <div class="report-signature-line"></div>
          <div class="report-signature-name">${activeUser.name}</div>
          <div class="report-signature-role">Contador General &bull; C.P.C. N° 45.892</div>
        </div>
        <div>
          <div class="report-signature-line"></div>
          <div class="report-signature-name">Juan Mendoza</div>
          <div class="report-signature-role">Gerente General &bull; Representante Legal</div>
        </div>
      </div>
    `;

    const titleEl = document.getElementById('balanceModalTitle');
    if (titleEl) titleEl.textContent = `Comprobante de Diario Oficial N° ${voucher.code}`;

    if (balanceModal) {
      balanceModal.style.display = 'flex';
      balanceModal.classList.add('active');
      balanceModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('auth-modal-open');
    }
    window.LucideIcons?.refresh();
  }

  function openBalanceModal() {
    const titleEl = document.getElementById('balanceModalTitle');
    if (titleEl) titleEl.textContent = 'Balance de Comprobación Contable Formal';

    renderBalanceReportContent();
    if (balanceModal) {
      balanceModal.style.display = 'flex';
      balanceModal.classList.add('active');
      balanceModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('auth-modal-open');
    }
  }

  function closeBalanceModal() {
    if (balanceModal) {
      balanceModal.style.display = 'none';
      balanceModal.classList.remove('active');
      balanceModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('auth-modal-open');
    }
  }

  btnPrintBalance?.addEventListener('click', openBalanceModal);
  btnPrintBalanceQuick?.addEventListener('click', openBalanceModal);
  btnCloseBalanceModal?.addEventListener('click', closeBalanceModal);
  balanceModal?.addEventListener('click', (e) => {
    if (e.target === balanceModal) closeBalanceModal();
  });

  btnPrintBalanceModal?.addEventListener('click', () => {
    window.print();
  });

  // Exportación Formal a Hoja de Cálculo Excel (.xls)
  function exportarBalanceExcel() {
    const now = new Date();
    const fechaEmision = now.toLocaleString('es-VE');

    let tDebe = 0, tHaber = 0, tDeudor = 0, tAcreedor = 0;
    const rowsHtml = (trialBalance || []).map(acc => {
      const sDebe = Number(acc.sumDebe || 0);
      const sHaber = Number(acc.sumHaber || 0);
      const sDeudor = Number(acc.saldoDeudor || 0);
      const sAcreedor = Number(acc.saldoAcreedor || 0);

      tDebe += sDebe;
      tHaber += sHaber;
      tDeudor += sDeudor;
      tAcreedor += sAcreedor;

      return `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${acc.code}</td>
          <td>${acc.name}</td>
          <td>${acc.type || 'Cuenta'}</td>
          <td style="text-align: right;">$${sDebe.toFixed(2)}</td>
          <td style="text-align: right;">$${sHaber.toFixed(2)}</td>
          <td style="text-align: right; color: #1B5E20;">$${sDeudor.toFixed(2)}</td>
          <td style="text-align: right; color: #0D47A1;">$${sAcreedor.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Balance de Comprobación</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #2C1810; }
          .title-company { font-size: 15pt; font-weight: bold; color: #2C1810; margin-bottom: 3px; }
          .title-rif { font-size: 9.5pt; color: #7A6B5D; margin-bottom: 6px; }
          .title-report { font-size: 12pt; font-weight: bold; color: #8C531B; margin-bottom: 6px; }
          .meta-info { font-size: 9pt; color: #555555; margin-bottom: 12px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #2C1810; color: #FFFFFF; font-weight: bold; padding: 7px 10px; border: 1px solid #C48B44; }
          td { padding: 6px 9px; border: 1px solid #D9CEBF; font-size: 9.5pt; }
          .total-row td { background-color: #F8F5F0; font-weight: bold; border-top: 2px solid #2C1810; }
        </style>
      </head>
      <body>
        <div class="title-company">LA NUEVA PARISIENNE PANADERIA &amp; PASTELERIA C.A.</div>
        <div class="title-rif">RIF: J-40123456-7 &bull; Sistema Contable y Financiero</div>
        <div class="title-report">BALANCE DE COMPROBACIÓN (PLAN ÚNICO DE CUENTAS)</div>
        <div class="meta-info"><strong>Fecha de Emisión:</strong> ${fechaEmision} &nbsp;|&nbsp; <strong>Estado:</strong> Ecuación Patrimonial Verificada</div>
        <br/>
        <table border="1">
          <thead>
            <tr style="background-color: #2C1810; color: #FFFFFF;">
              <th>CÓDIGO PUC</th>
              <th>DENOMINACIÓN DE LA CUENTA</th>
              <th>GRUPO</th>
              <th style="text-align: right;">SUMAS DEBE ($)</th>
              <th style="text-align: right;">SUMAS HABER ($)</th>
              <th style="text-align: right;">SALDO DEUDOR ($)</th>
              <th style="text-align: right;">SALDO ACREEDOR ($)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align: right; font-weight: bold;">TOTALES GENERALES CUADRADOS:</td>
              <td style="text-align: right; font-weight: bold;">$${tDebe.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold;">$${tHaber.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold; color: #1B5E20;">$${tDeudor.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold; color: #0D47A1;">$${tAcreedor.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF', excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance_comprobacion_${now.toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  btnExportBalanceExcel?.addEventListener('click', exportarBalanceExcel);
  btnExportBalanceExcelTop?.addEventListener('click', exportarBalanceExcel);
  btnExportBalanceExcelQuick?.addEventListener('click', exportarBalanceExcel);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccounting);
} else {
  initAccounting();
}
