-- ============================================================================
-- LA NUEVA PARISIENNE - ESQUEMA RELACIONAL DE BASE DE DATOS MYSQL (PHP / PDO)
-- Script Canónico Completo de Creación de Tablas, Índices y Datos Iniciales
-- Optimizado para importación directa en phpMyAdmin, MySQL y MariaDB
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
START TRANSACTION;

CREATE DATABASE IF NOT EXISTS `la_nueva_parisienne` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `la_nueva_parisienne`;

-- ----------------------------------------------------------------------------
-- 1. TABLA: configuracion_empresa (Datos Fiscales de la Empresa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuracion_empresa` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `rif` VARCHAR(30) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLA: configuraciones (Ajustes Generales, Tasa BCV y Modo Login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuraciones` (
  `clave` VARCHAR(100) NOT NULL,
  `valor` TEXT NOT NULL,
  `descripcion` VARCHAR(255),
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLA: roles (Perfiles de Acceso al Sistema y Redirección 2FN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `redirect_url` VARCHAR(255) NOT NULL DEFAULT 'modules/dashboard.html',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLA: usuarios (Nómina de Empleados y Autenticación por PIN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `rol_id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `username` VARCHAR(50) NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(50),
  `pin` VARCHAR(50) NOT NULL DEFAULT '1234',
  `icono` VARCHAR(20) DEFAULT 'shield-check',
  `turno` VARCHAR(100),
  `estado` VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `icono` VARCHAR(20) DEFAULT 'building-2',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLA: categorias_producto (Categorías de Panadería y Pastelería)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categorias_producto` (
  `id` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLA: materias_primas (Almacén de Insumos y Materias Primas de Panadería)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `materias_primas` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `unidad_medida` VARCHAR(20) NOT NULL DEFAULT 'kg',
  `stock_actual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `costo_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `ubicacion` VARCHAR(100) DEFAULT 'Almacén Central',
  `icono` VARCHAR(20) DEFAULT 'package',
  `descripcion` TEXT,
  `proveedor_id` VARCHAR(50) NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_materias_primas_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLA: productos (Catálogo de Mostrador y Vitrina para Venta en POS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id` VARCHAR(50) NOT NULL,
  `categoria_id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `unidad_medida` VARCHAR(20) NOT NULL DEFAULT 'ud',
  `stock_actual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'finished_product',
  `ubicacion` VARCHAR(100) DEFAULT 'Vitrinas POS',
  `icono` VARCHAR(20) DEFAULT 'croissant',
  `descripcion` TEXT,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_productos_categorias` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLA: ordenes_compra (Encabezado de Órdenes de Compra)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ordenes_compra` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `proveedor_id` VARCHAR(50) NOT NULL,
  `fecha_pedido` DATE NOT NULL,
  `fecha_entrega` DATE NOT NULL,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'in_transit',
  `monto_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ordenes_proveedores` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLA: ordenes_compra_detalle (Detalle de Insumos Comprados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ordenes_compra_detalle` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `orden_id` VARCHAR(50) NOT NULL,
  `materia_prima_id` VARCHAR(50) NOT NULL,
  `cantidad` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ordenes_compra_detalle_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ordenes_compra_detalle_materia_prima` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. TABLA: ventas (Encabezado de Comprobantes de Venta POS - Bimonetario)
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
  `tasa_bcv` DECIMAL(12,4) NOT NULL DEFAULT 1.0000,
  `total_bs` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  `monto_pagado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cambio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tipo_pedido` VARCHAR(50) DEFAULT 'Para Llevar',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ventas_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. TABLA: ventas_detalle (Renglones Vendidos)
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
  CONSTRAINT `fk_ventas_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. TABLA: reportes_caja_venta_meta (Metadatos de Caja por Venta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reportes_caja_venta_meta` (
  `venta_id` VARCHAR(50) NOT NULL,
  `caja_id` VARCHAR(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` VARCHAR(100) NULL,
  `referencia_lote` VARCHAR(100) NULL,
  `estatus` VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA',
  `actualizado_por` VARCHAR(50) NULL,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`venta_id`),
  CONSTRAINT `fk_reportes_caja_meta_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_reportes_caja_meta_caja` (`caja_id`),
  INDEX `idx_reportes_caja_meta_turno` (`turno`),
  INDEX `idx_reportes_caja_meta_estatus` (`estatus`),
  INDEX `idx_reportes_caja_meta_referencia` (`referencia_lote`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. TABLA: reportes_caja_eventos (Eventos de Cobro, Devolución y Anulación)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reportes_caja_eventos` (
  `id` VARCHAR(50) NOT NULL,
  `venta_id` VARCHAR(50) NULL,
  `codigo_venta` VARCHAR(50) NOT NULL,
  `caja_id` VARCHAR(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` VARCHAR(100) NULL,
  `usuario_id` VARCHAR(50) NULL,
  `tipo_evento` VARCHAR(30) NOT NULL,
  `estatus` VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA',
  `metodo_pago` VARCHAR(50) NULL,
  `referencia_lote` VARCHAR(100) NULL,
  `monto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `motivo` VARCHAR(255) NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reportes_caja_evento_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_reportes_caja_eventos_fecha` (`fecha_hora`),
  INDEX `idx_reportes_caja_eventos_caja` (`caja_id`),
  INDEX `idx_reportes_caja_eventos_turno` (`turno`),
  INDEX `idx_reportes_caja_eventos_usuario` (`usuario_id`),
  INDEX `idx_reportes_caja_eventos_tipo` (`tipo_evento`),
  INDEX `idx_reportes_caja_eventos_referencia` (`referencia_lote`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. TABLA: reportes_caja_cierres (Historial de Cortes X / Z y Arqueos de Caja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reportes_caja_cierres` (
  `id` VARCHAR(50) NOT NULL,
  `codigo_reporte` VARCHAR(50) NOT NULL UNIQUE,
  `fecha_turno` DATE NOT NULL,
  `caja_id` VARCHAR(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` VARCHAR(100) NOT NULL,
  `ventas_brutas` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `descuentos` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `ventas_netas` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_bs` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tasa_bcv` DECIMAL(12,4) NOT NULL DEFAULT 1.0000,
  `monto_efectivo_esperado` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `monto_efectivo_real` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `diferencia_efectivo` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `facturas_emitidas` INT NOT NULL DEFAULT 0,
  `facturas_anuladas` INT NOT NULL DEFAULT 0,
  `cerrado_sin_ventas` TINYINT(1) NOT NULL DEFAULT 0,
  `mensaje_cierre` VARCHAR(255) NULL,
  `observaciones` TEXT NULL,
  `detalle_pagos_json` LONGTEXT NULL,
  `firma_cajero` VARCHAR(150) NULL,
  `firma_supervisor` VARCHAR(150) NULL,
  `generado_por` VARCHAR(50) NOT NULL,
  `generado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reportes_caja_cierres_fecha` (`fecha_turno`),
  INDEX `idx_reportes_caja_cierres_caja` (`caja_id`),
  INDEX `idx_reportes_caja_cierres_generado_por` (`generado_por`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. TABLA: reportes_caja_auditoria (Bitácora de Acceso a Reportes Financieros)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reportes_caja_auditoria` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipo_reporte` VARCHAR(40) NOT NULL,
  `accion` VARCHAR(20) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `usuario_nombre` VARCHAR(150) NOT NULL,
  `rol_codigo` VARCHAR(50) NOT NULL,
  `filtros_consulta` TEXT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reportes_caja_auditoria_fecha` (`fecha_hora`),
  INDEX `idx_reportes_caja_auditoria_tipo` (`tipo_reporte`),
  INDEX `idx_reportes_caja_auditoria_usuario` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. TABLA: plan_cuentas (Plan Único de Cuentas Contables - PUC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plan_cuentas` (
  `codigo` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `naturaleza` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. TABLA: asientos_contables (Encabezado de Comprobantes de Diario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asientos_contables` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `concepto` TEXT NOT NULL,
  `modulo_origen` VARCHAR(100) NOT NULL,
  `icono` VARCHAR(20) DEFAULT 'receipt',
  `total_debe` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_haber` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. TABLA: asientos_detalle (Renglones de Partida Doble Debe / Haber)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asientos_detalle` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `asiento_id` VARCHAR(50) NOT NULL,
  `cuenta_codigo` VARCHAR(20) NOT NULL,
  `debe` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `haber` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_asientos_detalle_encabezado` FOREIGN KEY (`asiento_id`) REFERENCES `asientos_contables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asientos_detalle_cuentas` FOREIGN KEY (`cuenta_codigo`) REFERENCES `plan_cuentas` (`codigo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. TABLA: lotes_produccion (Lotes de Producción y Horneado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lotes_produccion` (
  `id` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(50) NOT NULL,
  `producto` VARCHAR(150) NOT NULL,
  `codigo_producto` VARCHAR(50) NULL,
  `icono` VARCHAR(20) DEFAULT 'croissant',
  `cantidad` INT NOT NULL DEFAULT 0,
  `estado_leudado` VARCHAR(100) NOT NULL DEFAULT 'Leudado Completo (100%)',
  `temperatura_recomendada` INT DEFAULT 190,
  `tiempo_recomendado_min` INT DEFAULT 15,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. TABLA: estado_hornos (Monitoreo de Hornos Industriales)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_hornos` (
  `id` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(100) NOT NULL DEFAULT 'Industrial',
  `temperatura_actual` INT NOT NULL DEFAULT 150,
  `temperatura_objetivo` INT NOT NULL DEFAULT 200,
  `tiempo_restante` INT NOT NULL DEFAULT 0,
  `tiempo_total` INT NOT NULL DEFAULT 0,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'idle',
  `lote_id` VARCHAR(50) NULL,
  `inicio_en` DATETIME NULL,
  `fin_estimado` DATETIME NULL,
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_hornos_lotes` FOREIGN KEY (`lote_id`) REFERENCES `lotes_produccion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. TABLA: comandas_cocina (Comandas POS KDS Módulo Cocina)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comandas_cocina` (
  `id` VARCHAR(50) NOT NULL,
  `numero_factura` VARCHAR(50) NOT NULL,
  `detalles_pedido` TEXT NOT NULL,
  `estado_preparacion` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEMILLA / SEED DATA)
-- Ordenado estrictamente para respetar integridad referencial y evitar bloqueos
-- ============================================================================

-- 1. Datos Fiscales de la Empresa
INSERT INTO `configuracion_empresa` (`id`, `nombre`, `rif`, `direccion`, `telefono`) VALUES
(1, 'La Nueva Parisienne Panadería & Pastelería C.A.', 'J-40123456-7', 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara', '(0251) 555-1234')
ON DUPLICATE KEY UPDATE 
    `nombre` = VALUES(`nombre`), 
    `rif` = VALUES(`rif`), 
    `direccion` = VALUES(`direccion`), 
    `telefono` = VALUES(`telefono`);

-- 2. Configuraciones del Sistema (Tasa BCV y Modo Login)
INSERT INTO `configuraciones` (`clave`, `valor`, `descripcion`) VALUES
('bcv_rate_mode', 'auto', 'Modo de obtención de la tasa BCV: auto o manual'),
('bcv_manual_rate', '761.21', 'Valor de la tasa de cambio ingresado manualmente'),
('modo_login', 'pos', 'Modalidad de inicio de sesión en index.html: pos o tradicional')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);

-- 3. Roles del Sistema
INSERT INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`, `redirect_url`) VALUES
('rol_superadmin', 'SUPERADMIN', 'Super Administrador', 'Acceso total e irrestricto a todos los módulos y funciones del sistema.', 'modules/dashboard.html'),
('rol_admin', 'ADMIN', 'Gerente General / Administrador', 'Acceso total a KPIs, contabilidad, personal y configuración.', 'modules/dashboard.html'),
('rol_baker', 'BAKER', 'Maestro Panadero / Chef de Cuisine', 'Gestión de hornos industriales, comandas KDS e insumos de masa.', 'modules/kitchen.html'),
('rol_cashier', 'CASHIER', 'Personal de Caja / POS', 'Facturación directa, cobro en efectivo/tarjeta y arqueo de caja.', 'modules/pos.html'),
('rol_accountant', 'ACCOUNTANT', 'Contador & Administrador', 'Auditoría financiera, balance de comprobación y órdenes de compra.', 'modules/accounting.html')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `redirect_url` = VALUES(`redirect_url`);

-- 4. Usuarios Iniciales (Credenciales con PIN por defecto '1234')
INSERT INTO `usuarios` (`id`, `rol_id`, `codigo`, `username`, `nombre`, `email`, `telefono`, `pin`, `icono`, `turno`, `estado`) VALUES
('usr_superadmin', 'rol_superadmin', 'EMP-000', 'superadmin', 'Super Administrador', 'superadmin@parisienne.com', '(01) 555-SUPER', '1234', 'shield-check', 'Acceso Total 24/7', 'active'),
('usr_manager', 'rol_admin', 'EMP-003', 'admin', 'Juan Mendoza', 'juan.gerente@parisienne.com', '(01) 555-JUAN', '1234', 'shield-check', 'Turno Completo', 'active'),
('usr_baker', 'rol_baker', 'EMP-004', 'chef', 'Enrique Chef', 'enrique.chef@parisienne.com', '(01) 555-ENRIQUE', '1234', 'chef-hat', 'Mañana (05:00 - 13:00)', 'active'),
('usr_cashier', 'rol_cashier', 'EMP-005', 'cajero', 'Henry POS', 'henry.pos@parisienne.com', '(01) 555-HENRY', '1234', 'shield-check', 'Mañana (07:00 - 15:00)', 'active'),
('usr_accountant', 'rol_accountant', 'EMP-006', 'contador', 'Sebastian Finanzas', 'sebastian.finanzas@parisienne.com', '(01) 555-SEBASTIAN', '1234', 'bar-chart-3', 'Horario Oficina', 'active'),
('usr_carlos', 'rol_baker', 'EMP-001', 'panadero', 'Carlos Mendoza', 'carlos.mendoza@parisienne.com', '(01) 555-CARLOS', '1234', 'chef-hat', 'Mañana (05:00 - 13:00)', 'active'),
('usr_ana', 'rol_cashier', 'EMP-002', 'cajero1', 'Ana Ramírez', 'ana.ramirez@parisienne.com', '(01) 555-ANA', '1234', 'banknote', 'Tarde (13:00 - 21:00)', 'active')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `username` = VALUES(`username`), `rol_id` = VALUES(`rol_id`);

-- 5. Proveedores Comerciales (Insertados antes de materias_primas para evitar conflictos de FK)
INSERT INTO `proveedores` (`id`, `codigo`, `nombre`, `categoria`, `contacto`, `telefono`, `email`, `rif`, `direccion`, `condicion_pago`, `calificacion`, `icono`) VALUES
('sup_01', 'PROV-001', 'Molinos del Sur, C.A.', 'Harinas y Cereales', 'Carlos Mendoza', '(01) 555-MOLINO', 'ventas@molinosdelsur.com', 'J-30819283-4', 'Zona Industrial Sur, Parcela 14, Caracas', 'Crédito 30 días', 4.9, 'wheat'),
('sup_02', 'PROV-002', 'Lácteos La Granja', 'Lácteos y Mantequillas', 'María Elena Suárez', '(01) 555-LACTEOS', 'pedidos@lacteoslagranja.com', 'J-40192837-1', 'Av. Las Acacias, Edif. La Granja, Valencia', 'Contado / 15 días', 4.8, 'milk'),
('sup_03', 'PROV-003', 'Empaques del Norte', 'Empaques y Papelería', 'Roberto Gómez', '(01) 555-EMPAQUE', 'contacto@empaquesnorte.com', 'J-29837482-9', 'Av. Principal Norte, Bodega 5, Maracay', 'Crédito 30 días', 4.7, 'package'),
('sup_04', 'PROV-004', 'Chocolates del Rey', 'Coberturas y Cacao Belga', 'Jean-Philippe Laurent', '(01) 555-CACAO', 'info@chocolatesdelrey.com', 'J-50192834-6', 'Calle Los Artesanos, Qta. Cacao, Los Teques', 'Crédito 15 días', 5.0, 'sparkles')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `contacto` = VALUES(`contacto`);

-- 6. Categorías de Productos
INSERT INTO `categorias_producto` (`id`, `nombre`, `descripcion`) VALUES
('cat_panaderia', 'Panadería Artesanal', 'Baguettes, brioches y panes de especialidad.'),
('cat_pasteleria', 'Pastelería & Éclairs', 'Éclairs, tartas de limón y milhojas.'),
('cat_cafeteria', 'Cafetería & Bebidas', 'Café espresso, cappuccino y jugos.'),
('cat_especialidades', 'Especialidades & Desayunos', 'Croque-Monsieur, quiches y productos salados del POS.')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`);

-- 7. Materias Primas e Insumos
INSERT INTO `materias_primas` (`id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `ubicacion`, `icono`, `descripcion`, `proveedor_id`) VALUES
('inv_001', 'MAT-001', 'Harina de Trigo Tradicional T55', 'kg', 18.00, 50.00, 1.80, 'Almacén Principal A-1', 'wheat', 'Harina refinada para panadería francesa.', 'sup_01'),
('inv_002', 'MAT-002', 'Mantequilla de Normandía 84% M.G.', 'kg', 12.50, 30.00, 8.50, 'Cámara Frigorífica B-2', 'milk', 'Mantequilla de alta grasa para hojaldres.', 'sup_02'),
('inv_003', 'MAT-003', 'Levadura Madre Activa Tostada', 'kg', 8.00, 15.00, 4.20, 'Refrigerador Insumos', 'package', 'Masa madre natural fermentada.', 'sup_01'),
('inv_004', 'MAT-004', 'Chocolate Belga 60% Cacao', 'kg', 42.00, 20.00, 12.00, 'Almacén Seco A-3', 'package', 'Cobertura de cacao belga de origen.', 'sup_04'),
('inv_005', 'MAT-005', 'Azúcar Refinada Extra Fina', 'kg', 45.00, 20.00, 1.50, 'Almacén Seco A-2', 'package', 'Azúcar refinada cristalina para masas leudadas y pastelería fina.', 'sup_01'),
('inv_006', 'MAT-006', 'Sal Marina de Araya / Sal Refinada', 'kg', 30.00, 10.00, 0.80, 'Almacén Seco A-4', 'package', 'Sal marina purificada para control de fermentación y sabor en panadería.', 'sup_01')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `stock_actual` = VALUES(`stock_actual`), `costo_unitario` = VALUES(`costo_unitario`);

-- 8. Catálogo Completo de Productos de Venta POS (Productos 001 al 020)
INSERT INTO `productos` (`id`, `categoria_id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `precio_unitario`, `tipo`, `ubicacion`, `icono`, `descripcion`) VALUES
('prod_001', 'cat_panaderia', 'PAN-001', 'Baguette Tradicional Parisina', 'ud', 43.00, 20.00, 2.50, 'finished_product', 'Mostrador Panadería', '🥖', 'Corteza crujiente y miga alveolada.'),
('prod_002', 'cat_panaderia', 'PAN-002', 'Croissant de Mantequilla', 'ud', 60.00, 25.00, 3.00, 'finished_product', 'Vitrinas POS', '🥐', 'Hojaldre 100% mantequilla de Normandía.'),
('prod_003', 'cat_panaderia', 'PAN-003', 'Pain au Chocolat', 'ud', 35.00, 15.00, 3.50, 'finished_product', 'Vitrinas POS', '🍫', 'Hojaldre relleno de dos barras de chocolate negro 60%.'),
('prod_004', 'cat_panaderia', 'PAN-004', 'Brioche de Vainilla', 'ud', 20.00, 10.00, 4.20, 'finished_product', 'Vitrinas POS', '🍞', 'Pan de huevo esponjoso aromatizado con vainilla.'),
('prod_005', 'cat_panaderia', 'PAN-005', 'Focaccia de Romero y Aceitunas', 'ud', 15.00, 8.00, 5.50, 'finished_product', 'Vitrinas POS', '🫓', 'Pan plano italiano horneado con aceite de oliva extra virgen.'),
('prod_006', 'cat_pasteleria', 'PAS-001', 'Éclair de Chocolate Belga', 'ud', 25.00, 15.00, 4.50, 'finished_product', 'Vitrinas Refrigeradas Pastelería', '⚡', 'Pasta choux rellena de crema pastelera.'),
('prod_007', 'cat_pasteleria', 'PAS-002', 'Tarta de Limón Merengada', 'ud', 18.00, 10.00, 5.00, 'finished_product', 'Vitrinas Refrigeradas', '🍋', 'Tarta de limón con merengue tostado.'),
('prod_008', 'cat_pasteleria', 'PAS-003', 'Caja de Macarons Surtidos (6 ud)', 'ud', 30.00, 12.00, 9.50, 'finished_product', 'Vitrinas Refrigeradas', '🍡', 'Selección de macarons surtidos.'),
('prod_009', 'cat_pasteleria', 'PAS-004', 'Milhojas Tradicional de Crema', 'ud', 14.00, 8.00, 4.80, 'finished_product', 'Vitrinas Refrigeradas', '🍰', 'Capas de hojaldre con crema pastelera.'),
('prod_010', 'cat_cafeteria', 'BEB-001', 'Café Espresso Doble', 'ud', 100.00, 30.00, 2.80, 'finished_product', 'Barra de Café', '☕', 'Café espresso doble de tueste medio.'),
('prod_011', 'cat_cafeteria', 'BEB-002', 'Capuchino Cremoso', 'ud', 80.00, 25.00, 3.80, 'finished_product', 'Barra de Café', '🥛', 'Espresso con leche vaporizada y espuma.'),
('prod_012', 'cat_cafeteria', 'BEB-003', 'Café au Lait Parisien', 'ud', 90.00, 25.00, 3.50, 'finished_product', 'Barra de Café', '☕', 'Café de filtro con leche caliente.'),
('prod_013', 'cat_cafeteria', 'BEB-004', 'Jugo de Naranja Recién Exprimido', 'l', 40.00, 15.00, 4.00, 'finished_product', 'Barra de Café', '🍊', 'Jugo natural de naranja.'),
('prod_014', 'cat_especialidades', 'ESP-001', 'Croque-Monsieur Tradicional', 'ud', 22.00, 8.00, 7.50, 'finished_product', 'Cocina / Mostrador', '🥪', 'Sándwich caliente de jamón y queso.'),
('prod_015', 'cat_especialidades', 'ESP-002', 'Quiche Lorraine de Bacon', 'ud', 16.00, 8.00, 6.80, 'finished_product', 'Cocina / Mostrador', '🥧', 'Quiche salada con bacon y queso.'),
('prod_016', 'cat_panaderia', 'PAN-006', 'Pan Canilla Tradicional', 'ud', 50.00, 20.00, 1.50, 'finished_product', 'Mostrador Panadería', '🥖', 'Pan canilla clásico de corteza fina y miga ligera y suave.'),
('prod_017', 'cat_panaderia', 'PAN-007', 'Pan de Jamón Navideño Especial', 'ud', 15.00, 5.00, 12.00, 'finished_product', 'Vitrinas Especiales', '🥖', 'Pan relleno con jamón ahumado selecto, tocineta, pasas y aceitunas rellenas.'),
('prod_018', 'cat_panaderia', 'PAN-008', 'Pan Gallego Rústico', 'ud', 20.00, 10.00, 3.50, 'finished_product', 'Mostrador Panadería', '🍞', 'Hogaza de alta hidratación con harina de trigo y masa madre rústica.'),
('prod_019', 'cat_panaderia', 'PAN-009', 'Pan Campestre Integral Multigrano', 'ud', 18.00, 10.00, 3.80, 'finished_product', 'Mostrador Panadería', '🥖', 'Pan de harina integral con mezcla de semillas de chía, lino y sésamo tostado.'),
('prod_020', 'cat_panaderia', 'PAN-010', 'Ciabatta Italiana Rústica', 'ud', 25.00, 12.00, 2.80, 'finished_product', 'Mostrador Panadería', '🫓', 'Pan plano de miga abierta con aceite de oliva extra virgen prensado en frío.')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `stock_actual` = VALUES(`stock_actual`), `precio_unitario` = VALUES(`precio_unitario`);

-- 9. Órdenes de Compra
INSERT INTO `ordenes_compra` (`id`, `codigo`, `proveedor_id`, `fecha_pedido`, `fecha_entrega`, `estado`, `monto_total`) VALUES
('po_001', 'OC-2026-0089', 'sup_01', '2026-08-10', '2026-08-12', 'in_transit', 1800.00),
('po_002', 'OC-2026-0090', 'sup_02', '2026-08-11', '2026-08-11', 'in_transit', 1700.00),
('po_003', 'OC-2026-0088', 'sup_04', '2026-08-05', '2026-08-07', 'received', 600.00)
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`), `monto_total` = VALUES(`monto_total`);

-- 10. Detalle de Órdenes de Compra
INSERT INTO `ordenes_compra_detalle` (`orden_id`, `materia_prima_id`, `cantidad`, `precio`) VALUES
('po_001', 'inv_001', 1000.00, 1.80),
('po_002', 'inv_002', 200.00, 8.50),
('po_003', 'inv_004', 50.00, 12.00)
ON DUPLICATE KEY UPDATE `cantidad` = VALUES(`cantidad`), `precio` = VALUES(`precio`);

-- 11. Plan Único de Cuentas (PUC)
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
('6135', 'Costo de Ventas Producción', 'Costo', 'Deudor')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 12. Asientos Contables y Detalle
INSERT INTO `asientos_contables` (`id`, `codigo`, `fecha_hora`, `concepto`, `modulo_origen`, `icono`, `total_debe`, `total_haber`) VALUES
('as_001', 'AS-2026-001', '2026-08-11 16:42:00', 'Venta POS Mostrador (Comprobante FAC-2026-1003)', 'Punto de Venta (POS)', 'shopping-cart', 1485.50, 1485.50)
ON DUPLICATE KEY UPDATE `concepto` = VALUES(`concepto`), `total_debe` = VALUES(`total_debe`);

INSERT INTO `asientos_detalle` (`asiento_id`, `cuenta_codigo`, `debe`, `haber`) VALUES
('as_001', '1105', 1485.50, 0.00),
('as_001', '4135', 0.00, 1280.60),
('as_001', '2408', 0.00, 204.90)
ON DUPLICATE KEY UPDATE `debe` = VALUES(`debe`), `haber` = VALUES(`haber`);

-- 13. Lotes de Producción y Monitoreo de Hornos
INSERT INTO `lotes_produccion` (`id`, `codigo`, `producto`, `icono`, `cantidad`, `estado_leudado`, `temperatura_recomendada`, `tiempo_recomendado_min`) VALUES
('batch_042', 'Lote #042', 'Baguette Tradicional Parisina', '🥖', 50, 'En Horneado Activo', 220, 20),
('batch_043', 'Lote #043', 'Croissant de Mantequilla', '🥐', 60, 'En Horneado Activo', 190, 15),
('batch_044', 'Lote #044', 'Focaccia de Romero y Aceitunas', '🫓', 20, 'Horneado Listo', 240, 25)
ON DUPLICATE KEY UPDATE `estado_leudado` = VALUES(`estado_leudado`);

INSERT INTO `estado_hornos` (`id`, `nombre`, `tipo`, `temperatura_actual`, `temperatura_objetivo`, `tiempo_restante`, `tiempo_total`, `estado`, `lote_id`) VALUES
('oven_01', 'Horno 1 (Giratorio A)', 'Giratorio Industrial', 220, 220, 255, 1200, 'baking', 'batch_042'),
('oven_02', 'Horno 2 (Convección B)', 'Convección Fina', 190, 190, 760, 900, 'baking', 'batch_043'),
('oven_03', 'Horno 3 (Piedra C)', 'Bóveda de Piedra', 240, 240, 0, 1500, 'ready', 'batch_044'),
('oven_04', 'Horno 4 (Pastelero D)', 'Convección Digital', 160, 175, 0, 0, 'preheating', NULL)
ON DUPLICATE KEY UPDATE `temperatura_actual` = VALUES(`temperatura_actual`), `estado` = VALUES(`estado`);

-- 14. Comandas de Cocina
INSERT INTO `comandas_cocina` (`id`, `numero_factura`, `detalles_pedido`, `estado_preparacion`, `fecha_hora`) VALUES
('com_1002', 'FAC-2026-1002', '2x Croissant de Mantequilla, 1x Pain au Chocolat', 'in_progress', '2026-08-22 15:50:00'),
('com_1003', 'FAC-2026-1003', '2x Croque-Monsieur Tradicional, 2x Café au Lait Parisien', 'pending', '2026-08-22 15:53:00')
ON DUPLICATE KEY UPDATE `estado_preparacion` = VALUES(`estado_preparacion`);

-- Finalizar transacción y restaurar verificaciones
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
