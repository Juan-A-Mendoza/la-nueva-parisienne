# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.7.0] - 2026-08-11 (Módulo 7: Contabilidad y Salud Financiera)

### 🚀 Añadido (Added)
- **Base de Datos Contable y Plan PUC ([js/data/accounting-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/accounting-db.js))**:
  - Plan Único de Cuentas (Caja General, Bancos, Inventario, Proveedores, IVA Débito, Ventas, Gastos y Costos).
  - Generación automática de comprobantes contables por partida doble (*Ventas POS, Compras de Insumos, Mermas de Almacén*).
  - Datos de comprobación para el Balance de Sumas y Saldos.
- **Interfaz Contable en HTML5 Estricto ([modules/accounting.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/accounting.html))**:
  - Migas de pan integradas: `🏠 Inicio (Panel Central) / Contabilidad / Salud Financiera`.
  - Tarjetas KPI financieras (Activos Circulantes, Ventas del Mes, Gastos/Costos y Estado del Balance).
  - Barra de pestañas estructurada (*Asientos Contables Automáticos*, *Libro Mayor Cuentas T*, *Balance de Comprobación*).
  - Barra de verificación matemática de partida doble (`✓ Total Debe = Total Haber: $24,850.70`).
- **Estilos CSS3 e Interactividad ES6 ([css/modules/accounting.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/accounting.css) y [js/modules/accounting.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/accounting.js))**:
  - Visualización analítica de comprobantes con débitos (verde) y créditos (terracota).
  - Rejilla interactiva de Cuentas T con saldos netos deudores/acreedores.
  - Modal flotante para el registro de asientos manuales de ajuste.

---

## [1.6.0] - 2026-08-11 (Módulo 6: Gestión de Proveedores)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Proveedores ([js/data/suppliers-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/suppliers-db.js))**:
  - Registro homologado de proveedores: *Molinos del Sur* (Harinas T55), *Lácteos La Granja* (Mantequilla Normandía 84%), *Empaques del Norte* (Bolsas y Cajas) y *Chocolates del Rey* (Cacao Belga).
  - Códigos de proveedor, RIF, condiciones de pago, datos de contacto comercial y calificación de servicio.
- **Interfaz de Proveedores y Órdenes en HTML5 Estricto ([modules/suppliers.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/suppliers.html))**:
  - Separación total de responsabilidades sin inline styles.
  - Migas de pan integradas: `🏠 Inicio (Panel Central) / Proveedores / Directorio`.
  - Directorio en rejilla de tarjetas interactivas de contacto con botones táctiles de 48x48px (`📞 Contactar`, `📝 Nueva Orden`).
  - Panel de Órdenes de Compra y Recepción con tabla semántica HTML5 y estados logísticos (`🚚 En Tránsito`, `✓ Recibido en Almacén`).
- **Estilos CSS3 de Proveedores ([css/modules/suppliers.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/suppliers.css))**:
  - Paleta artesanal anti-fatiga y tarjetas elevables (*hover lift*).
  - Modales flotantes para la emisión de Órdenes de Compra y homologación de nuevos proveedores.
- **Controlador Interactivo ES6 ([js/modules/suppliers.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/suppliers.js))**:
  - Lógica para confirmar recepciones en almacén (`✓ Confirmar Recepción`), pasando pedidos de *En Tránsito* a *Recibido* y recalculando métricas de compras.
  - Formulario modal de emisión de órdenes y adición de nuevos proveedores al directorio.

---

## [1.5.0] - 2026-08-11 (Módulo 5: Inventario y Control de Stock)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Inventario ([js/data/inventory-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/inventory-db.js))**:
  - Existencias de materias primas (*Harina T55, Mantequilla 84%, Levadura Madre, Chocolate Belga, Azúcar, Huevos*) y productos terminados.
  - Parámetros de existencias actuales, stock mínimo requerido, precios unitarios y ubicación en almacén.
- **Interfaz de Control de Stock en HTML5 Estricto ([modules/inventory.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/inventory.html))**:
  - Migas de pan integradas: `🏠 Inicio (Panel Central) / Inventario y Control de Stock`.
  - Fila de KPIs de existencias (Total ítems, Alertas de stock crítico, Valor total $ y Mermas mensuales $).
  - Barra de botones táctiles principales de 48x48px (`+ Realizar Ajuste Manual`, `⚠️ Registrar Merma de Almacén`).
  - Tabla semántica HTML5 con badges de estado dinámico (`🚨 Crítico`, `⚠️ Reabastecer`, `✓ Óptimo`).
- **Estilos CSS3 e Interactividad ES6 ([css/modules/inventory.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/inventory.css) y [js/modules/inventory.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/inventory.js))**:
  - Animaciones de pulso en rojo para insumos por debajo del mínimo.
  - Modales flotantes para procesar ajustes manuales (+/- stock) y registrar mermas de almacén por vencimiento/deterioro.

---

## [1.4.1] - 2026-08-11 (Ajustes Críticos de Usabilidad, Paleta Anti-Fatiga y Enrutamiento)

