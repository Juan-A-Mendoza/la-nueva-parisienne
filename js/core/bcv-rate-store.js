/* ==========================================================================
   LA NUEVA PARISIENNE - CENTRAL BCV RATE STORE (BCV-RATE-STORE.JS)
   Gestor centralizado de la Tasa Oficial BCV / Multimoneda para todos los módulos.
   Sincronización en tiempo real con localStorage (modoTasa y tasaManual).
   ========================================================================== */

class BcvRateStoreManager {
  constructor() {
    this.mode = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
    this.rate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
    this.source = 'BCV Oficial';
    this.date = '';
    this.listeners = [];

    // Escuchar actualizaciones entre pestañas en tiempo real (storage event)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'modo_tasa' || e.key === 'modoTasa' || e.key === 'tasa_manual' || e.key === 'tasaManual' || e.key === 'bcv_current_rate') {
          this.mode = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
          this.rate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 780.00;
          this.source = 'BCV Oficial';
          this.notifyListeners();
        }
      });

      window.addEventListener('bcvRateChanged', (e) => {
        this.mode = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || (e.detail && e.detail.mode) || 'auto';
        this.rate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || (e.detail && parseFloat(e.detail.rate)) || 780.00;
        this.source = 'BCV Oficial';
        this.notifyListeners();
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
   * Consultar la tasa actual respetando localStorage (modoTasa y tasaManual)
   * @param {Boolean} forceRefresh Forzar bypass de caché si es modo auto
   */
  async fetchRate(forceRefresh = false) {
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa') || 'auto';
    if (modoGuardado === 'manual') {
      const manualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
      if (manualVal && manualVal > 0) {
        this.mode = 'manual';
        this.rate = manualVal;
        this.source = 'BCV Oficial';
        this.notifyListeners();
        return { success: true, rate: this.rate, mode: this.mode, source: this.source };
      }
    }

    const apiBase = (typeof window !== 'undefined' && window.location.pathname.includes('/modules/')) ? '../api' : 'api';
    const apis = [
      `${apiBase}/bcv_rate.php`,
      'https://ve.dolarapi.com/v1/dolares/oficial',
      'https://bcv-api.vercel.app/api/bcv'
    ];

    for (const url of apis) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;
        const res = await fetch(`${url}?t=${Date.now()}`, { 
          cache: 'no-store',
          signal: controller ? controller.signal : undefined 
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const rateVal = parseFloat(data.promedio || data.precio || data.monto || data.rate);
          if (rateVal && rateVal > 0) {
            this.rate = rateVal;
            this.mode = 'auto';
            this.source = 'BCV Oficial';

            localStorage.setItem('tasa_auto', this.rate.toString());
            localStorage.setItem('tasaAuto', this.rate.toString());
            localStorage.setItem('bcv_current_rate', this.rate.toString());

            this.notifyListeners();
            return { success: true, rate: this.rate, mode: this.mode, source: this.source };
          }
        }
      } catch (e) {
        // Fallo silencioso con timeout ultrarrápido
      }
    }

    return {
      success: true,
      rate: this.rate,
      mode: this.mode,
      source: this.source
    };
  }

  /**
   * Emitir evento global de cambio de tasa al guardar
   */
  broadcastChange(newRate, newMode, newSource) {
    this.rate = parseFloat(newRate);
    this.mode = newMode;
    this.source = newSource;

    localStorage.setItem('modoTasa', this.mode);
    localStorage.setItem('tasaManual', this.rate.toString());

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcvRateChanged', {
        detail: { rate: this.rate, mode: this.mode, source: this.source }
      }));
    }

    this.notifyListeners();
  }

  convertUsdToves(usdAmount) {
    return (parseFloat(usdAmount) || 0) * this.rate;
  }

  formatVes(usdAmount) {
    const vesVal = this.convertUsdToves(usdAmount);
    return `Bs. ${vesVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export const BcvRateStore = new BcvRateStoreManager();

