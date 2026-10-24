/**
 * ==============================================================================
 * LA NUEVA PARISIENNE - MOTOR DE EXPORTACIÓN EXCEL EJECUTIVO CON ESTILOS NATIVOS
 * Genera archivos .xlsx auténticos con formato institucional, paleta de colores,
 * membrete corporativo, tipografía Segoe UI, bordes contables y celdas combinadas.
 * ==============================================================================
 */

// Paleta Corporativa Refinada (Artisan Espresso, Amber Warmth, Slate Gray, Clean Slate)
const PALETTE = {
  headerBg: '1E293B',       // Slate 800 - Ejecutivo y sobrio
  headerText: 'FFFFFF',
  goldAccent: 'D97706',     // Amber 600 - Toque artesanal cálido
  goldLight: 'FEF3C7',      // Amber 100
  subHeaderBg: '334155',    // Slate 700
  cardBg: 'F8FAFC',         // Slate 50
  cardBorder: 'E2E8F0',     // Slate 200
  metaLabelBg: 'F1F5F9',    // Slate 100
  metaLabelText: '475569',  // Slate 600
  metaValText: '0F172A',    // Slate 900
  thBg: '1E293B',           // Slate 800
  thText: 'FFFFFF',
  zebraBg: 'F8FAFC',        // Slate 50 sutil
  totalBg: 'F1F5F9',        // Slate 100
  textDark: '1E293B',       // Slate 800
  textMuted: '64748B',      // Slate 500
  goldDark: '92400E',       // Amber 800 (para Bolívares)
  borderSubtle: 'E2E8F0',
  borderDark: '0F172A'
};

const borderThin = {
  top: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  bottom: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  left: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  right: { style: 'thin', color: { rgb: PALETTE.borderSubtle } }
};

const borderCard = {
  top: { style: 'medium', color: { rgb: PALETTE.goldAccent } },
  bottom: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  left: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  right: { style: 'thin', color: { rgb: PALETTE.borderSubtle } }
};

const borderDoubleTotal = {
  top: { style: 'thin', color: { rgb: PALETTE.borderDark } },
  bottom: { style: 'double', color: { rgb: PALETTE.borderDark } },
  left: { style: 'thin', color: { rgb: PALETTE.borderSubtle } },
  right: { style: 'thin', color: { rgb: PALETTE.borderSubtle } }
};

