/* ============================================================================
   LA NUEVA PARISIENNE - MÓDULO DE CIERRE DE CAJA (ARQUEO Y CORTE Z)
   - Operación de Caja (POS): Arqueo en vivo, Cuadre de Gaveta, Cierre Z Oficial
   - Gerencia (Dashboard): Consulta histórica y auditoría de cortes
   ============================================================================ */

import { SessionStore } from '../core/session-store.js';

const API_ROOT = '../api/reports/';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const money = (value) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(value || 0));
const num = (value) => Number(value || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

function currentSessionUser() {
  try { return SessionStore.getSession()?.user || {}; } catch { return {}; }
}

function normalizeReportRole(user = {}) {
  const code = String(user.roleCode || user.role_code || user.role || '').trim().toUpperCase();
  if (code.includes('SUPERADMIN') || code.includes('SUPER_ADMIN')) return 'SUPERADMIN';
  if (code.includes('ADMIN') || code.includes('MANAGER') || code.includes('GERENTE')) return 'ADMIN';
  if (code.includes('POS') || code.includes('CASHIER') || code.includes('CAJERO') || code.includes('CAJA')) return 'POS';
  const label = String(user.role || '').trim().toLowerCase();
  if (label.includes('superadmin')) return 'SUPERADMIN';
  if (label.includes('gerente') || label.includes('admin')) return 'ADMIN';
  if (label.includes('cajero') || label.includes('caja') || label.includes('pos') || label.includes('cashier')) return 'POS';
  return code || 'SUPERADMIN';
}

function sessionParams() {
  const user = currentSessionUser();
  const normRole = normalizeReportRole(user);
  return {
    user_id: user.id || (normRole === 'SUPERADMIN' ? 'usr_superadmin' : ''),
    role_code: normRole,
    user_name: user.name || (normRole === 'SUPERADMIN' ? 'Super Administrador' : 'María Elena Suárez'),
    shift: user.shift || ''
  };
}

function queryString(params) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString();
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor.' }));
  if (!response.ok && !data.code) throw new Error(data.message || 'No fue posible consultar el cierre.');
  return data;
}

