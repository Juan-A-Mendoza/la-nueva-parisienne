# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.3.0] - 2026-08-11 (Módulo 2: Producción y Cocina - KDS & Hornos)

### 🚀 Añadido (Added)
- **Base de Datos y Estado de Cocina ([js/data/kitchen-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/kitchen-db.js))**:
  - Estado inicial de 4 hornos industriales (Giratorio, Convección Fina, Bóveda de Piedra, Convección Digital).
  - Cola de comandas recibidas desde el Punto de Venta (POS) en tiempo real.
  - Lotes de masa leudada en cola de preparación (*Staging Queue*).

- **Interfaz KDS en HTML5 Estricto ([modules/kitchen.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/kitchen.html))**:
  - Separación total de responsabilidades sin inline styles.
  - Navbar superior con avatar del Chef activo (`Jean-Luc Dubois`), indicador de turno y botón de cierre de sesión.
  - Barra de métricas KDS en tiempo real (Hornos en uso, comandas pendientes, unidades horneadas hoy y eficiencia).
  - Dashboard de 3 columnas: Panel de Hornos Industriales, Cola de Comandas POS (KDS) y Lotes Listos para Horno.

- **Estilos CSS3 de Cocina ([css/modules/kitchen.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/kitchen.css))**:
  - Medidores de temperatura y temporizadores digitales.
  - Barras de progreso de horneado con animación de gradiente.
  - Alerta visual con destello dorado/verde (`.ready-alert`) al completarse el horneado de un lote.
  - Tarjetas de comanda estilo KDS con códigos de estado por color y tiempo transcurrido.

- **Controlador Interactivo ES6 ([js/modules/kitchen.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/kitchen.js))**:
  - Bucle de cuenta regresiva en tiempo real por segundo para temporizadores de hornos activos (`04:15`).
  - Flujo de estados de comandas POS (*Pendiente* ➔ *En Preparación* ➔ *Listo para Entregar* ➔ *Archivar*).
  - Modal de Carga de Lotes a Hornos con parámetros de temperatura (°C) y minutos de cocción.

---

## [1.2.0] - 2026-08-11 (Módulo 3: Punto de Venta - POS)

### 🚀 Añadido (Added)
- **Base de Datos Maestra de Productos ([js/data/products-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/products-db.js))**:
  - Catálogo de 15 productos representativos divididos en 4 categorías principales.
- **Interfaz POS Split-Screen en HTML5 Estricto ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html))** y **Estilos CSS3 ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**.
- **Controlador Interactivo POS ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))** con cálculo de IVA (16%), descuentos, calculadora de vuelto y ticket impreso.

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

---

## Roadmap de Próximas Versiones (Planificado)

### 📌 [1.4.0] - Módulo 4 & 5: Dashboard Gerencial e Inventario
- Indicadores clave de rendimiento (KPIs), gráficas de tendencia y control de stock de materias primas con alertas de reposición (Harina, Mantequilla, Levadura).
432