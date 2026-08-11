/* ==========================================================================
   MÓDULO 3: CONTROLADOR INTERACTIVO DEL PUNTO DE VENTA (POS.JS)
   Gestión de catálogo, búsqueda, carrito de compras, cálculo de IVA/descuentos y facturación
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { CATEGORIES, PRODUCTS_DATABASE, ProductsStore } from '../data/products-db.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificación de Seguridad y Sesión
  const session = SessionStore.getSession();
  if (!session) {
    alert('Sesión no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar datos del cajero activo en la interfaz
  const cashierNameEl = document.getElementById('cashierName');
  const cashierAvatarEl = document.getElementById('cashierAvatar');
  if (cashierNameEl) cashierNameEl.textContent = session.user.name;
  if (cashierAvatarEl) cashierAvatarEl.textContent = session.user.icon;

  // Botón de Cierre de Sesión
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de la Aplicación POS
  let categoriesList = CATEGORIES;
  let productsList = PRODUCTS_DATABASE;
  let currentCategory = 'todos';
  let searchQuery = '';
  let cart = []; // Lista de ítems: { product, quantity }
  let currentDiscountPercent = 0;
  let currentOrderType = 'Para Llevar';
  let orderCounter = Math.floor(1000 + Math.random() * 9000);
  let selectedPaymentMethod = 'efectivo';
  let currentTenderAmount = 0;

  const IVA_RATE = 0.16; // 16% IVA Fiscal

  // 3. Elementos DOM
  const categoryTabsContainer = document.getElementById('categoryTabs');
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const cartItemsList = document.getElementById('cartItemsList');
  const emptyCartView = document.getElementById('emptyCartView');
  const orderNumberEl = document.getElementById('orderNumber');
  const clearCartBtn = document.getElementById('clearCartBtn');
  
  // Elementos de Totales
  const subtotalEl = document.getElementById('subtotalVal');
  const discountValEl = document.getElementById('discountVal');
  const discountSelect = document.getElementById('discountSelect');
  const taxValEl = document.getElementById('taxVal');
  const totalValEl = document.getElementById('totalVal');
  const btnProcessPayment = document.getElementById('btnProcessPayment');
  
  // Modales
  const paymentModal = document.getElementById('paymentModal');
  const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
  const btnCancelPayment = document.getElementById('btnCancelPayment');
  const paymentTotalBanner = document.getElementById('paymentTotalBanner');
  const tenderInput = document.getElementById('tenderInput');
  const changeDueVal = document.getElementById('changeDueVal');
  const btnCompleteSale = document.getElementById('btnCompleteSale');
  
  const receiptModal = document.getElementById('receiptModal');
  const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
  const receiptContent = document.getElementById('receiptContent');
  const btnNewSale = document.getElementById('btnNewSale');
  const btnPrintReceipt = document.getElementById('btnPrintReceipt');

  // Inicialización Asíncrona (Consulta API PHP / MySQL)
  initOrderNumber();

  // Cargar catálogo relacional desde MySQL
  const catalogData = await ProductsStore.getProductsCatalogAsync();
  if (catalogData && catalogData.products) {
    productsList = catalogData.products;
    if (catalogData.categories && catalogData.categories.length > 0) {
      categoriesList = catalogData.categories;
    }
  }

  renderCategoryTabs();
  renderProducts();
  updateCartUI();

  function initOrderNumber() {
    if (orderNumberEl) {
      orderNumberEl.textContent = `FAC-2026-${orderCounter}`;
    }
  }

  // Renderizado de Pestañas de Categoría
  function renderCategoryTabs() {
    if (!categoryTabsContainer) return;
    categoryTabsContainer.innerHTML = '';
    categoriesList.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-tab-btn ${cat.id === currentCategory ? 'active' : ''}`;
      btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;
      btn.addEventListener('click', () => {
        currentCategory = cat.id;
        renderCategoryTabs();
        renderProducts();
      });
      categoryTabsContainer.appendChild(btn);
    });
  }

  // Filtrado y Renderizado de Tarjetas de Producto
  function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = productsList.filter(prod => {
      const matchesCat = currentCategory === 'todos' || prod.category === currentCategory;
      const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            prod.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-muted);">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</p>
          <p>No se encontraron productos que coincidan con la búsqueda.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <span class="product-stock-badge">${prod.stock} disp.</span>
        <div class="product-card-icon">${prod.icon}</div>
        <h3 class="product-card-title">${prod.name}</h3>
        <p class="product-card-desc">${prod.description}</p>
        <div class="product-card-footer">
          <span class="product-price">$${prod.price.toFixed(2)}</span>
          <button type="button" class="btn-add-product" title="Agregar al pedido">+</button>
        </div>
      `;

      card.addEventListener('click', () => addToCart(prod));
      productsGrid.appendChild(card);
    });
  }

  // Listener para Búsqueda en tiempo real
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Listener para Tipo de Pedido (Para Llevar / Consumo en Local / Delivery)
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderType = btn.dataset.type;
    });
  });

  // 4. Lógica de Carrito de Compras
  function addToCart(product) {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      if (cart[existingIndex].quantity < product.stock) {
        cart[existingIndex].quantity++;
      } else {
        alert(`Stock máximo alcanzado para ${product.name}`);
      }
    } else {
      cart.push({ product, quantity: 1 });
    }
    updateCartUI();
  }

  function updateQuantity(productId, delta) {
    const index = cart.findIndex(item => item.product.id === productId);
    if (index > -1) {
      cart[index].quantity += delta;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      updateCartUI();
    }
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    updateCartUI();
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      if (confirm('¿Desea vaciar todos los productos del pedido actual?')) {
        cart = [];
        updateCartUI();
      }
    });
  }

  if (discountSelect) {
    discountSelect.addEventListener('change', (e) => {
      currentDiscountPercent = parseFloat(e.target.value) || 0;
      updateCartTotals();
    });
  }

  // Renderizado del Carrito y Cálculos Financieros
  function updateCartUI() {
    if (cart.length === 0) {
      emptyCartView.style.display = 'flex';
      cartItemsList.style.display = 'none';
      btnProcessPayment.disabled = true;
    } else {
      emptyCartView.style.display = 'none';
      cartItemsList.style.display = 'block';
      btnProcessPayment.disabled = false;

      cartItemsList.innerHTML = '';
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        const itemSubtotal = item.product.price * item.quantity;

        row.innerHTML = `
          <div class="cart-item-icon">${item.product.icon}</div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.product.name}</div>
            <div class="cart-item-price">$${item.product.price.toFixed(2)} c/u</div>
          </div>
          <div class="cart-quantity-controls">
            <button type="button" class="qty-btn btn-minus">-</button>
            <span class="qty-count">${item.quantity}</span>
            <button type="button" class="qty-btn btn-plus">+</button>
          </div>
          <div class="cart-item-subtotal">$${itemSubtotal.toFixed(2)}</div>
          <button type="button" class="btn-remove-item" title="Eliminar ítem">&times;</button>
        `;

        row.querySelector('.btn-minus').addEventListener('click', () => updateQuantity(item.product.id, -1));
        row.querySelector('.btn-plus').addEventListener('click', () => updateQuantity(item.product.id, 1));
        row.querySelector('.btn-remove-item').addEventListener('click', () => removeFromCart(item.product.id));

        cartItemsList.appendChild(row);
      });
    }

    updateCartTotals();
  }

  function calculateTotals() {
    const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discountAmount = rawSubtotal * (currentDiscountPercent / 100);
    const taxableAmount = rawSubtotal - discountAmount;
    const taxAmount = taxableAmount * IVA_RATE;
    const total = taxableAmount + taxAmount;

    return { rawSubtotal, discountAmount, taxableAmount, taxAmount, total };
  }

  function updateCartTotals() {
    const { rawSubtotal, discountAmount, taxAmount, total } = calculateTotals();

    subtotalEl.textContent = `$${rawSubtotal.toFixed(2)}`;
    discountValEl.textContent = `-$${discountAmount.toFixed(2)}`;
    taxValEl.textContent = `$${taxAmount.toFixed(2)}`;
    totalValEl.textContent = `$${total.toFixed(2)}`;
    btnProcessPayment.textContent = `Procesar Pago ($${total.toFixed(2)})`;
  }

  // 5. Modal de Cobro y Procesamiento de Pago
  btnProcessPayment.addEventListener('click', () => {
    if (cart.length === 0) return;
    const { total } = calculateTotals();

    paymentTotalBanner.querySelector('h2').textContent = `$${total.toFixed(2)}`;
    currentTenderAmount = Math.ceil(total); // Sugerir entero superior
    if (tenderInput) tenderInput.value = currentTenderAmount.toFixed(2);
    
    // Método por defecto al abrir modal
    switchPaymentMethod('efectivo');
    paymentModal.classList.add('active');
  });

  function closePaymentModal() {
    if (paymentModal) paymentModal.classList.remove('active');
  }

  if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
  if (btnCancelPayment) btnCancelPayment.addEventListener('click', closePaymentModal);

  // Conmutador de Métodos de Pago (Efectivo / Tarjeta / Transferencia)
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const method = btn.dataset.method;
      switchPaymentMethod(method);
    });
  });

  function switchPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.method-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.method === method);
    });

    const cashPanel = document.getElementById('cashCalculatorPanel');
    const cardPanel = document.getElementById('cardTransferPanel');
    const cardMsg = document.getElementById('cardTransferMsg');
    const { total } = calculateTotals();

    if (method === 'efectivo') {
      if (cashPanel) cashPanel.style.display = 'block';
      if (cardPanel) cardPanel.style.display = 'none';
      updateCashChange();
    } else if (method === 'tarjeta') {
      if (cashPanel) cashPanel.style.display = 'none';
      if (cardPanel) cardPanel.style.display = 'block';
      if (cardMsg) cardMsg.textContent = `💳 Procese la tarjeta por $${total.toFixed(2)} en la terminal de punto de venta (POS).`;
      if (btnCompleteSale) btnCompleteSale.disabled = false;
    } else if (method === 'transferencia') {
      if (cashPanel) cashPanel.style.display = 'none';
      if (cardPanel) cardPanel.style.display = 'block';
      if (cardMsg) cardMsg.textContent = `📲 Transfiera $${total.toFixed(2)} escaneando el código QR o Pago Móvil.`;
      if (btnCompleteSale) btnCompleteSale.disabled = false;
    }
  }

  // Billetes Rápidos de Efectivo
  document.querySelectorAll('.fast-cash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      const { total } = calculateTotals();

      if (val === 'exact') {
        currentTenderAmount = total;
      } else {
        currentTenderAmount = parseFloat(val);
      }
      if (tenderInput) tenderInput.value = currentTenderAmount.toFixed(2);
      updateCashChange();
    });
  });

  if (tenderInput) {
    tenderInput.addEventListener('input', (e) => {
      currentTenderAmount = parseFloat(e.target.value) || 0;
      updateCashChange();
    });
  }

  function updateCashChange() {
    if (selectedPaymentMethod !== 'efectivo') {
      if (btnCompleteSale) btnCompleteSale.disabled = false;
      return;
    }

    const { total } = calculateTotals();
    const change = currentTenderAmount - total;

    if (change >= 0) {
      if (changeDueVal) {
        changeDueVal.textContent = `$${change.toFixed(2)}`;
        changeDueVal.className = 'change-amount';
      }
      if (btnCompleteSale) btnCompleteSale.disabled = false;
    } else {
      if (changeDueVal) {
        changeDueVal.textContent = `Faltan $${Math.abs(change).toFixed(2)}`;
        changeDueVal.className = 'change-amount insufficient';
      }
      if (btnCompleteSale) btnCompleteSale.disabled = true;
    }
  }

  // 6. Finalización de Venta y Generación de Ticket con Persistencia MySQL
  btnCompleteSale.addEventListener('click', async () => {
    btnCompleteSale.disabled = true;
    btnCompleteSale.textContent = 'Procesando Venta...';

    paymentModal.classList.remove('active');

    const { rawSubtotal, discountAmount, taxAmount, total } = calculateTotals();
    const change = Math.max(0, currentTenderAmount - total);
    const orderNumberStr = `FAC-2026-${orderCounter}`;

    const orderPayload = {
      orderNumber: orderNumberStr,
      userId: session.user.id,
      subtotal: rawSubtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: total,
      paymentMethod: selectedPaymentMethod,
      tenderAmount: currentTenderAmount,
      changeDue: change,
      orderType: currentOrderType,
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))
    };

    let dbConfirmed = false;
    let dbMessage = '';

    try {
      let response = await fetch('../api/pos/procesar_venta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      if (!response.ok) {
        response = await fetch('../api/procesar_venta.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          dbConfirmed = true;
          dbMessage = result.message || 'Venta registrada y contabilizada exitosamente en MySQL.';
        } else {
          dbMessage = result.message || 'No se pudo guardar la venta en la base de datos.';
        }
      }
    } catch (err) {
      console.warn('API procesar_venta.php no disponible. Guardando en modo local:', err);
      dbMessage = 'Operación procesada en modo local (Servidor offline).';
    }

    btnCompleteSale.disabled = false;
    btnCompleteSale.textContent = '✓ Confirmar y Finalizar Venta';

    generateReceipt(dbConfirmed, dbMessage);
    receiptModal.classList.add('active');
  });

  function generateReceipt(dbConfirmed = false, dbMessage = '') {
    const { rawSubtotal, discountAmount, taxAmount, total } = calculateTotals();
    const change = Math.max(0, currentTenderAmount - total);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = '';
    cart.forEach(item => {
      const itemSubtotal = item.product.price * item.quantity;
      itemsHtml += `
        <tr>
          <td style="text-align: left;">${item.quantity}x ${item.product.name}</td>
          <td style="text-align: right;">$${itemSubtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const statusBannerHtml = dbConfirmed ? `
      <div style="background: rgba(46, 125, 50, 0.12); border: 1px solid var(--color-success); border-radius: var(--radius-md); padding: 0.5rem; margin-bottom: 0.75rem; text-align: center; color: var(--color-success); font-weight: 700; font-size: 0.8rem;">
        ✓ REGISTRADO Y CONTABILIZADO EN MYSQL
      </div>
    ` : `
      <div style="background: rgba(212, 155, 84, 0.12); border: 1px solid var(--color-gold); border-radius: var(--radius-md); padding: 0.5rem; margin-bottom: 0.75rem; text-align: center; color: var(--color-gold-dark); font-weight: 600; font-size: 0.8rem;">
        ● VENTA COMPLETADA (MODO DE SESIÓN LOCAL)
      </div>
    `;

    receiptContent.innerHTML = `
      ${statusBannerHtml}
      <div class="receipt-header">
        <h3>🥖 La Nueva Parisienne</h3>
        <p>Panadería & Repostería Fina</p>
        <p style="font-size: 0.75rem;">RIF: J-40918273-0 | Tel: (01) 555-PARIS</p>
        <p style="font-size: 0.75rem; margin-top: 0.25rem;">Fecha: ${formattedDate}</p>
        <p style="font-size: 0.75rem; font-weight: bold;">Ticket Nº: FAC-2026-${orderCounter}</p>
        <p style="font-size: 0.75rem;">Cajera: ${session.user.name} | Mod: ${currentOrderType}</p>
      </div>

      <table class="receipt-items-table">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #2C1D11; padding-top: 0.5rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>$${rawSubtotal.toFixed(2)}</span>
        </div>
        ${discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; color: var(--color-terracotta);">
          <span>Descuento (${currentDiscountPercent}%):</span>
          <span>-$${discountAmount.toFixed(2)}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span>IVA (16%):</span>
          <span>$${taxAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin-top: 0.5rem; border-top: 2px solid #2C1D11; padding-top: 0.25rem;">
          <span>TOTAL:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-top: 0.75rem; font-size: 0.8rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Método de Pago:</span>
          <span style="text-transform: uppercase;">${selectedPaymentMethod}</span>
        </div>
        ${selectedPaymentMethod === 'efectivo' ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Efectivo Recibido:</span>
          <span>$${currentTenderAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Vuelto Entregado:</span>
          <span>$${change.toFixed(2)}</span>
        </div>` : ''}
      </div>

      <div class="receipt-footer">
        <p>¡Gracias por su compra!</p>
        <p style="font-style: italic;">Merci de votre visite et à bientôt</p>
        <div style="margin-top: 0.75rem; font-size: 1.5rem;">||| | |||| | ||||| |||</div>
      </div>
    `;
  }

  // 7. FUNCIÓN RESET POS (NUEVA VENTA)
  function resetPOS() {
    cart = [];
    currentDiscountPercent = 0;
    if (discountSelect) discountSelect.value = "0";
    currentOrderType = 'Para Llevar';
    document.querySelectorAll('.order-type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === 'Para Llevar');
    });

    selectedPaymentMethod = 'efectivo';
    currentTenderAmount = 0;
    if (tenderInput) tenderInput.value = '';
    const refInput = document.getElementById('referenceInput');
    if (refInput) refInput.value = '';

    searchQuery = '';
    if (searchInput) searchInput.value = '';
    currentCategory = 'todos';

    orderCounter++;
    initOrderNumber();

    if (paymentModal) paymentModal.classList.remove('active');
    if (receiptModal) receiptModal.classList.remove('active');

    renderCategoryTabs();
    renderProducts();
    updateCartUI();
  }

  // Botones de Nueva Venta, Imprimir y Cerrar Ticket
  if (btnNewSale) btnNewSale.addEventListener('click', resetPOS);

  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener('click', () => {
      window.print();
    });
  }

  if (closeReceiptModalBtn) {
    closeReceiptModalBtn.addEventListener('click', resetPOS);
  }
});
