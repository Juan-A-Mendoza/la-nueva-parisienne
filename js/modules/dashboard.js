/* ==========================================================================
   MÓDULO 4: CONTROLADOR INTERACTIVO DEL DASHBOARD GERENCIAL (DASHBOARD.JS)
   Principio de Aislamiento de Fallos, Resiliencia y Modularización Estricta
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';
import { DASHBOARD_KPIS, SALES_TREND_DATA, RECENT_MOVEMENTS } from '../data/dashboard-db.js';

// ==========================================================================
// 1. MAESTRO DE DATOS Y ESTADO GLOBAL DEL MÓDULO
// ==========================================================================

const INITIAL_15_POS_PRODUCTS = [
  { id: 'prod_001', code: 'PAN-001', name: 'Baguette Tradicional Parisina', category: 'Panadería', unitCost: 1.20, salePrice: 2.50, unit: 'Und', stock: 45, minStock: 20, icon: '🥖', showInPos: true, description: 'Corteza crujiente y miga alveolada con levadura madre.' },
  { id: 'prod_002', code: 'PAN-002', name: 'Croissant de Mantequilla', category: 'Panadería', unitCost: 1.40, salePrice: 3.00, unit: 'Und', stock: 60, minStock: 25, icon: '🥐', showInPos: true, description: 'Hojaldre 100% mantequilla de Normandía.' },
  { id: 'prod_003', code: 'PAN-003', name: 'Pain au Chocolat', category: 'Panadería', unitCost: 1.60, salePrice: 3.50, unit: 'Und', stock: 35, minStock: 15, icon: '🍫', showInPos: true, description: 'Hojaldre relleno de dos barras de chocolate negro 60%.' },
  { id: 'prod_004', code: 'PAN-004', name: 'Brioche de Vainilla', category: 'Panadería', unitCost: 2.00, salePrice: 4.20, unit: 'Und', stock: 20, minStock: 10, icon: '🍞', showInPos: true, description: 'Pan de huevo esponjoso aromatizado con vainilla.' },
  { id: 'prod_005', code: 'PAN-005', name: 'Focaccia de Romero y Aceitunas', category: 'Panadería', unitCost: 2.80, salePrice: 5.50, unit: 'Und', stock: 15, minStock: 8, icon: '🫓', showInPos: true, description: 'Pan plano italiano horneado con aceite de oliva extra virgen.' },
  { id: 'prod_006', code: 'PAS-001', name: 'Éclair de Chocolate Belga', category: 'Pastelería', unitCost: 2.10, salePrice: 4.50, unit: 'Und', stock: 25, minStock: 15, icon: '⚡', showInPos: true, description: 'Pasta choux rellena de crema pastelera de chocolate oscuro.' },
  { id: 'prod_007', code: 'PAS-002', name: 'Tarta de Limón Merengada', category: 'Pastelería', unitCost: 2.40, salePrice: 5.00, unit: 'Und', stock: 18, minStock: 10, icon: '🍋', showInPos: true, description: 'Base sablée, crema de limón amarillo y merengue tostado.' },
  { id: 'prod_008', code: 'PAS-003', name: 'Caja de Macarons Surtidos (6 ud)', category: 'Pastelería', unitCost: 4.50, salePrice: 9.50, unit: 'Und', stock: 30, minStock: 12, icon: '🍡', showInPos: true, description: 'Selección de pistacho, frambuesa, vainilla, chocolate y café.' },
  { id: 'prod_009', code: 'PAS-004', name: 'Milhojas Tradicional de Crema', category: 'Pastelería', unitCost: 2.20, salePrice: 4.80, unit: 'Und', stock: 14, minStock: 8, icon: '🍰', showInPos: true, description: 'Capas de hojaldre crujiente con crema diplomática.' },
  { id: 'prod_010', code: 'BEB-001', name: 'Café Espresso Doble', category: 'Bebidas', unitCost: 0.80, salePrice: 2.80, unit: 'Und', stock: 100, minStock: 30, icon: '☕', showInPos: true, description: 'Grano 100% arábica de tueste medio de origen único.' },
  { id: 'prod_011', code: 'BEB-002', name: 'Capuchino Cremoso', category: 'Bebidas', unitCost: 1.10, salePrice: 3.80, unit: 'Und', stock: 80, minStock: 25, icon: '🥛', showInPos: true, description: 'Espresso con leche al vapor y espuma suave de canela.' },
  { id: 'prod_012', code: 'BEB-003', name: 'Café au Lait Parisien', category: 'Bebidas', unitCost: 1.00, salePrice: 3.50, unit: 'Und', stock: 90, minStock: 25, icon: '☕', showInPos: true, description: 'Café de filtro mezclado con leche entera caliente.' },
  { id: 'prod_013', code: 'BEB-004', name: 'Jugo de Naranja Recién Exprimido', category: 'Bebidas', unitCost: 1.50, salePrice: 4.00, unit: 'L', stock: 40, minStock: 15, icon: '🍊', showInPos: true, description: '100% natural, prensado al momento sin azúcar añadida.' },
  { id: 'prod_014', code: 'ESP-001', name: 'Croque-Monsieur Tradicional', category: 'Salados', unitCost: 3.20, salePrice: 7.50, unit: 'Und', stock: 22, minStock: 10, icon: '🥪', showInPos: true, description: 'Sándwich caliente de jamón cocido, queso Gruyère y bechamel.' },
  { id: 'prod_015', code: 'ESP-002', name: 'Quiche Lorraine de Bacon', category: 'Salados', unitCost: 3.00, salePrice: 6.80, unit: 'Und', stock: 16, minStock: 8, icon: '🥧', showInPos: true, description: 'Tarta salada con tocino ahumado, crema de leche y queso.' }
];

function getPosCatalogFromStorage() {
  try {
    const stored = localStorage.getItem('catalogo_pos');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error leyendo catalogo_pos:', e);
  }
  try { localStorage.setItem('catalogo_pos', JSON.stringify(INITIAL_15_POS_PRODUCTS)); } catch (e) {}
  return INITIAL_15_POS_PRODUCTS;
}

function savePosCatalogToStorage(productsArray) {
  try {
    const list = Array.isArray(productsArray) ? productsArray : [];
    localStorage.setItem('catalogo_pos', JSON.stringify(list));
    window.dispatchEvent(new Event('catalogoPosChanged'));
    if (typeof BroadcastChannel !== 'undefined') {
      const posChannel = new BroadcastChannel('lnp_pos_catalog_channel');
      posChannel.postMessage({ type: 'catalog_updated', timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Error guardando catalogo_pos:', e);
  }
}

function getRawMaterialsFromStorage() {
  try {
    const stored = localStorage.getItem('materias_primas');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error leyendo materias_primas:', e);
  }
  const defaultList = [
    { code: 'MAT-001', name: 'Harina de Trigo Tradicional T55', icon: '🌾', category: 'Materias Primas', unitCost: 1.80, unit: 'Kg', stock: 18.00, minStock: 50.00 },
    { code: 'MAT-002', name: 'Mantequilla de Normandía 84% M.G.', icon: '🧈', category: 'Lácteos & Mantequillas', unitCost: 8.50, unit: 'Kg', stock: 12.50, minStock: 30.00 },
    { code: 'MAT-003', name: 'Levadura Madre Activa Tostada', icon: '🧫', category: 'Levaduras & Fermentos', unitCost: 4.20, unit: 'Kg', stock: 8.00, minStock: 15.00 },
    { code: 'MAT-004', name: 'Chocolate Belga 60% Cacao', icon: '🍫', category: 'Coberturas & Cacao', unitCost: 12.00, unit: 'Kg', stock: 42.00, minStock: 20.00 },
    { code: 'MAT-005', name: 'Azúcar Fina Refinada', icon: '🧂', category: 'Materias Primas', unitCost: 1.50, unit: 'Kg', stock: 65.00, minStock: 25.00 },
    { code: 'MAT-006', name: 'Huevos Frescos de Granja', icon: '🥚', category: 'Insumos Frescos', unitCost: 0.25, unit: 'Und', stock: 120.00, minStock: 150.00 }
  ];
  try { localStorage.setItem('materias_primas', JSON.stringify(defaultList)); } catch (e) {}
  return defaultList;
}

function saveRawMaterialsToStorage(materialsArray) {
  try {
    const list = Array.isArray(materialsArray) ? materialsArray : [];
    localStorage.setItem('materias_primas', JSON.stringify(list));
    window.dispatchEvent(new Event('materiasPrimasChanged'));
  } catch (e) {
    console.error('Error guardando materias_primas:', e);
  }
}

function getSuppliersFromStorage() {
  try {
    const stored = localStorage.getItem('proveedores_list');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error leyendo proveedores_list:', e);
  }
  const defaultList = [
    { code: 'PROV-001', name: 'Molinos del Sur, C.A.', icon: '🌾', rif: 'J-30819283-4', phone: '(01) 555-MOLINO', contact: 'Carlos Mendoza', address: 'Zona Industrial Sur, Parcela 14, Caracas' },
    { code: 'PROV-002', name: 'Lácteos La Granja', icon: '🧈', rif: 'J-40192837-1', phone: '(01) 555-LACTEOS', contact: 'María Elena Suárez', address: 'Av. Las Acacias, Edif. La Granja, Valencia' },
    { code: 'PROV-003', name: 'Empaques del Norte', icon: '📦', rif: 'J-29837482-9', phone: '(01) 555-EMPAQUE', contact: 'Roberto Gómez', address: 'Av. Principal Norte, Bodega 5, Maracay' },
    { code: 'PROV-004', name: 'Chocolates del Rey', icon: '🍫', rif: 'J-50192834-6', phone: '(01) 555-CACAO', contact: 'Jean-Philippe Laurent', address: 'Calle Los Artesanos, Qta. Cacao, Los Teques' }
  ];
  try { localStorage.setItem('proveedores_list', JSON.stringify(defaultList)); } catch (e) {}
  return defaultList;
}

function saveSuppliersToStorage(suppliersArray) {
  try {
    const list = Array.isArray(suppliersArray) ? suppliersArray : [];
    localStorage.setItem('proveedores_list', JSON.stringify(list));
    window.dispatchEvent(new Event('proveedoresListChanged'));
  } catch (e) {
    console.error('Error guardando proveedores_list:', e);
  }
}

let rawMaterialsData = getRawMaterialsFromStorage();
let finishedGoodsData = getPosCatalogFromStorage();
let suppliersData = getSuppliersFromStorage();

let currentCategoryFilter = 'todos';
let salesChartInstance = null;
let pendingDeleteTarget = null;
const VALID_MANAGER_PASSWORDS = ['admin123', '1234', 'gerente', 'admin', '0000'];

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

// ==========================================================================
// 2. HELPER FUNCTIONS DE MODALES Y NOTIFICACIONES
// ==========================================================================

function showErrorModal(title, msg, onConfirm = null) {
  const modalErrorNotificacion = document.getElementById('modalErrorNotificacion');
  const modalErrorTitle = document.getElementById('modalErrorTitle');
  const modalErrorMsg = document.getElementById('modalErrorMsg');
  const closeErrorModalBtn = document.getElementById('closeErrorModalBtn');

  if (modalErrorTitle) modalErrorTitle.textContent = title;
  if (modalErrorMsg) modalErrorMsg.textContent = msg;

  if (modalErrorNotificacion) {
    modalErrorNotificacion.style.display = 'flex';
    modalErrorNotificacion.setAttribute('aria-hidden', 'false');

    const svg = modalErrorNotificacion.querySelector('.error-cross-svg');
    if (svg) {
      svg.style.animation = 'none';
      void svg.offsetWidth;
      svg.style.animation = '';
    }

    const handleClose = () => {
      modalErrorNotificacion.style.display = 'none';
      modalErrorNotificacion.setAttribute('aria-hidden', 'true');
      if (onConfirm) onConfirm();
    };

    if (closeErrorModalBtn) closeErrorModalBtn.onclick = handleClose;
  } else {
    alert(`${title}\n\n${msg}`);
    if (onConfirm) onConfirm();
  }
}

function showSuccessModal(title, msg) {
  const modalExitoNotificacion = document.getElementById('modalExitoNotificacion');
  const modalExitoTitle = document.getElementById('modalExitoTitle');
  const modalExitoMsg = document.getElementById('modalExitoMsg');

  if (modalExitoTitle) modalExitoTitle.textContent = title;
  if (modalExitoMsg) modalExitoMsg.textContent = msg;

  if (modalExitoNotificacion) {
    modalExitoNotificacion.style.display = 'flex';
    modalExitoNotificacion.setAttribute('aria-hidden', 'false');

    const svg = modalExitoNotificacion.querySelector('.success-checkmark-svg');
    if (svg) {
      svg.style.animation = 'none';
      void svg.offsetWidth;
      svg.style.animation = '';
    }
  }
}

function closeSuccessModal() {
  const modalExitoNotificacion = document.getElementById('modalExitoNotificacion');
  if (modalExitoNotificacion) {
    modalExitoNotificacion.style.display = 'none';
    modalExitoNotificacion.setAttribute('aria-hidden', 'true');
  }
  try { document.getElementById('ingresoMercanciaForm')?.reset(); } catch (e) {}
  try { document.getElementById('materiaPrimaForm')?.reset(); } catch (e) {}
  try { document.getElementById('productoTerminadoForm')?.reset(); } catch (e) {}
  try { document.getElementById('proveedorForm')?.reset(); } catch (e) {}
  try { renderInventoryTables(); } catch (e) {}
}

function closeMovementDetailModal() {
  const modal = document.getElementById('modalMovimientoDetalle');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ==========================================================================
// 3. FUNCIONES DE MODULARIZACIÓN INDEPENDIENTES (AISLAMIENTO DE FALLOS)
// ==========================================================================

/**
 * 1. Inicialización de Sesión y Barra Superior
 */
