-- ============================================================================
-- LA NUEVA PARISIENNE - ESQUEMA RELACIONAL DE BASE DE DATOS MYSQL (PHP / PDO)
-- Script de Creación de Tablas, Llaves Foráneas y Datos Iniciales (Seed Data)
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `la_nueva_parisienne` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `la_nueva_parisienne`;

-- ----------------------------------------------------------------------------
-- 1. TABLA: roles (Perfiles de Acceso al Sistema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLA: usuarios (Nómina de Empleados y Autenticación por PIN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `rol_id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(50),
  `pin` VARCHAR(50) NOT NULL DEFAULT '1234',
  `icono` VARCHAR(20) DEFAULT '👨‍💼',
  `turno` VARCHAR(100),
  `redirect_url` VARCHAR(255) NOT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLA: categorias_producto (Categorías de Panadería y Pastelería)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categorias_producto` (
  `id` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLA: productos (Catálogo e Inventario de Insumos y Productos Terminados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id` VARCHAR(50) NOT NULL,
  `categoria_id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `unidad_medida` VARCHAR(20) NOT NULL DEFAULT 'kg',
  `stock_actual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'raw_material', -- 'raw_material' | 'finished_product'
  `ubicacion` VARCHAR(100) DEFAULT 'Almacén Central',
  `icono` VARCHAR(20) DEFAULT '🥖',
  `descripcion` TEXT,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_productos_categorias` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLA: proveedores (Directorio de Contactos Comerciales)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `contacto` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `rif` VARCHAR(50) NOT NULL,
  `direccion` TEXT,
  `condicion_pago` VARCHAR(50) DEFAULT 'Crédito 30 días',
  `calificacion` DECIMAL(3,1) DEFAULT 5.0,
  `icono` VARCHAR(20) DEFAULT '🏢',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLA: ordenes_compra (Órdenes de Compra y Recepción de Mercancía)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ordenes_compra` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `proveedor_id` VARCHAR(50) NOT NULL,
  `resumen_insumos` TEXT NOT NULL,
  `fecha_pedido` DATE NOT NULL,
  `fecha_entrega` DATE NOT NULL,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'in_transit', -- 'in_transit' | 'received'
  `monto_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ordenes_proveedores` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLA: ventas (Encabezado de Comprobantes de Venta POS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `usuario_id` VARCHAR(50) NOT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `iva` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descuento` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  `monto_pagado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cambio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tipo_pedido` VARCHAR(50) DEFAULT 'Para Llevar',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ventas_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7b. TABLA: ventas_detalle / detalles_venta (Renglones de Ítems Vendidos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ventas_detalle` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `venta_id` VARCHAR(50) NOT NULL,
  `producto_id` VARCHAR(50) NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `subtotal_linea` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ventas_detalle_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ventas_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `detalles_venta` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `venta_id` VARCHAR(50) NOT NULL,
  `producto_id` VARCHAR(50) NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `subtotal_linea` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_detalles_venta_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalles_venta_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLA: plan_cuentas (Plan Único de Cuentas Contables - PUC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plan_cuentas` (
  `codigo` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL, -- 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto' | 'Costo'
  `naturaleza` VARCHAR(20) NOT NULL, -- 'Deudor' | 'Acreedor'
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLA: asientos_contables (Encabezado de Comprobantes de Diario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asientos_contables` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `concepto` TEXT NOT NULL,
  `modulo_origen` VARCHAR(100) NOT NULL,
  `icono` VARCHAR(20) DEFAULT '🧾',
  `total_debe` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_haber` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLA: asientos_detalle (Renglones de Partida Doble Debe / Haber)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asientos_detalle` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `asiento_id` VARCHAR(50) NOT NULL,
  `cuenta_codigo` VARCHAR(20) NOT NULL,
  `debe` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `haber` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_asientos_detalle_encabezado` FOREIGN KEY (`asiento_id`) REFERENCES `asientos_contables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asientos_detalle_cuentas` FOREIGN KEY (`cuenta_codigo`) REFERENCES `plan_cuentas` (`codigo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- INSERCIÓN DE DATOS DE SEMILLA (SEED DATA INICIAL)
-- ============================================================================

-- Inserción de Roles
INSERT INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`) VALUES
('rol_admin', 'ADMIN', 'Gerente General / Administrador', 'Acceso total a KPIs, contabilidad, personal y configuración.'),
('rol_baker', 'BAKER', 'Maestro Panadero / Chef de Cuisine', 'Gestión de hornos industrials, comandas KDS e insumos de masa.'),
('rol_cashier', 'CASHIER', 'Personal de Caja / POS', 'Facturación directa, cobro en efectivo/tarjeta y arqueo de caja.');

-- Inserción de Usuarios (Todos con PIN '1234')
INSERT INTO `usuarios` (`id`, `rol_id`, `codigo`, `nombre`, `email`, `telefono`, `pin`, `icono`, `turno`, `redirect_url`, `estado`) VALUES
('usr_manager', 'rol_admin', 'EMP-003', 'Juan', 'juan.gerente@parisienne.com', '(01) 555-JUAN', '1234', '👨‍💼', 'Turno Completo', 'modules/dashboard.html', 'active'),
('usr_baker', 'rol_baker', 'EMP-004', 'Enrique', 'enrique.chef@parisienne.com', '(01) 555-ENRIQUE', '1234', '👨‍🍳', 'Mañana (05:00 - 13:00)', 'modules/kitchen.html', 'active'),
('usr_cashier', 'rol_cashier', 'EMP-005', 'Henry', 'henry.pos@parisienne.com', '(01) 555-HENRY', '1234', '👨‍💼', 'Mañana (07:00 - 15:00)', 'modules/pos.html', 'active'),
('usr_accountant', 'rol_admin', 'EMP-006', 'Sebastian', 'sebastian.finanzas@parisienne.com', '(01) 555-SEBASTIAN', '1234', '📊', 'Horario Oficina', 'modules/accounting.html', 'active'),
('usr_carlos', 'rol_baker', 'EMP-001', 'Carlos Mendoza', 'carlos.mendoza@parisienne.com', '(01) 555-CARLOS', '1234', '👨‍🍳', 'Mañana (05:00 - 13:00)', 'modules/kitchen.html', 'active'),
('usr_ana', 'rol_cashier', 'EMP-002', 'Ana Ramírez', 'ana.ramirez@parisienne.com', '(01) 555-ANA', '1234', '👩‍💼', 'Tarde (13:00 - 21:00)', 'modules/pos.html', 'active');

-- Inserción de Categorías
INSERT INTO `categorias_producto` (`id`, `nombre`, `descripcion`) VALUES
('cat_insumos', 'Materias Primas', 'Harinas, mantequillas, levaduras y cacao para horneado.'),
('cat_panaderia', 'Panadería Artesanal', 'Baguettes, brioches y panes de especialidad.'),
('cat_pasteleria', 'Pastelería & Éclairs', 'Éclairs, tartas de limón y milhojas.'),
('cat_cafeteria', 'Cafetería & Bebidas', 'Café espresso, cappuccino y jugos.');

-- Inserción de Productos e Inventario
INSERT INTO `productos` (`id`, `categoria_id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `precio_unitario`, `tipo`, `ubicacion`) VALUES
('inv_001', 'cat_insumos', 'MAT-001', 'Harina de Trigo Tradicional T55', 'kg', 18.00, 50.00, 1.80, 'raw_material', 'Almacén Principal A-1'),
('inv_002', 'cat_insumos', 'MAT-002', 'Mantequilla de Normandía 84% M.G.', 'kg', 12.50, 30.00, 8.50, 'raw_material', 'Cámara Frigorífica B-2'),
('inv_003', 'cat_insumos', 'MAT-003', 'Levadura Madre Activa Tostada', 'kg', 8.00, 15.00, 4.20, 'raw_material', 'Refrigerador Insumos'),
('inv_004', 'cat_insumos', 'MAT-004', 'Chocolate Belga 60% Cacao', 'kg', 42.00, 20.00, 12.00, 'raw_material', 'Almacén Seco A-3'),
('inv_007', 'cat_panaderia', 'PAN-001', 'Baguette Tradicional Parisina', 'ud', 45.00, 20.00, 2.50, 'finished_product', 'Mostrador Panadería'),
('inv_008', 'cat_panaderia', 'PAN-002', 'Croissant de Mantequilla', 'ud', 60.00, 25.00, 3.00, 'finished_product', 'Vitrinas POS'),
('inv_009', 'cat_pasteleria', 'PAS-001', 'Éclair de Chocolate Belga', 'ud', 5.00, 15.00, 4.50, 'finished_product', 'Vitrinas Refrigeradas Pastelería');

-- Inserción de Proveedores
INSERT INTO `proveedores` (`id`, `codigo`, `nombre`, `categoria`, `contacto`, `telefono`, `email`, `rif`, `direccion`, `condicion_pago`, `calificacion`, `icono`) VALUES
('sup_01', 'PROV-001', 'Molinos del Sur, C.A.', 'Harinas y Cereales', 'Carlos Mendoza', '(01) 555-MOLINO', 'ventas@molinosdelsur.com', 'J-30819283-4', 'Zona Industrial Sur, Parcela 14, Caracas', 'Crédito 30 días', 4.9, '🌾'),
('sup_02', 'PROV-002', 'Lácteos La Granja', 'Lácteos y Mantequillas', 'María Elena Suárez', '(01) 555-LACTEOS', 'pedidos@lacteoslagranja.com', 'J-40192837-1', 'Av. Las Acacias, Edif. La Granja, Valencia', 'Contado / 15 días', 4.8, '🧈'),
('sup_03', 'PROV-003', 'Empaques del Norte', 'Empaques y Papelería', 'Roberto Gómez', '(01) 555-EMPAQUE', 'contacto@empaquesnorte.com', 'J-29837482-9', 'Av. Principal Norte, Bodega 5, Maracay', 'Crédito 30 días', 4.7, '📦'),
('sup_04', 'PROV-004', 'Chocolates del Rey', 'Coberturas y Cacao Belga', 'Jean-Philippe Laurent', '(01) 555-CACAO', 'info@chocolatesdelrey.com', 'J-50192834-6', 'Calle Los Artesanos, Qta. Cacao, Los Teques', 'Crédito 15 días', 5.0, '🍫');

-- Inserción del Plan Único de Cuentas (PUC)
INSERT INTO `plan_cuentas` (`codigo`, `nombre`, `tipo`, `naturaleza`) VALUES
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

-- Inserción de Comprobante Contable de Ejemplo
INSERT INTO `asientos_contables` (`id`, `codigo`, `fecha_hora`, `concepto`, `modulo_origen`, `icono`, `total_debe`, `total_haber`) VALUES
('as_001', 'AS-2026-001', '2026-08-11 16:42:00', 'Venta POS Mostrador (Comprobante FAC-2026-1003)', 'Punto de Venta (POS)', '🛒', 1485.50, 1485.50);

INSERT INTO `asientos_detalle` (`asiento_id`, `cuenta_codigo`, `debe`, `haber`) VALUES
('as_001', '1105', 1485.50, 0.00),
('as_001', '4135', 0.00, 1280.60),
('as_001', '2408', 0.00, 204.90);
