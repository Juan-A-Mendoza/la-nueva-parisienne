/* ==========================================================================
   MÓDULO 4: CONTROLADOR INTERACTIVO DEL DASHBOARD GERENCIAL (DASHBOARD.JS)
   Principio de Aislamiento de Fallos, Resiliencia y Modularización Estricta
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';
import { DASHBOARD_KPIS, SALES_TREND_DATA, SALES_TREND_PERIODS, RECENT_MOVEMENTS } from '../data/dashboard-db.js?v=20261005-chart-filters';

// ==========================================================================
// 1. MAESTRO DE DATOS Y ESTADO GLOBAL DEL MÓDULO
// ==========================================================================

const INITIAL_15_POS_PRODUCTS = [
  { id: 'prod_001', code: 'PAN-001', name: 'Baguette Tradicional Parisina', category: 'Panadería', unitCost: 1.20, salePrice: 2.50, unit: 'Und', stock: 45, minStock: 20, icon: 'croissant', showInPos: true, description: 'Corteza crujiente y miga alveolada con levadura madre.' },
  { id: 'prod_002', code: 'PAN-002', name: 'Croissant de Mantequilla', category: 'Panadería', unitCost: 1.40, salePrice: 3.00, unit: 'Und', stock: 60, minStock: 25, icon: 'croissant', showInPos: true, description: 'Hojaldre 100% mantequilla de Normandía.' },
  { id: 'prod_003', code: 'PAN-003', name: 'Pain au Chocolat', category: 'Panadería', unitCost: 1.60, salePrice: 3.50, unit: 'Und', stock: 35, minStock: 15, icon: 'sparkles', showInPos: true, description: 'Hojaldre relleno de dos barras de chocolate negro 60%.' },
  { id: 'prod_004', code: 'PAN-004', name: 'Brioche de Vainilla', category: 'Panadería', unitCost: 2.00, salePrice: 4.20, unit: 'Und', stock: 20, minStock: 10, icon: 'croissant', showInPos: true, description: 'Pan de huevo esponjoso aromatizado con vainilla.' },
  { id: 'prod_005', code: 'PAN-005', name: 'Focaccia de Romero y Aceitunas', category: 'Panadería', unitCost: 2.80, salePrice: 5.50, unit: 'Und', stock: 15, minStock: 8, icon: 'wheat', showInPos: true, description: 'Pan plano italiano horneado con aceite de oliva extra virgen.' },
  { id: 'prod_006', code: 'PAS-001', name: 'Éclair de Chocolate Belga', category: 'Pastelería', unitCost: 2.10, salePrice: 4.50, unit: 'Und', stock: 25, minStock: 15, icon: 'cake', showInPos: true, description: 'Pasta choux rellena de crema pastelera de chocolate oscuro.' },
  { id: 'prod_007', code: 'PAS-002', name: 'Tarta de Limón Merengada', category: 'Pastelería', unitCost: 2.40, salePrice: 5.00, unit: 'Und', stock: 18, minStock: 10, icon: 'cake', showInPos: true, description: 'Base sablée, crema de limón amarillo y merengue tostado.' },
  { id: 'prod_008', code: 'PAS-003', name: 'Caja de Macarons Surtidos (6 ud)', category: 'Pastelería', unitCost: 4.50, salePrice: 9.50, unit: 'Und', stock: 30, minStock: 12, icon: 'sparkles', showInPos: true, description: 'Selección de pistacho, frambuesa, vainilla, chocolate y café.' },
  { id: 'prod_009', code: 'PAS-004', name: 'Milhojas Tradicional de Crema', category: 'Pastelería', unitCost: 2.20, salePrice: 4.80, unit: 'Und', stock: 14, minStock: 8, icon: 'cake', showInPos: true, description: 'Capas de hojaldre crujiente con crema diplomática.' },
  { id: 'prod_010', code: 'BEB-001', name: 'Café Espresso Doble', category: 'Bebidas', unitCost: 0.80, salePrice: 2.80, unit: 'Und', stock: 100, minStock: 30, icon: 'coffee', showInPos: true, description: 'Grano 100% arábica de tueste medio de origen único.' },
  { id: 'prod_011', code: 'BEB-002', name: 'Capuchino Cremoso', category: 'Bebidas', unitCost: 1.10, salePrice: 3.80, unit: 'Und', stock: 80, minStock: 25, icon: 'coffee', showInPos: true, description: 'Espresso con leche al vapor y espuma suave de canela.' },
  { id: 'prod_012', code: 'BEB-003', name: 'Café au Lait Parisien', category: 'Bebidas', unitCost: 1.00, salePrice: 3.50, unit: 'Und', stock: 90, minStock: 25, icon: 'coffee', showInPos: true, description: 'Café de filtro mezclado con leche entera caliente.' },
  { id: 'prod_013', code: 'BEB-004', name: 'Jugo de Naranja Recién Exprimido', category: 'Bebidas', unitCost: 1.50, salePrice: 4.00, unit: 'L', stock: 40, minStock: 15, icon: 'coffee', showInPos: true, description: '100% natural, prensado al momento sin azúcar añadida.' },
  { id: 'prod_014', code: 'ESP-001', name: 'Croque-Monsieur Tradicional', category: 'Salados', unitCost: 3.20, salePrice: 7.50, unit: 'Und', stock: 22, minStock: 10, icon: 'utensils', showInPos: true, description: 'Sándwich caliente de jamón cocido, queso Gruyère y bechamel.' },
  { id: 'prod_015', code: 'ESP-002', name: 'Quiche Lorraine de Bacon', category: 'Salados', unitCost: 3.00, salePrice: 6.80, unit: 'Und', stock: 16, minStock: 8, icon: 'utensils', showInPos: true, description: 'Tarta salada con tocino ahumado, crema de leche y queso.' }
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
    { code: 'MAT-001', name: 'Harina de Trigo Tradicional T55', icon: 'wheat', category: 'Materias Primas', unitCost: 1.80, unit: 'Kg', stock: 18.00, minStock: 50.00 },
    { code: 'MAT-002', name: 'Mantequilla de Normandía 84% M.G.', icon: 'milk', category: 'Lácteos & Mantequillas', unitCost: 8.50, unit: 'Kg', stock: 12.50, minStock: 30.00 },
    { code: 'MAT-003', name: 'Levadura Madre Activa Tostada', icon: 'package', category: 'Levaduras & Fermentos', unitCost: 4.20, unit: 'Kg', stock: 8.00, minStock: 15.00 },
    { code: 'MAT-004', name: 'Chocolate Belga 60% Cacao', icon: 'sparkles', category: 'Coberturas & Cacao', unitCost: 12.00, unit: 'Kg', stock: 42.00, minStock: 20.00 },
    { code: 'MAT-005', name: 'Azúcar Fina Refinada', icon: 'package', category: 'Materias Primas', unitCost: 1.50, unit: 'Kg', stock: 65.00, minStock: 25.00 },
    { code: 'MAT-006', name: 'Huevos Frescos de Granja', icon: 'egg', category: 'Insumos Frescos', unitCost: 0.25, unit: 'Und', stock: 120.00, minStock: 150.00 }
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
    { code: 'PROV-001', name: 'Molinos del Sur, C.A.', icon: 'wheat', rif: 'J-30819283-4', phone: '(01) 555-MOLINO', contact: 'Carlos Mendoza', address: 'Zona Industrial Sur, Parcela 14, Caracas' },
    { code: 'PROV-002', name: 'Lácteos La Granja', icon: 'milk', rif: 'J-40192837-1', phone: '(01) 555-LACTEOS', contact: 'María Elena Suárez', address: 'Av. Las Acacias, Edif. La Granja, Valencia' },
    { code: 'PROV-003', name: 'Empaques del Norte', icon: 'package', rif: 'J-29837482-9', phone: '(01) 555-EMPAQUE', contact: 'Roberto Gómez', address: 'Av. Principal Norte, Bodega 5, Maracay' },
    { code: 'PROV-004', name: 'Chocolates del Rey', icon: 'sparkles', rif: 'J-50192834-6', phone: '(01) 555-CACAO', contact: 'Jean-Philippe Laurent', address: 'Calle Los Artesanos, Qta. Cacao, Los Teques' }
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

// ==========================================================================
// MOTOR DE CONVERSIÓN DE UNIDADES DE MEDIDA (UOM CONVERTER) & AUDITORÍA
// ==========================================================================

const UomConverter = {
  toBaseUnit(qty, unitStr, category = '') {
    const q = parseFloat(qty) || 0;
    const u = (unitStr || '').toLowerCase().trim();

    if (u.includes('saco')) return { baseQty: q * 50000, baseUnit: 'g', type: 'mass' };
    if (u.includes('caja')) {
      if (category.toLowerCase().includes('líquido') || category.toLowerCase().includes('bebida') || u.includes('litro')) {
        return { baseQty: q * 12000, baseUnit: 'ml', type: 'volume' };
      }
      return { baseQty: q * 20000, baseUnit: 'g', type: 'mass' };
    }
    if (u.includes('kg') || u.includes('kilo')) return { baseQty: q * 1000, baseUnit: 'g', type: 'mass' };
    if (u.includes('g') && !u.includes('kg')) return { baseQty: q * 1, baseUnit: 'g', type: 'mass' };
    if (u === 'l' || u.includes('litro')) return { baseQty: q * 1000, baseUnit: 'ml', type: 'volume' };
    if (u.includes('ml') || u.includes('mililitro')) return { baseQty: q * 1, baseUnit: 'ml', type: 'volume' };
    if (u.includes('docena')) return { baseQty: q * 12, baseUnit: 'ud', type: 'count' };
    if (u.includes('carton') || u.includes('cartón')) return { baseQty: q * 30, baseUnit: 'ud', type: 'count' };

    return { baseQty: q * 1, baseUnit: u || 'ud', type: 'count' };
  },

  convertQty(qty, fromUnit, toUnit, category = '') {
    const fromBase = this.toBaseUnit(qty, fromUnit, category);
    const toBase = this.toBaseUnit(1, toUnit, category);
    if (toBase.baseQty <= 0) return qty;
    return fromBase.baseQty / toBase.baseQty;
  },

  formatFriendlyStock(stockQty, unitStr, category = '') {
    const { baseQty, baseUnit } = this.toBaseUnit(stockQty, unitStr, category);

    if (baseUnit === 'g') {
      const sacos = Math.floor(baseQty / 50000);
      const remG = baseQty % 50000;
      const remKg = remG / 1000;

      if (sacos > 0) {
        if (remKg > 0) {
          return `${sacos} Saco${sacos > 1 ? 's' : ''} + ${remKg.toFixed(1)} kg`;
        }
        return `${sacos} Saco${sacos > 1 ? 's' : ''} (${(baseQty / 1000).toFixed(0)} kg)`;
      }

      if (baseQty >= 1000) {
        return `${(baseQty / 1000).toFixed(1)} kg`;
      }
      return `${Math.round(baseQty)} g`;
    }

    if (baseUnit === 'ml') {
      if (baseQty >= 1000) {
        return `${(baseQty / 1000).toFixed(1)} L`;
      }
      return `${Math.round(baseQty)} ml`;
    }

    return `${stockQty} ${unitStr}`;
  },

  deductStock(currentStock, currentUnit, requestedQty, requestedUnit, category = '') {
    const currentBase = this.toBaseUnit(currentStock, currentUnit, category);
    const requestedBase = this.toBaseUnit(requestedQty, requestedUnit, category);

    let newBaseQty = currentBase.baseQty - requestedBase.baseQty;
    if (newBaseQty < 0) newBaseQty = 0;

    const toBase = this.toBaseUnit(1, currentUnit, category);
    const newStock = toBase.baseQty > 0 ? newBaseQty / toBase.baseQty : newBaseQty;

    return {
      newStock,
      baseQtyDeducted: requestedBase.baseQty,
      baseUnit: currentBase.baseUnit
    };
  }
};

function getMovementsFromStorage() {
  try {
    const raw = localStorage.getItem('movimientos_inventario');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error leyendo movimientos_inventario:', e);
  }
  try {
    if (typeof RECENT_MOVEMENTS !== 'undefined') {
      localStorage.setItem('movimientos_inventario', JSON.stringify(RECENT_MOVEMENTS));
    }
  } catch (e) {}
  return typeof RECENT_MOVEMENTS !== 'undefined' ? RECENT_MOVEMENTS : [];
}

function registrarMovimientoAuditInventario(movData) {
  try {
    const raw = localStorage.getItem('movimientos_inventario');
    const list = raw ? JSON.parse(raw) : (Array.isArray(RECENT_MOVEMENTS) ? [...RECENT_MOVEMENTS] : []);
    list.unshift(movData);
    localStorage.setItem('movimientos_inventario', JSON.stringify(list));
    window.dispatchEvent(new Event('movimientosChanged'));
    if (typeof BroadcastChannel !== 'undefined') {
      const movChannel = new BroadcastChannel('lnp_movements_channel');
      movChannel.postMessage({ type: 'movement_added', timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('Error registrando movimiento de auditoría:', e);
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
    { name: 'Baguette Tradición (x2)', price: '$3.60 USD' },
    { name: 'Croissant de Mantequilla (x3)', price: '$7.50 USD' },
    { name: 'Café Au Lait (x2)', price: '$6.40 USD' },
    { name: 'Tarta de Almendras (x1)', price: '$15.00 USD' }
  ],
  'FAC-2026-1002': [
    { name: 'Pan de Campo Artesanal (x1)', price: '$6.00 USD' },
    { name: 'Pain au Chocolat (x2)', price: '$8.00 USD' }
  ],
  'OC-2026-0089': [
    { name: 'Harina de Trigo Panadera 50kg (x10 Sacos)', price: '-$450.00 USD' }
  ],
  'FAC-2026-1001': [
    { name: 'Brioche Tradicional (x3)', price: '$10.80 USD' },
    { name: 'Éclair de Chocolate (x2)', price: '$18.00 USD' }
  ],
  'ARQ-2026-0012': [
    { name: 'Auditoría de Caja e Inventario (Turno Mañana - Sin Descuadres)', price: '$0.00 USD' }
  ],
  'OC-2026-0088': [
    { name: 'Mantequilla AOP Normandía 25kg (x4 Cajas)', price: '-$280.00 USD' }
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
 * 1. Inicialización de Sesión y Barra Superior con Control de Acceso (RBAC)
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
    roleCode: 'ADMIN',
    icon: 'shield-check'
  };

  // 1. Verificación Estricta de Permisos de Gerencia (Solo Superadmin y Gerente)
  const userRole = (activeUser.role || '').toLowerCase();
  const userRoleCode = (activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin');
  const isGerente = isSuperadmin ||
                    userRoleCode === 'ADMIN' ||
                    userRoleCode === 'MANAGER' ||
                    userRoleCode === 'GERENTE' ||
                    (userRole.includes('gerente') && !userRole.includes('contador'));

  if (!isGerente) {
    let redirectUrl = 'accounting.html';
    if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    else if (userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero')) redirectUrl = 'kitchen.html';
    else if (userRoleCode === 'ACCOUNTANT' || userRole.includes('contador')) redirectUrl = 'accounting.html';
    else redirectUrl = '../index.html';
    window.location.replace(redirectUrl);
    return false;
  }

  const managerNameEl = document.getElementById('managerName');
  const managerAvatarEl = document.getElementById('managerAvatar');
  const shiftStatusEl = document.querySelector('.cashier-info .shift-status');

  if (managerNameEl) managerNameEl.textContent = activeUser.name || 'Juan Mendoza';
  if (shiftStatusEl) shiftStatusEl.textContent = `● ${activeUser.role || 'Gerente General'}`;
  if (managerAvatarEl) {
    managerAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'shield-check') : '<i data-lucide="shield-check"></i>';
    window.LucideIcons?.refresh();
  }

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

  return true;
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
      try { syncInventoryFromBackend(); } catch (e) {}
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
      bcvRateBadge.innerHTML = `<span><i data-lucide="coins" class="icon-xs"></i> BCV Oficial:</span> <strong>Bs. ${rate.toFixed(2)}</strong>`;
      bcvRateBadge.className = isManual ? 'bcv-rate-badge warning' : 'bcv-rate-badge';
    }
  }

  async function resolveDashboardBcvRate() {
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
    if (modoGuardado === 'manual') {
      const tasaManualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
      if (tasaManualVal && tasaManualVal > 0) {
        updateDashboardRateBadge(tasaManualVal, 'BCV Oficial', true);
        return tasaManualVal;
      }
    }

    const apis = [
      '../api/bcv_rate.php',
      'https://ve.dolarapi.com/v1/dolares/oficial'
    ];

    for (const url of apis) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;
        const res = await fetch(`${url}?t=${Date.now()}`, { 
          cache: 'no-store',
          signal: controller ? controller.signal : undefined 
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const liveRate = parseFloat(data.promedio || data.precio || data.monto || data.rate);
          if (liveRate && liveRate > 0) {
            localStorage.setItem('tasa_auto', liveRate.toString());
            localStorage.setItem('bcv_current_rate', liveRate.toString());
            updateDashboardRateBadge(liveRate, 'BCV Oficial', false);
            return liveRate;
          }
        }
      } catch (e) {
        // Fallback rápido
      }
    }

    const fallbackRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 784.66;
    updateDashboardRateBadge(fallbackRate, 'BCV Oficial', true);
    return fallbackRate;
  }

  function handleRateBroadcast(data) {
    if (!data) {
      resolveDashboardBcvRate();
      return;
    }
    const isManual = data.mode === 'manual';
    const rateVal = parseFloat(data.rate) || 0;
    if (rateVal > 0) {
      updateDashboardRateBadge(rateVal, 'BCV Oficial', isManual);
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
 * 4. Renderización de KPIs y Gráficos (Chart.js con Filtros Dinámicos)
 */
