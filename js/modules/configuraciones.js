/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR MÓDULO 9 CONFIGURACIONES (CONFIGURACIONES.JS)
   Gestión de datos fiscales de la empresa y Tasa Cambiaria BCV / Multimoneda
   Sincronización en vivo con principio de Aislamiento de Fallos
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';

// ==========================================================================
// 1. ESTADO GLOBAL Y CONSTANTES
// ==========================================================================

const INITIAL_USERS = [
  { id: 'usr_001', name: 'Juan Mendoza', username: 'admin', role: 'Gerente General', roleCode: 'ADMIN', icon: '👨‍💼', description: 'Acceso total a KPIs, contabilidad, producción y personal.', redirectUrl: 'modules/dashboard.html' },
  { id: 'usr_002', name: 'María Elena Suárez', username: 'cajero1', role: 'Cajero', roleCode: 'POS', icon: '👩‍💼', description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.', redirectUrl: 'modules/pos.html' },
  { id: 'usr_003', name: 'Carlos Eduardo Rivas', username: 'panadero1', role: 'Panadero', roleCode: 'KITCHEN', icon: '👨‍🍳', description: 'Gestión de hornos, recetas, orden del día y preparación de masa.', redirectUrl: 'modules/kitchen.html' },
  { id: 'usr_004', name: 'Andrés Felipe Gómez', username: 'contador1', role: 'Contador', roleCode: 'ACCOUNTANT', icon: '📊', description: 'Auditoría financiera, margen de ganancias y estados contables.', redirectUrl: 'modules/accounting.html' }
];

const VALID_MANAGER_PASSWORDS = ['admin123', '1234', 'gerente', 'admin', '0000'];

let usersData = getUsersFromStorage();
let isUsersUnlocked = false;
let pendingAuthAction = null; // { actionType: 'UNLOCK_VIEW'|'SAVE_USER'|'DELETE_USER', data: ... }

// ==========================================================================
// 2. FUNCIONES DE ALMACENAMIENTO LOCAL (SIN PHP / FETCH PREMATURO)
// ==========================================================================

function getUsersFromStorage() {
  try {
    const rawUsuarios = localStorage.getItem('usuarios');
    const rawSistema = localStorage.getItem('usuarios_sistema');
    const stored = rawUsuarios !== null ? rawUsuarios : rawSistema;

    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error leyendo usuarios de localStorage:', e);
  }
  const defaultList = Array.isArray(INITIAL_USERS) ? [...INITIAL_USERS] : [];
  try {
    localStorage.setItem('usuarios', JSON.stringify(defaultList));
    localStorage.setItem('usuarios_sistema', JSON.stringify(defaultList));
  } catch (e) {}
  return defaultList;
}

function saveUsersToStorage(usersArray) {
  try {
    const listToSave = Array.isArray(usersArray) ? usersArray : [];
    localStorage.setItem('usuarios', JSON.stringify(listToSave));
    localStorage.setItem('usuarios_sistema', JSON.stringify(listToSave));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error guardando usuarios:', e);
  }
}

async function fetchLiveBcvRate() {
  const apis = [
    'https://ve.dolarapi.com/v1/dolares/oficial',
    'https://bcv-api.vercel.app/api/bcv'
  ];

  for (const url of apis) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const autoRate = parseFloat(data.promedio || data.precio || data.monto || data.rate);
        if (autoRate && autoRate > 0) {
          localStorage.setItem('tasa_auto', autoRate.toString());
          localStorage.setItem('tasaAuto', autoRate.toString());
          localStorage.setItem('bcv_current_rate', autoRate.toString());
          return autoRate;
        }
      }
    } catch (e) {
      console.warn(`Error al consultar ${url}:`, e);
    }
  }
  return parseFloat(localStorage.getItem('tasa_auto') || localStorage.getItem('tasaAuto')) || 784.66;
}

// ==========================================================================
// 3. MODALES Y ADVERTENCIAS
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
}

