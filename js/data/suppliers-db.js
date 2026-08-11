/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS MAESTRA DE PROVEEDORES Y COMPRAS
   Directorio de proveedores homologados y registro de órdenes de compra
   ========================================================================== */

export const SUPPLIERS_DATABASE = [
  {
    id: 'sup_01',
    code: 'PROV-001',
    name: 'Molinos del Sur, C.A.',
    category: 'Harinas y Cereales',
    contactPerson: 'Carlos Mendoza',
    phone: '(01) 555-MOLINO',
    email: 'ventas@molinosdelsur.com',
    rif: 'J-30819283-4',
    address: 'Zona Industrial Sur, Parcela 14, Caracas',
    paymentTerms: 'Crédito 30 días',
    rating: 4.9,
    icon: '🌾'
  },
  {
    id: 'sup_02',
    code: 'PROV-002',
    name: 'Lácteos La Granja',
    category: 'Lácteos y Mantequillas',
    contactPerson: 'María Elena Suárez',
    phone: '(01) 555-LACTEOS',
    email: 'pedidos@lacteoslagranja.com',
    rif: 'J-40192837-1',
    address: 'Av. Las Acacias, Edif. La Granja, Valencia',
    paymentTerms: 'Contado / 15 días',
    rating: 4.8,
    icon: '🧈'
  },
  {
    id: 'sup_03',
    code: 'PROV-003',
    name: 'Empaques del Norte',
    category: 'Empaques y Papelería',
    contactPerson: 'Roberto Gómez',
    phone: '(01) 555-EMPAQUE',
    email: 'contacto@empaquesnorte.com',
    rif: 'J-29837482-9',
    address: 'Av. Principal Norte, Bodega 5, Maracay',
    paymentTerms: 'Crédito 30 días',
    rating: 4.7,
    icon: '📦'
  },
  {
    id: 'sup_04',
    code: 'PROV-004',
    name: 'Chocolates del Rey',
    category: 'Coberturas y Cacao Belga',
    contactPerson: 'Jean-Philippe Laurent',
    phone: '(01) 555-CACAO',
    email: 'info@chocolatesdelrey.com',
    rif: 'J-50192834-6',
    address: 'Calle Los Artesanos, Qta. Cacao, Los Teques',
    paymentTerms: 'Crédito 15 días',
    rating: 5.0,
    icon: '🍫'
  }
];

export const PURCHASE_ORDERS_DATABASE = [
  {
    id: 'po_001',
    code: 'OC-2026-0089',
    supplierId: 'sup_01',
    supplierName: 'Molinos del Sur, C.A.',
    itemsSummary: '1,000 kg Harina de Trigo Tradicional T55',
    orderDate: '2026-08-10',
    deliveryDate: '2026-08-12',
    status: 'in_transit', // 'in_transit' | 'received' | 'pending'
    statusText: '🚚 En Tránsito',
    totalAmount: 1800.00
  },
  {
    id: 'po_002',
    code: 'OC-2026-0090',
    supplierId: 'sup_02',
    supplierName: 'Lácteos La Granja',
    itemsSummary: '200 kg Mantequilla de Normandía 84%',
    orderDate: '2026-08-11',
    deliveryDate: '2026-08-11',
    status: 'in_transit',
    statusText: '🚚 En Tránsito',
    totalAmount: 1700.00
  },
  {
    id: 'po_003',
    code: 'OC-2026-0088',
    supplierId: 'sup_04',
    supplierName: 'Chocolates del Rey',
    itemsSummary: '50 kg Cobertura de Chocolate Belga 60%',
    orderDate: '2026-08-05',
    deliveryDate: '2026-08-07',
    status: 'received',
    statusText: '✓ Recibido en Almacén',
    totalAmount: 600.00
  },
  {
    id: 'po_004',
    code: 'OC-2026-0087',
    supplierId: 'sup_03',
    supplierName: 'Empaques del Norte',
    itemsSummary: '500 Cajas de Pastelería + 1,000 Bolsas',
    orderDate: '2026-08-02',
    deliveryDate: '2026-08-04',
    status: 'received',
    statusText: '✓ Recibido en Almacén',
    totalAmount: 350.00
  }
];
