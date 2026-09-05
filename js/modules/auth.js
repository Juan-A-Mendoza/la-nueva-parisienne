/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR INTERACTIVO DE AUTENTICACIÓN (AUTH.JS)
   Manejo de Modalidades de Acceso (Modo POS por Departamentos vs Modo Tradicional)
   Transiciones fluidas entre vistas y validación de credenciales / PIN táctil
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', async () => {
  let selectedUserId = null;
  let enteredPin = '';
  let allProfiles = [];
  let currentDeptId = null;

  const DEPARTMENTS = [
    { id: 'gerencia', name: 'Gerencia General', icon: '🏢', roles: ['gerente general', 'admin'], countId: 'count_gerencia', subtitle: 'KPIs, Auditoría & Gestión de Personal' },
    { id: 'caja', name: 'Caja y Facturación', icon: '💰', roles: ['cajero', 'pos', 'cashier'], countId: 'count_caja', subtitle: 'Punto de Venta POS & Cobros Rápidos' },
    { id: 'cocina', name: 'Producción y Cocina', icon: '👨‍🍳', roles: ['panadero', 'kitchen', 'baker'], countId: 'count_cocina', subtitle: 'Control de Hornos, Mermas & Recetas' },
    { id: 'contabilidad', name: 'Contabilidad & Finanzas', icon: '📊', roles: ['contador', 'accountant'], countId: 'count_contabilidad', subtitle: 'Estados Financieros & Comprobantes' }
  ];

  // Elementos DOM de Vistas
  const deptView = document.getElementById('deptView');
  const deptUsersView = document.getElementById('deptUsersView');
  const tradicionalView = document.getElementById('tradicionalView');
  const deptUsersGrid = document.getElementById('deptUsersGrid');
  const btnBackToDepts = document.getElementById('btnBackToDepts');
  const traditionalLoginForm = document.getElementById('traditionalLoginForm');
  const traditionalErrorAlert = document.getElementById('traditionalErrorAlert');

  // Elementos DOM del Modal PIN
  const pinModal = document.getElementById('pinModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const btnModalBack = document.getElementById('btnModalBack');
  const selectedUserAvatar = document.getElementById('selectedUserAvatar');
  const selectedUserName = document.getElementById('selectedUserName');
  const selectedUserRole = document.getElementById('selectedUserRole');
  const pinDisplayDots = document.querySelectorAll('.pin-dot');
  const pinKeypad = document.getElementById('pinKeypad');
  const pinErrorAlert = document.getElementById('pinErrorAlert');

  // ==========================================================================
  // 1. CARGA DE PERFILES Y CONTEO POR DEPARTAMENTO
  // ==========================================================================

  async function loadProfilesAndInitView() {
    try {
      allProfiles = await SessionStore.getProfilesAsync();
      updateDepartmentCounts();

      const modoLogin = localStorage.getItem('modo_login') || 'pos';
      if (modoLogin === 'tradicional') {
        renderTraditionalMode();
      } else {
        renderPosMode();
      }
    } catch (err) {
      console.error('Error cargando perfiles en Lobby:', err);
    }
  }

  function updateDepartmentCounts() {
    DEPARTMENTS.forEach(dept => {
      const countEl = document.getElementById(dept.countId);
      if (!countEl) return;
      const deptUsers = allProfiles.filter(p => {
        const rLower = (p.role || '').toLowerCase();
        const codeLower = (p.roleCode || '').toLowerCase();
        return dept.roles.some(r => rLower.includes(r) || codeLower.includes(r));
      });
      const count = deptUsers.length;
      countEl.textContent = `${count} ${count === 1 ? 'Usuario' : 'Usuarios'}`;
    });
  }

  // Escuchar cambios de almacenamiento en tiempo real
  window.addEventListener('storage', (e) => {
    try {
      if (!e.key || e.key === 'usuarios_sistema' || e.key === 'usuarios' || e.key === 'modo_login') {
        loadProfilesAndInitView();
      }
    } catch (err) {
      console.warn('Error respondiendo a evento storage en auth:', err);
    }
  });

  // ==========================================================================
  // 2. CONMUTACIÓN DE VISTAS (MODO POS VS MODO TRADICIONAL)
  // ==========================================================================

  function renderPosMode() {
    if (tradicionalView) {
      tradicionalView.classList.remove('active');
      tradicionalView.classList.add('hidden');
    }
    if (deptUsersView) {
      deptUsersView.classList.remove('active');
      deptUsersView.classList.add('hidden');
    }
    if (deptView) {
      deptView.classList.remove('hidden');
      deptView.classList.add('active');
    }
    currentDeptId = null;
  }

  function renderTraditionalMode() {
    if (deptView) {
      deptView.classList.remove('active');
      deptView.classList.add('hidden');
    }
    if (deptUsersView) {
      deptUsersView.classList.remove('active');
      deptUsersView.classList.add('hidden');
    }
    if (tradicionalView) {
      tradicionalView.classList.remove('hidden');
      tradicionalView.classList.add('active');
    }
  }

  // ==========================================================================
  // 3. MODO POS: NAVEGACIÓN UNIVERSAL Y REUTILIZABLE POR ROL / DEPARTAMENTO
  // ==========================================================================

  /**
   * FUNCIÓN UNIVERSAL Y REUTILIZABLE DE NAVEGACIÓN
   * Recibe el rol/departamento destino, filtra la fuente de usuarios desde localStorage
   * y renderiza la rejilla de usuarios correspondiente con transiciones suaves.
   * @param {string} rolDestino - ID del departamento ('gerencia', 'caja', 'cocina', 'contabilidad') o nombre del rol
   */
  function renderizarUsuariosPorRol(rolDestino) {
    const targetKey = (rolDestino || '').toLowerCase();
    const dept = DEPARTMENTS.find(d => 
      d.id === targetKey || 
      d.roles.some(r => targetKey.includes(r) || r.includes(targetKey))
    ) || DEPARTMENTS[0];

    currentDeptId = dept.id;

    // Obtener y filtrar lista actualizada de usuarios desde localStorage / SessionStore
    const deptUsers = allProfiles.filter(p => {
      const rLower = (p.role || '').toLowerCase();
      const codeLower = (p.roleCode || '').toLowerCase();
      return dept.roles.some(r => rLower.includes(r) || codeLower.includes(r));
    });

    const selectedDeptIcon = document.getElementById('selectedDeptIcon');
    const selectedDeptTitle = document.getElementById('selectedDeptTitle');
    const selectedDeptSubtitle = document.getElementById('selectedDeptSubtitle');

    if (selectedDeptIcon) selectedDeptIcon.textContent = dept.icon;
    if (selectedDeptTitle) selectedDeptTitle.textContent = `Usuarios de ${dept.name}`;
    if (selectedDeptSubtitle) selectedDeptSubtitle.textContent = `${deptUsers.length} ${deptUsers.length === 1 ? 'perfil registrado' : 'perfiles registrados'} — ${dept.subtitle}`;

    renderDepartmentUsersGrid(deptUsers);

    if (deptView) {
      deptView.classList.remove('active');
      deptView.classList.add('hidden');
    }
    if (deptUsersView) {
      deptUsersView.classList.remove('hidden');
      deptUsersView.classList.add('active');
    }
  }

  window.renderizarUsuariosPorRol = renderizarUsuariosPorRol;

  function backToDepartmentsView() {
    if (deptUsersView) {
      deptUsersView.classList.remove('active');
      deptUsersView.classList.add('hidden');
    }
    if (deptView) {
      deptView.classList.remove('hidden');
      deptView.classList.add('active');
    }
    currentDeptId = null;
  }

  if (btnBackToDepts) {
    btnBackToDepts.addEventListener('click', backToDepartmentsView);
  }

  // Registrar clic en las 4 tarjetas de departamento usando la función universal
  document.querySelectorAll('.dept-card').forEach(card => {
    const handleDeptClick = (e) => {
      if (e) e.preventDefault();
      const deptId = card.dataset.dept;
      renderizarUsuariosPorRol(deptId);
    };
    card.addEventListener('click', handleDeptClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleDeptClick(e);
      }
    });
  });

  function renderDepartmentUsersGrid(deptUsersList) {
    if (!deptUsersGrid) return;
    deptUsersGrid.innerHTML = '';

    if (!deptUsersList || deptUsersList.length === 0) {
      deptUsersGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: var(--radius-lg); border: 2px dashed rgba(212,155,84,0.3); color: var(--color-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👤</div>
          <h3 style="font-size: 1.1rem; color: var(--color-espresso); font-weight: 700; margin-bottom: 0.25rem;">Sin Usuarios Registrados</h3>
          <p style="font-size: 0.85rem;">No existen usuarios asignados actualmente a este departamento.</p>
        </div>
      `;
      return;
    }

    deptUsersList.forEach(profile => {
      const card = document.createElement('article');
      card.className = 'profile-card user-card';
      card.dataset.userId = profile.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ingresar como ${profile.name}`);

      card.innerHTML = `
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar user-avatar">${profile.icon || '👤'}</div>
          <span class="status-dot"></span>
        </div>
        <h3 class="profile-name user-name">${profile.name}</h3>
        <span class="profile-role user-role">${profile.role}</span>
        <p class="profile-desc user-desc">${profile.description || `@${profile.username || profile.id}`}</p>
        <button type="button" class="btn-select-user profile-action-btn">Seleccionar Perfil ➔</button>
      `;

      const selectUser = (e) => {
        if (e) e.preventDefault();
        openPinModal(profile);
      };

      card.addEventListener('click', selectUser);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          selectUser(e);
        }
      });

      deptUsersGrid.appendChild(card);
    });
  }

  // ==========================================================================
  // 4. MODO TRADICIONAL: SUBMIT FORMULARIO CREDENCIALES
  // ==========================================================================

  if (traditionalLoginForm) {
    traditionalLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('tradUsernameInput')?.value?.trim();
      const password = document.getElementById('tradPasswordInput')?.value;

      if (!username || !password) return;

      if (traditionalErrorAlert) traditionalErrorAlert.style.display = 'none';

      const result = await SessionStore.validateCredentialsAsync(username, password);

      if (result.success) {
        window.location.href = result.redirectUrl;
      } else {
        if (traditionalErrorAlert) {
          traditionalErrorAlert.textContent = `❌ ${result.message || 'Nombre de usuario o contraseña incorrectos.'}`;
          traditionalErrorAlert.style.display = 'block';
        }
      }
    });
  }

  // ==========================================================================
  // 5. MODAL DE INGRESO DE CONTRASEÑA / PIN (MODO POS)
  // ==========================================================================

  function openPinModal(profile) {
    selectedUserId = profile.id;
    enteredPin = '';
    if (selectedUserAvatar) selectedUserAvatar.textContent = profile.icon;
    if (selectedUserName) selectedUserName.textContent = profile.name;
    if (selectedUserRole) selectedUserRole.textContent = profile.role;
    
    hideError();
    updatePinDots();
    if (pinModal) pinModal.classList.add('active');
  }

  function closePinModal() {
    if (pinModal) pinModal.classList.remove('active');
    selectedUserId = null;
    enteredPin = '';
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closePinModal);
  if (btnModalBack) btnModalBack.addEventListener('click', closePinModal);

  // Keypad interactivo PIN táctil
  if (pinKeypad) {
    pinKeypad.addEventListener('click', async (e) => {
      const btn = e.target.closest('.keypad-btn') || e.target.closest('.key-btn');
      if (!btn) return;

      const val = btn.dataset.value;
      const action = btn.dataset.action;

      if (val !== undefined && val !== null && val !== '') {
        if (enteredPin.length < 4) {
          enteredPin += val;
          updatePinDots();
          hideError();

          if (enteredPin.length === 4) {
            await processAuthentication();
          }
        }
      } else if (action === 'clear') {
        enteredPin = '';
        updatePinDots();
        hideError();
      } else if (action === 'delete' || action === 'backspace') {
        enteredPin = enteredPin.slice(0, -1);
        updatePinDots();
        hideError();
      }
    });
  }

  // Entrada por teclado físico
  document.addEventListener('keydown', async (e) => {
    if (!pinModal || !pinModal.classList.contains('active')) return;

    if (/^[0-9]$/.test(e.key)) {
      if (enteredPin.length < 4) {
        enteredPin += e.key;
        updatePinDots();
        hideError();

        if (enteredPin.length === 4) {
          await processAuthentication();
        }
      }
    } else if (e.key === 'Backspace') {
      enteredPin = enteredPin.slice(0, -1);
      updatePinDots();
      hideError();
    } else if (e.key === 'Escape') {
      closePinModal();
    }
  });

  function updatePinDots() {
    pinDisplayDots.forEach((dot, idx) => {
      if (idx < enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  async function processAuthentication() {
    const result = await SessionStore.validatePinAsync(selectedUserId, enteredPin);

    if (result.success) {
      window.location.href = result.redirectUrl;
    } else {
      showError(result.message || 'PIN de acceso incorrecto.');
      shakeModal();
      enteredPin = '';
      setTimeout(updatePinDots, 400);
    }
  }

  function showError(msg) {
    if (pinErrorAlert) {
      pinErrorAlert.textContent = msg;
      pinErrorAlert.classList.add('visible', 'error-text');
    }
  }

  function hideError() {
    if (pinErrorAlert) {
      pinErrorAlert.classList.remove('visible', 'error-text');
    }
  }

  function shakeModal() {
    if (!pinModal) return;
    const card = pinModal.querySelector('.pin-modal-card');
    if (card) {
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
    }
  }

  // Inicialización
  loadProfilesAndInitView();
});
