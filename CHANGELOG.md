# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.8.1] - 2026-08-11 (Corrección Crítica de Importación de Módulos y Resguardo 100% Garantizado de Productos y Tasa BCV)

### 🛠️ Corregido (Fixed)
- **Corrección de la Importación de Módulos ES6 ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Corrección de la ruta de importación de `CATEGORIES` y `PRODUCTS_DATABASE` de `../data/mock-products.js` (archivo inexistente) a `../data/products-db.js`.
  - La falla previa impedía la ejecución del script JS en el navegador, provocando que los productos y la tasa BCV no se mostraran en pantalla.
- **Resguardo 100% Garantizado de Catálogo y Tasa BCV**:
  - Incorporación de bloques `try/catch` con resguardo automático al catálogo de productos (`PRODUCTS_DATABASE`) y tasa oficial por defecto (`761.21 VES/USD`) si la conexión con MySQL o la API es lenta o está offline.

---

## [2.8.0] - 2026-08-11 (Optimización UX POS: Carga Automática de Productos y Cuadrícula Táctil Amplia Sin Buscador)

### 🚀 Añadido (Added)
- **Carga Automática Instantánea de Productos ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Al abrir la pantalla del POS (`DOMContentLoaded`), se realiza automáticamente la consulta a MySQL (`api/get_products.php`) y se despliegan **todos los productos de la tienda** por defecto (`currentCategory = 'todos'`) sin requerir acciones o búsquedas por parte del cajero.
- **Cuadrícula Táctil Amplia ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Rejilla CSS Grid táctil con tarjetas de productos de dimensiones amplias (mínimo 140px x 125px) que muestran el icono, título y precio en USD con toque directo para agregar al carrito.

### 🛠️ Corregido (Fixed)
- **Eliminación del Buscador ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))**:
  - Remoción completa del campo de texto de búsqueda (`searchInput`). Operación en caja 100% táctil e inmediata.

---

## [2.7.0] - 2026-08-11 (Experiencia UX POS: Asistente por Pasos Wizard y Reinicio Automático resetPOS)

### 🚀 Añadido (Added)
- **Flujo Estricto de Asistente por Pasos (Wizard UX) ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - **Paso 1 (Armar Pedido)**: Integración del panel lateral de carrito donde cada ítem cuenta con botones táctiles interactivos `[+]` y `[-]` para ajustar cantidades o eliminar productos. Botón principal: **"Siguiente / Proceder al Pago →"**.
  - **Paso 2 (Caja / Cobro)**: Módulo de cobranza bimoneda (Dólares $ USD y Bolívares Bs. VES via API BCV en vivo), métodos de pago (Efectivo/Tarjeta/Pago Móvil), vuelto y botón de cancelación **"Empezar de cero / Cancelar"** que invoca `resetPOS()`.
  - **Paso 3 (Finalización y Reinicio Automático `resetPOS()`)**: Integración de la función `resetPOS()` que vacía automáticamente el carrito, reinicia el correlativo de orden `FAC-2026-XXXX`, limpia los campos de pago y devuelve la pantalla al Paso 1 tras finalizar/imprimir la venta.

---

## [2.6.0] - 2026-08-11 (Rediseño POS en Flujo de 2 Pasos y API Dinámica BCV cURL)

### 🚀 Añadido (Added)
- **Rediseño del POS en Flujo de 2 Pasos ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - **Paso 1 (Vista Catálogo)**: Interfaz a pantalla completa exclusiva para la búsqueda, filtrado por categorías y selección de productos con barra inferior sticky de resumen y botón de avance **"Proceder al Pago / Cobrar →"**.
  - **Paso 2 (Vista de Cobro / Caja)**: Pantalla independiente dedicada a la cobranza, con tabla editable de la orden, desglose de subtotal, descuento, alícuotas de IVA (16%), totales resaltados en USD ($) y Bolívares (Bs. VES), selector de medios de pago, calculadora de vuelto y botón de **"← Volver al Catálogo"**.
- **Servicio API Dinámico en Vivo via cURL ([api/bcv_rate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcv_rate.php) y [api/bcmrate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcmrate.php))**:
  - Reescritura del servicio PHP eliminando valores duros en el flujo automático e implementando peticiones cURL a `https://ve.dolarapi.com/v1/dolares/oficial` para extraer la propiedad `promedio` en tiempo real.
  - Creación del alias directo `api/bcmrate.php`.

