/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS Y ASIENTOS CONTABLES
   Plan Único de Cuentas (PUC), comprobantes automáticos y balance de comprobación
   ========================================================================== */

export const PLAN_CUENTAS = [
  { code: '1105', name: 'Caja General', type: 'Activo', nature: 'Deudor' },
  { code: '1110', name: 'Bancos Nacionales', type: 'Activo', nature: 'Deudor' },
  { code: '1435', name: 'Inventario Materia Prima', type: 'Activo', nature: 'Deudor' },
  { code: '1440', name: 'Inventario Productos Terminados', type: 'Activo', nature: 'Deudor' },
  { code: '2205', name: 'Proveedores Nacionales', type: 'Pasivo', nature: 'Acreedor' },
  { code: '2408', name: 'IVA Débito Fiscal (16%)', type: 'Pasivo', nature: 'Acreedor' },
  { code: '3105', name: 'Capital Social', type: 'Patrimonio', nature: 'Acreedor' },
  { code: '4135', name: 'Ventas Mostrador Panadería', type: 'Ingreso', nature: 'Acreedor' },
  { code: '5105', name: 'Gastos de Personal / Sueldos', type: 'Gasto', nature: 'Deudor' },
  { code: '5195', name: 'Gastos Mermas y Pérdidas', type: 'Gasto', nature: 'Deudor' },
  { code: '6135', name: 'Costo de Ventas Producción', type: 'Costo', nature: 'Deudor' }
];

export const AUTOMATIC_ENTRIES = [
  {
    id: 'as_001',
    code: 'AS-2026-001',
    date: '2026-08-11 16:42',
    concept: 'Venta POS Mostrador (Comprobante FAC-2026-1003)',
    sourceModule: 'Punto de Venta (POS)',
    icon: '🛒',
    details: [
      { accountCode: '1105', accountName: 'Caja General', debe: 1485.50, haber: 0.00 },
      { accountCode: '4135', accountName: 'Ventas Mostrador Panadería', debe: 0.00, haber: 1280.60 },
      { accountCode: '2408', accountName: 'IVA Débito Fiscal (16%)', debe: 0.00, haber: 204.90 }
    ],
    totalDebe: 1485.50,
    totalHaber: 1485.50
  },
  {
    id: 'as_002',
    code: 'AS-2026-002',
    date: '2026-08-10 14:15',
    concept: 'Compra de Harina a Molinos del Sur (Orden OC-2026-0089)',
    sourceModule: 'Proveedores',
    icon: '🌾',
    details: [
      { accountCode: '1435', accountName: 'Inventario Materia Prima', debe: 1800.00, haber: 0.00 },
      { accountCode: '2205', accountName: 'Proveedores Nacionales', debe: 0.00, haber: 1800.00 }
    ],
    totalDebe: 1800.00,
    totalHaber: 1800.00
  },
  {
    id: 'as_003',
    code: 'AS-2026-003',
    date: '2026-08-11 11:30',
    concept: 'Registro de Merma de Almacén (Caducidad Harina T55)',
    sourceModule: 'Inventario',
    icon: '⚠️',
    details: [
      { accountCode: '5195', accountName: 'Gastos Mermas y Pérdidas', debe: 145.20, haber: 0.00 },
      { accountCode: '1435', accountName: 'Inventario Materia Prima', debe: 0.00, haber: 145.20 }
    ],
    totalDebe: 145.20,
    totalHaber: 145.20
  },
  {
    id: 'as_004',
    code: 'AS-2026-004',
    date: '2026-08-11 08:00',
    concept: 'Cierre Diario de Costo de Ventas Producción',
    sourceModule: 'Producción y Cocina',
    icon: '🥖',
    details: [
      { accountCode: '6135', accountName: 'Costo de Ventas Producción', debe: 820.00, haber: 0.00 },
      { accountCode: '1440', accountName: 'Inventario Productos Terminados', debe: 0.00, haber: 820.00 }
    ],
    totalDebe: 820.00,
    totalHaber: 820.00
  }
];

export const TRIAL_BALANCE_ACCOUNTS = [
  { code: '1105', name: 'Caja General', sumDebe: 8450.50, sumHaber: 1200.00, saldoDeudor: 7250.50, saldoAcreedor: 0.00 },
  { code: '1110', name: 'Bancos Nacionales', sumDebe: 15000.00, sumHaber: 3800.00, saldoDeudor: 11200.00, saldoAcreedor: 0.00 },
  { code: '1435', name: 'Inventario Materia Prima', sumDebe: 6500.00, sumHaber: 1945.20, saldoDeudor: 4554.80, saldoAcreedor: 0.00 },
  { code: '1440', name: 'Inventario Productos Terminados', sumDebe: 4200.00, sumHaber: 820.00, saldoDeudor: 3380.00, saldoAcreedor: 0.00 },
  { code: '2205', name: 'Proveedores Nacionales', sumDebe: 1200.00, sumHaber: 4800.00, saldoDeudor: 0.00, saldoAcreedor: 3600.00 },
  { code: '2408', name: 'IVA Débito Fiscal (16%)', sumDebe: 0.00, sumHaber: 2049.00, saldoDeudor: 0.00, saldoAcreedor: 2049.00 },
  { code: '3105', name: 'Capital Social', sumDebe: 0.00, sumHaber: 15000.00, saldoDeudor: 0.00, saldoAcreedor: 15000.00 },
  { code: '4135', name: 'Ventas Mostrador Panadería', sumDebe: 0.00, sumHaber: 12806.30, saldoDeudor: 0.00, saldoAcreedor: 12806.30 },
  { code: '5105', name: 'Gastos de Personal / Sueldos', sumDebe: 4500.00, sumHaber: 0.00, saldoDeudor: 4500.00, saldoAcreedor: 0.00 },
  { code: '5195', name: 'Gastos Mermas y Pérdidas', sumDebe: 145.20, sumHaber: 0.00, saldoDeudor: 145.20, saldoAcreedor: 0.00 },
  { code: '6135', name: 'Costo de Ventas Producción', sumDebe: 2424.80, sumHaber: 0.00, saldoDeudor: 2424.80, saldoAcreedor: 0.00 }
];
