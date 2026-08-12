/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR DEL ASISTENTE POR PASOS POS (POS.JS)
   - Flujo Wizard Estricto sin Buscador
   - Numpad Táctil 60x60px con Lógica ATM Style (Desplazamiento Decimales Der -> Izq)
   - Escuchador Físico 'keydown' (Teclas 0-9, Backspace, Delete)
   - Cálculo Automático de Vuelto Bimoneda ($ USD y Bs. VES via API BCV)
   - Reinicio Automático `resetPOS()` tras impresión de comprobante
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { CATEGORIES, PRODUCTS_DATABASE, ProductsStore } from '../data/products-db.js';

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
  let cart = []; // Array de ítems: { product, quantity }
  let currentDiscountPercent = 0;
  let currentOrderType = 'Para Llevar';
  let orderCounter = Math.floor(1000 + Math.random() * 9000);
  let selectedPaymentMethod = 'efectivo';
  
  // LÓGICA DE DÍGITOS DERECHA A IZQUIERDA (ATM / POS STYLE)
  let tenderCentsString = ''; // Cadena de centavos ingresada
  let currentTenderAmount = 0.00;
  
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
  
  // Paneles de Pago, Numpad y Modales
  const tenderInput = document.getElementById('tenderInput');
  const changeDueValUsd = document.getElementById('changeDueValUsd');
  const changeDueValVes = document.getElementById('changeDueValVes');
  const referenceInput = document.getElementById('referenceInput');
  const btnCompleteSale = document.getElementById('btnCompleteSale');
  const cashCalculatorPanel = document.getElementById('cashCalculatorPanel');
  const cardTransferPanel = document.getElementById('cardTransferPanel');
  
  const receiptModal = document.getElementById('receiptModal');
  const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
  const receiptContent = document.getElementById('receiptContent');
  const btnNewSale = document.getElementById('btnNewSale');
  const btnPrintReceipt = document.getElementById('btnPrintReceipt');

  // Inicialización Asíncrona Inmediata al Cargar Pantalla (DOMContentLoaded)
  initOrderNumber();
  await loadLiveBcvRate();
  await loadProductsCatalog();

  // ==========================================================================
  // CONSULTA DE TASA BCV EN VIVO VIA API PHP (BCV_RATE.PHP / BCMRATE.PHP)
  // ==========================================================================
  async function loadLiveBcvRate() {
    try {
      let res = await fetch(`../api/bcv_rate.php?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch(`../api/bcmrate.php?t=${Date.now()}`, { cache: 'no-store' });
      }
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
    
    if (bcvRateValEl && (!bcvRateValEl.textContent || bcvRateValEl.textContent.includes('Cargando'))) {
      bcvRateValEl.textContent = `Bs. ${bcvRate.toFixed(2)}`;
    }
    if (bcvRateBadge && bcvRateBadge.innerHTML.includes('Cargando')) {
      bcvRateBadge.innerHTML = `<span>🇻🇪 Tasa BCV (Resguardo):</span> <strong>Bs. ${bcvRate.toFixed(2)}</strong>`;
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
  // PASO 1: CARGA AUTOMÁTICA DE PRODUCTOS DE LA BD (SIN BUSCADOR)
  // ==========================================================================
  async function loadProductsCatalog() {
    try {
      const catalogData = await ProductsStore.getProductsCatalogAsync();
      if (catalogData && catalogData.products && catalogData.products.length > 0) {
        productsList = catalogData.products;
      } else {
        productsList = PRODUCTS_DATABASE;
      }
      if (catalogData && catalogData.categories && catalogData.categories.length > 0) {
        categoriesList = catalogData.categories;
      } else {
        categoriesList = CATEGORIES;
      }
    } catch (err) {
      console.warn('Error al cargar catálogo remoto:', err);
      productsList = PRODUCTS_DATABASE;
      categoriesList = CATEGORIES;
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
      return currentCategory === 'todos' || prod.category === currentCategory;
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥖</div>
          <p>No hay productos disponibles en esta categoría.</p>
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
        <div class="product-card-footer">
          <span class="product-price">$${prod.price.toFixed(2)}</span>
        </div>
      `;
      card.addEventListener('click', () => addToCart(prod));
      productsGrid.appendChild(card);
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
  // PASO 2: LÓGICA NUMPAD TÁCTIL Y DESPLAZAMIENTO DECIMAL DER -> IZQ (ATM STYLE)
  // ==========================================================================

  // Manejador del cambio de método de pago
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

  // ALGORITMO MAESTRO: ENTRADA DECIMAL IMPLÍCITA DE DERECHA A IZQUIERDA (CENTAVOS)
  function handleNumpadInput(key) {
    if (selectedPaymentMethod !== 'efectivo') return;

    if (key === 'backspace' || key === 'delete') {
      if (tenderCentsString.length > 0) {
        tenderCentsString = tenderCentsString.slice(0, -1);
      }
    } else if (key === '00') {
      if (tenderCentsString.length > 0 && tenderCentsString.length <= 6) {
        tenderCentsString += '00';
      }
    } else if (/^[0-9]$/.test(key)) {
      if (tenderCentsString.length === 0 && key === '0') {
        // Ignorar ceros iniciales
        return;
      }
      if (tenderCentsString.length < 7) { // Máximo $99,999.99
        tenderCentsString += key;
      }
    }

    updateTenderFromCentsString();
  }

  function updateTenderFromCentsString() {
    if (tenderCentsString.length === 0) {
      currentTenderAmount = 0.00;
    } else {
      const centsVal = parseInt(tenderCentsString, 10);
      currentTenderAmount = centsVal / 100;
    }

    if (tenderInput) {
      tenderInput.value = currentTenderAmount.toFixed(2);
    }

    let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    let totalUsd = (rawSubtotal * (1 - currentDiscountPercent / 100)) * (1 + IVA_RATE);
    calculateChange(totalUsd);
  }

  // 1. Escuchar clics en los botones del Numpad Táctil (0-9, 00, ⌫)
  document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.dataset.key;
      handleNumpadInput(key);
    });
  });

  // 2. Escuchar teclado físico (Event keydown en la ventana) cuando está en Paso 2 y Efectivo
  window.addEventListener('keydown', (e) => {
    if (currentStep !== 2 || selectedPaymentMethod !== 'efectivo') return;

    // Si el usuario presiona números 0-9
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleNumpadInput(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      handleNumpadInput('backspace');
    }
  });

  // Billetes Rápidos ($5, $10, $20, $50, Exacto)
  document.querySelectorAll('.fast-cash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      let totalUsd = (rawSubtotal * (1 - currentDiscountPercent / 100)) * (1 + IVA_RATE);

      if (btn.dataset.val === 'exact') {
        currentTenderAmount = totalUsd;
      } else {
        currentTenderAmount = parseFloat(btn.dataset.val) || 0;
      }

      // Convertir el monto a centavos para sincronizar la cadena
      tenderCentsString = Math.round(currentTenderAmount * 100).toString();
      if (tenderInput) tenderInput.value = currentTenderAmount.toFixed(2);
      calculateChange(totalUsd);
    });
  });

  // CÁLCULO DE VUELTO BI-MONEDA ($ USD Y Bs. VES VIA API BCV)
  function calculateChange(totalUsd) {
    if (!changeDueValUsd || !changeDueValVes) return;

    if (selectedPaymentMethod !== 'efectivo') {
      changeDueValUsd.textContent = '$0.00 USD';
      changeDueValVes.textContent = 'Bs. 0,00 VES';
      changeDueValUsd.style.color = 'var(--color-success)';
      return;
    }

    const changeUsd = currentTenderAmount - totalUsd;
    const changeVes = changeUsd * bcvRate;

    if (changeUsd >= 0) {
      changeDueValUsd.textContent = `$${changeUsd.toFixed(2)} USD`;
      changeDueValVes.textContent = `Bs. ${changeVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`;
      changeDueValUsd.style.color = 'var(--color-success)';
      changeDueValVes.style.color = 'var(--color-success)';
    } else {
      const missingUsd = Math.abs(changeUsd);
      const missingVes = Math.abs(changeVes);
      changeDueValUsd.textContent = `Faltan $${missingUsd.toFixed(2)}`;
      changeDueValVes.textContent = `Faltan Bs. ${missingVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      changeDueValUsd.style.color = 'var(--color-terracotta)';
      changeDueValVes.style.color = 'var(--color-terracotta)';
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

    const formattedDate = new Date().toLocaleString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    receiptContent.innerHTML = `
      <div class="ticket-thermal-container" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000000; text-align: left; line-height: 1.25;">
        <!-- CABECERA DE LA EMPRESA -->
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">
          <div style="font-size: 14px; text-transform: uppercase;">LA NUEVA PARISIENNE</div>
          <div>PANADERÍA & PASTELERÍA C.A.</div>
          <div>RIF: J-40123456-7</div>
          <div style="font-size: 9px; font-weight: normal;">Av. Lara con Calle 8, Barquisimeto, Edo. Lara</div>
          <div style="font-size: 9px; font-weight: normal;">Teléfono: (0251) 555-1234</div>
        </div>

        <div style="border-top: 1px dashed #000000; margin: 4px 0;"></div>

        <!-- DATOS DEL DOCUMENTO FISCAL Y CLIENTE -->
        <div style="font-size: 10px;">
          <div><strong>FACTURA DE VENTA N°:</strong> ${saleData.order_number}</div>
          <div><strong>FECHA / HORA:</strong> ${formattedDate}</div>
          <div><strong>CONDICIÓN:</strong> ${saleData.order_type || 'Para Llevar'}</div>
          <div style="border-top: 1px dotted #000; margin: 3px 0;"></div>
          <div><strong>CLIENTE:</strong> Consumidor Final</div>
          <div><strong>C.I. / RIF:</strong> V-00000000-0</div>
        </div>

        <div style="border-top: 1px dashed #000000; margin: 4px 0;"></div>

        <!-- TABLA DETALLE DE COMPRA -->
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="width: 12%;">Cant</th>
              <th style="width: 48%;">Descripción</th>
              <th style="width: 20%; text-align: right;">P.U ($)</th>
              <th style="width: 20%; text-align: right;">Total($)</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items.map(item => `
              <tr>
                <td style="vertical-align: top;">${item.quantity}</td>
                <td style="vertical-align: top;">${item.product_name}</td>
                <td style="vertical-align: top; text-align: right;">$${item.unit_price.toFixed(2)}</td>
                <td style="vertical-align: top; text-align: right;">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000000; margin: 4px 0;"></div>

        <!-- DESGLOSE DE TOTALES EN DÓLARES ($) -->
        <div style="font-size: 10px; line-height: 1.3;">
          <div style="display: flex; justify-content: space-between;">
            <span>SUBTOTAL NETO:</span>
            <span>$${saleData.subtotal.toFixed(2)}</span>
          </div>
          ${saleData.discount > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>DESCUENTO (${saleData.discount_percent}%):</span>
              <span>-$${saleData.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span>IVA FISCAL (16%):</span>
            <span>$${saleData.tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 2px;">
            <span>TOTAL PAGADO ($):</span>
            <span>$${saleData.total_usd.toFixed(2)}</span>
          </div>
        </div>

        <div style="border-top: 2px double #000000; margin: 5px 0;"></div>

        <!-- INFORMACIÓN CAMBIARIA BCV (CRÍTICO SENIAT / VENEZUELA) -->
        <div style="text-align: center; margin: 4px 0; padding: 4px 0; border: 1px solid #000; border-radius: 2px;">
          <div style="font-size: 9px; font-weight: bold;">CONVERSIÓN TASA OFICIAL BCV</div>
          <div style="font-size: 10px; font-weight: bold;">TASA BCV: Bs. ${saleData.bcv_rate.toFixed(2)} / USD</div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">
            TOTAL EN BS: Bs. ${saleData.total_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <!-- INFORMACIÓN DE PAGO Y VUELTO -->
        <div style="font-size: 9px; margin-top: 3px;">
          <div><strong>MEDIO DE PAGO:</strong> ${(saleData.payment_method || 'EFECTIVO').toUpperCase()}</div>
          ${saleData.payment_method === 'efectivo' ? `
            <div>Monto Recibido ($): $${saleData.tender_amount.toFixed(2)}</div>
            <div>Vuelto Entregado ($): $${saleData.change_due.toFixed(2)} (Bs. ${(saleData.change_due * saleData.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</div>
          ` : `
            <div>Ref. Operación: ${saleData.reference_code || 'N/A'}</div>
          `}
        </div>

        <div style="border-top: 1px dashed #000000; margin: 6px 0 4px 0;"></div>

        <!-- PIE DE PÁGINA DE FACTURA -->
        <div style="text-align: center; font-size: 10px; font-weight: bold;">
          <div>¡GRACIAS POR SU COMPRA!</div>
          <div style="font-size: 8px; font-weight: normal; margin-top: 2px;">COMPROBANTE DE CONTROL INTERNO</div>
          <div style="font-size: 8px; font-weight: normal;">LA NUEVA PARISIENNE - BARQUISIMETO</div>
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
    currentTenderAmount = 0.00;
    tenderCentsString = '';
    currentCategory = 'todos';
    if (tenderInput) tenderInput.value = '0.00';
    if (referenceInput) referenceInput.value = '';
    if (discountSelect) discountSelect.value = '0';
    orderCounter++;
    initOrderNumber();
    updateCartTotals();
    renderStep1Cart();
    renderCategoryTabs();
    renderProducts();
    goToStep(1);
  }

  function initOrderNumber() {
    const code = `FAC-2026-${orderCounter}`;
    if (orderNumberEl) orderNumberEl.innerHTML = `<span>🧾 Comprobante:</span> <strong>${code}</strong>`;
    if (orderNumberPaso1) orderNumberPaso1.innerHTML = `<span>🛒 Orden:</span> <strong>${code}</strong>`;
  }
});
