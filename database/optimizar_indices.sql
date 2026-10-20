-- ============================================================================
-- LA NUEVA PARISIENNE - MIGRACIÓN DE OPTIMIZACIÓN DE ÍNDICES SQL
-- Acelera consultas de reportes, arqueos, comandas KDS, inventario y contabilidad
-- ============================================================================

USE `la_nueva_parisienne`;

-- 1. Optimización de Ventas y POS
ALTER TABLE `ventas` 
  ADD INDEX IF NOT EXISTS `idx_ventas_fecha` (`fecha_hora`),
  ADD INDEX IF NOT EXISTS `idx_ventas_metodo` (`metodo_pago`),
  ADD INDEX IF NOT EXISTS `idx_ventas_fecha_total` (`fecha_hora`, `total`);

ALTER TABLE `ventas_detalle` 
  ADD INDEX IF NOT EXISTS `idx_ventas_detalle_venta` (`venta_id`),
  ADD INDEX IF NOT EXISTS `idx_ventas_detalle_producto` (`producto_id`);

-- 2. Optimización de Cocina, Hornos y Comandas KDS
ALTER TABLE `comandas_cocina` 
  ADD INDEX IF NOT EXISTS `idx_comandas_estado` (`estado_preparacion`),
  ADD INDEX IF NOT EXISTS `idx_comandas_fecha` (`fecha_hora`);

ALTER TABLE `lotes_produccion` 
  ADD INDEX IF NOT EXISTS `idx_lotes_estado` (`estado_leudado`),
  ADD INDEX IF NOT EXISTS `idx_lotes_producto` (`codigo_producto`);

ALTER TABLE `estado_hornos` 
  ADD INDEX IF NOT EXISTS `idx_hornos_estado` (`estado`);

-- 3. Optimización de Contabilidad y Asientos
ALTER TABLE `asientos_contables` 
  ADD INDEX IF NOT EXISTS `idx_asientos_fecha` (`fecha_hora`),
  ADD INDEX IF NOT EXISTS `idx_asientos_modulo` (`modulo_origen`);

ALTER TABLE `asientos_detalle` 
  ADD INDEX IF NOT EXISTS `idx_asientos_detalle_asiento` (`asiento_id`),
  ADD INDEX IF NOT EXISTS `idx_asientos_detalle_cuenta` (`cuenta_codigo`);

-- 4. Optimización de Compras y Proveedores
ALTER TABLE `ordenes_compra` 
  ADD INDEX IF NOT EXISTS `idx_ordenes_fecha` (`fecha_pedido`),
  ADD INDEX IF NOT EXISTS `idx_ordenes_estado` (`estado`);

ALTER TABLE `ordenes_compra_detalle` 
  ADD INDEX IF NOT EXISTS `idx_ordenes_detalle_orden` (`orden_id`);
