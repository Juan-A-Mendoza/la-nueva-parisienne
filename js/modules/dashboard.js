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
    handleRateBroadcast(data);
  });

  // Initial render
  renderKPIs();
  resolveDashboardBcvRate();
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
  // BADGE DE TASA DE CAMBIO BCV EN NAVBAR GERENCIAL (IDÉNTICO A CAJA POS)
  // ==========================================================================
  function updateDashboardRateBadge(rate, labelText, isManual) {
    const bcvRateValEl = document.getElementById('bcvRateVal');
    const bcvRateBadge = document.getElementById('bcvRateBadge');

    if (bcvRateValEl) {
      bcvRateValEl.textContent = `Bs. ${rate.toFixed(2)}`;
    }
    if (bcvRateBadge) {
      bcvRateBadge.innerHTML = `<span>🇻🇪 ${labelText}:</span> <strong>Bs. ${rate.toFixed(2)}</strong>`;
      bcvRateBadge.className = isManual ? 'bcv-rate-badge warning' : 'bcv-rate-badge';
    }
  }

  async function resolveDashboardBcvRate() {
    // 1. Verificar si la tasa está en modo manual desde Módulo 9
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
    if (modoGuardado === 'manual') {
      const tasaManualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
      if (tasaManualVal && tasaManualVal > 0) {
        updateDashboardRateBadge(tasaManualVal, 'Tasa: Manual (Editada)', true);
        return tasaManualVal;
      }
    }

    // 2. Si es modo automático, consultar la API en vivo (currency-api via jsdelivr)
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.usd && data.usd.ves && parseFloat(data.usd.ves) > 0) {
          const liveRate = parseFloat(data.usd.ves);
          localStorage.setItem('tasa_auto', liveRate.toString());
          localStorage.setItem('tasaAuto', liveRate.toString());
          updateDashboardRateBadge(liveRate, 'Tasa: Automática (En Vivo)', false);
          return liveRate;
        }
      }
    } catch (e) {
      console.warn('Error al consultar currency-api en Dashboard Navbar:', e);
    }

    const fallbackRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 761.21;
    updateDashboardRateBadge(fallbackRate, 'Tasa: Resguardo', true);
    return fallbackRate;
  }

  function handleRateBroadcast(data) {
    if (!data) {
      resolveDashboardBcvRate();
      return;
    }
    const isManual = data.mode === 'manual';
    const rateVal = parseFloat(data.rate) || 0;
    const labelText = isManual ? 'Tasa: Manual (Editada)' : 'Tasa: Automática (En Vivo)';
    if (rateVal > 0) {
      updateDashboardRateBadge(rateVal, labelText, isManual);
    }
  }

  resolveDashboardBcvRate();

  // Escuchar a través de BroadcastChannel de latencia cero
  if (typeof BroadcastChannel !== 'undefined') {
    const rateChannel = new BroadcastChannel('lnp_bcv_channel');
    rateChannel.onmessage = (e) => {
      if (e.data) handleRateBroadcast(e.data);
    };
  }

  // Escuchar eventos globales del navegador
  window.addEventListener('storage', () => resolveDashboardBcvRate());
  window.addEventListener('bcvRateChanged', (e) => {
    if (e && e.detail) handleRateBroadcast(e.detail);
    else resolveDashboardBcvRate();
  });

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

  // Desglose dinámico de ítems por movimiento
  const BREAKDOWN_MAP = {
    'FAC-2026-1003': [
      { name: '🥖 Baguette Tradición (x2)', price: '$3.60 USD' },
      { name: '🥐 Croissant de Mantequilla (x3)', price: '$7.50 USD' },
      { name: '☕ Café Au Lait (x2)', price: '$6.40 USD' },
      { name: '🍰 Tarta de Almendras (x1)', price: '$15.00 USD' }
    ],
    'FAC-2026-1002': [
      { name: '🍞 Pan de Campo Artesanal (x1)', price: '$6.00 USD' },
      { name: '🍫 Pain au Chocolat (x2)', price: '$8.00 USD' }
    ],
    'OC-2026-0089': [
      { name: '🌾 Harina de Trigo Panadera 50kg (x10 Sacos)', price: '-$450.00 USD' }
    ],
    'FAC-2026-1001': [
      { name: '🍞 Brioche Tradicional (x3)', price: '$10.80 USD' },
      { name: '🍫 Éclair de Chocolate (x2)', price: '$18.00 USD' }
    ],
    'ARQ-2026-0012': [
      { name: '🔍 Auditoría de Caja e Inventario (Turno Mañana - Sin Descuadres)', price: '$0.00 USD' }
    ],
    'OC-2026-0088': [
      { name: '🧈 Mantequilla AOP Normandía 25kg (x4 Cajas)', price: '-$280.00 USD' }
    ]
  };

  function openMovementDetailModal(mov) {
    const modal = document.getElementById('modalMovimientoDetalle');
    if (!modal) return;

    // Calcular tasa BCV actual
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
    let activeRate = 761.21;
    if (modoGuardado === 'manual') {
      activeRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
    } else {
      activeRate = parseFloat(localStorage.getItem('tasa_auto') || localStorage.getItem('tasaAuto')) || 761.21;
    }

    const isPositive = mov.amount >= 0;
    const amountUsdText = isPositive ? `+$${mov.amount.toFixed(2)} USD` : `-$${Math.abs(mov.amount).toFixed(2)} USD`;
    const amountVesVal = Math.abs(mov.amount) * activeRate;
    const amountVesText = isPositive 
      ? `+Bs. ${amountVesVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES` 
      : `-Bs. ${amountVesVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`;

    // Asignar valores a la ventana modal
    document.getElementById('modalDetalleCodigo').textContent = `Transacción #${mov.code}`;
    document.getElementById('modalDetalleSubtitulo').textContent = `Registro Financiero de Operación (${mov.type})`;

    const iconEl = document.getElementById('modalDetalleIcon');
    if (iconEl) {
      if (mov.category === 'venta') iconEl.textContent = '🛍️';
      else if (mov.category === 'gasto') iconEl.textContent = '📦';
      else iconEl.textContent = '📊';
    }

    const montoCard = document.getElementById('modalMontoCard');
    if (montoCard) {
      if (mov.amount < 0) montoCard.classList.add('negative');
      else montoCard.classList.remove('negative');
    }

    document.getElementById('modalMontoUsd').textContent = amountUsdText;
    document.getElementById('modalMontoVes').textContent = amountVesText;
    document.getElementById('modalTipoOp').textContent = mov.type;
    document.getElementById('modalResponsable').textContent = mov.user;
    document.getElementById('modalMetodoPago').textContent = mov.paymentMethod;
    document.getElementById('modalFecha').textContent = mov.timestamp;
    document.getElementById('modalTasaBcv').textContent = `Bs. ${activeRate.toFixed(2)} / USD`;

    // Renderizar desglose
    const listContainer = document.getElementById('modalBreakdownList');
    if (listContainer) {
      listContainer.innerHTML = '';
      const items = BREAKDOWN_MAP[mov.code] || [
        { name: `Concepto General: ${mov.type}`, price: `$${Math.abs(mov.amount).toFixed(2)} USD` }
      ];

      items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'breakdown-item-row';
        row.innerHTML = `
          <span class="breakdown-item-name">${it.name}</span>
          <span class="breakdown-item-price">${it.price}</span>
        `;
        listContainer.appendChild(row);
      });
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeMovementDetailModal() {
    const modal = document.getElementById('modalMovimientoDetalle');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Listeners de Cierre e Interacción del Modal
  document.getElementById('btnCerrarModalDetalle')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('btnCerrarModalDetalleFooter')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('modalMovimientoDetalle')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalMovimientoDetalle') closeMovementDetailModal();
  });

  document.getElementById('btnImprimirComprobante')?.addEventListener('click', () => {
    const cod = document.getElementById('modalDetalleCodigo')?.textContent || '';
    alert(`🖨️ Imprimiendo voucher oficial para ${cod}...`);
  });

  document.getElementById('btnCopiarRef')?.addEventListener('click', () => {
    const cod = document.getElementById('modalDetalleCodigo')?.textContent || '';
    navigator.clipboard?.writeText(cod);
    alert(`📋 ${cod} copiado al portapapeles.`);
  });

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
        openMovementDetailModal(mov);
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

  // ==========================================================================
  // DATOS DE PRUEBA DE INVENTARIO Y ALMACÉN (REQUERIMIENTOS 1-4)
  // ==========================================================================
  let rawMaterialsData = [
    { code: 'MAT-001', name: 'Harina de Trigo Tradicional T55', icon: '🌾', category: 'Materias Primas', unitCost: 1.80, unit: 'Kg', stock: 18.00, minStock: 50.00 },
    { code: 'MAT-002', name: 'Mantequilla de Normandía 84% M.G.', icon: '🧈', category: 'Lácteos & Mantequillas', unitCost: 8.50, unit: 'Kg', stock: 12.50, minStock: 30.00 },
    { code: 'MAT-003', name: 'Levadura Madre Activa Tostada', icon: '🧫', category: 'Levaduras & Fermentos', unitCost: 4.20, unit: 'Kg', stock: 8.00, minStock: 15.00 },
    { code: 'MAT-004', name: 'Chocolate Belga 60% Cacao', icon: '🍫', category: 'Coberturas & Cacao', unitCost: 12.00, unit: 'Kg', stock: 42.00, minStock: 20.00 },
    { code: 'MAT-005', name: 'Azúcar Fina Refinada', icon: '🧂', category: 'Materias Primas', unitCost: 1.50, unit: 'Kg', stock: 65.00, minStock: 25.00 },
    { code: 'MAT-006', name: 'Huevos Frescos de Granja', icon: '🥚', category: 'Insumos Frescos', unitCost: 0.25, unit: 'Und', stock: 120.00, minStock: 150.00 }
  ];

  let finishedGoodsData = [
    { code: 'PAN-001', name: 'Baguette Tradicional Parisina', icon: '🥖', category: 'Panadería Artesanal', unitCost: 1.20, salePrice: 2.50, unit: 'Und', stock: 45, minStock: 20 },
    { code: 'PAN-002', name: 'Croissant de Mantequilla', icon: '🥐', category: 'Panadería Artesanal', unitCost: 1.40, salePrice: 3.00, unit: 'Und', stock: 60, minStock: 25 },
    { code: 'PAS-001', name: 'Éclair de Chocolate Belga', icon: '⚡', category: 'Pastelería & Repostería', unitCost: 2.10, salePrice: 4.50, unit: 'Und', stock: 8, minStock: 15 },
    { code: 'BEB-001', name: 'Café Espresso Doble', icon: '☕', category: 'Cafetería & Bebidas', unitCost: 0.80, salePrice: 2.80, unit: 'Und', stock: 100, minStock: 30 },
    { code: 'BEB-004', name: 'Jugo de Naranja Recién Exprimido', icon: '🍊', category: 'Cafetería & Bebidas', unitCost: 1.50, salePrice: 4.00, unit: 'L', stock: 40, minStock: 15 },
    { code: 'ESP-001', name: 'Croque-Monsieur Tradicional', icon: '🥪', category: 'Especialidades & Desayunos', unitCost: 3.20, salePrice: 7.50, unit: 'Und', stock: 5, minStock: 10 }
  ];

  let suppliersData = [
    { code: 'PROV-001', name: 'Molinos del Sur, C.A.', icon: '🌾', rif: 'J-30819283-4', phone: '(01) 555-MOLINO', contact: 'Carlos Mendoza', address: 'Zona Industrial Sur, Parcela 14, Caracas' },
    { code: 'PROV-002', name: 'Lácteos La Granja', icon: '🧈', rif: 'J-40192837-1', phone: '(01) 555-LACTEOS', contact: 'María Elena Suárez', address: 'Av. Las Acacias, Edif. La Granja, Valencia' },
    { code: 'PROV-003', name: 'Empaques del Norte', icon: '📦', rif: 'J-29837482-9', phone: '(01) 555-EMPAQUE', contact: 'Roberto Gómez', address: 'Av. Principal Norte, Bodega 5, Maracay' },
    { code: 'PROV-004', name: 'Chocolates del Rey', icon: '🍫', rif: 'J-50192834-6', phone: '(01) 555-CACAO', contact: 'Jean-Philippe Laurent', address: 'Calle Los Artesanos, Qta. Cacao, Los Teques' }
  ];

  // 1. NAVEGACIÓN ENTRE VISTAS DEL DASHBOARD (ANALYTICS VS INVENTARIO)
  const navBtnAnalytics = document.getElementById('navBtnAnalytics');
  const navBtnInventory = document.getElementById('navBtnInventory');
  const analyticsView = document.getElementById('analyticsView');
  const inventoryView = document.getElementById('inventoryView');
  const breadcrumbActiveItem = document.getElementById('breadcrumbActiveItem');

  function switchDashboardView(viewName) {
    if (viewName === 'inventory') {
      if (navBtnAnalytics) navBtnAnalytics.classList.remove('active');
      if (navBtnInventory) navBtnInventory.classList.add('active');
      if (analyticsView) analyticsView.style.display = 'none';
      if (inventoryView) inventoryView.style.display = 'block';
      if (breadcrumbActiveItem) breadcrumbActiveItem.textContent = 'Control de Inventario & Almacén';
    } else {
      if (navBtnAnalytics) navBtnAnalytics.classList.add('active');
      if (navBtnInventory) navBtnInventory.classList.remove('active');
      if (analyticsView) analyticsView.style.display = 'block';
      if (inventoryView) inventoryView.style.display = 'none';
      if (breadcrumbActiveItem) breadcrumbActiveItem.textContent = 'Dashboard Gerencial';
    }
  }

  if (navBtnAnalytics) navBtnAnalytics.addEventListener('click', () => switchDashboardView('analytics'));
  if (navBtnInventory) navBtnInventory.addEventListener('click', () => switchDashboardView('inventory'));

  // 2. PESTAÑAS DENTRO DEL PANEL DE INVENTARIO (MATERIA PRIMA VS PRODUCTOS TERMINADOS VS PROVEEDORES)
  const tabBtnMateriaPrima = document.getElementById('tabBtnMateriaPrima');
  const tabBtnProductosTerminados = document.getElementById('tabBtnProductosTerminados');
  const tabBtnProveedores = document.getElementById('tabBtnProveedores');

  const panelMateriaPrima = document.getElementById('panelMateriaPrima');
  const panelProductosTerminados = document.getElementById('panelProductosTerminados');
  const panelProveedores = document.getElementById('panelProveedores');

  function switchInventoryTab(tabName) {
    tabBtnMateriaPrima?.classList.remove('active');
    tabBtnProductosTerminados?.classList.remove('active');
    tabBtnProveedores?.classList.remove('active');

    if (panelMateriaPrima) panelMateriaPrima.style.display = 'none';
    if (panelProductosTerminados) panelProductosTerminados.style.display = 'none';
    if (panelProveedores) panelProveedores.style.display = 'none';

    if (tabName === 'finished') {
      tabBtnProductosTerminados?.classList.add('active');
      if (panelProductosTerminados) panelProductosTerminados.style.display = 'block';
    } else if (tabName === 'suppliers') {
      tabBtnProveedores?.classList.add('active');
      if (panelProveedores) panelProveedores.style.display = 'block';
    } else {
      tabBtnMateriaPrima?.classList.add('active');
      if (panelMateriaPrima) panelMateriaPrima.style.display = 'block';
    }
  }

  tabBtnMateriaPrima?.addEventListener('click', () => switchInventoryTab('raw'));
  tabBtnProductosTerminados?.addEventListener('click', () => switchInventoryTab('finished'));
  tabBtnProveedores?.addEventListener('click', () => switchInventoryTab('suppliers'));

  // 3. RENDERIZADO DE LAS TABLAS DE INVENTARIO (REQUERIMIENTO 2 & 3)
  function renderInventoryTables() {
    const rawTbody = document.getElementById('materiaPrimaTbody');
    const finishedTbody = document.getElementById('productosTerminadosTbody');
    const suppliersTbody = document.getElementById('proveedoresTbody');

    const searchTerm = (document.getElementById('inventorySearchInput')?.value || '').toLowerCase().trim();
    const filterCat = document.getElementById('inventoryCategoryFilter')?.value || 'todos';

    // 3.1 Materias Primas
    if (rawTbody) {
      rawTbody.innerHTML = '';
      const filteredRaw = rawMaterialsData.filter(item => {
        const matchSearch = item.code.toLowerCase().includes(searchTerm) || item.name.toLowerCase().includes(searchTerm);
        if (!matchSearch) return false;
        if (filterCat === 'low_stock') return item.stock < item.minStock;
        return true;
      });

      const badgeRaw = document.getElementById('badgeMateriaPrimaCount');
      if (badgeRaw) badgeRaw.textContent = rawMaterialsData.length;

      filteredRaw.forEach(item => {
        const isLow = item.stock < item.minStock;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="table-code-badge">${item.code}</td>
          <td><strong>${item.icon || '📦'} ${item.name}</strong></td>
          <td style="color: var(--color-muted);">${item.category}</td>
          <td><span class="table-status-tag" style="background: rgba(0,0,0,0.06); color: var(--color-espresso); font-weight: 700;">${item.unit}</span></td>
          <td style="font-weight: 700; color: var(--color-gold-dark);">$${item.unitCost.toFixed(2)} / ${item.unit}</td>
          <td style="font-weight: 800; font-size: 0.95rem;">${item.stock.toFixed(2)} ${item.unit}</td>
          <td>
            <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
              ${isLow ? `🔴 ALERTA: Stock Bajo (Min: ${item.minStock} ${item.unit})` : `🟢 Normal (Min: ${item.minStock} ${item.unit})`}
            </span>
          </td>
          <td>
            <button type="button" class="btn-table-action-sm" data-code="${item.code}">+ Ingreso</button>
          </td>
        `;

        tr.querySelector('.btn-table-action-sm')?.addEventListener('click', () => {
          openIngresoMercanciaModal(item.code);
        });

        rawTbody.appendChild(tr);
      });
    }

    // 3.2 Productos Terminados
    if (finishedTbody) {
      finishedTbody.innerHTML = '';
      const filteredFinished = finishedGoodsData.filter(item => {
        const matchSearch = item.code.toLowerCase().includes(searchTerm) || item.name.toLowerCase().includes(searchTerm);
        if (!matchSearch) return false;
        if (filterCat === 'low_stock') return item.stock < item.minStock;
        return true;
      });

      const badgeFinished = document.getElementById('badgeProductosTerminadosCount');
      if (badgeFinished) badgeFinished.textContent = finishedGoodsData.length;

      filteredFinished.forEach(item => {
        const isLow = item.stock < item.minStock;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="table-code-badge">${item.code}</td>
          <td><strong>${item.icon || '🛍️'} ${item.name}</strong></td>
          <td style="color: var(--color-muted);">${item.category}</td>
          <td><span class="table-status-tag" style="background: rgba(0,0,0,0.06); color: var(--color-espresso); font-weight: 700;">${item.unit}</span></td>
          <td style="color: var(--color-muted);">$${item.unitCost.toFixed(2)} / ${item.unit}</td>
          <td style="font-weight: 700; color: var(--color-gold-dark);">$${item.salePrice.toFixed(2)} USD</td>
          <td style="font-weight: 800; font-size: 0.95rem;">${item.stock} ${item.unit}</td>
          <td>
            <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
              ${isLow ? `🔴 ALERTA: Stock Bajo (Min: ${item.minStock} ${item.unit})` : `🟢 Normal (Min: ${item.minStock} ${item.unit})`}
            </span>
          </td>
          <td>
            <button type="button" class="btn-table-action-sm" data-code="${item.code}">+ Ingreso</button>
          </td>
        `;

        tr.querySelector('.btn-table-action-sm')?.addEventListener('click', () => {
          openIngresoMercanciaModal(item.code);
        });

        finishedTbody.appendChild(tr);
      });
    }

    // 3.3 Proveedores (Pestaña 3 - Requerimiento 3)
    if (suppliersTbody) {
      suppliersTbody.innerHTML = '';
      const filteredSuppliers = suppliersData.filter(item => {
        return item.code.toLowerCase().includes(searchTerm) || 
               item.name.toLowerCase().includes(searchTerm) || 
               item.rif.toLowerCase().includes(searchTerm) ||
               item.contact.toLowerCase().includes(searchTerm);
      });

      const badgeSuppliers = document.getElementById('badgeProveedoresCount');
      if (badgeSuppliers) badgeSuppliers.textContent = suppliersData.length;

      filteredSuppliers.forEach(prov => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="table-code-badge">${prov.code}</td>
          <td><strong>${prov.icon || '🏬'} ${prov.name}</strong></td>
          <td style="font-weight: 600; color: var(--color-espresso);">${prov.rif}</td>
          <td style="color: var(--color-muted);">${prov.phone}</td>
          <td>👤 ${prov.contact}</td>
          <td style="color: var(--color-muted); font-size: 0.82rem;">${prov.address || 'N/A'}</td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn-table-action-sm btn-edit-prov" title="Editar datos del proveedor">✏️ Editar</button>
              <button type="button" class="btn-table-action-sm btn-del-prov" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar proveedor">🗑️</button>
            </div>
          </td>
        `;

        tr.querySelector('.btn-edit-prov')?.addEventListener('click', () => {
          openProveedorModal(prov);
        });

        tr.querySelector('.btn-del-prov')?.addEventListener('click', () => {
          if (confirm(`¿Desea eliminar al proveedor ${prov.name} (${prov.rif})?`)) {
            suppliersData = suppliersData.filter(p => p.code !== prov.code);
            renderInventoryTables();
          }
        });

        suppliersTbody.appendChild(tr);
      });
    }
  }

  document.getElementById('inventorySearchInput')?.addEventListener('input', renderInventoryTables);
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', renderInventoryTables);

  // 4. MODAL DE REGISTRO DE INGRESO DE MERCANCÍA (REQUERIMIENTO 1 & 2)
  const modalIngresoMercancia = document.getElementById('modalIngresoMercancia');
  const btnOpenIngresoMercanciaModal = document.getElementById('btnOpenIngresoMercanciaModal');
  const closeIngresoMercanciaModalBtn = document.getElementById('closeIngresoMercanciaModalBtn');
  const cancelIngresoMercanciaBtn = document.getElementById('cancelIngresoMercanciaBtn');
  const ingresoMercanciaForm = document.getElementById('ingresoMercanciaForm');
  const modalIngresoProductoSelect = document.getElementById('modalIngresoProductoSelect');

  function populateIngresoModalSelect() {
    if (!modalIngresoProductoSelect) return;
    modalIngresoProductoSelect.innerHTML = '<option value="" disabled selected>-- Seleccione un ítem del catálogo --</option>';

    const optGroupRaw = document.createElement('optgroup');
    optGroupRaw.label = '🌾 MATERIAS PRIMAS E INSUMOS';
    rawMaterialsData.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.code;
      opt.textContent = `${item.code} - ${item.name} (${item.stock} ${item.unit} actuales)`;
      optGroupRaw.appendChild(opt);
    });
    modalIngresoProductoSelect.appendChild(optGroupRaw);

    const optGroupFinished = document.createElement('optgroup');
    optGroupFinished.label = '🛍️ PRODUCTOS TERMINADOS / VENTA DIRECTA';
    finishedGoodsData.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.code;
      opt.textContent = `${item.code} - ${item.name} (${item.stock} ${item.unit} actuales)`;
      optGroupFinished.appendChild(opt);
    });
    modalIngresoProductoSelect.appendChild(optGroupFinished);
  }

  function openIngresoMercanciaModal(preselectCode = null) {
    populateIngresoModalSelect();
    if (preselectCode && modalIngresoProductoSelect) {
      modalIngresoProductoSelect.value = preselectCode;
    }

    if (modalIngresoMercancia) {
      modalIngresoMercancia.style.display = 'flex';
      modalIngresoMercancia.setAttribute('aria-hidden', 'false');
    }
  }

  function closeIngresoMercanciaModal() {
    if (modalIngresoMercancia) {
      modalIngresoMercancia.style.display = 'none';
      modalIngresoMercancia.setAttribute('aria-hidden', 'true');
      ingresoMercanciaForm?.reset();
      updateCostoUnitarioPreview();
    }
  }

  btnOpenIngresoMercanciaModal?.addEventListener('click', () => openIngresoMercanciaModal());
  closeIngresoMercanciaModalBtn?.addEventListener('click', closeIngresoMercanciaModal);
  cancelIngresoMercanciaBtn?.addEventListener('click', closeIngresoMercanciaModal);

  // Cálculo en vivo del costo unitario
  const modalIngresoCantidad = document.getElementById('modalIngresoCantidad');
  const modalIngresoCostoTotal = document.getElementById('modalIngresoCostoTotal');
  const costoUnitarioPreviewVal = document.getElementById('costoUnitarioPreviewVal');

  function updateCostoUnitarioPreview() {
    const qty = parseFloat(modalIngresoCantidad?.value || 0);
    const totalCost = parseFloat(modalIngresoCostoTotal?.value || 0);
    if (qty > 0 && totalCost > 0) {
      const unitCost = totalCost / qty;
      if (costoUnitarioPreviewVal) costoUnitarioPreviewVal.textContent = `$${unitCost.toFixed(2)} / unidad`;
    } else {
      if (costoUnitarioPreviewVal) costoUnitarioPreviewVal.textContent = '$0.00 / unidad';
    }
  }

  modalIngresoCantidad?.addEventListener('input', updateCostoUnitarioPreview);
  modalIngresoCostoTotal?.addEventListener('input', updateCostoUnitarioPreview);

  // Envío del Formulario de Ingreso de Mercancía
  ingresoMercanciaForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedCode = modalIngresoProductoSelect?.value;
    const qty = parseFloat(modalIngresoCantidad?.value || 0);
    const selectedUom = document.getElementById('modalIngresoUnidad')?.value || 'Und';
    const totalCost = parseFloat(modalIngresoCostoTotal?.value || 0);
    const provider = document.getElementById('modalIngresoProveedor')?.value || 'Proveedor';
    const numFactura = document.getElementById('modalIngresoNumFactura')?.value || 'N/A';

    if (!selectedCode || qty <= 0 || totalCost <= 0) return;

    let targetItem = rawMaterialsData.find(i => i.code === selectedCode);
    if (!targetItem) {
      targetItem = finishedGoodsData.find(i => i.code === selectedCode);
    }

    if (targetItem) {
      targetItem.stock += qty;
      targetItem.unit = selectedUom;
      targetItem.unitCost = totalCost / qty;
    }

    renderInventoryTables();
    closeIngresoMercanciaModal();
    alert(`✅ ¡Ingreso Registrado con Éxito!\n\nProducto: ${targetItem ? targetItem.name : selectedCode}\nCantidad Ingresada: +${qty} ${selectedUom}\nProveedor: ${provider}\nFactura N°: ${numFactura}`);
  });

  // 5. MODAL DE GESTIÓN DE PROVEEDORES (REQUERIMIENTO 3)
  const modalProveedor = document.getElementById('modalProveedor');
  const modalProveedorTitle = document.getElementById('modalProveedorTitle');
  const btnOpenProveedorModalHeader = document.getElementById('btnOpenProveedorModalHeader');
  const closeProveedorModalBtn = document.getElementById('closeProveedorModalBtn');
  const cancelProveedorBtn = document.getElementById('cancelProveedorBtn');
  const proveedorForm = document.getElementById('proveedorForm');

  function openProveedorModal(provToEdit = null) {
    if (provToEdit) {
      if (modalProveedorTitle) modalProveedorTitle.textContent = 'Editar Información de Proveedor';
      document.getElementById('modalProvCode').value = provToEdit.code;
      document.getElementById('modalProvNombre').value = provToEdit.name;
      document.getElementById('modalProvRif').value = provToEdit.rif;
      document.getElementById('modalProvTelefono').value = provToEdit.phone;
      document.getElementById('modalProvContacto').value = provToEdit.contact;
      document.getElementById('modalProvDireccion').value = provToEdit.address || '';
    } else {
      if (modalProveedorTitle) modalProveedorTitle.textContent = 'Registrar Nuevo Proveedor';
      proveedorForm?.reset();
      document.getElementById('modalProvCode').value = '';
    }

    if (modalProveedor) {
      modalProveedor.style.display = 'flex';
      modalProveedor.setAttribute('aria-hidden', 'false');
    }
  }

  function closeProveedorModal() {
    if (modalProveedor) {
      modalProveedor.style.display = 'none';
      modalProveedor.setAttribute('aria-hidden', 'true');
      proveedorForm?.reset();
    }
  }

  btnOpenProveedorModalHeader?.addEventListener('click', () => openProveedorModal());
  closeProveedorModalBtn?.addEventListener('click', closeProveedorModal);
  cancelProveedorBtn?.addEventListener('click', closeProveedorModal);

  proveedorForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const code = document.getElementById('modalProvCode')?.value;
    const name = document.getElementById('modalProvNombre')?.value?.trim();
    const rif = document.getElementById('modalProvRif')?.value?.trim();
    const phone = document.getElementById('modalProvTelefono')?.value?.trim();
    const contact = document.getElementById('modalProvContacto')?.value?.trim();
    const address = document.getElementById('modalProvDireccion')?.value?.trim() || '';

    if (!name || !rif || !phone || !contact) return;

    if (code) {
      // Editar existente
      const existing = suppliersData.find(p => p.code === code);
      if (existing) {
        existing.name = name;
        existing.rif = rif;
        existing.phone = phone;
        existing.contact = contact;
        existing.address = address;
      }
    } else {
      // Crear nuevo
      const newCode = `PROV-${String(suppliersData.length + 1).padStart(3, '0')}`;
      suppliersData.push({
        code: newCode,
        name: name,
        icon: '🏬',
        rif: rif,
        phone: phone,
        contact: contact,
        address: address
      });
    }

    renderInventoryTables();
    closeProveedorModal();
    alert(`✅ Proveedor ${name} (${rif}) guardado con éxito.`);
  });

  // Close modals on overlay backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modalIngresoMercancia) closeIngresoMercanciaModal();
    if (e.target === modalProveedor) closeProveedorModal();
  });

  // Render inicial de tablas de inventario
  renderInventoryTables();
});
