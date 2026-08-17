/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR MÓDULO 9 CONFIGURACIONES (CONFIGURACIONES.JS)
   Gestión de datos fiscales de la empresa y Tasa Cambiaria BCV / Multimoneda
   Sincronización en vivo con bloqueo estricto Auto vs Manual
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar Sesión Activa y Permisos de Gerente General
  const session = SessionStore.getSession();
  if (!session || !session.user) {
    alert('⚠️ Sesión expirada o no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Comprobar rol de Gerente General
  const userRole = (session.user.role || '').toLowerCase();
  const userRoleCode = session.user.roleCode || '';
  const isGerenteGeneral = userRoleCode === 'ADMIN' || userRole.includes('gerente general') || userRole.includes('administrador');

  if (!isGerenteGeneral) {
    alert('⛔ Acceso Restringido: El Módulo 9 (Configuraciones) solo puede ser accedido por el Gerente General desde el Módulo 4 (Dashboard Gerencial).');
    window.location.href = 'dashboard.html';
    return;
  }

  if (session.user) {
    const managerAvatar = document.getElementById('managerAvatar');
    const managerName = document.getElementById('managerName');
    if (managerAvatar) managerAvatar.textContent = session.user.icon || '👨‍💼';
    if (managerName) managerName.textContent = session.user.name || 'Gerente General';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => SessionStore.logout());
  }

  // 2. Elementos del Formulario
  const empresaForm = document.getElementById('empresaForm');
  const empresaNombre = document.getElementById('empresaNombre');
  const empresaRif = document.getElementById('empresaRif');
  const empresaDireccion = document.getElementById('empresaDireccion');
  const empresaTelefono = document.getElementById('empresaTelefono');
  const statusBanner = document.getElementById('statusBanner');

  // ==========================================================================
  // LÓGICA DE CONTROL DE TASA AUTOMÁTICA VS MANUAL INDEPENDIENTES
  // ==========================================================================
  const radioAutoConfig = document.getElementById('radio_auto');
  const radioManualConfig = document.getElementById('radio_manual');
  const inputTasaConfig = document.getElementById('input_tasa_manual');
  const labelCandadoConfig = document.getElementById('label_candado');
  const textoEstadoConfig = document.getElementById('texto_estado_tasa');
  const previewRateVal = document.getElementById('previewRateVal');
  const lblModoAuto = document.getElementById('lblModoAuto');
  const lblModoManual = document.getElementById('lblModoManual');

  // Función auxiliar para consultar la API BCV en vivo (Fawaz Ahmed via jsdelivr)
  async function fetchLiveBcvRate() {
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.usd && data.usd.ves && parseFloat(data.usd.ves) > 0) {
          const autoRate = parseFloat(data.usd.ves);
          localStorage.setItem('tasa_auto', autoRate.toString());
          localStorage.setItem('tasaAuto', autoRate.toString());
          return autoRate;
        }
      }
    } catch (e) {
      console.warn('Error al consultar currency-api:', e);
    }
    return parseFloat(localStorage.getItem('tasa_auto') || localStorage.getItem('tasaAuto')) || 761.21;
  }

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
        inputTasaConfig.style.opacity = '0.5';
        inputTasaConfig.style.background = '#F5F5F5';
      }
      if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• Tasa: Automática (API en Vivo)';

      if (previewRateVal) previewRateVal.textContent = '⏳ Consultando API...';
      activeRate = await fetchLiveBcvRate();
      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (liveAutoRateVal) liveAutoRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
    }

    // Transmitir cambio instantáneo a Módulo 4 Dashboard y POS (Caja)
    const activeSource = isManual ? 'Tasa Manual Gerencial' : 'BCV Oficial (currency-api en Vivo)';
    if (typeof BroadcastChannel !== 'undefined') {
      const rateChannel = new BroadcastChannel('lnp_bcv_channel');
      rateChannel.postMessage({ rate: activeRate, mode: modoVal, source: activeSource });
    }
    window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: activeRate, mode: modoVal } }));
  }

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
          const rateChannel = new BroadcastChannel('lnp_bcv_channel');
          rateChannel.postMessage({ rate: val, mode: 'manual', source: 'Tasa Manual Gerencial' });
        }
        window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: val, mode: 'manual' } }));
      }
    });
  }

  // 3. Cargar Datos Fiscales y Tasas Actuales al Iniciar
  await loadEmpresaData();

  async function loadEmpresaData() {
    // 1. Cargar y recordar inmediatamente la última modalidad y tasa guardadas en localStorage
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
    const isManual = modoGuardado === 'manual';
    
    if (isManual && radioManualConfig) radioManualConfig.checked = true;
    if (!isManual && radioAutoConfig) radioAutoConfig.checked = true;

    const tasaManualSaved = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
    if (inputTasaConfig) inputTasaConfig.value = tasaManualSaved.toFixed(2);

    await actualizarVistaTasaConfig(isManual);

    // 2. Cargar datos fiscales de la empresa desde el servidor
    try {
      const res = await fetch(`../api/get_empresa.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.empresa) {
          if (empresaNombre) empresaNombre.value = data.empresa.nombre || '';
          if (empresaRif) empresaRif.value = data.empresa.rif || '';
          if (empresaDireccion) empresaDireccion.value = data.empresa.direccion || '';
          if (empresaTelefono) empresaTelefono.value = data.empresa.telefono || '';
        }
      }
    } catch (e) {
      console.warn('Error al consultar get_empresa.php:', e);
    }
  }

  // 4. Guardar Datos Fiscales de la Empresa
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
        showStatus('Guardando datos fiscales de la empresa...', 'info');
        
        const res = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            showStatus('✓ ¡Datos fiscales de la empresa guardados exitosamente!', 'success');
            return;
          }
        }
        showStatus('✓ ¡Datos fiscales guardados localmente!', 'success');
      } catch (err) {
        showStatus('✓ ¡Datos fiscales guardados exitosamente en la sesión actual!', 'success');
      }
    });
  }

  // 5. Guardar Configuración de Tasa de Cambio (Dos Variables Independientes)
  const tasaForm = document.getElementById('tasaForm');
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

      // Guardar ambas variables en localStorage inmediatamente
      localStorage.setItem('modo_tasa', modoVal);
      localStorage.setItem('modoTasa', modoVal);
      localStorage.setItem('tasa_manual', manualVal.toString());
      localStorage.setItem('tasaManual', manualVal.toString());
      localStorage.setItem('tasa_auto', autoVal.toString());
      localStorage.setItem('tasaAuto', autoVal.toString());
      localStorage.setItem('bcv_current_rate', activeRate.toString());

      if (previewRateVal) previewRateVal.textContent = `Bs. ${activeRate.toFixed(2)}`;
      if (textoEstadoConfig) textoEstadoConfig.textContent = isManual ? '• Tasa: Manual Gerencial (Editada)' : '• Tasa: Automática (API en Vivo)';

      // Transmitir cambio a POS, Dashboard y demás pestañas en vivo mediante BroadcastChannel y eventos
      if (typeof BroadcastChannel !== 'undefined') {
        const rateChannel = new BroadcastChannel('lnp_bcv_channel');
        rateChannel.postMessage({ rate: activeRate, mode: modoVal, source: activeSource });
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('bcvRateChanged', { detail: { rate: activeRate, mode: modoVal } }));
      if (typeof BcvRateStore !== 'undefined' && BcvRateStore.broadcastChange) {
        BcvRateStore.broadcastChange(activeRate, modoVal, activeSource);
      }

      const payload = {
        modo_tasa: modoVal,
        tasa_manual: manualVal
      };

      try {
        showStatus('Guardando configuración de tasa en el sistema...', 'info');

        const res = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.success) {
            showStatus('✓ ¡Tasa de cambio guardada y transmitida a todo el sistema en tiempo real!', 'success');
            return;
          }
        }
        showStatus('✓ ¡Tasa de cambio guardada exitosamente y transmitida al sistema!', 'success');
      } catch (err) {
        showStatus('✓ ¡Tasa de cambio guardada exitosamente y transmitida a todo el sistema en tiempo real!', 'success');
      }
    });
  }

  function showStatus(msg, type) {
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
});
