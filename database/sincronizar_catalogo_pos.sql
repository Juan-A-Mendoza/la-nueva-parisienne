-- ============================================================================
-- SINCRONIZACIÓN DEL CATÁLOGO POS CON MYSQL
-- Agrega únicamente productos que faltaban en la base operativa.
-- No elimina ni reemplaza productos existentes.
-- ============================================================================

USE `la_nueva_parisienne`;

INSERT INTO `categorias_producto` (`id`, `nombre`, `descripcion`)
VALUES ('cat_especialidades', 'Especialidades & Desayunos', 'Croque-Monsieur, quiches y productos salados del POS.')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`);

INSERT INTO `productos`
  (`id`, `categoria_id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `precio_unitario`, `tipo`, `ubicacion`, `icono`, `descripcion`)
VALUES
  ('prod_003', 'cat_panaderia', 'PAN-003', 'Pain au Chocolat', 'ud', 35.00, 15.00, 3.50, 'finished_product', 'Vitrinas POS', '🍫', 'Hojaldre relleno de chocolate negro.'),
  ('prod_004', 'cat_panaderia', 'PAN-004', 'Brioche de Vainilla', 'ud', 20.00, 10.00, 4.20, 'finished_product', 'Vitrinas POS', '🍞', 'Pan de huevo esponjoso aromatizado con vainilla.'),
  ('prod_005', 'cat_panaderia', 'PAN-005', 'Focaccia de Romero y Aceitunas', 'ud', 15.00, 8.00, 5.50, 'finished_product', 'Vitrinas POS', '🫓', 'Pan plano italiano con romero y aceitunas.'),
  ('prod_007', 'cat_pasteleria', 'PAS-002', 'Tarta de Limón Merengada', 'ud', 18.00, 10.00, 5.00, 'finished_product', 'Vitrinas Refrigeradas', '🍋', 'Tarta de limón con merengue tostado.'),
  ('prod_008', 'cat_pasteleria', 'PAS-003', 'Caja de Macarons Surtidos (6 ud)', 'ud', 30.00, 12.00, 9.50, 'finished_product', 'Vitrinas Refrigeradas', '🍡', 'Selección de macarons surtidos.'),
  ('prod_009', 'cat_pasteleria', 'PAS-004', 'Milhojas Tradicional de Crema', 'ud', 14.00, 8.00, 4.80, 'finished_product', 'Vitrinas Refrigeradas', '🍰', 'Capas de hojaldre con crema pastelera.'),
  ('prod_010', 'cat_cafeteria', 'BEB-001', 'Café Espresso Doble', 'ud', 100.00, 30.00, 2.80, 'finished_product', 'Barra de Café', '☕', 'Café espresso doble de tueste medio.'),
  ('prod_011', 'cat_cafeteria', 'BEB-002', 'Capuchino Cremoso', 'ud', 80.00, 25.00, 3.80, 'finished_product', 'Barra de Café', '🥛', 'Espresso con leche vaporizada y espuma.'),
  ('prod_012', 'cat_cafeteria', 'BEB-003', 'Café au Lait Parisien', 'ud', 90.00, 25.00, 3.50, 'finished_product', 'Barra de Café', '☕', 'Café de filtro con leche caliente.'),
  ('prod_013', 'cat_cafeteria', 'BEB-004', 'Jugo de Naranja Recién Exprimido', 'l', 40.00, 15.00, 4.00, 'finished_product', 'Barra de Café', '🍊', 'Jugo natural de naranja.'),
  ('prod_014', 'cat_especialidades', 'ESP-001', 'Croque-Monsieur Tradicional', 'ud', 22.00, 8.00, 7.50, 'finished_product', 'Cocina / Mostrador', '🥪', 'Sándwich caliente de jamón y queso.'),
  ('prod_015', 'cat_especialidades', 'ESP-002', 'Quiche Lorraine de Bacon', 'ud', 16.00, 8.00, 6.80, 'finished_product', 'Cocina / Mostrador', '🥧', 'Quiche salada con bacon y queso.');
