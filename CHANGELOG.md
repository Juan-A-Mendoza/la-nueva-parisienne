# Historial de Cambios y Versiones — La Nueva Parisienne

Todos los cambios significativos, nuevas funcionalidades y actualizaciones del sistema de gestión para la panadería **La Nueva Parisienne** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [4.5.0] - 2026-08-22 (Validación Obligatoria de Cédula o RIF del Cliente para Todo Método de Pago en Módulo 3 POS)

### 🪪 Validación Fiscal Estricta de Identificación del Cliente ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))
- **Obligatoriedad de Cédula / RIF para Todos los Métodos de Pago**:
  - Para finalizar cualquier venta (Efectivo, Débito, Crédito o Pago Móvil), el sistema exige de forma estricta ingresar la Cédula o RIF del cliente.
- **Resaltado Visual e Interrupción Preventiva**:
  - Si el cajero intenta hacer clic en `✓ Finalizar Venta e Imprimir Ticket` sin haber ingresado la Cédula/RIF, el sistema interrumpe la operación, resalta la casilla en rojo con foco automático y despliega una alerta modal informativa.
- **Feedback Interactivo**:
  - El resaltado de error se limpia automáticamente al comenzar a escribir el documento de identidad.

---

## [4.4.0] - 2026-08-17 (Soporte de Selección Independiente entre Tarjeta de Débito y Tarjeta de Crédito en Módulo 3 POS)

### 💳 Medios de Pago Estandarizados a 4 Opciones Táctiles ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html), [css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css), [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))
- **Discriminación Explícita de Tarjetas**:
  - Se separó la opción genérica "Tarjeta" en dos botones directos de un solo toque: **💳 T. Débito** (`debito`) y **💳 T. Crédito** (`credito`).
- **Instrucciones Diferenciadas para el Cajero**:
  - El panel del punto de venta emite instrucciones claras especificando si el cliente debe presentar/deslizar su Tarjeta de Débito o Crédito.
- **Registro Fiel en Factura e Impresión**:
  - En la BD MySQL y el ticket fiscal impreso se registra explícitamente `TARJETA DE DÉBITO` o `TARJETA DE CRÉDITO` según corresponda.

---

## [4.3.0] - 2026-08-17 (Modal de Detalle de Movimientos Financieros con Diseño Premium en Módulo 4 Dashboard)

### 💎 Modal de Detalle de Transacciones con Diseño Moderno y Glassmorphism ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [css/modules/dashboard.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/dashboard.css), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Sustitución Completa de `alert()` por Ventana Modal Interactiva**:
  - Al hacer clic en **"Ver Detalle"** en la tabla de últimos movimientos, se abre una ventana modal emergente con diseño de alta gama (efecto cristal backdrop blur, bordes dorados, tipografía moderna).
- **Cálculo Dinámico Multimoneda ($ USD / Bs. VES)**:
  - Muestra el monto en USD y calcula al instante su conversión en Bolívares usando la tasa BCV activa del sistema traída del Módulo 9.
- **Desglose de Ítems y Auditoría Fiscal**:
  - Incluye metadatos completos (tipo de operación, responsable, método de pago, timestamp, auditoría SENIAT OK) y un desglose detallado de los productos o insumos involucrados.
- **Acciones de Exportación e Impresión**:
  - Incorpora botones para imprimir el voucher oficial de la transacción y copiar la referencia de control.

---

## [4.2.0] - 2026-08-17 (Estandarización del Indicador de Tasa BCV en Navbar entre Módulo 3 POS y Módulo 4 Dashboard)

### 🎨 Estandarización Visual de Navbar sin Tarjetas Innecesarias ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [css/modules/dashboard.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/dashboard.css), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Eliminación Completa de la Tarjeta KPI**:
  - Se borró por completo el contenedor de tarjeta grande de la cuadrícula principal del Dashboard.
- **Clonación e Integración del Badge del Navbar del POS**:
  - Se replicó la estructura HTML `#bcvRateBadge` en la barra superior (navbar) del Módulo 4 Dashboard, ubicándola junto a la credencial del Gerente General.
- **JavaScript Limpio y Directo**:
  - `resolveDashboardBcvRate()` actualiza `#bcvRateBadge` y `#bcvRateVal` con la misma estética y etiquetas (`🇻🇪 Tasa: Manual (Editada): Bs. 772.80` / `🇻🇪 Tasa: Automática (En Vivo): Bs. 761.21`) que en el Módulo de Caja POS.

---

## [4.1.4] - 2026-08-17 (Solución Definitiva de Sobreescritura en BcvRateStore y Mapeo Exacto entre POS y Dashboard)

### 🐛 Corrección de Sobreescritura en BcvRateStore ([js/core/bcv-rate-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/bcv-rate-store.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Eliminación de Sobreescritura de `modo_tasa`**:
  - Se eliminó el `localStorage.setItem('modo_tasa', 'auto')` involuntario dentro de `BcvRateStore.fetchRate()`, evitando que el sistema reescribiera el modo elegido por el gerente al consultar la API.
- **Sincronización Infalible entre Módulo 3 POS y Módulo 4 Dashboard**:
  - Tanto el indicador de la Caja POS (`🇻🇪 Tasa: Manual (Editada): Bs. 772.80`) como la tarjeta KPI del Dashboard (`Bs. 772.80` • `• Tasa: Manual (Editada)`) muestran exactamente la misma cifra y modalidad configuradas en Módulo 9.

---

## [4.1.3] - 2026-08-17 (Unificación Idéntica de la Lógica de Tasa BCV entre Módulo 4 Dashboard y Módulo 3 Caja POS)

