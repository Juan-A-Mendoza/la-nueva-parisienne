import { SessionStore } from '../core/session-store.js';

const API_ROOT = '../api/reports/';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const money = (value) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(value || 0));
const num = (value) => Number(value || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

function normalizeReportRole(user = {}) {
  const code = String(user.roleCode || user.role_code || '').trim().toUpperCase();
  if (code.includes('ADMIN') || code.includes('MANAGER') || code.includes('GERENTE')) return 'ADMIN';
  if (code.includes('POS') || code.includes('CASHIER') || code.includes('CAJERO') || code.includes('CAJA')) return 'POS';
  const label = String(user.role || '').trim().toLowerCase();
  if (label.includes('gerente') || label.includes('admin')) return 'ADMIN';
  if (label.includes('cajero') || label.includes('caja') || label.includes('pos') || label.includes('cashier')) return 'POS';
  return code;
}

function currentSessionUser() {
  try { return SessionStore.getSession()?.user || {}; } catch (error) { return {}; }
}

function sessionParams() {
  const user = currentSessionUser();
  return { user_id: user.id || '', role_code: normalizeReportRole(user), user_name: user.name || '', shift: user.shift || '' };
}

function field(id, label, type = 'text', extra = '') {
  return `<label class="cash-reports-field"><span>${label}</span><input id="${id}" data-filter="${id}" type="${type}" ${extra}></label>`;
}

function selectField(id, label, placeholder) {
  return `<label class="cash-reports-field"><span>${label}</span><select id="${id}" data-filter="${id}"><option value="">${placeholder}</option></select></label>`;
}

function commonHeader(context) {
  return `<div class="cash-reports-header">
    <div><span class="cash-reports-eyebrow">${context === 'caja' ? 'MÓDULO CAJA' : 'DASHBOARD GERENCIAL'}</span>
    <h2>📂 Reportes de Caja</h2></div>
    ${context === 'caja' ? '<div class="cash-reports-header-actions"><button type="button" id="cashReportGenerateZ" class="cash-reports-primary">Generar Cierre</button><button type="button" id="cashReportClose" class="cash-reports-close" aria-label="Cerrar Reportes de Caja">Cerrar</button></div>' : '<span class="cash-reports-readonly">Solo lectura gerencial</span>'}
  </div>`;
}

function renderShell(root, context) {
  root.innerHTML = `${commonHeader(context)}
    <div class="cash-reports-tabs" role="tablist">
      <button type="button" class="cash-reports-tab active" data-report-tab="z">Cierre de Caja (Z)</button>
      <button type="button" class="cash-reports-tab" data-report-tab="detail">Detalle de Ventas y Cobros</button>
    </div>
    <section class="cash-reports-pane active" data-report-pane="z">
      <form class="cash-reports-filters" data-filter-form="z">
        ${context === 'caja' ? field('z_date', 'Fecha', 'date', `value="${today()}"`) + selectField('z_shift', 'Turno', 'Turno actual') : field('z_date_from', 'Fecha desde', 'date') + field('z_date_to', 'Fecha hasta', 'date') + selectField('z_box', 'Caja / punto de venta', 'Todas las cajas') + selectField('z_cashier', 'Cajero', 'Todos los cajeros') + selectField('z_shift', 'Turno', 'Todos los turnos')}
        <button type="submit" class="cash-reports-secondary">Consultar</button>
      </form>
      <div class="cash-reports-status" data-status="z" role="status"></div>
      <div data-output="z"></div>
    </section>
    <section class="cash-reports-pane" data-report-pane="detail" hidden>
      <div class="cash-reports-subtabs" role="tablist">
        <button type="button" class="cash-reports-subtab active" data-detail-tab="ventas">Ventas</button>
        <button type="button" class="cash-reports-subtab" data-detail-tab="cobros">Cobros</button>
      </div>
      <form class="cash-reports-filters" data-filter-form="detail">
        ${context === 'caja' ? field('d_date', 'Fecha', 'date', `value="${today()}"`) : field('d_date_from', 'Fecha desde', 'date') + field('d_date_to', 'Fecha hasta', 'date') + selectField('d_box', 'Caja / punto de venta', 'Todas las cajas') + selectField('d_cashier', 'Cajero', 'Todos los cajeros') + selectField('d_shift', 'Turno', 'Todos los turnos')}
        ${selectField('d_payment', 'Método de pago', 'Todos los métodos') + field('d_reference', 'Referencia / lote', 'text', 'placeholder="Buscar referencia"') + selectField('d_product', 'Producto', 'Todos los productos') + selectField('d_category', 'Categoría', 'Todas las categorías') + selectField('d_status', 'Estatus', 'Todos los estatus')}
        <button type="submit" class="cash-reports-secondary">Consultar</button>
      </form>
      <div class="cash-reports-status" data-status="detail" role="status"></div>
      <div data-output="detail"></div>
    </section>`;
}

function readFilters(root, mode, context, detailTab = 'ventas') {
  const params = { ...sessionParams(), context };
  if (mode === 'z') {
    if (context === 'caja') { params.date = root.querySelector('#z_date')?.value || today(); params.turno = root.querySelector('#z_shift')?.value || ''; }
    else { params.date_from = root.querySelector('#z_date_from')?.value || ''; params.date_to = root.querySelector('#z_date_to')?.value || ''; params.caja_id = root.querySelector('#z_box')?.value || ''; params.cajero_id = root.querySelector('#z_cashier')?.value || ''; params.turno = root.querySelector('#z_shift')?.value || ''; }
    return params;
  }
  params.tab = detailTab;
  if (context === 'caja') { params.date = root.querySelector('#d_date')?.value || today(); }
  else { params.date_from = root.querySelector('#d_date_from')?.value || ''; params.date_to = root.querySelector('#d_date_to')?.value || ''; params.caja_id = root.querySelector('#d_box')?.value || ''; params.cajero_id = root.querySelector('#d_cashier')?.value || ''; params.turno = root.querySelector('#d_shift')?.value || ''; }
  params.metodo_pago = root.querySelector('#d_payment')?.value || '';
  params.referencia_lote = root.querySelector('#d_reference')?.value || '';
  params.producto_id = root.querySelector('#d_product')?.value || '';
  params.categoria_id = root.querySelector('#d_category')?.value || '';
  params.estatus = root.querySelector('#d_status')?.value || '';
  return params;
}

function queryString(params) { return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString(); }

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor.' }));
  if (!response.ok && !data.code) throw new Error(data.message || 'No fue posible consultar el reporte.');
  return data;
}

