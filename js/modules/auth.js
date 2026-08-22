/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR INTERACTIVO DE AUTENTICACIÓN (AUTH.JS)
   Manejo de selección de perfiles, modal de PIN táctil y consulta API/MySQL
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', async () => {
  let selectedUserId = null;
  let enteredPin = '';

  const profileGrid = document.getElementById('profilesGrid') || document.getElementById('profileGrid');
  const pinModal = document.getElementById('pinModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const selectedUserAvatar = document.getElementById('selectedUserAvatar') || document.getElementById('selectedAvatar');
  const selectedUserName = document.getElementById('selectedUserName') || document.getElementById('selectedName');
  const selectedUserRole = document.getElementById('selectedUserRole') || document.getElementById('selectedRole');
  const pinDisplayDots = document.querySelectorAll('.pin-dot');
  const pinKeypad = document.getElementById('pinKeypad') || document.getElementById('keypad');
  const pinErrorAlert = document.getElementById('pinErrorAlert') || document.getElementById('authMessage');

  // Cargar perfiles de forma asíncrona desde MySQL o fallback local
  async function loadAndRenderProfiles() {
    try {
      const profiles = await SessionStore.getProfilesAsync();
      renderProfiles(profiles);
    } catch (err) {
      console.error('Error cargando perfiles en Lobby:', err);
    }
  }

  try {
    loadAndRenderProfiles();
  } catch (err) {
    console.error('Error inicializando perfiles de autenticación:', err);
  }

  // Re-renderizar si el Gerente modifica usuarios en otra pestaña
  window.addEventListener('storage', (e) => {
    try {
      if (!e.key || e.key === 'usuarios_sistema' || e.key === 'usuarios') {
        loadAndRenderProfiles();
      }
    } catch (err) {
      console.warn('Error respondiendo a evento storage en auth:', err);
    }
  });

  function renderProfiles(profileList) {
    if (!profileGrid) return;
    profileGrid.innerHTML = '';
    
    if (!profileList || profileList.length === 0) {
      profileGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-muted);">
          No se encontraron perfiles de usuario en el sistema.
        </div>
      `;
      return;
    }

    const DEPARTMENTS = [
      { id: 'gerencia', name: 'Gerencia General', icon: '🏢', roles: ['gerente general', 'admin'] },
      { id: 'caja', name: 'Caja y Facturación', icon: '💰', roles: ['cajero', 'pos', 'cashier'] },
      { id: 'cocina', name: 'Producción y Cocina', icon: '🥖', roles: ['panadero', 'kitchen', 'baker'] },
      { id: 'contabilidad', name: 'Contabilidad', icon: '📊', roles: ['contador', 'accountant'] }
    ];

    DEPARTMENTS.forEach(dept => {
      const deptUsers = profileList.filter(p => {
        const rLower = (p.role || '').toLowerCase();
        const codeLower = (p.roleCode || '').toLowerCase();
        return dept.roles.some(r => rLower.includes(r) || codeLower.includes(r));
      });

      const deptContainer = document.createElement('div');
      deptContainer.className = 'department-column-card';

      let usersHtml = '';
      if (deptUsers.length === 0) {
        usersHtml = `<div class="department-empty-tag">Sin usuarios asignados</div>`;
      } else {
        usersHtml = deptUsers.map(profile => `
          <article class="profile-card user-card" data-user-id="${profile.id}" role="button" tabindex="0" aria-label="Ingresar como ${profile.name}">
            <div class="profile-avatar-wrapper">
              <div class="profile-avatar user-avatar">${profile.icon || '👤'}</div>
              <span class="status-dot"></span>
            </div>
            <h3 class="profile-name user-name">${profile.name}</h3>
            <span class="profile-role user-role">${profile.role}</span>
            <p class="profile-desc user-desc">${profile.description || `@${profile.username || profile.id}`}</p>
            <button type="button" class="btn-select-user profile-action-btn">Seleccionar Perfil</button>
          </article>
        `).join('');
      }

      deptContainer.innerHTML = `
        <div class="department-header-badge">
          <span class="dept-header-icon">${dept.icon}</span>
          <span class="dept-header-title">${dept.name}</span>
          <span class="dept-header-count">${deptUsers.length}</span>
        </div>
        <div class="department-users-list">
          ${usersHtml}
        </div>
      `;

      // Registrar eventos click para cada tarjeta del departamento
      deptUsers.forEach(profile => {
        const card = deptContainer.querySelector(`[data-user-id="${profile.id}"]`);
        if (card) {
          const selectUser = (e) => {
            if (e) e.preventDefault();
            openPinModal(profile);
          };
          card.addEventListener('click', selectUser);
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectUser(e);
            }
          });
        }
      });

      profileGrid.appendChild(deptContainer);
    });
  }

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

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closePinModal);
  }

  // Event listener para teclado numérico PIN táctil
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
            // Autenticación asíncrona apuntando a la API PHP / MySQL
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

  // Soporte de entrada por teclado físico
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
    // Intenta autenticar contra api/auth/login.php (MySQL) con fallback local
    const result = await SessionStore.validatePinAsync(selectedUserId, enteredPin);

    if (result.success) {
      // Redirección inmediata al módulo asignado
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
});
