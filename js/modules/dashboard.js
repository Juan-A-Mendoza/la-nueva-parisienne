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
    if (!data) return;
    if (kpiBcvRateVal && data.rate) {
      kpiBcvRateVal.textContent = `Bs. ${parseFloat(data.rate).toFixed(2)}`;
    }
    // Solo sincronizar estado inicial si el usuario no ha seleccionado manual en la sesión actual
    if (!radioManual?.checked) {
      const isManualLocal = localStorage.getItem('modoTasa') === 'manual';
      if (isManualLocal && radioManual) {
        radioManual.checked = true;
        actualizarVistaTasa();
      }
    }
  }

  // ==========================================================================
  // BLOQUE DE REESCRITURA CON IDs EXACTOS REQUERIDOS
  // ==========================================================================
  const radioAuto = document.getElementById('radio_auto');
  const radioManual = document.getElementById('radio_manual');
  const inputTasa = document.getElementById('input_tasa_manual');
  const labelCandado = document.getElementById('label_candado');
  const textoEstado = document.getElementById('texto_estado_tasa');
  const btnSaveDashRate = document.getElementById('btnSaveDashRate');
  const kpiBcvRateVal = document.getElementById('kpiBcvRateVal');

  function actualizarVistaTasa() {
    const dashLblAuto = document.getElementById('dashLblAuto');
    const dashLblManual = document.getElementById('dashLblManual');

    if (radioManual && radioManual.checked) {
      if (dashLblAuto) dashLblAuto.style.borderColor = 'var(--border-subtle)';
      if (dashLblManual) dashLblManual.style.borderColor = 'var(--color-success)';

      if (inputTasa) {
        inputTasa.removeAttribute('disabled');
        inputTasa.removeAttribute('readonly');
        inputTasa.style.pointerEvents = 'auto';
        inputTasa.style.opacity = '1';
        inputTasa.style.cursor = 'text';
        inputTasa.style.background = '#FFFFFF';
        try { inputTasa.focus(); inputTasa.select(); } catch (e) {}
      }
      if (labelCandado) labelCandado.innerHTML = '✏️ (Modo Edición)';
      if (textoEstado) textoEstado.innerHTML = '• Tasa: Manual (Editada)';
    } else {
      if (dashLblAuto) dashLblAuto.style.borderColor = 'var(--color-success)';
      if (dashLblManual) dashLblManual.style.borderColor = 'var(--border-subtle)';

      if (inputTasa) {
        inputTasa.setAttribute('disabled', 'true');
        inputTasa.style.opacity = '0.5';
        inputTasa.style.cursor = 'not-allowed';
        inputTasa.style.background = '#F5F5F5';
      }
      if (labelCandado) labelCandado.innerHTML = '🔒 (Bloqueado en Modo Auto)';
      if (textoEstado) textoEstado.innerHTML = '• Tasa: Automática (En Vivo)';
      fetchLiveApiRate();
    }
  }

  // Escuchar los clics
  if (radioAuto && radioManual) {
    radioAuto.addEventListener('change', actualizarVistaTasa);
    radioManual.addEventListener('change', actualizarVistaTasa);
  }

  // También escuchar clics en las etiquetas contenedoras de los radios
  const dashLblAuto = document.getElementById('dashLblAuto');
  const dashLblManual = document.getElementById('dashLblManual');
  if (dashLblAuto) {
    dashLblAuto.addEventListener('click', () => {
      if (radioAuto) radioAuto.checked = true;
      actualizarVistaTasa();
    });
  }
  if (dashLblManual) {
    dashLblManual.addEventListener('click', () => {
      if (radioManual) radioManual.checked = true;
      actualizarVistaTasa();
    });
  }

  // Guardado Global (Botón Aplicar)
  if (btnSaveDashRate) {
    btnSaveDashRate.addEventListener('click', async () => {
      const isManual = radioManual && radioManual.checked;
      const modoSeleccionado = isManual ? 'manual' : 'auto';
      const valorIngresado = inputTasa ? parseFloat(inputTasa.value) || 0 : 0;

      if (isManual && valorIngresado <= 0) {
        alert('⚠️ Por favor ingrese un monto en Bolívares válido mayor a 0.00.');
        return;
      }

      btnSaveDashRate.disabled = true;
      btnSaveDashRate.textContent = '⏳ Aplicando...';

      let rateToApply = valorIngresado;
      let sourceLabel = "• Tasa: Manual (Editada)";

      if (modoSeleccionado === 'auto') {
        rateToApply = await fetchLiveApiRate();
        sourceLabel = "• Tasa: Automática (En Vivo)";
      }

      // Guardar dos variables en el navegador (localStorage)
      localStorage.setItem('modoTasa', modoSeleccionado);
      localStorage.setItem('tasaManual', rateToApply.toString());

      // Persistir en MySQL (update_empresa.php)
      try {
        await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modo_tasa: modoSeleccionado,
            tasa_manual: rateToApply
          })
        });
      } catch (err) {}

      // Actualizar UI del Dashboard
      if (kpiBcvRateVal) {
        kpiBcvRateVal.textContent = `Bs. ${rateToApply.toFixed(2)}`;
      }
      if (textoEstado) {
        textoEstado.innerHTML = sourceLabel;
      }

      // Sincronizar en tiempo real con Módulo 3 POS y otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: rateToApply, mode: modoSeleccionado } }));
      BcvRateStore.broadcastChange(rateToApply, modoSeleccionado, sourceLabel);

      btnSaveDashRate.disabled = false;
      btnSaveDashRate.textContent = '💾 Aplicar';

      alert(`✓ ¡Tasa cambiaria aplicada con éxito!\nModo: ${sourceLabel}\nMonto: Bs. ${rateToApply.toFixed(2)}`);
    });
  }

  async function fetchLiveApiRate() {
    try {
      const res = await fetch('../api/bcmrate.php?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        const apiRate = data.rate || data.promedio;
        if (apiRate && parseFloat(apiRate) > 0) {
          const val = parseFloat(apiRate);
          if (kpiBcvRateVal) kpiBcvRateVal.textContent = `Bs. ${val.toFixed(2)}`;
          if (!radioManual?.checked && inputTasa) {
            inputTasa.value = val.toFixed(2);
          }
          return val;
        }
      }
    } catch (e) {}
    return parseFloat(localStorage.getItem('tasaManual')) || 761.21;
  }

  // Inicializar estado guardado al cargar
  function initDashboardRateState() {
    const modoGuardado = localStorage.getItem('modoTasa') || 'auto';
    const tasaGuardada = parseFloat(localStorage.getItem('tasaManual')) || 761.21;

    if (inputTasa) inputTasa.value = tasaGuardada.toFixed(2);

    if (modoGuardado === 'manual') {
      if (radioManual) radioManual.checked = true;
      actualizarVistaTasa();
      if (kpiBcvRateVal) kpiBcvRateVal.textContent = `Bs. ${tasaGuardada.toFixed(2)}`;
    } else {
      if (radioAuto) radioAuto.checked = true;
      actualizarVistaTasa();
      fetchLiveApiRate();
    }
  }

  initDashboardRateState();

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
