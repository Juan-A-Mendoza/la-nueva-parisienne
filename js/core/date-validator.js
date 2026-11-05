/* ==========================================================================
   LA NUEVA PARISIENNE - VALIDADOR CENTRAL DE FECHAS (DATE-VALIDATOR.JS)
   Módulo reutilizable para la sincronización reactiva, prevención de fechas
   imposibles y validación de rangos temporales en toda la aplicación.
   ========================================================================== */

/**
 * Obtiene la fecha actual en formato local ISO (YYYY-MM-DD),
 * evitando el desfase de zona horaria de UTC (especialmente para Venezuela UTC-4).
 * @param {Date} [d=new Date()]
 * @returns {string} Fecha local 'YYYY-MM-DD'
 */
export function getLocalDateIso(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Comprueba si una cadena tiene formato válido YYYY-MM-DD y existe en el calendario.
 * @param {string} str 
 * @returns {boolean}
 */
export function isValidIsoDate(str) {
  if (!str || typeof str !== 'string') return false;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

/**
 * Valida si una cadena cumple con el formato oficial de RIF venezolano (J, V, E, G, C).
 * Ejemplos: J-40123456-7, V123456780, G-20000000-1.
 * @param {string} rif
 * @returns {boolean}
 */
export function isValidRif(rif) {
  if (!rif || typeof rif !== 'string') return false;
  return /^[JVEGCjvegc]-?\d{7,9}-?\d?$/.test(rif.trim());
}

/**
 * Valida si una cadena cumple con un formato válido de correo electrónico.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Valida un rango de fechas de inicio y fin.
 * @param {string} fromStr Fecha inicial
 * @param {string} toStr Fecha final
 * @param {Object} [options={}]
 * @param {boolean} [options.allowFuture=false] Si permite fechas futuras a hoy
 * @param {string} [options.minDate='2024-01-01'] Límite inferior global
 * @param {number|null} [options.maxRangeDays=null] Amplitud máxima en días
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDateRange(fromStr, toStr, options = {}) {
  const allowFuture = options.allowFuture ?? false;
  const minDate = options.minDate ?? '2024-01-01';
  const maxRangeDays = options.maxRangeDays ?? null;
  const today = getLocalDateIso();

  // Validar 'Desde' si existe
  if (fromStr) {
    if (!isValidIsoDate(fromStr)) {
      return { valid: false, error: 'La fecha inicial no tiene un formato válido.' };
    }
    if (minDate && fromStr < minDate) {
      return { valid: false, error: `La fecha inicial no puede ser anterior a ${minDate}.` };
    }
    if (!allowFuture && fromStr > today) {
      return { valid: false, error: 'La fecha inicial no puede ser una fecha futura.' };
    }
  }

  // Validar 'Hasta' si existe
  if (toStr) {
    if (!isValidIsoDate(toStr)) {
      return { valid: false, error: 'La fecha final no tiene un formato válido.' };
    }
    if (minDate && toStr < minDate) {
      return { valid: false, error: `La fecha final no puede ser anterior a ${minDate}.` };
    }
    if (!allowFuture && toStr > today) {
      return { valid: false, error: 'La fecha final no puede ser una fecha futura.' };
    }
  }

  // Si ambas existen, validar coherencia y amplitud
  if (fromStr && toStr) {
    if (fromStr > toStr) {
      return { 
        valid: false, 
        error: 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".' 
      };
    }

    if (maxRangeDays && maxRangeDays > 0) {
      const d1 = new Date(fromStr);
      const d2 = new Date(toStr);
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diffDays > maxRangeDays) {
        return { 
          valid: false, 
          error: `El rango seleccionado (${diffDays} días) supera el máximo de ${maxRangeDays} días.` 
        };
      }
    }
  }

  return { valid: true, error: null };
}

/**
 * Vincula dos inputs de fecha (Desde / Hasta) con sincronización reactiva de min/max,
 * validación instantánea y prevención de envíos erróneos.
 *
 * @param {Object} config
 * @param {HTMLInputElement|string} config.fromInput Input o selector de fecha inicial
 * @param {HTMLInputElement|string} config.toInput Input o selector de fecha final
 * @param {boolean} [config.allowFuture=false] Si permite fechas posteriores a hoy
 * @param {string} [config.minDate='2024-01-01'] Fecha mínima absoluta
 * @param {number|null} [config.maxRangeDays=null] Días máximos permitidos en el rango
 * @param {Function} [config.onChange] Callback disparado SOLO cuando las fechas son válidas
 * @param {Function} [config.onError] Callback disparado ante un intento de fecha inválida
 * @param {Function} [config.onValid] Callback disparado cuando un error previo es corregido
 * @returns {Object} Controlador con métodos { validate, reset, setRange }
 */
export function bindDateRangeValidation(config) {
  const fromEl = typeof config.fromInput === 'string' 
    ? document.querySelector(config.fromInput) 
    : config.fromInput;

  const toEl = typeof config.toInput === 'string' 
    ? document.querySelector(config.toInput) 
    : config.toInput;

  if (!fromEl || !toEl) {
    console.warn('[bindDateRangeValidation] Uno o ambos elementos de fecha no existen en el DOM.');
    return null;
  }

  const allowFuture = config.allowFuture ?? false;
  const minDate = config.minDate ?? '2024-01-01';
  const maxRangeDays = config.maxRangeDays ?? null;
  const today = getLocalDateIso();

  // 1. Configurar límites HTML5 nativos iniciales
  fromEl.setAttribute('min', minDate);
  toEl.setAttribute('min', minDate);

  if (!allowFuture) {
    fromEl.setAttribute('max', today);
    toEl.setAttribute('max', today);
  }

  // 2. Estilos para alertar de error visual
  ensureErrorStyles();

  function markError(el, hasError, title = '') {
    if (!el) return;
    if (hasError) {
      el.classList.add('lnp-date-input-error');
      el.title = title;
    } else {
      el.classList.remove('lnp-date-input-error');
      el.removeAttribute('title');
    }
  }

  function clearAllErrors() {
    markError(fromEl, false);
    markError(toEl, false);
  }

  // 3. Sincronización reactiva de límites min/max
  function syncAttributes() {
    const fromVal = fromEl.value;
    const toVal = toEl.value;

    // Si hay fecha inicial, la fecha final no puede ser menor a ella
    if (fromVal && isValidIsoDate(fromVal)) {
      toEl.setAttribute('min', fromVal);
    } else {
      toEl.setAttribute('min', minDate);
    }

    // Si hay fecha final, la inicial no puede superarla (o el tope es hoy si !allowFuture)
    if (toVal && isValidIsoDate(toVal)) {
      const topMax = !allowFuture ? (toVal < today ? toVal : today) : toVal;
      fromEl.setAttribute('max', topMax);
    } else if (!allowFuture) {
      fromEl.setAttribute('max', today);
    } else {
      fromEl.removeAttribute('max');
    }
  }

  // 4. Verificación principal ejecutada en eventos de usuario
  function handleValidation(triggerEl) {
    syncAttributes();

    const fromVal = fromEl.value.trim();
    const toVal = toEl.value.trim();

    const res = validateDateRange(fromVal, toVal, {
      allowFuture,
      minDate,
      maxRangeDays
    });

    if (!res.valid) {
      // Marcar campo conflictivo
      if (fromVal && toVal && fromVal > toVal) {
        markError(fromEl, true, res.error);
        markError(toEl, true, res.error);
      } else if (triggerEl) {
        markError(triggerEl, true, res.error);
      }

      if (typeof config.onError === 'function') {
        config.onError(res.error, triggerEl || fromEl);
      }
      return false;
    }

    // Si es válido, limpiar errores visuales
    clearAllErrors();

    if (typeof config.onValid === 'function') {
      config.onValid();
    }

    if (typeof config.onChange === 'function') {
      config.onChange({ from: fromVal, to: toVal, isValid: true });
    }

    return true;
  }

  // 5. Vincular listeners de interacción (change e input)
  fromEl.addEventListener('change', () => handleValidation(fromEl));
  toEl.addEventListener('change', () => handleValidation(toEl));

  // Control al escribir manualmente
  fromEl.addEventListener('input', () => {
    if (fromEl.value.length === 10 || fromEl.value === '') {
      handleValidation(fromEl);
    }
  });

  toEl.addEventListener('input', () => {
    if (toEl.value.length === 10 || toEl.value === '') {
      handleValidation(toEl);
    }
  });

  // Ejecución inicial de sincronización
  syncAttributes();

  return {
    validate: () => handleValidation(null),
    reset: () => {
      fromEl.value = '';
      toEl.value = '';
      clearAllErrors();
      syncAttributes();
    },
    setRange: (start, end, triggerCallback = true) => {
      fromEl.value = start || '';
      toEl.value = end || '';
      clearAllErrors();
      syncAttributes();
      if (triggerCallback) {
        handleValidation(null);
      }
    }
  };
}

/**
 * Inyecta una regla CSS ligera una sola vez para resaltar inputs con fechas erróneas.
 */
let stylesInjected = false;
function ensureErrorStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'lnp-date-validator-styles';
  style.textContent = `
    .lnp-date-input-error {
      border-color: #EF4444 !important;
      background-color: rgba(239, 68, 68, 0.08) !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
      animation: lnp-shake 0.3s ease-in-out;
    }
    @keyframes lnp-shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
}

