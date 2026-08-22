-- ============================================================================
-- LA NUEVA PARISIENNE - SCRIPT DE POBLADO DE DATOS (SEED DATA MOCK MIGRATION)
-- Inserta datos de prueba para usuarios, perfiles, PINs, catálogo e inventario
-- Compatible con MySQL / MariaDB (InnoDB) mediante DELETE sin restricciones FK
-- ============================================================================

USE `la_nueva_parisienne`;

-- 1. DESHABILITAR RESTRICCIONES TEMPORALMENTE Y LIMPIAR CON DELETE
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `comandas_cocina`;
DELETE FROM `hornos`;
DELETE FROM `estado_hornos`;
DELETE FROM `lotes_produccion`;
DELETE FROM `asientos_detalle`;
DELETE FROM `asientos_contables`;
DELETE FROM `plan_cuentas`;
DELETE FROM `ordenes_compra`;
DELETE FROM `proveedores`;
DELETE FROM `productos`;
DELETE FROM `categorias_producto`;
DELETE FROM `usuarios`;
DELETE FROM `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 2. POBLAR TABLA: roles
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`) VALUES
('rol_admin', 'ADMIN', 'Gerente General / Administrador', 'Acceso total a KPIs, contabilidad, personal, inventario y configuración.'),
('rol_baker', 'BAKER', 'Maestro Panadero / Chef de Cuisine', 'Gestión de hornos industriales, comandas KDS e insumos de masa.'),
('rol_cashier', 'CASHIER', 'Personal de Caja / POS', 'Facturación directa, cobro en efectivo/tarjeta y arqueo de caja.'),
('rol_accountant', 'ACCOUNTANT', 'Contador & Administrador', 'Auditoría financiera, balance de comprobación y órdenes de compra.');

-- ----------------------------------------------------------------------------
-- 3. POBLAR TABLA: usuarios (TODOS CON PIN '1234')
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `usuarios` (`id`, `rol_id`, `codigo`, `nombre`, `email`, `telefono`, `pin`, `icono`, `turno`, `redirect_url`, `estado`) VALUES
('usr_carlos', 'rol_baker', 'EMP-001', 'Carlos Mendoza', 'carlos.mendoza@parisienne.com', '(01) 555-CARLOS', '1234', '👨‍🍳', 'Mañana (05:00 - 13:00)', 'modules/kitchen.html', 'active'),
('usr_ana', 'rol_cashier', 'EMP-002', 'Ana Ramírez', 'ana.ramirez@parisienne.com', '(01) 555-ANA', '1234', '👩‍💼', 'Tarde (13:00 - 21:00)', 'modules/pos.html', 'active'),
('usr_manager', 'rol_admin', 'EMP-003', 'Juan', 'juan.gerente@parisienne.com', '(01) 555-JUAN', '1234', '👨‍💼', 'Turno Completo', 'modules/dashboard.html', 'active'),
('usr_baker', 'rol_baker', 'EMP-004', 'Enrique', 'enrique.chef@parisienne.com', '(01) 555-ENRIQUE', '1234', '👨‍🍳', 'Mañana (05:00 - 13:00)', 'modules/kitchen.html', 'active'),
('usr_cashier', 'rol_cashier', 'EMP-005', 'Henry', 'henry.pos@parisienne.com', '(01) 555-HENRY', '1234', '👨‍💼', 'Mañana (07:00 - 15:00)', 'modules/pos.html', 'active'),
('usr_accountant', 'rol_accountant', 'EMP-006', 'Sebastian', 'sebastian.finanzas@parisienne.com', '(01) 555-SEBASTIAN', '1234', '📊', 'Horario Oficina (08:00 - 17:00)', 'modules/accounting.html', 'active');

-- ----------------------------------------------------------------------------
-- 4. POBLAR TABLA: categorias_producto
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `categorias_producto` (`id`, `nombre`, `descripcion`) VALUES
('cat_insumos', 'Materias Primas', 'Harinas, mantequillas, levaduras y cacao para horneado.'),
('cat_panaderia', 'Panadería Artesanal', 'Baguettes, brioches y panes de especialidad.'),
('cat_pasteleria', 'Pastelería & Repostería', 'Éclairs, tartas de limón, macarons y milhojas.'),
('cat_cafeteria', 'Cafetería & Bebidas', 'Café espresso, cappuccino, café au lait y jugos.'),
('cat_especialidades', 'Especialidades & Desayunos', 'Croque-Monsieur, quiches y desyunos artesanales.');

