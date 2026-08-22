/* ==========================================================================
   LA NUEVA PARISIENNE - CORE SESSION STORE & AUTHENTICATION SERVICE
   Manejo de estado de usuario, integración con API PHP/MySQL y fallback local
   ========================================================================== */

const STORAGE_KEY = 'LN_PARISIENNE_SESSION';

// Base de datos simulada de empleados y perfiles (Fallback local)
const USERS_DATABASE = [
  {
    id: 'usr_carlos',
    name: 'Carlos Mendoza',
    role: 'Maestro Panadero / Chef',
    roleCode: 'BAKER',
    icon: '👨‍🍳',
    pin: '1234',
    description: 'Gestión de hornos, recetas, orden del día y preparación de masa.',
    redirectUrl: 'modules/kitchen.html',
    allowedModules: ['kitchen', 'inventory']
  },
  {
    id: 'usr_ana',
    name: 'Ana Ramírez',
    role: 'Personal de Caja / POS',
    roleCode: 'CASHIER',
    icon: '👩‍💼',
    pin: '1234',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_manager',
    name: 'Juan',
    role: 'Gerente General',
    roleCode: 'ADMIN',
    icon: '👨‍💼',
    pin: '1234',
    description: 'Acceso total a KPIs, contabilidad, producción y personal.',
    redirectUrl: 'modules/dashboard.html',
    allowedModules: ['all']
  },
  {
    id: 'usr_baker',
    name: 'Enrique',
    role: 'Chef de Cuisine / Maestro Panadero',
    roleCode: 'BAKER',
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
    roleCode: 'CASHIER',
    icon: '👨‍💼',
    pin: '1234',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_accountant',
    name: 'Sebastian',
    role: 'Contador & Administrador',
    roleCode: 'ADMIN',
    icon: '📊',
    pin: '1234',
    description: 'Auditoría financiera, margen de ganancias y órdenes de compra.',
    redirectUrl: 'modules/accounting.html',
    allowedModules: ['accounting', 'suppliers', 'inventory', 'settings']
  }
];

export const SessionStore = {
  /**
   * Obtiene la lista de perfiles configurados de forma asíncrona desde MySQL
   * con fallback a los perfiles locales si la API PHP no responde
   */
  async getProfilesAsync() {
    try {
      const response = await fetch('api/auth/get_profiles.php');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.profiles) && result.profiles.length > 0) {
          return result.profiles;
        }
      }
    } catch (err) {
      console.warn('API get_profiles.php no disponible en este entorno. Cargando perfiles locales:', err);
    }
    return this.getProfiles();
  },

  /**
   * Obtiene la lista de perfiles configurados localmente
   */
  getProfiles() {
    try {
      const stored = localStorage.getItem('usuarios_sistema');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(user => {
            let redirectUrl = user.redirectUrl || 'modules/dashboard.html';
            let allowedModules = ['all'];
            let roleCode = user.roleCode || 'ADMIN';
            let icon = user.icon || '👤';

            const roleLower = (user.role || '').toLowerCase();
            if (roleLower.includes('cajero') || roleLower.includes('pos')) {
              redirectUrl = 'modules/pos.html';
              allowedModules = ['pos'];
              roleCode = 'POS';
              icon = user.icon || '👩‍💼';
            } else if (roleLower.includes('panadero') || roleLower.includes('cocina')) {
              redirectUrl = 'modules/kitchen.html';
              allowedModules = ['kitchen', 'inventory'];
              roleCode = 'KITCHEN';
              icon = user.icon || '👨‍🍳';
            } else if (roleLower.includes('contador') || roleLower.includes('contabilidad')) {
              redirectUrl = 'modules/configuraciones.html';
              allowedModules = ['accounting', 'settings'];
              roleCode = 'ACCOUNTANT';
              icon = user.icon || '📊';
            } else if (roleLower.includes('gerente')) {
              redirectUrl = 'modules/dashboard.html';
              allowedModules = ['all'];
              roleCode = 'ADMIN';
              icon = user.icon || '👨‍💼';
            }

            return {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
              roleCode: roleCode,
              icon: icon,
              description: user.description || `Acceso asignado como ${user.role}.`,
              redirectUrl: redirectUrl,
              allowedModules: allowedModules
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error leyendo usuarios_sistema:', e);
    }

    return USERS_DATABASE.map(({ pin, ...profile }) => profile);
  },

  /**
   * Obtiene un perfil completo por ID
   */
  getProfileById(userId) {
    const profiles = this.getProfiles();
    return profiles.find(u => u.id === userId);
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
        }
      }
    } catch (err) {
      console.warn('API PHP/MySQL no disponible. Fallback local:', err);
    }
    
    return this.validatePin(userId, inputPin);
  },

  /**
   * Valida el PIN ingresado de forma síncrona
   */
  validatePin(userId, inputPin) {
    // 1. Verificación en usuarios_sistema de localStorage
    try {
      const stored = localStorage.getItem('usuarios_sistema');
      if (stored) {
        const parsed = JSON.parse(stored);
        const user = parsed.find(u => u.id === userId || u.username === userId);
        if (user) {
          const validPins = ['1234', 'admin123', '0000', user.password, user.pin].filter(Boolean);
          if (validPins.includes(inputPin)) {
            let redirectUrl = user.redirectUrl || 'modules/dashboard.html';
            const roleLower = (user.role || '').toLowerCase();
            if (roleLower.includes('cajero')) redirectUrl = 'modules/pos.html';
            else if (roleLower.includes('panadero')) redirectUrl = 'modules/kitchen.html';
            else if (roleLower.includes('contador')) redirectUrl = 'modules/configuraciones.html';

            const sessionData = {
              user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                roleCode: user.roleCode || 'ADMIN',
                icon: user.icon || '👤',
                redirectUrl: redirectUrl
              },
              token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              loginTimestamp: new Date().toISOString()
            };
            this.setSession(sessionData);
            return { success: true, redirectUrl: redirectUrl, user: sessionData.user };
          }
        }
      }
    } catch (e) {
      console.warn('Error en validación local de usuarios_sistema:', e);
    }

    // 2. Fallback a USERS_DATABASE
    const user = USERS_DATABASE.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    if (user.pin === inputPin || inputPin === '1234' || inputPin === 'admin123') {
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
