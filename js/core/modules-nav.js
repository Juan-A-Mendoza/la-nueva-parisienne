/* ==========================================================================
   LA NUEVA PARISIENNE - SELECTOR DIRECTO DE LOS 4 MÓDULOS (MODULES-NAV.JS)
   Permite al Superadmin entrar y alternar entre los 4 módulos del sistema:
   1. Gerente (Dashboard)
   2. Cajero (POS)
   3. Panadero (Cocina & Hornos)
   4. Contador (Contabilidad & Finanzas)
   ========================================================================== */

import { SessionStore } from './session-store.js';

// LOS 4 MÓDULOS OPERATIVOS PRINCIPALES DEL SISTEMA
export const CORE_MODULES = [
  {
    id: 'gerente',
    role: 'Gerente General',
    title: 'Módulo Gerente',
    path: 'dashboard.html',
    icon: 'shield-check',
    badge: 'Módulo 4 · Dashboard & KPIs',
    desc: 'Panel de control con métricas financieras, inteligencia de negocios, ventas y auditoría global.',
    accent: '#D49B54'
  },
  {
    id: 'cajero',
    role: 'Cajero / POS',
    title: 'Módulo Cajero',
    path: 'pos.html',
    icon: 'banknote',
    badge: 'Módulo 3 · Punto de Venta (POS)',
    desc: 'Facturación directa a clientes, cobros multimoneda ($ USD / Bs. VES), tickets térmicos y arqueos.',
    accent: '#2E7D32'
  },
  {
    id: 'panadero',
    role: 'Panadero / Cocina',
    title: 'Módulo Panadero',
    path: 'kitchen.html',
    icon: 'chef-hat',
    badge: 'Módulo 2 · Producción & Hornos',
    desc: 'Monitoreo de hornos industriales, recetas panaderas, comandas KDS y preparación de masa.',
    accent: '#C85A32'
  },
  {
    id: 'contador',
    role: 'Contador / Finanzas',
    title: 'Módulo Contador',
    path: 'accounting.html',
    icon: 'scale',
    badge: 'Módulo 7 · Contabilidad',
    desc: 'Auditoría contable, asientos de partida doble automáticos, balance de comprobación y libros.',
    accent: '#1565C0'
  }
];

// Módulos administrativos secundarios
export const SECONDARY_MODULES = [
  { id: 'inventory', name: 'Inventario & Stock', path: 'inventory.html', icon: 'package' },
  { id: 'suppliers', name: 'Proveedores & Compras', path: 'suppliers.html', icon: 'truck' },
  { id: 'staff', name: 'Personal & Permisos', path: 'staff.html', icon: 'users' },
  { id: 'configuraciones', name: 'Configuraciones', path: 'configuraciones.html', icon: 'settings' },
  { id: 'settings', name: 'Ajustes del Sistema', path: 'settings.html', icon: 'sliders-horizontal' }
];

// MATRIZ ESTRICTA DE PERMISOS POR PÁGINA (SOLO SUPERADMIN TIENE ACCESO TOTAL)
export const PAGE_PERMISSIONS = {
  'dashboard.html': ['SUPERADMIN', 'ADMIN'],
  'pos.html': ['SUPERADMIN', 'CASHIER', 'POS'],
  'kitchen.html': ['SUPERADMIN', 'BAKER', 'KITCHEN'],
  'accounting.html': ['SUPERADMIN', 'ACCOUNTANT'],
  'inventory.html': ['SUPERADMIN', 'ADMIN', 'BAKER', 'KITCHEN'],
  'suppliers.html': ['SUPERADMIN', 'ADMIN'],
  'staff.html': ['SUPERADMIN'],
  'configuraciones.html': ['SUPERADMIN'],
  'settings.html': ['SUPERADMIN']
};

/**
 * Control estricto de acceso por URL para evitar accesos cruzados entre departamentos
 */