### 🏛️ Reconstrucción con Lógica Espejo de Caja POS ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Tarjeta 100% Idéntica a Caja**:
  - Se recreó el título `🇻🇪 TASA DE CAMBIO BCV` y la función `resolveDashboardBcvRate()` copiada exactamente de la lógica de resolución utilizada en el Módulo 3 (Punto de Venta / Caja POS).
- **Mapeo Fiel del Estado**:
  - Si es **Manual**: Muestra el valor manual de Módulo 9 (ej. `Bs. 772.80`) y la leyenda `• Tasa: Manual (Editada)`.
  - Si es **Automático**: Muestra la tasa oficial en vivo (ej. `Bs. 761.21`) y la leyenda `• Tasa: Automática (En Vivo)`.

---

## [4.1.2] - 2026-08-17 (Representación Directa e Inmediata de la Tasa Activa del Módulo 9 en Módulo 4 Dashboard)

### ⚡ Visualización Inmediata sin Demoras ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Inyección Directa e Ininterrumpida**:
  - Se configuró la tarjeta **`💵 TASA DE CAMBIO ACTIVA`** para mostrar inmediatamente la cotización vigente al abrir el Dashboard, sin estados vacíos ni demoras.
  - Muestra fielmente el valor activo traído desde el Módulo 9 (Manual o Automático) y actualiza su cifra y badge instantáneamente.

---

## [4.1.1] - 2026-08-17 (Reconstrucción Total de la Tarjeta de Tasa en Módulo 4 Dashboard Sin Valores Estáticos)

### 🧹 Reconstrucción HTML y Alimentación Dinámica 100% Desde Módulo 9 ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Eliminación Total de Cifras Hardcodeadas**:
  - Se eliminó el texto estático `Bs. 761.21` del HTML en `dashboard.html`. Ahora la tarjeta inicia en un estado limpio `Bs. --.--` hasta la inyección dinámica.
- **Reflejo Exclusivo de la Configuración del Módulo 9**:
  - La tarjeta lee directamente los datos fijados por el Gerente General en el Módulo 9: si es **Manual**, inyecta la cifra ingresada (ej. `Bs. 772.80`) y el distintivo `• Modo Manual Gerencial`; si es **Automático**, inyecta la tasa en vivo y el distintivo `• Modo Automático (API BCV)`.

---

## [4.1.0] - 2026-08-17 (Solución Definitiva de Inicialización de Tasa en Módulo 4 Dashboard)

### 🐛 Corrección de Excepción de Ejecución (Fix Uncaught ReferenceError) ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Eliminación de Llamadas de Función Inexistentes**:
  - Se corrigió la llamada desactualizada a `fetchBcvRate()` y `updateBcvKpiUI()`, la cual producía un `ReferenceError` no capturado al iniciar el Dashboard y detenía la ejecución del script antes de renderizar la tasa activa.
- **Sincronización Infalible del Módulo 9 al Módulo 4**:
  - La tarjeta **`💵 TASA DE CAMBIO ACTIVA`** del Dashboard ejecuta de forma limpia `updateBcvDisplay()`, reflejando exactamente la tasa ingresada en el Módulo 9 (sea **Manual**, ej. `Bs. 772.80`, o **Automática**, ej. `Bs. 761.21`), actualizándose en tiempo real y persistiendo al recargar.

---

## [4.0.9] - 2026-08-17 (Persistencia e Inmutabilidad de la Modalidad Seleccionada en Módulo 9 y Módulo 4 Dashboard)

### 🧠 Memoria Incondicional de Configuración Gerencial ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js), [js/core/bcv-rate-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/bcv-rate-store.js))
- **Prioridad Absoluta a la Elección Gerencial**:
  - Se corrigió la lógica donde la consulta inicial a `get_empresa.php` reescribía `localStorage` con la modalidad por defecto (`auto`).
  - Tanto el **Módulo 9 (Configuraciones)** como el **Módulo 4 (Dashboard Gerencial)** leen primero y de forma inmutable la preferencia guardada por el Gerente General (`modo_tasa` y `tasa_manual`).
- **Recordatorio Ininterrumpido en Módulo 9**:
  - Al ingresar a Módulo 9, el formulario selecciona automáticamente la opción recordada (Manual vs Automática) y muestra el panel correspondiente con la cifra escrita previamente.
- **Visualización Infalible en Módulo 4 Dashboard**:
  - Si la última opción guardada fue **Modo Manual**, la tarjeta **`💵 TASA DE CAMBIO ACTIVA`** muestra de forma permanente e inmutable el valor manual (ej. `Bs. 772.80`) y la leyenda `• Modo Manual Gerencial` (en color dorado/ámbar), sin revertirse a automático.

---

## [4.0.8] - 2026-08-17 (Manejo Resiliente y Eliminación de Falsos Positivos de Conexión al Guardar Tasa)

### 🛠️ Persistencia Resiliente ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))
- **Manejo Desacoplado de Conexión**:
  - Al guardar la tasa manual en Módulo 9, la información se persiste en `localStorage` y se transmite vía `BroadcastChannel` de forma inmediata e incondicional.
  - Se eliminó el falso positivo de "Error de conexión" que se producía cuando el backend de MySQL/PHP no estaba ejecutándose localmente, asegurando que el sistema muestre `✓ ¡Tasa de cambio guardada y transmitida a todo el sistema!` sin bloquear al usuario.
- **Sin Dependencias de Red al Guardar Tasa Manual**:
  - Al estar en Modo Manual, la función de guardado ya no intenta realizar llamadas asíncronas externas a APIs remotas, haciendo el proceso instantáneo.

---