export const EXCEL_STYLES = {
  // Encabezado Principal
  companyTitle: {
    font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: PALETTE.headerBg } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  companySub: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: '94A3B8' } },
    fill: { fgColor: { rgb: PALETTE.headerBg } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  reportBadge: {
    font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: PALETTE.goldAccent } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },

  // Ficha de Metadatos
  metaLabel: {
    font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: PALETTE.metaLabelText } },
    fill: { fgColor: { rgb: PALETTE.metaLabelBg } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  metaVal: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: PALETTE.metaValText } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },

  // Tarjetas de Indicadores (KPIs)
  kpiLabel: {
    font: { name: 'Segoe UI', sz: 8.5, bold: true, color: { rgb: PALETTE.textMuted } },
    fill: { fgColor: { rgb: PALETTE.cardBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderCard
  },
  kpiVal: {
    font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: PALETTE.metaValText } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  kpiSub: {
    font: { name: 'Segoe UI', sz: 8.5, italic: true, color: { rgb: PALETTE.goldDark } },
    fill: { fgColor: { rgb: PALETTE.cardBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // Separador de Secciones
  sectionHeading: {
    font: { name: 'Segoe UI', sz: 10.5, bold: true, color: { rgb: PALETTE.headerBg } },
    fill: { fgColor: { rgb: 'E2E8F0' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },

  // Encabezados de Tabla
  th: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: PALETTE.thBg } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },

  // Datos en Celdas
  tdText: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  tdTextZebra: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    fill: { fgColor: { rgb: PALETTE.zebraBg } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  tdCenter: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  tdCenterZebra: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    fill: { fgColor: { rgb: PALETTE.zebraBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  tdMoneyUsd: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: PALETTE.metaValText } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  tdMoneyUsdZebra: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: PALETTE.metaValText } },
    fill: { fgColor: { rgb: PALETTE.zebraBg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  tdMoneyBs: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.goldDark } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  tdMoneyBsZebra: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.goldDark } },
    fill: { fgColor: { rgb: PALETTE.zebraBg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  tdNumber: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  tdNumberZebra: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: PALETTE.textDark } },
    fill: { fgColor: { rgb: PALETTE.zebraBg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },

  // Totales
  tfootLabel: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: PALETTE.metaValText } },
    fill: { fgColor: { rgb: PALETTE.totalBg } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderDoubleTotal
  },
  tfootVal: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: PALETTE.metaValText } },
    fill: { fgColor: { rgb: PALETTE.totalBg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderDoubleTotal
  },
  tfootValBs: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: PALETTE.goldDark } },
    fill: { fgColor: { rgb: PALETTE.totalBg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderDoubleTotal
  },

  // Firmas y Pie
  sigLine: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: PALETTE.textDark } },
    alignment: { horizontal: 'center', vertical: 'top' },
    border: { top: { style: 'thin', color: { rgb: '94A3B8' } } }
  },
  sigSub: {
    font: { name: 'Segoe UI', sz: 8.5, italic: true, color: { rgb: PALETTE.textMuted } },
    alignment: { horizontal: 'center', vertical: 'top' }
  },
  footerLegal: {
    font: { name: 'Segoe UI', sz: 8, italic: true, color: { rgb: '94A3B8' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }
};

function numCol(colIndex) {
  let str = '';
  let c = colIndex;
  while (c >= 0) {
    str = String.fromCharCode((c % 26) + 65) + str;
    c = Math.floor(c / 26) - 1;
  }
  return str;
}

function cellAddr(r, c) {
  return `${numCol(c)}${r + 1}`;
}

/**
 * Parsea montos monetarios o numéricos independientemente de si usan formato
 * estadounidense ($1,250.50) o hispano/venezolano (Bs. 1.250,50 o 1250,50)
 */
function parseUniversalNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return null;
  const s = String(str).trim();

  // Si termina en %
  if (/^[\d,.]+\s*%$/.test(s)) {
    const raw = s.replace('%', '').trim().replace(',', '.');
    const n = parseFloat(raw);
    return isNaN(n) ? null : { val: n / 100, type: 'pct' };
  }

  // Quitar prefijos de moneda y espacios
  let clean = s.replace(/^(Bs\.?|\$)\s*/i, '').trim();

  // Caso: 1.234.567,89 (europeo / venezolano)
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(clean)) {
    clean = clean.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  // Caso: 1,234,567.89 (estándar US)
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(clean)) {
    clean = clean.replace(/,/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  // Caso simple con coma decimal: 1250,50
  if (/^\d+,\d+$/.test(clean)) {
    const n = parseFloat(clean.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // Caso simple con punto decimal: 1250.50
  if (/^\d+(\.\d+)?$/.test(clean)) {
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  return null;
}

/**
 * Garantiza que la librería con soporte de estilos esté cargada
 */
export async function ensureStyleEngine() {
  if (!window.XLSX || !window.XLSX.version) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '../js/vendor/xlsx.style.min.js?v=' + Date.now();
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar el motor OpenXML con soporte visual'));
      document.head.appendChild(s);
    });
  }
}

/**
 * Genera y descarga un libro de Excel con formato visual ejecutivo de alta gama
 */
export function generateStyledExcelReport({
  fileName = 'reporte.xlsx',
  sheetName = 'Reporte',
  title = 'Informe Ejecutivo',
  periodo = '',
  fechaEmision = new Date().toLocaleString('es-VE'),
  bcvRate = 761.21,
  activeUser = { name: 'Juan Mendoza', role: 'Gerente General' },
  kpis = [],
  tables = [],
  minCols = 5
}) {
  if (!window.XLSX) {
    throw new Error('El motor de Excel no está disponible');
  }

  // 1. Determinar número exacto de columnas necesarias a partir de las tablas reales
  let totalCols = Math.max(minCols, 4);
  tables.forEach(t => {
    if (t.headers && t.headers.length > 0) {
      totalCols = Math.max(totalCols, t.headers.length);
    }
    (t.rows || []).forEach(r => {
      // Ignoramos filas con longitud 1 (mensajes vacíos con colspan) para el cálculo de columnas
      if (r.length > 1) {
        totalCols = Math.max(totalCols, r.length);
      }
    });
  });

  const ws = {};
  const merges = [];
  const rows = [];
  const colWidths = Array(totalCols).fill(15);
  let curRow = 0;

  function setCell(r, c, v, s, t = 's', z = undefined) {
    const addr = cellAddr(r, c);
    const cell = { v: v ?? '', t, s };
    if (z) cell.z = z;
    ws[addr] = cell;
  }

  // Actualiza el ancho de columna basado ÚNICAMENTE en datos reales (no en banners combinados)
  function trackColWidth(c, text) {
    if (!text || c >= totalCols) return;
    const len = String(text).length;
    if (len + 3 > colWidths[c]) {
      colWidths[c] = Math.min(len + 3, 38);
    }
  }

  function addMergedBanner(text, style, heightPt = 24) {
    for (let c = 0; c < totalCols; c++) {
      setCell(curRow, c, c === 0 ? text : '', style);
    }
    merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: totalCols - 1 } });
    rows.push({ hpt: heightPt });
    curRow++;
  }

  function addEmptyRow(heightPt = 12) {
    rows.push({ hpt: heightPt });
    curRow++;
  }

  // ==========================================
  // BLOQUE 1: MEMBRETE INSTITUCIONAL ELEGANTE
  // ==========================================
  addMergedBanner('LA NUEVA PARISIENNE • PANADERÍA & PASTELERÍA ARTESANAL C.A.', EXCEL_STYLES.companyTitle, 28);
  addMergedBanner('RIF: J-40123456-7 • Av. Lara con Calle 8, Barquisimeto • Sistema de Gestión Integral', EXCEL_STYLES.companySub, 18);
  addMergedBanner(`AUDITORÍA OFICIAL: ${String(title).toUpperCase()}`, EXCEL_STYLES.reportBadge, 24);
  addEmptyRow(10);

  // ==========================================
  // BLOQUE 2: FICHA DE METADATOS (2 FILAS)
  // ==========================================
  const metaA = ['Período Auditado:', periodo || 'Todos los registros', 'Fecha de Emisión:', fechaEmision];
  const metaB = ['Tasa Oficial BCV:', `Bs. ${Number(bcvRate).toFixed(2)} / USD`, 'Auditor Responsable:', `${activeUser.name || 'Juan Mendoza'} (${activeUser.role || 'Gerente'})`];

  [metaA, metaB].forEach(m => {
    setCell(curRow, 0, m[0], EXCEL_STYLES.metaLabel);
    setCell(curRow, 1, m[1], EXCEL_STYLES.metaVal);
    trackColWidth(0, m[0]);
    trackColWidth(1, m[1]);

    if (totalCols >= 4) {
      setCell(curRow, 2, m[2], EXCEL_STYLES.metaLabel);
      setCell(curRow, 3, m[3], EXCEL_STYLES.metaVal);
      trackColWidth(2, m[2]);
      trackColWidth(3, m[3]);

      for (let c = 4; c < totalCols; c++) setCell(curRow, c, '', EXCEL_STYLES.metaVal);
      if (totalCols > 4) merges.push({ s: { r: curRow, c: 3 }, e: { r: curRow, c: totalCols - 1 } });
    } else {
      // Si son pocas columnas, combinar en 2
      for (let c = 2; c < totalCols; c++) setCell(curRow, c, '', EXCEL_STYLES.metaVal);
      if (totalCols > 2) merges.push({ s: { r: curRow, c: 1 }, e: { r: curRow, c: totalCols - 1 } });
    }

    rows.push({ hpt: 19 });
    curRow++;
  });
  addEmptyRow(12);

  // ==========================================
  // BLOQUE 3: INDICADORES CLAVE (TARJETAS KPI)
  // ==========================================
  if (kpis && kpis.length > 0) {
    addMergedBanner('1. INDICADORES FINANCIEROS Y OPERATIVOS DEL PERÍODO', EXCEL_STYLES.sectionHeading, 22);
    addEmptyRow(6);

    // Distribuir tarjetas de manera proporcional a las columnas disponibles
    const numKpis = Math.min(kpis.length, totalCols);
    const colsPerKpi = Math.max(1, Math.floor(totalCols / numKpis));

    // Fila 1 de Tarjeta: Título del Indicador
    for (let i = 0; i < numKpis; i++) {
      const startC = i * colsPerKpi;
      const endC = (i === numKpis - 1) ? (totalCols - 1) : (startC + colsPerKpi - 1);
      for (let c = startC; c <= endC; c++) {
        setCell(curRow, c, c === startC ? kpis[i].label.toUpperCase() : '', EXCEL_STYLES.kpiLabel);
      }
      if (endC > startC) merges.push({ s: { r: curRow, c: startC }, e: { r: curRow, c: endC } });
    }
    rows.push({ hpt: 18 });
    curRow++;

    // Fila 2 de Tarjeta: Valor Principal ($)
    for (let i = 0; i < numKpis; i++) {
      const startC = i * colsPerKpi;
      const endC = (i === numKpis - 1) ? (totalCols - 1) : (startC + colsPerKpi - 1);
      for (let c = startC; c <= endC; c++) {
        setCell(curRow, c, c === startC ? kpis[i].val : '', EXCEL_STYLES.kpiVal);
      }
      if (endC > startC) merges.push({ s: { r: curRow, c: startC }, e: { r: curRow, c: endC } });
    }
    rows.push({ hpt: 26 });
    curRow++;

    // Fila 3 de Tarjeta: Subtítulo / Moneda Local (Bs.)
    for (let i = 0; i < numKpis; i++) {
      const startC = i * colsPerKpi;
      const endC = (i === numKpis - 1) ? (totalCols - 1) : (startC + colsPerKpi - 1);
      for (let c = startC; c <= endC; c++) {
        setCell(curRow, c, c === startC ? kpis[i].sub : '', EXCEL_STYLES.kpiSub);
      }
      if (endC > startC) merges.push({ s: { r: curRow, c: startC }, e: { r: curRow, c: endC } });
    }
    rows.push({ hpt: 18 });
    curRow++;

    addEmptyRow(12);
  }

  // ==========================================
  // BLOQUE 4: TABLAS DE DATOS AUDITADAS
  // ==========================================
  tables.forEach(tbl => {
    if (tbl.title) {
      addMergedBanner(tbl.title, EXCEL_STYLES.sectionHeading, 22);
      addEmptyRow(4);
    }

    // Encabezados
    const headers = tbl.headers || [];
    headers.forEach((h, c) => {
      setCell(curRow, c, h, EXCEL_STYLES.th);
      trackColWidth(c, h);
    });
    // Si la tabla tiene menos columnas que el total, rellenar encabezado
    for (let c = headers.length; c < totalCols; c++) {
      setCell(curRow, c, '', EXCEL_STYLES.th);
    }
    rows.push({ hpt: 24 });
    curRow++;

    // Filas de datos
    (tbl.rows || []).forEach((row, rIdx) => {
      const isZebra = rIdx % 2 === 1;

      // Si la fila es un mensaje vacío con colspan
      if (row.length === 1 && String(row[0]).length > 15) {
        for (let c = 0; c < totalCols; c++) {
          setCell(curRow, c, c === 0 ? row[0] : '', isZebra ? EXCEL_STYLES.tdCenterZebra : EXCEL_STYLES.tdCenter);
        }
        merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: totalCols - 1 } });
        rows.push({ hpt: 22 });
        curRow++;
        return;
      }

      row.forEach((val, c) => {
        const raw = String(val ?? '').trim();
        trackColWidth(c, raw);

        const isUsd = /^\$|USD/i.test(raw) || (headers[c] && /USD|\$/i.test(headers[c]));
        const isBs = /^Bs\.?/i.test(raw) || (headers[c] && /Bs/i.test(headers[c]));
        const numResult = parseUniversalNumber(raw);

        if (numResult !== null) {
          if (typeof numResult === 'object' && numResult.type === 'pct') {
            setCell(curRow, c, numResult.val, isZebra ? EXCEL_STYLES.tdNumberZebra : EXCEL_STYLES.tdNumber, 'n', '0.0%');
          } else if (isBs) {
            setCell(curRow, c, numResult, isZebra ? EXCEL_STYLES.tdMoneyBsZebra : EXCEL_STYLES.tdMoneyBs, 'n', '"Bs. "#,##0.00');
          } else if (isUsd) {
            setCell(curRow, c, numResult, isZebra ? EXCEL_STYLES.tdMoneyUsdZebra : EXCEL_STYLES.tdMoneyUsd, 'n', '"$"#,##0.00');
          } else {
            setCell(curRow, c, numResult, isZebra ? EXCEL_STYLES.tdNumberZebra : EXCEL_STYLES.tdNumber, 'n', '#,##0');
          }
        } else if (/^[A-Z0-9_-]{3,12}$/i.test(raw) || /^(ACTIVO|INACTIVO|OPTIMAL|PAGADO|CUADRADA|REGISTRADA)/i.test(raw)) {
          setCell(curRow, c, raw, isZebra ? EXCEL_STYLES.tdCenterZebra : EXCEL_STYLES.tdCenter);
        } else {
          setCell(curRow, c, raw, isZebra ? EXCEL_STYLES.tdTextZebra : EXCEL_STYLES.tdText);
        }
      });

      // Completar celdas si la fila tiene menos columnas que totalCols
      for (let c = row.length; c < totalCols; c++) {
        setCell(curRow, c, '', isZebra ? EXCEL_STYLES.tdTextZebra : EXCEL_STYLES.tdText);
      }
      rows.push({ hpt: 20 });
      curRow++;
    });

    // Fila de Totales
    if (tbl.footer && tbl.footer.length > 0) {
      tbl.footer.forEach((fVal, c) => {
        const raw = String(fVal ?? '').trim();
        trackColWidth(c, raw);

        const isUsd = /^\$|USD/i.test(raw) || (headers[c] && /USD|\$/i.test(headers[c]));
        const isBs = /^Bs\.?/i.test(raw) || (headers[c] && /Bs/i.test(headers[c]));
        const numResult = parseUniversalNumber(raw);

        if (c === 0 && !numResult) {
          setCell(curRow, c, raw || 'TOTALES GENERALES:', EXCEL_STYLES.tfootLabel);
        } else if (numResult !== null) {
          if (typeof numResult === 'object' && numResult.type === 'pct') {
            setCell(curRow, c, numResult.val, EXCEL_STYLES.tfootVal, 'n', '0.0%');
          } else if (isBs) {
            setCell(curRow, c, numResult, EXCEL_STYLES.tfootValBs, 'n', '"Bs. "#,##0.00');
          } else if (isUsd) {
            setCell(curRow, c, numResult, EXCEL_STYLES.tfootVal, 'n', '"$"#,##0.00');
          } else {
            setCell(curRow, c, numResult, EXCEL_STYLES.tfootVal, 'n', '#,##0');
          }
        } else {
          setCell(curRow, c, raw, EXCEL_STYLES.tfootVal);
        }
      });

      for (let c = tbl.footer.length; c < totalCols; c++) {
        setCell(curRow, c, '', EXCEL_STYLES.tfootVal);
      }
      rows.push({ hpt: 22 });
      curRow++;
    }

    addEmptyRow(14);
  });

  // ==========================================
  // BLOQUE 5: CERTIFICACIÓN Y FIRMAS
  // ==========================================
  addEmptyRow(6);
  addMergedBanner('CERTIFICACIÓN Y AUDITORÍA DE CONFORMIDAD', EXCEL_STYLES.sectionHeading, 20);
  addEmptyRow(22);

  // Centrar dos bloques de firma
  if (totalCols >= 4) {
    const endColLeft = Math.min(1, Math.floor(totalCols / 2) - 1);
    const startColRight = Math.max(endColLeft + 2, totalCols - 2);

    // Línea de firma 1
    for (let c = 0; c <= endColLeft; c++) setCell(curRow, c, c === 0 ? activeUser.name || 'Juan Mendoza' : '', EXCEL_STYLES.sigLine);
    if (endColLeft > 0) merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: endColLeft } });

    // Línea de firma 2
    for (let c = startColRight; c < totalCols; c++) setCell(curRow, c, c === startColRight ? 'Supervisión y Control Operativo' : '', EXCEL_STYLES.sigLine);
    if (totalCols - 1 > startColRight) merges.push({ s: { r: curRow, c: startColRight }, e: { r: curRow, c: totalCols - 1 } });
    rows.push({ hpt: 19 });
    curRow++;

    // Cargo 1
    for (let c = 0; c <= endColLeft; c++) setCell(curRow, c, c === 0 ? 'Gerencia General • La Nueva Parisienne' : '', EXCEL_STYLES.sigSub);
    if (endColLeft > 0) merges.push({ s: { r: curRow, c: 0 }, e: { r: curRow, c: endColLeft } });

    // Cargo 2
    for (let c = startColRight; c < totalCols; c++) setCell(curRow, c, c === startColRight ? 'Auditoría Interna • Revisión y Aprobación' : '', EXCEL_STYLES.sigSub);
    if (totalCols - 1 > startColRight) merges.push({ s: { r: curRow, c: startColRight }, e: { r: curRow, c: totalCols - 1 } });
    rows.push({ hpt: 17 });
    curRow++;
  }

  addEmptyRow(12);
  addMergedBanner('Documento confidencial para uso exclusivo de la dirección de La Nueva Parisienne Panadería & Pastelería Artesanal C.A.', EXCEL_STYLES.footerLegal, 16);

  // Meta del Worksheet
  ws['!ref'] = `A1:${numCol(totalCols - 1)}${curRow}`;
  ws['!merges'] = merges;
  ws['!rows'] = rows;
  ws['!cols'] = colWidths.map(w => ({ wch: Math.max(w, 14) }));
  ws['!views'] = [{ showGridLines: true }];

  const wb = window.XLSX.utils.book_new();
  const cleanTabName = (sheetName || title || 'Reporte').slice(0, 31).replace(/[\/\\\?\*\[\]:]/g, '');
  window.XLSX.utils.book_append_sheet(wb, ws, cleanTabName);

  // Guardar archivo nativo .xlsx
  if (typeof window.XLSX.writeFile === 'function') {
    window.XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  } else {
    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
  }
}
