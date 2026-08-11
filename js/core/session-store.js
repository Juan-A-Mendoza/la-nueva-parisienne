/* ==========================================================================
   LA NUEVA PARISIENNE - CORE SESSION STORE & AUTHENTICATION SERVICE
   Manejo de estado de usuario, credenciales simuladas y matriz de acceso
   ========================================================================== */

const STORAGE_KEY = 'LN_PARISIENNE_SESSION';

// Base de datos simulada de empleados y perfiles
const USERS_DATABASE = [
  {
    id: 'usr_baker',
    name: 'Jean-Luc Dubois',
    role: 'Chef de Cuisine / Maestro Panadero',
    roleCode: 'MAESTRO_PANADERO',
    icon: '👨‍🍳',
    pin: '4321',
    description: 'Gestión de hornos, recetas, orden del día y preparación de masa.',
    redirectUrl: 'modules/kitchen.html',
    allowedModules: ['kitchen', 'inventory']
  },
  {
    id: 'usr_cashier',
    name: 'Élodie Martin',
    role: 'Cajera Principal / POS',
    roleCode: 'CAJERO',
    icon: '👩‍💼',
    pin: '1111',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_manager',
    name: 'Antoine Moreau',
    role: 'Gerente General',
    roleCode: 'GERENTE_GENERAL',
    icon: '👨‍💼',
    pin: '1234',
    description: 'Acceso total a KPIs, contabilidad, producción y personal.',
    redirectUrl: 'modules/dashboard.html',
    allowedModules: ['all']
  },
  {
    id: 'usr_accountant',
    name: 'Sophie Laurent',
    role: 'Contadora & Administradora',
    roleCode: 'CONTADOR',
    icon: '📊',
    pin: '7777',
    description: 'Auditoría financiera, margen de ganancias y órdenes de compra.',
    redirectUrl: 'modules/accounting.html',
    allowedModules: ['accounting', 'suppliers', 'inventory', 'settings']
  }
];

export const SessionStore = {
  /**
   * Obtiene la lista de perfiles configurados
   */
  getProfiles() {
    return USERS_DATABASE.map(({ pin, ...profile }) => profile);
  },

  /**
   * Obtiene un perfil completo por ID
   */
  getProfileById(userId) {
    return USERS_DATABASE.find(u => u.id === userId);
  },

  /**
   * Valida el PIN ingresado por el usuario
   */
  validatePin(userId, inputPin) {
    const user = USERS_DATABASE.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Usuario no encontrado' };
    
    if (user.pin === inputPin) {
      const sessionData = {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          roleCode: user.roleCode,
          icon: user.icon,
          allowedModules: user.allowedModules,
          redirectUrl: user.redirectUrl
        },
        token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loginTimestamp: new Date().toISOString()
      };
      
      this.setSession(sessionData);
      return { success: true, redirectUrl: user.redirectUrl, user: sessionData.user };
    } else {
      return { success: false, message: 'PIN incorrecto. Reintente nuevamente.' };
    }
  },

  /**
   * Almacena la sesión en sessionStorage
   */
  setSession(sessionData) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  },

  /**
   * Obtiene la sesión activa si existe
   */
  getSession() {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Cierra la sesión activa
   */
  logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = '../index.html';
  }
};
