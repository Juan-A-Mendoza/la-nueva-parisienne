/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS Y ESTADO DE PRODUCCIÓN Y COCINA
   Monitoreo de hornos industriales, cola de comandas KDS y lotes leudados
   ========================================================================== */

export const OVENS_INITIAL_STATE = [
  {
    id: 'oven_01',
    name: 'Horno 1 (Giratorio A)',
    type: 'Giratorio Industrial',
    currentTemp: 25,
    targetTemp: 220,
    status: 'idle', // 'idle' | 'preheating' | 'baking' | 'ready'
    batch: null
  },
  {
    id: 'oven_02',
    name: 'Horno 2 (Convección B)',
    type: 'Convección Fina',
    currentTemp: 25,
    targetTemp: 190,
    status: 'idle',
    batch: null
  },
  {
    id: 'oven_03',
    name: 'Horno 3 (Piedra C)',
    type: 'Bóveda de Piedra',
    currentTemp: 25,
    targetTemp: 240,
    status: 'idle',
    batch: null
  },
  {
    id: 'oven_04',
    name: 'Horno 4 (Pastelero D)',
    type: 'Convección Digital',
    currentTemp: 25,
    targetTemp: 175,
    status: 'idle',
    batch: null
  }
];

export const KDS_ORDERS_INITIAL_STATE = [
  {
    id: 'order_1002',
    code: 'FAC-2026-1002',
    orderType: 'Para Llevar',
    customerName: 'Cliente Mostrador',
    timeElapsedMin: 4,
    status: 'in_progress', // 'pending' | 'in_progress' | 'ready'
    items: [
      { name: 'Croissant de Mantequilla', qty: 2, icon: '🥐' },
      { name: 'Pain au Chocolat', qty: 1, icon: '🍫' },
      { name: 'Capuchino Cremoso', qty: 1, icon: '🥛' }
    ]
  },
  {
    id: 'order_1003',
    code: 'FAC-2026-1003',
    orderType: 'Consumo Local (Mesa 4)',
    customerName: 'Familia Dupont',
    timeElapsedMin: 1,
    status: 'pending',
    items: [
      { name: 'Croque-Monsieur Tradicional', qty: 2, icon: '🥪' },
      { name: 'Café au Lait Parisien', qty: 2, icon: '☕' }
    ]
  },
  {
    id: 'order_1001',
    code: 'FAC-2026-1001',
    orderType: 'Para Llevar',
    customerName: 'M. Pierre',
    timeElapsedMin: 8,
    status: 'ready',
    items: [
      { name: 'Baguette Tradicional Parisina', qty: 3, icon: '🥖' },
      { name: 'Éclair de Chocolate Belga', qty: 2, icon: '⚡' }
    ]
  }
];

export const STAGING_BATCHES_INITIAL_STATE = [
  {
    id: 'stage_045',
    code: 'Lote #045',
    productName: 'Pain au Chocolat',
    icon: '🍫',
    units: 40,
    prepStatus: 'Leudado Completo (100%)',
    recommendedTemp: 190,
    recommendedTimeMin: 15
  },
  {
    id: 'stage_046',
    code: 'Lote #046',
    productName: 'Brioche de Vainilla',
    icon: '🍞',
    units: 25,
    prepStatus: 'Barnizado con Huevo Listo',
    recommendedTemp: 180,
    recommendedTimeMin: 22
  },
  {
    id: 'stage_047',
    code: 'Lote #047',
    productName: 'Masa de Éclairs (Choux)',
    icon: '⚡',
    units: 35,
    prepStatus: 'Reposo en Bandeja (15 min)',
    recommendedTemp: 200,
    recommendedTimeMin: 18
  }
];
