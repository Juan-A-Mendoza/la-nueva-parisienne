/* ==========================================================================
   MÓDULO 1: CONTROLADOR INTERACTIVO DE AUTENTICACIÓN (AUTH.JS)
   Gestión del flujo de selección de usuario, teclado PIN y feedback
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', () => {
  let selectedUserId = null;
  let currentPin = '';
  const PIN_LENGTH = 4;

  // Elementos DOM
  const profilesGrid = document.getElementById('profilesGrid');
  const pinModal = document.getElementById('pinModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const selectedAvatar = document.getElementById('selectedAvatar');
  const selectedName = document.getElementById('selectedName');
  const selectedRole = document.getElementById('selectedRole');
  const pinDots = document.querySelectorAll('.pin-dot');
  const authMessage = document.getElementById('authMessage');
  const keypad = document.getElementById('keypad');

  // Inicializar renderizado de tarjetas de perfil
  initProfiles();

  function initProfiles() {
    const profiles = SessionStore.getProfiles();
    profilesGrid.innerHTML = '';

    profiles.forEach(profile => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.dataset.userId = profile.id;

      card.innerHTML = `
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar">${profile.icon}</div>
          <span class="status-dot" title="Usuario disponible"></span>
        </div>
        <h3 class="profile-name">${profile.name}</h3>
        <span class="profile-role">${profile.role}</span>
        <p class="profile-desc">${profile.description}</p>
        <div class="profile-action-btn">
          <span>Ingresar PIN</span>
          <span>→</span>
        </div>
      `;

      card.addEventListener('click', () => openPinModal(profile.id));
      profilesGrid.appendChild(card);
    });
  }

  // Abrir Modal de PIN para el perfil seleccionado
  function openPinModal(userId) {
    const profile = SessionStore.getProfileById(userId);
    if (!profile) return;

    selectedUserId = userId;
    currentPin = '';
    updatePinDisplay();
    setMessage('Ingrese su PIN de 4 dígitos para ingresar', false);

    selectedAvatar.textContent = profile.icon;
    selectedName.textContent = profile.name;
    selectedRole.textContent = profile.role;

    pinModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Cerrar Modal
  function closePinModal() {
    pinModal.classList.remove('active');
    document.body.style.overflow = '';
    selectedUserId = null;
    currentPin = '';
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closePinModal);
  }

  pinModal.addEventListener('click', (e) => {
    if (e.target === pinModal) closePinModal();
  });

  // Manejo de eventos de Teclado Táctil/Numérico
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.keypad-btn');
    if (!btn) return;

    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if (val !== undefined) {
      appendDigit(val);
    } else if (action === 'backspace') {
      deleteDigit();
    } else if (action === 'clear') {
      clearPin();
    }
  });

  // Escuchar teclado físico
  document.addEventListener('keydown', (e) => {
    if (!pinModal.classList.contains('active')) return;

    if (e.key >= '0' && e.key <= '9') {
      appendDigit(e.key);
    } else if (e.key === 'Backspace') {
      deleteDigit();
    } else if (e.key === 'Escape') {
      closePinModal();
    }
  });

  function appendDigit(digit) {
    if (currentPin.length < PIN_LENGTH) {
      currentPin += digit;
      updatePinDisplay();

      if (currentPin.length === PIN_LENGTH) {
        verifyPin();
      }
    }
  }

  function deleteDigit() {
    if (currentPin.length > 0) {
      currentPin = currentPin.slice(0, -1);
      updatePinDisplay();
      setMessage('', false);
    }
  }

  function clearPin() {
    currentPin = '';
    updatePinDisplay();
    setMessage('', false);
  }

  function updatePinDisplay() {
    pinDots.forEach((dot, index) => {
      if (index < currentPin.length) {
        dot.classList.add('filled');
        dot.classList.remove('error');
      } else {
        dot.classList.remove('filled', 'error');
      }
    });
  }

  function setMessage(msg, isError = false, isSuccess = false) {
    authMessage.textContent = msg;
    authMessage.className = 'auth-message';
    if (isError) authMessage.classList.add('error-text');
    if (isSuccess) authMessage.classList.add('success-text');
  }

  // Validación de PIN
  function verifyPin() {
    setMessage('Verificando credenciales...', false);
    
    // Retardo sutil para emular procesamiento seguro
    setTimeout(() => {
      const result = SessionStore.validatePin(selectedUserId, currentPin);

      if (result.success) {
        setMessage(`¡Bienvenido/a, ${result.user.name}! Accediendo al sistema...`, false, true);
        
        // Marcar puntos en verde/éxito
        pinDots.forEach(dot => dot.classList.add('filled'));

        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 800);
      } else {
        setMessage(result.message, true);
        
        // Animación de error en los puntos
        pinDots.forEach(dot => dot.classList.add('error'));
        
        setTimeout(() => {
          clearPin();
        }, 900);
      }
    }, 350);
  }
});
