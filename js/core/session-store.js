/* ==========================================================================
   LA NUEVA PARISIENNE - CORE SESSION STORE & AUTHENTICATION SERVICE
   Manejo de estado de usuario, integración con API PHP/MySQL y fallback local
   ========================================================================== */

const STORAGE_KEY = 'LN_PARISIENNE_SESSION';

// Base de datos simulada de empleados y perfiles (Fallback local)
const USERS_DATABASE = [
  {
    id: 'usr_baker',
    name: 'Enrique',
    role: 'Chef de Cuisine / Maestro Panadero',
    roleCode: 'MAESTRO_PANADERO',
    icon: '👨‍🍳',
    pin: '1234',
    description: 'Gestión de hornos, recetas, orden del día y preparación de masa.',
    redirectUrl: 'modules/kitchen.html',
    allowedModules: ['kitchen', 'inventory']
  },
  {
    id: 'usr_cashier',
    name: 'Henry',
    role: 'Cajero Principal / POS',
    roleCode: 'CAJERO',
    icon: '👨‍💼',
    pin: '1234',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_manager',
    name: 'Juan',
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
    name: 'Sebastian',
    role: 'Contador & Administrador',
    roleCode: 'CONTADOR',
    icon: '📊',
    pin: '1234',
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
   * Valida el PIN ingresado consultando la API PHP / MySQL (asíncrono)
   * con fallback automático a la base local
   */
  async validatePinAsync(userId, inputPin) {
    try {
      const response = await fetch('api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, inputPin })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const sessionData = {
            user: result.user,
            token: result.token,
            loginTimestamp: new Date().toISOString()
          };
          this.setSession(sessionData);
          return { success: true, redirectUrl: result.user.redirectUrl, user: result.user };
        } else {
          return { success: false, message: result.message };
        }
      }
    } catch (err) {
      console.warn('API PHP/MySQL no disponible en servidor estático. Ejecutando fallback local:', err);
    }
    
    // Fallback local síncrono
    return this.validatePin(userId, inputPin);
  },

  /**
   * Valida el PIN ingresado de forma síncrona
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
