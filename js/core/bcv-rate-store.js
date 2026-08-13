/* ==========================================================================
   LA NUEVA PARISIENNE - CENTRAL BCV RATE STORE (BCV-RATE-STORE.JS)
   Gestor centralizado de la Tasa Oficial BCV / Multimoneda para todos los módulos.
   Sincronización en tiempo real, difusión entre pestañas y refresco automático.
   ========================================================================== */

const STORAGE_KEY_RATE = 'bcv_current_rate';
const STORAGE_KEY_MODE = 'bcv_rate_mode';
const STORAGE_KEY_SOURCE = 'bcv_rate_source';
const STORAGE_KEY_DATE = 'bcv_rate_date';

class BcvRateStoreManager {
  constructor() {
    this.rate = parseFloat(localStorage.getItem(STORAGE_KEY_RATE)) || 761.21;
    this.mode = localStorage.getItem(STORAGE_KEY_MODE) || 'auto';
    this.source = localStorage.getItem(STORAGE_KEY_SOURCE) || 'BCV Oficial (En Vivo)';
    this.date = localStorage.getItem(STORAGE_KEY_DATE) || '';
    this.listeners = [];

    // Escuchar actualizaciones entre pestañas en tiempo real (storage event)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY_RATE || e.key === STORAGE_KEY_MODE) {
          this.rate = parseFloat(localStorage.getItem(STORAGE_KEY_RATE)) || this.rate;
          this.mode = localStorage.getItem(STORAGE_KEY_MODE) || this.mode;
          this.source = localStorage.getItem(STORAGE_KEY_SOURCE) || this.source;
          this.notifyListeners();
        }
      });

      window.addEventListener('bcvRateChanged', (e) => {
        if (e.detail) {
          this.rate = e.detail.rate || this.rate;
          this.mode = e.detail.mode || this.mode;
          this.source = e.detail.source || this.source;
          this.notifyListeners();
        }
      });
    }
  }

  /**
   * Suscribirse a cambios en la tasa de cambio BCV
   * @param {Function} callback (data: { rate, mode, source, date }) => void
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      // Notificar inmediatamente el valor actual en caché
      callback({
        rate: this.rate,
        mode: this.mode,
        source: this.source,
        date: this.date
      });
    }
  }

  notifyListeners() {
    const data = {
      rate: this.rate,
      mode: this.mode,
      source: this.source,
      date: this.date
    };
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.warn('BcvRateStore listener error:', e); }
    });
  }

  /**
   * Consultar la tasa actual desde el backend PHP (/api/bcv_rate.php)
   * @param {Boolean} forceRefresh Forzar bypass de caché
   */
  async fetchRate(forceRefresh = false) {
    try {
      const url = `../api/bcv_rate.php?t=${Date.now()}${forceRefresh ? '&refresh=1' : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rate && data.rate >= 100) {
          this.rate = parseFloat(data.rate);
          this.mode = data.mode || 'auto';
          this.source = data.source || 'BCV Oficial';
          this.date = data.date || '';

          // Persistir estado local
          localStorage.setItem(STORAGE_KEY_RATE, this.rate.toString());
          localStorage.setItem(STORAGE_KEY_MODE, this.mode);
          localStorage.setItem(STORAGE_KEY_SOURCE, this.source);
          localStorage.setItem(STORAGE_KEY_DATE, this.date);

          this.notifyListeners();
          return data;
        }
      }
    } catch (e) {
      console.warn('Error al consultar BcvRateStore desde API:', e);
    }

    return {
      success: true,
      rate: this.rate,
      mode: this.mode,
      source: this.source,
      date: this.date
    };
  }

  /**
   * Emitir evento global de cambio de tasa (llamado desde Módulo 9 al guardar)
   */
  broadcastChange(newRate, newMode, newSource) {
    this.rate = parseFloat(newRate);
    this.mode = newMode;
    this.source = newSource;

    localStorage.setItem(STORAGE_KEY_RATE, this.rate.toString());
    localStorage.setItem(STORAGE_KEY_MODE, this.mode);
    localStorage.setItem(STORAGE_KEY_SOURCE, this.source);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcvRateChanged', {
        detail: { rate: this.rate, mode: this.mode, source: this.source }
      }));
    }

    this.notifyListeners();
  }

  /**
   * Convertir dólares ($ USD) a Bolívares (Bs. VES)
   */
  convertUsdToves(usdAmount) {
    return (parseFloat(usdAmount) || 0) * this.rate;
  }

  /**
   * Formatear monto en Bolívares con símbolo Bs.
   */
  formatVes(usdAmount) {
    const vesVal = this.convertUsdToves(usdAmount);
    return `Bs. ${vesVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export const BcvRateStore = new BcvRateStoreManager();