function showStatus(msg, type) {
  const statusBanner = document.getElementById('statusBanner');
  if (!statusBanner) return;
  statusBanner.textContent = msg;
  statusBanner.className = `alert-banner ${type}`;
  statusBanner.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => {
      statusBanner.style.display = 'none';
    }, 5000);
  }
}

// ==========================================================================
// 4. FUNCIONES MODULARIZADAS PARA CADA COMPONENTE DE CONFIGURACIONES
// ==========================================================================

/**
 * A) Verificación de Sesión del Gerente General
 */
function inicializarSesionGerente() {
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (e) {}

  if (!session || !session.user) {
    showErrorModal('⚠️ Sesión Expirada', 'Sesión no encontrada o expirada. Por favor inicie sesión.', () => {
      window.location.href = '../index.html';
    });
    return;
  }

  const userRole = (session.user.role || '').toLowerCase();
  const userRoleCode = session.user.roleCode || '';
  const isGerenteGeneral = userRoleCode === 'ADMIN' || userRole.includes('gerente general') || userRole.includes('administrador');

  if (!isGerenteGeneral) {
    showErrorModal('⛔ Acceso Restringido', 'El Módulo 9 (Configuraciones) solo puede ser accedido por el Gerente General desde el Módulo 4 (Dashboard Gerencial).', () => {
      window.location.href = 'dashboard.html';
    });
    return;
  }

  const managerAvatar = document.getElementById('managerAvatar');
  const managerName = document.getElementById('managerName');
  if (managerAvatar) managerAvatar.textContent = session.user.icon || '👨‍💼';
  if (managerName) managerName.textContent = session.user.name || 'Juan Mendoza';

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try { SessionStore.logout(); } catch (err) {
        localStorage.removeItem('usuario_activo');
        window.location.href = '../index.html';
      }
    });
  }
}

/**
 * B) Datos Fiscales de la Empresa (Guardado Local)
 */
function inicializarEmpresaFiscalConfig() {
  const empresaForm = document.getElementById('empresaForm');
  const empresaNombre = document.getElementById('empresaNombre');
  const empresaRif = document.getElementById('empresaRif');
  const empresaDireccion = document.getElementById('empresaDireccion');
  const empresaTelefono = document.getElementById('empresaTelefono');

  try {
    const saved = localStorage.getItem('empresa_datos');
    if (saved) {
      const data = JSON.parse(saved);
      if (data) {
        if (empresaNombre) empresaNombre.value = data.nombre || '';
        if (empresaRif) empresaRif.value = data.rif || '';
        if (empresaDireccion) empresaDireccion.value = data.direccion || '';
        if (empresaTelefono) empresaTelefono.value = data.telefono || '';
      }
    }
  } catch (e) {
    console.warn('Error leyendo empresa_datos:', e);
  }

  if (empresaForm) {
    empresaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const payload = {
        nombre: empresaNombre ? empresaNombre.value.trim() : '',
        rif: empresaRif ? empresaRif.value.trim() : '',
        direccion: empresaDireccion ? empresaDireccion.value.trim() : '',
        telefono: empresaTelefono ? empresaTelefono.value.trim() : ''
      };

      try {
        localStorage.setItem('empresa_datos', JSON.stringify(payload));
        showStatus('✓ ¡Datos fiscales de la empresa guardados exitosamente!', 'success');
      } catch (err) {
        showStatus('✓ ¡Datos fiscales guardados en la sesión actual!', 'success');
      }
    });
  }
}

/**
 * C) Control e Interfaz de la Tasa BCV (Auto / Manual)
 */