function inicializarSesionYBarraSuperior() {
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo usuario_activo:', err);
  }

  const activeUser = (session && session.user) ? session.user : {
    name: 'Juan Mendoza',
    role: 'Gerente General',
    icon: '👨‍💼'
  };

  const managerNameEl = document.getElementById('managerName');
  const managerAvatarEl = document.getElementById('managerAvatar');
  if (managerNameEl) managerNameEl.textContent = activeUser.name || 'Juan Mendoza';
  if (managerAvatarEl) managerAvatarEl.textContent = activeUser.icon || '👨‍💼';

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        SessionStore.logout();
      } catch (err) {
        localStorage.removeItem('usuario_activo');
        sessionStorage.removeItem('LN_PARISIENNE_SESSION');
        window.location.href = '../index.html';
      }
    });
  }
}

/**
 * 2. Inicialización de Navegación por Pestañas y Filtros
 */
function inicializarNavegacionTabs() {
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

  const tabBtnMateriaPrima = document.getElementById('tabBtnMateriaPrima');
  const tabBtnProductosTerminados = document.getElementById('tabBtnProductosTerminados');
  const tabBtnProveedores = document.getElementById('tabBtnProveedores');

  const panelMateriaPrima = document.getElementById('panelMateriaPrima');
  const panelProductosTerminados = document.getElementById('panelProductosTerminados');
  const panelProveedores = document.getElementById('panelProveedores');
  const panelTicketsProduccion = document.getElementById('panelTicketsProduccion');
  const tabBtnTicketsProduccion = document.getElementById('tabBtnTicketsProduccion');

  function switchInventoryTab(tabName) {
    tabBtnMateriaPrima?.classList.remove('active');
    tabBtnProductosTerminados?.classList.remove('active');
    tabBtnProveedores?.classList.remove('active');
    tabBtnTicketsProduccion?.classList.remove('active');

    if (panelMateriaPrima) panelMateriaPrima.style.display = 'none';
    if (panelProductosTerminados) panelProductosTerminados.style.display = 'none';
    if (panelProveedores) panelProveedores.style.display = 'none';
    if (panelTicketsProduccion) panelTicketsProduccion.style.display = 'none';

    if (tabName === 'finished') {
      tabBtnProductosTerminados?.classList.add('active');
      if (panelProductosTerminados) panelProductosTerminados.style.display = 'block';
    } else if (tabName === 'suppliers') {
      tabBtnProveedores?.classList.add('active');
      if (panelProveedores) panelProveedores.style.display = 'block';
    } else if (tabName === 'tickets') {
      tabBtnTicketsProduccion?.classList.add('active');
      if (panelTicketsProduccion) panelTicketsProduccion.style.display = 'block';
    } else {
      tabBtnMateriaPrima?.classList.add('active');
      if (panelMateriaPrima) panelMateriaPrima.style.display = 'block';
    }
  }

  tabBtnMateriaPrima?.addEventListener('click', () => switchInventoryTab('raw'));
  tabBtnProductosTerminados?.addEventListener('click', () => switchInventoryTab('finished'));
  tabBtnProveedores?.addEventListener('click', () => switchInventoryTab('suppliers'));
  tabBtnTicketsProduccion?.addEventListener('click', () => switchInventoryTab('tickets'));

  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.dataset.filter || 'todos';
      try { renderMovementsTable(); } catch (e) { console.error(e); }
    });
  });
}

