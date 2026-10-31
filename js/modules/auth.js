/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR DE AUTENTICACIÓN CLÁSICA Y 2FA (AUTH.JS)
   Manejo de Login en Dos Pasos (Usuario + Clave) -> (2FA / PIN Maestro Superadmin)
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM - Paso 1
  const step1Section = document.getElementById('step1Section');
  const loginForm = document.getElementById('classicLoginForm');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const submitButton = document.getElementById('loginSubmitBtn');
  const errorAlert = document.getElementById('loginErrorAlert');
  const togglePasswordBtn = document.getElementById('btnTogglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

  // Elementos del DOM - Paso 2 (2FA / PIN Maestro)
  const step2Section = document.getElementById('step2Section');
  const twoFactorForm = document.getElementById('twoFactorForm');
  const twoFactorCodeInput = document.getElementById('twoFactorCodeInput');
  const twoFactorSubmitBtn = document.getElementById('twoFactorSubmitBtn');
  const twoFactorErrorAlert = document.getElementById('twoFactorErrorAlert');
  const btnCancel2fa = document.getElementById('btnCancel2fa');
  const btnToggle2faCode = document.getElementById('btnToggle2faCode');
  const toggle2faIcon = document.getElementById('toggle2faIcon');

  const step2AvatarIcon = document.getElementById('step2AvatarIcon');
  const step2Title = document.getElementById('step2Title');
  const step2Subtitle = document.getElementById('step2Subtitle');
  const step2UserPill = document.getElementById('step2UserPill');
  const step2UserAvatar = document.getElementById('step2UserAvatar');
  const step2UserName = document.getElementById('step2UserName');
  const step2UserRole = document.getElementById('step2UserRole');
  const step2InputLabel = document.getElementById('step2InputLabel');
  const step2HintText = document.getElementById('step2HintText');

  // Elementos del DOM - Paso 3 (Patrón Gestual 3x3)
  const step3Section = document.getElementById('step3Section');
  const threeFactorForm = document.getElementById('threeFactorForm');
  const patternErrorAlert = document.getElementById('patternErrorAlert');
  const patternStatusText = document.getElementById('patternStatusText');
  const patternCanvasContainer = document.getElementById('patternCanvasContainer');
  const patternCanvas = document.getElementById('patternCanvas');
  const patternCodeInput = document.getElementById('patternCodeInput');
  const btnResetPattern = document.getElementById('btnResetPattern');
  const btnBackToStep2 = document.getElementById('btnBackToStep2');
  const step3UserName = document.getElementById('step3UserName');
  const step3UserAvatar = document.getElementById('step3UserAvatar');

  // Estado temporal de autenticación
  let currentTempToken = null;
  let currentUser = null;
  let isSuperadmin = false;

  // Inicializar íconos Lucide
  window.LucideIcons?.refresh();

  /**
   * Muestra mensaje de error en Paso 1
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

  function clearError() {
    if (!errorAlert) return;
    errorAlert.textContent = '';
    errorAlert.style.display = 'none';
  }

  /**
   * Muestra mensaje de error en Paso 2 (2FA)
   */
  function show2FAError(message) {
    if (!twoFactorErrorAlert) return;
    twoFactorErrorAlert.innerHTML = `
      <i data-lucide="alert-triangle" class="icon-sm" style="flex-shrink: 0;" aria-hidden="true"></i>
      <span>${message}</span>
    `;
    twoFactorErrorAlert.style.display = 'flex';
    window.LucideIcons?.refresh();
  }

  function clear2FAError() {
    if (!twoFactorErrorAlert) return;
    twoFactorErrorAlert.textContent = '';
    twoFactorErrorAlert.style.display = 'none';
  }

  /**
   * Muestra mensaje de error en Paso 3 (Patrón Gestual)
   */
  function showPatternError(message) {
    if (!patternErrorAlert) return;
    patternErrorAlert.innerHTML = `
      <i data-lucide="alert-triangle" class="icon-sm" style="flex-shrink: 0;" aria-hidden="true"></i>
      <span>${message}</span>
    `;
    patternErrorAlert.style.display = 'flex';
    window.LucideIcons?.refresh();
  }

  function clearPatternError() {
    if (!patternErrorAlert) return;
    patternErrorAlert.textContent = '';
    patternErrorAlert.style.display = 'none';
  }

  function updatePatternStatusText(text) {
    if (patternStatusText) patternStatusText.textContent = text;
  }

  /**
   * Alternar visibilidad de la contraseña en Paso 1
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
   * Alternar visibilidad del código en Paso 2
   */
  if (btnToggle2faCode && twoFactorCodeInput) {
    btnToggle2faCode.addEventListener('click', () => {
      const isPassword = twoFactorCodeInput.type === 'password';
      twoFactorCodeInput.type = isPassword ? 'text' : 'password';

      if (toggle2faIcon) {
        toggle2faIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        btnToggle2faCode.setAttribute(
          'aria-label',
          isPassword ? 'Ocultar código' : 'Mostrar código'
        );
        window.LucideIcons?.refresh();
      }
    });
  }

  /**
   * PASO 1: Envío de Credenciales Primarias (Usuario + Clave)
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

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <span class="spinner-sm" style="display:inline-block; width:16px; height:16px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation: spin 0.6s linear infinite;" aria-hidden="true"></span>
        <span>Validando credenciales...</span>
      `;
    }

    try {
      const result = await SessionStore.validateCredentialsAsync(username, password);

      if (result && result.success) {
        currentTempToken = result.tempToken;
        currentUser = result.user;
        isSuperadmin = !!result.isSuperadmin;

        if (result.requires2FA) {
          mostrarPaso2();
        } else if (result.requiresPattern) {
          mostrarPaso3();
        } else {
          const targetUrl = result.redirectUrl || 'modules/dashboard.html';
          window.location.href = targetUrl;
        }
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
          <i data-lucide="arrow-right" class="icon-sm" aria-hidden="true"></i>
          <span>Continuar</span>
        `;
        window.LucideIcons?.refresh();
      }
    }
  });

  /**
   * Transición visual al Paso 2 (Google Authenticator 2FA)
   */
  function mostrarPaso2() {
    clearError();
    clear2FAError();

    if (step1Section) step1Section.style.display = 'none';
    if (step3Section) step3Section.style.display = 'none';
    if (step2Section) step2Section.style.display = 'block';

    const userIconName = currentUser?.icon || (isSuperadmin ? 'crown' : 'user');

    if (step2UserAvatar) {
      step2UserAvatar.innerHTML = window.LucideIcons ? window.LucideIcons.render(userIconName, 'icon-sm') : '';
    }
    if (step2UserName) {
      step2UserName.textContent = currentUser?.name || currentUser?.username || 'Usuario Identificado';
    }

    if (isSuperadmin) {
      if (step2AvatarIcon) {
        step2AvatarIcon.innerHTML = window.LucideIcons ? window.LucideIcons.render('shield-alert', 'icon-lg') : '';
        step2AvatarIcon.style.color = 'var(--color-gold-dark)';
      }
      if (step2Title) step2Title.textContent = 'Verificación de Seguridad';
      if (step2Subtitle) step2Subtitle.textContent = 'Ingrese código de Google Authenticator';
      if (step2UserPill) step2UserPill.classList.add('superadmin-pill');
      if (step2UserRole) step2UserRole.textContent = 'SUPERADMINISTRADOR (NIVEL 3FA)';
      if (step2InputLabel) {
        step2InputLabel.innerHTML = `<span><i data-lucide="shield-check" class="icon-xs"></i> Código Dinámico Google Authenticator (6 dígitos)</span><span id="totpLiveStatus" style="font-size: 0.72rem; color: var(--color-success); font-weight: 700;">• En Vivo (RFC 6238)</span>`;
      }
      if (step2HintText) {
        step2HintText.innerHTML = `Nivel Superadministrador: Ingrese los 6 dígitos generados en su app Google Authenticator.`;
      }
    } else {
      if (step2AvatarIcon) {
        step2AvatarIcon.innerHTML = window.LucideIcons ? window.LucideIcons.render('shield-check', 'icon-lg') : '';
        step2AvatarIcon.style.color = '';
      }
      if (step2Title) step2Title.textContent = 'Verificación de Seguridad';
      if (step2Subtitle) step2Subtitle.textContent = 'Ingrese el código de su aplicación Authenticator';
      if (step2UserPill) step2UserPill.classList.remove('superadmin-pill');
      if (step2UserRole) step2UserRole.textContent = currentUser?.role || 'Personal de Tienda';
      if (step2InputLabel) {
        step2InputLabel.innerHTML = `<span><i data-lucide="smartphone" class="icon-xs"></i> Código Google Authenticator (6 dígitos)</span><span id="totpLiveStatus" style="font-size: 0.72rem; color: var(--color-success); font-weight: 700;">• En Vivo (RFC 6238)</span>`;
      }
      if (step2HintText) {
        step2HintText.innerHTML = `Abra Google Authenticator en su teléfono e ingrese los 6 dígitos temporales.`;
      }
    }

    if (twoFactorCodeInput) {
      twoFactorCodeInput.value = '';
    }

    resetOtpBoxes();
    startTotpTimer();
    setTimeout(() => {
      document.getElementById('otpDigit0')?.focus();
    }, 150);

    window.LucideIcons?.refresh();
  }

  // ==========================================================================
  // MANEJO DE CASILLAS OTP INTERACTIVAS (6 DÍGITOS)
  // ==========================================================================
  const otpBoxes = Array.from({ length: 6 }, (_, i) => document.getElementById(`otpDigit${i}`));
  const btnToggleKeypad = document.getElementById('btnToggleKeypad');
  const btnToggleKeypadText = document.getElementById('btnToggleKeypadText');
  const touchKeypadWrapper = document.getElementById('touchKeypadWrapper');
  const btnKeypadClear = document.getElementById('btnKeypadClear');
  const btnKeypadBackspace = document.getElementById('btnKeypadBackspace');
  let totpIntervalId = null;

  function resetOtpBoxes() {
    otpBoxes.forEach(box => {
      if (box) {
        box.value = '';
        box.classList.remove('filled', 'error');
      }
    });
    if (twoFactorCodeInput) twoFactorCodeInput.value = '';
  }

  function getCombinedOtpCode() {
    return otpBoxes.map(b => b ? b.value.trim() : '').join('');
  }

  function syncOtpToHiddenInput() {
    const code = getCombinedOtpCode();
    if (twoFactorCodeInput) twoFactorCodeInput.value = code;
    clear2FAError();

    otpBoxes.forEach(box => {
      if (box) {
        if (box.value.trim()) box.classList.add('filled');
        else box.classList.remove('filled');
      }
    });

    if (code.length === 6) {
      setTimeout(() => {
        if (twoFactorForm) {
          twoFactorForm.requestSubmit ? twoFactorForm.requestSubmit() : twoFactorForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }, 80);
    }
  }

  otpBoxes.forEach((box, index) => {
    if (!box) return;

    box.addEventListener('input', (e) => {
      const val = box.value.replace(/[^0-9]/g, '');
      box.value = val ? val[0] : '';

      if (box.value && index < 5) {
        otpBoxes[index + 1]?.focus();
      }
      syncOtpToHiddenInput();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!box.value && index > 0) {
          e.preventDefault();
          otpBoxes[index - 1].value = '';
          otpBoxes[index - 1].focus();
          syncOtpToHiddenInput();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        otpBoxes[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < 5) {
        otpBoxes[index + 1]?.focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const numbersOnly = pasteData.replace(/[^0-9]/g, '').slice(0, 6);

      if (numbersOnly.length > 0) {
        for (let i = 0; i < 6; i++) {
          if (otpBoxes[i]) {
            otpBoxes[i].value = numbersOnly[i] || '';
          }
        }
        const nextIndex = Math.min(numbersOnly.length, 5);
        otpBoxes[nextIndex]?.focus();
        syncOtpToHiddenInput();
      }
    });
  });

  // ==========================================================================
  // MEDIDOR DINÁMICO DE TIEMPO (TOTP 30 SEGUNDOS)
  // ==========================================================================
  function startTotpTimer() {
    if (totpIntervalId) clearInterval(totpIntervalId);

    function updateGauge() {
      const currentSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (currentSeconds % 30);
      const fillBar = document.getElementById('totpProgressBarFill');
      const textElem = document.getElementById('totpCountdownText');

      if (textElem) textElem.textContent = `${remaining}s`;
      if (fillBar) {
        const percent = (remaining / 30) * 100;
        fillBar.style.width = `${percent}%`;

        if (remaining <= 6) {
          fillBar.classList.add('warning');
        } else {
          fillBar.classList.remove('warning');
        }
      }
    }

    updateGauge();
    totpIntervalId = setInterval(updateGauge, 1000);
  }

  // ==========================================================================
  // TECLADO TÁCTIL EN PANTALLA (TOUCH KEYPAD PARA POS)
  // ==========================================================================
  if (btnToggleKeypad && touchKeypadWrapper) {
    btnToggleKeypad.addEventListener('click', () => {
      const isActive = touchKeypadWrapper.classList.toggle('active');
      if (btnToggleKeypadText) {
        btnToggleKeypadText.textContent = isActive ? 'Ocultar Teclado Táctil' : 'Abrir Teclado Táctil en Pantalla';
      }
      window.LucideIcons?.refresh();
    });
  }

  touchKeypadWrapper?.addEventListener('click', (e) => {
    const btn = e.target.closest('.keypad-btn');
    if (!btn) return;

    const numKey = btn.dataset.key;
    if (numKey !== undefined) {
      const emptyIndex = otpBoxes.findIndex(b => b && !b.value.trim());
      if (emptyIndex !== -1) {
        otpBoxes[emptyIndex].value = numKey;
        if (emptyIndex < 5) otpBoxes[emptyIndex + 1]?.focus();
        else otpBoxes[emptyIndex]?.focus();
        syncOtpToHiddenInput();
      }
    } else if (btn === btnKeypadClear) {
      resetOtpBoxes();
      otpBoxes[0]?.focus();
    } else if (btn === btnKeypadBackspace) {
      const filledIndices = otpBoxes.map((b, i) => (b && b.value.trim() ? i : -1)).filter(i => i !== -1);
      if (filledIndices.length > 0) {
        const lastIndex = filledIndices[filledIndices.length - 1];
        otpBoxes[lastIndex].value = '';
        otpBoxes[lastIndex].focus();
        syncOtpToHiddenInput();
      }
    }
  });

  /**
   * Regresar al Paso 1
   */
  btnCancel2fa?.addEventListener('click', () => {
    clear2FAError();
    if (totpIntervalId) clearInterval(totpIntervalId);
    currentTempToken = null;
    currentUser = null;
    isSuperadmin = false;
    resetOtpBoxes();

    if (step2Section) step2Section.style.display = 'none';
    if (step3Section) step3Section.style.display = 'none';
    if (step1Section) step1Section.style.display = 'block';

    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
    window.LucideIcons?.refresh();
  });

  /**
   * PASO 2: Envío de Verificación 2FA (Google Authenticator)
   */
  twoFactorForm?.addEventListener('submit', async event => {
    event.preventDefault();
    clear2FAError();

    const code = getCombinedOtpCode() || twoFactorCodeInput?.value.trim() || '';

    if (!code || code.length < 6) {
      show2FAError('Por favor complete los 6 dígitos del código.');
      otpBoxes.forEach(b => b?.classList.add('error'));
      setTimeout(() => otpBoxes.forEach(b => b?.classList.remove('error')), 600);
      return;
    }

    if (twoFactorSubmitBtn) {
      twoFactorSubmitBtn.disabled = true;
      twoFactorSubmitBtn.innerHTML = `
        <span class="spinner-sm" style="display:inline-block; width:16px; height:16px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation: spin 0.6s linear infinite;" aria-hidden="true"></span>
        <span>Verificando código de seguridad...</span>
      `;
    }

    try {
      const verifyResult = await SessionStore.verify2FAAsync(currentTempToken, code, currentUser);

      if (verifyResult && verifyResult.success) {
        if (totpIntervalId) clearInterval(totpIntervalId);

        // Si es Superadmin y requiere 3er factor (Patrón Gestual 3x3)
        if (verifyResult.requires3FA) {
          currentTempToken = verifyResult.tempToken || currentTempToken;
          currentUser = verifyResult.user || currentUser;
          mostrarPaso3();
          return;
        }

        const targetUrl = verifyResult.redirectUrl || 'modules/dashboard.html';
        window.location.href = targetUrl;
      } else {
        show2FAError(verifyResult?.message || 'Código de verificación incorrecto o expirado.');
        otpBoxes.forEach(b => {
          if (b) {
            b.classList.add('error');
            b.value = '';
          }
        });
        if (twoFactorCodeInput) twoFactorCodeInput.value = '';
        setTimeout(() => {
          otpBoxes.forEach(b => b?.classList.remove('error'));
          otpBoxes[0]?.focus();
        }, 500);
      }
    } catch (err) {
      console.error('Error al verificar segundo factor:', err);
      show2FAError('Error al validar la seguridad. Intente nuevamente.');
    } finally {
      if (twoFactorSubmitBtn) {
        twoFactorSubmitBtn.disabled = false;
        twoFactorSubmitBtn.innerHTML = `
          <i data-lucide="shield-check" class="icon-sm" aria-hidden="true"></i>
          <span>Verificar y Acceder</span>
        `;
        window.LucideIcons?.refresh();
      }
    }
  });

  // ==========================================================================
  // PASO 3: TERCER FACTOR - PATRÓN GESTUAL 3x3 (EXCLUSIVO SUPERADMIN)
  // ==========================================================================
  const GRID_SIZE = 3;
  const CANVAS_WIDTH = 280;
  const CANVAS_HEIGHT = 280;
  const PADDING = 44;
  const SPACING = (CANVAS_WIDTH - PADDING * 2) / (GRID_SIZE - 1); // 96px

  const patternPoints = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      patternPoints.push({
        index: r * GRID_SIZE + c,
        row: r,
        col: c,
        x: PADDING + c * SPACING,
        y: PADDING + r * SPACING
      });
    }
  }

  let selectedPattern = [];
  let isDrawingPattern = false;
  let currentPointerPos = null;
  let isPatternLocked = false;
  let patternVisualStatus = 'normal'; // 'normal' | 'error' | 'success'
  const patternCtx = patternCanvas?.getContext('2d');

  function initPatternCanvas() {
    if (!patternCanvas || !patternCtx) return;
    const dpr = window.devicePixelRatio || 1;
    patternCanvas.width = CANVAS_WIDTH * dpr;
    patternCanvas.height = CANVAS_HEIGHT * dpr;
    patternCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderPattern();
  }

  function renderPattern() {
    if (!patternCtx) return;
    patternCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Trazar líneas entre puntos conectados
    if (selectedPattern.length > 0) {
      patternCtx.beginPath();
      const firstPt = patternPoints[selectedPattern[0]];
      patternCtx.moveTo(firstPt.x, firstPt.y);

      for (let i = 1; i < selectedPattern.length; i++) {
        const pt = patternPoints[selectedPattern[i]];
        patternCtx.lineTo(pt.x, pt.y);
      }

      if (isDrawingPattern && currentPointerPos && !isPatternLocked) {
        patternCtx.lineTo(currentPointerPos.x, currentPointerPos.y);
      }

      patternCtx.lineWidth = 5;
      patternCtx.lineCap = 'round';
      patternCtx.lineJoin = 'round';

      if (patternVisualStatus === 'error') {
        patternCtx.strokeStyle = '#E03131';
        patternCtx.shadowColor = 'rgba(224, 49, 49, 0.7)';
        patternCtx.shadowBlur = 12;
      } else if (patternVisualStatus === 'success') {
        patternCtx.strokeStyle = '#2F9E44';
        patternCtx.shadowColor = 'rgba(47, 158, 68, 0.7)';
        patternCtx.shadowBlur = 14;
      } else {
        patternCtx.strokeStyle = 'rgba(212, 155, 84, 0.95)';
        patternCtx.shadowColor = 'rgba(212, 155, 84, 0.7)';
        patternCtx.shadowBlur = 10;
      }

      patternCtx.stroke();
      patternCtx.shadowBlur = 0;
    }

    // 2. Dibujar los 9 puntos
    patternPoints.forEach(pt => {
      const isSelected = selectedPattern.includes(pt.index);

      // Anillo exterior
      patternCtx.beginPath();
      patternCtx.arc(pt.x, pt.y, isSelected ? 22 : 16, 0, Math.PI * 2);

      if (isSelected) {
        if (patternVisualStatus === 'error') {
          patternCtx.strokeStyle = '#E03131';
          patternCtx.fillStyle = 'rgba(224, 49, 49, 0.18)';
        } else if (patternVisualStatus === 'success') {
          patternCtx.strokeStyle = '#2F9E44';
          patternCtx.fillStyle = 'rgba(47, 158, 68, 0.2)';
        } else {
          patternCtx.strokeStyle = 'rgba(212, 155, 84, 0.9)';
          patternCtx.fillStyle = 'rgba(212, 155, 84, 0.22)';
        }
        patternCtx.lineWidth = 2.5;
        patternCtx.fill();
        patternCtx.stroke();
      } else {
        patternCtx.strokeStyle = 'rgba(124, 90, 56, 0.45)';
        patternCtx.lineWidth = 1.5;
        patternCtx.stroke();
      }

      // Punto central
      patternCtx.beginPath();
      patternCtx.arc(pt.x, pt.y, isSelected ? 7 : 5, 0, Math.PI * 2);

      if (isSelected) {
        if (patternVisualStatus === 'error') {
          patternCtx.fillStyle = '#E03131';
        } else if (patternVisualStatus === 'success') {
          patternCtx.fillStyle = '#2F9E44';
        } else {
          patternCtx.fillStyle = '#F5D096';
        }
      } else {
        patternCtx.fillStyle = 'rgba(212, 155, 84, 0.7)';
      }
      patternCtx.fill();
    });
  }

  function getCanvasPointer(e) {
    if (!patternCanvas) return { x: 0, y: 0 };
    const rect = patternCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function getNearbyPatternPoint(pos, radius = 28) {
    return patternPoints.find(pt => {
      const dx = pt.x - pos.x;
      const dy = pt.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  if (patternCanvas) {
    patternCanvas.addEventListener('pointerdown', (e) => {
      if (isPatternLocked) return;
      e.preventDefault();
      try { patternCanvas.setPointerCapture(e.pointerId); } catch (_) {}

      clearPatternError();
      selectedPattern = [];
      patternVisualStatus = 'normal';
      patternCanvasContainer?.classList.remove('shake', 'success');

      const pos = getCanvasPointer(e);
      const startPt = getNearbyPatternPoint(pos);
      if (startPt) {
        isDrawingPattern = true;
        selectedPattern.push(startPt.index);
        currentPointerPos = pos;
        updatePatternStatusText('Trazando patrón de seguridad...');
        renderPattern();
      }
    });

    patternCanvas.addEventListener('pointermove', (e) => {
      if (!isDrawingPattern || isPatternLocked) return;
      e.preventDefault();
      const pos = getCanvasPointer(e);
      currentPointerPos = pos;

      const pt = getNearbyPatternPoint(pos);
      if (pt && !selectedPattern.includes(pt.index)) {
        selectedPattern.push(pt.index);
      }
      renderPattern();
    });

    const finishPatternDrawing = async (e) => {
      if (!isDrawingPattern) return;
      isDrawingPattern = false;
      currentPointerPos = null;

      try {
        if (patternCanvas.hasPointerCapture(e.pointerId)) {
          patternCanvas.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      if (selectedPattern.length < 3) {
        updatePatternStatusText('Conecte al menos 3 puntos');
        selectedPattern = [];
        renderPattern();
        return;
      }

      await submitPattern();
    };

    patternCanvas.addEventListener('pointerup', finishPatternDrawing);
    patternCanvas.addEventListener('pointercancel', finishPatternDrawing);
  }

  async function submitPattern() {
    isPatternLocked = true;
    const patternStr = selectedPattern.join('-');
    if (patternCodeInput) patternCodeInput.value = patternStr;

    updatePatternStatusText('Validando patrón gestual...');
    renderPattern();

    try {
      const res = await SessionStore.verifyPatternAsync(currentTempToken, patternStr, currentUser);
      if (res && res.success) {
        patternVisualStatus = 'success';
        patternCanvasContainer?.classList.add('success');
        updatePatternStatusText('¡Patrón Autorizado! Accediendo...');
        renderPattern();

        setTimeout(() => {
          const targetUrl = res.redirectUrl || 'modules/dashboard.html';
          window.location.href = targetUrl;
        }, 500);
      } else {
        patternVisualStatus = 'error';
        patternCanvasContainer?.classList.add('shake');
        updatePatternStatusText('Patrón gestual incorrecto');
        showPatternError(res?.message || 'El patrón trazado no es correcto. Intente nuevamente.');
        renderPattern();

        setTimeout(() => {
          patternCanvasContainer?.classList.remove('shake');
          selectedPattern = [];
          patternVisualStatus = 'normal';
          isPatternLocked = false;
          updatePatternStatusText('Conecte los puntos para verificar su identidad');
          renderPattern();
        }, 850);
      }
    } catch (err) {
      console.error('Error al verificar patrón gestual:', err);
      showPatternError('Error de comunicación al verificar el patrón.');
      patternVisualStatus = 'error';
      renderPattern();
      isPatternLocked = false;
    }
  }

  function mostrarPaso3() {
    clear2FAError();
    clearPatternError();

    if (step1Section) step1Section.style.display = 'none';
    if (step2Section) step2Section.style.display = 'none';
    if (step3Section) step3Section.style.display = 'block';

    const userIconName = currentUser?.icon || (isSuperadmin ? 'crown' : 'user');
    if (step3UserName) {
      step3UserName.textContent = currentUser?.name || currentUser?.username || 'Usuario Identificado';
    }
    if (step3UserAvatar) {
      step3UserAvatar.innerHTML = window.LucideIcons ? window.LucideIcons.render(userIconName, 'icon-sm') : '';
    }
    const step3UserRole = document.getElementById('step3UserRole');
    if (step3UserRole) {
      step3UserRole.textContent = currentUser?.role || 'Personal Autorizado';
    }

    const step3Title = document.getElementById('step3Title');
    const step3Subtitle = document.getElementById('step3Subtitle');
    const isAmbos = (currentUser?.mfaTipo === 'ambos') || (currentUser?.mfa_tipo === 'ambos');

    if (step3Title) {
      step3Title.textContent = 'Patrón de Seguridad';
    }
    if (step3Subtitle) {
      step3Subtitle.textContent = 'Trace su patrón gestual para continuar';
    }

    selectedPattern = [];
    patternVisualStatus = 'normal';
    isPatternLocked = false;
    patternCanvasContainer?.classList.remove('shake', 'success');
    updatePatternStatusText('Conecte los puntos para verificar su identidad');

    initPatternCanvas();
    window.LucideIcons?.refresh();
  }

  btnResetPattern?.addEventListener('click', () => {
    if (isPatternLocked) return;
    selectedPattern = [];
    patternVisualStatus = 'normal';
    patternCanvasContainer?.classList.remove('shake', 'success');
    clearPatternError();
    updatePatternStatusText('Conecte los puntos para verificar su identidad');
    renderPattern();
  });

  btnBackToStep2?.addEventListener('click', () => {
    if (step3Section) step3Section.style.display = 'none';
    const isDirectPattern = (currentUser?.mfaTipo === 'patron') || (currentUser?.mfa_tipo === 'patron');

    if (isDirectPattern) {
      if (step1Section) step1Section.style.display = 'block';
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    } else {
      if (step2Section) step2Section.style.display = 'block';
      resetOtpBoxes();
      startTotpTimer();
      setTimeout(() => {
        document.getElementById('otpDigit0')?.focus();
      }, 150);
    }
    window.LucideIcons?.refresh();
  });

  // Limpiar errores al teclear
  usernameInput?.addEventListener('input', clearError);
  passwordInput?.addEventListener('input', clearError);
  twoFactorCodeInput?.addEventListener('input', clear2FAError);
});