### 🛠️ Modificado y Corregido (Changed & Fixed)
- **Corrección del Enrutamiento en Migas de Pan (Breadcrumbs)**:
  - Se corrigió el enlace `🏠 Inicio (Panel Central)` en todas las vistas ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html), [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html)) para redirigir al dashboard principal (`dashboard.html`) manteniendo la sesión activa.
  - El cierre de sesión permanece atribuido exclusivamente al botón **"Cerrar Sesión"**.
- **Requerimiento No Funcional de Usabilidad Táctil (Touch-Friendly 48x48 px)**:
  - Ajuste global en [css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css) estableciendo `min-width: 48px` y `min-height: 48px` para todos los elementos interactivos principales (teclado numérico PIN, botones de categoría, controles de cantidad `-` `+`, botones de acción de hornos y filtros).
- **Identidad Visual Corporativa Anti-Fatiga**:
  - Paleta artesanal de la panadería: Crema Vainilla (`#FAF7F2`), Café Espresso (`#2C1D11`), Trigo Dorado (`#D49B54`), Terracota (`#C85A32`) y Mantequilla Suave (`#F5E6D3`).

---

## [1.4.0] - 2026-08-11 (Módulo 4: Dashboard Gerencial - MIS & Analítica)

### 🚀 Añadido (Added)
- **Base de Datos Analítica ([js/data/dashboard-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/dashboard-db.js))**:
  - Métricas KPI de ingresos totales ($4,850.00), órdenes (248), ticket promedio ($19.55) y margen de ganancia (38.5%).
  - Serie de tiempo para el gráfico de tendencia de ventas diarias comparadas con costos de producción.
- **Interfaz y Gráfico Chart.js ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Gráfico analítico interactivo usando **Chart.js** con gradientes transparentes.
  - Tabla semántica de auditoría y movimientos recientes con filtros dinámicos (*Todos*, *Solo Ventas*, *Solo Gastos*).

---

## [1.3.0] - 2026-08-11 (Módulo 2: Producción y Cocina - KDS & Hornos)

### 🚀 Añadido (Added)
- **Base de Datos y Estado de Cocina ([js/data/kitchen-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/kitchen-db.js))**:
  - Estado inicial de 4 hornos industriales (Giratorio, Convección Fina, Bóveda de Piedra, Convección Digital).
- **Interfaz KDS en HTML5 Estricto ([modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html))** y **Estilos CSS3 ([css/modules/kitchen.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/kitchen.css))**:
  - Dashboard de 3 columnas: Panel de Hornos Industriales, Cola de Comandas POS en tiempo real y Lotes Listos para Horno.
- **Controlador Interactivo ES6 ([js/modules/kitchen.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/kitchen.js))**:
  - Bucle de cuenta regresiva en vivo por segundo para temporizadores de hornos (`04:15`).
  - Alerta visual con destello dorado/verde al finalizar la cocción y flujo de comandas POS (*Pendiente* ➔ *En Preparación* ➔ *Listo para Entregar*).

---

## [1.2.0] - 2026-08-11 (Módulo 3: Punto de Venta - POS)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Productos ([js/data/products-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/products-db.js))**:
  - Catálogo de 15 productos en 4 categorías (*Panadería*, *Pastelería*, *Cafetería*, *Especialidades*).
- **Interfaz POS Split-Screen ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))** y **Controlador POS ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Carrito de compras con cálculo automático de IVA (16%), descuentos y modal de cobro.
  - Calculadora de vuelto en efectivo con botones rápidos ($5, $10, $20, $50, Exacto) y ticket impreso de panadería francesa.

---

## [1.0.0] - 2026-08-11 (Iteración Inicial - Módulo de Autenticación & Estructura Base)

> [!IMPORTANT]
> ### 🔑 CREDENCIALES DE ACCESO POR DEFECTO (TODOS CON PIN `1234`)
>
> | Nombre del Usuario | Rol en el Sistema | PIN de Acceso | Módulo Redirigido |
> | :--- | :--- | :---: | :--- |
> | **`Juan`** | **Gerente General** | 🔑 **`1234`** | [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) |
> | **`Enrique`** | **Chef de Cuisine / Maestro Panadero** | 🔑 **`1234`** | [modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html) |
> | **`Henry`** | **Cajero Principal (POS)** | 🔑 **`1234`** | [modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) |
> | **`Sebastian`** | **Contador & Administrador** | 🔑 **`1234`** | [modules/accounting.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/accounting.html) |

### 🚀 Añadido (Added)
- **Estructura del Proyecto Visual Studio**: Archivo de solución `.NET Web / Static Web` ([LaNuevaParisienne.csproj](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/LaNuevaParisienne.csproj)) listo para Visual Studio.
- **Sistema de Diseño Base**: Variables globales en [css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css) con fuentes Google Fonts (*Playfair Display* y *Plus Jakarta Sans*).
- **Módulo 1: Autenticación por Perfil y PIN**: Estructura semántica en [index.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/index.html) con teclado numérico PIN táctil y servicio de sesión ([js/core/session-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/session-store.js)).