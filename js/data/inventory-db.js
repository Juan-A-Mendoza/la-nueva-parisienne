/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS MAESTRA DE INVENTARIO Y STOCK
   Existencias de materias primas y productos terminados con niveles críticos
   ========================================================================== */

export const INVENTORY_DATABASE = [
  {
    id: 'inv_001',
    code: 'MAT-001',
    name: 'Harina de Trigo Tradicional T55',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'kg',
    currentStock: 18.0,
    minStock: 50.0,
    unitPrice: 1.80,
    status: 'critical', // 'optimal' | 'low_stock' | 'critical'
    location: 'Almacén Principal A-1'
  },
  {
    id: 'inv_002',
    code: 'MAT-002',
    name: 'Mantequilla de Normandía 84% M.G.',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'kg',
    currentStock: 12.5,
    minStock: 30.0,
    unitPrice: 8.50,
    status: 'critical',
    location: 'Cámara Frigorífica B-2'
  },
  {
    id: 'inv_003',
    code: 'MAT-003',
    name: 'Levadura Madre Activa Tostada',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'kg',
    currentStock: 8.0,
    minStock: 15.0,
    unitPrice: 4.20,
    status: 'low_stock',
    location: 'Refrigerador Insumos'
  },
  {
    id: 'inv_004',
    code: 'MAT-004',
    name: 'Chocolate Belga 60% Cacao',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'kg',
    currentStock: 42.0,
    minStock: 20.0,
    unitPrice: 12.00,
    status: 'optimal',
    location: 'Almacén Seco A-3'
  },
  {
    id: 'inv_005',
    code: 'MAT-005',
    name: 'Azúcar Fina Refinada',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'kg',
    currentStock: 65.0,
    minStock: 25.0,
    unitPrice: 1.50,
    status: 'optimal',
    location: 'Almacén Seco A-2'
  },
  {
    id: 'inv_006',
    code: 'MAT-006',
    name: 'Huevos Frescos de Granja',
    category: 'raw_material',
    categoryName: 'Materia Prima',
    unit: 'ud',
    currentStock: 120,
    minStock: 150,
    unitPrice: 0.25,
    status: 'low_stock',
    location: 'Refrigerador Insumos'
  },
  {
    id: 'inv_007',
    code: 'PAN-001',
    name: 'Baguette Tradicional Parisina',
    category: 'finished_product',
    categoryName: 'Producto Terminado',
    unit: 'ud',
    currentStock: 45,
    minStock: 20,
    unitPrice: 2.50,
    status: 'optimal',
    location: 'Mostrador Panadería'
  },
  {
    id: 'inv_008',
    code: 'PAN-002',
    name: 'Croissant de Mantequilla',
    category: 'finished_product',
    categoryName: 'Producto Terminado',
    unit: 'ud',
    currentStock: 60,
    minStock: 25,
    unitPrice: 3.00,
    status: 'optimal',
    location: 'Vitrinas POS'
  },
  {
    id: 'inv_009',
    code: 'PAS-001',
    name: 'Éclair de Chocolate Belga',
    category: 'finished_product',
    categoryName: 'Producto Terminado',
    unit: 'ud',
    currentStock: 5,
    minStock: 15,
    unitPrice: 4.50,
    status: 'critical',
    location: 'Vitrinas Refrigeradas Pastelería'
  },
  {
    id: 'inv_010',
    code: 'PAS-002',
    name: 'Tarta de Limón Merengada',
    category: 'finished_product',
    categoryName: 'Producto Terminado',
    unit: 'ud',
    currentStock: 18,
    minStock: 10,
    unitPrice: 5.00,
    status: 'optimal',
    location: 'Vitrinas Refrigeradas Pastelería'
  }
];
