/* ==========================================================================
   MÓDULO 5: CONTROLADOR INTERACTIVO DE INVENTARIO Y STOCK (INVENTORY.JS)
   Manejo de existencias, alertas de stock mínimo, ajustes manuales y mermas
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { INVENTORY_DATABASE } from '../data/inventory-db.js';

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

  // 2. Estado del Inventario
  let inventory = JSON.parse(JSON.stringify(INVENTORY_DATABASE));
  let currentFilter = 'todos';
  let searchQuery = '';
  let monthlyWasteTotal = 145.20;

  // 3. Elementos DOM
  const inventoryBody = document.getElementById('inventoryBody');
  const searchInput = document.getElementById('inventorySearch');
  
  // KPI Elements
  const kpiTotalItems = document.getElementById('kpiTotalItems');
  const kpiStockAlerts = document.getElementById('kpiStockAlerts');
  const kpiTotalValue = document.getElementById('kpiTotalValue');
  const kpiMonthlyWaste = document.getElementById('kpiMonthlyWaste');

  // Modales
  const adjustModal = document.getElementById('adjustModal');
  const closeAdjustModalBtn = document.getElementById('closeAdjustModalBtn');
  const adjustForm = document.getElementById('adjustForm');
  const adjustItemSelect = document.getElementById('adjustItemSelect');
  const adjustQtyInput = document.getElementById('adjustQtyInput');
  const adjustTypeSelect = document.getElementById('adjustTypeSelect');

  const mermaModal = document.getElementById('mermaModal');
  const closeMermaModalBtn = document.getElementById('closeMermaModalBtn');
  const mermaForm = document.getElementById('mermaForm');
  const mermaItemSelect = document.getElementById('mermaItemSelect');
  const mermaQtyInput = document.getElementById('mermaQtyInput');
  const mermaReasonSelect = document.getElementById('mermaReasonSelect');

  // Botones Principales
  const btnOpenAdjust = document.getElementById('btnOpenAdjust');
  const btnOpenMerma = document.getElementById('btnOpenMerma');

  // Inicializar
  renderAll();

  function renderAll() {
    renderKPIs();
    renderInventoryTable();
    populateSelects();
  }

  // 4. Renderizado de KPIs
  function renderKPIs() {
    const alertsCount = inventory.filter(i => i.currentStock <= i.minStock).length;
    const totalVal = inventory.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0);

    if (kpiTotalItems) kpiTotalItems.textContent = `${inventory.length} ítems`;
    if (kpiStockAlerts) kpiStockAlerts.textContent = `${alertsCount} Alertas`;
    if (kpiTotalValue) kpiTotalValue.textContent = `$${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (kpiMonthlyWaste) kpiMonthlyWaste.textContent = `$${monthlyWasteTotal.toFixed(2)}`;
  }

  // 5. Renderizado de la Tabla de Stock
  function renderInventoryTable() {
    inventoryBody.innerHTML = '';

    const filtered = inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (currentFilter === 'raw_material') matchesFilter = item.category === 'raw_material';
      else if (currentFilter === 'finished_product') matchesFilter = item.category === 'finished_product';
      else if (currentFilter === 'alerts') matchesFilter = item.currentStock <= item.minStock;

      return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
      inventoryBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--color-muted);">
            No se encontraron existencias de inventario que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');

      // Calcular estado dinámico
      let statusTagClass = 'optimal';
      let statusTagText = 'Óptimo';
      if (item.currentStock <= item.minStock * 0.5) {
        statusTagClass = 'critical';
        statusTagText = '🚨 Crítico (Mínimo Excedido)';
      } else if (item.currentStock <= item.minStock) {
        statusTagClass = 'low_stock';
        statusTagText = '⚠️ Reabastecer Pronto';
      }

      const totalItemValue = item.currentStock * item.unitPrice;

      tr.innerHTML = `
        <td class="table-code-badge">${item.code}</td>
        <td><strong>${item.name}</strong></td>
        <td><span style="font-size: 0.8rem; color: var(--color-muted);">${item.categoryName}</span></td>
        <td><strong style="font-size: 1.05rem;">${item.currentStock}</strong> ${item.unit}</td>
        <td style="color: var(--color-muted);">${item.minStock} ${item.unit}</td>
        <td><span class="stock-status-tag ${statusTagClass}">${statusTagText}</span></td>
        <td style="font-weight: 700;">$${totalItemValue.toFixed(2)}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-row-touch btn-add-qty" title="Incrementar rápido (+1)">+</button>
            <button type="button" class="btn-row-touch btn-sub-qty" title="Decrementar rápido (-1)">-</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-add-qty').addEventListener('click', () => quickAdjust(item.id, 1));
      tr.querySelector('.btn-sub-qty').addEventListener('click', () => quickAdjust(item.id, -1));

      inventoryBody.appendChild(tr);
    });
  }

  function quickAdjust(itemId, delta) {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + delta);
      renderAll();
    }
  }

  // Listener para Búsqueda Instantánea
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderInventoryTable();
  });

  // Listener para Filtros por Pestaña
  document.querySelectorAll('.inv-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.inv-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderInventoryTable();
    });
  });

  // 6. Rellenar Selects de los Modales
  function populateSelects() {
    [adjustItemSelect, mermaItemSelect].forEach(select => {
      if (!select) return;
      select.innerHTML = '';
      inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.code} - ${item.name} (${item.currentStock} ${item.unit} disp.)`;
        select.appendChild(option);
      });
    });
  }

  // 7. Modal de Ajuste Manual
  btnOpenAdjust?.addEventListener('click', () => {
    populateSelects();
    adjustModal.classList.add('active');
  });

  closeAdjustModalBtn?.addEventListener('click', () => {
    adjustModal.classList.remove('active');
  });

  adjustForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemId = adjustItemSelect.value;
    const qty = parseFloat(adjustQtyInput.value) || 0;
    const type = adjustTypeSelect.value;

    const item = inventory.find(i => i.id === itemId);
    if (item) {
      if (type === 'entrada') {
        item.currentStock += qty;
      } else {
        item.currentStock = Math.max(0, item.currentStock - qty);
      }
      renderAll();
      adjustModal.classList.remove('active');
      alert(`Ajuste registrado exitosamente para ${item.name}. Nuevo stock: ${item.currentStock} ${item.unit}`);
    }
  });

  // 8. Modal de Registro de Mermas de Almacén
  btnOpenMerma?.addEventListener('click', () => {
    populateSelects();
    mermaModal.classList.add('active');
  });

  closeMermaModalBtn?.addEventListener('click', () => {
    mermaModal.classList.remove('active');
  });

  mermaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemId = mermaItemSelect.value;
    const qty = parseFloat(mermaQtyInput.value) || 0;
    const reason = mermaReasonSelect.value;

    const item = inventory.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock - qty);
      const lostValue = qty * item.unitPrice;
      monthlyWasteTotal += lostValue;

      renderAll();
      mermaModal.classList.remove('active');
      alert(`Merma de almacén registrada para ${item.name}.\nCantidad descontada: ${qty} ${item.unit}\nMotivo: ${reason}\nCosto de merma: $${lostValue.toFixed(2)}`);
    }
  });
});
