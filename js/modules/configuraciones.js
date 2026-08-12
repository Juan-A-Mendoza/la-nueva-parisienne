/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR MÓDULO 9 CONFIGURACIONES (CONFIGURACIONES.JS)
   Gestión de datos fiscales de la empresa e integración con MySQL
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

  // 3. Cargar Datos Fiscales Actuales al Iniciar
  await loadEmpresaData();

  async function loadEmpresaData() {
    try {
      const res = await fetch('../api/get_empresa.php');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.empresa) {
          if (empresaNombre) empresaNombre.value = data.empresa.nombre || '';
          if (empresaRif) empresaRif.value = data.empresa.rif || '';
          if (empresaDireccion) empresaDireccion.value = data.empresa.direccion || '';
          if (empresaTelefono) empresaTelefono.value = data.empresa.telefono || '';
        }
      }
    } catch (e) {
      console.warn('Error al cargar datos fiscales de la empresa:', e);
    }
  }

  // 4. Guardar Cambios mediante POST a update_empresa.php
  if (empresaForm) {
    empresaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        nombre: empresaNombre.value.trim(),
        rif: empresaRif.value.trim(),
        direccion: empresaDireccion.value.trim(),
        telefono: empresaTelefono.value.trim()
      };

      try {
        showStatus('Guardando cambios en la base de datos...', 'info');
        
        const res = await fetch('../api/update_empresa.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          showStatus('✓ ¡Datos fiscales de la empresa actualizados con éxito! El POS usará estos datos inmediatamente.', 'success');
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
    if (type === 'success') {
      setTimeout(() => {
        statusBanner.style.display = 'none';
      }, 5000);
    }
  }
});