### 🛠️ Corregido (Fixed)
- **Eliminación Total de Colapsos CSS al 100% de Zoom**:
  - Supresión del esquema de 2 columnas sobrecargadas en una misma vista. Los Pasos 1 y 2 se alternan mediante transiciones limpias `pos-step-view active` garantizando encaje perfecto a cualquier resolución.

---

## [2.5.1] - 2026-08-11 (Corrección Crítica de Cálculo Multimoneda VES y Optimización de Layout POS a 100% Zoom)

### 🛠️ Corregido (Fixed)
- **Corrección Crítica en la Fórmula de Conversión a Bolívares ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js) y [api/bcv_rate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcv_rate.php))**:
  - Corrección de la variable de tasa base por defecto en `pos.js` y `bcv_rate.php` de `36.50` a `761.21` VES/USD.
  - Verificación matemática estricta: `Total en Dólares ($) * Tasa BCV Vigente (761.21)`. Un carrito de $109.39 calcula de forma precisa `Bs. 83.268,76` en lugar del valor obsoleto anterior (`Bs. 3.992,66`).
  - Validación de seguridad que impide utilizar tasas menores a 100 VES/USD.
- **Optimización de Layout y Zoom Responsivo 100% ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Rediseño de proporciones y paddings de cabeceras, buscadores y tarjetas de productos para encajar perfectamente a una resolución normal (100% de zoom de navegador) sin desbordamientos verticales u horizontales.
  - Ancho ajustado a `380px` en la barra lateral del carrito y tarjetas de producto de `175px` para desplegar entre 3 y 5 productos por fila manteniendo la usabilidad táctil de botones (mínimo 44-48px).
- **Desglose Visual de Totales Prominente ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))**:
  - Resaltado visual en tipografía de alto contraste del total a cobrar tanto en USD (`$`) como en su equivalente exacto en Bolívares (`Bs.`).

---

## [2.5.0] - 2026-08-11 (Gestión Maestra de Tasa BCV: Modos Auto/Manual, Validación de Seguridad y Persistencia MySQL)

### 🚀 Añadido (Added)
- **Persistencia de Tasa Maestra en MySQL ([database/database.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/database.sql))**:
  - Incorporación de la tabla relacional `configuraciones` con semillas para `bcv_rate_mode` (`auto` / `manual`) y `bcv_manual_rate` (`761.21`).
- **Endpoint de Guardado de Preferencias ([api/save_bcv_settings.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/save_bcv_settings.php))**:
  - API PHP POST para guardar los modos de tasa y valores manuales ingresados por la administración con soporte `ON DUPLICATE KEY UPDATE`.
- **Módulo 9: Panel de Gestión Maestra de Tasa BCV ([modules/settings.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/settings.html) y [js/modules/settings.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/settings.js))**:
  - Incorporación de un conmutador (Toggle Switch) entre *Modo Automático (API BCV)* y *Modo Manual*, con habilitación dinámica de campo de tasa manual y guardado persistente.
- **Botón de Actualización Forzada en Dashboard ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Botón *🔄 Actualizar Tasa* que ejecuta peticiones a la API con parámetro anti-caché (`cache: 'no-store'`) y muestra alertas de confirmación al usuario.
- **Etiquetas de Origen y Distintivos Visuales (POS y Dashboard)**:
  - Notificación visual clara en la cabecera del POS y tarjetas del Dashboard indicando si la tasa proviene de `● Tasa: Automática` o `● Tasa: Manual (Editada)`.

### 🛠️ Corregido (Fixed)
- **Validación de Seguridad y Lógica de Tasa Maestra ([api/bcv_rate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcv_rate.php))**:
  - Implementación de la validación estricta de seguridad: si la tasa devuelta por la API es menor a 100, se rechaza inmediatamente por ser un valor anómalo/erróneo, cayendo en el valor de resguardo/manual configurado.
  - Supresión absoluta de peticiones a la API externa cuando el modo se encuentra en *Manual*.

---

## [2.4.0] - 2026-08-11 (Corrección de Layout POS y Funcionalidad Multimoneda Dólar / Bolívares BCV)

