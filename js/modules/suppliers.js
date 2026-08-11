/* ==========================================================================
   MÓDULO 6: CONTROLADOR INTERACTIVO DE PROVEEDORES (SUPPLIERS.JS)
   Gestión de directorio de contactos, órdenes de compra y recepción en almacén
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { SUPPLIERS_DATABASE, PURCHASE_ORDERS_DATABASE } from '../data/suppliers-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión
  const session = SessionStore.getSession();
  if (!session) {
    alert('Sesión no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = session.user.name;
  if (userAvatarEl) userAvatarEl.textContent = session.user.icon;

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

  const btnOpenPO = document.getElementById('btnOpenPO');
  const btnOpenNewSupplier = document.getElementById('btnOpenNewSupplier');

  // Inicializar
  renderAll();

  function renderAll() {
    renderKPIs();
    renderSuppliersGrid();
    renderOrdersTable();
    populateSupplierSelect();
  }

  // 4. Renderizado de KPIs
  function renderKPIs() {
    const inTransitCount = purchaseOrders.filter(o => o.status === 'in_transit').length;
    const totalPurchases = purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    if (kpiActiveSuppliers) kpiActiveSuppliers.textContent = `${suppliers.length} Homologados`;
    if (kpiInTransit) kpiInTransit.textContent = `${inTransitCount} Activas`;
    if (kpiMonthlyPurchases) kpiMonthlyPurchases.textContent = `$${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  // 5. Renderizado del Directorio de Proveedores (Grid Cards)
  function renderSuppliersGrid() {
    suppliersCardsGrid.innerHTML = '';

    suppliers.forEach(sup => {
      const card = document.createElement('div');
      card.className = 'supplier-card';

      card.innerHTML = `
        <span class="supplier-rating-badge">★ ${sup.rating.toFixed(1)}</span>
        <div class="supplier-card-header">
          <div class="supplier-icon-box">${sup.icon}</div>
          <div class="supplier-card-info">
            <h3>${sup.name}</h3>
            <span class="supplier-category-tag">${sup.category}</span>
          </div>
        </div>

        <div class="supplier-contact-details">
          <div class="supplier-detail-row">
            <span>👤 Contacto:</span>
            <strong>${sup.contactPerson}</strong>
          </div>
          <div class="supplier-detail-row">
            <span>📞 Teléfono:</span>
            <span>${sup.phone}</span>
          </div>
          <div class="supplier-detail-row">
            <span>✉️ Email:</span>
            <span style="font-size: 0.8rem;">${sup.email}</span>
          </div>
          <div class="supplier-detail-row" style="margin-top: 0.2rem; font-size: 0.8rem; color: var(--color-gold-dark);">
            <span>💳 Condición:</span>
            <strong>${sup.paymentTerms}</strong>
          </div>
        </div>

        <div class="supplier-card-actions">
          <button type="button" class="btn-card-touch btn-contact" title="Llamar a proveedor">📞 Contactar</button>
          <button type="button" class="btn-card-touch btn-create-po" title="Generar orden de compra">📝 Nueva Orden</button>
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

      tr.innerHTML = `
        <td class="table-code-badge">${po.code}</td>
        <td><strong>${po.supplierName}</strong></td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${po.itemsSummary}</td>
        <td style="color: var(--color-muted); font-size: 0.85rem;">${po.orderDate}</td>
        <td style="color: var(--color-muted); font-size: 0.85rem;">${po.deliveryDate}</td>
        <td><span class="po-status-tag ${po.status}">${po.statusText}</span></td>
        <td style="font-weight: 800;">$${po.totalAmount.toFixed(2)}</td>
        <td>
          ${isTransit ? `
            <button type="button" class="btn-table-action btn-confirm-receive" style="background: var(--color-success); color: white;">✓ Confirmar Recepción</button>
          ` : `
            <span style="font-size: 0.8rem; color: var(--color-success); font-weight: 700;">Recibido en Almacén</span>
          `}
        </td>
      `;

      if (isTransit) {
        tr.querySelector('.btn-confirm-receive').addEventListener('click', () => {
          po.status = 'received';
          po.statusText = '✓ Recibido en Almacén';
          renderAll();
          alert(`Mercancía de la orden ${po.code} de ${po.supplierName} ingresada exitosamente al almacén.`);
        });
      }

      ordersBody.appendChild(tr);
    });
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

  poForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const supId = poSupplierSelect.value;
    const items = poItemsInput.value || 'Insumos de panadería surtidos';
    const amount = parseFloat(poAmountInput.value) || 0;
    const delivery = poDeliveryInput.value || '2026-08-15';

    const sup = suppliers.find(s => s.id === supId);
    const newPO = {
      id: `po_${Date.now()}`,
      code: `OC-2026-00${Math.floor(91 + Math.random() * 9)}`,
      supplierId: supId,
      supplierName: sup ? sup.name : 'Proveedor',
      itemsSummary: items,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: delivery,
      status: 'in_transit',
      statusText: '🚚 En Tránsito',
      totalAmount: amount
    };

    purchaseOrders.unshift(newPO);
    renderAll();
    poModal.classList.remove('active');
    alert(`Orden de Compra ${newPO.code} emitida exitosamente para ${newPO.supplierName}.`);
  });

  // 8. Modal de Nuevo Proveedor
  btnOpenNewSupplier?.addEventListener('click', () => {
    newSupplierModal.classList.add('active');
  });

  closeNewSupplierModalBtn?.addEventListener('click', () => {
    newSupplierModal.classList.remove('active');
  });

  newSupplierForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('supNameInput').value;
    const category = document.getElementById('supCategoryInput').value;
    const contact = document.getElementById('supContactInput').value;
    const phone = document.getElementById('supPhoneInput').value;
    const email = document.getElementById('supEmailInput').value;

    const newSup = {
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
      icon: '🏢'
    };

    suppliers.push(newSup);
    renderAll();
    newSupplierModal.classList.remove('active');
    alert(`Proveedor ${name} registrado e incorporado al directorio.`);
  });
});