function getBcvRate() {
  return parseFloat(localStorage.getItem('bcv_current_rate') || localStorage.getItem('tasa_auto') || localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 784.66;
}

// ============================================================================
// 1. CONTROLADOR EXCLUSIVO DE CIERRE DE CAJA (POS / CAJA)
// ============================================================================
function initPosCierreCaja() {
  const btnCierre = document.getElementById('btnCierreCaja') || document.getElementById('btnReportsView');
  const modal = document.getElementById('modalCierreCaja');
  if (!btnCierre || !modal) return;

  const btnCerrarModal = document.getElementById('btnCerrarModalCierre');
  const btnCancelar = document.getElementById('btnCancelarCierre');
  const btnImprimirX = document.getElementById('btnImprimirArqueoX');
  const btnConfirmarZ = document.getElementById('btnConfirmarCierreZ');

  const ticketModal = document.getElementById('modalTicketCierreZ');
  const btnCloseTicket = document.getElementById('btnCloseTicketCierreZ');
  const btnPrintTicket = document.getElementById('btnPrintTicketCierreZ');
  const btnFinalizarTurno = document.getElementById('btnFinalizarTurno');
  const ticketContent = document.getElementById('ticketCierreContent');

  const efectivoInput = document.getElementById('cierreEfectivoContadoInput');
  const badgeCuadre = document.getElementById('cierreBadgeCuadre');
  const textoCuadre = document.getElementById('cierreTextoCuadre');
  const detalleDiferencia = document.getElementById('cierreDetalleDiferencia');
  const obsInput = document.getElementById('cierreObservacionesInput');

  let currentClosureData = null;
  let currentBcvRate = getBcvRate();

  function updateCuadreDiff() {
    if (!currentClosureData || !efectivoInput) return;
    const esperado = Number(currentClosureData.summary?.monto_efectivo_esperado || 0);
    const contado = parseFloat(efectivoInput.value) || 0;
    const diferencia = Math.round((contado - esperado) * 100) / 100;

    if (badgeCuadre) {
      if (Math.abs(diferencia) < 0.01) {
        badgeCuadre.className = 'cuadre-badge match';
        badgeCuadre.innerHTML = `<i data-lucide="check-circle-2" class="icon-sm"></i> <span>Caja Cuadrada ($0.00)</span>`;
      } else if (diferencia > 0) {
        badgeCuadre.className = 'cuadre-badge over';
        badgeCuadre.innerHTML = `<i data-lucide="arrow-up-right" class="icon-sm"></i> <span>Sobrante: +$${diferencia.toFixed(2)} USD</span>`;
      } else {
        badgeCuadre.className = 'cuadre-badge short';
        badgeCuadre.innerHTML = `<i data-lucide="alert-triangle" class="icon-sm"></i> <span>Faltante: -$${Math.abs(diferencia).toFixed(2)} USD</span>`;
      }
      window.LucideIcons?.refresh();
    }

    if (detalleDiferencia) {
      detalleDiferencia.textContent = `Esperado: $${esperado.toFixed(2)} USD | Físico Contado: $${contado.toFixed(2)} USD`;
    }
  }

  if (efectivoInput) {
    efectivoInput.addEventListener('input', updateCuadreDiff);
  }

  async function openCierreModal() {
    currentBcvRate = getBcvRate();
    const user = currentSessionUser();
    const cashierName = user.name || document.getElementById('cashierName')?.textContent || 'María Elena Suárez';
    const shiftName = user.shift || 'Turno Mañana';

    const cajeroEl = document.getElementById('cierreCajeroNombre');
    const turnoEl = document.getElementById('cierreTurnoNombre');
    const fechaHoraEl = document.getElementById('cierreFechaHora');
    const tasaBcvEl = document.getElementById('cierreTasaBcv');

    if (cajeroEl) cajeroEl.textContent = cashierName;
    if (turnoEl) turnoEl.textContent = shiftName;
    if (fechaHoraEl) {
      fechaHoraEl.textContent = new Date().toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    if (tasaBcvEl) tasaBcvEl.textContent = `Bs. ${currentBcvRate.toFixed(2)} / USD`;

    const pagosTbody = document.getElementById('cierrePagosTbody');
    if (pagosTbody) {
      pagosTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #8C7868; padding: 1rem;"><i data-lucide="loader-2" class="icon-sm spin"></i> Consultando ventas del turno...</td></tr>';
      window.LucideIcons?.refresh();
    }

    modal.style.display = 'flex';
    modal.classList.add('active');

    try {
      const query = queryString({
        context: 'caja',
        date: today(),
        user_id: user.id || (normalizeReportRole(user) === 'SUPERADMIN' ? 'usr_superadmin' : ''),
        user_name: cashierName,
        role_code: normalizeReportRole(user),
        turno: shiftName,
        bcv_rate: currentBcvRate
      });

      const data = await getJson(`${API_ROOT}cierre_caja.php?${query}`);
      currentClosureData = data;

      const s = data.summary || {};
      const netUsd = Number(s.ventas_netas || 0);
      const netBs = netUsd * currentBcvRate;

      const kpiNetas = document.getElementById('cierreKpiVentasNetas');
      const kpiNetasBs = document.getElementById('cierreKpiVentasNetasBs');
      const kpiFacturas = document.getElementById('cierreKpiFacturas');
      const kpiEfectivo = document.getElementById('cierreKpiEfectivoEsperado');
      const kpiDescuentos = document.getElementById('cierreKpiDescuentos');

      if (kpiNetas) kpiNetas.textContent = `$${netUsd.toFixed(2)}`;
      if (kpiNetasBs) kpiNetasBs.textContent = `Bs. ${netBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`;
      if (kpiFacturas) kpiFacturas.textContent = String(s.facturas_emitidas || 0);
      if (kpiEfectivo) kpiEfectivo.textContent = `$${Number(s.monto_efectivo_esperado || 0).toFixed(2)}`;
      if (kpiDescuentos) kpiDescuentos.textContent = `$${Number(s.descuentos || 0).toFixed(2)}`;

      // Desglose de pagos
      if (pagosTbody) {
        const payments = data.payments || [];
        if (payments.length === 0) {
          pagosTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #8C7868; padding: 1.25rem;">No hay ventas registradas en este turno aún.</td></tr>';
        } else {
          let rowsHtml = payments.map(p => {
            const montoUsd = Number(p.monto || 0);
            const montoBs = montoUsd * currentBcvRate;
            return `<tr>
              <td><strong>${esc(p.metodo_pago)}</strong></td>
              <td style="text-align: center;">${num(p.transacciones)}</td>
              <td style="text-align: right; font-weight: 700; color: #78350F;">$${montoUsd.toFixed(2)}</td>
              <td style="text-align: right; color: #59483B;">Bs. ${montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>`;
          }).join('');

          rowsHtml += `<tfoot>
            <tr>
              <td><strong>TOTAL GENERAL</strong></td>
              <td style="text-align: center;"><strong>${num(s.facturas_emitidas || 0)}</strong></td>
              <td style="text-align: right; font-weight: 800; color: #78350F; font-size: 0.95rem;">$${netUsd.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 800; color: #2E241E;">Bs. ${netBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>`;

          pagosTbody.innerHTML = rowsHtml;
        }
      }

      // Input de efectivo
      if (efectivoInput) {
        efectivoInput.value = Number(s.monto_efectivo_esperado || 0).toFixed(2);
        updateCuadreDiff();
      }

      // Alerta de cierre previo
      const alertaPrevio = document.getElementById('cierreAlertaPrevio');
      const previoCodigo = document.getElementById('cierrePrevioCodigo');
      const previoHora = document.getElementById('cierrePrevioHora');
      const histList = document.getElementById('cierreHistoricoList');
      const histCount = document.getElementById('cierreHistoricoCount');

      const closures = data.closures || [];
      if (histCount) histCount.textContent = String(closures.length);

      if (closures.length > 0) {
        if (alertaPrevio) alertaPrevio.style.display = 'flex';
        if (previoCodigo) previoCodigo.textContent = closures[0].codigo_reporte || 'Z-OFICIAL';
        if (previoHora) {
          const gen = closures[0].generado_en || '';
          previoHora.textContent = gen.includes(' ') ? gen.split(' ')[1].slice(0, 5) : gen;
        }

        if (histList) {
          histList.innerHTML = closures.map(c => `
            <div class="cierre-hist-card">
              <div>
                <strong>${esc(c.codigo_reporte)}</strong> • <span>${esc(c.turno)}</span>
                <div style="font-size: 0.72rem; color: #8C7868;">${esc(c.generado_en)} • Total: $${Number(c.ventas_netas).toFixed(2)}</div>
              </div>
              <button type="button" class="cierre-hist-btn-view" data-cierre-id="${esc(c.id)}">Ver Comprobante</button>
            </div>
          `).join('');

          histList.querySelectorAll('.cierre-hist-btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
              const cid = btn.dataset.cierreId;
              const found = closures.find(item => item.id === cid);
              if (found) renderAndShowTicket(found, false);
            });
          });
        }
      } else {
        if (alertaPrevio) alertaPrevio.style.display = 'none';
        if (histList) histList.innerHTML = '<div style="font-size: 0.8rem; color: #8C7868; padding: 0.4rem;">No hay cierres anteriores registrados hoy.</div>';
      }

      window.LucideIcons?.refresh();
    } catch (err) {
      console.error('Error al cargar datos del cierre:', err);
      if (pagosTbody) {
        pagosTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #B91C1C; padding: 1rem;">No se pudieron cargar los datos del cierre: ${esc(err.message)}</td></tr>`;
      }
    }
  }

  function closeCierreModal() {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }

  function renderAndShowTicket(closure, isPreview = false) {
    if (!ticketContent || !ticketModal) return;

    const companyInfo = {
      nombre: 'LA NUEVA PARISIENNE C.A.',
      rif: 'J-40123456-7',
      direccion: 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara',
      telefono: '(0251) 555-1234'
    };

    const s = closure.summary || closure;
    const rate = Number(closure.tasa_bcv || currentBcvRate || 1);
    const netUsd = Number(s.ventas_netas || 0);
    const netBs = Number(closure.total_bs || (netUsd * rate));
    const code = closure.codigo_reporte || (isPreview ? 'CORTE-X-PRELIMINAR' : 'Z-' + Date.now());
    const dateFormatted = closure.generado_en || new Date().toLocaleString('es-VE');
    const cashier = closure.firma_cajero || document.getElementById('cashierName')?.textContent || 'María Elena Suárez';
    const shift = closure.turno || 'Turno Mañana';

    let payments = closure.payments || [];
    if (!payments.length && closure.detalle_pagos_json) {
      try { payments = JSON.parse(closure.detalle_pagos_json); } catch {}
    }

    ticketContent.innerHTML = `
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000000; text-align: left; line-height: 1.25; width: 100%; max-width: 76mm; margin: 0 auto;">
        <!-- ENCABEZADO FISCAL DE LA EMPRESA -->
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">
          <div style="font-size: 13px; text-transform: uppercase;">${companyInfo.nombre}</div>
          <div>RIF: ${companyInfo.rif}</div>
          <div style="font-size: 9px; font-weight: normal;">${companyInfo.direccion}</div>
          <div style="font-size: 9px; font-weight: normal;">Tel: ${companyInfo.telefono}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

        <!-- TÍTULO DEL CORTE FISCAL / OPERATIVO -->
        <div style="text-align: center; font-weight: bold;">
          <div style="font-size: 13px;">${isPreview ? '*** REPORTE DE ARQUEO (CORTE X) ***' : '*** COMPROBANTE OFICIAL CIERRE Z ***'}</div>
          <div style="font-size: 9px; font-weight: normal; margin-top: 2px;">${isPreview ? 'COMPROBANTE DE CONTROL INTERNO NO FISCAL' : 'DOCUMENTO DE CIERRE DEFINITIVO DE TURNO'}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

        <!-- METADATOS DEL REPORTE -->
        <div style="font-size: 10px;">
          <div><strong>CÓDIGO REPORTE:</strong> ${esc(code)}</div>
          <div><strong>FECHA / HORA:</strong> ${esc(dateFormatted)}</div>
          <div><strong>TERMINAL:</strong> POS-01 (Caja Principal)</div>
          <div><strong>CAJERO(A):</strong> ${esc(cashier)}</div>
          <div><strong>TURNO:</strong> ${esc(shift)}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

        <!-- RESUMEN DE VENTAS Y OPERACIONES -->
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">RESUMEN DE FACTURACIÓN:</div>
        <div style="font-size: 10px; line-height: 1.3;">
          <div style="display: flex; justify-content: space-between;">
            <span>VENTAS BRUTAS ($):</span>
            <span>$${Number(s.ventas_brutas || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>DESCUENTOS APLICADOS:</span>
            <span>-$${Number(s.descuentos || 0).toFixed(2)}</span>
          </div>
          ${Number(s.devoluciones || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span>DEVOLUCIONES / ANULACIONES:</span>
            <span>-$${Number(s.devoluciones || 0).toFixed(2)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
            <span>TOTAL VENTAS NETAS ($):</span>
            <span>$${netUsd.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL FACTURAS EMITIDAS:</span>
            <span>${s.facturas_emitidas || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>FACTURAS ANULADAS:</span>
            <span>${s.facturas_anuladas || 0}</span>
          </div>
        </div>

        <div style="border-top: 2px double #000; margin: 5px 0;"></div>

        <!-- CONVERSIÓN OFICIAL BCV -->
        <div style="text-align: center; padding: 4px; border: 1px solid #000; margin: 4px 0;">
          <div style="font-size: 9px; font-weight: bold;">TASA OFICIAL BCV APLICADA</div>
          <div style="font-size: 10px;">Bs. ${rate.toFixed(2)} / USD</div>
          <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">
            TOTAL NETO EN BS: Bs. ${netBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

        <!-- DESGLOSE POR FORMA DE PAGO -->
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">COBROS POR MEDIO DE PAGO:</div>
        <table style="width: 100%; font-size: 9.5px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">Método</th>
              <th style="text-align: center;">Op</th>
              <th style="text-align: right;">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length ? payments.map(p => `
              <tr>
                <td>${esc(p.metodo_pago)}</td>
                <td style="text-align: center;">${p.transacciones}</td>
                <td style="text-align: right;">$${Number(p.monto).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colspan="3" style="text-align: center;">Sin cobros en este turno</td></tr>'}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

        <!-- ARQUEO DE EFECTIVO -->
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">ARQUEO DE EFECTIVO EN CAJA:</div>
        <div style="font-size: 10px; line-height: 1.3;">
          <div style="display: flex; justify-content: space-between;">
            <span>EFECTIVO ESPERADO ($):</span>
            <span>$${Number(s.monto_efectivo_esperado || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>EFECTIVO FÍSICO CONTADO:</span>
            <span>$${Number(s.monto_efectivo_real ?? s.monto_efectivo_esperado ?? 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
            <span>DIFERENCIA / CUADRE:</span>
            <span>${Number(s.diferencia_efectivo || 0) === 0 ? 'CUADRADO ($0.00)' : (Number(s.diferencia_efectivo) > 0 ? 'SOBRANTE +$' + Number(s.diferencia_efectivo).toFixed(2) : 'FALTANTE -$' + Math.abs(Number(s.diferencia_efectivo)).toFixed(2))}</span>
          </div>
        </div>

        ${s.observaciones ? `
        <div style="border-top: 1px dotted #000; margin: 4px 0;"></div>
        <div style="font-size: 9px;">
          <strong>OBSERVACIONES:</strong> ${esc(s.observaciones)}
        </div>` : ''}

        <div style="border-top: 1px dashed #000; margin: 8px 0 4px;"></div>

        <!-- FIRMAS -->
        <div style="display: flex; justify-content: space-between; margin-top: 18px; font-size: 9px; text-align: center;">
          <div style="width: 45%; border-top: 1px solid #000; padding-top: 3px;">
            <strong>FIRMA CAJERO</strong><br>${esc(cashier)}
          </div>
          <div style="width: 45%; border-top: 1px solid #000; padding-top: 3px;">
            <strong>SUPERVISOR / GERENCIA</strong><br>V° B° Control
          </div>
        </div>

        <div style="text-align: center; margin-top: 12px; font-size: 8px;">
          <div>LA NUEVA PARISIENNE • SISTEMA DE GESTIÓN INTEGRAL</div>
          <div>Corte Z generado conforme a políticas internas.</div>
        </div>
      </div>
    `;

    ticketModal.style.display = 'flex';
    ticketModal.classList.add('active');
  }

  // EVENT LISTENERS
  btnCierre.addEventListener('click', openCierreModal);
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', closeCierreModal);
  if (btnCancelar) btnCancelar.addEventListener('click', closeCierreModal);

  // Imprimir Corte X preliminar
  if (btnImprimirX) {
    btnImprimirX.addEventListener('click', () => {
      if (!currentClosureData) return;
      const contado = parseFloat(efectivoInput?.value) || 0;
      const esperado = Number(currentClosureData.summary?.monto_efectivo_esperado || 0);
      const diff = Math.round((contado - esperado) * 100) / 100;
      const obs = obsInput?.value?.trim() || '';

      const xData = {
        ...currentClosureData,
        codigo_reporte: 'CORTE-X-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900),
        monto_efectivo_real: contado,
        diferencia_efectivo: diff,
        observaciones: obs,
        tasa_bcv: currentBcvRate,
        generado_en: new Date().toLocaleString('es-VE')
      };
      renderAndShowTicket(xData, true);
    });
  }

  // Confirmar Cierre Z definitivo
  if (btnConfirmarZ) {
    btnConfirmarZ.addEventListener('click', async () => {
      if (!currentClosureData) return;

      const user = currentSessionUser();
      const cashierName = user.name || document.getElementById('cashierName')?.textContent || 'María Elena Suárez';
      const shiftName = user.shift || 'Turno Mañana';
      const contado = parseFloat(efectivoInput?.value) || 0;
      const esperado = Number(currentClosureData.summary?.monto_efectivo_esperado || 0);
      const diff = Math.round((contado - esperado) * 100) / 100;
      const obs = obsInput?.value?.trim() || '';
      const hasData = currentClosureData.has_data;

      // Confirmaciones de seguridad
      if (!hasData) {
        if (!window.confirm('No hay ventas registradas en este turno. ¿Deseas sellar el Cierre de Caja (Z) de todos modos?')) {
          return;
        }
      } else if (Math.abs(diff) >= 0.01) {
        const msg = diff > 0
          ? `Existe un SOBRANTE de +$${diff.toFixed(2)} USD en efectivo.\n\n¿Deseas confirmar y sellar el Cierre Z con este valor?`
          : `Existe un FALTANTE de -$${Math.abs(diff).toFixed(2)} USD en efectivo.\n\n¿Deseas confirmar y sellar el Cierre Z con este valor?`;
        if (!window.confirm(msg)) {
          return;
        }
      } else {
        if (!window.confirm(`¿Confirmar y sellar el Cierre Z de Caja para el ${shiftName}?\n\nTotal Ventas: $${Number(currentClosureData.summary.ventas_netas).toFixed(2)} USD\nCajero: ${cashierName}`)) {
          return;
        }
      }

      btnConfirmarZ.disabled = true;
      btnConfirmarZ.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin"></i> Sellando Cierre Z...';
      window.LucideIcons?.refresh();

      try {
        const payload = {
          context: 'caja',
          action: 'generate',
          date: today(),
          user_id: user.id || (normalizeReportRole(user) === 'SUPERADMIN' ? 'usr_superadmin' : ''),
          user_name: cashierName,
          role_code: normalizeReportRole(user),
          turno: shiftName,
          tasa_bcv: currentBcvRate,
          monto_efectivo_real: contado,
          observaciones: obs,
          force: true,
          confirm_empty: true
        };

        const res = await getJson(`${API_ROOT}cierre_caja.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.success) {
          throw new Error(res.message || 'No fue posible registrar el Cierre Z en MySQL.');
        }

        // Guardar en histórico local y notificar canales
        try {
          const rawHist = localStorage.getItem('lnp_cierres_caja');
          const hist = rawHist ? JSON.parse(rawHist) : [];
          hist.unshift(res.closure);
          localStorage.setItem('lnp_cierres_caja', JSON.stringify(hist));

          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('lnp_cierres_channel');
            ch.postMessage({ type: 'cierre_generado', closure: res.closure });
          }
        } catch (e) {
          console.warn('Error guardando en localStorage lnp_cierres_caja:', e);
        }

        closeCierreModal();
        renderAndShowTicket(res.closure, false);
      } catch (err) {
        console.error('Error generando Cierre Z:', err);
        alert('Error al generar el Cierre Z: ' + err.message);
      } finally {
        btnConfirmarZ.disabled = false;
        btnConfirmarZ.innerHTML = '<i data-lucide="lock" class="icon-sm"></i> <span>Realizar Cierre de Caja (Z)</span>';
        window.LucideIcons?.refresh();
      }
    });
  }

  // Controles de modal de ticket
  if (btnCloseTicket) {
    btnCloseTicket.addEventListener('click', () => {
      ticketModal.style.display = 'none';
      ticketModal.classList.remove('active');
    });
  }

  if (btnPrintTicket) {
    btnPrintTicket.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnFinalizarTurno) {
    btnFinalizarTurno.addEventListener('click', () => {
      if (window.confirm('¿Deseas cerrar la sesión activa del cajero tras finalizar el turno?')) {
        SessionStore.logout();
      } else {
        ticketModal.style.display = 'none';
        ticketModal.classList.remove('active');
      }
    });
  }
}