/**
 * 3. Carga y Sincronización de Tasa de Cambio BCV
 */
function cargarTasaCambio() {
  function updateDashboardRateBadge(rate, labelText, isManual) {
    const bcvRateValEl = document.getElementById('bcvRateVal');
    const bcvRateBadge = document.getElementById('bcvRateBadge');

    if (bcvRateValEl) bcvRateValEl.textContent = `Bs. ${rate.toFixed(2)}`;
    if (bcvRateBadge) {
      bcvRateBadge.innerHTML = `<span>🇻🇪 ${labelText}:</span> <strong>Bs. ${rate.toFixed(2)}</strong>`;
      bcvRateBadge.className = isManual ? 'bcv-rate-badge warning' : 'bcv-rate-badge';
    }
  }

  async function resolveDashboardBcvRate() {
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
    if (modoGuardado === 'manual') {
      const tasaManualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
      if (tasaManualVal && tasaManualVal > 0) {
        updateDashboardRateBadge(tasaManualVal, 'Tasa: Manual (Editada)', true);
        return tasaManualVal;
      }
    }

    const apis = [
      'https://ve.dolarapi.com/v1/dolares/oficial',
      'https://bcv-api.vercel.app/api/bcv'
    ];

    for (const url of apis) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const liveRate = parseFloat(data.promedio || data.precio || data.monto || data.rate);
          if (liveRate && liveRate > 0) {
            localStorage.setItem('tasa_auto', liveRate.toString());
            localStorage.setItem('bcv_current_rate', liveRate.toString());
            updateDashboardRateBadge(liveRate, 'Tasa: BCV Oficial (En Vivo)', false);
            return liveRate;
          }
        }
      } catch (e) {
        console.warn(`Error consultando API ${url}:`, e);
      }
    }

    const fallbackRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 784.66;
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

  try {
    BcvRateStore.subscribe((data) => handleRateBroadcast(data));
  } catch (e) {}

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const rateChannel = new BroadcastChannel('lnp_bcv_channel');
      rateChannel.onmessage = (e) => {
        if (e.data) handleRateBroadcast(e.data);
      };
    } catch (e) {}
  }

  window.addEventListener('storage', () => resolveDashboardBcvRate());
  window.addEventListener('bcvRateChanged', (e) => {
    if (e && e.detail) handleRateBroadcast(e.detail);
    else resolveDashboardBcvRate();
  });

  resolveDashboardBcvRate();
}

/**
 * 4. Renderización de KPIs y Gráficos (Chart.js)
 */