## [4.0.7] - 2026-08-17 (Reconstrucción Total de la Tarjeta de Tasa de Cambio Activa en Módulo 4 Dashboard)

### 🧹 Reconstrucción Precisa y Corrección Dinámica ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Eliminación de Etiqueta Estática "Tasa Oficial"**:
  - Reemplazo del título ambiguo `"🇻🇪 TASA OFICIAL BCV"` por el rótulo dinámico `"💵 TASA DE CAMBIO ACTIVA"`.
- **Reflejo Exacto del Valor y Modalidad Activa**:
  - Si el sistema rige con **Modo Automático**: muestra la cotización en vivo (`tasa_auto`, ej. `Bs. 761.21`) y la etiqueta `• Modo Automático (API BCV)` (verde).
  - Si el sistema rige con **Modo Manual**: muestra la cotización fija gerencial (`tasa_manual`, ej. `Bs. 780.00`) y la etiqueta `• Modo Manual Gerencial` (dorado/ámbar).

---

## [4.0.6] - 2026-08-17 (Rediseño de Paneles Mutuamente Exclusivos para Tasa Automática y Manual en Módulo 9)

### 🎨 Interfaz Ordenada y Mutuamente Exclusiva (Clean & Exclusive UI)
- **Paneles Dinámicos Aislados ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html), [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - **Panel Automático (`#boxModoAuto`)**: Al seleccionar "Modo Automático", se muestra exclusivamente la tarjeta de conexión API en vivo, ocultando completamente el campo manual.
  - **Panel Manual (`#boxModoManual`)**: Al seleccionar "Modo Manual", se oculta el panel de API y se despliega y enfoca únicamente el panel de edición de tasa manual (`#input_tasa_manual`).
- **Claridad Total para el Gerente**:
  - Garantiza que solo un modo esté activo y desplegado visualmente a la vez, eliminando cualquier ambigüedad de cuál modalidad rige el sistema.

---

## [4.0.5] - 2026-08-17 (Refuerzo de Sincronización Inmediata en Dashboard al Cambiar Modalidad en Módulo 9)

### 🔄 Refuerzo de Transmisión Reactiva ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Emisión Instantánea al Hacer Clic en el Radio Selector**:
  - Al cambiar los radio buttons ("Modo Automático" vs "Modo Manual") o escribir un monto en la casilla manual del Módulo 9, la tarjeta del Módulo 4 Dashboard recibe inmediatamente la orden de transmisión antes e incluso después de guardar.
- **Doble Fuente de Verdad (MySQL + LocalStorage)**:
  - Al cargar el Dashboard Gerencial, `initBcvDisplay()` consulta automáticamente `api/get_empresa.php` para sincronizar la verdad guardada en la base de datos MySQL de forma infalible.

---

## [4.0.4] - 2026-08-17 (Sincronización Ultrarrápida Multicanal vía BroadcastChannel en Dashboard y POS)

### 📡 Transmisión Instantánea Inter-Pestañas (Multichannel Inter-Tab Sync)
- **Incorporación de BroadcastChannel (`lnp_bcv_channel`) ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js), [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Implementación del canal nativo `BroadcastChannel('lnp_bcv_channel')` que conecta directamente todas las ventanas abiertas del sistema (Módulo 9, Módulo 4 Dashboard y Módulo 3 POS).
  - Al guardar la tasa (automática o manual) en el Módulo 9, la tarjeta del **Dashboard Gerencial (Módulo 4)** actualiza de inmediato el monto y la etiqueta de estado (`• Tasa: Automática (En Vivo)` o `• Tasa: Manual (Editada)`).

---

## [4.0.3] - 2026-08-17 (Sincronización Dinámica de la Tarjeta del Dashboard con la Modalidad Seleccionada)

### 📊 Actualización en Tiempo Real en Módulo 4 ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))
- **Reflejo Dinámico del Modo Seleccionado**:
  - La tarjeta de Tasa BCV del **Módulo 4: Dashboard Gerencial** (`#tasa_actual_display` y `#texto_estado_tasa`) ahora se actualiza automáticamente con la opción elegida por el Gerente General.
  - Si se elige **Modo Automático**: muestra el monto en vivo de `tasa_auto` y la leyenda `• Tasa: Automática (En Vivo)`.
  - Si se elige **Modo Manual**: muestra el monto personalizado de `tasa_manual` y la leyenda `• Tasa: Manual (Editada)`.
- **Recepción de Eventos Reactivos**:
  - El manejador de eventos `handleBcvRateEvent()` escucha de forma pasiva cualquier cambio transmitido desde el Módulo 9 y actualiza la tarjeta KPI sin requerir recargar la página.

---

## [4.0.2] - 2026-08-17 (Manejo de Variables Independientes de Tasa Automática y Tasa Manual)

### 🔀 Variables Independientes (Dual Rate Variable Architecture)
- **Separación de Variables en localStorage y Memoria ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - `tasa_auto` / `tasaAuto`: Almacena la cotización obtenida en vivo desde la API de Fawaz Ahmed.
  - `tasa_manual` / `tasaManual`: Almacena el valor personalizado ingresado por el Gerente General.
  - `modo_tasa` / `modoTasa`: Determina la modalidad activa (`auto` o `manual`).
- **Conmutación Visual Dinámica**:
  - Al seleccionar "Modo Automático", la previsualización muestra `tasa_auto` sin modificar la cifra guardada en `tasa_manual`.
  - Al seleccionar "Modo Manual", la previsualización muestra `tasa_manual` permitiendo su edición y guardado aislados.

---

## [4.0.1] - 2026-08-17 (Verificación Completa de Sincronización en Tiempo Real para Caja y Facturas)

### ⚡ Sincronización en Tiempo Real (Real-Time Sync & Ticket Printing)
- **Sincronización Multicapa ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js), [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Al guardar cualquier cambio de tasa en el Módulo 9, la variable activa se persiste inmediatamente en `localStorage` (`modo_tasa`, `tasa_manual` y `bcv_current_rate`) y emite los eventos `storage`, `bcvRateChanged` y de suscripción en `BcvRateStore`.
- **Actualización Instantánea en Punto de Venta (Caja - Módulo 3)**:
  - El Punto de Venta (POS) recalcula en tiempo real los totales en Bolívares (`step1TotalVes`, `totalVesEl`), actualiza los badges de indicación de tasa y asigna la tasa vigente a la venta.
- **Facturación Impresa y Ticket Térmico**:
  - El generador de facturas térmicas de 80mm imprime exactamente la tasa de referencia activa en el bloque legal SENIAT: `CONVERSIÓN TASA OFICIAL BCV: Bs. XXX.XX / USD` y `TOTAL EN BS: Bs. XXX.XX`.

---

## [4.0.0] - 2026-08-17 (Migración Completa a API Open-Source Fawaz Ahmed via jsdelivr)

### 🚀 Nueva Arquitectura Cambiaria (New Currency API Architecture)
- **Migración de Endpoint en Modo Automático ([js/core/bcv-rate-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/bcv-rate-store.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js), [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js), [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Reemplazo total de la API BCV previa y de scripts intermediarios (`bcmrate.php`) por la API open-source de Fawaz Ahmed vía jsdelivr (`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`).
  - Extracción de valor mediante la propiedad `data.usd.ves`.
- **Respeto a la Lógica Automática / Manual y localStorage**:
  - Mantenimiento intacto del control conmutador Automático/Manual con persisecia en `localStorage` (`modo_tasa` y `tasa_manual`).
  - Si el sistema está en modo manual, se omite el `fetch()` externo y se aplica la tasa manual gerencial. Si está en modo automático, consulta jsdelivr en tiempo real.
- **Limpieza de Código (Code Cleanup)**:
  - Depuración completa de referencias a `bcmrate.php` y `dolarapi` en los controladores JavaScript para evitar errores de consola o bloqueos CORS.

---

## [3.9.9] - 2026-08-17 (Independización Completa del Guardado de Tasa de Cambio y Datos Fiscales)

### 🚀 Mejorado (Improved)
- **Separación de Formularios en Módulo 9 ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html))**:
  - División del Módulo 9 en dos tarjetas y formularios independientes: `🏢 Datos Fiscales` (`#empresaForm`) y `💵 Tasa de Cambio BCV / Multimoneda` (`#tasaForm`).
  - Incorporación del botón independiente `💾 Guardar Datos Fiscales` y del botón independiente `💾 Guardar Tasa de Cambio`.
- **Lógica de Procesamiento Independiente ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - El Gerente General puede modificar y guardar la Tasa BCV sin estar obligado a rellenar o modificar los campos fiscales, y viceversa.
  - La actualización de la tasa guarda inmediatamente en `localStorage`, actualiza el backend vía POST y transmite la tasa activa a Módulo 4 (Dashboard) y Módulo 3 (POS) en tiempo real.

---

## [3.9.8] - 2026-08-17 (Simplificación Informativa del Widget de Tasa BCV en Módulo 4)

### 🧹 Simplificación e Interfaz Limpia (Clean & Minimal UI)
- **Transformación a Tarjeta Puramente Informativa ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html))**:
  - Eliminación completa de los botones de conmutación ("Automático" / "Manual"), el input de tasa manual, el botón "Aplicar" y el botón "Refrescar API".
  - La tarjeta ahora muestra limpiamente el indicador oficial `🇻🇪 TASA OFICIAL BCV`, el monto activo `Bs. XXX.XX` y el estado vigente (`• Tasa Oficial BCV en Vivo` o `• Tasa Manual Gerencial`), perfectamente integrada al layout de métricas KPI del Dashboard.
