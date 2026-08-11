/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS DE CONFIGURACIONES Y AJUSTES DEL SISTEMA
   Parámetros corporativos, datos fiscales, preferencias y zona de peligro
   ========================================================================== */

export const INITIAL_SETTINGS = {
  company: {
    legalName: 'La Nueva Parisienne S.A.',
    taxId: 'J-40123985-0',
    tradeName: 'Panadería & Pastelería Artesanal La Nueva Parisienne',
    address: 'Av. Los Panaderos #102, Sector Centro, Caracas',
    phone: '+58 (0212) 555-PARIS',
    email: 'contacto@lanuevaparisienne.com',
    currency: 'USD',
    currencySymbol: '$',
    secondaryCurrency: 'VES',
    exchangeRate: 36.50
  },
  fiscal: {
    vatRate: 16.0,
    exemptBasicBread: true,
    seniatRegister: 'SENIAT-REG-2026-9981',
    invoiceSeries: 'FAC-2026-',
    currentInvoiceNumber: 10045,
    withholdingIslr: 2.0,
    receiptFormat: 'ticket_80mm',
    digitalInvoicePdf: true
  },
  preferences: {
    backupFrequency: 'daily_02am',
    dbConnectionMode: 'mysql_pdo',
    mysqlHost: 'localhost:3306',
    mysqlDbName: 'la_nueva_parisienne',
    mysqlUser: 'root',
    autoFallbackLocal: true,
    lowStockAlerts: true,
    lowStockThreshold: 10,
    themeMode: 'warm_espresso',
    autoLogoutMinutes: 30
  },
  systemStatus: {
    systemVersion: 'v2.1.0',
    dbConnectionStatus: 'Connected (MySQL PDO)',
    lastBackupDate: '2026-08-11 02:00:00',
    totalUsersActive: 6
  }
};

export const SettingsStore = {
  KEY: 'LN_PARISIENNE_SETTINGS',

  getSettings() {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) {
      this.saveSettings(INITIAL_SETTINGS);
      return { ...INITIAL_SETTINGS };
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Error parseando configuraciones guardadas, restaurando predeterminadas:', e);
      return { ...INITIAL_SETTINGS };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEY, JSON.stringify(settings));
  },

  resetToDefaults() {
    localStorage.removeItem(this.KEY);
    this.saveSettings(INITIAL_SETTINGS);
    return { ...INITIAL_SETTINGS };
  }
};
