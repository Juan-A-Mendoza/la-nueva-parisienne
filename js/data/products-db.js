/* ==========================================================================
   LA NUEVA PARISIENNE - BASE DE DATOS MAESTRA DE PRODUCTOS (POS)
   Catálogo de productos con precios, categorías y disponibilidad de stock
   ========================================================================== */

export const CATEGORIES = [
  { id: 'todos', name: 'Todos los Productos', icon: '✨' },
  { id: 'panaderia', name: 'Panadería Artesanal', icon: '🥖' },
  { id: 'pasteleria', name: 'Pastelería & Repostería', icon: '🍰' },
  { id: 'cafeteria', name: 'Cafetería & Bebidas', icon: '☕' },
  { id: 'especialidades', name: 'Especialidades & Desayunos', icon: '🥪' }
];

export const PRODUCTS_DATABASE = [
  {
    id: 'prod_001',
    code: 'PAN-001',
    name: 'Baguette Tradicional Parisina',
    category: 'panaderia',
    price: 2.50,
    icon: '🥖',
    stock: 45,
    description: 'Corteza crujiente y miga alveolada con levadura madre.'
  },
  {
    id: 'prod_002',
    code: 'PAN-002',
    name: 'Croissant de Mantequilla',
    category: 'panaderia',
    price: 3.00,
    icon: '🥐',
    stock: 60,
    description: 'Hojaldre 100% mantequilla de Normandía.'
  },
  {
    id: 'prod_003',
    code: 'PAN-003',
    name: 'Pain au Chocolat',
    category: 'panaderia',
    price: 3.50,
    icon: '🍫',
    stock: 35,
    description: 'Hojaldre relleno de dos barras de chocolate negro 60%.'
  },
  {
    id: 'prod_004',
    code: 'PAN-004',
    name: 'Brioche de Vainilla',
    category: 'panaderia',
    price: 4.20,
    icon: '🍞',
    stock: 20,
    description: 'Pan de huevo esponjoso aromatizado con vainilla de Madagascar.'
  },
  {
    id: 'prod_005',
    code: 'PAN-005',
    name: 'Focaccia de Romero y Aceitunas',
    category: 'panaderia',
    price: 5.50,
    icon: '🫓',
    stock: 15,
    description: 'Pan plano italiano horneado con aceite de oliva extra virgen.'
  },
  {
    id: 'prod_006',
    code: 'PAS-001',
    name: 'Éclair de Chocolate Belga',
    category: 'pasteleria',
    price: 4.50,
    icon: '⚡',
    stock: 25,
    description: 'Pasta choux rellena de crema pastelera de chocolate oscuro.'
  },
  {
    id: 'prod_007',
    code: 'PAS-002',
    name: 'Tarta de Limón Merengada',
    category: 'pasteleria',
    price: 5.00,
    icon: '🍋',
    stock: 18,
    description: 'Base sablée, crema de limón amarillo y merengue tostado.'
  },
  {
    id: 'prod_008',
    code: 'PAS-003',
    name: 'Caja de Macarons Surtidos (6 ud)',
    category: 'pasteleria',
    price: 9.50,
    icon: '🍡',
    stock: 30,
    description: 'Selección de pistacho, frambuesa, vainilla, chocolate y café.'
  },
  {
    id: 'prod_009',
    code: 'PAS-004',
    name: 'Milhojas Tradicional de Crema',
    category: 'pasteleria',
    price: 4.80,
    icon: '🍰',
    stock: 14,
    description: 'Capas de hojaldre crujiente con crema diplomatica.'
  },
  {
    id: 'prod_010',
    code: 'BEB-001',
    name: 'Café Espresso Doble',
    category: 'cafeteria',
    price: 2.80,
    icon: '☕',
    stock: 100,
    description: 'Grano 100% arábica de tueste medio de origen único.'
  },
  {
    id: 'prod_011',
    code: 'BEB-002',
    name: 'Capuchino Cremoso',
    category: 'cafeteria',
    price: 3.80,
    icon: '🥛',
    stock: 80,
    description: 'Espresso con leche al vapor y espuma suave de canela.'
  },
  {
    id: 'prod_012',
    code: 'BEB-003',
    name: 'Café au Lait Parisien',
    category: 'cafeteria',
    price: 3.50,
    icon: '☕',
    stock: 90,
    description: 'Café de filtro mezclado con leche entera caliente.'
  },
  {
    id: 'prod_013',
    code: 'BEB-004',
    name: 'Jugo de Naranja Recién Exprimido',
    category: 'cafeteria',
    price: 4.00,
    icon: '🍊',
    stock: 40,
    description: '100% natural, prensado al momento sin azúcar añadida.'
  },
  {
    id: 'prod_014',
    code: 'ESP-001',
    name: 'Croque-Monsieur Tradicional',
    category: 'especialidades',
    price: 7.50,
    icon: '🥪',
    stock: 22,
    description: 'Sándwich caliente de jamón cocido, queso Gruyère y bechamel.'
  },
  {
    id: 'prod_015',
    code: 'ESP-002',
    name: 'Quiche Lorraine de Bacon',
    category: 'especialidades',
    price: 6.80,
    icon: '🥧',
    stock: 16,
    description: 'Tarta salada con tocino ahumado, crema de leche y queso.'
  }
];
