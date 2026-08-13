/* ==========================================================================
   MÓDULO 4: CONTROLADOR INTERACTIVO DEL DASHBOARD GERENCIAL (DASHBOARD.JS)
   Manejo de métricas KPI, renderizado de gráfico Chart.js y tabla de movimientos
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';
import { DASHBOARD_KPIS, SALES_TREND_DATA, RECENT_MOVEMENTS } from '../data/dashboard-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión
  const session = SessionStore.getSession();
  if (!session) {
    alert('Sesión no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar datos del Gerente activo
  const managerNameEl = document.getElementById('managerName');
  const managerAvatarEl = document.getElementById('managerAvatar');
  if (managerNameEl) managerNameEl.textContent = session.user.name;
  if (managerAvatarEl) managerAvatarEl.textContent = session.user.icon;

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  let currentCategoryFilter = 'todos';
  let salesChartInstance = null;

  // Suscripción en tiempo real a BcvRateStore
  BcvRateStore.subscribe((data) => {
    updateBcvKpiUI(data);
  });

  // Initial render
  renderKPIs();
  fetchBcvRate();
  initSalesChart();
  renderMovementsTable();

  // 2. Renderizado de Tarjetas KPI y Tasa BCV
  function renderKPIs() {
    const revenueVal = document.getElementById('kpiRevenueVal');
    const ordersVal = document.getElementById('kpiOrdersVal');
    const ticketVal = document.getElementById('kpiTicketVal');
    const marginVal = document.getElementById('kpiMarginVal');

    if (revenueVal) revenueVal.textContent = `$${DASHBOARD_KPIS.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (ordersVal) ordersVal.textContent = `${DASHBOARD_KPIS.totalOrders} órdenes`;
    if (ticketVal) ticketVal.textContent = `$${DASHBOARD_KPIS.averageTicket.toFixed(2)}`;
    if (marginVal) marginVal.textContent = `${DASHBOARD_KPIS.profitMargin}%`;
  }

  function updateBcvKpiUI(data) {
    const rateValEl = document.getElementById('kpiBcvRateVal');
    const sourceEl = document.getElementById('kpiBcvSource');
    const dateEl = document.getElementById('kpiBcvDate');

    if (rateValEl && data && data.rate) {
      rateValEl.textContent = `Bs. ${data.rate.toFixed(2)}`;
    }
    if (sourceEl && data) {
      const isManual = data.mode === 'manual';
      sourceEl.textContent = isManual ? `● Tasa: Manual (Gerencial)` : `● Tasa: Automática (En Vivo)`;
      sourceEl.className = isManual ? 'growth-badge warning' : 'growth-badge positive';
    }
    if (dateEl && data) {
      dateEl.textContent = `${data.date || 'Hoy'} (por $1.00 USD)`;
    }

    const isManualMode = data && data.mode === 'manual';
    if (dashModoManual && isManualMode) dashModoManual.checked = true;
    if (dashModoAuto && !isManualMode) dashModoAuto.checked = true;
    if (dashTasaInput && data && data.rate) dashTasaInput.value = data.rate.toFixed(2);
    updateDashTasaUiMode(isManualMode);
  }

  // Controles Gerenciales interactivos de la tarjeta BCV en el Dashboard
  const dashModoAuto = document.getElementById('dashModoAuto');
  const dashModoManual = document.getElementById('dashModoManual');
  const dashLblAuto = document.getElementById('dashLblAuto');
  const dashLblManual = document.getElementById('dashLblManual');
  const dashTasaGroup = document.getElementById('dashTasaGroup');
  const dashTasaInput = document.getElementById('dashTasaInput');
  const dashLockTag = document.getElementById('dashLockTag');
  const btnSaveDashRate = document.getElementById('btnSaveDashRate');

  function updateDashTasaUiMode(isManual) {
    if (dashLblAuto) dashLblAuto.style.borderColor = isManual ? 'var(--border-subtle)' : 'var(--color-success)';
    if (dashLblManual) dashLblManual.style.borderColor = isManual ? 'var(--color-success)' : 'var(--border-subtle)';

    if (dashTasaGroup && dashTasaInput) {
      if (isManual) {
        dashTasaGroup.style.opacity = '1';
        dashTasaGroup.style.pointerEvents = 'auto';
        dashTasaInput.disabled = false;
        if (dashLockTag) {
          dashLockTag.textContent = '🔓 (Desbloqueado)';
          dashLockTag.style.color = 'var(--color-success)';
        }
      } else {
        dashTasaGroup.style.opacity = '0.4';
        dashTasaGroup.style.pointerEvents = 'none';
        dashTasaInput.disabled = true;
        if (dashLockTag) {
          dashLockTag.textContent = '🔒 (Bloqueado)';
          dashLockTag.style.color = 'var(--color-muted)';
        }
      }
    }
  }

  document.querySelectorAll('input[name="dashModoTasaRadio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateDashTasaUiMode(e.target.value === 'manual');
    });
  });

  if (btnSaveDashRate) {
    btnSaveDashRate.addEventListener('click', async () => {
      const isManual = dashModoManual && dashModoManual.checked;
      const selectedMode = isManual ? 'manual' : 'auto';
      const manualVal = dashTasaInput ? parseFloat(dashTasaInput.value) || 761.21 : 761.21;

      if (isManual && manualVal < 100) {
        alert('⚠️ Ingrese una tasa manual válida mayor a Bs. 100.');
        return;
      }

      btnSaveDashRate.disabled = true;
      btnSaveDashRate.textContent = '⏳ Guardando...';

      try {
        const payload = {
          modo_tasa: selectedMode,
          tasa_manual: manualVal
        };

        const res = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (res.ok && result.success) {
          const currentData = await BcvRateStore.fetchRate(true);
          const activeRate = isManual ? manualVal : (currentData.rate || manualVal);
          const activeSource = isManual ? 'Tasa Manual Gerencial (Dashboard)' : 'BCV Oficial (ve.dolarapi.com - En Vivo)';

          BcvRateStore.broadcastChange(activeRate, selectedMode, activeSource);
          alert(`✓ ¡Tasa cambiaria actualizada a Bs. ${activeRate.toFixed(2)} (${selectedMode === 'manual' ? 'Manual' : 'Automática en Vivo'})! Transmitido a POS e Inventario.`);
        } else {
          alert(`❌ Error al guardar: ${result.message || 'Error en el servidor.'}`);
        }
      } catch (err) {
        alert('❌ Error de conexión al guardar la tasa cambiaria.');
      }

      btnSaveDashRate.disabled = false;
      btnSaveDashRate.textContent = '💾 Aplicar';
    });
  }

  async function fetchBcvRate(forceRefresh = false) {
    const btnRefresh = document.getElementById('btnRefreshBcvRate');

    if (btnRefresh && forceRefresh) {
      btnRefresh.disabled = true;
      btnRefresh.textContent = '⏳ Cargando...';
    }

    const data = await BcvRateStore.fetchRate(forceRefresh);
    updateBcvKpiUI(data);

    if (btnRefresh) {
      btnRefresh.disabled = false;
      btnRefresh.textContent = '🔄 Refrescar API';
    }
  }

  const btnRefreshBcvRate = document.getElementById('btnRefreshBcvRate');
  if (btnRefreshBcvRate) {
    btnRefreshBcvRate.addEventListener('click', () => fetchBcvRate(true));
  }

  // 3. Inicialización del Gráfico de Tendencia de Ventas (Chart.js)
  function initSalesChart() {
    const ctx = document.getElementById('salesTrendChart')?.getContext('2d');
    if (!ctx) return;

    // Destruir instancia previa si existe
    if (salesChartInstance) salesChartInstance.destroy();

    // Gradientes de Lujo para el Gráfico
    const goldGradient = ctx.createLinearGradient(0, 0, 0, 300);
    goldGradient.addColorStop(0, 'rgba(212, 155, 84, 0.4)');
    goldGradient.addColorStop(1, 'rgba(212, 155, 84, 0.0)');

    const terracottaGradient = ctx.createLinearGradient(0, 0, 0, 300);
    terracottaGradient.addColorStop(0, 'rgba(200, 90, 50, 0.25)');
    terracottaGradient.addColorStop(1, 'rgba(200, 90, 50, 0.0)');

    // Verificar si Chart.js está disponible en window
    if (typeof Chart !== 'undefined') {
      salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: SALES_TREND_DATA.labels,
          datasets: [
            {
              label: 'Ventas Totales ($)',
              data: SALES_TREND_DATA.sales,
              borderColor: '#D49B54',
              backgroundColor: goldGradient,
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#2C1D11',
              pointBorderColor: '#D49B54',
              pointRadius: 5
            },
            {
              label: 'Costo de Producción ($)',
              data: SALES_TREND_DATA.costs,
              borderColor: '#C85A32',
              backgroundColor: terracottaGradient,
              borderWidth: 2,
              borderDash: [5, 5],
              fill: true,
              tension: 0.35,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#2C1D11',
              titleFont: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans', size: 13 },
              padding: 12,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' }, color: '#7A6B5D' }
            },
            y: {
              grid: { color: 'rgba(44, 29, 17, 0.06)' },
              ticks: {
                font: { family: 'Plus Jakarta Sans' },
                color: '#7A6B5D',
                callback: (val) => `$${val}`
              }
            }
          }
        }
      });
    }
  }

  // 4. Renderizado y Filtrado de la Tabla de Movimientos Recientes
  function renderMovementsTable() {
    const tbody = document.getElementById('recentMovementsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filtered = RECENT_MOVEMENTS.filter(mov => {
      if (currentCategoryFilter === 'todos') return true;
      return mov.category === currentCategoryFilter;
    });

    filtered.forEach(mov => {
      const tr = document.createElement('tr');

      const isPositive = mov.amount >= 0;
      const formattedAmount = isPositive ? `+$${mov.amount.toFixed(2)}` : `-$${Math.abs(mov.amount).toFixed(2)}`;
      const amountClass = isPositive ? 'positive' : 'negative';

      tr.innerHTML = `
        <td class="table-code-badge">${mov.code}</td>
        <td style="color: var(--color-muted); font-size: 0.85rem;">${mov.timestamp}</td>
        <td><strong>${mov.type}</strong></td>
        <td>${mov.user}</td>
        <td style="color: var(--color-muted);">${mov.paymentMethod}</td>
        <td><span class="table-status-tag completado">${mov.status}</span></td>
        <td class="amount-text ${amountClass}">${formattedAmount}</td>
        <td><button type="button" class="btn-table-action">Ver Detalle</button></td>
      `;

      tr.querySelector('.btn-table-action').addEventListener('click', () => {
        alert(`Detalle de Transacción ${mov.code}:\n\nOperación: ${mov.type}\nFecha: ${mov.timestamp}\nResponsable: ${mov.user}\nMonto: $${mov.amount.toFixed(2)}\nMétodo: ${mov.paymentMethod}`);
      });

      tbody.appendChild(tr);
    });
  }

  // Event Listeners de Filtro de Movimientos
  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.dataset.filter;
      renderMovementsTable();
    });
  });

  // Botón Exportar Reporte
  document.getElementById('btnExportReport')?.addEventListener('click', () => {
    alert('Generando Reporte Ejecutivo PDF/Excel para La Nueva Parisienne...');
  });
});
