/* ==========================================================================
   MÓDULO 7: CONTROLADOR INTERACTIVO DE CONTABILIDAD (ACCOUNTING.JS)
   Partidas contables automáticas, libro diario, cuentas T y balance general
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { PLAN_CUENTAS, AUTOMATIC_ENTRIES, TRIAL_BALANCE_ACCOUNTS } from '../data/accounting-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión
  const session = SessionStore.getSession();
  if (!session) {
    alert('Sesión no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = session.user.name;
  if (userAvatarEl) userAvatarEl.textContent = session.user.icon;

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de la Contabilidad
  let automaticEntries = JSON.parse(JSON.stringify(AUTOMATIC_ENTRIES));
  let trialBalance = JSON.parse(JSON.stringify(TRIAL_BALANCE_ACCOUNTS));

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

  // Inicializar
  renderAll();

  function renderAll() {
    renderVouchers();
    renderTAccounts();
    renderTrialBalance();
  }

  // 4. Renderizado de Asientos Contables Automáticos (Vouchers)
  function renderVouchers() {
    vouchersListContainer.innerHTML = '';

    automaticEntries.forEach(voucher => {
      const card = document.createElement('div');
      card.className = 'voucher-card';

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
            <div class="voucher-icon">${voucher.icon}</div>
            <div>
              <h3 style="font-size: 1.1rem; color: var(--color-espresso);">${voucher.code}: ${voucher.concept}</h3>
              <span style="font-size: 0.8rem; color: var(--color-muted);">${voucher.date}</span>
            </div>
          </div>
          <span class="voucher-source-tag">${voucher.sourceModule}</span>
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
          <span style="color: var(--color-success); font-weight: 700;">✓ Partida Doble Verificada (Debe = Haber)</span>
          <strong>Total Asiento: $${voucher.totalDebe.toFixed(2)}</strong>
        </div>
      `;

      vouchersListContainer.appendChild(card);
    });
  }

  // 5. Renderizado de Libro Mayor - Cuentas T
  function renderTAccounts() {
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

  manualEntryForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const concept = document.getElementById('entryConceptInput').value;
    const debeCode = document.getElementById('debeAccountSelect').value;
    const debeAmount = parseFloat(document.getElementById('debeAmountInput').value) || 0;
    const haberCode = document.getElementById('haberAccountSelect').value;
    const haberAmount = parseFloat(document.getElementById('haberAmountInput').value) || 0;

    if (debeAmount !== haberAmount) {
      alert('⚠️ Error de Cuadre: El monto del Debe debe ser idéntico al monto del Haber (Partida Doble).');
      return;
    }

    const debeAcc = PLAN_CUENTAS.find(c => c.code === debeCode);
    const haberAcc = PLAN_CUENTAS.find(c => c.code === haberCode);

    const newVoucher = {
      id: `as_${Date.now()}`,
      code: `AS-2026-00${automaticEntries.length + 1}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      concept: concept,
      sourceModule: 'Manual Administrador',
      icon: '✍️',
      details: [
        { accountCode: debeCode, accountName: debeAcc ? debeAcc.name : 'Cuenta Débito', debe: debeAmount, haber: 0.00 },
        { accountCode: haberCode, accountName: haberAcc ? haberAcc.name : 'Cuenta Crédito', debe: 0.00, haber: haberAmount }
      ],
      totalDebe: debeAmount,
      totalHaber: haberAmount
    };

    automaticEntries.unshift(newVoucher);
    renderAll();
    manualEntryModal.classList.remove('active');
    alert(`Asiento Contable ${newVoucher.code} asentado correctamente en el Libro Diario.`);
  });
});