function renderizarGraficos() {
  const revenueVal = document.getElementById('kpiRevenueVal');
  const ordersVal = document.getElementById('kpiOrdersVal');
  const ticketVal = document.getElementById('kpiTicketVal');
  const marginVal = document.getElementById('kpiMarginVal');

  if (revenueVal) revenueVal.textContent = `$${DASHBOARD_KPIS.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (ordersVal) ordersVal.textContent = `${DASHBOARD_KPIS.totalOrders} órdenes`;
  if (ticketVal) ticketVal.textContent = `$${DASHBOARD_KPIS.averageTicket.toFixed(2)}`;
  if (marginVal) marginVal.textContent = `${DASHBOARD_KPIS.profitMargin}%`;

  const canvas = document.getElementById('salesTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (salesChartInstance) salesChartInstance.destroy();

  const goldGradient = ctx.createLinearGradient(0, 0, 0, 300);
  goldGradient.addColorStop(0, 'rgba(212, 155, 84, 0.4)');
  goldGradient.addColorStop(1, 'rgba(212, 155, 84, 0.0)');

  const terracottaGradient = ctx.createLinearGradient(0, 0, 0, 300);
  terracottaGradient.addColorStop(0, 'rgba(200, 90, 50, 0.25)');
  terracottaGradient.addColorStop(1, 'rgba(200, 90, 50, 0.0)');

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

/**
 * 5. Carga y Renderizado de Tablas de Inventario y Movimientos
 */
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

    tr.querySelector('.btn-table-action')?.addEventListener('click', () => {
      openMovementDetailModal(mov);
    });

    tbody.appendChild(tr);
  });
}

function openMovementDetailModal(mov) {
  const modal = document.getElementById('modalMovimientoDetalle');
  if (!modal) return;

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

  const codEl = document.getElementById('modalDetalleCodigo');
  const subEl = document.getElementById('modalDetalleSubtitulo');
  if (codEl) codEl.textContent = `Transacción #${mov.code}`;
  if (subEl) subEl.textContent = `Registro Financiero de Operación (${mov.type})`;

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

  const mUsd = document.getElementById('modalMontoUsd');
  const mVes = document.getElementById('modalMontoVes');
  const tOp = document.getElementById('modalTipoOp');
  const resp = document.getElementById('modalResponsable');
  const mPago = document.getElementById('modalMetodoPago');
  const mFec = document.getElementById('modalFecha');
  const mTasa = document.getElementById('modalTasaBcv');

  if (mUsd) mUsd.textContent = amountUsdText;
  if (mVes) mVes.textContent = amountVesText;
  if (tOp) tOp.textContent = mov.type;
  if (resp) resp.textContent = mov.user;
  if (mPago) mPago.textContent = mov.paymentMethod;
  if (mFec) mFec.textContent = mov.timestamp;
  if (mTasa) mTasa.textContent = `Bs. ${activeRate.toFixed(2)} / USD`;

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

function renderInventoryTables() {
  const rawTbody = document.getElementById('materiaPrimaTbody');
  const finishedTbody = document.getElementById('productosTerminadosTbody');
  const suppliersTbody = document.getElementById('proveedoresTbody');

  const searchTerm = (document.getElementById('inventorySearchInput')?.value || '').toLowerCase().trim();
  const filterCat = document.getElementById('inventoryCategoryFilter')?.value || 'todos';

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
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-ingreso-item" data-code="${item.code}" title="Registrar ingreso de mercancía">+ Ingreso</button>
            <button type="button" class="btn-table-action-sm btn-edit-mp" title="Editar materia prima">✏️ Editar</button>
            <button type="button" class="btn-table-action-sm btn-del-mp" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar materia prima">🗑️</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-ingreso-item')?.addEventListener('click', () => openIngresoMercanciaModal(item.code));
      tr.querySelector('.btn-edit-mp')?.addEventListener('click', () => openMateriaPrimaModal(item));
      tr.querySelector('.btn-del-mp')?.addEventListener('click', () => openConfirmEliminarModal(item, 'mp'));

      rawTbody.appendChild(tr);
    });
  }

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
      const isVisiblePos = item.showInPos !== false;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-code-badge">${item.code}</td>
        <td><strong>${item.icon || '🛍️'} ${item.name}</strong></td>
        <td style="color: var(--color-espresso); font-weight: 600;">${item.category}</td>
        <td><span class="table-status-tag" style="background: rgba(0,0,0,0.06); color: var(--color-espresso); font-weight: 700;">${item.unit || 'Und'}</span></td>
        <td style="color: var(--color-muted);">$${(item.unitCost || 0).toFixed(2)} / ${item.unit || 'Und'}</td>
        <td style="font-weight: 700; color: var(--color-gold-dark);">$${(item.salePrice || item.price || 0).toFixed(2)} USD</td>
        <td style="font-weight: 800; font-size: 0.95rem;">${item.stock} ${item.unit || 'Und'}</td>
        <td>
          <span class="table-status-tag ${isVisiblePos ? 'active' : ''}" style="${isVisiblePos ? 'background: rgba(46,125,50,0.1); color: var(--color-success); font-weight: 700;' : 'background: rgba(0,0,0,0.06); color: var(--color-muted);'}">
            ${isVisiblePos ? '🟢 Visible en POS' : '⚪ Oculto en POS'}
          </span>
        </td>
        <td>
          <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
            ${isLow ? `🔴 ALERTA: Stock Bajo (Min: ${item.minStock} ${item.unit || 'Und'})` : `🟢 Normal (Min: ${item.minStock} ${item.unit || 'Und'})`}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-ingreso-item" data-code="${item.code}" title="Registrar ingreso de mercancía">+ Ingreso</button>
            <button type="button" class="btn-table-action-sm btn-edit-pt" title="Editar producto">✏️ Editar</button>
            <button type="button" class="btn-table-action-sm btn-del-pt" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar producto">🗑️</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-ingreso-item')?.addEventListener('click', () => openIngresoMercanciaModal(item.code));
      tr.querySelector('.btn-edit-pt')?.addEventListener('click', () => openProductoTerminadoModal(item));
      tr.querySelector('.btn-del-pt')?.addEventListener('click', () => openConfirmEliminarModal(item, 'pt'));

      finishedTbody.appendChild(tr);
    });
  }

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

      tr.querySelector('.btn-edit-prov')?.addEventListener('click', () => openProveedorModal(prov));
      tr.querySelector('.btn-del-prov')?.addEventListener('click', () => openConfirmEliminarModal(prov, 'prov'));

      suppliersTbody.appendChild(tr);
    });
  }
}

function cargarInventario() {
  renderMovementsTable();
  renderInventoryTables();
}

/**
 * 6. Inicialización de Botones Generales, Buscadores y Modales de Acción
 */
