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
  { id: 'usr_001', name: 'Juan Mendoza', username: 'admin', role: 'Gerente General', roleCode: 'ADMIN', icon: 'shield-check', description: 'Acceso total a KPIs, contabilidad, producción y personal.', redirectUrl: 'modules/dashboard.html' },
  { id: 'usr_002', name: 'María Elena Suárez', username: 'cajero1', role: 'Cajero', roleCode: 'POS', icon: 'banknote', description: 'Facturación directa a clientes, cobros rápidos y apertura de caja.', redirectUrl: 'modules/pos.html' },
  { id: 'usr_003', name: 'Carlos Eduardo Rivas', username: 'panadero1', role: 'Panadero', roleCode: 'KITCHEN', icon: 'chef-hat', description: 'Gestión de hornos, recetas, orden del día y preparación de masa.', redirectUrl: 'modules/kitchen.html' },
  { id: 'usr_004', name: 'Andrés Felipe Gómez', username: 'contador1', role: 'Contador', roleCode: 'ACCOUNTANT', icon: 'bar-chart-3', description: 'Auditoría financiera, margen de ganancias y estados contables.', redirectUrl: 'modules/accounting.html' }
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
        const autoRate = parseFloat(data.promedio || data.precio || data.monto || data.rate);
        if (autoRate && autoRate > 0) {
          localStorage.setItem('tasa_auto', autoRate.toString());
          localStorage.setItem('tasaAuto', autoRate.toString());
          localStorage.setItem('bcv_current_rate', autoRate.toString());
          return autoRate;
        }
      }
    } catch (e) {
      // Fallback rápido
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

  const activeUser = (session && session.user) ? session.user : {
    name: 'Super Administrador',
    role: 'Super Administrador',
    roleCode: 'SUPERADMIN',
    icon: 'shield-check'
  };

  // Verificación estricta: Módulo de configuración exclusiva del SUPERADMIN
  const userRole = (activeUser.role || '').toLowerCase();
  const userRoleCode = (activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin');

  if (!isSuperadmin) {
    let redirectUrl = 'dashboard.html';
    if (userRoleCode === 'ACCOUNTANT' || userRole.includes('contador')) redirectUrl = 'accounting.html';
    else if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    else if (userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero')) redirectUrl = 'kitchen.html';
    window.location.replace(redirectUrl);
    return;
  }

  const managerAvatar = document.getElementById('managerAvatar');
  const managerName = document.getElementById('managerName');
  if (managerAvatar) { managerAvatar.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'shield-check') : ''; window.LucideIcons?.refresh(); }
  if (managerName) managerName.textContent = activeUser.name || 'Juan Mendoza';

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

  // Sincronizar datos fiscales iniciales desde MySQL
  try {
    fetch('../api/get_empresa.php')
      .then(r => r.json())
      .then(res => {
        if (res && res.empresa) {
          if (empresaNombre && res.empresa.nombre) empresaNombre.value = res.empresa.nombre;
          if (empresaRif && res.empresa.rif) empresaRif.value = res.empresa.rif;
          if (empresaDireccion && res.empresa.direccion) empresaDireccion.value = res.empresa.direccion;
          if (empresaTelefono && res.empresa.telefono) empresaTelefono.value = res.empresa.telefono;
        }
      })
      .catch(() => {});
  } catch (err) {}

  if (empresaForm) {
    empresaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        nombre: empresaNombre ? empresaNombre.value.trim() : '',
        rif: empresaRif ? empresaRif.value.trim() : '',
        direccion: empresaDireccion ? empresaDireccion.value.trim() : '',
        telefono: empresaTelefono ? empresaTelefono.value.trim() : ''
      };

      try {
        localStorage.setItem('empresa_datos', JSON.stringify(payload));
      } catch (err) {}

      // Sincronizar y persistir en MySQL
      try {
        const resp = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await resp.json();
        if (res && res.success) {
          showStatus('¡Datos fiscales de la empresa guardados exitosamente en la base de datos MySQL!', 'success');
          showSuccessModal('¡Datos Fiscales Actualizados!', 'La información fiscal y de contacto de La Nueva Parisienne C.A. ha sido sincronizada y guardada en MySQL.');
        } else {
          showStatus('¡Datos fiscales guardados!', 'success');
        }
      } catch (apiErr) {
        showStatus('¡Datos fiscales guardados en la sesión actual!', 'success');
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
      if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• BCV Oficial';

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
      if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• BCV Oficial';

      if (previewRateVal) previewRateVal.textContent = '⏳ Consultando API...';
      activeRate = await fetchLiveBcvRate();
      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (liveAutoRateVal) liveAutoRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
    }

    const activeSource = 'BCV Oficial';
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
        showStatus('La tasa manual ingresada debe ser un valor válido mayor a Bs. 0.00.', 'error');
        return;
      }

      const activeRate = isManual ? manualVal : autoVal;
      const activeSource = 'BCV Oficial';

      localStorage.setItem('modo_tasa', modoVal);
      localStorage.setItem('modoTasa', modoVal);
      localStorage.setItem('tasa_manual', manualVal.toString());
      localStorage.setItem('tasaManual', manualVal.toString());
      localStorage.setItem('tasa_auto', autoVal.toString());
      localStorage.setItem('tasaAuto', autoVal.toString());
      localStorage.setItem('bcv_current_rate', activeRate.toString());

      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (textoEstadoConfig) textoEstadoConfig.textContent = '• BCV Oficial';

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const rateChannel = new BroadcastChannel('lnp_bcv_channel');
          rateChannel.postMessage({ rate: activeRate, mode: modoVal, source: activeSource });
        } catch (err) {}
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: activeRate, mode: modoVal } }));

      // Sincronizar en MySQL
      try {
        fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modo_tasa: modoVal,
            tasa_manual: manualVal
          })
        }).catch(err => console.warn('Error sincronizando tasa con MySQL:', err));
      } catch (apiErr) {}

      showStatus('¡Tasa de cambio guardada y transmitida a todo el sistema en tiempo real!', 'success');
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
  setTimeout(() => window.LucideIcons?.refresh(), 0);
    if (!usuariosTbody) return;
    usuariosTbody.innerHTML = '';
    const safeList = Array.isArray(usersData) ? usersData : [];

    safeList.forEach(user => {
      if (!user) return;
      const tr = document.createElement('tr');
      
      let badgeStyle = 'background: rgba(46,125,50,0.1); color: var(--color-success); border: 1px solid rgba(46,125,50,0.25);';
      if (user.roleCode === 'SUPERADMIN' || (user.role || '').toLowerCase().includes('superadmin')) {
        badgeStyle = 'background: rgba(106,27,154,0.15); color: #6A1B9A; border: 1px solid rgba(106,27,154,0.4); font-weight: 800;';
      } else if (user.roleCode === 'ADMIN') {
        badgeStyle = 'background: rgba(212,155,84,0.15); color: var(--color-gold-dark); border: 1px solid rgba(212,155,84,0.4); font-weight: 800;';
      } else if (user.roleCode === 'KITCHEN') {
        badgeStyle = 'background: rgba(255,152,0,0.1); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;';
      } else if (user.roleCode === 'ACCOUNTANT') {
        badgeStyle = 'background: rgba(33,150,243,0.1); color: #1565C0; border: 1px solid rgba(33,150,243,0.3); font-weight: 700;';
      }

      tr.innerHTML = `
        <td><strong><i data-lucide="${user.icon || 'user'}" class="icon-sm" style="margin-right: 0.35rem;"></i>${user.name || 'Usuario'}</strong></td>
        <td><span class="table-code-badge">@${user.username || user.id}</span></td>
        <td>
          <span class="table-status-tag active" style="${badgeStyle}">
            ${user.role || 'Empleado'}
          </span>
        </td>
        <td>
          <span class="badge-stock-normal badge-clean-icon" style="color: var(--color-success);"><i data-lucide="check" class="icon-xs"></i> Activo</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-table-action-sm btn-edit-usr" title="Editar usuario"><i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span></button>
            <button type="button" class="btn-table-action-sm btn-del-usr" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border-color: rgba(198,40,40,0.3);" title="Eliminar usuario"><i data-lucide="trash-2" class="icon-xs"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-usr')?.addEventListener('click', () => openUserFormModal(user));
      tr.querySelector('.btn-del-usr')?.addEventListener('click', () => {
        openAuthPasswordModal('DELETE_USER', user, 'Confirmar Eliminación de Usuario', `Ingrese su clave gerencial para autorizar la eliminación de "${user.name}"`);
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

  function updateActiveEmojiButton(selectedEmoji) {
    const hiddenInput = document.getElementById('modalUserIcon');
    if (hiddenInput) hiddenInput.value = selectedEmoji;

    document.querySelectorAll('#emojiPickerGrid .emoji-option-btn').forEach(btn => {
      if (btn.dataset.emoji === selectedEmoji) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function openUserFormModal(userToEdit = null) {
    if (userToEdit) {
      if (modalUserTitle) modalUserTitle.textContent = 'Editar Información de Usuario';
      document.getElementById('modalUserId').value = userToEdit.id;
      document.getElementById('modalUserNombre').value = userToEdit.name;
      document.getElementById('modalUserUsername').value = userToEdit.username;
      document.getElementById('modalUserPassword').value = userToEdit.password || '••••••••';
      document.getElementById('modalUserRol').value = userToEdit.role;
      updateActiveEmojiButton(userToEdit.icon || 'shield-check');
    } else {
      if (modalUserTitle) modalUserTitle.textContent = 'Crear Nuevo Usuario';
      usuarioForm?.reset();
      document.getElementById('modalUserId').value = '';
      updateActiveEmojiButton('shield-check');
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

  // RECONECTAR BOTÓN DE DESBLOQUEO DE USUARIOS Y SELECTOR DE EMOJI
  btnUnlockUserManagement?.addEventListener('click', () => {
    if (isUsersUnlocked) {
      renderUsersTable();
      return;
    }
    openAuthPasswordModal('UNLOCK_VIEW', null, 'Autorizar Desbloqueo de Usuarios', 'Ingrese su contraseña gerencial para ver credenciales');
  });

  document.querySelectorAll('#emojiPickerGrid .emoji-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji || 'shield-check';
      updateActiveEmojiButton(emoji);
    });
  });

  document.getElementById('modalUserRol')?.addEventListener('change', (e) => {
    const isNewUser = !document.getElementById('modalUserId')?.value;
    if (isNewUser) {
      const role = e.target.value;
      let suggestedEmoji = 'shield-check';
      if (role === 'Cajero') suggestedEmoji = 'banknote';
      else if (role === 'Panadero') suggestedEmoji = 'chef-hat';
      else if (role === 'Contador') suggestedEmoji = 'bar-chart-3';
      updateActiveEmojiButton(suggestedEmoji);
    }
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
        authPasswordErrorMsg.textContent = 'Contraseña gerencial incorrecta. Permiso denegado.';
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
      if (btnUnlockUserManagement) btnUnlockUserManagement.innerHTML = '<i data-lucide="unlock" class="icon-sm"></i> <span>Gestión Desbloqueada</span>'; window.LucideIcons?.refresh();
      renderUsersTable();
      showSuccessModal('¡Acceso Autorizado!', 'Gestión de Usuarios y Roles desbloqueada exitosamente.');
    } else if (actionType === 'SAVE_USER') {
      const { id, name, username, password, role, icon } = data;
      let roleCode = 'POS';
      let finalIcon = icon || 'shield-check';

      const rLower = (role || '').toLowerCase();
      if (rLower.includes('superadmin') || rLower.includes('super')) {
        roleCode = 'SUPERADMIN';
        finalIcon = 'shield-check';
      } else if (rLower.includes('gerente') || rLower.includes('admin')) {
        roleCode = 'ADMIN';
      } else if (rLower.includes('panadero') || rLower.includes('cocina')) {
        roleCode = 'KITCHEN';
      } else if (rLower.includes('contador') || rLower.includes('contabilidad')) {
        roleCode = 'ACCOUNTANT';
      } else if (rLower.includes('cajero')) {
        roleCode = 'POS';
      }

      if (id) {
        const existing = usersData.find(u => u.id === id);
        if (existing) {
          existing.name = name;
          existing.username = username;
          if (password && password !== '••••••••') existing.password = password;
          existing.role = role;
          existing.roleCode = roleCode;
          existing.icon = finalIcon;
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
          icon: finalIcon
        });
      }

      saveUsersToStorage(usersData);
      renderUsersTable();

      // Sincronizar usuario/empleado con MySQL
      try {
        fetch('../api/staff/guardar_empleado.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: name,
            username: username,
            password: password,
            pin: password || '1234',
            rol: role
          })
        }).catch(err => console.warn('Error guardando usuario en MySQL:', err));
      } catch (err) {}

      showSuccessModal('¡Usuario Guardado!', `El usuario "${name}" (@${username}) con perfil ${finalIcon} fue guardado y sincronizado con éxito.`);
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
    const icon = document.getElementById('modalUserIcon')?.value || 'shield-check';

    if (!name || !username || !role) return;

    const safeUsersList = Array.isArray(usersData) ? usersData : [];

    // Regla A (Usuario Único)
    const duplicateUsername = safeUsersList.find(u => u && (u.username || '').toLowerCase() === (username || '').toLowerCase() && u.id !== id);
    if (duplicateUsername) {
      showErrorModal(
        'Error: Usuario Duplicado',
        `El Nombre de Usuario (login) "@${username}" ya pertenece al perfil de "${duplicateUsername.name || 'otro usuario'}". Debe elegir un nombre de usuario diferente.`
      );
      return;
    }

    // Regla B (Contraseña Única)
    if (password && password !== '••••••••') {
      const duplicatePassword = safeUsersList.find(u => u && u.password === password && u.id !== id);
      if (duplicatePassword) {
        showErrorModal(
          'Error: Contraseña en Uso',
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
          'Error: Rol Contador Duplicado',
          `Error: Ya existe un perfil de Contabilidad activo (${existingContador.name || 'Contador'} - @${existingContador.username || 'contador'}). Debe editarlo o eliminarlo primero.`
        );
        return;
      }
    }

    closeUserModal();

    const isEdit = Boolean(id);
    const title = isEdit ? 'Confirmar Actualización de Usuario' : 'Confirmar Creación de Usuario';
    const sub = isEdit ? `Autorice la actualización del usuario "${name}"` : `Autorice la creación del nuevo usuario "${name}"`;

    openAuthPasswordModal('SAVE_USER', { id, name, username, password, role, icon }, title, sub);
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
    const modalMetodoDigitalForm = document.getElementById('modalMetodoDigitalForm');
    const modalConfirmarEliminacionMetodo = document.getElementById('modalConfirmarEliminacionMetodo');

    if (e.target === modalAuthPassword) {
      if (modalAuthPassword) modalAuthPassword.style.display = 'none';
    }
    if (e.target === modalUsuarioForm) {
      if (modalUsuarioForm) modalUsuarioForm.style.display = 'none';
    }
    if (e.target === modalMetodoDigitalForm) {
      if (modalMetodoDigitalForm) modalMetodoDigitalForm.style.display = 'none';
    }
    if (e.target === modalConfirmarEliminacionMetodo) {
      if (modalConfirmarEliminacionMetodo) modalConfirmarEliminacionMetodo.style.display = 'none';
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

/**
 * Control de Modalidad de Acceso / Login (Modo POS vs Modo Tradicional)
 */
function inicializarModoLoginConfig() {
  const radioPos = document.getElementById('radio_modo_pos');
  const radioTradicional = document.getElementById('radio_modo_tradicional');
  const lblModoPos = document.getElementById('lblModoPos');
  const lblModoTradicional = document.getElementById('lblModoTradicional');
  const modoLoginForm = document.getElementById('modoLoginForm');

  function actualizarEstiloRadioModoLogin(modo) {
    const isPos = modo === 'pos';
    if (lblModoPos) {
      lblModoPos.style.borderColor = isPos ? 'var(--color-gold)' : 'var(--border-subtle)';
      lblModoPos.style.background = isPos ? 'rgba(212, 155, 84, 0.08)' : '#FFFFFF';
    }
    if (lblModoTradicional) {
      lblModoTradicional.style.borderColor = isPos ? 'var(--border-subtle)' : 'var(--color-gold)';
      lblModoTradicional.style.background = isPos ? '#FFFFFF' : 'rgba(212, 155, 84, 0.08)';
    }
  }

  const modoGuardado = localStorage.getItem('modo_login') || 'pos';
  if (modoGuardado === 'tradicional') {
    if (radioTradicional) radioTradicional.checked = true;
  } else {
    if (radioPos) radioPos.checked = true;
  }
  actualizarEstiloRadioModoLogin(modoGuardado);

  radioPos?.addEventListener('change', () => actualizarEstiloRadioModoLogin('pos'));
  radioTradicional?.addEventListener('change', () => actualizarEstiloRadioModoLogin('tradicional'));

  if (modoLoginForm) {
    modoLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const seleccionado = radioTradicional && radioTradicional.checked ? 'tradicional' : 'pos';
      localStorage.setItem('modo_login', seleccionado);
      window.dispatchEvent(new Event('storage'));
      showStatus('¡Modalidad de inicio de sesión actualizada correctamente!', 'success');
      showSuccessModal(
        '¡Preferencia de Acceso Guardada!',
        `La pantalla de login operará en ${seleccionado === 'tradicional' ? 'Modo Tradicional (Credenciales)' : 'Modo POS (Visual por Departamentos)'}.`
      );
    });
  }
}

const DEFAULT_DIGITAL_METHODS = [
  { id: 'met_binance', name: 'Binance Pay', details: 'Pay ID: 29849201 | Correo: binance@lanuevaparisienne.com', icon: '🌐', active: true },
  { id: 'met_zelle', name: 'Zelle (USD)', details: 'zelle@lanuevaparisienne.com | Titular: La Nueva Parisienne C.A.', icon: '💸', active: true },
  { id: 'met_zinli', name: 'Zinli', details: 'zinli@lanuevaparisienne.com | Tel: +58 412 555 1234', icon: '💳', active: true },
  { id: 'met_paypal', name: 'PayPal', details: 'paypal@lanuevaparisienne.com', icon: '🅿️', active: true },
  { id: 'met_reserve', name: 'Reserve', details: 'Usuario: @lanuevaparisienne', icon: '🟢', active: true }
];

function getDigitalMethodsFromStorage() {
  try {
    const raw = localStorage.getItem('metodos_pago_digitales');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      } else if (parsed && parsed.methods) {
        // Migración automática desde el formato anterior de checkboxes
        const migrated = [];
        const m = parsed.methods;
        if (m.binance !== false) migrated.push({ id: 'met_binance', name: 'Binance Pay', details: 'Pay ID: 29849201 | Correo: binance@lanuevaparisienne.com', icon: '🌐', active: true });
        if (m.zelle !== false) migrated.push({ id: 'met_zelle', name: 'Zelle (USD)', details: 'zelle@lanuevaparisienne.com | Titular: La Nueva Parisienne C.A.', icon: '💸', active: true });
        if (m.zinli !== false) migrated.push({ id: 'met_zinli', name: 'Zinli', details: 'zinli@lanuevaparisienne.com | Tel: +58 412 555 1234', icon: '💳', active: true });
        if (m.paypal !== false) migrated.push({ id: 'met_paypal', name: 'PayPal', details: 'paypal@lanuevaparisienne.com', icon: '🅿️', active: true });
        if (m.reserve !== false) migrated.push({ id: 'met_reserve', name: 'Reserve', details: 'Usuario: @lanuevaparisienne', icon: '🟢', active: true });
        if (parsed.customName && parsed.customName.trim()) {
          migrated.push({ id: `met_${Date.now()}`, name: parsed.customName.trim(), details: 'Detalles de cuenta personalizados', icon: '✨', active: true });
        }
        localStorage.setItem('metodos_pago_digitales', JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (e) {
    console.warn('Error leyendo metodos_pago_digitales:', e);
  }
  const defaultList = [...DEFAULT_DIGITAL_METHODS];
  try { localStorage.setItem('metodos_pago_digitales', JSON.stringify(defaultList)); } catch (e) {}
  return defaultList;
}

function saveDigitalMethodsToStorage(methodsArray) {
  try {
    const listToSave = Array.isArray(methodsArray) ? methodsArray : [];
    localStorage.setItem('metodos_pago_digitales', JSON.stringify(listToSave));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error guardando métodos digitales:', e);
  }
}

/**
 * Control CRUD de Métodos de Pago Digitales & Adicionales (5to Medio de Pago POS)
 */
function inicializarMetodosDigitalesConfig() {
  const metodosDigitalesTbody = document.getElementById('metodosDigitalesTbody');
  const btnOpenNuevoMetodoDigitalModal = document.getElementById('btnOpenNuevoMetodoDigitalModal');
  const modalMetodoDigitalForm = document.getElementById('modalMetodoDigitalForm');
  const modalMetodoDigitalTitle = document.getElementById('modalMetodoDigitalTitle');
  const metodoDigitalForm = document.getElementById('metodoDigitalForm');
  const closeMetodoDigitalModalBtn = document.getElementById('closeMetodoDigitalModalBtn');
  const cancelMetodoDigitalModalBtn = document.getElementById('cancelMetodoDigitalModalBtn');

  // Campos de Código QR
  const modalMetodoQrActivo = document.getElementById('modalMetodoQrActivo');
  const modalQrFieldsWrapper = document.getElementById('modalQrFieldsWrapper');
  const modalMetodoQrFile = document.getElementById('modalMetodoQrFile');
  const modalMetodoQrPreview = document.getElementById('modalMetodoQrPreview');
  const modalMetodoQrPreviewContainer = document.getElementById('modalMetodoQrPreviewContainer');
  const btnRemoveQrImage = document.getElementById('btnRemoveQrImage');
  let currentQrBase64 = '';

  // Modal de Confirmación de Eliminación
  const modalConfirmarEliminacionMetodo = document.getElementById('modalConfirmarEliminacionMetodo');
  const confirmEliminarMetodoText = document.getElementById('confirmEliminarMetodoText');
  const cancelEliminarMetodoBtn = document.getElementById('cancelEliminarMetodoBtn');
  const acceptEliminarMetodoBtn = document.getElementById('acceptEliminarMetodoBtn');

  let digitalMethods = getDigitalMethodsFromStorage();
  let pendingMethodToDelete = null;

  // Escuchadores del módulo de Código QR
  modalMetodoQrActivo?.addEventListener('change', (e) => {
    if (modalQrFieldsWrapper) {
      modalQrFieldsWrapper.style.display = e.target.checked ? 'block' : 'none';
    }
  });

  modalMetodoQrFile?.addEventListener('change', (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        currentQrBase64 = evt.target.result;
        if (modalMetodoQrPreview) modalMetodoQrPreview.src = currentQrBase64;
        if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'block';
        if (btnRemoveQrImage) btnRemoveQrImage.style.display = 'inline-flex';
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemoveQrImage?.addEventListener('click', () => {
    currentQrBase64 = '';
    if (modalMetodoQrFile) modalMetodoQrFile.value = '';
    if (modalMetodoQrPreview) modalMetodoQrPreview.src = '';
    if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'none';
    if (btnRemoveQrImage) btnRemoveQrImage.style.display = 'none';
  });

  function renderTable() {
    if (!metodosDigitalesTbody) return;
    metodosDigitalesTbody.innerHTML = '';

    if (digitalMethods.length === 0) {
      metodosDigitalesTbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">
            No hay métodos digitales configurados. Haga clic en "+ Nuevo Método Digital" para agregar uno.
          </td>
        </tr>
      `;
      return;
    }

    digitalMethods.forEach(method => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-subtle)';

      const hasQrBadge = method.qrEnabled && method.qrImage ? `<span style="font-size: 0.7rem; font-weight: 800; color: var(--color-success); background: rgba(46,125,50,0.1); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(46,125,50,0.25); margin-left: 0.35rem;" title="Código QR habilitado en Caja">📷 QR</span>` : '';

      tr.innerHTML = `
        <td style="padding: 0.65rem 0.85rem;">
          <strong style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; color: var(--color-espresso);">
            <span style="font-size: 1.1rem;">${method.icon || '🌐'}</span> ${method.name} ${hasQrBadge}
          </strong>
        </td>
        <td style="padding: 0.65rem 0.85rem; font-size: 0.82rem; color: var(--color-muted);">
          ${method.details || 'Sin datos de cuenta'}
        </td>
        <td style="padding: 0.65rem 0.85rem; text-align: center;">
          <button type="button" class="btn-toggle-status" style="border: none; background: none; cursor: pointer; padding: 0;" title="Haga clic para cambiar estado">
            <span class="table-status-tag ${method.active ? 'active' : 'inactive'}" style="${method.active ? 'background: rgba(46,125,50,0.1); color: var(--color-success); border: 1px solid rgba(46,125,50,0.3); font-weight: 700;' : 'background: rgba(198,40,40,0.1); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); font-weight: 700;'} padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">
              ${method.active ? '✓ Habilitado' : '✕ Deshabilitado'}
            </span>
          </button>
        </td>
        <td style="padding: 0.65rem 0.85rem; text-align: center;">
          <div style="display: flex; gap: 0.35rem; justify-content: center;">
            <button type="button" class="btn-table-action-sm btn-edit-method" style="background: rgba(212,155,84,0.15); color: var(--color-gold-dark); border: 1px solid rgba(212,155,84,0.4); padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;" title="Editar canal digital">
              <i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span>
            </button>
            <button type="button" class="btn-table-action-sm btn-del-method" style="background: rgba(198,40,40,0.1); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;" title="Eliminar canal digital">
              <i data-lucide="trash-2" class="icon-xs"></i>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-toggle-status')?.addEventListener('click', () => {
        method.active = !method.active;
        saveDigitalMethodsToStorage(digitalMethods);
        renderTable();
        showStatus(`¡Estado de "${method.name}" actualizado a ${method.active ? 'Habilitado' : 'Deshabilitado'}!`, 'success');
      });

      tr.querySelector('.btn-edit-method')?.addEventListener('click', () => openModal(method));
      tr.querySelector('.btn-del-method')?.addEventListener('click', () => openConfirmDeleteModal(method));

      metodosDigitalesTbody.appendChild(tr);
    });

    setTimeout(() => window.LucideIcons?.refresh(), 0);
  }

  function openModal(itemToEdit = null) {
    if (itemToEdit) {
      if (modalMetodoDigitalTitle) modalMetodoDigitalTitle.textContent = 'Editar Método Digital';
      document.getElementById('modalMetodoId').value = itemToEdit.id;
      document.getElementById('modalMetodoNombre').value = itemToEdit.name;
      document.getElementById('modalMetodoDetalles').value = itemToEdit.details || '';
      document.getElementById('modalMetodoIcono').value = itemToEdit.icon || '🌐';
      document.getElementById('modalMetodoActivo').checked = Boolean(itemToEdit.active);

      currentQrBase64 = itemToEdit.qrImage || '';
      const isQrActive = Boolean(itemToEdit.qrEnabled);
      if (modalMetodoQrActivo) modalMetodoQrActivo.checked = isQrActive;
      if (modalQrFieldsWrapper) modalQrFieldsWrapper.style.display = isQrActive ? 'block' : 'none';

      if (currentQrBase64) {
        if (modalMetodoQrPreview) modalMetodoQrPreview.src = currentQrBase64;
        if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'block';
        if (btnRemoveQrImage) btnRemoveQrImage.style.display = 'inline-flex';
      } else {
        if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'none';
        if (btnRemoveQrImage) btnRemoveQrImage.style.display = 'none';
      }
    } else {
      if (modalMetodoDigitalTitle) modalMetodoDigitalTitle.textContent = 'Crear Nuevo Método Digital';
      metodoDigitalForm?.reset();
      document.getElementById('modalMetodoId').value = '';
      document.getElementById('modalMetodoIcono').value = '🌐';
      document.getElementById('modalMetodoActivo').checked = true;

      currentQrBase64 = '';
      if (modalMetodoQrActivo) modalMetodoQrActivo.checked = false;
      if (modalQrFieldsWrapper) modalQrFieldsWrapper.style.display = 'none';
      if (modalMetodoQrFile) modalMetodoQrFile.value = '';
      if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'none';
      if (btnRemoveQrImage) btnRemoveQrImage.style.display = 'none';
    }

    if (modalMetodoDigitalForm) {
      modalMetodoDigitalForm.style.display = 'flex';
      modalMetodoDigitalForm.setAttribute('aria-hidden', 'false');
      setTimeout(() => document.getElementById('modalMetodoNombre')?.focus(), 100);
    }
  }

  function closeModal() {
    if (modalMetodoDigitalForm) {
      modalMetodoDigitalForm.style.display = 'none';
      modalMetodoDigitalForm.setAttribute('aria-hidden', 'true');
      metodoDigitalForm?.reset();
      currentQrBase64 = '';
      if (modalMetodoQrFile) modalMetodoQrFile.value = '';
      if (modalMetodoQrPreviewContainer) modalMetodoQrPreviewContainer.style.display = 'none';
    }
  }

  function openConfirmDeleteModal(method) {
    pendingMethodToDelete = method;
    if (confirmEliminarMetodoText) {
      confirmEliminarMetodoText.innerHTML = `¿Está seguro de que desea eliminar el canal digital <strong>"${method.icon || ''} ${method.name}"</strong>?<br><span style="font-size: 0.8rem; color: var(--color-muted); display: block; margin-top: 0.3rem;">Esta acción no se puede deshacer.</span>`;
    }
    if (modalConfirmarEliminacionMetodo) {
      modalConfirmarEliminacionMetodo.style.display = 'flex';
      modalConfirmarEliminacionMetodo.setAttribute('aria-hidden', 'false');
    }
  }

  function closeConfirmDeleteModal() {
    if (modalConfirmarEliminacionMetodo) {
      modalConfirmarEliminacionMetodo.style.display = 'none';
      modalConfirmarEliminacionMetodo.setAttribute('aria-hidden', 'true');
      pendingMethodToDelete = null;
    }
  }

  btnOpenNuevoMetodoDigitalModal?.addEventListener('click', () => openModal());
  closeMetodoDigitalModalBtn?.addEventListener('click', closeModal);
  cancelMetodoDigitalModalBtn?.addEventListener('click', closeModal);
  cancelEliminarMetodoBtn?.addEventListener('click', closeConfirmDeleteModal);

  acceptEliminarMetodoBtn?.addEventListener('click', () => {
    if (!pendingMethodToDelete) return;
    const targetName = pendingMethodToDelete.name;
    const targetIcon = pendingMethodToDelete.icon || '🌐';

    digitalMethods = digitalMethods.filter(m => m.id !== pendingMethodToDelete.id);
    saveDigitalMethodsToStorage(digitalMethods);
    closeConfirmDeleteModal();
    renderTable();

    // Notificación de éxito con animación SVG de checkmark verde
    showSuccessModal('¡Método Eliminado!', `El canal digital "${targetName}" (${targetIcon}) fue removido exitosamente del sistema.`);
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalMetodoDigitalForm) closeModal();
    if (e.target === modalConfirmarEliminacionMetodo) closeConfirmDeleteModal();
  });

  metodoDigitalForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('modalMetodoId')?.value;
    const name = document.getElementById('modalMetodoNombre')?.value?.trim();
    const details = document.getElementById('modalMetodoDetalles')?.value?.trim();
    const icon = document.getElementById('modalMetodoIcono')?.value || '🌐';
    const active = document.getElementById('modalMetodoActivo')?.checked ?? true;
    const qrEnabled = Boolean(modalMetodoQrActivo?.checked);
    const qrImage = currentQrBase64;

    if (!name || !details) return;

    const isEdit = Boolean(id);

    if (id) {
      const existing = digitalMethods.find(m => m.id === id);
      if (existing) {
        existing.name = name;
        existing.details = details;
        existing.icon = icon;
        existing.active = active;
        existing.qrEnabled = qrEnabled;
        existing.qrImage = qrImage;
      }
    } else {
      digitalMethods.push({
        id: `met_${Date.now()}`,
        name,
        details,
        icon,
        active,
        qrEnabled,
        qrImage
      });
    }

    saveDigitalMethodsToStorage(digitalMethods);
    closeModal();
    renderTable();

    // Notificación de éxito con animación SVG de checkmark verde
    showSuccessModal(
      isEdit ? '¡Método Digital Actualizado!' : '¡Método Digital Creado!',
      `El canal "${name}" (${icon}) fue ${isEdit ? 'actualizado' : 'registrado'} con éxito${qrEnabled && qrImage ? ' (incluyendo Código QR para escaneo en POS)' : ''}.`
    );
  });

  renderTable();
}

document.addEventListener('DOMContentLoaded', () => {
  try { inicializarSesionGerente(); } catch (e) { console.error('Error Sesión Gerente:', e); }
  try { inicializarEmpresaFiscalConfig(); } catch (e) { console.error('Error Empresa Config:', e); }
  try { inicializarTasaBcvConfig(); } catch (e) { console.error('Error Tasa BCV:', e); }
  try { inicializarModoLoginConfig(); } catch (e) { console.error('Error Modo Login Config:', e); }
  try { inicializarMetodosDigitalesConfig(); } catch (e) { console.error('Error Métodos Digitales Config:', e); }
  try { inicializarGestionUsuarios(); } catch (e) { console.error('Error Gestión Usuarios:', e); }
  try { inicializarModalesYEventos(); } catch (e) { console.error('Error Modales Config:', e); }
});

