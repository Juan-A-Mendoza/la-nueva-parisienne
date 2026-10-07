/* ==========================================================================
   MÓDULO 5: CONTROLADOR INTERACTIVO DE INVENTARIO Y STOCK (INVENTORY.JS)
   Manejo de existencias, alertas de stock mínimo, ajustes manuales y mermas
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { INVENTORY_DATABASE } from '../data/inventory-db.js';

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
    role: 'Control de Inventario',
    roleCode: 'ADMIN',
    icon: 'package'
  };

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = activeUser.name;
  if (userAvatarEl) { userAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'package') : ''; window.LucideIcons?.refresh(); }

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

  // Inicializar e intentar sincronizar con MySQL
  renderAll();
  syncWithPosCatalog();
  loadInventoryFromApi();

  function syncWithPosCatalog() {
    try {
      const rawPos = localStorage.getItem('catalogo_pos');
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        if (Array.isArray(parsed)) {
          let touched = false;
          parsed.forEach(cp => {
            const match = inventory.find(i => i.code === cp.code || i.id === cp.id || i.name === cp.name);
            if (match && (typeof cp.stock === 'number' || !isNaN(parseFloat(cp.stock)))) {
              match.currentStock = parseFloat(cp.stock);
              touched = true;
            }
          });
          if (touched) renderAll();
        }
      }
    } catch (e) {}
  }

  async function loadInventoryFromApi() {
    try {
      const res = await fetch(`../api/inventory/get_inventory.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.inventory) && data.inventory.length > 0) {
          inventory = data.inventory;
          syncWithPosCatalog();
          populateSelects();
          renderAll();
        }
      }
    } catch (e) {
      console.warn('Inventario: Usando datos de respaldo local.', e);
      syncWithPosCatalog();
    }
  }

  // Reactividad en tiempo real (Módulo 2 Cocina / Módulo 3 POS -> Módulo 5 Inventario)
  window.addEventListener('catalogoPosChanged', () => {
    loadInventoryFromApi();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'catalogo_pos' || e.key === 'movimientos_inventario') {
      loadInventoryFromApi();
    }
  });
  if (typeof BroadcastChannel !== 'undefined') {
    const invChannel = new BroadcastChannel('lnp_pos_catalog_channel');
    invChannel.onmessage = () => {
      loadInventoryFromApi();
    };
  }

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
  setTimeout(() => window.LucideIcons?.refresh(), 0);
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
        statusTagText = 'Crítico (Mínimo Excedido)';
      } else if (item.currentStock <= item.minStock) {
        statusTagClass = 'low_stock';
        statusTagText = 'Reabastecer Pronto';
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

  adjustForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = adjustItemSelect.value;
    const qty = parseFloat(adjustQtyInput.value) || 0;
    const type = adjustTypeSelect.value; // 'entrada' o 'salida'
    const apiType = type === 'entrada' ? 'add' : 'subtract';

    try {
      const res = await fetch('../api/inventory/adjust_stock.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: itemId,
          quantity: qty,
          type: apiType,
          reason: 'Ajuste manual de existencias'
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadInventoryFromApi();
        adjustModal.classList.remove('active');
        adjustForm.reset();
        alert(`${data.message}`);
        return;
      }
    } catch (err) {
      console.warn('Fallo en MySQL, aplicando ajuste local:', err);
    }

    const item = inventory.find(i => i.id === itemId);
    if (item) {
      if (type === 'entrada') {
        item.currentStock += qty;
      } else {
        item.currentStock = Math.max(0, item.currentStock - qty);
      }
      renderAll();
      adjustModal.classList.remove('active');
      alert(`Ajuste registrado localmente para ${item.name}. Nuevo stock: ${item.currentStock} ${item.unit}`);
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

  mermaForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = mermaItemSelect.value;
    const qty = parseFloat(mermaQtyInput.value) || 0;
    const reason = mermaReasonSelect.value;

    try {
      const res = await fetch('../api/inventory/adjust_stock.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: itemId,
          quantity: qty,
          type: 'subtract',
          reason: `Merma de almacén: ${reason}`
        })
      });
      const data = await res.json();
      if (data.success) {
        const item = inventory.find(i => i.id === itemId);
        const lostValue = qty * (item ? item.unitPrice : 0);
        monthlyWasteTotal += lostValue;
        await loadInventoryFromApi();
        mermaModal.classList.remove('active');
        mermaForm.reset();
        alert(`Merma registrada en MySQL para ${item ? item.name : itemId}.\nCantidad descontada: ${qty}\nMotivo: ${reason}`);
        return;
      }
    } catch (err) {
      console.warn('Fallo en MySQL, aplicando merma local:', err);
    }

    const item = inventory.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock - qty);
      const lostValue = qty * item.unitPrice;
      monthlyWasteTotal += lostValue;

      renderAll();
      mermaModal.classList.remove('active');
      alert(`Merma registrada localmente para ${item.name}.\nCantidad descontada: ${qty} ${item.unit}\nMotivo: ${reason}\nCosto de merma: $${lostValue.toFixed(2)}`);
    }
  });

  // Modal Nuevo Ítem (Producto o Materia Prima)
  const nuevoItemModal = document.getElementById('nuevoItemModal');
  const btnOpenNuevoItem = document.getElementById('btnOpenNuevoItem');
  const closeNuevoItemModalBtn = document.getElementById('closeNuevoItemModalBtn');
  const cancelNuevoItemModalBtn = document.getElementById('cancelNuevoItemModalBtn');
  const nuevoItemForm = document.getElementById('nuevoItemForm');
  const nuevoItemTipo = document.getElementById('nuevoItemTipo');
  const lblNuevoItemPrecio = document.getElementById('lblNuevoItemPrecio');

  nuevoItemTipo?.addEventListener('change', () => {
    if (lblNuevoItemPrecio) {
      lblNuevoItemPrecio.textContent = nuevoItemTipo.value === 'raw_material' ? 'Costo Unitario ($) *' : 'Precio Venta ($) *';
    }
  });

  btnOpenNuevoItem?.addEventListener('click', () => {
    if (nuevoItemModal) {
      nuevoItemModal.style.display = 'flex';
      nuevoItemModal.classList.add('active');
      document.getElementById('nuevoItemNombre')?.focus();
    }
  });

  function closeNuevoItemModal() {
    if (nuevoItemModal) {
      nuevoItemModal.style.display = 'none';
      nuevoItemModal.classList.remove('active');
      nuevoItemForm?.reset();
    }
  }

  closeNuevoItemModalBtn?.addEventListener('click', closeNuevoItemModal);
  cancelNuevoItemModalBtn?.addEventListener('click', closeNuevoItemModal);
  nuevoItemModal?.addEventListener('click', (e) => {
    if (e.target === nuevoItemModal) closeNuevoItemModal();
  });

  nuevoItemForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = nuevoItemTipo?.value || 'finished_good';
    const nombre = document.getElementById('nuevoItemNombre')?.value?.trim();
    const precio = parseFloat(document.getElementById('nuevoItemPrecio')?.value || 0);
    const unidad = document.getElementById('nuevoItemUnidad')?.value || 'Und';
    const stock = parseFloat(document.getElementById('nuevoItemStock')?.value || 0);
    const minStock = parseFloat(document.getElementById('nuevoItemMinStock')?.value || 10);

    if (!nombre || precio <= 0) return;

    try {
      const endpoint = tipo === 'raw_material' 
        ? '../api/inventory/guardar_materia_prima.php' 
        : '../api/inventory/guardar_producto.php';
      
      const payload = tipo === 'raw_material'
        ? { name: nombre, unitCost: precio, unit: unidad, stock, minStock }
        : { name: nombre, price: precio, unit: unidad, stock, minStock };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        await loadInventoryFromApi();
        closeNuevoItemModal();
        alert(`¡Ítem guardado con éxito en MySQL!\n${data.message}`);
      } else {
        alert(data.message || 'Error al guardar ítem');
      }
    } catch (err) {
      console.error('Error guardando ítem:', err);
      alert('Error de conexión al guardar ítem en MySQL.');
    }
  });
});