- **Controlador de Lectura en Tiempo Real ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Simplificación del JavaScript a un controlador que consulta y muestra automáticamente la tasa oficial activa (con escucha de eventos `storage` y `bcvRateChanged` para reflejar cualquier cambio realizado en el Módulo 9).

---

## [3.9.7] - 2026-08-13 (Restricción de Acceso Exclusivo al Módulo 9 para Gerente General desde Módulo 4)

### 🔒 Seguridad y Control de Acceso (Security & Access Control)
- **Acceso Exclusivo de Gerente General ([js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Implementación de control de acceso por rol en el Módulo 9: si un usuario sin rol de Gerente General intenta acceder a `configuraciones.html`, el sistema bloquea el acceso con un mensaje de advertencia y redirige automáticamente al Panel Central (`dashboard.html`).
- **Enlace de Entrada en Módulo 4 ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html))**:
  - Incorporación del botón de acceso directo `⚙️ Módulo 9: Configuraciones` en la barra superior del Dashboard Gerencial (Módulo 4), disponible exclusivamente para el Gerente General.
- **Navegación de Retorno ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html))**:
  - Botón de retorno `⬅️ Volver al Dashboard (Módulo 4)` en la barra superior de Módulo 9 para navegar fluidamente hacia el Panel Gerencial.

---

## [3.9.6] - 2026-08-13 (Confirmación de Integración Perfecta del Widget en Módulo 4 Dashboard)