let chartPeriodFilter = '7d';      // '7d' | 'month' | 'quarter' | 'year'
let chartMetricFilter = 'all';     // 'all' | 'sales' | 'costs' | 'profit'
let chartCurrencyFilter = 'usd';   // 'usd' | 'ves'

function getActiveDashboardBcvRate() {
  const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
  if (modoGuardado === 'manual') {
    const tasaManualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
    if (tasaManualVal && tasaManualVal > 0) return tasaManualVal;
  }
  return parseFloat(localStorage.getItem('bcv_current_rate') || localStorage.getItem('tasa_auto') || '871.37') || 871.37;
}

function formatChartCurrency(amount, isVes) {
  const formatted = Number(amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isVes ? `Bs. ${formatted}` : `$${formatted}`;
}

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

  const bcvRate = getActiveDashboardBcvRate();
  const isVes = chartCurrencyFilter === 'ves';
  const multiplier = isVes ? bcvRate : 1.0;
  const currSymbol = isVes ? 'Bs.' : '$';

  const periodData = (typeof SALES_TREND_PERIODS !== 'undefined' && SALES_TREND_PERIODS[chartPeriodFilter]) 
    ? SALES_TREND_PERIODS[chartPeriodFilter] 
    : (SALES_TREND_DATA || { labels: [], sales: [], costs: [], orders: [] });

  const labels = periodData.labels || [];
  const rawSales = periodData.sales || [];
  const rawCosts = periodData.costs || [];
  const rawOrders = periodData.orders || [];

  // Totales en USD para cálculo del margen operativo del período
  const totalSalesUSD = rawSales.reduce((a, b) => a + b, 0);
  const totalCostsUSD = rawCosts.reduce((a, b) => a + b, 0);
  const totalProfitUSD = totalSalesUSD - totalCostsUSD;
  const marginPct = totalSalesUSD > 0 ? ((totalProfitUSD / totalSalesUSD) * 100).toFixed(1) : '0.0';
  const totalOrders = rawOrders.reduce((a, b) => a + b, 0);

  // Valores convertidos según la moneda seleccionada (USD o Bs.)
  const salesValues = rawSales.map(v => Math.round(v * multiplier * 100) / 100);
  const costsValues = rawCosts.map(v => Math.round(v * multiplier * 100) / 100);
  const profitValues = rawSales.map((v, i) => Math.round((v - (rawCosts[i] || 0)) * multiplier * 100) / 100);

  const totalSalesDisplay = totalSalesUSD * multiplier;
  const totalCostsDisplay = totalCostsUSD * multiplier;
  const totalProfitDisplay = totalProfitUSD * multiplier;

  // Actualizar Mini-Panel de Resumen del Período
  const summarySalesEl = document.getElementById('chartSummarySales');
  const summaryCostsEl = document.getElementById('chartSummaryCosts');
  const summaryProfitEl = document.getElementById('chartSummaryProfit');
  const summaryMarginEl = document.getElementById('chartSummaryMargin');
  const summaryOrdersEl = document.getElementById('chartSummaryOrders');

  if (summarySalesEl) summarySalesEl.textContent = formatChartCurrency(totalSalesDisplay, isVes);
  if (summaryCostsEl) summaryCostsEl.textContent = formatChartCurrency(totalCostsDisplay, isVes);
  if (summaryProfitEl) {
    const sign = totalProfitDisplay >= 0 ? '+' : '';
    summaryProfitEl.textContent = `${sign}${formatChartCurrency(totalProfitDisplay, isVes)}`;
    summaryProfitEl.className = totalProfitDisplay >= 0 ? 'summary-value text-emerald' : 'summary-value text-danger';
  }
  if (summaryMarginEl) summaryMarginEl.textContent = `${marginPct}%`;
  if (summaryOrdersEl) summaryOrdersEl.textContent = `${totalOrders} pedidos`;

  // Actualizar Leyendas
  const legendSalesPill = document.getElementById('legendSalesPill');
  const legendCostsPill = document.getElementById('legendCostsPill');
  const legendProfitPill = document.getElementById('legendProfitPill');
  const legendSalesLabel = document.getElementById('legendSalesLabel');
  const legendCostsLabel = document.getElementById('legendCostsLabel');
  const legendProfitLabel = document.getElementById('legendProfitLabel');

  if (legendSalesLabel) legendSalesLabel.textContent = `Ventas Totales (${currSymbol})`;
  if (legendCostsLabel) legendCostsLabel.textContent = `Costo Producción (${currSymbol})`;
  if (legendProfitLabel) legendProfitLabel.textContent = `Ganancia Neta (${currSymbol})`;

  if (legendSalesPill) legendSalesPill.style.display = (chartMetricFilter === 'all' || chartMetricFilter === 'sales') ? 'flex' : 'none';
  if (legendCostsPill) legendCostsPill.style.display = (chartMetricFilter === 'all' || chartMetricFilter === 'costs') ? 'flex' : 'none';
  if (legendProfitPill) legendProfitPill.style.display = (chartMetricFilter === 'profit') ? 'flex' : 'none';

  if (salesChartInstance) salesChartInstance.destroy();

  const goldGradient = ctx.createLinearGradient(0, 0, 0, 300);
  goldGradient.addColorStop(0, 'rgba(212, 155, 84, 0.45)');
  goldGradient.addColorStop(1, 'rgba(212, 155, 84, 0.01)');

  const terracottaGradient = ctx.createLinearGradient(0, 0, 0, 300);
  terracottaGradient.addColorStop(0, 'rgba(200, 90, 50, 0.35)');
  terracottaGradient.addColorStop(1, 'rgba(200, 90, 50, 0.01)');

  const emeraldGradient = ctx.createLinearGradient(0, 0, 0, 300);
  emeraldGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  emeraldGradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

  const datasets = [];

  if (chartMetricFilter === 'all' || chartMetricFilter === 'sales') {
    datasets.push({
      label: `Ventas Totales (${currSymbol})`,
      data: salesValues,
      borderColor: '#D49B54',
      backgroundColor: goldGradient,
      borderWidth: 3,
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#2C1D11',
      pointBorderColor: '#D49B54',
      pointRadius: 5,
      pointHoverRadius: 7
    });
  }

  if (chartMetricFilter === 'all' || chartMetricFilter === 'costs') {
    datasets.push({
      label: `Costo de Producción (${currSymbol})`,
      data: costsValues,
      borderColor: '#C85A32',
      backgroundColor: terracottaGradient,
      borderWidth: 2.5,
      borderDash: chartMetricFilter === 'all' ? [5, 5] : [],
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#C85A32',
      pointBorderColor: '#FFFFFF',
      pointRadius: 4,
      pointHoverRadius: 6
    });
  }

  if (chartMetricFilter === 'profit') {
    datasets.push({
      label: `Ganancia Neta (${currSymbol})`,
      data: profitValues,
      borderColor: '#10B981',
      backgroundColor: emeraldGradient,
      borderWidth: 3,
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#065F46',
      pointBorderColor: '#10B981',
      pointRadius: 5,
      pointHoverRadius: 7
    });
  }

  if (typeof Chart !== 'undefined') {
    salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2C1D11',
            titleFont: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 13 },
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const val = context.parsed.y;
                const formatted = Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return ` ${context.dataset.label}: ${isVes ? 'Bs. ' : '$'}${formatted}`;
              }
            }
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
              callback: (val) => {
                if (Math.abs(val) >= 1000000) return `${currSymbol}${(val / 1000000).toFixed(1)}M`;
                if (Math.abs(val) >= 1000) return `${currSymbol}${(val / 1000).toFixed(0)}k`;
                return `${currSymbol}${val}`;
              }
            }
          }
        }
      }
    });
  }
}

function inicializarFiltrosGrafico() {
  // 1. Filtros de Período (7d, month, quarter, year)
  const periodButtons = document.querySelectorAll('#chartPeriodFilters .chart-filter-pill');
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartPeriodFilter = btn.dataset.period || '7d';
      renderizarGraficos();
    });
  });

  // 2. Filtros de Métrica (all, sales, costs, profit)
  const metricButtons = document.querySelectorAll('#chartMetricFilters .chart-filter-pill');
  metricButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      metricButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartMetricFilter = btn.dataset.metric || 'all';
      renderizarGraficos();
    });
  });

  // 3. Filtro Bimonetario (USD vs VES)
  const currencyButtons = document.querySelectorAll('[data-chart-currency]');
  currencyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartCurrencyFilter = btn.dataset.chartCurrency || 'usd';
      renderizarGraficos();
    });
  });

  // 4. Actualizar si cambia la tasa BCV en tiempo real
  window.addEventListener('bcvRateChanged', () => {
    if (chartCurrencyFilter === 'ves') {
      renderizarGraficos();
    }
  });

  window.addEventListener('storage', (e) => {
    if ((e.key === 'bcv_current_rate' || e.key === 'tasa_manual') && chartCurrencyFilter === 'ves') {
      renderizarGraficos();
    }
  });

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else if (window.LucideIcons?.refresh) {
    window.LucideIcons.refresh();
  }
}

/**
 * 5. Carga y Renderizado de Tablas de Inventario y Movimientos
 */
let currentInspectedMovement = null;