function enforceAccessControl(activeUser, currentPath) {
  const roleCode = String(activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const roleName = String(activeUser.role || '').toLowerCase();
  const isSuperadmin = roleCode === 'SUPERADMIN' || roleName === 'super administrador' || roleName === 'superadmin' || roleName.includes('superadmin');

  // El Superadmin tiene acceso irrestricto y control total de todo
  if (isSuperadmin) return true;

  const allowedRoles = PAGE_PERMISSIONS[currentPath];
  if (allowedRoles && !allowedRoles.includes(roleCode)) {
    console.warn(`[Seguridad] Acceso no autorizado a ${currentPath} para rol ${roleCode}. Redirigiendo a módulo asignado.`);
    let homeUrl = 'dashboard.html';
    if (roleCode === 'ACCOUNTANT' || roleName.includes('contador')) {
      homeUrl = 'accounting.html';
    } else if (roleCode === 'POS' || roleCode === 'CASHIER' || roleName.includes('cajero')) {
      homeUrl = 'pos.html';
    } else if (roleCode === 'BAKER' || roleCode === 'KITCHEN' || roleName.includes('panadero')) {
      homeUrl = 'kitchen.html';
    } else if (roleCode === 'ADMIN' || roleName.includes('gerente')) {
      homeUrl = 'dashboard.html';
    } else {
      homeUrl = '../index.html';
    }
    window.location.replace(homeUrl);
    return false;
  }
  return true;
}

export function initModulesNav() {
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (e) {
    return;
  }

  const activeUser = session?.user || {};
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

  // 1. Control de acceso: ni el contador ni el gerente tienen acceso cruzado a módulos ajenos
  if (!enforceAccessControl(activeUser, currentPath)) {
    return;
  }

  const roleCode = String(activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const roleName = String(activeUser.role || '').toLowerCase();
  const isSuperadmin = roleCode === 'SUPERADMIN' || roleName === 'super administrador' || roleName === 'superadmin' || roleName.includes('superadmin');

  // El selector de los 4 módulos es de uso exclusivo del SUPERADMIN (el único con control total)
  if (!isSuperadmin) {
    document.getElementById('btnGlobalModulesLauncher')?.remove();
    document.getElementById('globalModulesModalOverlay')?.remove();
    return;
  }

  // 1. Crear Modal Overlay enfocado en los 4 módulos
  let modalOverlay = document.getElementById('globalModulesModalOverlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'globalModulesModalOverlay';
    modalOverlay.className = 'modules-modal-overlay';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.setAttribute('aria-hidden', 'true');

    const coreCardsHtml = CORE_MODULES.map(mod => {
      const isCurrent = currentPath === mod.path;
      return `
        <a href="${mod.path}" class="core-module-card ${isCurrent ? 'current-active' : ''}">
          <div class="core-module-header">
            <div class="core-module-icon-box" style="background: linear-gradient(135deg, #2C1D11 0%, #4A3320 100%); border: 1.5px solid ${mod.accent};">
              <i data-lucide="${mod.icon}" class="icon-lg" style="color: ${mod.accent};"></i>
            </div>
            <div class="core-module-meta">
              <span class="core-module-badge" style="color: ${mod.accent};">${mod.badge}</span>
              <h3 class="core-module-title">${mod.title}</h3>
              <span class="core-module-role">Rol: ${mod.role}</span>
            </div>
          </div>
          <p class="core-module-desc">${mod.desc}</p>
          <div class="core-module-footer">
            <span class="core-module-action-text">${isCurrent ? '● Módulo Actual Activo' : `Entrar como ${mod.role}`}</span>
            <span class="core-module-arrow"><i data-lucide="arrow-right" class="icon-sm"></i></span>
          </div>
        </a>
      `;
    }).join('');

    const secondaryLinksHtml = SECONDARY_MODULES.map(sub => {
      const isCurrent = currentPath === sub.path;
      return `
        <a href="${sub.path}" class="secondary-module-pill ${isCurrent ? 'active' : ''}">
          <i data-lucide="${sub.icon}" class="icon-xs"></i>
          <span>${sub.name}</span>
        </a>
      `;
    }).join('');

    modalOverlay.innerHTML = `
      <div class="modules-modal-card">
        <button type="button" class="modules-modal-close" id="btnCloseModulesModal" aria-label="Cerrar">&times;</button>
        
        <div class="modules-modal-header">
          <h2>
            <i data-lucide="shield-alert" class="icon-lg" style="color: #6A1B9A;"></i>
            <span>Acceso a los 4 Módulos del Sistema</span>
            <span style="font-size: 0.72rem; background: #6A1B9A; color: #FFF; padding: 0.2rem 0.65rem; border-radius: 999px; font-weight: 800; margin-left: 0.5rem; letter-spacing: 0.04em;">SUPERADMIN TOTAL</span>
          </h2>
          <p>Seleccione directamente a cuál de los 4 departamentos desea ingresar. No necesita volver a iniciar sesión.</p>
        </div>

        <div class="core-modules-grid">
          ${coreCardsHtml}
        </div>

        <div class="secondary-modules-bar">
          <span class="secondary-modules-label"><i data-lucide="layers" class="icon-xs"></i> Otros módulos de gestión:</span>
          <div class="secondary-modules-list">
            ${secondaryLinksHtml}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Eventos de Cierre
    const closeBtn = document.getElementById('btnCloseModulesModal');
    closeBtn?.addEventListener('click', closeModulesModal);

    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModulesModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModulesModal();
      }
    });
  }

  function openModulesModal() {
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    window.LucideIcons?.refresh();
  }

  function closeModulesModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  window.abrirLauncherModulos = openModulesModal;

  // 2. Inyectar Botón Launcher en la Barra de Navegación del Módulo
  const container = document.querySelector('.dashboard-controls') || 
                    document.querySelector('.navbar-controls') || 
                    document.querySelector('.pos-user-bar') ||
                    document.querySelector('.dashboard-navbar .navbar-container') ||
                    document.querySelector('header .navbar-container');

  if (container && !document.getElementById('btnGlobalModulesLauncher')) {
    const launcherBtn = document.createElement('button');
    launcherBtn.id = 'btnGlobalModulesLauncher';
    launcherBtn.type = 'button';
    launcherBtn.className = 'btn-modules-launcher is-superadmin';
    launcherBtn.title = 'Entrar a los 4 Módulos: Gerente, Cajero, Panadero y Contador';
    launcherBtn.innerHTML = `
      <i data-lucide="shield-alert" class="icon-sm"></i>
      <span>4 Módulos (Superadmin)</span>
    `;

    launcherBtn.addEventListener('click', openModulesModal);

    // Insertar antes del botón de Salir o al final
    const logoutBtn = container.querySelector('#logoutBtn');
    if (logoutBtn) {
      container.insertBefore(launcherBtn, logoutBtn);
    } else {
      container.appendChild(launcherBtn);
    }

    window.LucideIcons?.refresh();
  }
}

// Inicializar automáticamente si el documento ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModulesNav);
} else {
  initModulesNav();
}
