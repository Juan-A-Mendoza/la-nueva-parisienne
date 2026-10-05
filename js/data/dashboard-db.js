/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS Y MÉTRICAS DE DASHBOARD GERENCIAL
   Datos analíticos, KPIs, tendencia de ventas e historial de movimientos
   ========================================================================== */

export const DASHBOARD_KPIS = {
  totalRevenue: 4850.00,
  revenueGrowth: 14.8,
  totalOrders: 248,
  ordersGrowth: 8.2,
  averageTicket: 19.55,
  ticketGrowth: 4.1,
  profitMargin: 38.5,
  marginStatus: 'Excelente'
};

export const SALES_TREND_PERIODS = {
  '7d': {
    label: 'Últimos 7 Días',
    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    sales: [540.00, 620.50, 580.00, 710.25, 890.00, 1150.75, 958.50],
    costs: [320.00, 370.00, 340.00, 410.00, 510.00, 680.00, 590.00],
    orders: [28, 32, 30, 36, 45, 58, 49]
  },
  'month': {
    label: 'Este Mes',
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    sales: [3850.00, 4210.50, 4900.00, 5449.50],
    costs: [2310.00, 2450.00, 2890.00, 3220.00],
    orders: [195, 210, 245, 268]
  },
  'quarter': {
    label: 'Último Trimestre',
    labels: ['Julio', 'Agosto', 'Septiembre'],
    sales: [16200.00, 17850.50, 18410.75],
    costs: [9800.00, 10720.00, 10980.50],
    orders: [820, 890, 935]
  },
  'year': {
    label: 'Año 2026',
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    sales: [12400.00, 13150.00, 14200.50, 13800.00, 15300.00, 16100.00, 16200.00, 17850.50, 18410.75, 19200.00, 21500.00, 24800.00],
    costs: [7600.00, 8100.00, 8600.00, 8400.00, 9200.00, 9700.00, 9800.00, 10720.00, 10980.50, 11400.00, 12600.00, 14200.00],
    orders: [640, 675, 710, 690, 780, 815, 820, 890, 935, 960, 1050, 1220]
  }
};

export const SALES_TREND_DATA = SALES_TREND_PERIODS['7d'];

export const RECENT_MOVEMENTS = [
  {
    id: 'mov_001',
    code: 'FAC-2026-1003',
    timestamp: '2026-08-11 16:42',
    type: 'Venta POS',
    category: 'venta',
    user: 'Élodie Martin',
    paymentMethod: 'Tarjeta Crédito',
    status: 'Completado',
    amount: 32.50,
    itemsCount: 4
  },
  {
    id: 'mov_002',
    code: 'FAC-2026-1002',
    timestamp: '2026-08-11 16:35',
    type: 'Venta POS',
    category: 'venta',
    user: 'Élodie Martin',
    paymentMethod: 'Efectivo',
    status: 'Completado',
    amount: 14.00,
    itemsCount: 2
  },
  {
    id: 'mov_003',
    code: 'OC-2026-0089',
    timestamp: '2026-08-11 15:15',
    type: 'Compra Proveedor (Harina)',
    category: 'gasto',
    user: 'Sophie Laurent',
    paymentMethod: 'Transferencia',
    status: 'Completado',
    amount: -450.00,
    itemsCount: 10
  },
  {
    id: 'mov_004',
    code: 'FAC-2026-1001',
    timestamp: '2026-08-11 14:50',
    type: 'Venta POS',
    category: 'venta',
    user: 'Élodie Martin',
    paymentMethod: 'Efectivo',
    status: 'Completado',
    amount: 28.80,
    itemsCount: 5
  },
  {
    id: 'mov_005',
    code: 'ARQ-2026-0012',
    timestamp: '2026-08-11 13:00',
    type: 'Arqueo de Caja Turno',
    category: 'ajuste',
    user: 'Antoine Moreau',
    paymentMethod: 'Auditoría',
    status: 'Completado',
    amount: 0.00,
    itemsCount: 0
  },
  {
    id: 'mov_006',
    code: 'OC-2026-0088',
    timestamp: '2026-08-11 11:20',
    type: 'Compra Mantequilla Normandía',
    category: 'gasto',
    user: 'Sophie Laurent',
    paymentMethod: 'Transferencia',
    status: 'Completado',
    amount: -280.00,
    itemsCount: 4
  }
];
