/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS DE PERSONAL Y MATRIZ DE PERMISOS
   Nómina de empleados, perfiles de usuario y matriz de privilegios por rol
   ========================================================================== */

export const STAFF_DATABASE = [
  {
    id: 'emp_01',
    code: 'EMP-001',
    name: 'Carlos Mendoza',
    role: 'Maestro Panadero / Chef',
    roleCode: 'BAKER',
    department: 'Producción & Hornos',
    shift: 'Mañana (05:00 - 13:00)',
    phone: '(01) 555-CARLOS',
    email: 'carlos.mendoza@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '👨‍🍳'
  },
  {
    id: 'emp_02',
    code: 'EMP-002',
    name: 'Ana Ramírez',
    role: 'Personal de Caja / POS',
    roleCode: 'CASHIER',
    department: 'Ventas & Atención',
    shift: 'Tarde (13:00 - 21:00)',
    phone: '(01) 555-ANA',
    email: 'ana.ramirez@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '👩‍💼'
  },
  {
    id: 'emp_03',
    code: 'EMP-003',
    name: 'Juan',
    role: 'Gerente General',
    roleCode: 'ADMIN',
    department: 'Administración General',
    shift: 'Turno Completo',
    phone: '(01) 555-JUAN',
    email: 'juan.gerente@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '👨‍💼'
  },
  {
    id: 'emp_04',
    code: 'EMP-004',
    name: 'Enrique',
    role: 'Chef de Cuisine / Maestro Panadero',
    roleCode: 'BAKER',
    department: 'Producción & Hornos',
    shift: 'Mañana (05:00 - 13:00)',
    phone: '(01) 555-ENRIQUE',
    email: 'enrique.chef@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '👨‍🍳'
  },
  {
    id: 'emp_05',
    code: 'EMP-005',
    name: 'Henry',
    role: 'Cajero Principal / POS',
    roleCode: 'CASHIER',
    department: 'Ventas & Atención',
    shift: 'Mañana (07:00 - 15:00)',
    phone: '(01) 555-HENRY',
    email: 'henry.pos@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '👨‍💼'
  },
  {
    id: 'emp_06',
    code: 'EMP-006',
    name: 'Sebastian',
    role: 'Contador & Administrador',
    roleCode: 'ADMIN',
    department: 'Finanzas & Auditoría',
    shift: 'Horario Oficina (08:00 - 17:00)',
    phone: '(01) 555-SEBASTIAN',
    email: 'sebastian.finanzas@parisienne.com',
    status: 'active',
    statusText: '✓ Activo',
    pin: '1234',
    avatar: '📊'
  }
];

export const ROLE_PERMISSIONS_MATRIX = [
  {
    permissionId: 'pos_access',
    permissionName: 'Facturación y Cobro en Caja (POS)',
    category: 'Ventas',
    roles: { ADMIN: true, BAKER: false, CASHIER: true }
  },
  {
    permissionId: 'kitchen_access',
    permissionName: 'Monitoreo de Hornos y Comandas KDS',
    category: 'Cocina',
    roles: { ADMIN: true, BAKER: true, CASHIER: false }
  },
  {
    permissionId: 'inventory_view',
    permissionName: 'Consulta de Existencias de Almacén',
    category: 'Inventario',
    roles: { ADMIN: true, BAKER: true, CASHIER: true }
  },
  {
    permissionId: 'inventory_adjust',
    permissionName: 'Ajustes Manuales de Stock y Mermas',
    category: 'Inventario',
    roles: { ADMIN: true, BAKER: true, CASHIER: false }
  },
  {
    permissionId: 'suppliers_po',
    permissionName: 'Emisión de Órdenes de Compra a Proveedores',
    category: 'Compras',
    roles: { ADMIN: true, BAKER: false, CASHIER: false }
  },
  {
    permissionId: 'accounting_view',
    permissionName: 'Consulta de Contabilidad y Balance General',
    category: 'Finanzas',
    roles: { ADMIN: true, BAKER: false, CASHIER: false }
  },
  {
    permissionId: 'staff_manage',
    permissionName: 'Gestión de Empleados y Cambio de PINs',
    category: 'RRHH',
    roles: { ADMIN: true, BAKER: false, CASHIER: false }
  }
];
