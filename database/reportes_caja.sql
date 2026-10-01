-- ============================================================================
-- REPORTES DE CAJA - MIGRACIÓN EXCLUSIVA DE REPORTES
-- No modifica ventas, cobros, turnos, inventario ni tablas operativas.
-- ============================================================================

USE `la_nueva_parisienne`;

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
  `monto_efectivo_esperado` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `facturas_emitidas` INT NOT NULL DEFAULT 0,
  `facturas_anuladas` INT NOT NULL DEFAULT 0,
  `cerrado_sin_ventas` TINYINT(1) NOT NULL DEFAULT 0,
  `mensaje_cierre` VARCHAR(255) NULL,
  `firma_cajero` VARCHAR(150) NULL,
  `firma_supervisor` VARCHAR(150) NULL,
  `generado_por` VARCHAR(50) NOT NULL,
  `generado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reportes_caja_cierre_turno` (`fecha_turno`, `caja_id`, `turno`),
  INDEX `idx_reportes_caja_cierres_fecha` (`fecha_turno`),
  INDEX `idx_reportes_caja_cierres_caja` (`caja_id`),
  INDEX `idx_reportes_caja_cierres_generado_por` (`generado_por`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
