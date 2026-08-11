# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.2.0] - 2026-08-11 (Módulo 3: Punto de Venta - POS)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Productos ([js/data/products-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/products-db.js))**:
  - Catálogo de 15 productos representativos divididos en 4 categorías principales: *Panadería Artesanal*, *Pastelería & Repostería*, *Cafetería & Bebidas* y *Especialidades*.
  - Códigos correlativos, precios unitarios ($), disponibilidad de stock y descripciones enriquecidas.

- **Interfaz POS Split-Screen en HTML5 Estricto ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))**:
  - Separación total de estilos sin inline styling.
  - Navbar superior con nombre de cajera activa (`Élodie Martin`), badge de caja abierta, indicador de turno y botón de cierre de sesión.
  - Panel izquierdo de catálogo con barra de búsqueda instantánea y pestañas filtrables por categoría.
  - Panel derecho de carrito de facturación con selección de tipo de orden (*Para Llevar* / *Consumo Local*), controles de cantidad (`-` `qty` `+`), subtotal por ítem y botón de vaciado.

- **Estilos CSS3 POS ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Maquetación responsiva con CSS Grid y Flexbox.
  - Tarjetas de producto interactivas con elevación al pasar el cursor (*hover lift*), indicadores de stock y badges dorados.
  - Diseño de carrito lateral compacto y modales flotantes con efecto *glassmorphism*.

- **Controlador Interactivo POS ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Cálculo automático en tiempo real de Subtotal, Descuentos parametrizables (Sin Descuento, 5%, 10%, Empleado 15%) y tasa fiscal IVA (16%).
  - Modal de Procesamiento de Cobro con selector de método de pago (*Efectivo*, *Tarjeta*, *Transferencia/QR*).
  - Calculadora de Vuelto para pagos en efectivo con botones de billetes rápidos ($5, $10, $20, $50, Exacto) y cálculo automático de cambio a entregar.
  - Modal de Comprobante / Ticket de Venta con formato tradicional de panadería francesa (*"Merci de votre visite"*), desglose detallado, opción de impresión (`window.print()`) y reseteo automático para la siguiente venta.

---

## [1.0.0] - 2026-08-11 (Iteración Inicial - Módulo de Autenticación & Estructura Base)

> [!IMPORTANT]
> ### 🔑 CREDENCIALES DE ACCESO POR DEFECTO (USUARIOS Y PIN)
>
> | Nombre del Usuario | Rol en el Sistema | PIN de Acceso | Módulo Redirigido |
> | :--- | :--- | :---: | :--- |
> | **`Antoine Moreau`** | **Gerente General** | 🔑 **`1234`** | [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) |
> | **`Jean-Luc Dubois`** | **Chef de Cuisine / Maestro Panadero** | 🔑 **`4321`** | [modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html) |
> | **`Élodie Martin`** | **Cajera Principal (POS)** | 🔑 **`1111`** | [modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) |
> | **`Sophie Laurent`** | **Contadora & Administradora** | 🔑 **`7777`** | [modules/accounting.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/accounting.html) |

### 🚀 Añadido (Added)
- **Estructura del Proyecto Visual Studio**:
  - Archivo de solución de proyecto `.NET Web / Static Web` ([LaNuevaParisienne.csproj](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/LaNuevaParisienne.csproj)) listo para Visual Studio.
  - Organización modular por capas: `css/`, `js/core/`, `js/modules/`, `assets/` y `modules/`.

- **Sistema de Diseño "Parisian Chic & Modern MIS"**:
  - Hoja de estilos global ([css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css)) con variables de color curadas (Espresso `#2C1D11`, Trigo Dorado `#D49B54`, Terracota `#C85A32`, Beige Calido `#FAF7F2`).
  - Integración de fuentes Google Fonts: *Playfair Display* y *Plus Jakarta Sans*.

- **Módulo 1: Autenticación por Perfil y PIN**:
  - Vista semántica HTML5 ([index.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/index.html)) y estilos CSS3 ([css/modules/auth.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/auth.css)).
  - Teclado numérico PIN en pantalla con animación de error/éxito.
  - Servicio de sesión ([js/core/session-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/session-store.js)) con control de acceso por roles (RBAC).

---

## Roadmap de Próximas Versiones (Planificado)

### 📌 [1.3.0] - Módulo 2: Producción y Cocina
- Monitoreo en tiempo real de lotes en hornos activos (temporizadores y alertas).
- Ajuste de orden diaria de panadería (croissants, baguettes, masa madre).
- Cola de órdenes en curso y productos listos para horneado.

### 📌 [1.4.0] - Módulo 4 & 5: Dashboard Gerencial e Inventario
- Indicadores clave de rendimiento (KPIs), gráficas de tendencia y control de stock de materias primas con alertas de reposición (Harina, Mantequilla, Levadura).