### 🧹 Verificado e Integrado (Verified & Integrated)
- **Verificación de Integración Directa ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Se confirmó que el nuevo widget limpio de Tasa BCV y su JavaScript se encuentran 100% integrados dentro del archivo original del **Módulo 4: Dashboard Gerencial** (`modules/dashboard.html` y `js/modules/dashboard.js`).
  - Mantiene exactamente la cuadrícula Grid (`class="dashboard-kpi-card"` con `grid-column: span 2`) y los estilos CSS acordes con el resto del tablero.
  - Se verificó la inexistencia de archivos basura o aislados en el proyecto.

---

## [3.9.5] - 2026-08-13 (Reconstrucción Limpia Completa del Widget de Tasa BCV)

### 🚀 Reconstruido (Rebuilt)
- **HTML del Widget de Tasa ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html))**:
  - Reestructuración completa con la estructura limpia solicitada: título `"TASA OFICIAL BCV / MULTIMONEDA"`, visor `<h1 id="tasa_actual_display">`, radio buttons `#modo_auto` y `#modo_manual`, campo `#input_tasa_manual`, botón `#btn_aplicar_tasa` y texto `#texto_estado_tasa`.
- **Script Aislado de Control ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Reescritura del JavaScript desde cero: habilita/deshabilita el input al cambiar los radio buttons, persiste en `localStorage.setItem('modo_tasa', ...)` y `localStorage.setItem('tasa_manual', ...)`, actualiza visualmente la tasa en pantalla al instante, emite alerta `"Tasa actualizada correctamente en todo el sistema"` y restaura el estado guardado al recargar.
- **Sincronización en Caja ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Lectura transparente de las claves `modo_tasa`/`modoTasa` y `tasa_manual`/`tasaManual`.

---

## [3.9.4] - 2026-08-13 (Eventos Inline Onclick Directos en HTML para Control de Tasa en Módulo 4)

### 🛠️ Corregido (Fixed)
- **Implementación Estricta de Inline Events (`onclick`) ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html))**:
  - Inclusión directa en el HTML de las instrucciones `onclick` en los radio buttons `#radio_auto` y `#radio_manual`, así como en sus etiquetas contenedoras.
  - Al hacer clic en Manual, fuerza inmediatamente `disabled = false`, `style.opacity = '1'`, `label_candado.innerText = '✏️ (Modo Edición)'` y `input_tasa_manual.focus()`.
  - Al hacer clic en Automático, fuerza `disabled = true`, `style.opacity = '0.5'` y `label_candado.innerText = '🔒 (Bloqueado)'`.

---

## [3.9.3] - 2026-08-13 (Solución Definitiva al Conflicto Asíncrono y Actualización Visual de Pills)

### 🛠️ Corregido (Fixed)
- **Aislamiento de Sobrescritura Asíncrona ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Protección en `updateBcvKpiUI` para impedir que los datos en segundo plano reseteen el radio button a Automático ni vuelvan a bloquear el input mientras el usuario tiene seleccionado el modo Manual.
- **Sincronización de Bordes Visuales (Pills)**:
  - `actualizarVistaTasa()` conmuta inmediatamente el borde verde activo (`border: 2px solid var(--color-success)`) hacia la píldora de Manual y deja en gris la de Automático.
  - Habilitación inmediata del campo `#input_tasa_manual` (`opacity = 1`, `disabled = false`, `readonly = false`), texto `✏️ (Modo Edición)`, badge `• Tasa: Manual (Editada)` y foco con selección de texto automática.

---

## [3.9.2] - 2026-08-13 (Corrección del Error de Declaración Duplicada y ReferenceError en Dashboard)

### 🛠️ Corregido (Fixed)
- **Eliminación del SyntaxError de Duplicidad ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Eliminación de la declaración duplicada de constantes al final del archivo que provocaba un `Uncaught SyntaxError` e interrumpía la ejecución del script.
- **Definición de `updateBcvKpiUI` ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Incorporación limpia de la función `updateBcvKpiUI(data)` para evitar el `ReferenceError` al recibir eventos de la suscripción del store.

---

## [3.9.1] - 2026-08-13 (Vinculación de IDs Exactos y Bloque de JavaScript para Control de Tasa)

### 🛠️ Corregido (Fixed)
- **Implementación de IDs Estandarizados ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html))**:
  - Incorporación estricta de los IDs requeridos: `radio_auto`, `radio_manual`, `input_tasa_manual`, `label_candado` y `texto_estado_tasa`.
- **Bloque de Eventos e Interactividad ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Inclusión del bloque `actualizarVistaTasa()` con remoción explícita de `disabled` y `readonly`, actualización de textos de estado y foco automático al conmutar a Manual.

---

## [3.9.0] - 2026-08-13 (Reescritura del Control Cambiario con LocalStorage e Integración Estricta Módulo 4 & Módulo 3)

### 🚀 Añadido (Added)
- **Desbloqueo e Inhabilitación por Radio Buttons ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html))**:
  - EventListener asignado a los radio buttons `Automático` / `Manual`.
  - En **Automático**: Inhabilita la casilla manual (`disabled = true`), activa candado visual (`🔒 (Bloqueado en Modo Auto)`) y ejecuta la consulta a la API oficial.
  - En **Manual**: Habilita la casilla manual (`disabled = false`), activa aviso visual (`🔓 (Desbloqueado para Edición)`) y coloca el foco del teclado inmediatamente en el campo (`dashTasaInput.focus()`).
- **Persistencia Global con `localStorage`**:
  - Al pulsar el botón **"💾 Aplicar"**, se guardan las claves `localStorage.setItem('modoTasa', 'manual')` (o `'auto'`) y `localStorage.setItem('tasaManual', valorIngresado)`.
  - Actualización inmediata de la etiqueta de estado a `"Tasa: Manual (Editada)"` o `"Tasa: Automática (En Vivo)"`.