### 🚀 Añadido (Added)
- **Servicio API de Tasa de Cambio BCV ([api/bcv_rate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcv_rate.php))**:
  - Endpoint backend PHP que obtiene la tasa oficial en vivo del Banco Central de Venezuela (BCV) en formato JSON, incorporando fallback de resguardo automático ante desconexiones.
- **Tarjeta KPI en Dashboard Gerencial ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Incorporación de una nueva tarjeta KPI en el Dashboard (`🇻🇪 Tasa Oficial BCV`) para visualización inmediata de la tasa de cambio del día.
- **Desglose Multimoneda en Carrito, Modal y Ticket ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Indicador dinámico de tasa BCV en la barra superior del POS (`🇻🇪 Tasa BCV: Bs. XX.XX`).
  - Cálculo simultáneo del total a pagar en **Dólares ($ USD)** y su equivalente en **Bolívares (Bs. VES)** en el resumen del carrito, modal de cobro y ticket de venta impreso.

### 🛠️ Corregido (Fixed)
- **Ajuste Estricto de Layout en Dos Columnas ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Corrección de la cuadrícula CSS (`grid-template-columns: 1fr 420px; height: 100vh; overflow: hidden;`), separando de forma fija el área de catálogo scrollable a la izquierda/centro y la barra lateral de facturación a la derecha.

---

## [2.3.1] - 2026-08-11 (Corrección de Bugs Críticos en Modal de Pagos, Reset POS e Impresión de Ticket)

### 🛠️ Corregido (Fixed)
- **Bug de Superposición y Navegación de Métodos de Pago ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación del panel de información para tarjeta y transferencia (`cardTransferPanel`) e integración de un botón táctil de cancelación explícito (`← Volver`) en el footer del modal de pago.
  - Corrección de la lógica de conmutación de métodos de pago (`switchPaymentMethod`), garantizando que la vista del carrito y el catálogo no colapsen y permitiendo cancelar o volver en todo momento.
- **Bug de Reinicio y Función resetPOS() ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Implementación de la función centralizada `resetPOS()` activada mediante los botones *Nueva Venta*, *Vaciar Carrito* y al cerrar la confirmación del ticket.
  - Limpieza completa del estado: vaciado de carrito, restablecimiento de totales a cero, reseteo de descuentos, reseteo del método de pago a efectivo, incremento secuencial de correlativo de factura y actualización limpia de la UI.
- **Corrección de SyntaxError de JS ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Eliminación de la re-declaración duplicada de la constante `closePaymentModalBtn` en la línea 298, resolviendo el error `Uncaught SyntaxError: Identifier 'closePaymentModalBtn' has already been declared` y permitiendo la ejecución limpia de la lógica de frontend.

---

## [2.3.0] - 2026-08-11 (Procesamiento y Persistencia de Ventas POS en MySQL)

### 🚀 Añadido (Added)
- **Tablas Relacionales de Ventas ([database/database.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/database.sql))**:
  - Definición completa de las tablas `ventas`, `ventas_detalle` y `detalles_venta` con llaves foráneas y tipos de datos para subtotal, IVA (16%), descuentos, total, método de pago, monto pagado y vuelto.
- **API Endpoint de Procesamiento de Ventas ([api/pos/procesar_venta.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/pos/procesar_venta.php))**:
  - Endpoint PHP que procesa peticiones JSON POST desde el frontend, ejecuta transacciones atómicas `beginTransaction()`, inserta el encabezado en `ventas` y los renglones en `ventas_detalle` / `detalles_venta`, descuenta automáticamente el stock en `productos` y genera el asiento contable por partida doble en `asientos_contables` y `asientos_detalle`.
- **Integración Asíncrona y Confirmación Visual ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Modificación del botón *Facturar / Completar Venta* para enviar los datos del pedido a la API PHP mediante `fetch('../api/pos/procesar_venta.php')`.
  - Incorporación de banner corporativo de confirmación de registro exitoso en MySQL (`✓ REGISTRADO Y CONTABILIZADO EN MYSQL`) dentro del comprobante digital generado.

---

## [2.2.0] - 2026-08-11 (Integración del Punto de Venta POS con Base de Datos MySQL)