function inicializarBotonesGenerales() {
  document.getElementById('inventorySearchInput')?.addEventListener('input', renderInventoryTables);
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', renderInventoryTables);

  document.getElementById('btnExportReport')?.addEventListener('click', () => {
    alert('Generando Reporte Ejecutivo PDF/Excel para La Nueva Parisienne...');
  });

  // Modal Ingreso Mercancía
  const modalIngresoMercancia = document.getElementById('modalIngresoMercancia');
  const btnOpenIngresoMercanciaModal = document.getElementById('btnOpenIngresoMercanciaModal');
  const closeIngresoMercanciaModalBtn = document.getElementById('closeIngresoMercanciaModalBtn');
  const cancelIngresoMercanciaBtn = document.getElementById('cancelIngresoMercanciaBtn');
  const ingresoMercanciaForm = document.getElementById('ingresoMercanciaForm');
  const modalIngresoProductoSelect = document.getElementById('modalIngresoProductoSelect');

  btnOpenIngresoMercanciaModal?.addEventListener('click', () => openIngresoMercanciaModal());
  closeIngresoMercanciaModalBtn?.addEventListener('click', closeIngresoMercanciaModal);
  cancelIngresoMercanciaBtn?.addEventListener('click', closeIngresoMercanciaModal);

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

  ingresoMercanciaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedCode = modalIngresoProductoSelect?.value;
    const qty = parseFloat(modalIngresoCantidad?.value || 0);
    const selectedUom = document.getElementById('modalIngresoUnidad')?.value || 'Und';
    const totalCost = parseFloat(modalIngresoCostoTotal?.value || 0);
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

    saveRawMaterialsToStorage(rawMaterialsData);
    savePosCatalogToStorage(finishedGoodsData);
    renderInventoryTables();
    closeIngresoMercanciaModal();
    showSuccessModal('¡Ingreso Registrado!', `Se sumaron +${qty} ${selectedUom} a "${targetItem ? targetItem.name : selectedCode}" de Factura N°: ${numFactura}.`);
  });

  // Modal Proveedores
  const modalProveedor = document.getElementById('modalProveedor');
  const btnOpenProveedorModalHeader = document.getElementById('btnOpenProveedorModalHeader');
  const closeProveedorModalBtn = document.getElementById('closeProveedorModalBtn');
  const cancelProveedorBtn = document.getElementById('cancelProveedorBtn');
  const proveedorForm = document.getElementById('proveedorForm');

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
      const existing = suppliersData.find(p => p.code === code);
      if (existing) {
        existing.name = name;
        existing.rif = rif;
        existing.phone = phone;
        existing.contact = contact;
        existing.address = address;
      }
    } else {
      const newCode = `PROV-${String(suppliersData.length + 1).padStart(3, '0')}`;
      suppliersData.push({ code: newCode, name, icon: '🏬', rif, phone, contact, address });
    }

    saveSuppliersToStorage(suppliersData);
    renderInventoryTables();
    closeProveedorModal();
    showSuccessModal('¡Proveedor Guardado!', `Información del proveedor "${name}" (${rif}) guardada con éxito.`);
  });

  // Modal Materia Prima
  const modalMateriaPrima = document.getElementById('modalMateriaPrima');
  const btnOpenNuevaMateriaPrimaModal = document.getElementById('btnOpenNuevaMateriaPrimaModal');
  const closeMpModalBtn = document.getElementById('closeMpModalBtn');
  const cancelMpBtn = document.getElementById('cancelMpBtn');
  const materiaPrimaForm = document.getElementById('materiaPrimaForm');

  btnOpenNuevaMateriaPrimaModal?.addEventListener('click', () => openMateriaPrimaModal());
  closeMpModalBtn?.addEventListener('click', closeMateriaPrimaModal);
  cancelMpBtn?.addEventListener('click', closeMateriaPrimaModal);

  materiaPrimaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('modalMpCode')?.value;
    const name = document.getElementById('modalMpNombre')?.value?.trim();
    const category = document.getElementById('modalMpCategoria')?.value;
    const unit = document.getElementById('modalMpUnidad')?.value;
    const unitCost = parseFloat(document.getElementById('modalMpCostoUnitario')?.value || 0);
    const stock = parseFloat(document.getElementById('modalMpStockInicial')?.value || 0);
    const minStock = parseFloat(document.getElementById('modalMpStockMinimo')?.value || 0);

    if (!name || unitCost <= 0) return;

    if (code) {
      const existing = rawMaterialsData.find(m => m.code === code);
      if (existing) {
        existing.name = name;
        existing.category = category;
        existing.unit = unit;
        existing.unitCost = unitCost;
        existing.stock = stock;
        existing.minStock = minStock;
      }
    } else {
      const newCode = `MAT-${String(rawMaterialsData.length + 1).padStart(3, '0')}`;
      rawMaterialsData.push({ code: newCode, name, icon: '🌾', category, unitCost, unit, stock, minStock });
    }

    saveRawMaterialsToStorage(rawMaterialsData);
    renderInventoryTables();
    closeMateriaPrimaModal();
    showSuccessModal('¡Materia Prima Guardada!', `Materia prima "${name}" guardada con éxito en el catálogo.`);
  });

  // Modal Producto Terminado
  const modalProductoTerminado = document.getElementById('modalProductoTerminado');
  const btnOpenNuevoProductoTerminadoModal = document.getElementById('btnOpenNuevoProductoTerminadoModal');
  const closePtModalBtn = document.getElementById('closePtModalBtn');
  const cancelPtBtn = document.getElementById('cancelPtBtn');
  const productoTerminadoForm = document.getElementById('productoTerminadoForm');

  btnOpenNuevoProductoTerminadoModal?.addEventListener('click', () => openProductoTerminadoModal());
  closePtModalBtn?.addEventListener('click', closeProductoTerminadoModal);
  cancelPtBtn?.addEventListener('click', closeProductoTerminadoModal);

  productoTerminadoForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('modalPtCode')?.value;
    const name = document.getElementById('modalPtNombre')?.value?.trim();
    const category = document.getElementById('modalPtCategoria')?.value;
    const unit = document.getElementById('modalPtUnidad')?.value;
    const unitCost = parseFloat(document.getElementById('modalPtCostoUnitario')?.value || 0);
    const salePrice = parseFloat(document.getElementById('modalPtPrecioVenta')?.value || 0);
    const stock = parseFloat(document.getElementById('modalPtStockInicial')?.value || 0);
    const minStock = parseFloat(document.getElementById('modalPtStockMinimo')?.value || 0);
    const showInPos = Boolean(document.getElementById('modalPtShowInPos')?.checked);

    if (!name || salePrice <= 0) return;

    if (code) {
      const existing = finishedGoodsData.find(p => p.code === code);
      if (existing) {
        existing.name = name;
        existing.category = category;
        existing.unit = unit;
        existing.unitCost = unitCost;
        existing.salePrice = salePrice;
        existing.price = salePrice;
        existing.stock = stock;
        existing.minStock = minStock;
        existing.showInPos = showInPos;
      }
    } else {
      const newCode = `PROD-${String(finishedGoodsData.length + 1).padStart(3, '0')}`;
      finishedGoodsData.push({
        id: `prod_${String(finishedGoodsData.length + 1).padStart(3, '0')}`,
        code: newCode,
        name: name,
        icon: category === 'Panadería' ? '🥖' : category === 'Pastelería' ? '🍰' : category === 'Bebidas' ? '☕' : '🥪',
        category: category,
        unitCost: unitCost,
        salePrice: salePrice,
        price: salePrice,
        unit: unit,
        stock: stock,
        minStock: minStock,
        showInPos: showInPos
      });
    }

    savePosCatalogToStorage(finishedGoodsData);
    renderInventoryTables();
    closeProductoTerminadoModal();
    showSuccessModal('¡Producto Sincronizado!', `Producto "${name}" guardado y sincronizado con la Caja POS.`);
  });

  // Modal Confirmar Eliminar
  const modalConfirmEliminar = document.getElementById('modalConfirmEliminar');
  const closeConfirmEliminarModalBtn = document.getElementById('closeConfirmEliminarModalBtn');
  const cancelConfirmEliminarBtn = document.getElementById('cancelConfirmEliminarBtn');
  const executeConfirmEliminarBtn = document.getElementById('executeConfirmEliminarBtn');
  const confirmEliminarPassword = document.getElementById('confirmEliminarPassword');
  const confirmEliminarErrorMsg = document.getElementById('confirmEliminarErrorMsg');

  closeConfirmEliminarModalBtn?.addEventListener('click', closeConfirmEliminarModal);
  cancelConfirmEliminarBtn?.addEventListener('click', closeConfirmEliminarModal);

  executeConfirmEliminarBtn?.addEventListener('click', () => {
    if (!pendingDeleteTarget) return;

    const enteredPass = (confirmEliminarPassword?.value || '').trim();
    if (!enteredPass || !VALID_MANAGER_PASSWORDS.includes(enteredPass)) {
      if (confirmEliminarErrorMsg) {
        confirmEliminarErrorMsg.style.display = 'block';
        confirmEliminarErrorMsg.textContent = '❌ Contraseña gerencial incorrecta. Permiso denegado.';
      }
      confirmEliminarPassword?.focus();
      return;
    }

    const { item, type } = pendingDeleteTarget;
    if (type === 'mp') {
      rawMaterialsData = rawMaterialsData.filter(m => m.code !== item.code);
      saveRawMaterialsToStorage(rawMaterialsData);
    } else if (type === 'pt') {
      finishedGoodsData = finishedGoodsData.filter(p => p.code !== item.code);
      savePosCatalogToStorage(finishedGoodsData);
    } else if (type === 'prov') {
      suppliersData = suppliersData.filter(prov => prov.code !== item.code);
      saveSuppliersToStorage(suppliersData);
    }

    renderInventoryTables();
    closeConfirmEliminarModal();
    showSuccessModal('¡Autorización Aprobada!', `El ítem "${item.name}" (${item.code}) ha sido eliminado permanentemente por la Gerencia General.`);
  });

  // Modales de detalle y notificaciones
  document.getElementById('btnCerrarModalDetalle')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('btnCerrarModalDetalleFooter')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('modalMovimientoDetalle')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalMovimientoDetalle') closeMovementDetailModal();
  });

  document.getElementById('btnImprimirComprobante')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btnCopiarRef')?.addEventListener('click', () => {
    const rawCod = document.getElementById('modalDetalleCodigo')?.textContent || '';
    const cleanCod = rawCod.replace('Transacción #', '').trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanCod).then(() => {
        showSuccessModal('¡Referencia Copiada!', `El código "${cleanCod}" fue copiado exitosamente al portapapeles.`);
      }).catch(() => {
        showSuccessModal('¡Referencia Copiada!', `Código de referencia: ${cleanCod}`);
      });
    } else {
      showSuccessModal('¡Referencia Copiada!', `Código de referencia: ${cleanCod}`);
    }
  });

  document.getElementById('closeExitoModalBtn')?.addEventListener('click', closeSuccessModal);

  // Overlay click backdrop listeners
  window.addEventListener('click', (e) => {
    if (e.target === modalIngresoMercancia) closeIngresoMercanciaModal();
    if (e.target === modalProveedor) closeProveedorModal();
    if (e.target === modalMateriaPrima) closeMateriaPrimaModal();
    if (e.target === modalProductoTerminado) closeProductoTerminadoModal();
    if (e.target === modalConfirmEliminar) closeConfirmEliminarModal();
    if (e.target === document.getElementById('modalExitoNotificacion')) closeSuccessModal();
  });
}

