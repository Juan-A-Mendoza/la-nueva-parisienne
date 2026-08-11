/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR INTERACTIVO DE AUTENTICACIÓN (AUTH.JS)
   Manejo de selección de perfiles, modal de PIN táctil y validación API/MySQL
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', () => {
  let selectedUserId = null;
  let enteredPin = '';

  const profileGrid = document.getElementById('profileGrid');
  const pinModal = document.getElementById('pinModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const selectedUserAvatar = document.getElementById('selectedUserAvatar');
  const selectedUserName = document.getElementById('selectedUserName');
  const selectedUserRole = document.getElementById('selectedUserRole');
  const pinDisplayDots = document.querySelectorAll('.pin-dot');
  const pinKeypad = document.getElementById('pinKeypad');
  const pinErrorAlert = document.getElementById('pinErrorAlert');

  // Renderizar tarjetas de perfiles
  const profiles = SessionStore.getProfiles();
  renderProfiles(profiles);

  function renderProfiles(profileList) {
    profileGrid.innerHTML = '';
    profileList.forEach(profile => {
      const card = document.createElement('article');
      card.className = 'user-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ingresar como ${profile.name}, ${profile.role}`);

      card.innerHTML = `
        <div class="user-avatar">${profile.icon}</div>
        <h3 class="user-name">${profile.name}</h3>
        <span class="user-role">${profile.role}</span>
        <p class="user-desc">${profile.description}</p>
        <button type="button" class="btn-select-user">Seleccionar Perfil</button>
      `;

      const selectUser = () => openPinModal(profile);
      card.addEventListener('click', selectUser);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectUser();
        }
      });

      profileGrid.appendChild(card);
    });
  }

  function openPinModal(profile) {
    selectedUserId = profile.id;
    enteredPin = '';
    selectedUserAvatar.textContent = profile.icon;
    selectedUserName.textContent = profile.name;
    selectedUserRole.textContent = profile.role;
    
    hideError();
    updatePinDots();
    pinModal.classList.add('active');
  }

  function closePinModal() {
    pinModal.classList.remove('active');
    selectedUserId = null;
    enteredPin = '';
  }

  closeModalBtn.addEventListener('click', closePinModal);

  // Event listener para teclado numérico PIN táctil
  pinKeypad.addEventListener('click', async (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;

    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if (val) {
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
    } else if (action === 'delete') {
      enteredPin = enteredPin.slice(0, -1);
      updatePinDots();
      hideError();
    }
  });

  // Soporte de entrada por teclado físico
  document.addEventListener('keydown', async (e) => {
    if (!pinModal.classList.contains('active')) return;

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
    pinErrorAlert.textContent = msg;
    pinErrorAlert.classList.add('visible');
  }

  function hideError() {
    pinErrorAlert.classList.remove('visible');
  }

  function shakeModal() {
    const card = pinModal.querySelector('.pin-modal-card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
  }
});
