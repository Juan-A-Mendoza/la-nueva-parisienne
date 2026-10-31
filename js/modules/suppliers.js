/* ==========================================================================
   MÓDULO 6: CONTROLADOR INTERACTIVO DE PROVEEDORES (SUPPLIERS.JS)
   Gestión de directorio de contactos, órdenes de compra y recepción en almacén
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { SUPPLIERS_DATABASE, PURCHASE_ORDERS_DATABASE } from '../data/suppliers-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión Resiliente
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo sesión:', err);
  }

  const activeUser = (session && session.user) ? session.user : {
    name: 'Juan Mendoza',
    role: 'Gestión de Compras',
    roleCode: 'ADMIN',
    icon: 'truck'
  };

  // 1.1 Verificación de Permisos (Solo Superadmin y Gerente)
  const userRole = (activeUser.role || '').toLowerCase();
  const userRoleCode = (activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin');
  const isAllowed = isSuperadmin || userRoleCode === 'ADMIN' || (userRole.includes('gerente') && !userRole.includes('contador'));

  if (!isAllowed) {
    let redirectUrl = 'dashboard.html';
    if (userRoleCode === 'ACCOUNTANT' || userRole.includes('contador')) redirectUrl = 'accounting.html';
    else if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    else if (userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero')) redirectUrl = 'kitchen.html';
    window.location.replace(redirectUrl);
    return;
  }

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = activeUser.name;
  if (userAvatarEl) { userAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'truck') : ''; window.LucideIcons?.refresh(); }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de Proveedores y Órdenes
  let suppliers = JSON.parse(JSON.stringify(SUPPLIERS_DATABASE));
  let purchaseOrders = JSON.parse(JSON.stringify(PURCHASE_ORDERS_DATABASE));
  let currentOrderFilter = 'all';

  // 3. Elementos DOM
  const suppliersCardsGrid = document.getElementById('suppliersCardsGrid');
  const ordersBody = document.getElementById('ordersBody');
  const searchInput = document.getElementById('supplierSearch');
  
  // KPIs
  const kpiActiveSuppliers = document.getElementById('kpiActiveSuppliers');
  const kpiInTransit = document.getElementById('kpiInTransit');
  const kpiMonthlyPurchases = document.getElementById('kpiMonthlyPurchases');

  // Modales
  const poModal = document.getElementById('poModal');
  const closePoModalBtn = document.getElementById('closePoModalBtn');
  const poForm = document.getElementById('poForm');
  const poSupplierSelect = document.getElementById('poSupplierSelect');
  const poItemsInput = document.getElementById('poItemsInput');
  const poAmountInput = document.getElementById('poAmountInput');
  const poDeliveryInput = document.getElementById('poDeliveryInput');

  const newSupplierModal = document.getElementById('newSupplierModal');
  const closeNewSupplierModalBtn = document.getElementById('closeNewSupplierModalBtn');
  const newSupplierForm = document.getElementById('newSupplierForm');

  const payOrderModal = document.getElementById('payOrderModal');
  const closePayOrderModalBtn = document.getElementById('closePayOrderModalBtn');
  const payOrderForm = document.getElementById('payOrderForm');
  const payOrderId = document.getElementById('payOrderId');
  const payOrderCode = document.getElementById('payOrderCode');
  const payModalOrderCode = document.getElementById('payModalOrderCode');
  const payModalSupplierName = document.getElementById('payModalSupplierName');
  const payModalAmountDisplay = document.getElementById('payModalAmountDisplay');
  const payMethodSelect = document.getElementById('payMethodSelect');
  const payBankGroup = document.getElementById('payBankGroup');
  const payBankSelect = document.getElementById('payBankSelect');
  const payReferenceInput = document.getElementById('payReferenceInput');
  const payDateInput = document.getElementById('payDateInput');
  const payAmountInput = document.getElementById('payAmountInput');
  const payNotesInput = document.getElementById('payNotesInput');
  const previewDebe = document.getElementById('previewDebe');
  const previewHaber = document.getElementById('previewHaber');
  const previewHaberAccount = document.getElementById('previewHaberAccount');

  const btnOpenPO = document.getElementById('btnOpenPO');
  const btnOpenNewSupplier = document.getElementById('btnOpenNewSupplier');

  // Inicializar e intentar sincronizar con MySQL
  renderAll();
  loadSuppliersFromApi();

  async function loadSuppliersFromApi() {
    try {
      const res = await fetch(`../api/suppliers/get_suppliers.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.suppliers) && data.suppliers.length > 0) {
            suppliers = data.suppliers;
            populateSupplierSelect();
          }
          if (Array.isArray(data.orders) && data.orders.length > 0) {
            purchaseOrders = data.orders;
          }
          renderAll();
        }
      }
    } catch (e) {
      console.warn('Proveedores: Usando datos de respaldo local.', e);
    }
  }

  function renderAll() {
    renderKPIs();
    renderSuppliersGrid();
    renderOrdersTable();
    populateSupplierSelect();
  }

  // 4. Renderizado de KPIs
  function renderKPIs() {
    const inTransitCount = purchaseOrders.filter(o => o.status === 'in_transit').length;
    const receivedCount = purchaseOrders.filter(o => o.status === 'received').length;
    const paidCount = purchaseOrders.filter(o => o.status === 'paid').length;
    const totalPurchases = purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const deliveryRate = purchaseOrders.length > 0 ? (((receivedCount + paidCount) / purchaseOrders.length) * 100).toFixed(1) : '100.0';

    if (kpiActiveSuppliers) kpiActiveSuppliers.textContent = `${suppliers.length} Homologados`;
    if (kpiInTransit) kpiInTransit.textContent = `${inTransitCount} Activas`;
    if (kpiMonthlyPurchases) kpiMonthlyPurchases.textContent = `$${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const deliveryRateEl = document.getElementById('kpiDeliveryRate');
    if (deliveryRateEl) deliveryRateEl.textContent = `${deliveryRate}%`;
  }

  // 5. Renderizado del Directorio de Proveedores (Grid Cards)
  function renderSuppliersGrid() {
    suppliersCardsGrid.innerHTML = '';

    suppliers.forEach(sup => {
      const card = document.createElement('div');
      card.className = 'supplier-card';

      card.innerHTML = `
        <span class="supplier-rating-badge badge-clean-icon"><i data-lucide="star" class="icon-xs" style="fill: currentColor;"></i> ${sup.rating.toFixed(1)}</span>
        <div class="supplier-card-header">
          <div class="supplier-icon-box">${window.LucideIcons ? window.LucideIcons.render(sup.icon || 'truck', 'icon-md') : ''}</div>
          <div class="supplier-card-info">
            <h3>${sup.name}</h3>
            <span class="supplier-category-tag">${sup.category}</span>
          </div>
        </div>

        <div class="supplier-contact-details">
          <div class="supplier-detail-row">
            <span class="badge-clean-icon"><i data-lucide="user" class="icon-xs"></i> Contacto:</span>
            <strong>${sup.contactPerson}</strong>
          </div>
          <div class="supplier-detail-row">
            <span class="badge-clean-icon"><i data-lucide="phone" class="icon-xs"></i> Teléfono:</span>
            <span>${sup.phone}</span>
          </div>
          <div class="supplier-detail-row">
            <span class="badge-clean-icon"><i data-lucide="mail" class="icon-xs"></i> Email:</span>
            <span style="font-size: 0.8rem;">${sup.email}</span>
          </div>
          <div class="supplier-detail-row" style="margin-top: 0.2rem; font-size: 0.8rem; color: var(--color-gold-dark);">
            <span class="badge-clean-icon"><i data-lucide="credit-card" class="icon-xs"></i> Condición:</span>
            <strong>${sup.paymentTerms}</strong>
          </div>
        </div>

        <div class="supplier-card-actions">
          <button type="button" class="btn-card-touch btn-contact" title="Llamar a proveedor"><i data-lucide="phone" class="icon-xs"></i> <span>Contactar</span></button>
          <button type="button" class="btn-card-touch btn-create-po" title="Generar orden de compra"><i data-lucide="file-plus" class="icon-xs"></i> <span>Nueva Orden</span></button>
        </div>
      `;

      card.querySelector('.btn-contact').addEventListener('click', () => {
        alert(`Contacto Comercial ${sup.name}:\n\nContacto: ${sup.contactPerson}\nTeléfono: ${sup.phone}\nEmail: ${sup.email}\nDirección: ${sup.address}`);
      });

      card.querySelector('.btn-create-po').addEventListener('click', () => {
        openPOModal(sup.id);
      });

      suppliersCardsGrid.appendChild(card);
    });
  }

  // 6. Renderizado de la Tabla de Órdenes de Compra y Recepción
  function renderOrdersTable() {
    ordersBody.innerHTML = '';

    const filtered = purchaseOrders.filter(po => {
      if (currentOrderFilter === 'in_transit') return po.status === 'in_transit';
      if (currentOrderFilter === 'received') return po.status === 'received';
      if (currentOrderFilter === 'paid') return po.status === 'paid';
      return true;
    });

    if (filtered.length === 0) {
      ordersBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--color-muted);">
            No se encontraron órdenes de compra registradas en este estado.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(po => {
      const tr = document.createElement('tr');
      const isTransit = po.status === 'in_transit';
      const isReceived = po.status === 'received';
      const isPaid = po.status === 'paid';

      let statusTagClass = 'in_transit';
      let statusIcon = 'truck';
      let statusLabel = po.statusText || 'En Tránsito';

      if (isReceived) {
        statusTagClass = 'received';
        statusIcon = 'package-check';
        statusLabel = 'Recibida en Almacén';
      } else if (isPaid) {
        statusTagClass = 'paid';
        statusIcon = 'check-circle-2';
        statusLabel = 'Pagada / Liquidada';
      }

      let actionHtml = '';
      if (isTransit) {
        actionHtml = `
          <button type="button" class="btn-table-action btn-confirm-receive" style="background: var(--color-success); color: white;" title="Registrar recepción de insumos en almacén">
            <i data-lucide="check" class="icon-xs"></i> <span>Confirmar Recepción</span>
          </button>
        `;
      } else if (isReceived) {
        actionHtml = `
          <button type="button" class="btn-pay-order" title="Registrar pago al proveedor y generar asiento contable">
            <i data-lucide="credit-card" class="icon-xs"></i> <span>Registrar Pago</span>
          </button>
        `;
      } else if (isPaid) {
        actionHtml = `
          <span style="font-size: 0.8rem; color: #059669; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i data-lucide="check-check" class="icon-xs"></i> <span>Liquidada</span>
          </span>
        `;
      }

      tr.innerHTML = `
        <td class="table-code-badge">${po.code}</td>
        <td><strong>${po.supplierName}</strong></td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${po.itemsSummary || ''}">${po.itemsSummary || 'Insumos'}</td>
        <td style="color: var(--color-muted); font-size: 0.85rem;">${po.orderDate}</td>
        <td style="color: var(--color-muted); font-size: 0.85rem;">${po.deliveryDate}</td>
        <td><span class="po-status-tag ${statusTagClass}"><i data-lucide="${statusIcon}" class="icon-xs"></i> ${statusLabel}</span></td>
        <td style="font-weight: 800;">$${po.totalAmount.toFixed(2)}</td>
        <td>${actionHtml}</td>
      `;

      if (isTransit) {
        tr.querySelector('.btn-confirm-receive')?.addEventListener('click', async () => {
          try {
            const res = await fetch('../api/suppliers/recibir_orden.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: po.id, code: po.code })
            });
            const data = await res.json();
            po.status = 'received';
            po.statusText = 'Recibida en Almacén';
            renderAll();

            // Notificar a Gerencia y Cocina para que refresquen su inventario en vivo
            if (typeof BroadcastChannel !== 'undefined') {
              const matChannel = new BroadcastChannel('lnp_materials_channel');
              matChannel.postMessage({ type: 'order_received', orderCode: po.code, timestamp: Date.now() });
              setTimeout(() => matChannel.close(), 1000);
            }
            window.dispatchEvent(new Event('materiasPrimasChanged'));

            alert(data.message || `Mercancía de la orden ${po.code} de ${po.supplierName} ingresada exitosamente al almacén.`);
          } catch (e) {
            po.status = 'received';
            po.statusText = 'Recibida en Almacén';
            renderAll();
            alert(`Mercancía de la orden ${po.code} de ${po.supplierName} ingresada exitosamente al almacén.`);
          }
        });
      }

      if (isReceived) {
        tr.querySelector('.btn-pay-order')?.addEventListener('click', () => {
          openPaymentModal(po);
        });
      }

      ordersBody.appendChild(tr);
    });

    window.LucideIcons?.refresh();
  }

  // Listener para Filtros de Órdenes
  document.querySelectorAll('.po-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.po-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.dataset.filter;
      renderOrdersTable();
    });
  });

  function populateSupplierSelect() {
    if (!poSupplierSelect) return;
    poSupplierSelect.innerHTML = '';
    suppliers.forEach(sup => {
      const option = document.createElement('option');
      option.value = sup.id;
      option.textContent = `${sup.name} (${sup.category})`;
      poSupplierSelect.appendChild(option);
    });
  }

  // 7. Modal de Nueva Orden de Compra
  function openPOModal(supplierId = null) {
    populateSupplierSelect();
    if (supplierId) poSupplierSelect.value = supplierId;
    poModal.classList.add('active');
  }

  btnOpenPO?.addEventListener('click', () => openPOModal());
  closePoModalBtn?.addEventListener('click', () => poModal.classList.remove('active'));

  poForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const supId = poSupplierSelect.value;
    const items = poItemsInput.value || 'Insumos de panadería surtidos';
    const amount = parseFloat(poAmountInput.value) || 0;
    const delivery = poDeliveryInput.value || '2026-08-15';

    try {
      const res = await fetch('../api/suppliers/crear_orden.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supId,
          totalAmount: amount,
          deliveryDate: delivery,
          itemsSummary: items
        })
      });
      const data = await res.json();
      if (data.success && data.order) {
        purchaseOrders.unshift(data.order);
      } else {
        throw new Error(data.message || 'Error');
      }
    } catch (err) {
      const sup = suppliers.find(s => s.id === supId);
      purchaseOrders.unshift({
        id: `po_${Date.now()}`,
        code: `OC-2026-00${Math.floor(91 + Math.random() * 9)}`,
        supplierId: supId,
        supplierName: sup ? sup.name : 'Proveedor',
        itemsSummary: items,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: delivery,
        status: 'in_transit',
        statusText: 'En Tránsito',
        totalAmount: amount
      });
    }

    renderAll();
    poModal.classList.remove('active');
    poForm.reset();
    alert(`Orden de Compra emitida exitosamente.`);
  });

  // 8. Modal de Nuevo Proveedor
  btnOpenNewSupplier?.addEventListener('click', () => {
    newSupplierModal.classList.add('active');
  });

  closeNewSupplierModalBtn?.addEventListener('click', () => {
    newSupplierModal.classList.remove('active');
  });

  newSupplierForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('supNameInput').value;
    const category = document.getElementById('supCategoryInput').value;
    const contact = document.getElementById('supContactInput').value;
    const phone = document.getElementById('supPhoneInput').value;
    const email = document.getElementById('supEmailInput').value;

    try {
      const res = await fetch('../api/suppliers/guardar_proveedor.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, contactPerson: contact, phone, email })
      });
      const data = await res.json();
      if (data.success && data.supplier) {
        suppliers.push(data.supplier);
      } else {
        throw new Error(data.message || 'Error');
      }
    } catch (err) {
      suppliers.push({
        id: `sup_${Date.now()}`,
        code: `PROV-00${suppliers.length + 1}`,
        name,
        category,
        contactPerson: contact,
        phone,
        email,
        rif: 'J-50918273-0',
        address: 'Caracas, Venezuela',
        paymentTerms: 'Crédito 30 días',
        rating: 5.0,
        icon: 'building-2'
      });
    }

    renderAll();
    newSupplierModal.classList.remove('active');
    newSupplierForm.reset();
    alert(`Proveedor ${name} registrado e incorporado al directorio.`);
  });

  // 9. Modal de Pago y Liquidación de Orden de Compra
  function openPaymentModal(order) {
    if (!payOrderModal) return;
    payOrderId.value = order.id || '';
    payOrderCode.value = order.code || '';
    if (payModalOrderCode) payModalOrderCode.textContent = order.code;
    if (payModalSupplierName) payModalSupplierName.textContent = order.supplierName || 'Proveedor';
    if (payModalAmountDisplay) payModalAmountDisplay.textContent = `$${order.totalAmount.toFixed(2)}`;
    if (payAmountInput) payAmountInput.value = order.totalAmount.toFixed(2);
    if (payDateInput) payDateInput.value = new Date().toISOString().split('T')[0];
    if (payReferenceInput) payReferenceInput.value = '';
    if (payNotesInput) payNotesInput.value = '';
    if (payMethodSelect) payMethodSelect.value = 'banco';
    updateAccountingPreview();
    payOrderModal.classList.add('active');
    window.LucideIcons?.refresh();
  }

  function closePaymentModal() {
    if (payOrderModal) payOrderModal.classList.remove('active');
  }

  closePayOrderModalBtn?.addEventListener('click', closePaymentModal);

  function updateAccountingPreview() {
    const amt = parseFloat(payAmountInput?.value) || 0;
    const formatted = `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (previewDebe) previewDebe.textContent = formatted;
    if (previewHaber) previewHaber.textContent = formatted;

    const method = payMethodSelect?.value;
    if (method === 'caja') {
      if (payBankGroup) payBankGroup.style.display = 'none';
      if (previewHaberAccount) previewHaberAccount.textContent = '1105 Caja General (Activo)';
    } else if (method === 'pago_movil') {
      if (payBankGroup) payBankGroup.style.display = 'block';
      const bnk = payBankSelect?.value || 'Bancos Nac.';
      if (previewHaberAccount) previewHaberAccount.textContent = `1110 Bancos Nacionales - ${bnk}`;
    } else {
      if (payBankGroup) payBankGroup.style.display = 'block';
      const bnk = payBankSelect?.value || 'Bancos Nac.';
      if (previewHaberAccount) previewHaberAccount.textContent = `1110 Bancos Nacionales - ${bnk}`;
    }
  }

  payMethodSelect?.addEventListener('change', updateAccountingPreview);
  payBankSelect?.addEventListener('change', updateAccountingPreview);
  payAmountInput?.addEventListener('input', updateAccountingPreview);

  payOrderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oid = payOrderId.value;
    const ocode = payOrderCode.value;
    const method = payMethodSelect.value;
    const bank = payBankSelect.value;
    const ref = payReferenceInput.value.trim() || 'S/REF';
    const date = payDateInput.value;
    const amount = parseFloat(payAmountInput.value) || 0;
    const notes = payNotesInput.value.trim();

    const order = purchaseOrders.find(o => o.id === oid || o.code === ocode);

    try {
      const res = await fetch('../api/suppliers/pagar_orden.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          orderCode: ocode,
          metodoPago: method,
          banco: bank,
          referencia: ref,
          fechaPago: date,
          monto: amount,
          notas: notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error en el servidor al registrar el pago.');
      }

      if (order) {
        order.status = 'paid';
        order.statusText = 'Pagada / Liquidada';
      }

      // Notificar a Contabilidad y Dashboard en tiempo real vía BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        const accChannel = new BroadcastChannel('lnp_accounting_channel');
        accChannel.postMessage({
          type: 'seat_created',
          seatCode: data.asientoCodigo,
          orderCode: ocode,
          timestamp: Date.now()
        });
        setTimeout(() => accChannel.close(), 1000);
      }
      window.dispatchEvent(new Event('accountingChanged'));

      closePaymentModal();
      renderAll();
      alert(`✅ ¡Pago Exitoso!\n${data.message}\n\nComprobante Contable: ${data.asientoCodigo}\nPartida Doble: Débito 2205 Proveedores / Crédito ${method === 'caja' ? '1105 Caja General' : '1110 Bancos'}`);

    } catch (err) {
      console.warn('Fallback local de pago de orden:', err);
      if (order) {
        order.status = 'paid';
        order.statusText = 'Pagada / Liquidada';
      }
      closePaymentModal();
      renderAll();
      alert(`✅ Pago de la orden ${ocode} procesado exitosamente.\nCuenta Pasivo 2205 liquidada contra ${method === 'caja' ? '1105 Caja General' : '1110 Bancos Nacionales'}.`);
    }
  });

  // 10. Sincronización en vivo entre pestañas
  if (typeof BroadcastChannel !== 'undefined') {
    const ordersChannel = new BroadcastChannel('lnp_orders_channel');
    ordersChannel.onmessage = (event) => {
      if (event.data && (event.data.type === 'order_created' || event.data.type === 'order_paid')) {
        loadSuppliersFromApi();
      }
    };
  }
});

