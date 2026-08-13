/* ==========================================================================
   LA NUEVA PARISIENNE - CENTRAL BCV RATE STORE (BCV-RATE-STORE.JS)
   Gestor centralizado de la Tasa Oficial BCV / Multimoneda para todos los módulos.
   Sincronización en tiempo real con localStorage (modoTasa y tasaManual).
   ========================================================================== */

class BcvRateStoreManager {
  constructor() {
    this.mode = localStorage.getItem('modoTasa') || 'auto';
    this.rate = parseFloat(localStorage.getItem('tasaManual')) || 761.21;
    this.source = this.mode === 'manual' ? 'Tasa: Manual (Editada)' : 'Tasa: Automática (En Vivo)';
    this.date = '';
    this.listeners = [];

    // Escuchar actualizaciones entre pestañas en tiempo real (storage event)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'modoTasa' || e.key === 'tasaManual' || e.key === 'bcv_current_rate') {
          this.mode = localStorage.getItem('modoTasa') || 'auto';
          this.rate = parseFloat(localStorage.getItem('tasaManual')) || 761.21;
          this.source = this.mode === 'manual' ? 'Tasa: Manual (Editada)' : 'Tasa: Automática (En Vivo)';
          this.notifyListeners();
        }
      });

      window.addEventListener('bcvRateChanged', (e) => {
        this.mode = localStorage.getItem('modoTasa') || (e.detail && e.detail.mode) || 'auto';
        this.rate = parseFloat(localStorage.getItem('tasaManual')) || (e.detail && parseFloat(e.detail.rate)) || 761.21;
        this.source = this.mode === 'manual' ? 'Tasa: Manual (Editada)' : 'Tasa: Automática (En Vivo)';
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
    // Requerimiento 3: Si el modo en localStorage es 'manual', no llamar a API
    if (localStorage.getItem('modoTasa') === 'manual') {
      const manualVal = parseFloat(localStorage.getItem('tasaManual'));
      if (manualVal && manualVal > 0) {
        this.mode = 'manual';
        this.rate = manualVal;
        this.source = 'Tasa: Manual (Editada)';
        this.notifyListeners();
        return { success: true, rate: this.rate, mode: this.mode, source: this.source };
      }
    }

    try {
      const url = `../api/bcmrate.php?t=${Date.now()}${forceRefresh ? '&refresh=1' : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      
      if (res.ok) {
        const data = await res.json();
        const apiRate = data.rate || data.promedio;
        if (apiRate && parseFloat(apiRate) > 0) {
          this.rate = parseFloat(apiRate);
          this.mode = 'auto';
          this.source = 'Tasa: Automática (En Vivo)';

          localStorage.setItem('modoTasa', 'auto');
          localStorage.setItem('tasaManual', this.rate.toString());

          this.notifyListeners();
          return { success: true, rate: this.rate, mode: this.mode, source: this.source };
        }
      }
    } catch (e) {
      console.warn('Error al consultar bcmrate.php:', e);
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