function openIngresoMercanciaModal(preselectCode = null) {
  const modalIngresoProductoSelect = document.getElementById('modalIngresoProductoSelect');
  const modalIngresoMercancia = document.getElementById('modalIngresoMercancia');

  if (modalIngresoProductoSelect) {
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

    if (preselectCode) modalIngresoProductoSelect.value = preselectCode;
  }

  if (modalIngresoMercancia) {
    modalIngresoMercancia.style.display = 'flex';
    modalIngresoMercancia.setAttribute('aria-hidden', 'false');
  }
}

function closeIngresoMercanciaModal() {
  const modalIngresoMercancia = document.getElementById('modalIngresoMercancia');
  const ingresoMercanciaForm = document.getElementById('ingresoMercanciaForm');
  const costoUnitarioPreviewVal = document.getElementById('costoUnitarioPreviewVal');

  if (modalIngresoMercancia) {
    modalIngresoMercancia.style.display = 'none';
    modalIngresoMercancia.setAttribute('aria-hidden', 'true');
    ingresoMercanciaForm?.reset();
    if (costoUnitarioPreviewVal) costoUnitarioPreviewVal.textContent = '$0.00 / unidad';
  }
}

function openProveedorModal(provToEdit = null) {
  const modalProveedor = document.getElementById('modalProveedor');
  const modalProveedorTitle = document.getElementById('modalProveedorTitle');
  const proveedorForm = document.getElementById('proveedorForm');

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
  const modalProveedor = document.getElementById('modalProveedor');
  const proveedorForm = document.getElementById('proveedorForm');
  if (modalProveedor) {
    modalProveedor.style.display = 'none';
    modalProveedor.setAttribute('aria-hidden', 'true');
    proveedorForm?.reset();
  }
}

function openMateriaPrimaModal(itemToEdit = null) {
  const modalMateriaPrima = document.getElementById('modalMateriaPrima');
  const modalMpTitle = document.getElementById('modalMpTitle');
  const materiaPrimaForm = document.getElementById('materiaPrimaForm');

  if (itemToEdit) {
    if (modalMpTitle) modalMpTitle.textContent = 'Editar Materia Prima';
    document.getElementById('modalMpCode').value = itemToEdit.code;
    document.getElementById('modalMpNombre').value = itemToEdit.name;
    document.getElementById('modalMpCategoria').value = itemToEdit.category;
    document.getElementById('modalMpUnidad').value = itemToEdit.unit;
    document.getElementById('modalMpCostoUnitario').value = itemToEdit.unitCost;
    document.getElementById('modalMpStockInicial').value = itemToEdit.stock;
    document.getElementById('modalMpStockMinimo').value = itemToEdit.minStock;
  } else {
    if (modalMpTitle) modalMpTitle.textContent = 'Crear Nueva Materia Prima';
    materiaPrimaForm?.reset();
    document.getElementById('modalMpCode').value = '';
  }

  if (modalMateriaPrima) {
    modalMateriaPrima.style.display = 'flex';
    modalMateriaPrima.setAttribute('aria-hidden', 'false');
  }
}

function closeMateriaPrimaModal() {
  const modalMateriaPrima = document.getElementById('modalMateriaPrima');
  const materiaPrimaForm = document.getElementById('materiaPrimaForm');
  if (modalMateriaPrima) {
    modalMateriaPrima.style.display = 'none';
    modalMateriaPrima.setAttribute('aria-hidden', 'true');
    materiaPrimaForm?.reset();
  }
}

function openProductoTerminadoModal(itemToEdit = null) {
  const modalProductoTerminado = document.getElementById('modalProductoTerminado');
  const modalPtTitle = document.getElementById('modalPtTitle');
  const productoTerminadoForm = document.getElementById('productoTerminadoForm');
  const showInPosCheckbox = document.getElementById('modalPtShowInPos');

  if (itemToEdit) {
    if (modalPtTitle) modalPtTitle.textContent = 'Editar Producto Terminado';
    document.getElementById('modalPtCode').value = itemToEdit.code;
    document.getElementById('modalPtNombre').value = itemToEdit.name;
    document.getElementById('modalPtCategoria').value = itemToEdit.category;
    document.getElementById('modalPtUnidad').value = itemToEdit.unit || 'Und';
    document.getElementById('modalPtCostoUnitario').value = itemToEdit.unitCost;
    document.getElementById('modalPtPrecioVenta').value = itemToEdit.salePrice || itemToEdit.price;
    document.getElementById('modalPtStockInicial').value = itemToEdit.stock;
    document.getElementById('modalPtStockMinimo').value = itemToEdit.minStock;
    if (showInPosCheckbox) showInPosCheckbox.checked = itemToEdit.showInPos !== false;
  } else {
    if (modalPtTitle) modalPtTitle.textContent = 'Crear Nuevo Producto Terminado';
    productoTerminadoForm?.reset();
    document.getElementById('modalPtCode').value = '';
    if (showInPosCheckbox) showInPosCheckbox.checked = true;
  }

  if (modalProductoTerminado) {
    modalProductoTerminado.style.display = 'flex';
    modalProductoTerminado.setAttribute('aria-hidden', 'false');
  }
}

