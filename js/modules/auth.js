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
  const profiles = await SessionStore.getProfilesAsync();
  renderProfiles(profiles);

  function renderProfiles(profileList) {
    if (!profileGrid) return;
    profileGrid.innerHTML = '';
    
    if (!profileList || profileList.length === 0) {
      profileGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-muted);">
          No se encontraron perfiles de usuario en la base de datos MySQL.
        </div>
      `;
      return;
    }

    profileList.forEach(profile => {
      const card = document.createElement('article');
      card.className = 'profile-card user-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ingresar como ${profile.name}, ${profile.role}`);

      card.innerHTML = `
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar user-avatar">${profile.icon}</div>
          <span class="status-dot"></span>
        </div>
        <h3 class="profile-name user-name">${profile.name}</h3>
        <span class="profile-role user-role">${profile.role}</span>
        <p class="profile-desc user-desc">${profile.description || ''}</p>
        <button type="button" class="btn-select-user profile-action-btn">Seleccionar Perfil</button>
      `;

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

      profileGrid.appendChild(card);
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
