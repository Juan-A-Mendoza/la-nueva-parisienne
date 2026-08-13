/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR MÓDULO 9 CONFIGURACIONES (CONFIGURACIONES.JS)
   Gestión de datos fiscales de la empresa y Tasa Cambiaria BCV / Multimoneda
   Sincronización en vivo con bloqueo estricto Auto vs Manual
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar Sesión Activa
  const session = SessionStore.getSession();
  if (session && session.user) {
    const managerAvatar = document.getElementById('managerAvatar');
    const managerName = document.getElementById('managerName');
    if (managerAvatar) managerAvatar.textContent = session.user.icon || '👨‍💼';
    if (managerName) managerName.textContent = session.user.name || 'Administrador';
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

  // Elementos de Tasa Cambiaria BCV / Multimoneda
  const modoTasaAuto = document.getElementById('modoTasaAuto');
  const modoTasaManual = document.getElementById('modoTasaManual');
  const lblModoAuto = document.getElementById('lblModoAuto');
  const lblModoManual = document.getElementById('lblModoManual');
  const tasaManualGroup = document.getElementById('tasaManualGroup');
  const tasaManualInput = document.getElementById('tasaManualInput');
  const lockStatusTag = document.getElementById('lockStatusTag');
  const previewRateVal = document.getElementById('previewRateVal');
  const previewRateSource = document.getElementById('previewRateSource');

  // Manejador del Toggle Switch / Radio Selector de Modo de Tasa
  async function updateTasaUiMode(isManual) {
    if (lblModoAuto) lblModoAuto.style.borderColor = isManual ? 'var(--border-subtle)' : 'var(--color-gold)';
    if (lblModoManual) lblModoManual.style.borderColor = isManual ? 'var(--color-gold)' : 'var(--border-subtle)';

    if (tasaManualGroup && tasaManualInput) {
      tasaManualGroup.style.opacity = '1';
      tasaManualGroup.style.pointerEvents = 'auto';

      if (isManual) {
        tasaManualInput.readOnly = false;
        tasaManualInput.disabled = false;
        tasaManualInput.style.background = '#FFFFFF';
        tasaManualInput.style.cursor = 'text';

        if (lockStatusTag) {
          lockStatusTag.textContent = '🔓 (Desbloqueado para Edición)';
          lockStatusTag.style.color = 'var(--color-success)';
        }
        const manualRateVal = parseFloat(tasaManualInput.value) || 0;
        if (previewRateVal && manualRateVal > 0) previewRateVal.textContent = `Bs. ${manualRateVal.toFixed(2)}`;
        if (previewRateSource) previewRateSource.textContent = 'Origen: Tasa Manual Gerencial';
        
        try {
          tasaManualInput.focus();
          tasaManualInput.select();
        } catch (e) {}
      } else {
        tasaManualInput.readOnly = true;
        tasaManualInput.disabled = false;
        tasaManualInput.style.background = '#F5F5F5';
        tasaManualInput.style.cursor = 'pointer';

        if (lockStatusTag) {
          lockStatusTag.textContent = '🔒 (Haz clic en Manual para editar)';
          lockStatusTag.style.color = 'var(--color-muted)';
        }
        const apiData = await BcvRateStore.fetchRate(true);
        if (apiData && apiData.rate) {
          if (previewRateVal) previewRateVal.textContent = `Bs. ${apiData.rate.toFixed(2)}`;
          if (previewRateSource) previewRateSource.textContent = `Origen: ${apiData.source || 'API BCV Oficial ve.dolarapi.com'}`;
        }
      }
    }
  }

  if (tasaManualInput) {
    const activateManualConfigInput = () => {
      if (modoTasaManual) modoTasaManual.checked = true;
      updateTasaUiMode(true);
    };

    tasaManualInput.addEventListener('click', activateManualConfigInput);
    tasaManualInput.addEventListener('focus', activateManualConfigInput);
    tasaManualInput.addEventListener('input', (e) => {
      activateManualConfigInput();
      const val = parseFloat(e.target.value) || 0;
      if (previewRateVal) {
        previewRateVal.textContent = `Bs. ${val.toFixed(2)}`;
      }
    });
  }

  document.querySelectorAll('input[name="modoTasaRadio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateTasaUiMode(e.target.value === 'manual');
    });
  });

  // 3. Cargar Datos Fiscales y Tasa Actuales al Iniciar
  await loadEmpresaData();

  async function loadEmpresaData() {
    try {
      const res = await fetch(`../api/get_empresa.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.empresa) {
          if (empresaNombre) empresaNombre.value = data.empresa.nombre || '';
          if (empresaRif) empresaRif.value = data.empresa.rif || '';
          if (empresaDireccion) empresaDireccion.value = data.empresa.direccion || '';
          if (empresaTelefono) empresaTelefono.value = data.empresa.telefono || '';
          
          const isManual = data.empresa.modo_tasa === 'manual';
          if (isManual && modoTasaManual) modoTasaManual.checked = true;
          if (!isManual && modoTasaAuto) modoTasaAuto.checked = true;
          
          if (tasaManualInput && data.empresa.tasa_manual) {
            tasaManualInput.value = parseFloat(data.empresa.tasa_manual).toFixed(2);
          }
          
          await updateTasaUiMode(isManual);
        }
      }
    } catch (e) {
      console.warn('Error al cargar datos de configuración:', e);
    }
  }

  // 4. Guardar Cambios mediante POST a update_empresa.php
  if (empresaForm) {
    empresaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedMode = modoTasaManual && modoTasaManual.checked ? 'manual' : 'auto';
      const manualVal = tasaManualInput ? parseFloat(tasaManualInput.value) || 761.21 : 761.21;

      if (selectedMode === 'manual' && manualVal <= 0) {
        showStatus('⚠️ La tasa manual ingresada debe ser un valor válido mayor a Bs. 0.00.', 'error');
        return;
      }

      const payload = {
        nombre: empresaNombre.value.trim(),
        rif: empresaRif.value.trim(),
        direccion: empresaDireccion.value.trim(),
        telefono: empresaTelefono.value.trim(),
        modo_tasa: selectedMode,
        tasa_manual: manualVal
      };

      try {
        showStatus('Guardando configuración en la base de datos MySQL...', 'info');
        
        const res = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          // Consultar la tasa activa del backend o difundir manual
          const currentData = await BcvRateStore.fetchRate(true);
          const activeRate = selectedMode === 'manual' ? manualVal : (currentData.rate || manualVal);
          const activeSource = selectedMode === 'manual' ? 'Tasa Manual Gerencial' : 'BCV Oficial (ve.dolarapi.com - En Vivo)';

          BcvRateStore.broadcastChange(activeRate, selectedMode, activeSource);

          showStatus('✓ ¡Configuración actualizada y transmitida exitosamente a todos los módulos del sistema en tiempo real!', 'success');
        } else {
          showStatus(`❌ Error al guardar: ${result.message || 'Error en el servidor.'}`, 'error');
        }
      } catch (err) {
        showStatus('❌ Error de conexión con el servidor backend.', 'error');
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

  // ==========================================================================
  // BLOQUE EXACTO DE JAVASCRIPT SOLICITADO PARA CONTROL DE VISTA DE TASA
  // ==========================================================================
  const radioAutoConfig = document.getElementById('radio_auto');
  const radioManualConfig = document.getElementById('radio_manual');
  const inputTasaConfig = document.getElementById('input_tasa_manual');
  const labelCandadoConfig = document.getElementById('label_candado');
  const textoEstadoConfig = document.getElementById('texto_estado_tasa');

  function actualizarVistaTasaConfig() {
      if (radioManualConfig && radioManualConfig.checked) {
          if (inputTasaConfig) {
              inputTasaConfig.removeAttribute('disabled');
              inputTasaConfig.removeAttribute('readonly');
              inputTasaConfig.style.pointerEvents = 'auto';
              inputTasaConfig.style.opacity = '1';
              try { inputTasaConfig.focus(); } catch (e) {}
          }
          if (labelCandadoConfig) labelCandadoConfig.innerHTML = '✏️ (Modo Edición)';
          if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• Tasa: Manual (Editada)';
      } else if (radioAutoConfig) {
          if (inputTasaConfig) {
              inputTasaConfig.setAttribute('disabled', 'true');
              inputTasaConfig.style.opacity = '0.5';
          }
          if (labelCandadoConfig) labelCandadoConfig.innerHTML = '🔒 (Bloqueado en Modo Auto)';
          if (textoEstadoConfig) textoEstadoConfig.innerHTML = '• Tasa: Automática (En Vivo)';
      }
  }

  if (radioAutoConfig && radioManualConfig) {
      radioAutoConfig.addEventListener('change', actualizarVistaTasaConfig);
      radioManualConfig.addEventListener('change', actualizarVistaTasaConfig);
  }
});