function closeProductoTerminadoModal() {
  const modalProductoTerminado = document.getElementById('modalProductoTerminado');
  const productoTerminadoForm = document.getElementById('productoTerminadoForm');
  if (modalProductoTerminado) {
    modalProductoTerminado.style.display = 'none';
    modalProductoTerminado.setAttribute('aria-hidden', 'true');
    productoTerminadoForm?.reset();
  }
}

function openConfirmEliminarModal(item, type) {
  pendingDeleteTarget = { item, type };
  const modalConfirmEliminar = document.getElementById('modalConfirmEliminar');
  const confirmEliminarItemName = document.getElementById('confirmEliminarItemName');
  const confirmEliminarItemCode = document.getElementById('confirmEliminarItemCode');
  const confirmEliminarPassword = document.getElementById('confirmEliminarPassword');
  const confirmEliminarErrorMsg = document.getElementById('confirmEliminarErrorMsg');

  if (confirmEliminarItemName) confirmEliminarItemName.textContent = `${item.icon || ''} ${item.name}`;
  if (confirmEliminarItemCode) confirmEliminarItemCode.textContent = `Código / ID: ${item.code} ${item.rif ? `| RIF: ${item.rif}` : ''}`;
  if (confirmEliminarPassword) confirmEliminarPassword.value = '';
  if (confirmEliminarErrorMsg) confirmEliminarErrorMsg.style.display = 'none';

  if (modalConfirmEliminar) {
    modalConfirmEliminar.style.display = 'flex';
    modalConfirmEliminar.setAttribute('aria-hidden', 'false');
    setTimeout(() => confirmEliminarPassword?.focus(), 100);
  }
}

function closeConfirmEliminarModal() {
  const modalConfirmEliminar = document.getElementById('modalConfirmEliminar');
  const confirmEliminarPassword = document.getElementById('confirmEliminarPassword');
  const confirmEliminarErrorMsg = document.getElementById('confirmEliminarErrorMsg');

  if (modalConfirmEliminar) {
    modalConfirmEliminar.style.display = 'none';
    modalConfirmEliminar.setAttribute('aria-hidden', 'true');
    if (confirmEliminarPassword) confirmEliminarPassword.value = '';
    if (confirmEliminarErrorMsg) confirmEliminarErrorMsg.style.display = 'none';
    pendingDeleteTarget = null;
  }
}

