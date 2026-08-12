/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR MÓDULO 9 CONFIGURACIONES (CONFIGURACIONES.JS)
   Gestión de datos fiscales de la empresa y Tasa Cambiaria BCV / Multimoneda
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';

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
  const tasaManualGroup = document.getElementById('tasaManualGroup');
  const tasaManualInput = document.getElementById('tasaManualInput');

  // Manejador del Toggle Switch / Radio Selector de Modo de Tasa
  function updateTasaUiMode(isManual) {
    if (tasaManualGroup && tasaManualInput) {
      if (isManual) {
        tasaManualGroup.style.opacity = '1';
        tasaManualGroup.style.pointerEvents = 'auto';
        tasaManualInput.disabled = false;
        tasaManualInput.focus();
      } else {
        tasaManualGroup.style.opacity = '0.5';
        tasaManualGroup.style.pointerEvents = 'none';
        tasaManualInput.disabled = true;
      }
    }
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
          
          updateTasaUiMode(isManual);
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

      if (selectedMode === 'manual' && manualVal < 100) {
        showStatus('⚠️ La tasa manual ingresada debe ser un valor válido mayor a Bs. 100.', 'error');
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
          // Guardar respaldo cliente en localStorage
          localStorage.setItem('bcv_rate_mode', selectedMode);
          localStorage.setItem('bcv_manual_rate', manualVal.toString());

          showStatus('✓ ¡Datos de la empresa y configuración de tasa cambiaria actualizados con éxito! El POS aplicará los cambios.', 'success');
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
});
