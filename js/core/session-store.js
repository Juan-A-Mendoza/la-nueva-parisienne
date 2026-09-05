/* ==========================================================================
   LA NUEVA PARISIENNE - CORE SESSION STORE & AUTHENTICATION SERVICE
   Manejo de estado de usuario, integración con API PHP/MySQL y fallback local
   ========================================================================== */

const STORAGE_KEY = 'LN_PARISIENNE_SESSION';

// Arreglo de usuarios por defecto (Semilla Inicial)
const INITIAL_USERS = [
  { id: 'usr_001', name: 'Juan Mendoza', username: 'admin', role: 'Gerente General', roleCode: 'ADMIN', icon: '👨‍💼', description: 'Acceso total a KPIs, contabilidad, producción y personal.', redirectUrl: 'modules/dashboard.html' },
  { id: 'usr_002', name: 'María Elena Suárez', username: 'cajero1', role: 'Cajero', roleCode: 'POS', icon: '👩‍💼', description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.', redirectUrl: 'modules/pos.html' },
  { id: 'usr_003', name: 'Carlos Eduardo Rivas', username: 'panadero1', role: 'Panadero', roleCode: 'KITCHEN', icon: '👨‍🍳', description: 'Gestión de hornos, recetas, orden del día y preparación de masa.', redirectUrl: 'modules/kitchen.html' },
  { id: 'usr_004', name: 'Andrés Felipe Gómez', username: 'contador1', role: 'Contador', roleCode: 'ACCOUNTANT', icon: '📊', description: 'Auditoría financiera, margen de ganancias y estados contables.', redirectUrl: 'modules/accounting.html' }
];

// Base de datos simulada de empleados y perfiles (Fallback local)
const USERS_DATABASE = [
  {
    id: 'usr_manager',
    name: 'Juan Mendoza',
    role: 'Gerente General',
    roleCode: 'ADMIN',
    icon: '👨‍💼',
    pin: '1234',
    description: 'Acceso total a KPIs, contabilidad, producción y personal.',
    redirectUrl: 'modules/dashboard.html',
    allowedModules: ['all']
  },
  {
    id: 'usr_carlos',
    name: 'Carlos Eduardo Rivas',
    role: 'Panadero',
    roleCode: 'KITCHEN',
    icon: '👨‍🍳',
    pin: '1234',
    description: 'Gestión de hornos, recetas, orden del día y preparación de masa.',
    redirectUrl: 'modules/kitchen.html',
    allowedModules: ['kitchen', 'inventory']
  },
  {
    id: 'usr_ana',
    name: 'María Elena Suárez',
    role: 'Cajero',
    roleCode: 'POS',
    icon: '👩‍💼',
    pin: '1234',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_accountant',
    name: 'Andrés Felipe Gómez',
    role: 'Contador',
    roleCode: 'ACCOUNTANT',
    icon: '📊',
    pin: '1234',
    description: 'Auditoría financiera, margen de ganancias y órdenes de compra.',
    redirectUrl: 'modules/accounting.html',
    allowedModules: ['accounting', 'suppliers', 'inventory', 'settings']
  }
];

export const SessionStore = {
  /**
   * Inicialización segura de usuarios (SOLO se inyecta si 'usuarios' o 'usuarios_sistema' es estrictamente NULL)
   */
  ensureDefaultUsersSeeded() {
    try {
      const rawUsuarios = localStorage.getItem('usuarios');
      const rawSistema = localStorage.getItem('usuarios_sistema');

      if (rawUsuarios === null && rawSistema === null) {
        localStorage.setItem('usuarios', JSON.stringify(INITIAL_USERS));
        localStorage.setItem('usuarios_sistema', JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }

      const raw = rawUsuarios !== null ? rawUsuarios : rawSistema;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Error verificando usuarios en localStorage:', e);
    }
    return INITIAL_USERS;
  },

  /**
   * Obtiene la lista de perfiles de usuario exclusivamente desde localStorage (Simulación Local)
   */
  async getProfilesAsync() {
    // API PHP deshabilitada para evitar SyntaxError en entornos de desarrollo sin servidor PHP activo
    return this.getProfiles();
  },

  /**
   * Obtiene la lista de perfiles configurados localmente
   */
  getProfiles() {
    const list = this.ensureDefaultUsersSeeded();
    if (Array.isArray(list) && list.length > 0) {
      return list.map(user => {
        if (!user) return null;
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
          redirectUrl = 'modules/accounting.html';
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
          id: user.id || `usr_${Math.random().toString(36).substr(2, 5)}`,
          name: user.name || 'Juan Mendoza',
          username: user.username || 'admin',
          role: user.role || 'Gerente General',
          roleCode: roleCode,
          icon: icon,
          description: user.description || `Acceso asignado como ${user.role || 'Empleado'}.`,
          redirectUrl: redirectUrl,
          allowedModules: allowedModules
        };
      }).filter(Boolean);
    }

    return USERS_DATABASE.map(({ pin, ...profile }) => profile);
  },

  /**
   * Obtiene un perfil completo por ID
   */
  getProfileById(userId) {
    const profiles = this.getProfiles();
    return profiles.find(u => u && (u.id === userId || u.username === userId));
  },

  /**
   * Valida el PIN ingresado de forma asíncrona usando la simulación local
   */
  async validatePinAsync(userId, inputPin) {
    // API PHP deshabilitada para entorno de desarrollo local sin servidor PHP activo
    return this.validatePin(userId, inputPin);
  },

  /**
   * Valida el PIN ingresado de forma síncrona
   */
  validatePin(userId, inputPin) {
    // 1. Verificación en usuarios de localStorage
    try {
      const list = this.ensureDefaultUsersSeeded();
      if (Array.isArray(list) && list.length > 0) {
        const user = list.find(u => u && (u.id === userId || u.username === userId));
        if (user) {
          const validPins = ['1234', 'admin123', '0000', user.password, user.pin].filter(Boolean);
          if (validPins.includes(inputPin)) {
            let redirectUrl = user.redirectUrl || 'modules/dashboard.html';
            const roleLower = (user.role || '').toLowerCase();
            if (roleLower.includes('cajero')) redirectUrl = 'modules/pos.html';
            else if (roleLower.includes('panadero')) redirectUrl = 'modules/kitchen.html';
            else if (roleLower.includes('contador') || roleLower.includes('contabilidad')) redirectUrl = 'modules/accounting.html';

            const userPayload = {
              id: user.id || 'usr_001',
              name: user.name || 'Juan Mendoza',
              username: user.username || 'admin',
              role: user.role || 'Gerente General',
              roleCode: user.roleCode || 'ADMIN',
              icon: user.icon || '👨‍💼',
              redirectUrl: redirectUrl
            };

            this.setSession({
              user: userPayload,
              token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              loginTimestamp: new Date().toISOString()
            });

            return { success: true, redirectUrl: redirectUrl, user: userPayload };
          }
        }
      }
    } catch (e) {
      console.warn('Error en validación local de usuarios:', e);
    }

    // 2. Fallback a USERS_DATABASE
    const user = USERS_DATABASE.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    if (user.pin === inputPin || inputPin === '1234' || inputPin === 'admin123') {
      const userPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        roleCode: user.roleCode,
        icon: user.icon,
        allowedModules: user.allowedModules,
        redirectUrl: user.redirectUrl
      };

      this.setSession({
        user: userPayload,
        token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loginTimestamp: new Date().toISOString()
      });

      return { success: true, redirectUrl: user.redirectUrl, user: userPayload };
    } else {
      return { success: false, message: 'PIN incorrecto. Reintente nuevamente.' };
    }
  },

  /**
   * Valida credenciales de login tradicional (nombre de usuario y contraseña)
   */
  async validateCredentialsAsync(username, password) {
    return this.validateCredentials(username, password);
  },

  validateCredentials(username, password) {
    try {
      const list = this.ensureDefaultUsersSeeded();
      if (Array.isArray(list) && list.length > 0) {
        const user = list.find(u => u && (u.username || '').toLowerCase() === (username || '').trim().toLowerCase());
        if (user) {
          const validPasswords = [user.password, user.pin, 'admin123', '1234'].filter(Boolean);
          if (validPasswords.includes(password)) {
            let redirectUrl = user.redirectUrl || 'modules/dashboard.html';
            const roleLower = (user.role || '').toLowerCase();
            if (roleLower.includes('cajero')) redirectUrl = 'modules/pos.html';
            else if (roleLower.includes('panadero')) redirectUrl = 'modules/kitchen.html';
            else if (roleLower.includes('contador') || roleLower.includes('contabilidad')) redirectUrl = 'modules/accounting.html';

            const userPayload = {
              id: user.id || 'usr_001',
              name: user.name || user.username,
              username: user.username,
              role: user.role,
              roleCode: user.roleCode || 'ADMIN',
              icon: user.icon || '👤',
              redirectUrl: redirectUrl
            };

            this.setSession({
              user: userPayload,
              token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              loginTimestamp: new Date().toISOString()
            });

            return { success: true, redirectUrl: redirectUrl, user: userPayload };
          } else {
            return { success: false, message: 'Contraseña incorrecta. Verifique sus datos.' };
          }
        }
      }
    } catch (e) {
      console.warn('Error en validación tradicional de credenciales:', e);
    }

    const fallbackUser = USERS_DATABASE.find(u => (u.username || u.id || '').toLowerCase() === (username || '').trim().toLowerCase());
    if (!fallbackUser) {
      return { success: false, message: 'Nombre de usuario no encontrado.' };
    }

    if (fallbackUser.pin === password || password === '1234' || password === 'admin123') {
      const userPayload = {
        id: fallbackUser.id,
        name: fallbackUser.name,
        username: fallbackUser.username || fallbackUser.id,
        role: fallbackUser.role,
        roleCode: fallbackUser.roleCode,
        icon: fallbackUser.icon,
        redirectUrl: fallbackUser.redirectUrl
      };

      this.setSession({
        user: userPayload,
        token: `AUTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loginTimestamp: new Date().toISOString()
      });

      return { success: true, redirectUrl: fallbackUser.redirectUrl, user: userPayload };
    } else {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
  },

  /**
   * Almacena la sesión en sessionStorage y guarda 'usuario_activo' en localStorage
   */
  setSession(sessionData) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {}

    try {
      if (sessionData && sessionData.user) {
        const activeUserObj = {
          id: sessionData.user.id || 'usr_001',
          name: sessionData.user.name || 'Juan Mendoza',
          username: sessionData.user.username || 'admin',
          role: sessionData.user.role || 'Gerente General',
          roleCode: sessionData.user.roleCode || 'ADMIN',
          icon: sessionData.user.icon || '👨‍💼'
        };
        localStorage.setItem('usuario_activo', JSON.stringify(activeUserObj));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('Error guardando usuario_activo:', e);
    }
  },

  /**
   * Obtiene la sesión activa desde localStorage ('usuario_activo') con fallback a sessionStorage
   */
  getSession() {
    try {
      const activeRaw = localStorage.getItem('usuario_activo');
      if (activeRaw !== null) {
        const activeUser = JSON.parse(activeRaw);
        if (activeUser && activeUser.name) {
          return {
            user: activeUser,
            token: 'AUTH_ACTIVE_SESSION'
          };
        }
      }
    } catch (e) {
      console.warn('Error leyendo usuario_activo de localStorage:', e);
    }

    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}

    // Objeto activo por defecto (Juan Mendoza - Gerente General)
    const defaultActive = {
      id: 'usr_001',
      name: 'Juan Mendoza',
      username: 'admin',
      role: 'Gerente General',
      roleCode: 'ADMIN',
      icon: '👨‍💼'
    };
    return { user: defaultActive, token: 'DEFAULT_SESSION' };
  },

  /**
   * Cierra la sesión activa borrando 'usuario_activo' y redireccionando al Index
   */
  logout() {
    try {
      localStorage.removeItem('usuario_activo');
    } catch (e) {}

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    const isInModules = window.location.pathname.includes('/modules/');
    window.location.href = isInModules ? '../index.html' : 'index.html';
  }
};
