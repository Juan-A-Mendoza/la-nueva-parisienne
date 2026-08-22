/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR INTERACTIVO DE CONFIGURACIONES (SETTINGS.JS)
   Gestión de datos de empresa, parámetros fiscales, preferencias y zona de peligro
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { SettingsStore } from '../data/settings-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Sesión Activa
  const session = SessionStore.getSession();
  if (session && session.user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    if (userAvatar) userAvatar.textContent = session.user.icon || '📊';
    if (userName) userName.textContent = session.user.name || 'Sebastian / Juan';
  }

  // Event listener para cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      SessionStore.logout();
    });
  }

  // 2. Cargar Configuraciones Actuales en Formulario
  const currentSettings = SettingsStore.getSettings();
  loadFormValues(currentSettings);
  initBcvRateControls();

  // 2.1 Gestión de Tasa Maestra BCV (Auto / Manual)
  async function initBcvRateControls() {
    const modeToggle = document.getElementById('bcvRateModeToggle');
    const manualInput = document.getElementById('bcvManualRateInput');
    const modeSubtitle = document.getElementById('bcvModeSubtitle');
    const btnSaveBcv = document.getElementById('btnSaveBcvRate');

    if (!modeToggle || !manualInput) return;

    const modeSaved = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
    const isManualSaved = modeSaved === 'manual';
    const rateSaved = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;

    modeToggle.checked = isManualSaved;
    manualInput.disabled = !isManualSaved;
    manualInput.value = rateSaved.toFixed(2);
    updateSubtitleText(isManualSaved);

    modeToggle.addEventListener('change', () => {
      const isManual = modeToggle.checked;
      manualInput.disabled = !isManual;
      updateSubtitleText(isManual);
    });

    function updateSubtitleText(isManual) {
      if (modeSubtitle) {
        modeSubtitle.textContent = isManual
          ? '● Modo Manual: Tasa fija ingresada manualmente por administración.'
          : '● Modo Automático: Consulta en vivo la API oficial del Banco Central de Venezuela.';
      }
    }

    if (btnSaveBcv) {
      btnSaveBcv.addEventListener('click', async () => {
        btnSaveBcv.disabled = true;
        btnSaveBcv.textContent = 'Guardando...';

        const isManual = modeToggle.checked;
        const rateVal = parseFloat(manualInput.value) || 780.00;
        const modoVal = isManual ? 'manual' : 'auto';

        localStorage.setItem('modo_tasa', modoVal);
        localStorage.setItem('modoTasa', modoVal);
        localStorage.setItem('tasa_manual', rateVal.toString());
        localStorage.setItem('tasaManual', rateVal.toString());

        if (typeof BcvRateStore !== 'undefined' && BcvRateStore.broadcastChange) {
          BcvRateStore.broadcastChange(rateVal, modoVal, isManual ? 'Tasa Manual' : 'Tasa Auto');
        }

        showToast('💾 Configuración de Tasa BCV guardada correctamente.', 'success');
        btnSaveBcv.disabled = false;
        btnSaveBcv.textContent = 'Guardar Cambios de Tasa';
      });
    }
  }

  // 3. Manejador del Botón "Guardar Cambios"
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      saveCurrentFormValues();
    });
  }

  // 4. Manejador del Botón "Restablecer Valores Predeterminados"
  const btnResetDefaults = document.getElementById('btnResetDefaults');
  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', () => {
      if (confirm('¿Está seguro de que desea restablecer todas las configuraciones a sus valores predeterminados de fábrica?')) {
        const defaultSettings = SettingsStore.resetToDefaults();
        loadFormValues(defaultSettings);
        showToast('✓ Valores predeterminados cargados correctamente.', 'success');
      }
    });
  }

  // 5. Manejador del Botón "Exportar Configuración (JSON)"
  const btnExportConfig = document.getElementById('btnExportConfig');
  if (btnExportConfig) {
    btnExportConfig.addEventListener('click', () => {
      const settings = SettingsStore.getSettings();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `config_la_nueva_parisienne_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📄 Archivo de configuración exportado correctamente.', 'success');
    });
  }

  // 6. MANEJADORES DE LA ZONA DE PELIGRO (DANGER ZONE)
  
  // 6.1 Purgar Caché de Sesiones Local
  const btnPurgeCache = document.getElementById('btnPurgeCache');
  if (btnPurgeCache) {
    btnPurgeCache.addEventListener('click', () => {
      if (confirm('⚠️ ¿Limpiar tokens de sesión activa y datos cacheados en el navegador? Tendrá que volver a iniciar sesión.')) {
        sessionStorage.clear();
        showToast('🧹 Caché de sesión purgada con éxito.', 'success');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1200);
      }
    });
  }

  // 6.2 Restablecer Datos de Semilla (Seed Data)
  const btnRestoreSeed = document.getElementById('btnRestoreSeed');
  if (btnRestoreSeed) {
    btnRestoreSeed.addEventListener('click', () => {
      if (confirm('🔄 ¿Desea recargar la base de datos de insumos, recetas y catálogo a los datos semilla iniciales?')) {
        showToast('🔄 Semilla de datos restaurada correctamente.', 'success');
      }
    });
  }

  // 6.3 Formatear Base de Datos (Reset Total con PIN)
  const btnSystemReset = document.getElementById('btnSystemReset');
  if (btnSystemReset) {
    btnSystemReset.addEventListener('click', () => {
      const inputPin = prompt('🚨 ACCIÓN CRÍTICA IRREVERSIBLE 🚨\n\nEsta acción borrará las ventas, movimientos contables y configuraciones.\n\nPara confirmar, ingrese el PIN de Administrador (1234):');
      
      if (inputPin === '1234') {
        localStorage.clear();
        sessionStorage.clear();
        SettingsStore.resetToDefaults();
        showToast('💣 Base de datos e historial formateados exitosamente.', 'error');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1800);
      } else if (inputPin !== null) {
        alert('❌ PIN de Administrador incorrecto. Operación cancelada por seguridad.');
      }
    });
  }

  // FUNCIÓN PARA CARGAR VALORES EN EL FORMULARIO
  function loadFormValues(s) {
    // Empresa
    setValue('legalName', s.company?.legalName);
    setValue('taxId', s.company?.taxId);
    setValue('tradeName', s.company?.tradeName);
    setValue('address', s.company?.address);
    setValue('phone', s.company?.phone);
    setValue('email', s.company?.email);
    setValue('currency', s.company?.currency || 'USD');
    setValue('exchangeRate', s.company?.exchangeRate);

    // Fiscal
    setValue('vatRate', s.fiscal?.vatRate);
    setValue('withholdingIslr', s.fiscal?.withholdingIslr);
    setCheck('exemptBasicBread', s.fiscal?.exemptBasicBread);
    setValue('seniatRegister', s.fiscal?.seniatRegister);
    setValue('invoiceSeries', s.fiscal?.invoiceSeries);
    setValue('currentInvoiceNumber', s.fiscal?.currentInvoiceNumber);
    setValue('receiptFormat', s.fiscal?.receiptFormat || 'ticket_80mm');
    setCheck('digitalInvoicePdf', s.fiscal?.digitalInvoicePdf);

    // Preferencias
    setValue('dbConnectionMode', s.preferences?.dbConnectionMode || 'mysql_pdo');
    setValue('mysqlHost', s.preferences?.mysqlHost);
    setValue('mysqlDbName', s.preferences?.mysqlDbName);
    setCheck('autoFallbackLocal', s.preferences?.autoFallbackLocal);
    setCheck('lowStockAlerts', s.preferences?.lowStockAlerts);
    setValue('backupFrequency', s.preferences?.backupFrequency || 'daily_02am');
    setValue('themeMode', s.preferences?.themeMode || 'warm_espresso');
  }

  // FUNCIÓN PARA GUARDAR VALORES DESDE EL FORMULARIO
  function saveCurrentFormValues() {
    const updatedSettings = {
      company: {
        legalName: getValue('legalName'),
        taxId: getValue('taxId'),
        tradeName: getValue('tradeName'),
        address: getValue('address'),
        phone: getValue('phone'),
        email: getValue('email'),
        currency: getValue('currency'),
        currencySymbol: getValue('currency') === 'USD' ? '$' : (getValue('currency') === 'VES' ? 'Bs.' : '€'),
        exchangeRate: parseFloat(getValue('exchangeRate')) || 36.50
      },
      fiscal: {
        vatRate: parseFloat(getValue('vatRate')) || 16.0,
        withholdingIslr: parseFloat(getValue('withholdingIslr')) || 2.0,
        exemptBasicBread: getCheck('exemptBasicBread'),
        seniatRegister: getValue('seniatRegister'),
        invoiceSeries: getValue('invoiceSeries'),
        currentInvoiceNumber: parseInt(getValue('currentInvoiceNumber')) || 10001,
        receiptFormat: getValue('receiptFormat'),
        digitalInvoicePdf: getCheck('digitalInvoicePdf')
      },
      preferences: {
        dbConnectionMode: getValue('dbConnectionMode'),
        mysqlHost: getValue('mysqlHost'),
        mysqlDbName: getValue('mysqlDbName'),
        autoFallbackLocal: getCheck('autoFallbackLocal'),
        lowStockAlerts: getCheck('lowStockAlerts'),
        backupFrequency: getValue('backupFrequency'),
        themeMode: getValue('themeMode')
      },
      systemStatus: {
        systemVersion: 'v2.1.0',
        dbConnectionStatus: getValue('dbConnectionMode') === 'mysql_pdo' ? 'Connected (MySQL PDO)' : 'Local Fallback Active',
        lastBackupDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
        totalUsersActive: 6
      }
    };

    SettingsStore.saveSettings(updatedSettings);
    showToast('💾 Ajustes corporativos y parámetros fiscales guardados correctamente.', 'success');
  }

  // HELPERS
  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }

  function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastText = document.getElementById('toastText');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastText) return;

    toastText.textContent = msg;
    toastIcon.textContent = type === 'success' ? '✓' : '⚠️';
    toast.className = `toast-notification active ${type}`;

    setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }
});
