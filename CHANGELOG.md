# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.4.0] - 2026-08-11 (Módulo 4: Dashboard Gerencial & Componente Global de Migas de Pan)

### 🚀 Añadido (Added)
- **Componente Global de Navegación por Migas de Pan (Breadcrumbs)**:
  - Definición semántica de reglas de navegación en [css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css) (`.breadcrumbs-container`, `.breadcrumbs-list`, `.breadcrumb-item`).
  - Integración estándar en la cabecera de todas las vistas principales:
    - **Módulo 2: Producción y Cocina** ([modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html)): `🏠 Inicio / Producción y Cocina`
    - **Módulo 3: Punto de Venta POS** ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html)): `🏠 Inicio / Punto de Venta (POS)`
    - **Módulo 4: Dashboard Gerencial** ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html)): `🏠 Inicio / Dashboard Gerencial`

- **Módulo 4: Dashboard Gerencial (MIS & Analítica)**:
  - Base de datos analítica ([js/data/dashboard-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/dashboard-db.js)) con métricas KPI (Ingresos $4,850.00, Órdenes 248, Ticket Promedio $19.55 y Margen 38.5%).
  - Gráfico analítico de línea con **Chart.js** comparando ingresos por ventas vs costos de producción.
  - Tabla semántica de auditoría y movimientos recientes con filtros dinámicos (*Todos*, *Ventas*, *Gastos*).

---

## [1.3.0] - 2026-08-11 (Módulo 2: Producción y Cocina - KDS & Hornos)

### 🚀 Añadido (Added)
- **Base de Datos y Estado de Cocina ([js/data/kitchen-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/kitchen-db.js))**.
- **Interfaz KDS en HTML5 Estricto ([modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html))** y **Estilos CSS3 ([css/modules/kitchen.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/kitchen.css))**.
- **Controlador Interactivo ES6 ([js/modules/kitchen.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/kitchen.js))** con cuenta regresiva en vivo y asignación de hornos.

---

## [1.2.0] - 2026-08-11 (Módulo 3: Punto de Venta - POS)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Productos ([js/data/products-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/products-db.js))**.
- **Interfaz POS Split-Screen ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))** y **Controlador POS ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**.

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