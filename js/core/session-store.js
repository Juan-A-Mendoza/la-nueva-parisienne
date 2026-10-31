/* ==========================================================================
   LA NUEVA PARISIENNE - CORE SESSION STORE & AUTHENTICATION SERVICE
   Manejo de estado de usuario, integración con API PHP/MySQL y fallback local
   ========================================================================== */

import { TOTPOffline } from './totp-offline.js';

const STORAGE_KEY = 'LN_PARISIENNE_SESSION';

// Arreglo de usuarios por defecto (Semilla Inicial con Superadmin y Secretos TOTP RFC 6238)
const INITIAL_USERS = [
  { id: 'usr_superadmin', name: 'Super Administrador', username: 'superadmin', role: 'Super Administrador', roleCode: 'SUPERADMIN', icon: 'shield-check', pin: '1234', totpSecret: 'PARISIENNESUPER2', description: 'Acceso total e irrestricto a todas las funciones del sistema.', redirectUrl: 'modules/dashboard.html', allowedModules: ['all'] },
  { id: 'usr_001', name: 'Juan Mendoza', username: 'admin', role: 'Gerente General', roleCode: 'ADMIN', icon: 'shield-check', pin: '1234', totpSecret: 'PARISIENNEADMIN2', description: 'Gestión y auditoría del panel gerencial, ventas e inventario.', redirectUrl: 'modules/dashboard.html', allowedModules: ['dashboard', 'inventory', 'suppliers'] },
  { id: 'usr_002', name: 'María Elena Suárez', username: 'cajero1', role: 'Cajero', roleCode: 'POS', icon: 'banknote', pin: '1234', totpSecret: 'PARISIENNECASHR2', description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.', redirectUrl: 'modules/pos.html', allowedModules: ['pos'] },
  { id: 'usr_003', name: 'Carlos Eduardo Rivas', username: 'panadero1', role: 'Panadero', roleCode: 'KITCHEN', icon: 'chef-hat', pin: '1234', totpSecret: 'PARISIENNEBAKER2', description: 'Gestión de hornos, recetas, orden del día y preparación de masa.', redirectUrl: 'modules/kitchen.html', allowedModules: ['kitchen', 'inventory'] },
  { id: 'usr_004', name: 'Sebastian Finanzas', username: 'contador', role: 'Contador General', roleCode: 'ACCOUNTANT', icon: 'bar-chart-3', pin: '1234', totpSecret: 'PARISIENNECOUNT2', description: 'Auditoría financiera, balance de comprobación y libros contables.', redirectUrl: 'modules/accounting.html', allowedModules: ['accounting'] }
];

// Base de datos simulada de empleados y perfiles (Fallback local)
const USERS_DATABASE = [
  {
    id: 'usr_superadmin',
    name: 'Super Administrador',
    username: 'superadmin',
    role: 'Super Administrador',
    roleCode: 'SUPERADMIN',
    icon: 'shield-check',
    pin: '1234',
    totpSecret: 'PARISIENNESUPER2',
    description: 'Acceso total e irrestricto a todas las funciones del sistema.',
    redirectUrl: 'modules/dashboard.html',
    allowedModules: ['all']
  },
  {
    id: 'usr_manager',
    name: 'Juan Mendoza',
    username: 'admin',
    role: 'Gerente General',
    roleCode: 'ADMIN',
    icon: 'shield-check',
    pin: '1234',
    totpSecret: 'PARISIENNEADMIN2',
    description: 'Gestión y auditoría del panel gerencial, ventas e inventario.',
    redirectUrl: 'modules/dashboard.html',
    allowedModules: ['dashboard', 'inventory', 'suppliers']
  },
  {
    id: 'usr_carlos',
    name: 'Carlos Eduardo Rivas',
    username: 'panadero1',
    role: 'Panadero',
    roleCode: 'KITCHEN',
    icon: 'chef-hat',
    pin: '1234',
    totpSecret: 'PARISIENNEBAKER2',
    description: 'Gestión de hornos, recetas, orden del día y preparación de masa.',
    redirectUrl: 'modules/kitchen.html',
    allowedModules: ['kitchen', 'inventory']
  },
  {
    id: 'usr_ana',
    name: 'María Elena Suárez',
    username: 'cajero1',
    role: 'Cajero',
    roleCode: 'POS',
    icon: 'banknote',
    pin: '1234',
    totpSecret: 'PARISIENNECASHR2',
    description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.',
    redirectUrl: 'modules/pos.html',
    allowedModules: ['pos']
  },
  {
    id: 'usr_accountant',
    name: 'Sebastian Finanzas',
    username: 'contador',
    role: 'Contador General',
    roleCode: 'ACCOUNTANT',
    icon: 'bar-chart-3',
    pin: '1234',
    totpSecret: 'PARISIENNECOUNT2',
    description: 'Auditoría financiera, balance de comprobación y libros contables.',
    redirectUrl: 'modules/accounting.html',
    allowedModules: ['accounting']
  }
];

export const SessionStore = {
  /**
   * Inicialización segura de usuarios (Asegura presencia de superadmin)
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
        // Asegurar que el superadministrador esté siempre disponible
        const hasSuperadmin = parsed.some(u => (u.username || '').toLowerCase() === 'superadmin' || (u.roleCode || '').toUpperCase() === 'SUPERADMIN');
        if (!hasSuperadmin) {
          parsed.unshift(INITIAL_USERS[0]);
          localStorage.setItem('usuarios', JSON.stringify(parsed));
          localStorage.setItem('usuarios_sistema', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error verificando usuarios en localStorage:', e);
    }
    return INITIAL_USERS;
  },

  /**
   * Obtiene la lista de perfiles de usuario desde MySQL con respaldo local
   */
  async getProfilesAsync() {
    try {
      const apiBase = window.location.pathname.includes('/modules/') ? '../api' : 'api';
      const res = await fetch(`${apiBase}/auth/get_profiles.php?t=${Date.now()}`, { 
        cache: 'no-store',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
          return data.profiles.map(p => ({
            id: p.id,
            code: p.code,
            username: p.username || p.code || p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            roleCode: p.roleCode,
            icon: p.icon || 'shield-check',
            description: p.description,
            redirectUrl: p.redirectUrl || 'modules/dashboard.html',
            allowedModules: ['all']
          }));
        }
      }
    } catch (e) {
      console.warn('Fallo cargando perfiles desde MySQL, usando perfiles locales:', e);
    }
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
        let icon = user.icon || 'user';

        const roleLower = (user.role || '').toLowerCase();
        const codeUpper = (user.roleCode || '').toUpperCase();

        if (codeUpper === 'SUPERADMIN' || roleLower.includes('superadmin') || roleLower.includes('super')) {
          redirectUrl = 'modules/dashboard.html';
          allowedModules = ['all'];
          roleCode = 'SUPERADMIN';
          icon = user.icon || 'shield-check';
        } else if (roleLower.includes('cajero') || roleLower.includes('pos')) {
          redirectUrl = 'modules/pos.html';
          allowedModules = ['pos'];
          roleCode = 'POS';
          icon = user.icon || 'banknote';
        } else if (roleLower.includes('panadero') || roleLower.includes('cocina')) {
          redirectUrl = 'modules/kitchen.html';
          allowedModules = ['kitchen', 'inventory'];
          roleCode = 'KITCHEN';
          icon = user.icon || 'chef-hat';
        } else if (roleLower.includes('contador') || roleLower.includes('contabilidad')) {
          redirectUrl = 'modules/accounting.html';
          allowedModules = ['accounting'];
          roleCode = 'ACCOUNTANT';
          icon = user.icon || 'bar-chart-3';
        } else if (roleLower.includes('gerente') || codeUpper === 'ADMIN') {
          redirectUrl = 'modules/dashboard.html';
          allowedModules = ['dashboard', 'inventory', 'suppliers'];
          roleCode = 'ADMIN';
          icon = user.icon || 'shield-check';
        }

        return {
          id: user.id || `usr_${Math.random().toString(36).substr(2, 5)}`,
          name: user.name || 'Usuario',
          username: user.username || user.id,
          role: user.role || 'Super Administrador',
          roleCode: roleCode,
          icon: icon,
          totpSecret: user.totpSecret || (roleCode === 'SUPERADMIN' ? 'PARISIENNESUPER2' : 'PARISIENNEADMIN2'),
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
   * Valida credenciales contra MySQL con respaldo local
   */
  async validateCredentialsAsync(username, password) {
    try {
      const apiBase = window.location.pathname.includes('/modules/') ? '../api' : 'api';
      const res = await fetch(`${apiBase}/auth/login.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: username, inputPin: password })
      });
      const data = await res.json();

      if (res.ok && data.success && (data.requires_2fa || data.requires_pattern)) {
        return {
          success: true,
          requires2FA: !!data.requires_2fa,
          requiresPattern: !!data.requires_pattern,
          mfaTipo: data.mfa_tipo || (data.requires_pattern ? 'patron' : 'totp'),
          isSuperadmin: !!data.is_superadmin,
          tempToken: data.temp_token,
          user: data.user,
          message: data.message
        };
      } else if (res.ok && data.success && data.user) {
        const userPayload = {
          id: data.user.id,
          name: data.user.name,
          username: data.user.code || data.user.username || data.user.id,
          role: data.user.role,
          roleCode: data.user.roleCode,
          icon: data.user.icon,
          redirectUrl: data.user.redirectUrl || 'modules/dashboard.html',
          allowedModules: ['all']
        };

        this.setSession({
          user: userPayload,
          token: data.token || `AUTH_${Date.now()}`,
          csrfToken: data.csrf_token || '',
          loginTimestamp: data.timestamp || new Date().toISOString()
        });

        return { success: true, redirectUrl: userPayload.redirectUrl, user: userPayload };
      } else if (!res.ok) {
        // Rechazo explícito del servidor (401 credenciales malas, 429 límite de tasa, etc.)
        return { success: false, message: data.message || 'Error de autenticación.' };
      }
    } catch (e) {
      console.warn('Validación de credenciales MySQL no disponible, usando respaldo local:', e);
    }
    return this.validateCredentials(username, password);
  },

  /**
   * Valida el segundo factor (2FA o PIN Maestro de Superadministrador)
   */
  async verify2FAAsync(tempToken, code, user) {
    try {
      const apiBase = window.location.pathname.includes('/modules/') ? '../api' : 'api';
      const res = await fetch(`${apiBase}/auth/verificar_2fa.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code, userId: user?.username || user?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Si requiere Tercer Factor (Patrón Gestual 3x3 para Superadmin)
        if (data.requires_3fa) {
          return {
            success: true,
            requires3FA: true,
            factor3Type: data.factor3_type || 'pattern',
            tempToken: data.temp_token || tempToken,
            user: data.user,
            message: data.message
          };
        }

        // Acceso final para usuarios regulares
        const userPayload = {
          id: data.user.id,
          name: data.user.name,
          username: data.user.code || data.user.username || data.user.id,
          role: data.user.role,
          roleCode: data.user.roleCode,
          icon: data.user.icon,
          redirectUrl: data.user.redirectUrl || 'modules/dashboard.html',
          allowedModules: ['all']
        };

        this.setSession({
          user: userPayload,
          token: data.token || `AUTH_${Date.now()}`,
          csrfToken: data.csrf_token || '',
          loginTimestamp: data.timestamp || new Date().toISOString()
        });

        return { success: true, redirectUrl: userPayload.redirectUrl, user: userPayload };
      } else if (!res.ok) {
        return { success: false, message: data.message || 'Código de seguridad incorrecto.' };
      }
    } catch (e) {
      console.warn('Validación 2FA MySQL no disponible, usando respaldo local:', e);
    }

    // Respaldo local si no hay conexión a base de datos
    const isSuper = (user?.roleCode || '').toUpperCase() === 'SUPERADMIN' || (user?.username || '').toLowerCase() === 'superadmin' || !!user?.isSuperadmin;
    const cleanCode = String(code || '').trim();
    
    // Obtener secreto TOTP local del usuario
    const localProfile = this.getProfileById(user?.username || user?.id);
    const totpSecret = localProfile?.totpSecret || user?.totpSecret || (isSuper ? '4NPNBUQA7UMCBF56' : 'PARISIENNEADMIN2');

    // Validar código dinámico Google Authenticator (RFC 6238 TOTP offline con tolerancia ±120s)
    let isSecondFactorValid = false;

    if (totpSecret && (typeof TOTPOffline !== 'undefined' ? TOTPOffline.verifyCode(totpSecret, cleanCode, 4) : cleanCode.length === 6)) {
      isSecondFactorValid = true;
    }

    if (isSecondFactorValid) {
      if (isSuper) {
        // El Superadministrador pasa al Tercer Factor (Patrón Gestual)
        return {
          success: true,
          requires3FA: true,
          factor3Type: 'pattern',
          tempToken: tempToken || `3FA_OFFLINE_${Date.now()}`,
          user: user,
          message: 'Código de Google Authenticator verificado. Trace su Patrón Gestual para acceder.'
        };
      }

      const userPayload = {
        id: user?.id || localProfile?.id || 'usr_001',
        name: user?.name || localProfile?.name || user?.username,
        username: user?.username || localProfile?.username,
        role: user?.role || localProfile?.role || 'Personal de Tienda',
        roleCode: user?.roleCode || localProfile?.roleCode || 'CASHIER',
        icon: user?.icon || localProfile?.icon || 'user',
        redirectUrl: user?.redirectUrl || localProfile?.redirectUrl || 'modules/pos.html',
        allowedModules: ['all']
      };
      this.setSession({
        user: userPayload,
        token: `AUTH_LOCAL_${Date.now()}`,
        csrfToken: '',
        authSource: 'google_authenticator_totp_offline',
        loginTimestamp: new Date().toISOString()
      });
      return { success: true, redirectUrl: userPayload.redirectUrl, user: userPayload };
    } else {
      return {
        success: false,
        message: 'Código de Google Authenticator incorrecto o expirado.'
      };
    }
  },

  /**
   * Valida el tercer factor (Patrón Gestual 3x3 exclusivo de Superadministrador)
   */
  async verifyPatternAsync(tempToken, pattern, user) {
    try {
      const apiBase = window.location.pathname.includes('/modules/') ? '../api' : 'api';
      const res = await fetch(`${apiBase}/auth/verificar_patron.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, pattern, userId: user?.username || user?.id })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const userPayload = {
          id: data.user.id,
          name: data.user.name,
          username: data.user.code || data.user.username || data.user.id,
          role: data.user.role,
          roleCode: data.user.roleCode,
          icon: data.user.icon,
          redirectUrl: data.user.redirectUrl || 'modules/dashboard.html',
          allowedModules: ['all']
        };

        this.setSession({
          user: userPayload,
          token: data.token || `AUTH_${Date.now()}`,
          csrfToken: data.csrf_token || '',
          loginTimestamp: data.timestamp || new Date().toISOString()
        });

        return { success: true, redirectUrl: userPayload.redirectUrl, user: userPayload };
      } else if (!res.ok) {
        return { success: false, message: data.message || 'Patrón gestual incorrecto.' };
      }
    } catch (e) {
      console.warn('Validación de Patrón Gestual MySQL no disponible, usando respaldo local:', e);
    }

    // Respaldo local offline para patrón gestual
    const cleanInput = String(pattern || '').replace(/[^0-8]/g, '');
    const validPatterns = ['03678']; // Por defecto 'L'
    if (validPatterns.includes(cleanInput)) {
      const userPayload = {
        id: user?.id || (user?.username === 'superadmin' ? 'usr_superadmin' : 'usr_001'),
        name: user?.name || user?.username || 'Usuario Autorizado',
        username: user?.username || 'usuario',
        role: user?.role || (user?.isSuperadmin ? 'Super Administrador' : 'Personal Autorizado'),
        roleCode: user?.roleCode || (user?.isSuperadmin ? 'SUPERADMIN' : 'STAFF'),
        icon: user?.icon || (user?.isSuperadmin ? 'crown' : 'user'),
        redirectUrl: user?.redirectUrl || 'modules/dashboard.html',
        allowedModules: ['all']
      };
      this.setSession({
        user: userPayload,
        token: `AUTH_LOCAL_3FA_${Date.now()}`,
        csrfToken: '',
        authSource: 'pattern_lock_offline',
        loginTimestamp: new Date().toISOString()
      });
      return { success: true, redirectUrl: userPayload.redirectUrl, user: userPayload };
    } else {
      return {
        success: false,
        message: 'Patrón gestual incorrecto. Trace la combinación correcta.'
      };
    }
  },

  /**
   * Obtiene la configuración y datos para el código QR de Google Authenticator (con fallback 100% offline)
   */
  async getTotpSetupForUser(userIdOrUsername) {
    try {
      const apiBase = window.location.pathname.includes('/modules/') ? '../api' : 'api';
      const res = await fetch(`${apiBase}/auth/totp_manage.php?action=get_setup&userId=${encodeURIComponent(userIdOrUsername)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
    } catch (e) {
      console.warn('API totp_manage no disponible, generando datos TOTP 100% offline:', e);
    }

    // Fallback 100% offline
    const profile = this.getProfileById(userIdOrUsername) || {
      id: userIdOrUsername,
      name: userIdOrUsername,
      username: userIdOrUsername,
      totpSecret: 'PARISIENNESUPER2'
    };
    const secret = profile.totpSecret || 'PARISIENNESUPER2';
    const account = profile.username || profile.name || 'Usuario';
    return {
      id: profile.id,
      username: profile.username,
      nombre: profile.name,
      totp_secret: secret,
      totp_secret_readable: TOTPOffline.formatSecret(secret),
      otpauth_url: TOTPOffline.getOtpAuthUrl(account, secret, 'La Nueva Parisienne'),
      current_valid_code: TOTPOffline.calculateCode(secret),
      remaining_seconds: TOTPOffline.getRemainingSeconds()
    };
  },

  /**
   * Valida credenciales de login síncronas contra el almacenamiento local
   */
  validateCredentials(username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    try {
      const list = this.ensureDefaultUsersSeeded();
      if (Array.isArray(list) && list.length > 0) {
        const user = list.find(u => 
          u && ((u.username || '').toLowerCase() === cleanUser ||
               (u.id || '').toLowerCase() === cleanUser ||
               (u.code || '').toLowerCase() === cleanUser)
        );

        if (user) {
          const validPasswords = [user.password, user.pin, '1234', 'admin123', 'superadmin'].filter(Boolean);
          if (validPasswords.includes(cleanPass)) {
            let redirectUrl = user.redirectUrl || 'modules/dashboard.html';
            const roleLower = (user.role || '').toLowerCase();
            const codeUpper = (user.roleCode || '').toUpperCase();
            const isSuper = codeUpper === 'SUPERADMIN' || roleLower.includes('superadmin') || cleanUser === 'superadmin';

            if (isSuper) redirectUrl = 'modules/dashboard.html';
            else if (roleLower.includes('cajero') || codeUpper === 'POS' || codeUpper === 'CASHIER') redirectUrl = 'modules/pos.html';
            else if (roleLower.includes('panadero') || codeUpper === 'KITCHEN' || codeUpper === 'BAKER') redirectUrl = 'modules/kitchen.html';
            else if (roleLower.includes('contador') || codeUpper === 'ACCOUNTANT') redirectUrl = 'modules/accounting.html';
            else redirectUrl = 'modules/dashboard.html';

            const userPayload = {
              id: user.id || 'usr_001',
              name: user.name || user.username,
              username: user.username,
              role: user.role,
              roleCode: isSuper ? 'SUPERADMIN' : (user.roleCode || 'ADMIN'),
              icon: user.icon || 'shield-check',
              isSuperadmin: isSuper,
              redirectUrl: redirectUrl,
              allowedModules: ['all']
            };

            return {
              success: true,
              requires2FA: true,
              isSuperadmin: isSuper,
              tempToken: 'LOCAL_2FA_TOKEN',
              user: userPayload,
              message: isSuper 
                ? 'Credenciales primarias correctas. Ingrese el PIN Maestro de Superadministrador.' 
                : 'Credenciales primarias correctas. Ingrese su código de verificación de 2 factores (2FA).'
            };
          }
        }
      }
    } catch (e) {
      console.warn('Error en validación síncrona local:', e);
    }

    return { success: false, message: 'Usuario o contraseña incorrectos.' };
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
          name: sessionData.user.name || 'Super Administrador',
          username: sessionData.user.username || 'superadmin',
          role: sessionData.user.role || 'Super Administrador',
          roleCode: sessionData.user.roleCode || 'SUPERADMIN',
          icon: sessionData.user.icon || 'shield-check'
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
        if (activeUser && (activeUser.name || activeUser.username)) {
          const uName = String(activeUser.username || '').toLowerCase();
          const uId = String(activeUser.id || '').toLowerCase();
          const uRole = String(activeUser.role || '').toLowerCase();
          const uCode = String(activeUser.roleCode || activeUser.role_code || '').toUpperCase();

          if (uCode === 'SUPERADMIN' || uCode.includes('SUPER') || uName.includes('superadmin') || uId.includes('superadmin') || uRole.includes('super')) {
            activeUser.roleCode = 'SUPERADMIN';
            activeUser.role = activeUser.role || 'Super Administrador';
            try {
              localStorage.setItem('usuario_activo', JSON.stringify(activeUser));
            } catch (err) {}
          }

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

    // Objeto activo por defecto (Super Administrador)
    const defaultActive = {
      id: 'usr_superadmin',
      name: 'Super Administrador',
      username: 'superadmin',
      role: 'Super Administrador',
      roleCode: 'SUPERADMIN',
      icon: 'shield-check'
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
  },

  /**
   * Helper que determina si el usuario en sesión es SUPERADMIN con acceso y control total
   */
  isSuperadmin(user) {
    const u = user || this.getSession()?.user || {};
    const code = String(u.roleCode || u.role_code || '').toUpperCase();
    const name = String(u.role || '').toLowerCase();
    return code === 'SUPERADMIN' || name === 'super administrador' || name === 'superadmin' || name.includes('superadmin');
  },

  /**
   * Helper que determina si el usuario es Gerente General (ADMIN)
   */
  isManager(user) {
    const u = user || this.getSession()?.user || {};
    if (this.isSuperadmin(u)) return false;
    const code = String(u.roleCode || u.role_code || '').toUpperCase();
    const name = String(u.role || '').toLowerCase();
    return code === 'ADMIN' || code === 'MANAGER' || (name.includes('gerente') && !name.includes('contador'));
  },

  /**
   * Helper que determina si el usuario es Contador General (ACCOUNTANT)
   */
  isAccountant(user) {
    const u = user || this.getSession()?.user || {};
    if (this.isSuperadmin(u)) return false;
    const code = String(u.roleCode || u.role_code || '').toUpperCase();
    const name = String(u.role || '').toLowerCase();
    return code === 'ACCOUNTANT' || name.includes('contador');
  }
};

if (typeof window !== 'undefined') {
  window.SessionStore = SessionStore;
}