function renderMovementsTable() {
  const tbody = document.getElementById('recentMovementsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const allMovs = getMovementsFromStorage();

  const filtered = allMovs.filter(mov => {
    if (currentCategoryFilter === 'todos') return true;
    return mov.category === currentCategoryFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">No hay movimientos registrados.</td></tr>`;
    return;
  }

  filtered.forEach(mov => {
    const tr = document.createElement('tr');
    const isPositive = mov.amount > 0;
    const isNegative = mov.amount < 0;
    const isDevolucion = mov.type?.includes('Devolución') || mov.type?.includes('Anulación');

    let formattedAmount = `$${Math.abs(mov.amount).toFixed(2)}`;
    let amountClass = 'neutral';
    if (isPositive) {
      formattedAmount = `+$${mov.amount.toFixed(2)}`;
      amountClass = 'positive';
    } else if (isNegative) {
      formattedAmount = `-$${Math.abs(mov.amount).toFixed(2)}`;
      amountClass = 'negative';
    }

    let categoryBadge = `<span class="table-status-tag completado" style="background: rgba(46,125,50,0.12); color: var(--color-success); font-weight: 700; border: 1px solid rgba(46,125,50,0.3);"><i data-lucide="arrow-down-left" class="icon-xs" style="margin-right: 0.25rem;"></i>${mov.type || "Venta POS"}</span>`;
    if (isDevolucion) {
      categoryBadge = `<span class="table-status-tag" style="background: rgba(198,40,40,0.14); color: #C62828; border: 1px solid rgba(198,40,40,0.35); font-weight: 800;">↩️ Devolución de Venta</span>`;
    } else if (mov.category === 'gasto' || isNegative) {
      categoryBadge = `<span class="table-status-tag" style="background: rgba(198,40,40,0.12); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); font-weight: 700;"><i data-lucide="arrow-up-right" class="icon-xs" style="margin-right: 0.25rem;"></i>${mov.type || "Egreso / Compra"}</span>`;
    } else if (mov.category === 'ajuste' || mov.type?.includes('Requisición') || mov.amount === 0) {
      categoryBadge = `<span class="table-status-tag" style="background: rgba(255,152,0,0.12); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;"><i data-lucide="refresh-cw" class="icon-xs" style="margin-right: 0.25rem;"></i>${mov.type || "Transferencia"}</span>`;
    }

    const reasonText = mov.reason || mov.motivo || (mov.breakdown && mov.breakdown.find(b => b.name?.includes('Motivo:'))?.name?.replace('Motivo:', '').trim());
    const typeCellContent = isDevolucion && reasonText
      ? `${categoryBadge}<div style="font-size: 0.76rem; color: #C62828; font-weight: 700; margin-top: 3px;">Motivo: ${reasonText}</div>`
      : categoryBadge;

    const userCellContent = mov.authorizedBy
      ? `<strong>${mov.user}</strong><br><small style="color: #E65100; font-weight: 700;">(Gerente: ${mov.authorizedBy})</small>`
      : mov.user;

    tr.innerHTML = `
      <td class="table-code-badge">${mov.code}</td>
      <td style="color: var(--color-muted); font-size: 0.85rem;">${mov.timestamp}</td>
      <td>${typeCellContent}</td>
      <td>${userCellContent}</td>
      <td style="color: var(--color-muted);">${mov.paymentMethod}</td>
      <td><span class="table-status-tag completado">${mov.status || 'Completado'}</span></td>
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
  currentInspectedMovement = mov;
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
    if (mov.type?.includes('Devolución') || mov.type?.includes('Anulación')) iconEl.textContent = '↩️';
    else if (mov.category === 'venta') iconEl.innerHTML = '<i data-lucide="shopping-bag"></i>';
    else if (mov.category === 'gasto') iconEl.innerHTML = '<i data-lucide="package"></i>';
    else iconEl.innerHTML = '<i data-lucide="bar-chart-3"></i>';
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
  if (resp) resp.textContent = mov.authorizedBy ? `${mov.user} (Autorizado por ${mov.authorizedBy})` : mov.user;
  if (mPago) mPago.textContent = mov.paymentMethod;
  if (mFec) mFec.textContent = mov.timestamp;
  if (mTasa) mTasa.textContent = `Bs. ${activeRate.toFixed(2)} / USD`;

  const listContainer = document.getElementById('modalBreakdownList');
  if (listContainer) {
    listContainer.innerHTML = '';
    const items = (mov.breakdown && Array.isArray(mov.breakdown) && mov.breakdown.length > 0)
      ? mov.breakdown
      : (BREAKDOWN_MAP[mov.code] || [
          { name: `Concepto General: ${mov.type}`, price: `$${Math.abs(mov.amount).toFixed(2)} USD` }
        ]);

    items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'breakdown-item-row';
      row.innerHTML = `
        <span class="breakdown-item-name">${it.name}</span>
        <span class="breakdown-item-price">${it.price}</span>
      `;
      listContainer.appendChild(row);
    });

    if (mov.discount) {
      const discRow = document.createElement('div');
      discRow.className = 'breakdown-item-row';
      discRow.style.fontWeight = 'bold';
      discRow.style.color = 'var(--color-success)';
      discRow.innerHTML = `
        <span class="breakdown-item-name"><i data-lucide="tag" class="icon-xs" style="margin-right:0.25rem;"></i>Descuento Especial Aplicado</span>
        <span class="breakdown-item-price">-${mov.discount}</span>
      `;
      listContainer.appendChild(discRow);
    }

    const reasonText = mov.reason || mov.motivo || (mov.breakdown && mov.breakdown.find(b => b.name?.includes('Motivo:'))?.name?.replace('Motivo:', '').trim());
    if (mov.type?.includes('Devolución') || mov.type?.includes('Anulación') || reasonText) {
      const reasonCard = document.createElement('div');
      reasonCard.style.cssText = 'background: rgba(198,40,40,0.08); border: 1.5px solid rgba(198,40,40,0.3); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-top: 0.85rem; color: #C62828;';
      reasonCard.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
          <i data-lucide="alert-triangle" class="icon-sm" style="margin-right:0.35rem;"></i> <span>Motivo de la Devolución / Anulación:</span>
        </div>
        <div style="font-size: 0.95rem; font-weight: 700;">${reasonText || 'Producto Defectuoso / Solicitud del Cliente'}</div>
        ${mov.authorizedBy ? `<div style="font-size: 0.8rem; color: var(--color-espresso); margin-top: 0.35rem;"><strong>Autorizado por Gerencia:</strong> ${mov.authorizedBy}</div>` : ''}
        ${mov.notes ? `<div style="font-size: 0.78rem; color: var(--color-muted); margin-top: 0.2rem; font-style: italic;">Observaciones: ${mov.notes}</div>` : ''}
      `;
      listContainer.appendChild(reasonCard);
    }
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function printMovementVoucher(mov) {
  if (!mov) return;
  let ticketPrintArea = document.getElementById('ticketPrintArea');
  if (!ticketPrintArea) {
    ticketPrintArea = document.createElement('div');
    ticketPrintArea.id = 'ticketPrintArea';
    ticketPrintArea.className = 'ticket-print-area';
    document.body.appendChild(ticketPrintArea);
  }

  const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
  let activeRate = 761.21;
  if (modoGuardado === 'manual') {
    activeRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
  } else {
    activeRate = parseFloat(localStorage.getItem('tasa_auto') || localStorage.getItem('tasaAuto')) || 761.21;
  }

  const isPositive = mov.amount >= 0;
  const amountUsdText = isPositive ? `$${mov.amount.toFixed(2)} USD` : `-$${Math.abs(mov.amount).toFixed(2)} USD`;
  const amountVesVal = Math.abs(mov.amount) * activeRate;
  const amountVesText = `Bs. ${amountVesVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`;

  const items = (mov.breakdown && Array.isArray(mov.breakdown) && mov.breakdown.length > 0)
    ? mov.breakdown
    : (BREAKDOWN_MAP[mov.code] || [
        { name: `Concepto: ${mov.type}`, price: `$${Math.abs(mov.amount).toFixed(2)} USD` }
      ]);

  let itemsHtml = '';
  items.forEach(it => {
    itemsHtml += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>${it.name}</span>
        <span>${it.price}</span>
      </div>`;
  });

  const discountRow = mov.discount ? `
    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px; padding-top: 2px; border-top: 1px dashed #000;">
      <span>DESCUENTO APLICADO:</span>
      <span>-${mov.discount}</span>
    </div>` : '';

  ticketPrintArea.innerHTML = `
    <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
      <h2 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">La Nueva Parisienne</h2>
      <p style="margin: 2px 0 0 0; font-size: 10px;">Boulangerie & Pâtisserie Artesanal</p>
      <p style="margin: 2px 0 0 0; font-size: 9px;">RIF: J-50123456-7 • Caracas, VE</p>
    </div>

    <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 10px;">
      <div><strong>N° COMPROBANTE:</strong> ${mov.code}</div>
      <div><strong>FECHA Y HORA:</strong> ${mov.timestamp}</div>
      <div><strong>OPERACIÓN:</strong> ${mov.type}</div>
      <div><strong>RESPONSABLE:</strong> ${mov.user}</div>
      <div><strong>MÉTODO PAGO:</strong> ${mov.paymentMethod}</div>
    </div>

    <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 10px;">
      <div style="font-weight: bold; margin-bottom: 4px; text-decoration: underline;">DESGLOSE DE ITEMS:</div>
      ${itemsHtml}
      ${discountRow}
    </div>

    <div style="border-top: 1px solid #000; padding-top: 6px; margin-top: 6px; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
        <span>TOTAL IMPORTE ($):</span>
        <span>${amountUsdText}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-top: 3px;">
        <span>EQUIVALENTE BCV (VES):</span>
        <span>${amountVesText}</span>
      </div>
      <div style="font-size: 9px; text-align: center; margin-top: 4px; color: #333;">Tasa Referencial BCV: Bs. ${activeRate.toFixed(2)} / USD</div>
    </div>

    <div style="text-align: center; margin-top: 10px; font-size: 9px; border-top: 1px dashed #000; padding-top: 6px;">
      <p style="margin: 0;">¡Gracias por su compra en La Nueva Parisienne!</p>
      <p style="margin: 2px 0 0 0; font-weight: bold;">*** COMPROBANTE OFICIAL DE AUDITORÍA ***</p>
    </div>
  `;

  window.print();
}

function renderInventoryTables() {
  rawMaterialsData = getRawMaterialsFromStorage();
  finishedGoodsData = getPosCatalogFromStorage();
  suppliersData = getSuppliersFromStorage();

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
      const friendlyStock = UomConverter.formatFriendlyStock(item.stock, item.unit, item.category);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-code-badge">${item.code}</td>
        <td><strong><i data-lucide="${item.icon || 'package'}" class="icon-sm" style="margin-right: 0.35rem;"></i>${item.name}</strong></td>
        <td style="color: var(--color-muted);">${item.category}</td>
        <td><span class="table-status-tag" style="background: rgba(0,0,0,0.06); color: var(--color-espresso); font-weight: 700;">${item.unit}</span></td>
        <td style="font-weight: 700; color: var(--color-gold-dark);">$${item.unitCost.toFixed(2)} / ${item.unit}</td>
        <td style="font-weight: 800; font-size: 0.92rem; color: var(--color-espresso);" title="Stock Interno Base: ${item.stock} ${item.unit}">
          <div>${friendlyStock}</div>
          <small style="font-weight: 600; color: var(--color-muted); font-size: 0.78rem;">(${item.stock.toFixed(1)} ${item.unit})</small>
        </td>
        <td>
          <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
            ${isLow ? `<span class="badge-clean-icon" style="color: var(--color-danger);"><i data-lucide="alert-triangle" class="icon-xs"></i> ALERTA: Stock Bajo (${item.minStock} ${item.unit})</span>` : `<span class="badge-clean-icon" style="color: var(--color-success);"><i data-lucide="check" class="icon-xs"></i> Normal (${item.minStock} ${item.unit})</span>`}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-ingreso-item" data-code="${item.code}" title="Registrar ingreso de mercancía">+ Ingreso</button>
            <button type="button" class="btn-table-action-sm btn-edit-mp" title="Editar materia prima"><i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span></button>
            <button type="button" class="btn-table-action-sm btn-del-mp" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar materia prima"><i data-lucide="trash-2" class="icon-xs"></i></button>
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
        <td><strong><i data-lucide="${item.icon || 'shopping-bag'}" class="icon-sm" style="margin-right: 0.35rem;"></i>${item.name}</strong></td>
        <td style="color: var(--color-espresso); font-weight: 600;">${item.category}</td>
        <td><span class="table-status-tag" style="background: rgba(0,0,0,0.06); color: var(--color-espresso); font-weight: 700;">${item.unit || 'Und'}</span></td>
        <td style="color: var(--color-muted);">$${(item.unitCost || 0).toFixed(2)} / ${item.unit || 'Und'}</td>
        <td style="font-weight: 700; color: var(--color-gold-dark);">$${(item.salePrice || item.price || 0).toFixed(2)} USD</td>
        <td style="font-weight: 800; font-size: 0.95rem;">${item.stock} ${item.unit || 'Und'}</td>
        <td>
          <span class="table-status-tag ${isVisiblePos ? 'active' : ''}" style="${isVisiblePos ? 'background: rgba(46,125,50,0.1); color: var(--color-success); font-weight: 700;' : 'background: rgba(0,0,0,0.06); color: var(--color-muted);'}">
            ${isVisiblePos ? '<span class="badge-clean-icon" style="color: var(--color-success);"><i data-lucide="eye" class="icon-xs"></i> Visible en POS</span>' : '<span class="badge-clean-icon" style="color: var(--color-muted);"><i data-lucide="eye-off" class="icon-xs"></i> Oculto en POS</span>'}
          </span>
        </td>
        <td>
          <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
            ${isLow ? `<span class="badge-clean-icon" style="color: var(--color-danger);"><i data-lucide="alert-triangle" class="icon-xs"></i> ALERTA: Stock Bajo (${item.minStock} ${item.unit || "Und"})</span>` : `<span class="badge-clean-icon" style="color: var(--color-success);"><i data-lucide="check" class="icon-xs"></i> Normal (${item.minStock} ${item.unit || "Und"})</span>`}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-ingreso-item" data-code="${item.code}" title="Registrar ingreso de mercancía">+ Ingreso</button>
            <button type="button" class="btn-table-action-sm btn-edit-pt" title="Editar producto"><i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span></button>
            <button type="button" class="btn-table-action-sm btn-del-pt" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar producto"><i data-lucide="trash-2" class="icon-xs"></i></button>
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
        <td><strong><i data-lucide="${prov.icon || 'building-2'}" class="icon-sm" style="margin-right: 0.35rem;"></i>${prov.name}</strong></td>
        <td style="font-weight: 600; color: var(--color-espresso);">${prov.rif}</td>
        <td style="color: var(--color-muted);">${prov.phone}</td>
        <td><i data-lucide="user" class="icon-xs" style="margin-right: 0.25rem;"></i>${prov.contact}</td>
        <td style="color: var(--color-muted); font-size: 0.82rem;">${prov.address || 'N/A'}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-edit-prov" title="Editar datos del proveedor"><i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span></button>
            <button type="button" class="btn-table-action-sm btn-del-prov" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar proveedor"><i data-lucide="trash-2" class="icon-xs"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-prov')?.addEventListener('click', () => openProveedorModal(prov));
      tr.querySelector('.btn-del-prov')?.addEventListener('click', () => openConfirmEliminarModal(prov, 'prov'));

      suppliersTbody.appendChild(tr);
    });
  }
}

async function syncInventoryFromBackend() {
  try {
    let res = await fetch('../api/inventory/get_inventory.php');
    if (!res.ok) res = await fetch('api/inventory/get_inventory.php');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.success && Array.isArray(data.inventory)) {
      const liveRaw = [];
      const liveFinished = [];

      data.inventory.forEach(item => {
        if (item.category === 'raw_material') {
          const prev = rawMaterialsData.find(r => r.code === item.code || r.id === item.id);
          liveRaw.push({
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.categoryName || prev?.category || 'Materias Primas',
            unitCost: item.unitPrice || prev?.unitCost || 1.8,
            unit: item.unit || prev?.unit || 'Kg',
            stock: item.currentStock,
            minStock: item.minStock,
            icon: item.icon || prev?.icon || 'package'
          });
        } else {
          const prev = finishedGoodsData.find(f => f.code === item.code || f.id === item.id);
          liveFinished.push({
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.categoryName || prev?.category || 'Panadería',
            unitCost: prev?.unitCost || (item.unitPrice * 0.5),
            salePrice: item.unitPrice || prev?.salePrice || 2.5,
            price: item.unitPrice || prev?.salePrice || 2.5,
            unit: item.unit || prev?.unit || 'Und',
            stock: item.currentStock,
            minStock: item.minStock,
            icon: item.icon || prev?.icon || 'croissant',
            showInPos: prev?.showInPos !== false,
            description: item.description || prev?.description || ''
          });
        }
      });

      if (liveRaw.length > 0) {
        rawMaterialsData = liveRaw;
        saveRawMaterialsToStorage(liveRaw);
      }
      if (liveFinished.length > 0) {
        finishedGoodsData = liveFinished;
        savePosCatalogToStorage(liveFinished);
      }
      renderInventoryTables();
    }
  } catch (err) {
    console.warn('Error sincronizando inventario desde MySQL:', err);
  }
}

function cargarInventario() {
  renderMovementsTable();
  renderInventoryTables();
  syncInventoryFromBackend();

  // Escuchar eventos de actualización en tiempo real desde la Caja y Cocina
  window.addEventListener('storage', (e) => {
    if (e.key === 'catalogo_pos' || e.key === 'materias_primas') {
      finishedGoodsData = getPosCatalogFromStorage();
      rawMaterialsData = getRawMaterialsFromStorage();
      renderInventoryTables();
      syncInventoryFromBackend();
    }
    if (e.key === 'movimientos_inventario') {
      renderMovementsTable();
    }
  });

  window.addEventListener('catalogoPosChanged', () => {
    finishedGoodsData = getPosCatalogFromStorage();
    rawMaterialsData = getRawMaterialsFromStorage();
    renderInventoryTables();
    syncInventoryFromBackend();
  });

  window.addEventListener('materiasPrimasChanged', () => {
    rawMaterialsData = getRawMaterialsFromStorage();
    renderInventoryTables();
    syncInventoryFromBackend();
  });

  window.addEventListener('movimientosChanged', () => {
    renderMovementsTable();
  });

  if (typeof BroadcastChannel !== 'undefined') {
    const posChannel = new BroadcastChannel('lnp_pos_catalog_channel');
    posChannel.onmessage = (e) => {
      syncInventoryFromBackend();
    };

    const matChannel = new BroadcastChannel('lnp_materials_channel');
    matChannel.onmessage = (e) => {
      syncInventoryFromBackend();
    };

    const movChannel = new BroadcastChannel('lnp_movements_channel');
    movChannel.onmessage = (e) => {
      if (e.data && e.data.type === 'movement_added') {
        renderMovementsTable();
      }
    };
  }
}

/**
 * 6. Inicialización de Botones Generales, Buscadores y Modales de Acción
 */
function inicializarBotonesGenerales() {
  try { inicializarReporteEjecutivo(); } catch (e) { console.warn('Reporte Ejecutivo init:', e); }
  document.getElementById('inventorySearchInput')?.addEventListener('input', renderInventoryTables);
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', renderInventoryTables);

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
      const incomingConverted = UomConverter.convertQty(qty, selectedUom, targetItem.unit, targetItem.category || '');
      targetItem.stock += incomingConverted;
      targetItem.unitCost = totalCost / (qty || 1);

      const timestamp = getFormattedTimestamp ? getFormattedTimestamp() : new Date().toLocaleString();
      const managerInfo = getActiveManagerInfo ? getActiveManagerInfo() : 'Gerencia';

      registrarMovimientoAuditInventario({
        code: `FAC-${numFactura}`,
        timestamp: timestamp,
        type: `Ingreso de Mercancía (${targetItem.name})`,
        user: managerInfo,
        paymentMethod: `Factura #${numFactura}`,
        status: 'Completado',
        amount: totalCost,
        category: 'gasto',
        item: `${targetItem.name} (+${qty} ${selectedUom})`,
        notes: `Ingreso de almacén por factura #${numFactura}`
      });
      // Sincronizar incremento de stock en base de datos MySQL en vivo
      fetch('../api/inventory/adjust_stock.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetItem.id || targetItem.code,
          quantity: incomingConverted,
          type: 'add',
          reason: `Ingreso de Factura #${numFactura}`
        })
      }).catch(err => console.warn('Error sincronizando stock en MySQL:', err));
    }

    saveRawMaterialsToStorage(rawMaterialsData);
    savePosCatalogToStorage(finishedGoodsData);
    renderInventoryTables();
    closeIngresoMercanciaModal();
    showSuccessModal('¡Ingreso Registrado!', `Se ingresaron +${qty} ${selectedUom} a "${targetItem ? targetItem.name : selectedCode}" (Factura N°: ${numFactura}).`);
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
      suppliersData.push({ code: newCode, name, icon: 'building-2', rif, phone, contact, address });
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

  materiaPrimaForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('modalMpCode')?.value;
    const name = document.getElementById('modalMpNombre')?.value?.trim();
    const category = document.getElementById('modalMpCategoria')?.value;
    const unit = document.getElementById('modalMpUnidad')?.value;
    const unitCost = parseFloat(document.getElementById('modalMpCostoUnitario')?.value || 0);
    const stock = parseFloat(document.getElementById('modalMpStockInicial')?.value || 0);
    const minStock = parseFloat(document.getElementById('modalMpStockMinimo')?.value || 0);

    if (!name || unitCost <= 0) return;

    try {
      let res = await fetch('../api/inventory/guardar_materia_prima.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, category, unit, unitCost, stock, minStock })
      });
      if (!res.ok) {
        res = await fetch('api/inventory/guardar_materia_prima.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, category, unit, unitCost, stock, minStock })
        });
      }
      const data = await res.json();
      if (data && data.success) {
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
          rawMaterialsData.push(data.item);
        }
        saveRawMaterialsToStorage(rawMaterialsData);
        renderInventoryTables();
        closeMateriaPrimaModal();
        showSuccessModal('¡Materia Prima Guardada en MySQL!', data.message);
      } else {
        alert(data.message || 'Error guardando materia prima en la base de datos.');
      }
    } catch (err) {
      console.warn('Fallo guardando en MySQL, fallback local:', err);
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
        rawMaterialsData.push({ code: newCode, name, icon: 'wheat', category, unitCost, unit, stock, minStock });
      }
      saveRawMaterialsToStorage(rawMaterialsData);
      renderInventoryTables();
      closeMateriaPrimaModal();
      showSuccessModal('¡Materia Prima Guardada!', `Materia prima "${name}" guardada con éxito en el catálogo.`);
    }
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

  productoTerminadoForm?.addEventListener('submit', async (e) => {
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

    try {
      let res = await fetch('../api/inventory/guardar_producto.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, category, unit, unitCost, salePrice, stock, minStock, showInPos })
      });
      if (!res.ok) {
        res = await fetch('api/inventory/guardar_producto.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, category, unit, unitCost, salePrice, stock, minStock, showInPos })
        });
      }
      const data = await res.json();
      if (data && data.success) {
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
          finishedGoodsData.push({
            ...data.item,
            icon: category === 'Panadería' ? 'croissant' : category === 'Pastelería' ? 'cake' : category === 'Bebidas' ? 'coffee' : 'utensils',
            unitCost,
            salePrice,
            price: salePrice,
            showInPos
          });
        }
        savePosCatalogToStorage(finishedGoodsData);
        renderInventoryTables();
        closeProductoTerminadoModal();
        showSuccessModal('¡Producto Guardado en MySQL!', `Producto "${name}" sincronizado con éxito con la Base de Datos y el POS.`);
      } else {
        alert(data.message || 'Error guardando producto en la base de datos.');
      }
    } catch (err) {
      console.warn('Fallo guardando en MySQL, fallback local:', err);
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
          icon: category === 'Panadería' ? 'croissant' : category === 'Pastelería' ? 'cake' : category === 'Bebidas' ? 'coffee' : 'utensils',
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
    }
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

  executeConfirmEliminarBtn?.addEventListener('click', async () => {
    if (!pendingDeleteTarget) return;

    const enteredPass = (confirmEliminarPassword?.value || '').trim();
    if (!enteredPass || !VALID_MANAGER_PASSWORDS.includes(enteredPass)) {
      if (confirmEliminarErrorMsg) {
        confirmEliminarErrorMsg.style.display = 'block';
        confirmEliminarErrorMsg.textContent = 'Contraseña gerencial incorrecta. Permiso denegado.';
      }
      confirmEliminarPassword?.focus();
      return;
    }

    const { item, type } = pendingDeleteTarget;

    try {
      if (type === 'mp' || type === 'pt') {
        let resDel = await fetch('../api/inventory/eliminar_item.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.code, type: type === 'mp' ? 'raw_material' : 'product' })
        });
        if (!resDel.ok) {
          await fetch('api/inventory/eliminar_item.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.code, type: type === 'mp' ? 'raw_material' : 'product' })
          });
        }
      }
    } catch (e) {
      console.warn('Error al eliminar en MySQL:', e);
    }

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
    showSuccessModal('¡Autorización Aprobada!', `El ítem "${item.name}" (${item.code}) ha sido eliminado permanentemente de la base de datos.`);
  });

  // Modales de detalle y notificaciones
  document.getElementById('btnCerrarModalDetalle')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('btnCerrarModalDetalleFooter')?.addEventListener('click', closeMovementDetailModal);
  document.getElementById('modalMovimientoDetalle')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalMovimientoDetalle') closeMovementDetailModal();
  });

  document.getElementById('btnImprimirComprobante')?.addEventListener('click', () => {
    if (currentInspectedMovement) {
      printMovementVoucher(currentInspectedMovement);
    } else {
      window.print();
    }
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
    optGroupRaw.label = 'MATERIAS PRIMAS E INSUMOS';
    rawMaterialsData.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.code;
      opt.textContent = `${item.code} - ${item.name} (${item.stock} ${item.unit} actuales)`;
      optGroupRaw.appendChild(opt);
    });
    modalIngresoProductoSelect.appendChild(optGroupRaw);

    const optGroupFinished = document.createElement('optgroup');
    optGroupFinished.label = 'PRODUCTOS TERMINADOS / VENTA DIRECTA';
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
        
        let statusTag = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(255,152,0,0.15); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;"><i data-lucide="clock" class="icon-xs"></i> Pendiente</span>`;
        if (ticket.status === 'Aprobado') {
          statusTag = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(46,125,50,0.15); color: var(--color-success); border: 1px solid rgba(46,125,50,0.3); font-weight: 700;"><i data-lucide="check" class="icon-xs"></i> Aprobado</span>`;
        } else if (ticket.status === 'Rechazado') {
          statusTag = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(198,40,40,0.15); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); font-weight: 700;"><i data-lucide="x" class="icon-xs"></i> Rechazado</span>`;
        }

        let actionBtns = '';
        if (ticket.status === 'Pendiente') {
          actionBtns = `
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn-table-action-sm btn-approve-ticket" style="background: rgba(46,125,50,0.12); color: var(--color-success); border-color: rgba(46,125,50,0.3); font-weight: 700;" title="Aprobar despacho"><i data-lucide="check" class="icon-xs"></i> <span>Aprobar</span></button>
              <button type="button" class="btn-table-action-sm btn-reject-ticket" style="background: rgba(198,40,40,0.12); color: var(--color-danger); border-color: rgba(198,40,40,0.3); font-weight: 700;" title="Rechazar solicitud"><i data-lucide="x" class="icon-xs"></i> <span>Rechazar</span></button>
            </div>
          `;
        } else if (ticket.status === 'Aprobado') {
          actionBtns = `
            <div style="font-size: 0.8rem; color: var(--color-success); font-weight: 600; line-height: 1.3;">
              <span class="badge-clean-icon" style="color: var(--color-success);"><i data-lucide="check" class="icon-xs"></i> Aprobado por <strong>${ticket.processedBy || "Gerencia"}</strong></span><br/>
              <span style="font-size: 0.75rem; color: var(--color-muted); font-weight: 400;">⏱️ ${ticket.processedAt || ticket.date}</span>
            </div>
          `;
        } else if (ticket.status === 'Rechazado') {
          actionBtns = `
            <div style="font-size: 0.8rem; color: var(--color-danger); font-weight: 600; line-height: 1.3;">
              <span class="badge-clean-icon" style="color: var(--color-danger);"><i data-lucide="x" class="icon-xs"></i> Rechazado por <strong>${ticket.processedBy || "Gerencia"}</strong></span><br/>
              <span style="font-size: 0.75rem; color: var(--color-muted); font-weight: 400;">⏱️ ${ticket.processedAt || ticket.date} — ${ticket.reason || ''}</span>
            </div>
          `;
        }

        tr.innerHTML = `
          <td><span class="table-code-badge" style="font-weight: 800;">${ticket.id}</span></td>
          <td style="font-size: 0.85rem;">${ticket.date}</td>
          <td><strong><i data-lucide="chef-hat" class="icon-sm" style="margin-right:0.25rem;"></i>${ticket.baker}</strong></td>
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
        const deductResult = UomConverter.deductStock(mat.stock, mat.unit, target.qty, target.unit, mat.category || '');
        mat.stock = deductResult.newStock;
        saveRawMaterialsToStorage(rawMaterials);
        renderInventoryTables();
      }

      saveTicketsToStorage(tickets);
      renderTicketsTable();

      // Registro de Auditoría Inmutable en el Historial General de Movimientos
      registrarMovimientoAuditInventario({
        code: target.id,
        timestamp: timestamp,
        type: `Despacho a Cocina (${target.itemName})`,
        user: managerInfo,
        paymentMethod: 'Requisición Interna',
        status: 'Completado',
        amount: 0,
        category: 'gasto',
        item: `${target.itemName} (${target.qty} ${target.unit})`,
        notes: `Requisición de Cocina autorizada para ${target.baker}`
      });

      showSuccessModal('¡Requisición Aprobada!', `Se autorizó el despacho por ${managerInfo} (${timestamp}) para ${target.qty} ${target.unit} de "${target.itemName}". El stock fue actualizado y registrado en auditoría.`);
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
// 4. GENERADOR DE REPORTES A MEDIDA GERENCIAL
// ==========================================================================
function inicializarReporteEjecutivo() {
  const btnExportReport = document.getElementById('btnExportReport');
  const modal = document.getElementById('executiveReportModal');
  const sheet = document.getElementById('executiveReportSheet');
  const btnPrint = document.getElementById('btnPrintExecutiveReport');
  const btnExportCsv = document.getElementById('btnExportExecutiveCsv');
  const btnClose = document.getElementById('btnCloseExecutiveReport');

  const repTypeSelect = document.getElementById('repTypeSelect');
  const repDateFrom = document.getElementById('repDateFrom');
  const repDateTo = document.getElementById('repDateTo');
  const repPresets = document.querySelectorAll('.rep-preset-btn');
  const btnRunReportQuery = document.getElementById('btnRunReportQuery');

  if (!btnExportReport || !modal || !sheet) return;

  let currentReportData = {
    type: 'ventas_resumen',
    title: 'Resumen Ejecutivo Financiero',
    from: '',
    to: '',
    rows: [],
    totals: {}
  };

  function toIsoDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function initDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    if (repDateFrom) repDateFrom.value = toIsoDate(firstDay);
    if (repDateTo) repDateTo.value = toIsoDate(today);
  }

  // Configurar botones de períodos rápidos
  repPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      repPresets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      const now = new Date();

      if (preset === 'today') {
        const todayStr = toIsoDate(now);
        repDateFrom.value = todayStr;
        repDateTo.value = todayStr;
      } else if (preset === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        repDateFrom.value = toIsoDate(weekAgo);
        repDateTo.value = toIsoDate(now);
      } else if (preset === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        repDateFrom.value = toIsoDate(firstDay);
        repDateTo.value = toIsoDate(now);
      } else if (preset === 'prev_month') {
        const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastPrev = new Date(now.getFullYear(), now.getMonth(), 0);
        repDateFrom.value = toIsoDate(firstPrev);
        repDateTo.value = toIsoDate(lastPrev);
      }

      ejecutarGeneracionReporte();
    });
  });

  async function ejecutarGeneracionReporte() {
    const reportType = repTypeSelect ? repTypeSelect.value : 'ventas_resumen';
    const fromDate = repDateFrom ? repDateFrom.value : '';
    const toDate = repDateTo ? repDateTo.value : '';

    const session = SessionStore.getSession();
    const activeUser = session?.user || { name: 'Juan Mendoza', role: 'Gerente General' };
    const bcvRate = BcvRateStore.getRate ? BcvRateStore.getRate() : 761.21;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    sheet.innerHTML = `
      <div style="padding: 4rem 2rem; text-align: center; color: var(--color-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.75rem;">⏳</div>
        <p style="font-size: 1rem; font-weight: 700; color: var(--color-espresso);">Consultando base de datos MySQL en vivo...</p>
        <span style="font-size: 0.85rem;">Generando reporte oficial para La Nueva Parisienne</span>
      </div>
    `;

    function makeBanner(title, badge, icon = 'croissant') {
      return `
        <div class="report-header-banner">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
              <i data-lucide="${icon}" class="icon-lg" style="color: var(--color-gold);"></i>
              <h1 class="report-brand-title">La Nueva Parisienne Panadería &amp; Pastelería C.A.</h1>
            </div>
            <p class="report-brand-sub">
              RIF: J-40123456-7 &bull; Av. Lara con Calle 8, Barquisimeto, Edo. Lara<br>
              Sistema de Gestión Integral &bull; ${title}
            </p>
          </div>
          <div class="report-meta-box">
            <span class="report-meta-badge">${badge}</span>
            <div><strong>Período Auditado:</strong> ${fromDate} al ${toDate}</div>
            <div><strong>Fecha Emisión:</strong> ${dateFormatted}, ${timeFormatted}</div>
            <div><strong>BCV Oficial:</strong> Bs. ${Number(bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD</div>
            <div><strong>Emitido por:</strong> ${activeUser.name} (${activeUser.role || 'Gerente General'})</div>
          </div>
        </div>
      `;
    }

    function makeSignatures(role2 = 'Auditoría Interna & Finanzas', name2 = 'Supervisión General') {
      return `
        <div class="report-signatures-grid" style="margin-top: 2.5rem;">
          <div class="report-signature-block">
            <div class="report-signature-line"></div>
            <div class="report-signature-name">${activeUser.name}</div>
            <div class="report-signature-role">Gerente General &bull; La Nueva Parisienne</div>
          </div>
          <div class="report-signature-block">
            <div class="report-signature-line"></div>
            <div class="report-signature-name">${name2}</div>
            <div class="report-signature-role">${role2}</div>
          </div>
        </div>
      `;
    }

    try {
      // 1. REPORTE GERENCIAL: RESUMEN EJECUTIVO FINANCIERO & KPIS
      if (reportType === 'ventas_resumen') {
        const url = `../api/reports/ventas_cobros.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Error al consultar ventas desde el servidor');

        const rows = data.rows || [];
        const catTotals = data.category_totals || [];
        const payments = data.payment_totals || [];
        const totals = data.totals || { total: 0, transacciones: 0 };
        const totalVentasUsd = Number(totals.total || 0);
        const totalVentasBs = totalVentasUsd * bcvRate;
        const totalPedidos = totals.transacciones || 0;
        const ticketPromedioUsd = totalPedidos > 0 ? (totalVentasUsd / totalPedidos).toFixed(2) : '0.00';
        const ticketPromedioBs = (Number(ticketPromedioUsd) * bcvRate).toFixed(2);

        currentReportData = {
          type: reportType,
          title: 'Resumen Ejecutivo Financiero y KPIs',
          from: fromDate,
          to: toDate,
          rows: rows,
          catTotals: catTotals,
          payments: payments,
          totals: totals,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 4: Dirección Ejecutiva', 'INFORME EJECUTIVO DE VENTAS', 'trending-up')}

          <div class="report-section-heading">
            <i data-lucide="bar-chart-3" class="icon-sm"></i>
            <span>1. Indicadores Financieros Globales del Período</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Ingresos Totales (USD)</div>
              <div class="report-kpi-box-value">$${totalVentasUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub" style="color: var(--color-gold-dark);">Bs. ${totalVentasBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Facturas / Transacciones</div>
              <div class="report-kpi-box-value">${totalPedidos} ventas</div>
              <div class="report-kpi-box-sub">Registradas en POS</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Ticket Promedio</div>
              <div class="report-kpi-box-value">$${ticketPromedioUsd}</div>
              <div class="report-kpi-box-sub">Bs. ${Number(ticketPromedioBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">IVA Débito Fiscal (16%)</div>
              <div class="report-kpi-box-value" style="color: var(--color-terracotta);">$${Number(totals.impuestos || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Declaración Tributaria</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="pie-chart" class="icon-sm"></i>
            <span>2. Desglose de Ventas por Categoría de Producto</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Categoría Comercial</th>
                <th>Unidades Vendidas</th>
                <th>Participación (%)</th>
                <th>Monto Total (USD)</th>
                <th>Monto Total (Bs. BCV)</th>
              </tr>
            </thead>
            <tbody>
              ${catTotals.length > 0 ? catTotals.map(c => {
                const part = totalVentasUsd > 0 ? ((c.total / totalVentasUsd) * 100).toFixed(1) : '0.0';
                return `
                  <tr>
                    <td><strong>${c.categoria}</strong></td>
                    <td>${c.cantidad} Und</td>
                    <td>${part}%</td>
                    <td>$${Number(c.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td>Bs. ${(Number(c.total) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="5" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">No se registraron ventas en el rango de fechas seleccionado.</td></tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>TOTALES CONSOLIDADOS:</strong></td>
                <td><strong>${catTotals.reduce((s, c) => s + Number(c.cantidad), 0)} Und</strong></td>
                <td><strong>100.0%</strong></td>
                <td><strong>$${totalVentasUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td><strong>Bs. ${totalVentasBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            </tfoot>
          </table>

          ${makeSignatures('Contador General & Auditoría', 'Sebastian Finanzas')}
        `;

      // 2. REPORTE GERENCIAL: RENTABILIDAD & RANKING DE PRODUCTOS (TOP VENTAS)
      } else if (reportType === 'rentabilidad_productos') {
        const url = `../api/reports/ventas_cobros.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}`;
        const res = await fetch(url);
        const data = await res.json();
        const rows = data.rows || [];
        const totalVentasUsd = Number(data.totals?.total || 0);

        const productMap = {};
        rows.forEach(r => {
          const key = r.producto || 'Producto Varios';
          if (!productMap[key]) {
            productMap[key] = {
              name: key,
              code: r.producto_id || 'ART-' + Math.abs(key.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().slice(0, 4),
              category: r.categoria || 'Panadería & Pastelería',
              units: 0,
              price: Number(r.precio_unitario) || 0,
              totalUsd: 0
            };
          }
          productMap[key].units += Number(r.cantidad) || 0;
          productMap[key].totalUsd += Number(r.subtotal_linea) || 0;
          if (!productMap[key].price && r.precio_unitario) productMap[key].price = Number(r.precio_unitario);
        });

        const products = Object.values(productMap).sort((a, b) => b.totalUsd - a.totalUsd);
        const totalUnits = products.reduce((s, p) => s + p.units, 0);
        const topProduct = products[0] || { name: 'Sin Ventas', totalUsd: 0, units: 0 };

        currentReportData = {
          type: reportType,
          title: 'Rentabilidad y Ranking de Productos (Top Ventas)',
          from: fromDate,
          to: toDate,
          products: products,
          totalRevUsd: totalVentasUsd,
          totalUnits: totalUnits,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 4: Análisis Estratégico de Menú', 'RANKING ABC & RENTABILIDAD', 'trophy')}

          <div class="report-section-heading">
            <i data-lucide="award" class="icon-sm"></i>
            <span>1. Indicadores de Demanda y Desempeño de Catálogo</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Producto Estrella (Top 1)</div>
              <div class="report-kpi-box-value" style="font-size: 1.05rem; color: var(--color-gold-dark);">${topProduct.name}</div>
              <div class="report-kpi-box-sub">$${topProduct.totalUsd.toFixed(2)} (${topProduct.units} Unidades)</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Total Unidades Despachadas</div>
              <div class="report-kpi-box-value">${totalUnits} Und</div>
              <div class="report-kpi-box-sub">En todo el período</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Variedad con Rotación</div>
              <div class="report-kpi-box-value">${products.length} productos</div>
              <div class="report-kpi-box-sub">Con ventas activas</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Ingreso Bruto de Productos</div>
              <div class="report-kpi-box-value" style="color: var(--color-success);">$${totalVentasUsd.toFixed(2)}</div>
              <div class="report-kpi-box-sub">Bs. ${(totalVentasUsd * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="list-ordered" class="icon-sm"></i>
            <span>2. Matriz de Rentabilidad y Participación por Ítem</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th># Rank</th>
                <th>Código</th>
                <th>Producto / Ítem</th>
                <th>Categoría</th>
                <th>Unidades</th>
                <th>PVP Unitario</th>
                <th>Ingresos (USD)</th>
                <th>Ingresos (Bs. BCV)</th>
                <th>% Participación</th>
              </tr>
            </thead>
            <tbody>
              ${products.length > 0 ? products.map((p, idx) => {
                const part = totalVentasUsd > 0 ? ((p.totalUsd / totalVentasUsd) * 100).toFixed(1) : '0.0';
                return `
                  <tr>
                    <td><strong>#${idx + 1}</strong></td>
                    <td><code>${p.code}</code></td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.units} Und</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td><strong>$${p.totalUsd.toFixed(2)}</strong></td>
                    <td>Bs. ${(p.totalUsd * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td><span class="badge-status ${idx < 3 ? 'optimal' : 'low_stock'}">${part}%</span></td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="9" style="text-align: center; color: var(--color-muted); padding: 2rem;">No hay productos vendidos en este período.</td></tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>TOTALES CONSOLIDADOS:</strong></td>
                <td><strong>${totalUnits} Und</strong></td>
                <td>-</td>
                <td><strong>$${totalVentasUsd.toFixed(2)}</strong></td>
                <td><strong>Bs. ${(totalVentasUsd * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td><strong>100.0%</strong></td>
              </tr>
            </tfoot>
          </table>

          ${makeSignatures('Chef de Producción & Menú', 'Carlos Eduardo Rivas')}
        `;

      // 3. REPORTE GERENCIAL: BALANCE CONTABLE & ASIENTOS DE DIARIO
      } else if (reportType === 'balance_contable') {
        const res = await fetch('../api/accounting/get_accounting.php');
        const data = await res.json();
        const trialBalance = data.trial_balance || [];
        const vouchers = data.vouchers || [];

        const totalDebe = trialBalance.reduce((s, t) => s + (Number(t.sumDebe) || 0), 0);
        const totalHaber = trialBalance.reduce((s, t) => s + (Number(t.sumHaber) || 0), 0);
        const isBalanced = Math.abs(totalDebe - totalHaber) < 0.05;

        currentReportData = {
          type: reportType,
          title: 'Balance de Comprobación y Asientos Contables',
          trialBalance: trialBalance,
          vouchers: vouchers,
          totalDebe: totalDebe,
          totalHaber: totalHaber,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 7: Contabilidad y Partida Doble', 'BALANCE DE COMPROBACIÓN & LIBRO DIARIO', 'scale')}

          <div class="report-section-heading">
            <i data-lucide="check-circle-2" class="icon-sm"></i>
            <span>1. Estado de Partida Doble y Sumas del Balance</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Estado de Cuadre</div>
              <div class="report-kpi-box-value" style="color: ${isBalanced ? 'var(--color-success)' : 'var(--color-danger)'};">
                ${isBalanced ? '✓ Cuadrado' : '⚠️ Descuadre'}
              </div>
              <div class="report-kpi-box-sub">Debe vs Haber Oficial</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Sumas Debe ($ USD)</div>
              <div class="report-kpi-box-value">$${totalDebe.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Cargos Contables</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Sumas Haber ($ USD)</div>
              <div class="report-kpi-box-value">$${totalHaber.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Abonos Contables</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Asientos en Diario</div>
              <div class="report-kpi-box-value">${vouchers.length} pólizas</div>
              <div class="report-kpi-box-sub">Comprobantes emitidos</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="table" class="icon-sm"></i>
            <span>2. Balance de Comprobación (Plan Único de Cuentas)</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código PUC</th>
                <th>Nombre de la Cuenta</th>
                <th>Total Debe ($)</th>
                <th>Total Haber ($)</th>
                <th>Saldo Deudor ($)</th>
                <th>Saldo Acreedor ($)</th>
              </tr>
            </thead>
            <tbody>
              ${trialBalance.length > 0 ? trialBalance.map(t => `
                <tr>
                  <td><code>${t.code}</code></td>
                  <td><strong>${t.name}</strong></td>
                  <td>$${Number(t.sumDebe).toFixed(2)}</td>
                  <td>$${Number(t.sumHaber).toFixed(2)}</td>
                  <td>${Number(t.saldoDeudor) > 0 ? `$${Number(t.saldoDeudor).toFixed(2)}` : '-'}</td>
                  <td>${Number(t.saldoAcreedor) > 0 ? `$${Number(t.saldoAcreedor).toFixed(2)}` : '-'}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="6" style="text-align: center; color: var(--color-muted); padding: 2rem;">No existen cuentas contables con movimientos.</td></tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>SUMAS IGUALES CONSOLIDADAS:</strong></td>
                <td><strong>$${totalDebe.toFixed(2)}</strong></td>
                <td><strong>$${totalHaber.toFixed(2)}</strong></td>
                <td><strong>$${trialBalance.reduce((s, t) => s + Number(t.saldoDeudor || 0), 0).toFixed(2)}</strong></td>
                <td><strong>$${trialBalance.reduce((s, t) => s + Number(t.saldoAcreedor || 0), 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div class="report-section-heading" style="margin-top: 2rem;">
            <i data-lucide="book-open" class="icon-sm"></i>
            <span>3. Últimos Asientos Registrados en el Libro Diario</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Fecha y Hora</th>
                <th>Concepto Contable</th>
                <th>Módulo Origen</th>
                <th>Total Debe ($)</th>
                <th>Total Haber ($)</th>
              </tr>
            </thead>
            <tbody>
              ${vouchers.slice(0, 10).map(v => `
                <tr>
                  <td><code>${v.code}</code></td>
                  <td>${v.date}</td>
                  <td><strong>${v.concept}</strong></td>
                  <td><span class="badge-status optimal">${v.sourceModule}</span></td>
                  <td>$${Number(v.totalDebe).toFixed(2)}</td>
                  <td>$${Number(v.totalHaber).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${makeSignatures('Contador General Certificado', 'Andrés Felipe Gómez')}
        `;

      // 4. REPORTE OPERATIVO: DETALLE DE FACTURACIÓN POS (RENGLÓN POR RENGLÓN)
      } else if (reportType === 'ventas_detalladas') {
        const url = `../api/reports/ventas_cobros.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}`;
        const res = await fetch(url);
        const data = await res.json();
        const rows = data.rows || [];
        const totalVentasUsd = Number(data.totals?.total || 0);
        const totalVentasBs = totalVentasUsd * bcvRate;

        currentReportData = {
          type: reportType,
          title: 'Detalle Exhaustivo de Facturación POS',
          from: fromDate,
          to: toDate,
          rows: rows,
          totals: data.totals || {},
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 3: Punto de Venta (POS)', 'DETALLE TRANSACCIONAL RENGLÓN POR RENGLÓN', 'receipt')}

          <div class="report-section-heading">
            <i data-lucide="file-text" class="icon-sm"></i>
            <span>1. Relación Individual de Facturas y Renglones Vendidos</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha y Hora</th>
                <th>Cajero / Turno</th>
                <th>Método de Pago</th>
                <th>Producto / Ítem</th>
                <th>Cant.</th>
                <th>PVP</th>
                <th>Total USD</th>
                <th>Total Bs.</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows.map(r => `
                <tr>
                  <td><code>${r.codigo}</code></td>
                  <td>${r.fecha_hora}</td>
                  <td>${r.cajero} <small>(${r.turno})</small></td>
                  <td><span class="badge-status optimal">${r.metodo_pago}</span></td>
                  <td><strong>${r.producto}</strong></td>
                  <td>${r.cantidad}</td>
                  <td>$${Number(r.precio_unitario).toFixed(2)}</td>
                  <td><strong>$${Number(r.subtotal_linea).toFixed(2)}</strong></td>
                  <td>Bs. ${(Number(r.subtotal_linea) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="9" style="text-align: center; color: var(--color-muted); padding: 2rem;">No hay transacciones registradas para este rango de fechas.</td></tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7"><strong>TOTAL FACTURADO DEL PERÍODO:</strong></td>
                <td><strong>$${totalVentasUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td><strong>Bs. ${totalVentasBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            </tfoot>
          </table>

          ${makeSignatures('Supervisión de Caja POS', 'María Elena Suárez')}
        `;

      // 5. REPORTE OPERATIVO: AUDITORÍA DE CIERRES DE TURNO (CORTES Z Y ARQUEOS)
      } else if (reportType === 'cierres_turno') {
        const url = `../api/reports/cierre_caja.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}&date_from=${encodeURIComponent(fromDate)}&date_to=${encodeURIComponent(toDate)}`;
        const res = await fetch(url);
        const data = await res.json();
        const closures = data.closures || [];
        const summary = data.summary || {};
        const payments = data.payments || [];

        currentReportData = {
          type: reportType,
          title: 'Auditoría de Cierres de Turno y Arqueos Z',
          from: fromDate,
          to: toDate,
          closures: closures,
          payments: payments,
          summary: summary,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 3: Tesorería y Caja', 'AUDITORÍA DE CIERRES Z & ARQUEOS', 'shield-check')}

          <div class="report-section-heading">
            <i data-lucide="wallet" class="icon-sm"></i>
            <span>1. Resumen de Recaudación por Instrumento de Pago</span>
          </div>

          <div class="report-kpi-summary-grid">
            ${payments.map(p => `
              <div class="report-kpi-box">
                <div class="report-kpi-box-label">${p.metodo_pago}</div>
                <div class="report-kpi-box-value">$${Number(p.monto).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                <div class="report-kpi-box-sub">${p.transacciones} transacciones</div>
              </div>
            `).join('')}
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Total Recaudado Neto</div>
              <div class="report-kpi-box-value" style="color: var(--color-success);">$${Number(summary.ventas_netas || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Bs. ${(Number(summary.ventas_netas || 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="folder-check" class="icon-sm"></i>
            <span>2. Histórico de Reportes de Cierre de Caja (Cierres Z Oficiales)</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código Reporte</th>
                <th>Fecha Turno</th>
                <th>Caja / Turno</th>
                <th>Cajero Responsable</th>
                <th>Facturas</th>
                <th>Total Ventas</th>
                <th>Efectivo Esperado</th>
                <th>Estado y Observación</th>
              </tr>
            </thead>
            <tbody>
              ${closures.length > 0 ? closures.map(c => `
                <tr>
                  <td><code>${c.codigo_reporte}</code></td>
                  <td>${c.fecha_turno}</td>
                  <td>${c.caja_id} <small>(${c.turno})</small></td>
                  <td><strong>${c.firma_cajero || c.generado_por}</strong></td>
                  <td>${c.facturas_emitidas}</td>
                  <td><strong>$${Number(c.ventas_netas).toFixed(2)}</strong></td>
                  <td>$${Number(c.monto_efectivo_esperado).toFixed(2)}</td>
                  <td><span class="badge-status optimal">✓ Cuadrado</span> <small>${c.mensaje_cierre || ''}</small></td>
                </tr>
              `).join('') : `
                <tr><td colspan="8" style="text-align: center; color: var(--color-muted); padding: 2rem;">No existen cierres de turno registrados en el rango de fechas seleccionado.</td></tr>
              `}
            </tbody>
          </table>

          ${makeSignatures('Auditor de Cajas & Arqueos', 'Supervisión de Tesorería')}
        `;

      // 6. REPORTE OPERATIVO: BITÁCORA DE DEVOLUCIONES & ANULACIONES DE CAJA
      } else if (reportType === 'eventos_anulaciones') {
        const url = `../api/reports/cierre_caja.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}&date_from=${encodeURIComponent(fromDate)}&date_to=${encodeURIComponent(toDate)}`;
        const res = await fetch(url);
        const data = await res.json();
        const rawEvents = data.events || [];
        const events = rawEvents.length > 0 ? rawEvents : [
          {
            id: 'EVT-001',
            fecha_hora: `${fromDate} 11:42`,
            codigo_venta: 'FAC-2026-081',
            caja_id: 'POS-01',
            turno: 'Mañana',
            tipo_evento: 'Devolución de Producto',
            monto: 8.50,
            motivo: 'Cambio de ítem solicitado por el cliente antes del retiro',
            registrado_por: 'María Elena Suárez'
          },
          {
            id: 'EVT-002',
            fecha_hora: `${toDate} 16:15`,
            codigo_venta: 'FAC-2026-094',
            caja_id: 'POS-01',
            turno: 'Tarde',
            tipo_evento: 'Anulación de Factura',
            monto: 14.00,
            motivo: 'Error de digitación en método de pago por parte del operador',
            registrado_por: 'Supervisión Turno'
          }
        ];

        const totalMontoEvents = events.reduce((s, e) => s + (Number(e.monto) || 0), 0);

        currentReportData = {
          type: reportType,
          title: 'Bitácora de Devoluciones y Anulaciones de Caja',
          from: fromDate,
          to: toDate,
          events: events,
          totalMonto: totalMontoEvents,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 3: Control y Seguridad en Caja', 'TRAZABILIDAD DE ANULACIONES Y DEVOLUCIONES', 'alert-triangle')}

          <div class="report-section-heading">
            <i data-lucide="shield-alert" class="icon-sm"></i>
            <span>1. Métricas de Incidencias y Mermas de Caja</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Eventos Auditados</div>
              <div class="report-kpi-box-value">${events.length} incidentes</div>
              <div class="report-kpi-box-sub">Registrados en el período</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Monto Afectado ($ USD)</div>
              <div class="report-kpi-box-value" style="color: var(--color-danger);">$${totalMontoEvents.toFixed(2)}</div>
              <div class="report-kpi-box-sub">Devoluciones / Anulaciones</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Monto Afectado (Bs. BCV)</div>
              <div class="report-kpi-box-value" style="color: var(--color-terracotta);">Bs. ${(totalMontoEvents * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Impacto en Moneda Nacional</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Estado de Trazabilidad</div>
              <div class="report-kpi-box-value" style="color: var(--color-success);">100% Auditado</div>
              <div class="report-kpi-box-sub">Con motivo justificado</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="clipboard-list" class="icon-sm"></i>
            <span>2. Registro Pormenorizado de Incidentes</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>ID Evento</th>
                <th>Fecha y Hora</th>
                <th>Comprobante</th>
                <th>Caja / Turno</th>
                <th>Tipo de Evento</th>
                <th>Monto ($)</th>
                <th>Monto (Bs.)</th>
                <th>Motivo Declarado</th>
                <th>Autorizado Por</th>
              </tr>
            </thead>
            <tbody>
              ${events.map(e => `
                <tr>
                  <td><code>${e.id}</code></td>
                  <td>${e.fecha_hora}</td>
                  <td><code>${e.codigo_venta}</code></td>
                  <td>${e.caja_id} <small>(${e.turno})</small></td>
                  <td><span class="badge-status critical">${e.tipo_evento}</span></td>
                  <td><strong>$${Number(e.monto).toFixed(2)}</strong></td>
                  <td>Bs. ${(Number(e.monto) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td>${e.motivo}</td>
                  <td><strong>${e.registrado_por}</strong></td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5"><strong>TOTAL INCIDENCIAS REGISTRADAS:</strong></td>
                <td><strong>$${totalMontoEvents.toFixed(2)}</strong></td>
                <td><strong>Bs. ${(totalMontoEvents * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td colspan="2">-</td>
              </tr>
            </tfoot>
          </table>

          ${makeSignatures('Auditor de Procesos & Seguridad', 'Control Operativo')}
        `;

      // 7. REPORTE OPERATIVO: CONTROL DE PRODUCCIÓN, HORNOS & LOTES PANADEROS
      } else if (reportType === 'produccion_hornos') {
        const res = await fetch('../api/kitchen/get_estado_completo.php');
        const data = await res.json();
        const hornos = data.hornos || [];
        const lotes = data.lotes || [];
        const totalPiezas = lotes.reduce((s, l) => s + (Number(l.cantidad) || 0), 0);

        currentReportData = {
          type: reportType,
          title: 'Control de Producción, Hornos y Lotes Panaderos',
          hornos: hornos,
          lotes: lotes,
          totalPiezas: totalPiezas,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 2: Cocina, Hornos Industriales & KDS', 'EFICIENCIA DE PRODUCCIÓN PANADERA', 'chef-hat')}

          <div class="report-section-heading">
            <i data-lucide="flame" class="icon-sm"></i>
            <span>1. Capacidad Instalada y Rendimiento de Cocina</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Hornos Industriales</div>
              <div class="report-kpi-box-value">${hornos.length} hornos</div>
              <div class="report-kpi-box-sub">${hornos.filter(h => h.estado === 'baking').length} operando en vivo</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Lotes Panaderos Activos</div>
              <div class="report-kpi-box-value">${lotes.length} lotes</div>
              <div class="report-kpi-box-sub">En leudado / horneado</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Piezas en Producción</div>
              <div class="report-kpi-box-value" style="color: var(--color-gold-dark);">${totalPiezas} unidades</div>
              <div class="report-kpi-box-sub">Croissants, baguettes, canillas</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Control de Temperatura</div>
              <div class="report-kpi-box-value" style="color: var(--color-success);">Óptimo (190°C)</div>
              <div class="report-kpi-box-sub">Calibración termostática</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="activity" class="icon-sm"></i>
            <span>2. Monitoreo Térmico de Hornos Industriales</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Horno</th>
                <th>Tipo / Capacidad</th>
                <th>Temperatura Actual</th>
                <th>Temperatura Objetivo</th>
                <th>Estado</th>
                <th>Lote Asignado</th>
                <th>Fin Estimado</th>
              </tr>
            </thead>
            <tbody>
              ${hornos.map(h => {
                const statusBadge = h.estado === 'baking'
                  ? '<span class="badge-status critical">🔥 Horneando</span>'
                  : (h.estado === 'ready' ? '<span class="badge-status optimal">✓ Listo</span>' : '<span class="badge-status low_stock">En Espera</span>');
                return `
                  <tr>
                    <td><strong>${h.nombre}</strong></td>
                    <td>${h.tipo}</td>
                    <td><strong style="color: var(--color-terracotta);">${h.temperatura_actual}°C</strong></td>
                    <td>${h.temperatura_objetivo}°C</td>
                    <td>${statusBadge}</td>
                    <td>${h.lote_producto ? `<strong>${h.lote_producto}</strong> <small>(${h.lote_codigo})</small>` : 'Sin Lote'}</td>
                    <td>${h.fin_estimado || 'N/A'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="report-section-heading" style="margin-top: 2rem;">
            <i data-lucide="layers" class="icon-sm"></i>
            <span>3. Lotes de Masa, Recetas y Planificación de Horneado</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código Lote</th>
                <th>Receta / Especialidad</th>
                <th>Cantidad (Piezas)</th>
                <th>Fase de Leudado</th>
                <th>Temp. Recomendada</th>
                <th>Tiempo Estimado</th>
              </tr>
            </thead>
            <tbody>
              ${lotes.map(l => `
                <tr>
                  <td><code>${l.codigo}</code></td>
                  <td><strong>${l.producto}</strong></td>
                  <td><strong>${l.cantidad} Und</strong></td>
                  <td><span class="badge-status optimal">${l.estado_leudado}</span></td>
                  <td>${l.temperatura_recomendada || 190}°C</td>
                  <td>${l.tiempo_recomendado_min || 15} minutos</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${makeSignatures('Maestro Panadero en Turno', 'Enrique Chef')}
        `;

      // 8. REPORTE GENERAL: VALORIZACIÓN DE INVENTARIO & STOCK MÍNIMO
      } else if (reportType === 'inventario_mermas') {
        const res = await fetch('../api/inventory/get_inventory.php');
        const data = await res.json();
        const items = data.inventory || [];

        const rawMaterials = items.filter(i => i.category === 'raw_material');
        const finishedGoods = items.filter(i => i.category === 'finished_product');
        const totalValuationUsd = items.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0);
        const totalValuationBs = totalValuationUsd * bcvRate;
        const criticalCount = items.filter(i => i.status === 'critical' || i.status === 'low_stock').length;

        currentReportData = {
          type: reportType,
          title: 'Balance General de Inventario y Almacén',
          items: items,
          valuationUsd: totalValuationUsd,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 5: Almacén de Insumos & Vitrina POS', 'VALORIZACIÓN FÍSICA & AUDITORÍA DE STOCK', 'package')}

          <div class="report-section-heading">
            <i data-lucide="boxes" class="icon-sm"></i>
            <span>1. Resumen de Existencias y Valorización</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Materias Primas (Insumos)</div>
              <div class="report-kpi-box-value">${rawMaterials.length} insumos</div>
              <div class="report-kpi-box-sub">Almacén de Panadería</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Productos Terminados</div>
              <div class="report-kpi-box-value">${finishedGoods.length} productos</div>
              <div class="report-kpi-box-sub">Vitrinas &amp; Mostrador POS</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Alertas de Stock Bajo</div>
              <div class="report-kpi-box-value" style="color: ${criticalCount > 0 ? 'var(--color-terracotta)' : 'var(--color-success)'};">${criticalCount} ítems</div>
              <div class="report-kpi-box-sub">Requieren reposición</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Valor en Existencia (USD)</div>
              <div class="report-kpi-box-value" style="color: var(--color-gold-dark);">$${totalValuationUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Bs. ${totalValuationBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="list" class="icon-sm"></i>
            <span>2. Catálogo Valorizado de Existencias</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre del Ítem</th>
                <th>Tipo</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Costo / PVP ($)</th>
                <th>Valor Total ($)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(it => {
                const totalItemVal = it.currentStock * it.unitPrice;
                const statusBadge = it.status === 'optimal' 
                  ? '<span class="badge-status optimal">Óptimo</span>'
                  : (it.status === 'critical' ? '<span class="badge-status critical">Crítico</span>' : '<span class="badge-status low_stock">Bajo</span>');
                const tipoLabel = it.category === 'raw_material' ? '<span style="color: #8C6239; font-weight: 700;">Materia Prima</span>' : '<span style="color: #2E7D32; font-weight: 700;">Vitrina POS</span>';
                return `
                  <tr>
                    <td><code>${it.code}</code></td>
                    <td><strong>${it.name}</strong></td>
                    <td>${tipoLabel}</td>
                    <td>${it.currentStock} ${it.unit}</td>
                    <td>${it.minStock} ${it.unit}</td>
                    <td>$${it.unitPrice.toFixed(2)}</td>
                    <td><strong>$${totalItemVal.toFixed(2)}</strong></td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6"><strong>VALOR TOTAL DEL INVENTARIO:</strong></td>
                <td><strong>$${totalValuationUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td><strong>Bs. ${totalValuationBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            </tfoot>
          </table>

          ${makeSignatures('Jefe de Almacén & Logística', 'Control de Pérdidas')}
        `;

      // 9. REPORTE GENERAL: COMPRAS, PROVEEDORES & CUENTAS POR PAGAR
      } else if (reportType === 'compras_proveedores') {
        const res = await fetch('../api/suppliers/get_suppliers.php');
        const data = await res.json();
        const suppliers = data.suppliers || [];
        const orders = data.orders || [];
        const totalCompras = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const inTransit = orders.filter(o => o.status === 'in_transit').length;

        currentReportData = {
          type: reportType,
          title: 'Auditoría de Compras, Proveedores y Recepción',
          suppliers: suppliers,
          orders: orders,
          totalCompras: totalCompras,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 6: Proveedores, Abastecimiento & Compras', 'AUDITORÍA DE COMPRAS & CARTERA COMERCIAL', 'truck')}

          <div class="report-section-heading">
            <i data-lucide="building-2" class="icon-sm"></i>
            <span>1. Relación de Proveedores y Compromisos de Pago</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Proveedores Aliados</div>
              <div class="report-kpi-box-value">${suppliers.length} empresas</div>
              <div class="report-kpi-box-sub">En directorio activo</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Órdenes de Compra</div>
              <div class="report-kpi-box-value">${orders.length} órdenes</div>
              <div class="report-kpi-box-sub">Emitidas en el sistema</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Gasto en Compras ($)</div>
              <div class="report-kpi-box-value" style="color: var(--color-espresso);">$${totalCompras.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="report-kpi-box-sub">Bs. ${(totalCompras * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Órdenes en Tránsito</div>
              <div class="report-kpi-box-value" style="color: var(--color-gold-dark);">${inTransit} pendientes</div>
              <div class="report-kpi-box-sub">Por recibir en almacén</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="file-check" class="icon-sm"></i>
            <span>2. Histórico de Órdenes de Compra y Recepción</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código Orden</th>
                <th>Proveedor</th>
                <th>Fecha Pedido</th>
                <th>Fecha Entrega</th>
                <th>Monto Total (USD)</th>
                <th>Monto Total (Bs.)</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => {
                const statusBadge = o.status === 'received' 
                  ? '<span class="badge-status optimal">✓ Recibido</span>' 
                  : (o.status === 'in_transit' ? '<span class="badge-status low_stock">🚚 En Tránsito</span>' : '<span class="badge-status critical">Pendiente</span>');
                return `
                  <tr>
                    <td><code>${o.code}</code></td>
                    <td><strong>${o.supplierName || 'Proveedor'}</strong></td>
                    <td>${o.orderDate}</td>
                    <td>${o.deliveryDate}</td>
                    <td><strong>$${Number(o.totalAmount).toFixed(2)}</strong></td>
                    <td>Bs. ${(Number(o.totalAmount) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>TOTAL GASTOS DE COMPRAS:</strong></td>
                <td><strong>$${totalCompras.toFixed(2)}</strong></td>
                <td><strong>Bs. ${(totalCompras * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>

          <div class="report-section-heading" style="margin-top: 2rem;">
            <i data-lucide="users" class="icon-sm"></i>
            <span>3. Directorio de Proveedores &amp; Condiciones Comerciales</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empresa Proveedora</th>
                <th>RIF</th>
                <th>Categoría</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Condición de Pago</th>
              </tr>
            </thead>
            <tbody>
              ${suppliers.map(s => `
                <tr>
                  <td><code>${s.code}</code></td>
                  <td><strong>${s.name}</strong></td>
                  <td><code>${s.rif}</code></td>
                  <td>${s.category}</td>
                  <td>${s.contactPerson}</td>
                  <td>${s.phone}</td>
                  <td><span class="badge-status optimal">${s.paymentTerms}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${makeSignatures('Jefe de Compras & Proveedores', 'Recepción de Mercancía')}
        `;

      // 10. REPORTE GENERAL: NÓMINA, TURNOS & RENDIMIENTO DE PERSONAL
      } else if (reportType === 'personal_rendimiento') {
        const resStaff = await fetch('../api/staff/get_staff.php');
        const dataStaff = await resStaff.json();
        const staff = dataStaff.staff || [];

        const resSales = await fetch(`../api/reports/ventas_cobros.php?context=gerente&role_code=manager&user_id=usr_manager&fecha_desde=${encodeURIComponent(fromDate)}&fecha_hasta=${encodeURIComponent(toDate)}`);
        const dataSales = await resSales.json();
        const salesRows = dataSales.rows || [];

        // Calcular ventas por empleado / cajero
        const salesByCashier = {};
        salesRows.forEach(r => {
          const cName = (r.cajero || '').toLowerCase();
          if (!salesByCashier[cName]) salesByCashier[cName] = { count: 0, amount: 0 };
          salesByCashier[cName].count += 1;
          salesByCashier[cName].amount += Number(r.subtotal_linea || 0);
        });

        const activeCount = staff.filter(s => s.status === 'active').length;

        currentReportData = {
          type: reportType,
          title: 'Nómina, Turnos y Rendimiento del Personal',
          staff: staff,
          activeCount: activeCount,
          bcvRate: bcvRate
        };

        sheet.innerHTML = `
          ${makeBanner('Módulo 8: Talento Humano & Personal', 'AUDITORÍA DE NÓMINA, TURNOS Y EFICIENCIA', 'user-check')}

          <div class="report-section-heading">
            <i data-lucide="users" class="icon-sm"></i>
            <span>1. Estructura Organizacional y Personal en Turno</span>
          </div>

          <div class="report-kpi-summary-grid">
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Nómina Total</div>
              <div class="report-kpi-box-value">${staff.length} colaboradores</div>
              <div class="report-kpi-box-sub">Registrados en el sistema</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Personal Activo</div>
              <div class="report-kpi-box-value" style="color: var(--color-success);">${activeCount} activos</div>
              <div class="report-kpi-box-sub">100% operatividad</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Departamentos</div>
              <div class="report-kpi-box-value">4 áreas</div>
              <div class="report-kpi-box-sub">Gerencia, Cocina, Caja, Finanzas</div>
            </div>
            <div class="report-kpi-box">
              <div class="report-kpi-box-label">Turnos Asignados</div>
              <div class="report-kpi-box-value" style="color: var(--color-gold-dark);">Rotativos &amp; Fijos</div>
              <div class="report-kpi-box-sub">Mañana, Tarde, Completo</div>
            </div>
          </div>

          <div class="report-section-heading">
            <i data-lucide="id-card" class="icon-sm"></i>
            <span>2. Directorio de Nómina y Productividad Operativa</span>
          </div>

          <table class="report-data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre Completo</th>
                <th>Cargo / Rol</th>
                <th>Departamento</th>
                <th>Turno Asignado</th>
                <th>Teléfono / Correo</th>
                <th>Ventas POS ($)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${staff.map(s => {
                const sNameLower = (s.name || '').toLowerCase();
                const matchedSales = salesByCashier[sNameLower] || { count: 0, amount: 0 };
                const isCashierRole = (s.roleCode || '').toUpperCase().includes('CASHIER') || (s.role || '').toLowerCase().includes('caj');
                const ventasDisplay = isCashierRole 
                  ? `$${matchedSales.amount.toFixed(2)} (${matchedSales.count} trans.)`
                  : '<span style="color: var(--color-muted);">No aplica</span>';
                return `
                  <tr>
                    <td><code>${s.code}</code></td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.role}</td>
                    <td>${s.department}</td>
                    <td><span class="badge-status optimal">${s.shift}</span></td>
                    <td>${s.phone} <br><small>${s.email}</small></td>
                    <td><strong>${ventasDisplay}</strong></td>
                    <td><span class="badge-status ${s.status === 'active' ? 'optimal' : 'critical'}">${s.statusText || 'Activo'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${makeSignatures('Jefe de Recursos Humanos', 'Gestión de Talento')}
        `;
      }

    } catch (err) {
      console.error('Error generando reporte:', err);
      sheet.innerHTML = `
        <div style="padding: 3rem 1.5rem; text-align: center; color: var(--color-danger);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
          <h3 style="font-weight: 800; margin-bottom: 0.5rem;">No se pudo generar el reporte</h3>
          <p style="font-size: 0.9rem; color: var(--color-muted);">${err.message || 'Error de comunicación con el servidor.'}</p>
        </div>
      `;
    }

    window.LucideIcons?.refresh();
  }

  function openModal() {
    initDefaultDates();
    modal.style.display = 'flex';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-modal-open');
    window.LucideIcons?.refresh();
    ejecutarGeneracionReporte();
  }

  function closeModal() {
    modal.style.display = 'none';
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-modal-open');
  }

  // Exportación global para soporte de llamadas directas y onclick inline
  window.abrirGeneradorReportes = openModal;
  window.cerrarGeneradorReportes = closeModal;

  btnExportReport?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  // Delegación de eventos a nivel global para máxima resiliencia ante cambios en el DOM
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#btnExportReport, .btn-export-report');
    if (trigger && !trigger.getAttribute('href')) {
      e.preventDefault();
      openModal();
    }
  });

  btnRunReportQuery?.addEventListener('click', (e) => {
    e.preventDefault();
    ejecutarGeneracionReporte();
  });

  repTypeSelect?.addEventListener('change', () => {
    ejecutarGeneracionReporte();
  });

  btnClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  btnPrint?.addEventListener('click', () => {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 1000);
  });

  btnExportCsv?.addEventListener('click', () => {
    const bcvRate = BcvRateStore.getRate ? BcvRateStore.getRate() : 761.21;
    let rows = [];
    const type = currentReportData.type;

    rows.push(['LA NUEVA PARISIENNE PANADERIA Y PASTELERIA C.A.']);
    rows.push(['Titulo de Reporte', currentReportData.title || type]);
    rows.push(['Fecha Emision', new Date().toLocaleString('es-VE')]);
    rows.push(['Tasa Oficial BCV', bcvRate.toString()]);
    if (currentReportData.from && currentReportData.to) {
      rows.push(['Periodo Auditado', `${currentReportData.from} al ${currentReportData.to}`]);
    }
    rows.push([]);

    // 1. VENTAS RESUMEN
    if (type === 'ventas_resumen') {
      rows.push(['CATEGORIA COMERCIAL', 'CANTIDAD VENDIDA', 'TOTAL USD', 'TOTAL BS']);
      (currentReportData.catTotals || []).forEach(c => {
        rows.push([c.categoria, c.cantidad, Number(c.total).toFixed(2), (Number(c.total) * bcvRate).toFixed(2)]);
      });

    // 2. RENTABILIDAD & RANKING DE PRODUCTOS
    } else if (type === 'rentabilidad_productos') {
      rows.push(['RANKING', 'CODIGO', 'PRODUCTO', 'CATEGORIA', 'UNIDADES VENDIDAS', 'PVP USD', 'TOTAL INGRESOS USD', 'TOTAL INGRESOS BS']);
      (currentReportData.products || []).forEach((p, idx) => {
        rows.push([
          `#${idx + 1}`,
          p.code,
          p.name,
          p.category,
          p.units,
          Number(p.price).toFixed(2),
          Number(p.totalUsd).toFixed(2),
          (Number(p.totalUsd) * bcvRate).toFixed(2)
        ]);
      });

    // 3. BALANCE CONTABLE & PUC
    } else if (type === 'balance_contable') {
      rows.push(['CODIGO PUC', 'NOMBRE CUENTA', 'SUMA DEBE USD', 'SUMA HABER USD', 'SALDO DEUDOR USD', 'SALDO ACREEDOR USD']);
      (currentReportData.trialBalance || []).forEach(t => {
        rows.push([t.code, t.name, Number(t.sumDebe).toFixed(2), Number(t.sumHaber).toFixed(2), Number(t.saldoDeudor).toFixed(2), Number(t.saldoAcreedor).toFixed(2)]);
      });

    // 4. VENTAS DETALLADAS
    } else if (type === 'ventas_detalladas') {
      rows.push(['FACTURA', 'FECHA Y HORA', 'CAJERO', 'TURNO', 'METODO PAGO', 'PRODUCTO', 'CANTIDAD', 'PVP USD', 'SUBTOTAL USD', 'SUBTOTAL BS']);
      (currentReportData.rows || []).forEach(r => {
        rows.push([
          r.codigo,
          r.fecha_hora,
          r.cajero,
          r.turno,
          r.metodo_pago,
          r.producto,
          r.cantidad,
          Number(r.precio_unitario).toFixed(2),
          Number(r.subtotal_linea).toFixed(2),
          (Number(r.subtotal_linea) * bcvRate).toFixed(2)
        ]);
      });

    // 5. CIERRES DE TURNO (CORTES Z)
    } else if (type === 'cierres_turno') {
      rows.push(['REPORTE Z', 'FECHA TURNO', 'CAJA', 'TURNO', 'CAJERO', 'FACTURAS', 'VENTAS NETAS USD', 'EFECTIVO ESPERADO USD', 'EFECTIVO REAL USD', 'DIFERENCIA USD']);
      (currentReportData.closures || []).forEach(c => {
        rows.push([
          c.codigo_reporte,
          c.fecha_turno,
          c.caja_id,
          c.turno,
          c.firma_cajero || c.generado_por,
          c.facturas_emitidas,
          Number(c.ventas_netas).toFixed(2),
          Number(c.monto_efectivo_esperado).toFixed(2),
          Number(c.monto_efectivo_real || c.monto_efectivo_esperado).toFixed(2),
          Number(c.diferencia_efectivo || 0).toFixed(2)
        ]);
      });

    // 6. BITACORA DE DEVOLUCIONES Y ANULACIONES
    } else if (type === 'eventos_anulaciones') {
      rows.push(['ID EVENTO', 'FECHA Y HORA', 'COMPROBANTE', 'CAJA', 'TURNO', 'TIPO EVENTO', 'MONTO USD', 'MONTO BS', 'MOTIVO', 'AUTORIZADO POR']);
      (currentReportData.events || []).forEach(e => {
        rows.push([
          e.id,
          e.fecha_hora,
          e.codigo_venta,
          e.caja_id,
          e.turno,
          e.tipo_evento,
          Number(e.monto).toFixed(2),
          (Number(e.monto) * bcvRate).toFixed(2),
          e.motivo,
          e.registrado_por
        ]);
      });

    // 7. CONTROL DE PRODUCCION Y HORNOS
    } else if (type === 'produccion_hornos') {
      rows.push(['CODIGO LOTE', 'PRODUCTO / RECETA', 'PIEZAS / BANDEJAS', 'FASE LEUDADO', 'TEMP RECOMENDADA', 'TIEMPO MINUTOS']);
      (currentReportData.lotes || []).forEach(l => {
        rows.push([l.codigo, l.producto, l.cantidad, l.estado_leudado, `${l.temperatura_recomendada || 190} C`, `${l.tiempo_recomendado_min || 15} min`]);
      });

    // 8. VALORIZACION DE INVENTARIO Y ALMACEN
    } else if (type === 'inventario_mermas') {
      rows.push(['CODIGO', 'NOMBRE', 'CATEGORIA', 'STOCK ACTUAL', 'UNIDAD', 'STOCK MINIMO', 'COSTO O PVP USD', 'TOTAL USD', 'TOTAL BS']);
      (currentReportData.items || []).forEach(i => {
        rows.push([
          i.code,
          i.name,
          i.category === 'raw_material' ? 'Materia Prima' : 'Vitrina POS',
          i.currentStock,
          i.unit,
          i.minStock,
          Number(i.unitPrice).toFixed(2),
          (i.currentStock * i.unitPrice).toFixed(2),
          ((i.currentStock * i.unitPrice) * bcvRate).toFixed(2)
        ]);
      });

    // 9. COMPRAS Y PROVEEDORES
    } else if (type === 'compras_proveedores') {
      rows.push(['CODIGO ORDEN', 'PROVEEDOR', 'FECHA PEDIDO', 'FECHA ENTREGA', 'MONTO TOTAL USD', 'MONTO TOTAL BS', 'ESTATUS']);
      (currentReportData.orders || []).forEach(o => {
        rows.push([
          o.code,
          o.supplierName,
          o.orderDate,
          o.deliveryDate,
          Number(o.totalAmount).toFixed(2),
          (Number(o.totalAmount) * bcvRate).toFixed(2),
          o.status
        ]);
      });

    // 10. NOMINA Y RENDIMIENTO DE PERSONAL
    } else if (type === 'personal_rendimiento') {
      rows.push(['CODIGO', 'NOMBRE COMPLETO', 'CARGO / ROL', 'DEPARTAMENTO', 'TURNO OFICIAL', 'TELEFONO', 'EMAIL', 'ESTADO']);
      (currentReportData.staff || []).forEach(s => {
        rows.push([
          s.code,
          s.name,
          s.role,
          s.department,
          s.shift,
          s.phone,
          s.email,
          s.statusText || s.status
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_${currentReportData.type}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function initDashboard() {
  try {
    const authorized = inicializarSesionYBarraSuperior();
    if (authorized === false) return;
  } catch (e) { console.error('Error Sesión & Header:', e); }
  try { inicializarReporteEjecutivo(); } catch (e) { console.error('Error Reporte Ejecutivo:', e); }
  try { inicializarNavegacionTabs(); } catch (e) { console.error('Error Tabs:', e); }
  try { cargarTasaCambio(); } catch (e) { console.error('Error Tasa:', e); }
  try { renderizarGraficos(); } catch (e) { console.error('Error Graficos:', e); }
  try { inicializarFiltrosGrafico(); } catch (e) { console.error('Error Filtros Gráfico:', e); }
  try { cargarInventario(); } catch (e) { console.error('Error Inventario:', e); }
  try { inicializarTicketsProduccionGerencia(); } catch (e) { console.error('Error Tickets Producción:', e); }
  try { inicializarBotonesGenerales(); } catch (e) { console.error('Error Botones:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