function inicializarTicketsProduccionGerencia() {
  try {
    const DEFAULT_TICKETS = [
      {
        id: 'REQ-001',
        date: '24/08/2026 14:30',
        baker: 'Jean-Luc Dubois',
        itemCode: 'MAT-001',
        itemName: 'Harina de Trigo Todo Uso',
        qty: 50,
        unit: 'kg',
        notes: 'Amasado urgente de baguettes para el turno tarde.',
        status: 'Pendiente',
        reason: ''
      },
      {
        id: 'REQ-002',
        date: '24/08/2026 11:15',
        baker: 'Jean-Luc Dubois',
        itemCode: 'MAT-002',
        itemName: 'Mantequilla Sin Sal 82%',
        qty: 15,
        unit: 'kg',
        notes: 'Para lamine de masa hojaldrada de Croissants.',
        status: 'Aprobado',
        reason: 'Aprobado por Gerencia General'
      },
      {
        id: 'REQ-003',
        date: '24/08/2026 09:00',
        baker: 'Jean-Luc Dubois',
        itemCode: 'MAT-003',
        itemName: 'Azúcar Refinada Extra',
        qty: 100,
        unit: 'kg',
        notes: 'Reserva para pastelería y brioches.',
        status: 'Rechazado',
        reason: 'Excede límite por turno. Solicitar máx 25 kg.'
      }
    ];

    function getTicketsFromStorage() {
      try {
        const raw = localStorage.getItem('tickets_requisicion');
        if (!raw) {
          localStorage.setItem('tickets_requisicion', JSON.stringify(DEFAULT_TICKETS));
          return DEFAULT_TICKETS;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : DEFAULT_TICKETS;
      } catch (e) {
        console.warn('Error leyendo tickets_requisicion:', e);
        return DEFAULT_TICKETS;
      }
    }

    function saveTicketsToStorage(tickets) {
      try {
        localStorage.setItem('tickets_requisicion', JSON.stringify(tickets));
        window.dispatchEvent(new CustomEvent('ticketsUpdated'));
      } catch (e) {
        console.error('Error guardando tickets_requisicion:', e);
      }
    }

    function renderTicketsTable() {
      const tbody = document.getElementById('ticketsProduccionTbody');
      const badgeCount = document.getElementById('badgeTicketsProduccionCount');
      if (!tbody) return;

      const tickets = getTicketsFromStorage();
      const pendingCount = tickets.filter(t => t.status === 'Pendiente').length;

      if (badgeCount) {
        badgeCount.textContent = pendingCount;
        badgeCount.style.background = pendingCount > 0 ? 'var(--color-terracotta)' : 'rgba(0,0,0,0.15)';
      }

      tbody.innerHTML = '';
      if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">No hay tickets de requisición registrados.</td></tr>`;
        return;
      }

    function getActiveManagerInfo() {
      try {
        const raw = localStorage.getItem('usuario_activo');
        if (raw) {
          const u = JSON.parse(raw);
          if (u && (u.nombre || u.name)) {
            const name = u.nombre || u.name;
            const username = u.username || u.usuario || '';
            return username ? `${name} (@${username})` : name;
          }
        }
      } catch (e) {}
      return 'Juan Mendoza (@jmendoza)';
    }

    function getFormattedTimestamp() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    }

    function renderTicketsTable() {
      const tbody = document.getElementById('ticketsProduccionTbody');
      const badgeCount = document.getElementById('badgeTicketsProduccionCount');
      if (!tbody) return;

      const tickets = getTicketsFromStorage();
      const pendingCount = tickets.filter(t => t.status === 'Pendiente').length;

      if (badgeCount) {
        badgeCount.textContent = pendingCount;
        badgeCount.style.background = pendingCount > 0 ? 'var(--color-terracotta)' : 'rgba(0,0,0,0.15)';
      }

      tbody.innerHTML = '';
      if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">No hay tickets de requisición registrados.</td></tr>`;
        return;
      }

      tickets.forEach(ticket => {
        const tr = document.createElement('tr');
        
        let statusTag = `<span class="badge-stock-normal" style="background: rgba(255,152,0,0.15); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;">🟡 Pendiente</span>`;
        if (ticket.status === 'Aprobado') {
          statusTag = `<span class="badge-stock-normal" style="background: rgba(46,125,50,0.15); color: var(--color-success); border: 1px solid rgba(46,125,50,0.3); font-weight: 700;">🟢 Aprobado</span>`;
        } else if (ticket.status === 'Rechazado') {
          statusTag = `<span class="badge-stock-normal" style="background: rgba(198,40,40,0.15); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); font-weight: 700;">🔴 Rechazado</span>`;
        }

        let actionBtns = '';
        if (ticket.status === 'Pendiente') {
          actionBtns = `
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn-table-action-sm btn-approve-ticket" style="background: rgba(46,125,50,0.12); color: var(--color-success); border-color: rgba(46,125,50,0.3); font-weight: 700;" title="Aprobar despacho">✅ Aprobar</button>
              <button type="button" class="btn-table-action-sm btn-reject-ticket" style="background: rgba(198,40,40,0.12); color: var(--color-danger); border-color: rgba(198,40,40,0.3); font-weight: 700;" title="Rechazar solicitud">❌ Rechazar</button>
            </div>
          `;
        } else if (ticket.status === 'Aprobado') {
          actionBtns = `
            <div style="font-size: 0.8rem; color: var(--color-success); font-weight: 600; line-height: 1.3;">
              <span>✅ Aprobado por <strong>${ticket.processedBy || 'Gerencia'}</strong></span><br/>
              <span style="font-size: 0.75rem; color: var(--color-muted); font-weight: 400;">⏱️ ${ticket.processedAt || ticket.date}</span>
            </div>
          `;
        } else if (ticket.status === 'Rechazado') {
          actionBtns = `
            <div style="font-size: 0.8rem; color: var(--color-danger); font-weight: 600; line-height: 1.3;">
              <span>❌ Rechazado por <strong>${ticket.processedBy || 'Gerencia'}</strong></span><br/>
              <span style="font-size: 0.75rem; color: var(--color-muted); font-weight: 400;">⏱️ ${ticket.processedAt || ticket.date} — ${ticket.reason || ''}</span>
            </div>
          `;
        }

        tr.innerHTML = `
          <td><span class="table-code-badge" style="font-weight: 800;">${ticket.id}</span></td>
          <td style="font-size: 0.85rem;">${ticket.date}</td>
          <td><strong>👨‍🍳 ${ticket.baker}</strong></td>
          <td><strong>${ticket.itemName}</strong></td>
          <td><strong style="color: var(--color-gold-dark);">${ticket.qty} ${ticket.unit}</strong></td>
          <td style="font-size: 0.85rem; color: var(--color-muted);">${ticket.notes || '-'}</td>
          <td>${statusTag}</td>
          <td>${actionBtns}</td>
        `;

        if (ticket.status === 'Pendiente') {
          tr.querySelector('.btn-approve-ticket')?.addEventListener('click', () => aprovarTicket(ticket.id));
          tr.querySelector('.btn-reject-ticket')?.addEventListener('click', () => abrirModalRechazar(ticket.id));
        }

        tbody.appendChild(tr);
      });
    }

    function aprovarTicket(ticketId) {
      const tickets = getTicketsFromStorage();
      const target = tickets.find(t => t.id === ticketId);
      if (!target) return;

      const managerInfo = getActiveManagerInfo();
      const timestamp = getFormattedTimestamp();

      target.status = 'Aprobado';
      target.processedBy = managerInfo;
      target.processedAt = timestamp;
      target.reason = `Aprobado por ${managerInfo} a las ${timestamp}`;

      const rawMaterials = getRawMaterialsFromStorage();
      const mat = rawMaterials.find(m => m.code === target.itemCode || m.name === target.itemName);
      if (mat) {
        mat.stock = Math.max(0, mat.stock - target.qty);
        saveRawMaterialsToStorage(rawMaterials);
        renderInventoryTables();
      }

      saveTicketsToStorage(tickets);
      renderTicketsTable();
      showSuccessModal('¡Requisición Aprobada!', `Se autorizó el despacho por ${managerInfo} (${timestamp}) para ${target.qty} ${target.unit} de "${target.itemName}".`);
    }

    const modalRechazarTicket = document.getElementById('modalRechazarTicket');
    const closeRechazarTicketModalBtn = document.getElementById('closeRechazarTicketModalBtn');
    const cancelRechazarTicketBtn = document.getElementById('cancelRechazarTicketBtn');
    const rechazarTicketForm = document.getElementById('rechazarTicketForm');

    function abrirModalRechazar(ticketId) {
      document.getElementById('rechazarTicketId').value = ticketId;
      document.getElementById('motivoRechazarInput').value = '';
      if (modalRechazarTicket) {
        modalRechazarTicket.style.display = 'flex';
        modalRechazarTicket.setAttribute('aria-hidden', 'false');
      }
    }

    function cerrarModalRechazar() {
      if (modalRechazarTicket) {
        modalRechazarTicket.style.display = 'none';
        modalRechazarTicket.setAttribute('aria-hidden', 'true');
        rechazarTicketForm?.reset();
      }
    }

    closeRechazarTicketModalBtn?.addEventListener('click', cerrarModalRechazar);
    cancelRechazarTicketBtn?.addEventListener('click', cerrarModalRechazar);
    modalRechazarTicket?.addEventListener('click', (e) => {
      if (e.target === modalRechazarTicket) cerrarModalRechazar();
    });

    rechazarTicketForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticketId = document.getElementById('rechazarTicketId')?.value;
      const motivo = document.getElementById('motivoRechazarInput')?.value?.trim();
      if (!ticketId || !motivo) return;

      const tickets = getTicketsFromStorage();
      const target = tickets.find(t => t.id === ticketId);
      if (!target) return;

      const managerInfo = getActiveManagerInfo();
      const timestamp = getFormattedTimestamp();

      target.status = 'Rechazado';
      target.processedBy = managerInfo;
      target.processedAt = timestamp;
      target.reason = motivo;

      saveTicketsToStorage(tickets);
      renderTicketsTable();
      cerrarModalRechazar();
      showSuccessModal('Ticket Rechazado', `Se registró el rechazo por ${managerInfo} (${timestamp}). Motivo: "${motivo}".`);
    });

    renderTicketsTable();
    window.addEventListener('ticketsUpdated', renderTicketsTable);
    window.addEventListener('storage', (e) => {
      if (e.key === 'tickets_requisicion') renderTicketsTable();
    });
  } catch (err) {
    console.error('Error inicializando tickets de producción en Gerencia:', err);
  }
}

// ==========================================================================
// 4. INICIALIZACIÓN DOMCONTENTLOADED CON AISLAMIENTO DE FALLOS STRICTO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  try { inicializarSesionYBarraSuperior(); } catch (e) { console.error('Error Sesión & Header:', e); }
  try { inicializarNavegacionTabs(); } catch (e) { console.error('Error Tabs:', e); }
  try { cargarTasaCambio(); } catch (e) { console.error('Error Tasa:', e); }
  try { renderizarGraficos(); } catch (e) { console.error('Error Graficos:', e); }
  try { cargarInventario(); } catch (e) { console.error('Error Inventario:', e); }
  try { inicializarTicketsProduccionGerencia(); } catch (e) { console.error('Error Tickets Producción:', e); }
  try { inicializarBotonesGenerales(); } catch (e) { console.error('Error Botones:', e); }
});
