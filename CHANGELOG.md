# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.4.1] - 2026-08-11 (Ajustes Críticos de Usabilidad, Paleta Anti-Fatiga y Enrutamiento)

### 🛠️ Modificado y Corregido (Changed & Fixed)
- **Corrección del Enrutamiento en Migas de Pan (Breadcrumbs)**:
  - Se corrigió el enlace del breadcrumb `🏠 Inicio (Panel Central)` en todos los módulos ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html), [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html)) para que redirija al panel principal de gestión (`dashboard.html`) y NO al inicio de sesión (`index.html`).
  - La acción de cierre de sesión permanece atribuida de forma dedicada y exclusiva al botón **"Cerrar Sesión"**.

- **Requerimiento No Funcional de Usabilidad Táctil (Touch-Friendly 48x48 px)**:
  - Ajuste global en [css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css) estableciendo `min-width: 48px` y `min-height: 48px` para todos los elementos interactivos principales (teclado numérico PIN, botones de categoría, controles de cantidad `-` `+`, botones de acción de hornos y filtros).

- **Identidad Visual Corporativa y Reducción de Fatiga Visual**:
  - Actualización de variables de color en [css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css) utilizando la paleta artesanal de la panadería: Crema Vainilla (`#FAF7F2`), Café Espresso (`#2C1D11`), Trigo Dorado (`#D49B54`), Terracota (`#C85A32`) y Mantequilla Suave (`#F5E6D3`).

- **Confirmación Módulo 4 Dashboard Gerencial (CU-02)**:
  - Preparación de contenedores y datos simulados para visualizar volúmenes de ventas mensuales e indicadores clave de rendimiento según el requerimiento `CU-02`.

---

## [1.4.0] - 2026-08-11 (Módulo 4: Dashboard Gerencial - MIS & Analítica)

### 🚀 Añadido (Added)
- Base de datos analítica ([js/data/dashboard-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/dashboard-db.js)), interfaz HTML5 ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html)) y controlador ES6 con **Chart.js** ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js)).

---

## [1.3.0] - 2026-08-11 (Módulo 2: Producción y Cocina - KDS & Hornos)

---

## [1.2.0] - 2026-08-11 (Módulo 3: Punto de Venta - POS)

---

## [1.0.0] - 2026-08-11 (Iteración Inicial - Módulo de Autenticación & Estructura Base)

> [!IMPORTANT]
> ### 🔑 CREDENCIALES DE ACCESO POR DEFECTO (USUARIOS Y PIN)
>
> | Nombre del Usuario | Rol en el Sistema | PIN de Acceso | Módulo Redirigido |
> | :--- | :--- | :---: | :--- |
> | **`Juan`** | **Gerente General** | 🔑 **`1234`** | [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) |
> | **`Enrique`** | **Chef de Cuisine / Maestro Panadero** | 🔑 **`1234`** | [modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html) |
> | **`Henry`** | **Cajera Principal (POS)** | 🔑 **`1234`** | [modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) |
> | **`Sebastian`** | **Contadora & Administradora** | 🔑 **`1234`** | [modules/accounting.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/accounting.html) |