// ============================================================================
// 2. CONTROLADOR GERENCIAL DE REPORTES DE CAJA (DASHBOARD)
// ============================================================================
function initManagerReports(section) {
  const root = section.querySelector('[id$="CashReportsApp"]') || section.firstElementChild;
  if (!root) return;

  root.innerHTML = `
    <div class="cash-reports-header">
      <div>
        <span class="cash-reports-eyebrow">DASHBOARD GERENCIAL</span>
        <h2><i data-lucide="folder" class="icon-sm"></i> Historial y Auditoría de Cierres de Caja</h2>
        <p>Cortes Z oficiales sellados por cajeros y turnos operativos</p>
      </div>
      <button type="button" id="btnRefreshManagerCierres" class="cash-reports-primary">
        <i data-lucide="refresh-cw" class="icon-xs"></i> Actualizar
      </button>
    </div>
    <div class="cash-reports-pane">
      <div id="managerCierresStatus" style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #6E5C50;"></div>
      <div id="managerCierresTableWrap" class="cash-reports-table-wrap">
        <table class="cash-reports-table">
          <thead>
            <tr>
              <th>Código Reporte</th>
              <th>Fecha Turno</th>
              <th>Turno</th>
              <th>Cajero / Firma</th>
              <th>Facturas</th>
              <th>Ventas Netas ($)</th>
              <th>Efectivo Esperado</th>
              <th>Efectivo Físico</th>
              <th>Diferencia</th>
              <th>Generado</th>
            </tr>
          </thead>
          <tbody id="managerCierresTbody">
            <tr><td colspan="10" style="text-align: center; padding: 1.5rem;">Cargando histórico de cierres...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  async function loadManagerCierres() {
    const tbody = root.querySelector('#managerCierresTbody');
    const status = root.querySelector('#managerCierresStatus');
    if (status) status.textContent = 'Consultando Cierres Z en base de datos...';

    try {
      const q = queryString({
        context: 'gerente',
        date_from: '2026-01-01',
        date_to: today(),
        ...sessionParams()
      });
      const data = await getJson(`${API_ROOT}cierre_caja.php?${q}`);
      const closures = data.closures || [];

      if (status) status.textContent = `Se encontraron ${closures.length} Cierres Z registrados.`;

      if (tbody) {
        if (!closures.length) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #8C7868;">No hay Cierres Z generados en el período consultado.</td></tr>';
        } else {
          tbody.innerHTML = closures.map(c => {
            const net = Number(c.ventas_netas || 0);
            const esp = Number(c.monto_efectivo_esperado || 0);
            const real = Number(c.monto_efectivo_real || 0);
            const diff = Number(c.diferencia_efectivo || 0);
            const diffText = diff === 0 ? '<span style="color:#047857; font-weight:700;">$0.00 (Cuadrada)</span>' : (diff > 0 ? `<span style="color:#B45309; font-weight:700;">+$${diff.toFixed(2)} (Sobrante)</span>` : `<span style="color:#B91C1C; font-weight:700;">-$${Math.abs(diff).toFixed(2)} (Faltante)</span>`);

            return `<tr>
              <td><strong><code>${esc(c.codigo_reporte)}</code></strong></td>
              <td>${esc(c.fecha_turno)}</td>
              <td>${esc(c.turno)}</td>
              <td>${esc(c.firma_cajero || 'Cajero')}</td>
              <td style="text-align: center;">${c.facturas_emitidas || 0}</td>
              <td style="font-weight: 700; color: #78350F;">$${net.toFixed(2)}</td>
              <td>$${esp.toFixed(2)}</td>
              <td>$${real.toFixed(2)}</td>
              <td>${diffText}</td>
              <td><small>${esc(c.generado_en)}</small></td>
            </tr>`;
          }).join('');
        }
      }
      window.LucideIcons?.refresh();
    } catch (err) {
      if (status) status.textContent = 'Error: ' + err.message;
      if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #B91C1C; padding: 1.5rem;">Error al consultar: ${esc(err.message)}</td></tr>`;
    }
  }

  root.querySelector('#btnRefreshManagerCierres')?.addEventListener('click', loadManagerCierres);
  loadManagerCierres();
}

function bindManagerNavigation() {
  const reportView = document.getElementById('cashReportsView');
  const reportButton = document.getElementById('navBtnCashReports');
  if (!reportView || !reportButton) return;
  const show = (active) => {
    const analytics = document.getElementById('analyticsView');
    const inventory = document.getElementById('inventoryView');
    if (active) {
      analytics?.classList.remove('active');
      if (analytics) analytics.style.display = 'none';
      inventory?.classList.remove('active');
      if (inventory) inventory.style.display = 'none';
      reportView.style.display = 'block';
    } else {
      reportView.style.display = 'none';
    }
    reportButton.classList.toggle('active', active);
  };
  reportButton.addEventListener('click', () => show(true));
  document.getElementById('navBtnAnalytics')?.addEventListener('click', () => show(false));
  document.getElementById('navBtnInventory')?.addEventListener('click', () => show(false));
}

// INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar en POS
  try { initPosCierreCaja(); } catch (e) { console.error('Error initPosCierreCaja:', e); }

  // Inicializar en Gerencia / Dashboard si existe
  document.querySelectorAll('.cash-reports-section[data-report-context="gerente"]').forEach(initManagerReports);
  bindManagerNavigation();
});