function setStatus(root, mode, message = '', error = false) {
  const target = root.querySelector(`[data-status="${mode}"]`);
  if (target) { target.textContent = message; target.className = `cash-reports-status${error ? ' is-error' : ''}`; }
}

function populate(select, items, valueKey = 'value', labelKey = 'label') {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${select.options[0]?.textContent || 'Todos'}</option>` + (items || []).map(item => `<option value="${esc(item[valueKey])}">${esc(item[labelKey] ?? item.name ?? item[valueKey])}</option>`).join('');
  if ([...select.options].some(option => option.value === current)) select.value = current;
}

function loadCatalogs(root, context) {
  const query = queryString({ ...sessionParams(), context });
  return getJson(`${API_ROOT}catalogos.php?${query}`).then(data => {
    populate(root.querySelector('#z_box'), data.cajas);
    populate(root.querySelector('#d_box'), data.cajas);
    populate(root.querySelector('#z_cashier'), data.cajeros, 'id', 'nombre');
    populate(root.querySelector('#d_cashier'), data.cajeros, 'id', 'nombre');
    populate(root.querySelector('#z_shift'), data.turnos);
    populate(root.querySelector('#d_shift'), data.turnos);
    if (context === 'caja') {
      const currentShift = data.turno_actual || 'SIN TURNO';
      ['#z_shift', '#d_shift'].forEach(selector => {
        const select = root.querySelector(selector);
        if (select) { select.innerHTML = `<option value="${esc(currentShift)}">${esc(currentShift)}</option>`; select.value = currentShift; select.disabled = true; }
      });
    }
    populate(root.querySelector('#d_category'), data.categorias, 'id', 'name');
    populate(root.querySelector('#d_product'), data.productos, 'id', 'name');
    populate(root.querySelector('#d_payment'), data.metodos_pago);
    populate(root.querySelector('#d_status'), data.estatus);
  });
}

function summaryCard(label, value) { return `<div class="cash-reports-summary-card"><span>${label}</span><strong>${money(value)}</strong></div>`; }

function renderClosure(root, data) {
  const output = root.querySelector('[data-output="z"]');
  if (!data.has_data) { output.innerHTML = `<div class="cash-reports-empty">${esc(data.message || 'No hay información para mostrar')}</div>`; return; }
  const s = data.summary || {};
  const payments = data.payments || [];
  const closures = data.closures || [];
  output.innerHTML = `<div class="cash-reports-summary-grid">
      ${summaryCard('Ventas brutas', s.ventas_brutas)}${summaryCard('Descuentos', s.descuentos)}${summaryCard('Devoluciones', s.devoluciones)}${summaryCard('Ventas netas', s.ventas_netas)}${summaryCard('Efectivo esperado', s.monto_efectivo_esperado)}
    </div>
    <div class="cash-reports-two-col"><div class="cash-reports-table-wrap"><h3>Desglose por forma de pago</h3><table class="cash-reports-table"><thead><tr><th>Método</th><th>Transacciones</th><th>Monto</th></tr></thead><tbody>${payments.length ? payments.map(p => `<tr><td>${esc(p.metodo_pago)}</td><td>${num(p.transacciones)}</td><td>${money(p.monto)}</td></tr>`).join('') : '<tr><td colspan="3">No hay información para mostrar</td></tr>'}</tbody></table></div>
    <div class="cash-reports-signature"><h3>Facturación y firmas</h3><p>Facturas emitidas: <strong>${esc(s.facturas_emitidas || 0)}</strong></p><p>Facturas anuladas: <strong>${esc(s.facturas_anuladas || 0)}</strong></p><div class="cash-reports-sign-line">Cajero: ${esc(s.firma_cajero || 'Pendiente')}</div><div class="cash-reports-sign-line">Supervisor: ${esc(s.firma_supervisor || 'Pendiente')}</div></div></div>
    ${closures.length ? `<h3 class="cash-reports-section-title">Cierres históricos consultables</h3><div class="cash-reports-table-wrap"><table class="cash-reports-table"><thead><tr><th>Reporte</th><th>Fecha</th><th>Turno</th><th>Generado</th><th>Neto</th></tr></thead><tbody>${closures.map(c => `<tr><td>${esc(c.codigo_reporte)}</td><td>${esc(c.fecha_turno)}</td><td>${esc(c.turno)}</td><td>${esc(c.generado_en)}</td><td>${money(c.ventas_netas)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
}

function renderSales(root, data) {
  const output = root.querySelector('[data-output="detail"]');
  if (!data.has_data) { output.innerHTML = `<div class="cash-reports-empty">${esc(data.message || 'No hay información para mostrar')}</div>`; return; }
  const rows = data.rows || [], events = data.events || [];
  output.innerHTML = `<div class="cash-reports-summary-grid">${summaryCard('Transacciones', data.totals?.transacciones || 0)}${summaryCard('Subtotal', data.totals?.subtotal || 0)}${summaryCard('Descuentos', data.totals?.descuentos || 0)}${summaryCard('Impuestos', data.totals?.impuestos || 0)}${summaryCard('Total', data.totals?.total || 0)}</div>
    <div class="cash-reports-table-wrap"><table class="cash-reports-table"><thead><tr><th>Factura / fecha</th><th>Producto</th><th>Categoría</th><th>Cajero / turno</th><th>Estatus</th><th>Descuento</th><th>Impuesto</th><th>Total</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.codigo)}<small>${esc(r.fecha_hora)}</small></td><td>${esc(r.producto || 'Venta sin detalle')}</td><td>${esc(r.categoria)}</td><td>${esc(r.cajero)}<small>${esc(r.turno)}</small></td><td>${esc(r.estatus)}</td><td>${money(r.descuento)}</td><td>${money(r.iva)}</td><td>${money(r.total)}</td></tr>`).join('')}</tbody></table></div>
    ${events.length ? `<h3 class="cash-reports-section-title">Anulaciones y devoluciones</h3><div class="cash-reports-table-wrap"><table class="cash-reports-table"><thead><tr><th>Factura</th><th>Evento</th><th>Fecha</th><th>Monto</th><th>Referencia</th><th>Motivo</th></tr></thead><tbody>${events.map(e => `<tr><td>${esc(e.codigo)}</td><td>${esc(e.tipo_evento)}</td><td>${esc(e.fecha_hora)}</td><td>${money(e.monto)}</td><td>${esc(e.referencia_lote)}</td><td>${esc(e.motivo)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <h3 class="cash-reports-section-title">Totales por categoría</h3><div class="cash-reports-table-wrap"><table class="cash-reports-table"><thead><tr><th>Categoría</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>${(data.category_totals || []).map(c => `<tr><td>${esc(c.categoria)}</td><td>${num(c.cantidad)}</td><td>${money(c.total)}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderPayments(root, data) {
  const output = root.querySelector('[data-output="detail"]');
  if (!data.has_data) { output.innerHTML = `<div class="cash-reports-empty">${esc(data.message || 'No hay información para mostrar')}</div>`; return; }
  output.innerHTML = `<div class="cash-reports-summary-grid">${summaryCard('Transacciones', data.totals?.transacciones || 0)}${summaryCard('Monto por canal', data.totals?.monto_canal || 0)}${summaryCard('Monto según sistema', data.totals?.monto_sistema || 0)}${summaryCard('Diferencia total', data.totals?.diferencia || 0)}</div><div class="cash-reports-table-wrap"><table class="cash-reports-table"><thead><tr><th>Método</th><th>Transacciones</th><th>Referencia / lote</th><th>Monto por canal</th><th>Monto sistema</th><th>Diferencia</th></tr></thead><tbody>${(data.groups || []).map(g => `<tr><td>${esc(g.metodo_pago)}</td><td>${num(g.transacciones)}</td><td>${esc(g.referencias || 'No especificada')}</td><td>${money(g.monto_canal)}</td><td>${money(g.monto_sistema)}</td><td>${money(g.diferencia)}</td></tr>`).join('')}</tbody></table></div>`;
}

function showDuplicateClosureDialog(data) {
  return new Promise(resolve => {
    const closure = data.closure || {};
    const overlay = document.createElement('div');
    overlay.className = 'cash-reports-dialog-backdrop';
    overlay.innerHTML = `<div class="cash-reports-dialog" role="dialog" aria-modal="true" aria-labelledby="cashReportDuplicateTitle">
      <div class="cash-reports-dialog-icon">✓</div>
      <h3 id="cashReportDuplicateTitle">Este turno ya fue cerrado</h3>
      <p>Ya existe un Cierre Z registrado para este turno. No se puede generar otro cierre duplicado.</p>
      <div class="cash-reports-dialog-details">
        <span><small>Reporte</small><strong>${esc(closure.codigo_reporte || 'Cierre Z registrado')}</strong></span>
        <span><small>Generado</small><strong>${esc(closure.generado_en || 'Fecha no disponible')}</strong></span>
      </div>
      <div class="cash-reports-dialog-actions">
        <button type="button" class="cash-reports-dialog-cancel">Cancelar</button>
        <button type="button" class="cash-reports-dialog-view">Ver cierre existente</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const finish = value => { overlay.remove(); resolve(value); };
    overlay.querySelector('.cash-reports-dialog-cancel')?.addEventListener('click', () => finish(false));
    overlay.querySelector('.cash-reports-dialog-view')?.addEventListener('click', () => finish(true));
    overlay.addEventListener('click', event => { if (event.target === overlay) finish(false); });
    overlay.querySelector('.cash-reports-dialog-view')?.focus();
  });
}

function initReportSection(section) {
  const root = section.querySelector('[id$="CashReportsApp"]') || section.firstElementChild;
  const context = section.dataset.reportContext || 'caja';
  const role = normalizeReportRole(currentSessionUser());
  const openCajaReports = document.getElementById('btnOpenCashReports');
  const allowed = context === 'caja' ? role === 'POS' : role === 'ADMIN';
  if (!allowed && role) {
    section.hidden = false;
    const app = section.querySelector('[id$="CashReportsApp"]') || section.firstElementChild;
    app.innerHTML = `<div class="cash-reports-role-warning"><strong>Reportes no disponibles para esta sesión.</strong><span>Sesión detectada: ${esc(role)}. Ingrese con un usuario de ${context === 'caja' ? 'Caja / POS' : 'Gerencia / ADMIN'}.</span></div>`;
    if (openCajaReports) openCajaReports.hidden = false;
    return;
  }
  if (context === 'caja' && openCajaReports) {
    openCajaReports.hidden = false;
    openCajaReports.addEventListener('click', () => {
      section.hidden = false;
      document.body.classList.add('cash-reports-open');
    });
  }
  renderShell(root, context);
  root.querySelector('#cashReportClose')?.addEventListener('click', () => {
    section.hidden = true;
    document.body.classList.remove('cash-reports-open');
  });
  let detailTab = 'ventas';
  const syncDetailFilters = () => {
    if (context !== 'caja') return;
    const paymentFields = ['#d_payment', '#d_reference'];
    const salesFields = ['#d_product', '#d_category'];
    paymentFields.forEach(selector => { const input = root.querySelector(selector); if (input) { input.parentElement.style.display = detailTab === 'ventas' ? 'none' : ''; if (detailTab === 'ventas') input.value = ''; } });
    salesFields.forEach(selector => { const input = root.querySelector(selector); if (input) { input.parentElement.style.display = detailTab === 'cobros' ? 'none' : ''; if (detailTab === 'cobros') input.value = ''; } });
  };
  syncDetailFilters();
  loadCatalogs(root, context).catch(error => setStatus(root, 'z', error.message, true));

  const runZ = async () => {
    setStatus(root, 'z', 'Consultando…');
    try { const data = await getJson(`${API_ROOT}cierre_caja.php?${queryString(readFilters(root, 'z', context))}`); renderClosure(root, data); setStatus(root, 'z', data.message || ''); }
    catch (error) { setStatus(root, 'z', error.message, true); }
  };
  const runDetail = async () => {
    setStatus(root, 'detail', 'Consultando…');
    try { const data = await getJson(`${API_ROOT}ventas_cobros.php?${queryString(readFilters(root, 'detail', context, detailTab))}`); if (detailTab === 'ventas') renderSales(root, data); else renderPayments(root, data); setStatus(root, 'detail', data.message || ''); }
    catch (error) { setStatus(root, 'detail', error.message, true); }
  };
  root.querySelector('[data-filter-form="z"]').addEventListener('submit', event => { event.preventDefault(); runZ(); });
  root.querySelector('[data-filter-form="detail"]').addEventListener('submit', event => { event.preventDefault(); runDetail(); });
  root.querySelectorAll('[data-report-tab]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-report-tab]').forEach(item => item.classList.toggle('active', item === button));
    root.querySelectorAll('[data-report-pane]').forEach(pane => { const active = pane.dataset.reportPane === button.dataset.reportTab; pane.hidden = !active; pane.classList.toggle('active', active); });
    if (button.dataset.reportTab === 'z') runZ(); else runDetail();
  }));
  root.querySelectorAll('[data-detail-tab]').forEach(button => button.addEventListener('click', () => {
    detailTab = button.dataset.detailTab;
    root.querySelectorAll('[data-detail-tab]').forEach(item => item.classList.toggle('active', item === button));
    syncDetailFilters();
    runDetail();
  }));
  root.querySelector('#cashReportGenerateZ')?.addEventListener('click', async () => {
    const filters = readFilters(root, 'z', context);
    const request = async (confirmEmpty = false) => getJson(`${API_ROOT}cierre_caja.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...filters, action: 'generate', confirm_empty: confirmEmpty }) });
    setStatus(root, 'z', 'Generando y sellando cierre…');
    try {
      let data = await request(false);
      if (data.code === 'CONFIRM_EMPTY') { if (!window.confirm('No hay ventas. ¿Deseas cerrar turno igual?')) { setStatus(root, 'z', 'Cierre cancelado.'); return; } data = await request(true); }
      if (!data.success && data.code === 'ALREADY_CLOSED') {
        const consultExisting = await showDuplicateClosureDialog(data);
        if (consultExisting) await runZ();
        else setStatus(root, 'z', 'No se generó un nuevo cierre para este turno.');
        return;
      }
      if (!data.success) throw new Error(data.message || 'No fue posible generar el cierre.');
      renderClosure(root, { ...data, has_data: true, summary: data.closure, closures: [] }); setStatus(root, 'z', data.message || 'Cierre Z generado.');
    } catch (error) { setStatus(root, 'z', error.message, true); }
  });
  runZ();
}

function bindManagerNavigation() {
  const reportView = document.getElementById('cashReportsView');
  const reportButton = document.getElementById('navBtnCashReports');
  if (!reportView || !reportButton) return;
  const show = (active) => {
    const analytics = document.getElementById('analyticsView');
    const inventory = document.getElementById('inventoryView');
    if (active) { analytics?.classList.remove('active'); if (analytics) analytics.style.display = 'none'; inventory?.classList.remove('active'); if (inventory) inventory.style.display = 'none'; reportView.style.display = 'block'; }
    else { reportView.style.display = 'none'; }
    reportButton.classList.toggle('active', active);
  };
  reportButton.addEventListener('click', () => show(true));
  document.getElementById('navBtnAnalytics')?.addEventListener('click', () => show(false));
  document.getElementById('navBtnInventory')?.addEventListener('click', () => show(false));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cash-reports-section').forEach(initReportSection);
  bindManagerNavigation();
});
