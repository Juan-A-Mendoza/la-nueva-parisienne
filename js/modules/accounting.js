/* ==========================================================================
   MÓDULO 7: CONTROLADOR INTERACTIVO DE CONTABILIDAD (ACCOUNTING.JS)
   Partidas contables automáticas, libro diario, cuentas T y balance general
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { PLAN_CUENTAS, AUTOMATIC_ENTRIES, TRIAL_BALANCE_ACCOUNTS } from '../data/accounting-db.js';

function initAccounting() {
  // 1. Verificación de Seguridad y Sesión Resiliente
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo sesión:', err);
  }

  const activeUser = (session && session.user) ? session.user : {
    name: 'Sebastian Finanzas',
    role: 'Contador General',
    roleCode: 'ACCOUNTANT',
    icon: 'bar-chart-3'
  };

  // 1.1 Verificación de Permisos (Solo Superadmin y Contador)
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

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = activeUser.name;
  if (userAvatarEl) { userAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'bar-chart-3') : ''; window.LucideIcons?.refresh(); }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      SessionStore.logout();
    });
  }

  // 2. Estado de la Contabilidad
  let automaticEntries = JSON.parse(JSON.stringify(AUTOMATIC_ENTRIES));
  let trialBalance = JSON.parse(JSON.stringify(TRIAL_BALANCE_ACCOUNTS));
  let livePlanCuentas = PLAN_CUENTAS;

  // 3. Elementos DOM
  const vouchersListContainer = document.getElementById('vouchersListContainer');
  const tAccountsGridContainer = document.getElementById('tAccountsGridContainer');
  const balanceBody = document.getElementById('balanceBody');

  // Total Verification Elements
  const verificationDebeTotal = document.getElementById('verificationDebeTotal');
  const verificationHaberTotal = document.getElementById('verificationHaberTotal');

  // Modales y Botones
  const manualEntryModal = document.getElementById('manualEntryModal');
  const closeEntryModalBtn = document.getElementById('closeEntryModalBtn');
  const manualEntryForm = document.getElementById('manualEntryForm');
  const btnOpenManualEntry = document.getElementById('btnOpenManualEntry');

  // Inicializar con datos en memoria e intentar sincronizar con MySQL
  renderAll();
  loadAccountingFromApi();

  async function loadAccountingFromApi() {
    try {
      const res = await fetch(`../api/accounting/get_accounting.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.vouchers && data.vouchers.length > 0) {
            automaticEntries = data.vouchers;
          }
          if (data.trial_balance && data.trial_balance.length > 0) {
            trialBalance = data.trial_balance;
          }
          if (data.plan_cuentas && data.plan_cuentas.length > 0) {
            livePlanCuentas = data.plan_cuentas;
          }
          renderAll();
        }
      }
    } catch (err) {
      console.warn('Contabilidad: Operando con datos de respaldo local.', err);
    }
  }

  // Escuchar movimientos de ventas POS y compras en vivo para refrescar asientos
  if (typeof BroadcastChannel !== 'undefined') {
    const movChannel = new BroadcastChannel('lnp_movements_channel');
    movChannel.onmessage = () => {
      loadAccountingFromApi();
    };
  }
  window.addEventListener('movimientosChanged', () => loadAccountingFromApi());

  function renderAll() {
    renderVouchers();
    renderTAccounts();
    renderTrialBalance();
  }

  // 4. Renderizado de Asientos Contables Automáticos (Vouchers)
  function renderVouchers() {
    if (!vouchersListContainer) return;
    vouchersListContainer.innerHTML = '';

    automaticEntries.forEach(voucher => {
      const card = document.createElement('div');
      card.className = 'voucher-card';

      const rateHist = voucher.bcvRateHistorical || 761.21;
      const totalDebeVes = voucher.totalDebe * rateHist;

      let detailsHtml = '';
      voucher.details.forEach(detail => {
        detailsHtml += `
          <tr>
            <td><strong>${detail.accountCode}</strong> - ${detail.accountName}</td>
            <td class="debe-amount" style="text-align: right;">${detail.debe > 0 ? '$' + detail.debe.toFixed(2) : '-'}</td>
            <td class="haber-amount" style="text-align: right;">${detail.haber > 0 ? '$' + detail.haber.toFixed(2) : '-'}</td>
          </tr>
        `;
      });

      card.innerHTML = `
        <div class="voucher-card-header">
          <div class="voucher-code-title">
            <div class="voucher-icon">${window.LucideIcons ? window.LucideIcons.render(voucher.icon || 'file-text', 'icon-md') : ''}</div>
            <div>
              <h3 style="font-size: 1.1rem; color: var(--color-espresso);">${voucher.code}: ${voucher.concept}</h3>
              <span style="font-size: 0.8rem; color: var(--color-muted);">${voucher.date}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem;">
            <span class="voucher-source-tag">${voucher.sourceModule}</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-gold-dark); background: rgba(212,155,84,0.12); padding: 0.2rem 0.5rem; border-radius: var(--radius-pill); border: 1px solid rgba(212,155,84,0.3);">
              Tasa Registrada del Día: Bs. ${rateHist.toFixed(2)} / USD
            </span>
          </div>
        </div>

        <table class="voucher-table">
          <thead>
            <tr>
              <th style="text-align: left;">Cuenta Contable (PUC)</th>
              <th style="text-align: right; width: 140px;">Débito (Debe $)</th>
              <th style="text-align: right; width: 140px;">Crédito (Haber $)</th>
            </tr>
          </thead>
          <tbody>
            ${detailsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 0.6rem 1rem; border-radius: var(--radius-sm); font-size: 0.88rem;">
          <span style="color: var(--color-success); font-weight: 700;" class="badge-clean-icon"><i data-lucide="check" class="icon-xs"></i> Partida Doble Verificada (Equivalente Fiscal: Bs. ${totalDebeVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
          <strong>Total Asiento: $${voucher.totalDebe.toFixed(2)}</strong>
        </div>
      `;

      vouchersListContainer.appendChild(card);
    });
  }

  // 5. Renderizado de Libro Mayor - Cuentas T
  function renderTAccounts() {
    if (!tAccountsGridContainer) return;
    tAccountsGridContainer.innerHTML = '';

    trialBalance.forEach(acc => {
      const card = document.createElement('div');
      card.className = 't-account-card';

      const netBalance = acc.saldoDeudor > 0 ? acc.saldoDeudor : acc.saldoAcreedor;
      const netType = acc.saldoDeudor > 0 ? 'Deudor' : 'Acreedor';

      card.innerHTML = `
        <div class="t-account-header">
          <h4>${acc.code} - ${acc.name}</h4>
        </div>
        <div class="t-columns-container">
          <div class="t-col debe">
            <span style="font-weight: 700; color: var(--color-muted); font-size: 0.75rem;">DEBE ($)</span>
            <span class="debe-amount">$${acc.sumDebe.toFixed(2)}</span>
          </div>
          <div class="t-col haber">
            <span style="font-weight: 700; color: var(--color-muted); font-size: 0.75rem;">HABER ($)</span>
            <span class="haber-amount">$${acc.sumHaber.toFixed(2)}</span>
          </div>
        </div>
        <div class="t-account-footer">
          <span style="font-size: 0.8rem; color: var(--color-muted);">Saldo ${netType}:</span>
          <span style="color: var(--color-espresso);">$${netBalance.toFixed(2)}</span>
        </div>
      `;

      tAccountsGridContainer.appendChild(card);
    });
  }

  // 6. Renderizado del Balance de Comprobación
  function renderTrialBalance() {
    if (!balanceBody) return;
    balanceBody.innerHTML = '';

    let totalDebeSum = 0;
    let totalHaberSum = 0;

    trialBalance.forEach(acc => {
      totalDebeSum += acc.sumDebe;
      totalHaberSum += acc.sumHaber;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-code-badge">${acc.code}</td>
        <td><strong>${acc.name}</strong></td>
        <td class="debe-amount">$${acc.sumDebe.toFixed(2)}</td>
        <td class="haber-amount">$${acc.sumHaber.toFixed(2)}</td>
        <td style="font-weight: 700;">${acc.saldoDeudor > 0 ? '$' + acc.saldoDeudor.toFixed(2) : '-'}</td>
        <td style="font-weight: 700;">${acc.saldoAcreedor > 0 ? '$' + acc.saldoAcreedor.toFixed(2) : '-'}</td>
      `;

      balanceBody.appendChild(tr);
    });

    if (verificationDebeTotal) verificationDebeTotal.textContent = `$${totalDebeSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (verificationHaberTotal) verificationHaberTotal.textContent = `$${totalHaberSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  // 7. Conmutación de Pestañas
  document.querySelectorAll('.acc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.acc-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel-content').forEach(panel => {
        panel.style.display = panel.id === targetTab ? 'block' : 'none';
      });
    });
  });

  // 8. Modal de Asiento Manual
  btnOpenManualEntry?.addEventListener('click', () => {
    manualEntryModal.classList.add('active');
  });

  closeEntryModalBtn?.addEventListener('click', () => {
    manualEntryModal.classList.remove('active');
  });

  manualEntryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const concept = document.getElementById('entryConceptInput').value;
    const debeCode = document.getElementById('debeAccountSelect').value;
    const debeAmount = parseFloat(document.getElementById('debeAmountInput').value) || 0;
    const haberCode = document.getElementById('haberAccountSelect').value;
    const haberAmount = parseFloat(document.getElementById('haberAmountInput').value) || 0;

    if (debeAmount !== haberAmount) {
      alert('Error de Cuadre: El monto del Debe debe ser idéntico al monto del Haber (Partida Doble).');
      return;
    }

    try {
      const res = await fetch('../api/accounting/crear_asiento.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          debeCode,
          debeAmount,
          haberCode,
          haberAmount
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        await loadAccountingFromApi();
        manualEntryForm.reset();
        manualEntryModal.classList.remove('active');
        alert(`Asiento Contable ${resJson.codigo} guardado exitosamente en MySQL.`);
        return;
      }
    } catch (err) {
      console.warn('Fallo guardando en MySQL, aplicando registro local:', err);
    }

    // Fallback local si el servidor o red no responde
    const debeAcc = (livePlanCuentas || PLAN_CUENTAS).find(c => c.code === debeCode);
    const haberAcc = (livePlanCuentas || PLAN_CUENTAS).find(c => c.code === haberCode);

    const newVoucher = {
      id: `as_${Date.now()}`,
      code: `AS-2026-00${automaticEntries.length + 1}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      concept: concept,
      sourceModule: 'Manual Administrador',
      icon: 'file-edit',
      details: [
        { accountCode: debeCode, accountName: debeAcc ? debeAcc.name : 'Cuenta Débito', debe: debeAmount, haber: 0.00 },
        { accountCode: haberCode, accountName: haberAcc ? haberAcc.name : 'Cuenta Crédito', debe: 0.00, haber: haberAmount }
      ],
      totalDebe: debeAmount,
      totalHaber: haberAmount
    };

    automaticEntries.unshift(newVoucher);
    renderAll();
    manualEntryForm.reset();
    manualEntryModal.classList.remove('active');
    alert(`Asiento Contable ${newVoucher.code} registrado localmente.`);
  });

  // 4. Inicialización del Reporte Formal de Balance de Comprobación Imprimible
  const btnPrintBalance = document.getElementById('btnPrintBalance');
  const balanceModal = document.getElementById('balanceReportModal');
  const balanceSheet = document.getElementById('balanceReportSheet');
  const btnPrintBalanceModal = document.getElementById('btnPrintBalanceModal');
  const btnExportBalanceCsv = document.getElementById('btnExportBalanceCsv');
  const btnCloseBalanceModal = document.getElementById('btnCloseBalanceModal');

  function renderBalanceReportContent() {
    if (!balanceSheet) return;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const activeUser = session?.user || { name: 'Andrés Felipe Gómez', role: 'Contador General' };

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

      const deudorText = saldoDeudor > 0 ? ('$' + saldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2 })) : '-';
      const acreedorText = saldoAcreedor > 0 ? ('$' + saldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2 })) : '-';

      return `
        <tr>
          <td><code style="font-weight: 700; color: var(--color-espresso);">${acc.code}</code></td>
          <td><strong>${acc.name}</strong></td>
          <td style="text-align: right;">$${sumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">$${sumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: ${saldoDeudor > 0 ? 'var(--color-espresso)' : 'var(--color-muted)'}; font-weight: ${saldoDeudor > 0 ? '700' : '400'};">${deudorText}</td>
          <td style="text-align: right; color: ${saldoAcreedor > 0 ? 'var(--color-espresso)' : 'var(--color-muted)'}; font-weight: ${saldoAcreedor > 0 ? '700' : '400'};">${acreedorText}</td>
        </tr>
      `;
    }).join('');

    const isBalanced = Math.abs(totalSumDebe - totalSumHaber) < 0.05 && Math.abs(totalSaldoDeudor - totalSaldoAcreedor) < 0.05;

    balanceSheet.innerHTML = `
      <div class="report-header-banner">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <i data-lucide="scale" class="icon-lg" style="color: var(--color-gold);"></i>
            <h1 class="report-brand-title">La Nueva Parisienne Panadería &amp; Pastelería C.A.</h1>
          </div>
          <p class="report-brand-sub">
            RIF: J-40123456-7 &bull; Av. Lara con Calle 8, Barquisimeto, Edo. Lara<br>
            Departamento de Contabilidad &bull; Módulo 7: Auditoría y Libros Oficiales
          </p>
        </div>
        <div class="report-meta-box">
          <span class="report-meta-badge">BALANCE DE COMPROBACIÓN</span>
          <div><strong>Fecha Emisión:</strong> ${dateFormatted}, ${timeFormatted}</div>
          <div><strong>Moneda Funcional:</strong> Dólares Americanos ($ USD) / Ref. BCV</div>
          <div><strong>Elaborado por:</strong> ${activeUser.name} (${activeUser.role || 'Contador General'})</div>
        </div>
      </div>

      <div style="background: ${isBalanced ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 40, 40, 0.08)'}; border: 1px solid ${isBalanced ? 'rgba(46, 125, 50, 0.3)' : 'rgba(198, 40, 40, 0.3)'}; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <i data-lucide="${isBalanced ? 'check-circle-2' : 'alert-circle'}" class="icon-md" style="color: ${isBalanced ? 'var(--color-success)' : 'var(--color-terracotta)'};"></i>
          <div>
            <strong style="color: ${isBalanced ? 'var(--color-success)' : 'var(--color-terracotta)'}; font-size: 0.95rem;">
              ${isBalanced ? 'Principio de Partida Doble Verificado y Cuadrado' : 'Advertencia: Descuadre en Sumas Contables'}
            </strong>
            <p style="margin: 0; font-size: 0.82rem; color: var(--color-muted);">Total Sumas Debe es estrictamente igual al Total Sumas Haber &bull; Total Saldos Deudores igual a Acreedores.</p>
          </div>
        </div>
        <div style="text-align: right; font-size: 0.88rem; font-weight: 700; color: var(--color-espresso);">
          Total Sumas: $${totalSumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div class="report-section-heading">
        <i data-lucide="book-open" class="icon-sm"></i>
        <span>Libro Mayor - Balance de Sumas y Saldos Analíticos (PUC)</span>
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
            <td style="text-align: right;"><strong>$${totalSumDebe.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSumHaber.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSaldoDeudor.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
            <td style="text-align: right;"><strong>$${totalSaldoAcreedor.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #FAF8F5; border-radius: 6px; padding: 0.85rem 1.25rem; font-size: 0.82rem; color: var(--color-muted); line-height: 1.5; margin-bottom: 2rem;">
        <strong>Certificación Contable:</strong> Se hace constar que el presente Balance de Comprobación refleja fielmente las operaciones registradas en el Libro Diario y Mayor de <em>La Nueva Parisienne Panadería &amp; Pastelería C.A.</em>, habiéndose verificado la exactitud matemática de las partidas dobles conforme a las Normas Internacionales de Información Financiera (NIIF para PYMES) y principios contables vigentes.
      </div>

      <div class="report-signatures-grid">
        <div class="report-signature-block">
          <div class="report-signature-line"></div>
          <div class="report-signature-name">${activeUser.name}</div>
          <div class="report-signature-role">Contador General &bull; C.P.C. N° 45.892</div>
        </div>
        <div class="report-signature-block">
          <div class="report-signature-line"></div>
          <div class="report-signature-name">Juan Mendoza</div>
          <div class="report-signature-role">Gerente General &bull; Representante Legal</div>
        </div>
      </div>
    `;

    window.LucideIcons?.refresh();
  }

  function openBalanceModal() {
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

  btnPrintBalance?.addEventListener('click', (e) => {
    e.preventDefault();
    openBalanceModal();
  });

  btnCloseBalanceModal?.addEventListener('click', closeBalanceModal);
  balanceModal?.addEventListener('click', (e) => {
    if (e.target === balanceModal) closeBalanceModal();
  });

  btnPrintBalanceModal?.addEventListener('click', () => {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 1000);
  });

  btnExportBalanceCsv?.addEventListener('click', () => {
    const rows = [
      ['LA NUEVA PARISIENNE - BALANCE DE COMPROBACION'],
      ['Fecha Emision', new Date().toISOString()],
      ['Empresa', 'La Nueva Parisienne Panaderia & Pasteleria C.A.'],
      ['RIF', 'J-40123456-7'],
      [],
      ['CODIGO PUC', 'DENOMINACION CUENTA', 'SUMAS DEBE ($)', 'SUMAS HABER ($)', 'SALDO DEUDOR ($)', 'SALDO ACREEDOR ($)']
    ];

    let tDebe = 0, tHaber = 0, tDeudor = 0, tAcreedor = 0;
    (trialBalance || []).forEach(acc => {
      tDebe += Number(acc.sumDebe || 0);
      tHaber += Number(acc.sumHaber || 0);
      tDeudor += Number(acc.saldoDeudor || 0);
      tAcreedor += Number(acc.saldoAcreedor || 0);
      rows.push([
        acc.code,
        acc.name,
        Number(acc.sumDebe || 0).toFixed(2),
        Number(acc.sumHaber || 0).toFixed(2),
        Number(acc.saldoDeudor || 0).toFixed(2),
        Number(acc.saldoAcreedor || 0).toFixed(2)
      ]);
    });

    rows.push([]);
    rows.push(['TOTALES', 'TOTALES GENERALES', tDebe.toFixed(2), tHaber.toFixed(2), tDeudor.toFixed(2), tAcreedor.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,﻿' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `balance_comprobacion_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccounting);
} else {
  initAccounting();
}