### 🚀 Añadido (Added)
- **Sentencias SQL de Datos Semilla POS ([database/database.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/database.sql) y [database/seed_data.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/seed_data.sql))**:
  - Incorporación de campos `icono` y `descripcion` en el esquema relacional de la tabla `productos`.
  - Sentencias de inserción `INSERT INTO` para poblar 15 ítems del catálogo de productos terminados en `productos` y sus correspondientes categorías en `categorias_producto` (*Panadería Artesanal, Pastelería & Repostería, Cafetería & Bebidas, Especialidades & Desayunos*).
- **API Endpoint de Productos PHP ([api/pos/get_products.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/pos/get_products.php))**:
  - Endpoint PHP que ejecuta consultas preparadas PDO `JOIN` entre `productos` y `categorias_producto`, estructurando la lista completa de ítems para el Punto de Venta en formato JSON.
- **Integración Asíncrona en Frontend POS ([js/data/products-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/products-db.js) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Implementación de `getProductsCatalogAsync()` en `ProductsStore` para obtener productos y categorías dinámicamente mediante `fetch('../api/pos/get_products.php')` con fallback automático a datos estáticos locales.
  - Preservación del 100% de la usabilidad, migas de pan y botones táctiles de 48px en la vista [modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html).

---

## [2.1.0] - 2026-08-11 (Módulo 9: Configuraciones Generales y Ajustes del Sistema)

### 🚀 Añadido (Added)
- **Interfaz de Configuraciones Generales ([modules/settings.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/settings.html))**:
  - Migas de pan integradas: `🏠 Inicio (Panel Central) / Configuraciones / Ajustes del Sistema`.
  - Formularios estructurados para **Datos Generales de la Empresa** (Razón social, RIF/NIT, nombre comercial, dirección, contacto, moneda principal y tasa de cambio).
  - Sección de **Parámetros Fiscales e Impuestos** (Alícuota IVA 16%, exención de impuestos en línea de panadería artesanal básica, registro SENIAT, correlativos de facturación y formato de comprobante).
  - Panel de **Preferencias del Sistema** (Modo de persistencia MySQL PDO, respaldos automáticos, alertas de stock mínimo y tema visual).
  - **Zona de Peligro (Danger Zone)** con tarjetas de alta prominencia visual para purgar caché de sesiones, recargar datos semilla e interactivo de reseteo total con confirmación por PIN de Administrador.
- **Estilos CSS3 de Configuraciones ([css/modules/settings.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/settings.css))**:
  - Paleta artesanal corporativa, interruptores de conmutación táctil (*toggle switches*), botones táctiles amplios (mínimo 48x48px) y notificaciones emergentes *toast*.
- **Base de Datos y Controlador ES6 ([js/data/settings-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/settings-db.js) y [js/modules/settings.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/settings.js))**:
  - Carga asíncrona de valores, persistencia en `localStorage`, exportación de archivo de configuración en formato JSON y validación de seguridad por PIN para el formateo del sistema.

---

## [2.0.2] - 2026-08-11 (Corrección de Rutas Relativas e Integración de Vista PHP)

### 🛠️ Corregido (Fixed)
- **Vista de Autenticación PHP ([index.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/index.php))**:
  - Corrección de las rutas relativas en las etiquetas `<link>` para importar `css/main.css` y `css/modules/auth.css`, restaurando el diseño visual corporativo.
  - Corrección de la ruta relativas en la etiqueta `<script>` para apuntar correctamente a `js/modules/auth.js`.
- **Lógica e Interactividad Frontend ([js/modules/auth.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/auth.js) y [index.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/index.html))**:
  - Resiliencia en el enlace de eventos DOM para la selección de perfil de usuario y apertura del modal de PIN.
  - Sincronización de clases y soporte para el teclado numérico táctil (`keypad-btn` / `key-btn`, `backspace` / `delete`).
  - Preservación exacta de la estructura HTML original de las tarjetas de perfil.

---

## [2.0.1] - 2026-08-11 (Poblado de Base de Datos MySQL y Endpoint de Perfiles PHP)

### 🚀 Añadido (Added)
- **Script SQL de Datos Semilla ([database/seed_data.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/seed_data.sql))**:
  - Sentencias de inserción `INSERT INTO` para poblar la base de datos relacional MySQL `la_nueva_parisienne`.
  - Inserción de perfiles de empleados: **Carlos Mendoza** (*Maestro Panadero*), **Ana Ramírez** (*Personal de Caja*), junto con Juan (*Gerente*), Enrique (*Chef*), Henry (*Cajero*) y Sebastian (*Contador*), todos con PIN de acceso unificado `1234`.
  - Inserción de catálogo de insumos, productos de panadería, proveedores homologados, órdenes de compra y plan de cuentas PUC.
- **API Endpoint de Consulta de Perfiles ([api/auth/get_profiles.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/auth/get_profiles.php))**:
  - Endpoint PHP que consulta la tabla `usuarios` mediante PDO `JOIN roles` y devuelve un objeto JSON estructurado con la lista de usuarios activos para la pantalla de inicio.
- **Integración Asíncrona en Frontend ([js/core/session-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/session-store.js) y [js/modules/auth.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/auth.js))**:
  - Implementación de `getProfilesAsync()` en `SessionStore` para renderizar dinámicamente las tarjetas de usuario desde MySQL con fallback resiliente.

---

## [2.0.0] - 2026-08-11 (Migración Arquitectónica a PHP & Base de Datos MySQL)

### 🚀 Añadido (Added)
- **Script SQL de Base de Datos Relacional ([database/database.sql](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/database/database.sql))**:
  - Estructura completa de tablas en motor **InnoDB** con codificación `utf8mb4_unicode_ci` y llaves foráneas (*usuarios, roles, productos, categorias_producto, proveedores, ordenes_compra, ventas, ventas_detalle, plan_cuentas, asientos_contables, asientos_detalle*).
  - Carga inicial de datos de semilla (*Seed Data*) para usuarios (todos con PIN `1234`), catálogo de productos, proveedores y cuentas PUC.
- **Configuración de Conexión PHP PDO ([api/config/conexion.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/config/conexion.php))**:
  - Conexión relacional segura utilizando la extensión **PDO** con manejo de excepciones `ERRMODE_EXCEPTION`, consultas preparadas y charset `utf8mb4`.
- **API Endpoint de Autenticación ([api/auth/login.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/auth/login.php))**:
  - Servicio API en PHP que procesa peticiones JSON POST desde el frontend, consulta directamente la tabla `usuarios` en MySQL mediante sentencia preparada y valida el PIN de 4 dígitos, respondiendo con tokens de sesión en JSON.
- **Integración Asíncrona Resiliente ([js/core/session-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/session-store.js) y [js/modules/auth.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/auth.js))**:
  - Implementación de `validatePinAsync()` mediante `fetch()` apuntando a la API PHP, manteniendo un fallback transparente en caso de despliegue en servidor web estático.

---

## [1.8.0] - 2026-08-11 (Módulo 8: Gestión de Personal y Permisos por Rol)

### 🚀 Añadido (Added)
- **Base de Datos de Personal y Matriz de Permisos ([js/data/staff-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/staff-db.js))**:
  - Nómina activa con mock data para los perfiles de **Carlos Mendoza** (*Maestro Panadero / Chef*), **Ana Ramírez** (*Personal de Caja / POS*), junto con Juan (*Gerente General*), Enrique (*Chef*), Henry (*Cajero*) y Sebastian (*Contador*).
  - Matriz de permisos por rol (*ADMIN, BAKER, CASHIER*) cubriendo acceso a POS, KDS, Inventario, Compras, Contabilidad y RRHH.
- **Interfaz de Personal en HTML5 Estricto ([modules/staff.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/staff.html))**:
  - Migas de pan integradas: `🏠 Inicio (Panel Central) / Personal / Empleados y Permisos`.
  - Fila de KPIs de personal (Total empleados, Roles configurados, Personal en servicio y Estado de seguridad).
  - Tabla semántica de nómina de empleados con botones táctiles de 48x48px (`✏️ Editar`, `🔑 PIN`).
  - Matriz interactiva de permisos por rol mediante switches conmutadores táctiles.
- **Estilos CSS3 e Interactividad ES6 ([css/modules/staff.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/staff.css) y [js/modules/staff.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/staff.js))**:
  - Modales flotantes para el registro de nuevos trabajadores y reasignación de claves táctiles PIN (4 dígitos).

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