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

  // ==========================================================================
  // RECONSTRUCCIÓN COMPLETA, AISLADA Y LIMPIA DEL WIDGET DE TASA BCV
  // ==========================================================================
  const tasaDisplay = document.getElementById('tasa_actual_display');
  const modoAutoRadio = document.getElementById('modo_auto');
  const modoManualRadio = document.getElementById('modo_manual');
  const inputTasaManual = document.getElementById('input_tasa_manual');
  const btnAplicarTasa = document.getElementById('btn_aplicar_tasa');
  const textoEstadoTasa = document.getElementById('texto_estado_tasa');
  const btnRefreshApi = document.getElementById('btnRefreshBcvRate');

  // Función auxiliar para consultar la API en vivo
  async function fetchLiveBcvRate() {
    try {
      const res = await fetch('../api/bcmrate.php?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        const rateVal = data.rate || data.promedio;
        if (rateVal && parseFloat(rateVal) > 0) {
          return parseFloat(rateVal);
        }
      }
    } catch (e) {}
    return parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 761.21;
  }

  // 1. Manejo del cambio en los Radio Buttons (Auto / Manual)
  function handleRadioChange() {
    if (modoManualRadio && modoManualRadio.checked) {
      if (inputTasaManual) {
        inputTasaManual.disabled = false;
        inputTasaManual.style.opacity = '1';
        inputTasaManual.style.background = '#FFFFFF';
        try { inputTasaManual.focus(); } catch (e) {}
      }
    } else if (modoAutoRadio) {
      if (inputTasaManual) {
        inputTasaManual.disabled = true;
        inputTasaManual.style.opacity = '0.5';
        inputTasaManual.style.background = '#F5F5F5';
      }
    }
  }

  if (modoAutoRadio) modoAutoRadio.addEventListener('change', handleRadioChange);
  if (modoManualRadio) modoManualRadio.addEventListener('change', handleRadioChange);

  // 2. Evento del botón Aplicar (btn_aplicar_tasa)
  if (btnAplicarTasa) {
    btnAplicarTasa.addEventListener('click', async () => {
      const isManual = modoManualRadio && modoManualRadio.checked;
      const modoVal = isManual ? 'manual' : 'auto';

      // a) & b) Guardar en localStorage
      localStorage.setItem('modo_tasa', modoVal);
      localStorage.setItem('modoTasa', modoVal);

      let finalRate = 761.21;
      let stateText = '• Tasa: Automática (En Vivo)';

      if (isManual) {
        // c) Si es manual, guardar tasa_manual
        const valInput = inputTasaManual ? parseFloat(inputTasaManual.value) || 0 : 0;
        if (valInput <= 0) {
          alert('⚠️ Ingrese un monto en Bolívares válido mayor a 0.00.');
          return;
        }
        finalRate = valInput;
        stateText = '• Tasa: Manual (Editada)';
        localStorage.setItem('tasa_manual', finalRate.toString());
        localStorage.setItem('tasaManual', finalRate.toString());
      } else {
        btnAplicarTasa.disabled = true;
        btnAplicarTasa.textContent = '⏳ Cargando...';
        finalRate = await fetchLiveBcvRate();
        btnAplicarTasa.disabled = false;
        btnAplicarTasa.textContent = '💾 Aplicar';
      }

      // d) Actualizar visualmente la pantalla al instante
      if (tasaDisplay) tasaDisplay.innerText = `Bs. ${finalRate.toFixed(2)}`;
      if (textoEstadoTasa) textoEstadoTasa.innerText = stateText;

      // Persistir en backend (update_empresa.php)
      try {
        await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modo_tasa: modoVal, tasa_manual: finalRate })
        });
      } catch (e) {}

      // Broadcast a Módulo 3 POS y otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: finalRate, mode: modoVal } }));

      // e) Notificación de alerta
      alert('Tasa actualizada correctamente en todo el sistema');
    });
  }

  // 3. Inicialización al cargar la página
  async function initBcvWidget() {
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
    const tasaGuardada = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 761.21;

    if (inputTasaManual) inputTasaManual.value = tasaGuardada.toFixed(2);

    if (modoGuardado === 'manual') {
      if (modoManualRadio) modoManualRadio.checked = true;
      if (inputTasaManual) {
        inputTasaManual.disabled = false;
        inputTasaManual.style.opacity = '1';
        inputTasaManual.style.background = '#FFFFFF';
      }
      if (tasaDisplay) tasaDisplay.innerText = `Bs. ${tasaGuardada.toFixed(2)}`;
      if (textoEstadoTasa) textoEstadoTasa.innerText = '• Tasa: Manual (Editada)';
    } else {
      if (modoAutoRadio) modoAutoRadio.checked = true;
      if (inputTasaManual) {
        inputTasaManual.disabled = true;
        inputTasaManual.style.opacity = '0.5';
        inputTasaManual.style.background = '#F5F5F5';
      }
      if (textoEstadoTasa) textoEstadoTasa.innerText = '• Tasa: Automática (En Vivo)';
      const liveRate = await fetchLiveBcvRate();
      if (tasaDisplay) tasaDisplay.innerText = `Bs. ${liveRate.toFixed(2)}`;
    }
  }

  // Botón Refrescar API
  if (btnRefreshApi) {
    btnRefreshApi.addEventListener('click', async () => {
      btnRefreshApi.disabled = true;
      btnRefreshApi.textContent = '⏳ Cargando...';
      const liveRate = await fetchLiveBcvRate();
      if (modoAutoRadio && modoAutoRadio.checked && tasaDisplay) {
        tasaDisplay.innerText = `Bs. ${liveRate.toFixed(2)}`;
      }
      btnRefreshApi.disabled = false;
      btnRefreshApi.textContent = '🔄 Refrescar API';
    });
  }

  initBcvWidget();

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