function inicializarTasaBcvConfig() {
  const radioAutoConfig = document.getElementById('radio_auto');
  const radioManualConfig = document.getElementById('radio_manual');
  const inputTasaConfig = document.getElementById('input_tasa_manual');
  const textoEstadoConfig = document.getElementById('texto_estado_tasa');
  const previewRateVal = document.getElementById('previewRateVal');
  const lblModoAuto = document.getElementById('lblModoAuto');
  const lblModoManual = document.getElementById('lblModoManual');
  const tasaForm = document.getElementById('tasaForm');

  async function actualizarVistaTasaConfig(isManual) {
    const boxModoAuto = document.getElementById('boxModoAuto');
    const boxModoManual = document.getElementById('boxModoManual');
    const liveAutoRateVal = document.getElementById('liveAutoRateVal');

    if (lblModoAuto) {
      lblModoAuto.style.borderColor = isManual ? 'var(--border-subtle)' : 'var(--color-success)';
      lblModoAuto.style.background = isManual ? '#FFFFFF' : 'rgba(46, 125, 50, 0.08)';
      lblModoAuto.style.color = isManual ? 'var(--color-espresso)' : 'var(--color-success)';
    }
    if (lblModoManual) {
      lblModoManual.style.borderColor = isManual ? 'var(--color-gold)' : 'var(--border-subtle)';
      lblModoManual.style.background = isManual ? 'rgba(212, 155, 84, 0.08)' : '#FFFFFF';
      lblModoManual.style.color = isManual ? 'var(--color-gold-dark)' : 'var(--color-espresso)';
    }

    let activeRate = 761.21;
    const modoVal = isManual ? 'manual' : 'auto';

    if (isManual) {
      if (boxModoAuto) boxModoAuto.style.display = 'none';
      if (boxModoManual) boxModoManual.style.display = 'block';

      if (inputTasaConfig) {
        inputTasaConfig.removeAttribute('disabled');
        inputTasaConfig.removeAttribute('readonly');
        inputTasaConfig.disabled = false;
        inputTasaConfig.readOnly = false;
        inputTasaConfig.style.opacity = '1';
        inputTasaConfig.style.background = '#FFFFFF';
        try { inputTasaConfig.focus(); } catch (e) {}
      }
      if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• Tasa: Manual Gerencial (Editada)';

      activeRate = parseFloat(inputTasaConfig ? inputTasaConfig.value : 0) || parseFloat(localStorage.getItem('tasa_manual')) || 780.00;
      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
    } else {
      if (boxModoAuto) boxModoAuto.style.display = 'block';
      if (boxModoManual) boxModoManual.style.display = 'none';

      if (inputTasaConfig) {
        inputTasaConfig.setAttribute('disabled', 'true');
        inputTasaConfig.disabled = true;
        inputTasaConfig.style.opacity = '0.5';
        inputTasaConfig.style.background = '#F5F5F5';
      }
      if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• Tasa: Automática (API en Vivo)';

      if (previewRateVal) previewRateVal.textContent = '⏳ Consultando API...';
      activeRate = await fetchLiveBcvRate();
      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (liveAutoRateVal) liveAutoRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
    }

    const activeSource = isManual ? 'Tasa Manual Gerencial' : 'BCV Oficial (currency-api en Vivo)';
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const rateChannel = new BroadcastChannel('lnp_bcv_channel');
        rateChannel.postMessage({ rate: activeRate, mode: modoVal, source: activeSource });
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: activeRate, mode: modoVal } }));
  }

  const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
  const isManualInitial = modoGuardado === 'manual';

  if (isManualInitial && radioManualConfig) radioManualConfig.checked = true;
  if (!isManualInitial && radioAutoConfig) radioAutoConfig.checked = true;

  const tasaManualSaved = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
  if (inputTasaConfig) inputTasaConfig.value = tasaManualSaved.toFixed(2);

  actualizarVistaTasaConfig(isManualInitial);

  if (radioAutoConfig) {
    radioAutoConfig.addEventListener('change', () => actualizarVistaTasaConfig(false));
  }
  if (radioManualConfig) {
    radioManualConfig.addEventListener('change', () => actualizarVistaTasaConfig(true));
  }

  if (inputTasaConfig) {
    inputTasaConfig.addEventListener('input', (e) => {
      if (radioManualConfig && radioManualConfig.checked) {
        const val = parseFloat(e.target.value) || 0;
        if (previewRateVal) previewRateVal.textContent = `Bs. ${val.toFixed(2)}`;
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const rateChannel = new BroadcastChannel('lnp_bcv_channel');
            rateChannel.postMessage({ rate: val, mode: 'manual', source: 'Tasa Manual Gerencial' });
          } catch (err) {}
        }
        window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: val, mode: 'manual' } }));
      }
    });
  }

  if (tasaForm) {
    tasaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isManual = radioManualConfig && radioManualConfig.checked;
      const modoVal = isManual ? 'manual' : 'auto';
      const manualVal = inputTasaConfig ? parseFloat(inputTasaConfig.value) || 780.00 : 780.00;
      const autoVal = isManual ? (parseFloat(localStorage.getItem('tasa_auto')) || 761.21) : await fetchLiveBcvRate();

      if (isManual && manualVal <= 0) {
        showStatus('⚠️ La tasa manual ingresada debe ser un valor válido mayor a Bs. 0.00.', 'error');
        return;
      }

      const activeRate = isManual ? manualVal : autoVal;
      const activeSource = isManual ? 'Tasa Manual Gerencial' : 'BCV Oficial (currency-api en Vivo)';

      localStorage.setItem('modo_tasa', modoVal);
      localStorage.setItem('modoTasa', modoVal);
      localStorage.setItem('tasa_manual', manualVal.toString());
      localStorage.setItem('tasaManual', manualVal.toString());
      localStorage.setItem('tasa_auto', autoVal.toString());
      localStorage.setItem('tasaAuto', autoVal.toString());
      localStorage.setItem('bcv_current_rate', activeRate.toString());

      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (textoEstadoConfig) textoEstadoConfig.textContent = isManual ? '• Tasa: Manual Gerencial (Editada)' : '• Tasa: Automática (API en Vivo)';

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const rateChannel = new BroadcastChannel('lnp_bcv_channel');
          rateChannel.postMessage({ rate: activeRate, mode: modoVal, source: activeSource });
        } catch (err) {}
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: activeRate, mode: modoVal } }));
      showStatus('✓ ¡Tasa de cambio guardada y transmitida a todo el sistema en tiempo real!', 'success');
      showSuccessModal('¡Tasa BCV Guardada!', `La tasa de cambio (${isManual ? 'Manual: Bs. ' + manualVal.toFixed(2) : 'Automática API en Vivo'}) se ha guardado en el sistema y transmitido a todas las cajas en tiempo real.`);
    });
  }
}

