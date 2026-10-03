/* ==========================================================================
   LA NUEVA PARISIENNE - MÓDULO DE ICONOGRAFÍA VECTORIAL PULCRA (ICONS.JS)
   Sustitución universal de emojis por iconos vectoriales limpios (Lucide Icons)
   ========================================================================== */

(function (window) {
  'use strict';

  // Mapa de equivalencias: Emojis / Claves -> Nombre canónico en Lucide (kebab-case)
  const ICON_MAP = {
    // Categorías y Productos de Panadería
    '🥐': 'croissant',
    'croissant': 'croissant',
    'pan': 'croissant',
    'panaderia': 'croissant',
    'cat_panaderia': 'croissant',
    '🥖': 'wheat',
    'baguette': 'wheat',
    '🌾': 'wheat',
    'harina': 'wheat',
    'materia_prima': 'wheat',
    '🍰': 'cake',
    'cake': 'cake',
    'pasteleria': 'cake',
    'cat_pasteleria': 'cake',
    '☕': 'coffee',
    'cafe': 'coffee',
    'cafeteria': 'coffee',
    'cat_cafeteria': 'coffee',
    '🥪': 'utensils',
    'sandwich': 'utensils',
    'especialidades': 'utensils',
    'cat_especialidades': 'utensils',
    '🧈': 'milk',
    'mantequilla': 'milk',
    'lacteos': 'milk',
    '🍫': 'sparkles',
    'chocolate': 'sparkles',
    '📦': 'package',
    'empaque': 'package',
    'lote': 'package',
    '🧁': 'croissant',
    '🫓': 'wheat',
    'focaccia': 'wheat',
    '🍞': 'wheat',

    // Roles, Departamentos y Personal
    '🏢': 'building-2',
    'empresa': 'building-2',
    'gerencia': 'building-2',
    'admin': 'shield-check',
    'gerente': 'shield-check',
    '👨‍💼': 'shield-check',
    '👩‍💼': 'shield-check',
    'rol_gerente': 'shield-check',
    'rol_admin': 'shield-check',
    '💰': 'banknote',
    'caja': 'banknote',
    'cajero': 'banknote',
    'pos': 'banknote',
    'rol_cajero': 'banknote',
    '👨‍🍳': 'chef-hat',
    'chef': 'chef-hat',
    'panadero': 'chef-hat',
    'cocina': 'chef-hat',
    'horno': 'flame',
    'rol_panadero': 'chef-hat',
    '📊': 'bar-chart-3',
    'contador': 'bar-chart-3',
    'contabilidad': 'bar-chart-3',
    'rol_contador': 'bar-chart-3',
    '👥': 'users',
    'staff': 'users',
    'personal': 'users',
    'empleados': 'users',
    '👤': 'user',
    'usuario': 'user',
    'cliente': 'user',

    // Operaciones, Acciones y Estados
    '🧾': 'receipt',
    'factura': 'receipt',
    'asiento': 'receipt',
    '🛒': 'shopping-cart',
    'compra': 'shopping-cart',
    'carrito': 'shopping-cart',
    '🚚': 'truck',
    'transito': 'truck',
    'proveedores': 'truck',
    'proveedor': 'truck',
    '🚛': 'truck',
    '✓': 'check-circle-2',
    'check': 'check-circle-2',
    'success': 'check-circle-2',
    'activo': 'check-circle-2',
    '⚠️': 'alert-triangle',
    'alerta': 'alert-triangle',
    'warning': 'alert-triangle',
    'error': 'alert-circle',
    '🏠': 'home',
    'inicio': 'home',
    'dashboard': 'layout-dashboard',
    '⚙️': 'settings',
    '⚙': 'settings',
    'config': 'settings',
    'configuracion': 'settings',
    'ajustes': 'settings',
    '🔑': 'key-round',
    'pin': 'key-round',
    'clave': 'key-round',
    'password': 'lock',
    'lock': 'lock',
    'candado': 'lock',
    'user': 'user',
    '📄': 'file-text',
    'documento': 'file-text',
    'reporte': 'file-text',
    'reportes': 'file-text',
    'inventario': 'boxes',
    '📅': 'calendar',
    'fecha': 'calendar',
    '🇻🇪': 'coins',
    'bcv': 'coins',
    'tasa': 'coins',
    'dolar': 'dollar-sign',
    '🧹': 'brush',
    'limpiar': 'brush',
    '🔄': 'refresh-cw',
    'recargar': 'refresh-cw',
    'sincronizar': 'refresh-cw',
    '💾': 'save',
    'guardar': 'save',
    '🖨️': 'printer',
    'imprimir': 'printer',
    '✨': 'sparkles',
    'nuevo': 'sparkles',
    '💣': 'alert-octagon',
    'reset': 'alert-octagon',
    '📇': 'contact',
    'directorio': 'contact',
    '📋': 'clipboard-list',
    'pedidos': 'clipboard-list',
    'orden': 'clipboard-list',
    '🛡️': 'shield',
    'seguridad': 'shield',
    'permisos': 'shield',
    '🔍': 'search',
    'buscar': 'search',
    '🚪': 'log-out',
    'salir': 'log-out',
    'logout': 'log-out',
    '🗑️': 'trash-2',
    'eliminar': 'trash-2',
    '✏️': 'edit-3',
    'editar': 'edit-3',
    '🔥': 'flame',
    'horneando': 'flame',
    '⏳': 'clock',
    'tiempo': 'clock',
    '⏱️': 'timer',
    'temperatura': 'thermometer',
    '▲': 'trending-up',
    '▼': 'trending-down',
    '🪪': 'id-card',
    '📝': 'file-edit'
  };

  /**
   * Resuelve el nombre de icono Lucide a partir de un emoji, código o texto
   * @param {string} key 
   * @returns {string} Nombre en kebab-case
   */
  function resolveIcon(key) {
    if (!key) return 'package';
    const trimmed = String(key).trim().toLowerCase();
    if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
    // Limpieza de emojis comunes no indexados directamente
    const cleanKey = trimmed.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    if (cleanKey && ICON_MAP[cleanKey]) return ICON_MAP[cleanKey];
    // Si ya es un nombre Lucide válido (solo letras, números y guiones)
    if (/^[a-z0-9-]+$/.test(trimmed)) return trimmed;
    return 'package';
  }

  /**
   * Genera el HTML de un icono pulcro Lucide
   * @param {string} iconKey - Emoji, nombre de icono o categoría
   * @param {string} [extraClasses=''] - Clases adicionales CSS
   * @param {string} [attrs=''] - Atributos HTML adicionales
   * @returns {string}
   */
  function renderIcon(iconKey, extraClasses = '', attrs = '') {
    const iconName = resolveIcon(iconKey);
    return `<i data-lucide="${iconName}" class="lucide ${extraClasses}" ${attrs} aria-hidden="true"></i>`;
  }

  /**
   * Inicializa / refresca todos los iconos en la página actual
   */
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (err) {
        console.warn('Lucide createIcons warning:', err);
      }
    }
  }

  // Ejecución automática al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshIcons);
  } else {
    refreshIcons();
  }

  // Exportar API global
  window.LucideIcons = {
    resolve: resolveIcon,
    render: renderIcon,
    refresh: refreshIcons
  };

})(window);
