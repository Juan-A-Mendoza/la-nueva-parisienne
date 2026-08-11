# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-08-11 (Iteración Inicial - Módulo de Autenticación & Estructura Base)

### 🚀 Añadido (Added)
- **Estructura del Proyecto Visual Studio**:
  - Archivo de solución de proyecto `.NET Web / Static Web` ([LaNuevaParisienne.csproj](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/LaNuevaParisienne.csproj)) listo para Visual Studio.
  - Organización modular por capas: `css/`, `js/core/`, `js/modules/`, `assets/` y `modules/`.

- **Sistema de Diseño "Parisian Chic & Modern MIS"**:
  - Hoja de estilos global ([css/main.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/main.css)) con variables de color curadas (Espresso `#2C1D11`, Trigo Dorado `#D49B54`, Terracota `#C85A32`, Beige Calido `#FAF7F2`).
  - Integración de fuentes Google Fonts: *Playfair Display* (Serif clásica para la marca) y *Plus Jakarta Sans* (Sansa-serif para la interfaz y números).
  - Restablecimiento (Reset) CSS3, utilidades tipográficas y componentes globales de botones.

- **Módulo 1: Autenticación por Perfil y PIN**:
  - Estructura de vista principal semántica en HTML5 puro ([index.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/index.html)) sin inline styles.
  - Hoja de estilos dedicada ([css/modules/auth.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/auth.css)) para la selección de usuarios y el modal de PIN.
  - Rejilla interactivas de tarjetas de perfil con avatares, roles y descripción de funciones.
  - Modal táctil en pantalla (*Keypad PIN Pad*) con efecto *glassmorphism*, indicadores de dígitos animados, soporte para teclado numérico físico y feedback auditivo/visual de error (animación *shake*).

- **Núcleo de Autenticación y Seguridad (RBAC)**:
  - Manejador de estado de sesión ([js/core/session-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/session-store.js)) con almacenamiento en `sessionStorage`.
  - Base de datos de perfiles y credenciales simuladas con 4 usuarios por rol:
    - **Antoine Moreau** (Gerente General - PIN: `1234`)
    - **Jean-Luc Dubois** (Chef de Cuisine / Maestro Panadero - PIN: `4321`)
    - **Élodie Martin** (Cajera Principal / POS - PIN: `1111`)
    - **Sophie Laurent** (Contadora - PIN: `7777`)
  - Controlador interactivo ES6 ([js/modules/auth.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/auth.js)) para procesar ingresos, borrado parcial (`⌫`), borrado completo (`C`) y redirección de módulos.

- **Prototipos de Módulos Destino**:
  - Vista inicial del Módulo 4: Dashboard Gerencial ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html)).
  - Vista inicial del Módulo 2: Producción y Cocina ([modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html)).
  - Vista inicial del Módulo 3: Punto de Venta POS ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html)).
  - Vista inicial del Módulo 7: Contabilidad y Finanzas ([modules/accounting.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/accounting.html)).

---

## Roadmap de Próximas Versiones (Planificado)

### 📌 [1.1.0] - Módulo 2: Producción y Cocina
- Monitoreo en tiempo real de lotes en hornos activos (temporizadores y alertas).
- Ajuste de orden diaria de panadería (croissants, baguettes, masa madre).
- Cola de órdenes en curso y productos listos para horneado.

### 📌 [1.2.0] - Módulo 3: Punto de Venta (POS)
- Terminal gráfica de facturación táctil por categorías.
- Cálculo automático de impuestos, totales y vueltos.
- Integración de ticket digital y arqueo de caja.

### 📌 [1.3.0] - Módulo 4 & 5: Dashboard Gerencial e Inventario
- Indicadores clave de rendimiento (KPIs), gráficas de tendencia y control de stock de materias primas con alertas de reposición (Harina, Mantequilla, Levadura).