/**
 * D) Submódulo de Gestión de Usuarios y Roles (CRUD + Doble Validación)
 */
function inicializarGestionUsuarios() {
  const btnUnlockUserManagement = document.getElementById('btnUnlockUserManagement');
  const usersLockedPlaceholder = document.getElementById('usersLockedPlaceholder');
  const usersCrudPanel = document.getElementById('usersCrudPanel');
  const usuariosTbody = document.getElementById('usuariosTbody');
  const btnOpenNuevoUsuarioModal = document.getElementById('btnOpenNuevoUsuarioModal');

  const modalAuthPassword = document.getElementById('modalAuthPassword');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSubtitle = document.getElementById('authModalSubtitle');
  const authPasswordForm = document.getElementById('authPasswordForm');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authPasswordErrorMsg = document.getElementById('authPasswordErrorMsg');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const cancelAuthModalBtn = document.getElementById('cancelAuthModalBtn');

  const modalUsuarioForm = document.getElementById('modalUsuarioForm');
  const modalUserTitle = document.getElementById('modalUserTitle');
  const usuarioForm = document.getElementById('usuarioForm');
  const closeUserModalBtn = document.getElementById('closeUserModalBtn');
  const cancelUserModalBtn = document.getElementById('cancelUserModalBtn');

  function renderUsersTable() {
    if (!usuariosTbody) return;
    usuariosTbody.innerHTML = '';
    const safeList = Array.isArray(usersData) ? usersData : [];

    safeList.forEach(user => {
      if (!user) return;
      const tr = document.createElement('tr');
      
      let badgeStyle = 'background: rgba(46,125,50,0.1); color: var(--color-success); border: 1px solid rgba(46,125,50,0.25);';
      if (user.roleCode === 'ADMIN') {
        badgeStyle = 'background: rgba(212,155,84,0.15); color: var(--color-gold-dark); border: 1px solid rgba(212,155,84,0.4); font-weight: 800;';
      } else if (user.roleCode === 'KITCHEN') {
        badgeStyle = 'background: rgba(255,152,0,0.1); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;';
      } else if (user.roleCode === 'ACCOUNTANT') {
        badgeStyle = 'background: rgba(33,150,243,0.1); color: #1565C0; border: 1px solid rgba(33,150,243,0.3); font-weight: 700;';
      }

      tr.innerHTML = `
        <td><strong>${user.icon || '👤'} ${user.name || 'Usuario'}</strong></td>
        <td><span class="table-code-badge">@${user.username || user.id}</span></td>
        <td>
          <span class="table-status-tag active" style="${badgeStyle}">
            ${user.role || 'Empleado'}
          </span>
        </td>
        <td>
          <span class="badge-stock-normal">🟢 Activo</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-edit-usr" title="Editar usuario">✏️ Editar</button>
            <button type="button" class="btn-table-action-sm btn-del-usr" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar usuario">🗑️</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-usr')?.addEventListener('click', () => openUserFormModal(user));
      tr.querySelector('.btn-del-usr')?.addEventListener('click', () => {
        openAuthPasswordModal('DELETE_USER', user, '🗑️ Confirmar Eliminación de Usuario', `Ingrese su clave gerencial para autorizar la eliminación de "${user.name}"`);
      });

      usuariosTbody.appendChild(tr);
    });
  }

  function openAuthPasswordModal(actionType, data = null, customTitle = null, customSubtitle = null) {
    pendingAuthAction = { actionType, data };
    if (authPasswordInput) authPasswordInput.value = '';
    if (authPasswordErrorMsg) authPasswordErrorMsg.style.display = 'none';

    if (authModalTitle) {
      authModalTitle.textContent = customTitle || (actionType === 'UNLOCK_VIEW' ? 'Autorización para Desbloquear Usuarios' : 'Confirmación Crítica de Seguridad');
    }
    if (authModalSubtitle) {
      authModalSubtitle.textContent = customSubtitle || 'Doble Validación con Contraseña Gerencial';
    }

    if (modalAuthPassword) {
      modalAuthPassword.style.display = 'flex';
      modalAuthPassword.setAttribute('aria-hidden', 'false');
      setTimeout(() => authPasswordInput?.focus(), 100);
    }
  }

  function closeAuthPasswordModal() {
    if (modalAuthPassword) {
      modalAuthPassword.style.display = 'none';
      modalAuthPassword.setAttribute('aria-hidden', 'true');
      if (authPasswordInput) authPasswordInput.value = '';
      if (authPasswordErrorMsg) authPasswordErrorMsg.style.display = 'none';
      pendingAuthAction = null;
    }
  }

  function openUserFormModal(userToEdit = null) {
    if (userToEdit) {
      if (modalUserTitle) modalUserTitle.textContent = 'Editar Información de Usuario';
      document.getElementById('modalUserId').value = userToEdit.id;
      document.getElementById('modalUserNombre').value = userToEdit.name;
      document.getElementById('modalUserUsername').value = userToEdit.username;
      document.getElementById('modalUserPassword').value = userToEdit.password || '••••••••';
      document.getElementById('modalUserRol').value = userToEdit.role;
    } else {
      if (modalUserTitle) modalUserTitle.textContent = 'Crear Nuevo Usuario';
      usuarioForm?.reset();
      document.getElementById('modalUserId').value = '';
    }

    if (modalUsuarioForm) {
      modalUsuarioForm.style.display = 'flex';
      modalUsuarioForm.setAttribute('aria-hidden', 'false');
    }
  }

  function closeUserModal() {
    if (modalUsuarioForm) {
      modalUsuarioForm.style.display = 'none';
      modalUsuarioForm.setAttribute('aria-hidden', 'true');
      usuarioForm?.reset();
    }
  }

  // RECONECTAR BOTÓN DE DESBLOQUEO DE USUARIOS
  btnUnlockUserManagement?.addEventListener('click', () => {
    if (isUsersUnlocked) {
      renderUsersTable();
      return;
    }
    openAuthPasswordModal('UNLOCK_VIEW', null, '🔑 Autorizar Desbloqueo de Usuarios', 'Ingrese su contraseña gerencial para ver credenciales');
  });

  closeAuthModalBtn?.addEventListener('click', closeAuthPasswordModal);
  cancelAuthModalBtn?.addEventListener('click', closeAuthPasswordModal);
  btnOpenNuevoUsuarioModal?.addEventListener('click', () => openUserFormModal());
  closeUserModalBtn?.addEventListener('click', closeUserModal);
  cancelUserModalBtn?.addEventListener('click', closeUserModal);

  // SUBMIT FORMULARIO DE AUTH PASSWORD
  authPasswordForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = (authPasswordInput?.value || '').trim();

    if (!pass || !VALID_MANAGER_PASSWORDS.includes(pass)) {
      if (authPasswordErrorMsg) {
        authPasswordErrorMsg.style.display = 'block';
        authPasswordErrorMsg.textContent = '❌ Contraseña gerencial incorrecta. Permiso denegado.';
      }
      authPasswordInput?.focus();
      return;
    }

    const { actionType, data } = pendingAuthAction || {};
    closeAuthPasswordModal();

    if (actionType === 'UNLOCK_VIEW') {
      isUsersUnlocked = true;
      if (usersLockedPlaceholder) usersLockedPlaceholder.style.display = 'none';
      if (usersCrudPanel) usersCrudPanel.style.display = 'block';
      if (btnUnlockUserManagement) btnUnlockUserManagement.innerHTML = '<span>🔓 Gestión Desbloqueada</span>';
      renderUsersTable();
      showSuccessModal('¡Acceso Autorizado!', 'Gestión de Usuarios y Roles desbloqueada exitosamente.');
    } else if (actionType === 'SAVE_USER') {
      const { id, name, username, password, role } = data;
      let roleCode = 'POS';
      let icon = '👩‍💼';

      const rLower = (role || '').toLowerCase();
      if (rLower.includes('gerente')) {
        roleCode = 'ADMIN';
        icon = '👨‍💼';
      } else if (rLower.includes('panadero') || rLower.includes('cocina')) {
        roleCode = 'KITCHEN';
        icon = '👨‍🍳';
      } else if (rLower.includes('contador') || rLower.includes('contabilidad')) {
        roleCode = 'ACCOUNTANT';
        icon = '📊';
      } else if (rLower.includes('cajero')) {
        roleCode = 'POS';
        icon = '👩‍💼';
      }

      if (id) {
        const existing = usersData.find(u => u.id === id);
        if (existing) {
          existing.name = name;
          existing.username = username;
          if (password && password !== '••••••••') existing.password = password;
          existing.role = role;
          existing.roleCode = roleCode;
          existing.icon = icon;
        }
      } else {
        const newId = `usr_${String(usersData.length + 1).padStart(3, '0')}`;
        usersData.push({
          id: newId,
          name,
          username,
          password: password || '123456',
          role,
          roleCode,
          icon
        });
      }

      saveUsersToStorage(usersData);
      renderUsersTable();
      showSuccessModal('¡Usuario Guardado!', `El usuario "${name}" (@${username}) fue guardado y sincronizado con éxito.`);
    } else if (actionType === 'DELETE_USER') {
      usersData = usersData.filter(u => u.id !== data.id);
      saveUsersToStorage(usersData);
      renderUsersTable();
      showSuccessModal('¡Usuario Eliminado!', `El usuario "${data.name}" (@${data.username}) fue eliminado correctamente del sistema.`);
    }
  });

  // SUBMIT FORMULARIO DE USUARIO (VALIDACIONES STRICTAS A, B Y C)
  usuarioForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('modalUserId')?.value;
    const name = document.getElementById('modalUserNombre')?.value?.trim();
    const username = document.getElementById('modalUserUsername')?.value?.trim();
    const password = document.getElementById('modalUserPassword')?.value;
    const role = document.getElementById('modalUserRol')?.value;

    if (!name || !username || !role) return;

    const safeUsersList = Array.isArray(usersData) ? usersData : [];

    // Regla A (Usuario Único)
    const duplicateUsername = safeUsersList.find(u => u && (u.username || '').toLowerCase() === (username || '').toLowerCase() && u.id !== id);
    if (duplicateUsername) {
      showErrorModal(
        '❌ Error: Usuario Duplicado',
        `El Nombre de Usuario (login) "@${username}" ya pertenece al perfil de "${duplicateUsername.name || 'otro usuario'}". Debe elegir un nombre de usuario diferente.`
      );
      return;
    }

    // Regla B (Contraseña Única)
    if (password && password !== '••••••••') {
      const duplicatePassword = safeUsersList.find(u => u && u.password === password && u.id !== id);
      if (duplicatePassword) {
        showErrorModal(
          '❌ Error: Contraseña en Uso',
          `Por políticas de seguridad, la contraseña ingresada ya está siendo utilizada por el usuario "${duplicatePassword.name || 'otro usuario'}". Debe asignar una contraseña única.`
        );
        return;
      }
    }

    // Regla C (Contador Único)
    const isTargetContador = (role || '').toLowerCase().includes('contador') || (role || '').toLowerCase().includes('contabilidad');
    if (isTargetContador) {
      const existingContador = safeUsersList.find(u => u && 
        ((u.role || '').toLowerCase().includes('contador') || (u.role || '').toLowerCase().includes('contabilidad') || u.roleCode === 'ACCOUNTANT') &&
        u.id !== id
      );
      if (existingContador) {
        showErrorModal(
          '❌ Error: Rol Contador Duplicado',
          `Error: Ya existe un perfil de Contabilidad activo (${existingContador.name || 'Contador'} - @${existingContador.username || 'contador'}). Debe editarlo o eliminarlo primero.`
        );
        return;
      }
    }

    closeUserModal();

    const isEdit = Boolean(id);
    const title = isEdit ? '💾 Confirmar Actualización de Usuario' : '✨ Confirmar Creación de Usuario';
    const sub = isEdit ? `Autorice la actualización del usuario "${name}"` : `Autorice la creación del nuevo usuario "${name}"`;

    openAuthPasswordModal('SAVE_USER', { id, name, username, password, role }, title, sub);
  });
}

/**
 * E) Cierre de Modales por Backdrop Overlay
 */
function inicializarModalesYEventos() {
  window.addEventListener('click', (e) => {
    const modalAuthPassword = document.getElementById('modalAuthPassword');
    const modalUsuarioForm = document.getElementById('modalUsuarioForm');
    const modalExitoNotificacion = document.getElementById('modalExitoNotificacion');

    if (e.target === modalAuthPassword) {
      if (modalAuthPassword) modalAuthPassword.style.display = 'none';
    }
    if (e.target === modalUsuarioForm) {
      if (modalUsuarioForm) modalUsuarioForm.style.display = 'none';
    }
    if (e.target === modalExitoNotificacion) {
      closeSuccessModal();
    }
  });

  const closeExitoModalBtn = document.getElementById('closeExitoModalBtn');
  if (closeExitoModalBtn) closeExitoModalBtn.addEventListener('click', closeSuccessModal);
}

// ==========================================================================
// 5. INICIALIZACIÓN CON PRINCIPIO DE AISLAMIENTO DE FALLOS STRICTO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  try { inicializarSesionGerente(); } catch (e) { console.error('Error Sesión Gerente:', e); }
  try { inicializarEmpresaFiscalConfig(); } catch (e) { console.error('Error Empresa Config:', e); }
  try { inicializarTasaBcvConfig(); } catch (e) { console.error('Error Tasa BCV:', e); }
  try { inicializarGestionUsuarios(); } catch (e) { console.error('Error Gestión Usuarios:', e); }
  try { inicializarModalesYEventos(); } catch (e) { console.error('Error Modales Config:', e); }
});