-- ----------------------------------------------------------------------------
-- 5. POBLAR TABLA: productos (INVENTARIO E ÍTEMS DEL PUNTO DE VENTA POS)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `productos` (`id`, `categoria_id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `precio_unitario`, `tipo`, `ubicacion`, `icono`, `descripcion`) VALUES
('inv_001', 'cat_insumos', 'MAT-001', 'Harina de Trigo Tradicional T55', 'kg', 18.00, 50.00, 1.80, 'raw_material', 'Almacén Principal A-1', '🌾', 'Harina refinada para panadería francesa.'),
('inv_002', 'cat_insumos', 'MAT-002', 'Mantequilla de Normandía 84% M.G.', 'kg', 12.50, 30.00, 8.50, 'raw_material', 'Cámara Frigorífica B-2', '🧈', 'Mantequilla de alta grasa para hojaldres.'),
('inv_003', 'cat_insumos', 'MAT-003', 'Levadura Madre Activa Tostada', 'kg', 8.00, 15.00, 4.20, 'raw_material', 'Refrigerador Insumos', '🧫', 'Masa madre natural fermentada.'),
('inv_004', 'cat_insumos', 'MAT-004', 'Chocolate Belga 60% Cacao', 'kg', 42.00, 20.00, 12.00, 'raw_material', 'Almacén Seco A-3', '🍫', 'Cobertura de cacao belga de origen.'),
('inv_005', 'cat_insumos', 'MAT-005', 'Azúcar Fina Refinada', 'kg', 65.00, 25.00, 1.50, 'raw_material', 'Almacén Seco A-2', '🧂', 'Azúcar blanca extra fina.'),
('inv_006', 'cat_insumos', 'MAT-006', 'Huevos Frescos de Granja', 'ud', 120.00, 150.00, 0.25, 'raw_material', 'Refrigerador Insumos', '🥚', 'Huevos de granja seleccionados.'),

('prod_001', 'cat_panaderia', 'PAN-001', 'Baguette Tradicional Parisina', 'ud', 45.00, 20.00, 2.50, 'finished_product', 'Mostrador Panadería', '🥖', 'Corteza crujiente y miga alveolada con levadura madre.'),
('prod_002', 'cat_panaderia', 'PAN-002', 'Croissant de Mantequilla', 'ud', 60.00, 25.00, 3.00, 'finished_product', 'Vitrinas POS', '🥐', 'Hojaldre 100% mantequilla de Normandía.'),
('prod_003', 'cat_panaderia', 'PAN-003', 'Pain au Chocolat', 'ud', 35.00, 15.00, 3.50, 'finished_product', 'Vitrinas POS', '🍫', 'Hojaldre relleno de dos barras de chocolate negro 60%.'),
('prod_004', 'cat_panaderia', 'PAN-004', 'Brioche de Vainilla', 'ud', 20.00, 10.00, 4.20, 'finished_product', 'Vitrinas POS', '🍞', 'Pan de huevo esponjoso aromatizado con vainilla de Madagascar.'),
('prod_005', 'cat_panaderia', 'PAN-005', 'Focaccia de Romero y Aceitunas', 'ud', 15.00, 8.00, 5.50, 'finished_product', 'Vitrinas POS', '🫓', 'Pan plano italiano horneado con aceite de oliva extra virgen.'),

('prod_006', 'cat_pasteleria', 'PAS-001', 'Éclair de Chocolate Belga', 'ud', 25.00, 15.00, 4.50, 'finished_product', 'Vitrinas Refrigeradas', '⚡', 'Pasta choux rellena de crema pastelera de chocolate oscuro.'),
('prod_007', 'cat_pasteleria', 'PAS-002', 'Tarta de Limón Merengada', 'ud', 18.00, 10.00, 5.00, 'finished_product', 'Vitrinas Refrigeradas', '🍋', 'Base sablée, crema de limón amarillo y merengue tostado.'),
('prod_008', 'cat_pasteleria', 'PAS-003', 'Caja de Macarons Surtidos (6 ud)', 'ud', 30.00, 12.00, 9.50, 'finished_product', 'Vitrinas Refrigeradas', '🍡', 'Selección de pistacho, frambuesa, vainilla, chocolate y café.'),
('prod_009', 'cat_pasteleria', 'PAS-004', 'Milhojas Tradicional de Crema', 'ud', 14.00, 8.00, 4.80, 'finished_product', 'Vitrinas Refrigeradas', '🍰', 'Capas de hojaldre crujiente con crema diplomatica.'),

('prod_010', 'cat_cafeteria', 'BEB-001', 'Café Espresso Doble', 'ud', 100.00, 30.00, 2.80, 'finished_product', 'Barra Cafetería', '☕', 'Grano 100% arábica de tueste medio de origen único.'),
('prod_011', 'cat_cafeteria', 'BEB-002', 'Capuchino Cremoso', 'ud', 80.00, 25.00, 3.80, 'finished_product', 'Barra Cafetería', '🥛', 'Espresso con leche al vapor y espuma suave de canela.'),
('prod_012', 'cat_cafeteria', 'BEB-003', 'Café au Lait Parisien', 'ud', 90.00, 25.00, 3.50, 'finished_product', 'Barra Cafetería', '☕', 'Café de filtro mezclado con leche entera caliente.'),
('prod_013', 'cat_cafeteria', 'BEB-004', 'Jugo de Naranja Recién Exprimido', 'ud', 40.00, 15.00, 4.00, 'finished_product', 'Barra Cafetería', '🍊', '100% natural, prensado al momento sin azúcar añadida.'),

('prod_014', 'cat_especialidades', 'ESP-001', 'Croque-Monsieur Tradicional', 'ud', 22.00, 10.00, 7.50, 'finished_product', 'Cocina POS', '🥪', 'Sándwich caliente de jamón cocido, queso Gruyère y bechamel.'),
('prod_015', 'cat_especialidades', 'ESP-002', 'Quiche Lorraine de Bacon', 'ud', 16.00, 8.00, 6.80, 'finished_product', 'Cocina POS', '🥧', 'Tarta salada con tocino ahumado, crema de leche y queso.');

-- ----------------------------------------------------------------------------
-- 6. POBLAR TABLA: proveedores
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `proveedores` (`id`, `codigo`, `nombre`, `categoria`, `contacto`, `telefono`, `email`, `rif`, `direccion`, `condicion_pago`, `calificacion`, `icono`) VALUES
('sup_01', 'PROV-001', 'Molinos del Sur, C.A.', 'Harinas y Cereales', 'Carlos Mendoza', '(01) 555-MOLINO', 'ventas@molinosdelsur.com', 'J-30819283-4', 'Zona Industrial Sur, Parcela 14, Caracas', 'Crédito 30 días', 4.9, '🌾'),
('sup_02', 'PROV-002', 'Lácteos La Granja', 'Lácteos y Mantequillas', 'María Elena Suárez', '(01) 555-LACTEOS', 'pedidos@lacteoslagranja.com', 'J-40192837-1', 'Av. Las Acacias, Edif. La Granja, Valencia', 'Contado / 15 días', 4.8, '🧈'),
('sup_03', 'PROV-003', 'Empaques del Norte', 'Empaques y Papelería', 'Roberto Gómez', '(01) 555-EMPAQUE', 'contacto@empaquesnorte.com', 'J-29837482-9', 'Av. Principal Norte, Bodega 5, Maracay', 'Crédito 30 días', 4.7, '📦'),
('sup_04', 'PROV-004', 'Chocolates del Rey', 'Coberturas y Cacao Belga', 'Jean-Philippe Laurent', '(01) 555-CACAO', 'info@chocolatesdelrey.com', 'J-50192834-6', 'Calle Los Artesanos, Qta. Cacao, Los Teques', 'Crédito 15 días', 5.0, '🍫');

-- ----------------------------------------------------------------------------
-- 7. POBLAR TABLA: ordenes_compra
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `ordenes_compra` (`id`, `codigo`, `proveedor_id`, `resumen_insumos`, `fecha_pedido`, `fecha_entrega`, `estado`, `monto_total`) VALUES
('po_001', 'OC-2026-0089', 'sup_01', '1,000 kg Harina de Trigo Tradicional T55', '2026-08-10', '2026-08-12', 'in_transit', 1800.00),
('po_002', 'OC-2026-0090', 'sup_02', '200 kg Mantequilla de Normandía 84%', '2026-08-11', '2026-08-11', 'in_transit', 1700.00),
('po_003', 'OC-2026-0088', 'sup_04', '50 kg Cobertura de Chocolate Belga 60%', '2026-08-05', '2026-08-07', 'received', 600.00),
('po_004', 'OC-2026-0087', 'sup_03', '500 Cajas de Pastelería + 1,000 Bolsas', '2026-08-02', '2026-08-04', 'received', 350.00);

-- ----------------------------------------------------------------------------
-- 8. POBLAR TABLA: plan_cuentas (PUC)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `plan_cuentas` (`codigo`, `nombre`, `tipo`, `naturaleza`) VALUES
('1105', 'Caja General', 'Activo', 'Deudor'),
('1110', 'Bancos Nacionales', 'Activo', 'Deudor'),
('1435', 'Inventario Materia Prima', 'Activo', 'Deudor'),
('1440', 'Inventario Productos Terminados', 'Activo', 'Deudor'),
('2205', 'Proveedores Nacionales', 'Pasivo', 'Acreedor'),
('2408', 'IVA Débito Fiscal (16%)', 'Pasivo', 'Acreedor'),
('3105', 'Capital Social', 'Patrimonio', 'Acreedor'),
('4135', 'Ventas Mostrador Panadería', 'Ingreso', 'Acreedor'),
('5105', 'Gastos de Personal / Sueldos', 'Gasto', 'Deudor'),
('5195', 'Gastos Mermas y Pérdidas', 'Gasto', 'Deudor'),
('6135', 'Costo de Ventas Producción', 'Costo', 'Deudor');

-- ----------------------------------------------------------------------------
-- 9. POBLAR TABLAS: asientos_contables y asientos_detalle
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `asientos_contables` (`id`, `codigo`, `fecha_hora`, `concepto`, `modulo_origen`, `icono`, `total_debe`, `total_haber`) VALUES
('as_001', 'AS-2026-001', '2026-08-11 16:42:00', 'Venta POS Mostrador (Comprobante FAC-2026-1003)', 'Punto de Venta (POS)', '🛒', 1485.50, 1485.50),
('as_002', 'AS-2026-002', '2026-08-10 14:15:00', 'Compra de Harina a Molinos del Sur (Orden OC-2026-0089)', 'Proveedores', '🌾', 1800.00, 1800.00);

INSERT IGNORE INTO `asientos_detalle` (`asiento_id`, `cuenta_codigo`, `debe`, `haber`) VALUES
('as_001', '1105', 1485.50, 0.00),
('as_001', '4135', 0.00, 1280.60),
('as_001', '2408', 0.00, 204.90),
('as_002', '1435', 1800.00, 0.00),
('as_002', '2205', 0.00, 1800.00);

-- ----------------------------------------------------------------------------
-- 10. POBLAR TABLA: lotes_produccion
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `lotes_produccion` (`id`, `codigo`, `producto`, `icono`, `cantidad`, `estado_leudado`, `temperatura_recomendada`, `tiempo_recomendado_min`) VALUES
('batch_042', 'Lote #042', 'Baguette Tradicional Parisina', '🥖', 50, 'En Horneado Activo', 220, 20),
('batch_043', 'Lote #043', 'Croissant de Mantequilla', '🥐', 60, 'En Horneado Activo', 190, 15),
('batch_044', 'Lote #044', 'Focaccia de Romero y Aceitunas', '🫓', 20, 'Horneado Listo', 240, 25),
('stage_045', 'Lote #045', 'Pain au Chocolat', '🍫', 40, 'Leudado Completo (100%)', 190, 15),
('stage_046', 'Lote #046', 'Brioche de Vainilla', '🍞', 25, 'Barnizado con Huevo Listo', 180, 22),
('stage_047', 'Lote #047', 'Masa de Éclairs (Choux)', '⚡', 35, 'Reposo en Bandeja (15 min)', 200, 18);

-- ----------------------------------------------------------------------------
-- 11. POBLAR TABLA: estado_hornos
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `estado_hornos` (`id`, `nombre`, `tipo`, `temperatura_actual`, `temperatura_objetivo`, `tiempo_restante`, `tiempo_total`, `estado`, `lote_id`) VALUES
('oven_01', 'Horno 1 (Giratorio A)', 'Giratorio Industrial', 220, 220, 255, 1200, 'baking', 'batch_042'),
('oven_02', 'Horno 2 (Convección B)', 'Convección Fina', 190, 190, 760, 900, 'baking', 'batch_043'),
('oven_03', 'Horno 3 (Piedra C)', 'Bóveda de Piedra', 240, 240, 0, 1500, 'ready', 'batch_044'),
('oven_04', 'Horno 4 (Pastelero D)', 'Convección Digital', 160, 175, 0, 0, 'preheating', NULL);