- **Sincronización con Caja ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Al cargar la página del POS o calcular totales, se verifica primeramente `if (localStorage.getItem('modoTasa') === 'manual')`.
  - Si es verdadero, toma el valor directo de `localStorage.getItem('tasaManual')`.
  - Si es falso ('auto'), consulta `bcmrate.php` o la API oficial.
  - Sincronización instantánea mediante eventos `storage` y `bcvRateChanged`.

---

## [3.8.4] - 2026-08-13 (Solución Definitiva de Edición por readOnly y Eventos de Foco Directos)

### 🛠️ Corregido (Fixed)
- **Eliminación Total del Bloqueo por `disabled` ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Reemplazo del atributo estático `disabled` por `readOnly = false` e inmunidad ante sobrescrituras periódicas del background store (`userIsEditingManualRate`).
  - Asignación de event listeners para `click`, `focus` e `input` directamente sobre la casilla numéricas. Al hacer clic o tocar la casilla, conmuta automáticamente a modo manual, selecciona el texto y habilita la escritura inmediata sin ningún bloqueo del navegador.

---

## [3.8.3] - 2026-08-13 (Desbloqueo al Seleccionar Modo Manual y Actualización Inmediata en Dashboard y POS)

### 🚀 Añadido (Added)
- **Desbloqueo Exclusivo al Seleccionar Modo Manual ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Al marcar el radio selector **"✍️ Manual"**, el campo numérico se **desbloquea inmediatamente** (`disabled = false`, opacidad 1.0) y recibe el foco del teclado. En modo **"🌐 Automático"**, el campo permanece inhabilitado (`disabled = true`, `🔒 Bloqueado`).
- **Actualización Instantánea de la Tasa en Pantalla ([js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Al hacer clic en **"💾 Aplicar"**, la cifra en la tarjeta del **Dashboard (Módulo 4)** (`#kpiBcvRateVal`) se actualiza de inmediato al nuevo valor.
  - Sincronización en tiempo real con la cabecera del **POS (Módulo 3)** (`#bcvRateValEl` / `#bcvRateBadge`) mediante `BcvRateStore.broadcastChange`, eliminando cualquier chequeo antiguo de `>= 100`.

---

## [3.8.2] - 2026-08-13 (Acceso Continuo Desbloqueado para la Tasa Manual)

### 🛠️ Corregido (Fixed)
- **Remoción Total de Bloqueos en Campo Numérico ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html), [modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Eliminación completa de `pointer-events: none` y `disabled` en los inputs de Tasa Manual.
  - El campo ahora es **100% editable e interactivo siempre**. Al tipear una cifra en la casilla, el sistema conmuta automáticamente al modo manual y permite guardar/aplicar con un solo clic.

---

## [3.8.1] - 2026-08-13 (Corrección del Parser de Decimales con Coma en API BCV y Actualizaciones Parciales en MySQL)

### 🛠️ Corregido (Fixed)
- **Normalización de Formato Decimal de la API BCV en Vivo ([api/bcv_rate.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/bcv_rate.php))**:
  - Conversión automática de coma decimal a punto (`str_replace(',', '.', $val)`) para procesar correctamente las respuestas flotantes devueltas por la API oficial (ej. `"766,8603"`).
  - Eliminación de la restricción rígida que forzaba tasas `>= 100`, permitiendo cualquier número flotante válido mayor a 0.
- **Soporte de Actualizaciones Parciales en MySQL ([api/update_empresa.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/update_empresa.php))**:
  - Ajuste del endpoint para permitir guardar `modo_tasa` y `tasa_manual` desde la tarjeta interactiva del Dashboard sin exigir `nombre` y `rif` en cada petición.
- **Remoción de Límites Rígidos en Frontend ([js/core/bcv-rate-store.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/core/bcv-rate-store.js), [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Eliminación de chequeos artificiales de mínimos que impedían el funcionamiento normal en modo automático y manual.

---

## [3.8.0] - 2026-08-13 (Control de Tasa BCV en Dashboard Gerencial e Inmutabilidad Histórica Contable)

### 🚀 Añadido (Added)
- **Panel Interactivo de Tasa BCV en Módulo 4 Dashboard Gerencial ([modules/dashboard.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/dashboard.html) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Incorporación del panel de control interactivo directamente dentro de la tarjeta **"🇻🇪 Tasa Oficial BCV / Multimoneda"** del Dashboard Gerencial (CU-02).
  - Selector en vivo `[🌐 Automático (API)]` vs `[✍️ Manual]` con bloqueo estricto del campo de entrada numérico.
  - Botón de guardado rápido `💾 Aplicar` que actualiza MySQL y transmite la tasa de inmediato hacia los demás módulos (POS, Inventario, etc.).
- **Inmutabilidad Histórica en Módulo 7 Contabilidad ([js/data/accounting-db.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/data/accounting-db.js) y [js/modules/accounting.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/accounting.js))**:
  - Exclusión deliberada del Módulo de Contabilidad de los recálculos dinámicos en vivo.
  - Cada comprobante contable almacena y muestra la **tasa histórica congelada del día de trabajo** (`📌 Tasa Registrada del Día: Bs. XXX.XX`), garantizando el cumplimiento fiscal (SENIAT / VEN-NIF).

---

## [3.7.0] - 2026-08-13 (Sistema Global de Tasa BCV Oficial con Bloqueo Estricto Auto/Manual y Propagación Multimódulo)

### 🚀 Añadido (Added)
- **Gestor Centralizado de Tasa BCV (`js/core/bcv-rate-store.js`)**:
  - Implementación del store reactivo `BcvRateStore` con patrón de suscripción y difusión entre pestañas (`window.addEventListener('storage')`) para propagación en tiempo real sin recargar página.
- **Bloqueo Estricto Mutuo Auto vs Manual ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - En **Modo Automático**: Bloqueo e inhabilitación estricta del campo numérico "Tasa Manual" (`disabled = true`, opacidad 0.35, indicativo `🔒 Bloqueado en Modo Auto`). La aplicación actualiza en vivo la tasa oficial mediante cURL a `ve.dolarapi.com`.
  - En **Modo Manual**: Desbloqueo inmediato del campo numérico (`disabled = false`, indicativo `🔓 Desbloqueado para Edición`) e inhabilitación de la consulta automática.
- **Impacto Multimódulo Global ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js) y [js/modules/dashboard.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/dashboard.js))**:
  - Actualización reactiva instantánea en el Punto de Venta (POS) y Dashboard Gerencial al momento en que el Gerente guarda o cambia la configuración.

---

## [3.6.0] - 2026-08-13 (Selector de Banco Emisor con Código Bancario en Pago Móvil / QR)

### 🚀 Añadido (Added)
- **Selector de Banco Emisor en Pago Móvil / QR ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación del selector desplegable **"Banco Emisor / Origen"** en el panel de **Pago Móvil / QR** del Paso 2 de cobro.
  - Inclusión de las instituciones bancarias venezolanas con su código bancario oficial de 4 dígitos (ej: `0134 - Banesco`, `0102 - Banco de Venezuela`, `0108 - Banco Provincial`, `0105 - Banco Mercantil`, etc.).
  - Registro de la clave `bank_name` en la orden de venta e impresión dinámica en el ticket térmico de 80mm (`Banco Emisor: 0134 - Banesco | Ref: 982401`).

---

## [3.5.0] - 2026-08-12 (Integración cURL ve.dolarapi.com, Interfaz Módulo 9 Tasa Manual/Auto y Persistencia MySQL)

### 🚀 Añadido (Added)
- **Interfaz de Tasa BCV / Multimoneda en Módulo 9 ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Incorporación del bloque visual dedicado a la administración de la tasa cambiaria ($ USD ➔ Bs. VES).
  - Integración del Toggle Switch con etiquetas **"Modo Automático (API BCV en Vivo)"** y **"Modo Manual"**.
  - Adición del campo numérico **"Tasa Manual (Bs.)"** habilitado dinámicamente al seleccionar el modo manual.

### 🛠️ Corregido (Fixed)
- **Reescritura Backend cURL (`api/bcv_rate.php` y `api/bcmrate.php`)**:
  - Conexión mediante `cURL` directo a `https://ve.dolarapi.com/v1/dolares/oficial` con lectura del campo `promedio`.
  - Captura estructurada de errores para prevenir fallos de interfaz cuando la red esté offline o la API rechace la petición.
- **Persistencia Global en MySQL (`database/database.sql`, `api/get_empresa.php` y `api/update_empresa.php`)**:
  - Adición de las columnas `modo_tasa` y `tasa_manual` en la tabla `configuracion_empresa` para sincronizar los cálculos del POS (Módulo 3) y Dashboard (Módulo 4).

---

## [3.4.0] - 2026-08-12 (Modal Personalizado de Monto Insuficiente y Confirmación de Vuelto Superior en Efectivo)

### 🛠️ Corregido (Fixed)
- **Modal de Monto Recibido Insuficiente ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Reemplazo del diálogo nativo `alert()` por un modal personalizado (`#customConfirmModal`) cuando el monto recibido en efectivo es menor al total a pagar. Muestra la diferencia faltante en **$ USD** y **Bs. VES** con botón único de acción.
- **Confirmación de Vuelto Superior ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación de una verificación previa al procesar ventas en efectivo cuando el monto recibido es superior al total a pagar. Muestra en pantalla el desglose bimoneda del vuelto a entregar y solicita confirmación explícita antes de guardar en MySQL e imprimir la factura.

---

## [3.3.0] - 2026-08-12 (Modales de Confirmación Personalizados POS y Selector Para Llevar / Consumo Local)

### 🚀 Añadido (Added)
- **Modales de Confirmación Personalizados ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Eliminación total de ventanas emergentes nativas del navegador (`confirm()`) para las acciones de **"Vaciar"** y **"Empezar de cero / Cancelar"**.
  - Creación del modal nativo `#customConfirmModal` con diseño acorde a la identidad visual de la marca, iconos explicativos (`🗑️` y `🚫`) y botones de confirmación estilizados.

### 🛠️ Corregido (Fixed)
- **Activación del Selector "Para Llevar / Consumo Local" ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación de manejadores de eventos en `.order-type-btn` para permitir la conmutación activa de la condición del pedido (`Para Llevar` vs `Consumo Local`), actualizando dinámicamente la variable `currentOrderType` y su reflejo en la factura fiscal.

---

## [3.2.0] - 2026-08-12 (Corrección de Keystroke Stealing, Unificación de Vistas de Cobro Tarjeta/Pago Móvil y Teclado Táctil Nativo)

### 🛠️ Corregido (Fixed)
- **Solución al 'Keystroke Stealing' ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - El listener global `keydown` verifica el elemento enfocado (`document.activeElement`). Si el cajero está tipeando en los campos de "Nombre / Razón Social", "Cédula / RIF" o "Referencia", el escuchador del Numpad de efectivo se detiene (`return;`), permitiendo el ingreso limpio de caracteres alfanuméricos sin alterar el monto de efectivo.
- **Unificación de Vistas de Cobro ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación de una tarjeta de resumen prominente dentro del panel de **Tarjeta** y **Pago Móvil / QR** con el **Monto a Cobrar ($ USD)** y el **Monto en Bolívares (Bs. VES)** sincronizado en tiempo real.
  - Estandarización de los campos de cliente (Nombre y Cédula/RIF) manteniéndolos siempre visibles para todos los medios de pago.
- **Soporte de Teclado Táctil Nativo**:
  - Verificación de que los inputs de cliente y referencia posean atributos HTML5 estándar sin atributos `readonly` ni bloqueos `preventDefault()`, permitiendo que el sistema operativo (Windows/Android) despliegue el teclado táctil en pantalla nativo al tocarlos.

---

## [3.1.0] - 2026-08-12 (Módulo 9 Configuraciones, Impresión Estricta Térmica 80mm y Cabecera Dinámica de Empresa)

### 🚀 Añadido (Added)
- **Módulo 9 de Configuraciones ([modules/configuraciones.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/configuraciones.html) y [js/modules/configuraciones.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/configuraciones.js))**:
  - Creación del formulario de administración de datos fiscales de la empresa (Nombre, RIF, Dirección y Teléfono) con persistencia en MySQL vía `api/update_empresa.php`.
- **Backend API de Empresa ([api/get_empresa.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/get_empresa.php) y [api/update_empresa.php](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/api/update_empresa.php))**:
  - Integración con la tabla `configuracion_empresa` en MySQL para consulta y actualización dinámica de la cabecera fiscal.
- **Campos del Cliente en POS ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Incorporación de inputs para "Nombre / Razón Social" y "Cédula / RIF" en el Paso 2 de cobro. Si el cajero los omite, el sistema inyecta automáticamente `"Consumidor Final"` y `"V-00000000-0"`.

### 🛠️ Corregido (Fixed)
- **Regla Estricta de Impresión Térmica 80mm ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Aplicación exacta del bloque de visibilidad CSS especificado (`#ticket-container` visible a `80mm` en posición absoluta `top:0, left:0` con `body * { visibility: hidden; }` y supresión de botones con `.no-print`).

---

## [3.0.0] - 2026-08-12 (Rediseño de Ticket Fiscal para Impresoras Térmicas 80mm y Cumplimiento Cambiario BCV Venezuela)

### 🚀 Añadido (Added)
- **Formato Estándar de Rollo Térmico 80mm ([css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Regla `@page { margin: 0; size: 80mm auto; }` que fuerza el tamaño de rollo de 80mm en impresoras térmicas de tickets y elimina automáticamente cabeceras, pies de página y URLs generados por el navegador.
  - Ocultamiento estricto (`display: none !important;`) de la interfaz gráfica web, menús, botones de pago y los botones de acción del modal ("Imprimir Ticket", "Nueva Venta") durante el evento de impresión (`@media print`).
- **Estructura de Ticket Fiscal Venezolano ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Reestructuración de la función `showReceiptModal(saleData)` desplegando una plantilla fiscal centrada en fuente monoespaciada (`Courier New`):
    - **Cabecera**: "LA NUEVA PARISIENNE PANADERÍA & PASTELERÍA C.A.", RIF `J-40123456-7`, Dirección Fiscal en Barquisimeto y Teléfono.
    - **Datos del Documento**: N° Factura (`FAC-2026-XXXX`), Fecha/Hora y datos del cliente ("Consumidor Final", "RIF: V-00000000-0").
    - **Tabla 80mm**: Columnas `Cant | Descripción | P.U ($) | Total($)`.
    - **Bloque Cambiario BCV (CRÍTICO SENIAT)**: Caja destacada con la tasa aplicada (`TASA BCV: Bs. [Monto]`) y el **Total a Pagar en Bolívares** (`TOTAL EN BS: Bs. [Monto]`).
    - **Pie de Página**: "¡GRACIAS POR SU COMPRA!" y comprobante de control interno.

---

## [2.9.0] - 2026-08-11 (Numpad Táctil 60x60px, Entrada Decimal ATM Style y Vuelto Bimoneda USD/VES en POS)

### 🚀 Añadido (Added)
- **Teclado Numérico Táctil Numpad 3x4 ([modules/pos.html](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/modules/pos.html) y [css/modules/pos.css](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/css/modules/pos.css))**:
  - Incorporación de una cuadrícula táctil de alta velocidad con botones amplios (mínimo 60x60px) para los dígitos `1-9`, `00`, `0` y `⌫ Borrar`.
- **Lógica de Entrada Decimal Implícita ATM/POS Style ([js/modules/pos.js](file:///C:/Users/juana/.gemini/antigravity-ide/scratch/la-nueva-parisienne/js/modules/pos.js))**:
  - Algoritmo de desplazamiento de decimales de derecha a izquierda: inicia en `0.00`, digitar `1` -> `0.01`, digitar `5` -> `0.15`, digitar `0` -> `1.50`, digitar `0` -> `15.00`.
  - El botón `⌫ Borrar` desplaza los dígitos hacia la derecha descolando el último número.
- **Compatibilidad Dual Táctil y Teclado Físico `keydown`**:
  - Escuchador de teclado en vivo que captura la pulsación física de números `0-9`, `Backspace` y `Delete` cuando el cajero está en el Paso 2 con método de pago **Efectivo**.
- **Calculadora de Vuelto Bimoneda Desglosado ($ USD y Bs. VES)**:
  - Cálculo automático en tiempo real del vuelto a entregar al cliente tanto en **Dólares ($ USD)** como en **Bolívares (Bs. VES)** según la tasa BCV activa.

---

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