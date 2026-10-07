/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR DE AUTENTICACIÓN CLÁSICA (AUTH.JS)
   Manejo de Login Clásico Directo (Usuario + Contraseña) y Soporte Superadmin
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const loginForm = document.getElementById('classicLoginForm');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const submitButton = document.getElementById('loginSubmitBtn');
  const errorAlert = document.getElementById('loginErrorAlert');
  const togglePasswordBtn = document.getElementById('btnTogglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

  // Inicializar íconos Lucide
  window.LucideIcons?.refresh();

  /**
   * Muestra mensaje de error accesible
   */
  function showError(message) {
    if (!errorAlert) return;
    errorAlert.innerHTML = `
      <i data-lucide="alert-circle" class="icon-sm" style="flex-shrink: 0;" aria-hidden="true"></i>
      <span>${message}</span>
    `;
    errorAlert.style.display = 'flex';
    window.LucideIcons?.refresh();
  }

  /**
   * Oculta el mensaje de error
   */
  function clearError() {
    if (!errorAlert) return;
    errorAlert.textContent = '';
    errorAlert.style.display = 'none';
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      if (togglePasswordIcon) {
        togglePasswordIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        togglePasswordBtn.setAttribute(
          'aria-label',
          isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
        );
        window.LucideIcons?.refresh();
      }
    });
  }

  /**
   * Manejo de Envío del Formulario de Login
   */
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();

    const username = usernameInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    if (!username || !password) {
      showError('Por favor complete ambos campos (usuario y contraseña).');
      return;
    }

    // Estado visual de carga
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <span class="spinner-sm" style="display:inline-block; width:16px; height:16px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation: spin 0.6s linear infinite;" aria-hidden="true"></span>
        <span>Verificando credenciales...</span>
      `;
    }

    try {
      // Validar contra MySQL con fallback local mediante SessionStore
      const result = await SessionStore.validateCredentialsAsync(username, password);

      if (result && result.success) {
        // Redirección al módulo correspondiente
        const targetUrl = result.redirectUrl || 'modules/dashboard.html';
        window.location.href = targetUrl;
      } else {
        showError(result?.message || 'Usuario o contraseña incorrectos.');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    } catch (error) {
      console.error('Error al procesar el inicio de sesión:', error);
      showError('Ocurrió un error inesperado al validar la sesión. Intente nuevamente.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `
          <i data-lucide="log-in" class="icon-sm" aria-hidden="true"></i>
          <span>Iniciar Sesión</span>
        `;
        window.LucideIcons?.refresh();
      }
    }
  });

  // Limpiar error al escribir
  usernameInput?.addEventListener('input', clearError);
  passwordInput?.addEventListener('input', clearError);
});
