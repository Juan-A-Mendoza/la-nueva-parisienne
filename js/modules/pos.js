/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR DEL ASISTENTE POR PASOS POS (POS.JS)
   Flujo Wizard Estricto:
   - Paso 1 (Armar Pedido): Catálogo + Carrito lateral interactivo con [+] y [-]
   - Paso 2 (Caja / Cobro): Totales bimoneda en vivo (API BCV), medio de pago y botón "Empezar de cero"
   - Paso 3 (Finalización y Reinicio Automático resetPOS()): Transacción MySQL y reseteo inmediato a Paso 1
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { CATEGORIES, PRODUCTS_DATABASE } from '../data/mock-products.js';
import { ProductsStore } from '../data/products-db.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificación de Sesión Activa
  const session = SessionStore.getSession();
  if (session && session.user) {
    const cashierAvatar = document.getElementById('cashierAvatar');
    const cashierName = document.getElementById('cashierName');
    if (cashierAvatar) cashierAvatar.textContent = session.user.icon || '👩‍💼';
    if (cashierName) cashierName.textContent = session.user.name || 'Personal POS';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => SessionStore.logout());
  }

  // 2. Estado de la Aplicación POS
  let categoriesList = CATEGORIES;
  let productsList = PRODUCTS_DATABASE;
  let currentCategory = 'todos';
  let searchQuery = '';
  let cart = []; // Array de ítems: { product, quantity }
  let currentDiscountPercent = 0;
  let currentOrderType = 'Para Llevar';
  let orderCounter = Math.floor(1000 + Math.random() * 9000);
  let selectedPaymentMethod = 'efectivo';
  let currentTenderAmount = 0;
  let bcvRate = 761.21; // Tasa por defecto de resguardo (se actualiza vía API en vivo)
  let currentStep = 1;

  const IVA_RATE = 0.16; // 16% IVA Fiscal

  // 3. Elementos DOM
  const posStep1 = document.getElementById('posStep1');
  const posStep2 = document.getElementById('posStep2');
  const wizardStepTag1 = document.getElementById('wizardStepTag1');
  const wizardStepTag2 = document.getElementById('wizardStepTag2');
  const wizardStepTag3 = document.getElementById('wizardStepTag3');
  
  const btnGoToStep2 = document.getElementById('btnGoToStep2');
  const btnGoToStep2Text = document.getElementById('btnGoToStep2Text');
  const btnBackToStep1 = document.getElementById('btnBackToStep1');
  const btnResetAndCancel = document.getElementById('btnResetAndCancel');
  
  const categoryTabsContainer = document.getElementById('categoryTabs');
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const step1CartItemsList = document.getElementById('step1CartItemsList');
  const checkoutCartItemsList = document.getElementById('checkoutCartItemsList');
  const emptyCartView = document.getElementById('emptyCartView');
  const clearCartBtnPaso1 = document.getElementById('clearCartBtnPaso1');
  
  // Previews y Totales Paso 1
  const step1SubtotalUsd = document.getElementById('step1SubtotalUsd');
  const step1TaxUsd = document.getElementById('step1TaxUsd');
  const step1TotalUsd = document.getElementById('step1TotalUsd');
  const step1TotalVes = document.getElementById('step1TotalVes');
  const bcvRateBadge = document.getElementById('bcvRateBadge');
  const bcvRateValEl = document.getElementById('bcvRateVal');
  
  // Previews y Totales Paso 2
  const orderNumberEl = document.getElementById('orderNumber');
  const orderNumberPaso1 = document.getElementById('orderNumberPaso1');
  const subtotalEl = document.getElementById('subtotalVal');
  const discountValEl = document.getElementById('discountVal');
  const discountSelect = document.getElementById('discountSelect');
  const taxValEl = document.getElementById('taxVal');
  const totalValEl = document.getElementById('totalVal');
  const totalVesEl = document.getElementById('totalVesVal');
  
  // Paneles de Pago y Modales
  const tenderInput = document.getElementById('tenderInput');
  const changeDueVal = document.getElementById('changeDueVal');
  const referenceInput = document.getElementById('referenceInput');
  const btnCompleteSale = document.getElementById('btnCompleteSale');
  const cashCalculatorPanel = document.getElementById('cashCalculatorPanel');
  const cardTransferPanel = document.getElementById('cardTransferPanel');
  
  const receiptModal = document.getElementById('receiptModal');
  const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
  const receiptContent = document.getElementById('receiptContent');
  const btnNewSale = document.getElementById('btnNewSale');
  const btnPrintReceipt = document.getElementById('btnPrintReceipt');

  // Inicialización Asíncrona
  initOrderNumber();
  await loadLiveBcvRate();
  await loadProductsCatalog();

  // ==========================================================================
  // CONSULTA DE TASA BCV EN VIVO VIA API PHP (BCV_RATE.PHP / BCMRATE.PHP)
  // ==========================================================================
  async function loadLiveBcvRate() {
    try {
      const res = await fetch(`../api/bcv_rate.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rate && data.rate >= 100) {
          bcvRate = data.rate;
          if (bcvRateValEl) bcvRateValEl.textContent = `Bs. ${bcvRate.toFixed(2)}`;
          if (bcvRateBadge) {
            const modeLabel = data.mode === 'manual' ? 'Manual' : 'En Vivo';
            bcvRateBadge.innerHTML = `<span>🇻🇪 Tasa BCV (${modeLabel}):</span> <strong>Bs. ${bcvRate.toFixed(2)}</strong>`;
            bcvRateBadge.title = `Fuente: ${data.source} (${data.date})`;
          }
        }
      }
    } catch (e) {
      console.warn('Error al obtener la tasa en vivo de la API BCV:', e);
    }
    updateCartTotals();
  }

  // ==========================================================================
  // CONTROLADOR DEL WIZARD DE PASOS (PASO 1 VS PASO 2 VS PASO 3)
  // ==========================================================================
  function goToStep(step) {
    currentStep = step;
    if (step === 1) {
      if (posStep1) posStep1.classList.add('active');
      if (posStep2) posStep2.classList.remove('active');
      if (wizardStepTag1) wizardStepTag1.classList.add('active');
      if (wizardStepTag2) wizardStepTag2.classList.remove('active');
      if (wizardStepTag3) wizardStepTag3.classList.remove('active');
      renderStep1Cart();
    } else if (step === 2) {
      if (cart.length === 0) return;
      if (posStep1) posStep1.classList.remove('active');
      if (posStep2) posStep2.classList.add('active');
      if (wizardStepTag1) wizardStepTag1.classList.remove('active');
      if (wizardStepTag2) wizardStepTag2.classList.add('active');
      if (wizardStepTag3) wizardStepTag3.classList.remove('active');
      renderCheckoutCart();
    } else if (step === 3) {
      if (wizardStepTag1) wizardStepTag1.classList.remove('active');
      if (wizardStepTag2) wizardStepTag2.classList.remove('active');
      if (wizardStepTag3) wizardStepTag3.classList.add('active');
    }
    updateCartTotals();
  }

  if (btnGoToStep2) btnGoToStep2.addEventListener('click', () => goToStep(2));
  if (btnBackToStep1) btnBackToStep1.addEventListener('click', () => goToStep(1));
  if (btnResetAndCancel) btnResetAndCancel.addEventListener('click', () => {
    if (confirm('¿Desea cancelar el pedido actual y empezar de cero?')) {
      resetPOS();
    }
  });

  // ==========================================================================
  // PASO 1: ARMAR PEDIDO (CATÁLOGO Y CARRITO LATERAL INTERACTIVO)
  // ==========================================================================
  async function loadProductsCatalog() {
    const catalogData = await ProductsStore.getProductsCatalogAsync();
    if (catalogData && catalogData.products) {
      productsList = catalogData.products;
    }
    if (catalogData && catalogData.categories) {
      categoriesList = catalogData.categories;
    }
    renderCategoryTabs();
    renderProducts();
  }

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
        document.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts();
      });
      categoryTabsContainer.appendChild(btn);
    });
  }

  function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = productsList.filter(prod => {
      const matchCategory = currentCategory === 'todos' || prod.category === currentCategory;
      const matchSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <p>No se encontraron productos que coincidan con la búsqueda.</p>
        </div>`;
      return;
    }

    filtered.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <span class="product-stock-badge">${prod.stock} ud.</span>
        <div class="product-card-icon">${prod.icon || '🥖'}</div>
        <h3 class="product-card-title">${prod.name}</h3>
        <p class="product-card-desc">${prod.description || ''}</p>
        <div class="product-card-footer">
          <span class="product-price">$${prod.price.toFixed(2)}</span>
          <button type="button" class="btn-add-product" aria-label="Agregar ${prod.name}">+</button>
        </div>
      `;
      card.addEventListener('click', () => addToCart(prod));
      productsGrid.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
    });
  }

  // ==========================================================================
  // GESTIÓN DEL CARRITO INTERACTIVO (PASO 1 Y PASO 2)
  // ==========================================================================
  function addToCart(product) {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity += 1;
      } else {
        alert(`⚠️ Stock máximo alcanzado (${product.stock} unidades).`);
      }
    } else {
      cart.push({ product, quantity: 1 });
    }
    updateCartTotals();
    renderStep1Cart();
  }

  function renderStep1Cart() {
    if (!step1CartItemsList) return;
    step1CartItemsList.innerHTML = '';

    if (cart.length === 0) {
      if (emptyCartView) emptyCartView.style.display = 'flex';
      return;
    }
    if (emptyCartView) emptyCartView.style.display = 'none';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-name">${item.product.icon || '🥖'} ${item.product.name}</span>
          <span class="cart-item-unit-price">$${item.product.price.toFixed(2)} c/u</span>
        </div>
        <div class="cart-item-controls">
          <button type="button" class="btn-cart-qty btn-dec" title="Disminuir o eliminar">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button type="button" class="btn-cart-qty btn-inc" title="Aumentar cantidad">+</button>
        </div>
        <span class="cart-item-total">$${(item.product.price * item.quantity).toFixed(2)}</span>
      `;

      row.querySelector('.btn-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(i => i.product.id !== item.product.id);
        }
        updateCartTotals();
        renderStep1Cart();
      });

      row.querySelector('.btn-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.quantity < item.product.stock) {
          item.quantity += 1;
          updateCartTotals();
          renderStep1Cart();
        } else {
          alert(`Stock máximo alcanzado (${item.product.stock} ud).`);
        }
      });

      step1CartItemsList.appendChild(row);
    });
  }

  function updateCartTotals() {
    let rawSubtotal = 0;

    cart.forEach(item => {
      rawSubtotal += item.product.price * item.quantity;
    });

    const discountAmount = rawSubtotal * (currentDiscountPercent / 100);
    const taxableBase = rawSubtotal - discountAmount;
    const taxAmount = taxableBase * IVA_RATE;
    const finalTotalUsd = taxableBase + taxAmount;
    
    // FÓRMULA MATEMÁTICA CONVERSIÓN VES
    const finalTotalVes = finalTotalUsd * bcvRate;

    // Actualizar Totales Paso 1
    if (step1SubtotalUsd) step1SubtotalUsd.textContent = `$${rawSubtotal.toFixed(2)}`;
    if (step1TaxUsd) step1TaxUsd.textContent = `$${taxAmount.toFixed(2)}`;
    if (step1TotalUsd) step1TotalUsd.textContent = `$${finalTotalUsd.toFixed(2)}`;
    if (step1TotalVes) {
      step1TotalVes.textContent = `Bs. ${finalTotalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    if (btnGoToStep2) btnGoToStep2.disabled = cart.length === 0;
    if (btnGoToStep2Text) {
      btnGoToStep2Text.textContent = `Siguiente / Proceder al Pago ($${finalTotalUsd.toFixed(2)})`;
    }

    // Actualizar Totales Paso 2
    if (subtotalEl) subtotalEl.textContent = `$${rawSubtotal.toFixed(2)}`;
    if (discountValEl) discountValEl.textContent = `-$${discountAmount.toFixed(2)}`;
    if (taxValEl) taxValEl.textContent = `$${taxAmount.toFixed(2)}`;
    if (totalValEl) totalValEl.textContent = `$${finalTotalUsd.toFixed(2)}`;
    if (totalVesEl) {
      totalVesEl.textContent = `Bs. ${finalTotalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (btnCompleteSale) btnCompleteSale.disabled = cart.length === 0;

    calculateChange(finalTotalUsd);
  }

  function renderCheckoutCart() {
    if (!checkoutCartItemsList) return;
    checkoutCartItemsList.innerHTML = '';

    if (cart.length === 0) {
      checkoutCartItemsList.innerHTML = '<p style="padding: 1.5rem; text-align: center; color: var(--color-muted);">El carrito está vacío.</p>';
      return;
    }

    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item-row';
      itemEl.style.background = '#FFFFFF';
      itemEl.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-name">${item.product.icon || '🥖'} ${item.product.name}</span>
          <span class="cart-item-unit-price">$${item.product.price.toFixed(2)} c/u</span>
        </div>
        <div class="cart-item-controls">
          <button type="button" class="btn-cart-qty btn-dec">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button type="button" class="btn-cart-qty btn-inc">+</button>
        </div>
        <span class="cart-item-total">$${(item.product.price * item.quantity).toFixed(2)}</span>
      `;

      itemEl.querySelector('.btn-dec').addEventListener('click', () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(i => i.product.id !== item.product.id);
        }
        updateCartTotals();
        renderCheckoutCart();
        renderStep1Cart();
        if (cart.length === 0) goToStep(1);
      });

      itemEl.querySelector('.btn-inc').addEventListener('click', () => {
        if (item.quantity < item.product.stock) {
          item.quantity += 1;
          updateCartTotals();
          renderCheckoutCart();
          renderStep1Cart();
        } else {
          alert(`Stock máximo alcanzado (${item.product.stock} ud).`);
        }
      });

      checkoutCartItemsList.appendChild(itemEl);
    });
  }

  if (clearCartBtnPaso1) {
    clearCartBtnPaso1.addEventListener('click', () => {
      if (confirm('¿Vaciar todos los productos del pedido?')) {
        cart = [];
        updateCartTotals();
        renderStep1Cart();
      }
    });
  }

  if (discountSelect) {
    discountSelect.addEventListener('change', (e) => {
      currentDiscountPercent = parseFloat(e.target.value) || 0;
      updateCartTotals();
    });
  }

  // ==========================================================================
  // PASO 2: MÉTODOS DE PAGO Y CALCULADORA DE VUELTO
  // ==========================================================================
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.dataset.method;

      if (selectedPaymentMethod === 'efectivo') {
        if (cashCalculatorPanel) cashCalculatorPanel.style.display = 'block';
        if (cardTransferPanel) cardTransferPanel.style.display = 'none';
      } else {
        if (cashCalculatorPanel) cashCalculatorPanel.style.display = 'none';
        if (cardTransferPanel) cardTransferPanel.style.display = 'block';
      }
    });
  });

  if (tenderInput) {
    tenderInput.addEventListener('input', (e) => {
      currentTenderAmount = parseFloat(e.target.value) || 0;
      let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      let totalUsd = (rawSubtotal * (1 - currentDiscountPercent / 100)) * (1 + IVA_RATE);
      calculateChange(totalUsd);
    });
  }

  document.querySelectorAll('.fast-cash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      let totalUsd = (rawSubtotal * (1 - currentDiscountPercent / 100)) * (1 + IVA_RATE);

      if (btn.dataset.val === 'exact') {
        currentTenderAmount = totalUsd;
      } else {
        currentTenderAmount = parseFloat(btn.dataset.val) || 0;
      }
      if (tenderInput) tenderInput.value = currentTenderAmount.toFixed(2);
      calculateChange(totalUsd);
    });
  });

  function calculateChange(totalUsd) {
    if (!changeDueVal) return;
    if (selectedPaymentMethod !== 'efectivo') {
      changeDueVal.textContent = '$0.00';
      return;
    }

    const change = currentTenderAmount - totalUsd;
    if (change >= 0) {
      changeDueVal.textContent = `$${change.toFixed(2)}`;
      changeDueVal.style.color = 'var(--color-success)';
    } else {
      changeDueVal.textContent = `Faltan $${Math.abs(change).toFixed(2)}`;
      changeDueVal.style.color = 'var(--color-terracotta)';
    }
  }

  // ==========================================================================
  // PASO 3: REGISTRO MYSQL Y REINICIO AUTOMÁTICO DE ESTADO (resetPOS)
  // ==========================================================================
  if (btnCompleteSale) {
    btnCompleteSale.addEventListener('click', async () => {
      if (cart.length === 0) return;

      let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      let discountVal = rawSubtotal * (currentDiscountPercent / 100);
      let totalUsd = (rawSubtotal - discountVal) * (1 + IVA_RATE);
      let totalVes = totalUsd * bcvRate;

      if (selectedPaymentMethod === 'efectivo' && currentTenderAmount < totalUsd) {
        alert(`⚠️ El monto recibido ($${currentTenderAmount.toFixed(2)}) es menor al total ($${totalUsd.toFixed(2)}).`);
        return;
      }

      btnCompleteSale.disabled = true;
      btnCompleteSale.textContent = 'Registrando Venta en MySQL...';

      const salePayload = {
        order_number: `FAC-2026-${orderCounter}`,
        order_type: currentOrderType,
        payment_method: selectedPaymentMethod,
        discount_percent: currentDiscountPercent,
        subtotal: rawSubtotal,
        discount: discountVal,
        tax: (rawSubtotal - discountVal) * IVA_RATE,
        total_usd: totalUsd,
        total_ves: totalVes,
        bcv_rate: bcvRate,
        tender_amount: currentTenderAmount,
        change_due: selectedPaymentMethod === 'efectivo' ? Math.max(0, currentTenderAmount - totalUsd) : 0,
        reference_code: referenceInput ? referenceInput.value.trim() : '',
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          subtotal: i.product.price * i.quantity
        }))
      };

      try {
        const res = await fetch('../api/procesar_venta.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salePayload)
        });

        if (res.ok) {
          await res.json();
        }
      } catch (err) {
        console.warn('Persistencia MySQL:', err);
      }

      goToStep(3);
      showReceiptModal(salePayload);

      btnCompleteSale.disabled = false;
      btnCompleteSale.textContent = '✓ Finalizar Venta e Imprimir Ticket';
    });
  }

  function showReceiptModal(saleData) {
    if (!receiptContent || !receiptModal) return;

    receiptContent.innerHTML = `
      <div style="text-align: center; border-bottom: 1px dashed var(--color-muted); padding-bottom: 0.85rem; margin-bottom: 0.85rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--color-espresso);">🥖 La Nueva Parisienne</h2>
        <p style="font-size: 0.8rem; color: var(--color-muted);">Panadería & Pastelería Artesanal</p>
        <p style="font-size: 0.8rem; font-weight: 700; margin-top: 0.35rem;">Comprobante Nº: ${saleData.order_number}</p>
        <p style="font-size: 0.75rem; color: var(--color-muted);">${new Date().toLocaleString('es-VE')}</p>
      </div>

      <div style="margin-bottom: 0.85rem;">
        ${saleData.items.map(item => `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
            <span>${item.quantity}x ${item.product_name}</span>
            <strong>$${item.subtotal.toFixed(2)}</strong>
          </div>
        `).join('')}
      </div>

      <div style="border-top: 1px dashed var(--color-muted); padding-top: 0.65rem; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Total en Dólares ($):</span>
          <strong>$${saleData.total_usd.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: var(--color-success); font-weight: 800; font-size: 1.05rem; margin-top: 0.25rem;">
          <span>Total en Bolívares (BCV):</span>
          <span>Bs. ${saleData.total_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    `;

    receiptModal.classList.add('active');
  }

  // REINICIO AUTOMÁTICO TRAS CERRAR O IMPRIMIR EL COMPROBANTE
  if (closeReceiptModalBtn) {
    closeReceiptModalBtn.addEventListener('click', () => {
      receiptModal.classList.remove('active');
      resetPOS();
    });
  }

  if (btnNewSale) {
    btnNewSale.addEventListener('click', () => {
      receiptModal.classList.remove('active');
      resetPOS();
    });
  }

  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener('click', () => {
      window.print();
      // Reinicio automático inmediato tras finalizar la orden de impresión
      setTimeout(() => {
        receiptModal.classList.remove('active');
        resetPOS();
      }, 500);
    });
  }

  // FUNCIÓN MAESTRA DE REINICIO DE POS (resetPOS)
  function resetPOS() {
    cart = [];
    currentDiscountPercent = 0;
    currentTenderAmount = 0;
    if (tenderInput) tenderInput.value = '';
    if (referenceInput) referenceInput.value = '';
    if (discountSelect) discountSelect.value = '0';
    orderCounter++;
    initOrderNumber();
    updateCartTotals();
    renderStep1Cart();
    goToStep(1);
  }

  function initOrderNumber() {
    const code = `FAC-2026-${orderCounter}`;
    if (orderNumberEl) orderNumberEl.innerHTML = `<span>🧾 Comprobante:</span> <strong>${code}</strong>`;
    if (orderNumberPaso1) orderNumberPaso1.innerHTML = `<span>🛒 Orden:</span> <strong>${code}</strong>`;
  }
});
