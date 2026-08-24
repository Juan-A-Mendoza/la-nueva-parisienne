/* ==========================================================================
   LA NUEVA PARISIENNE - CONTROLADOR DEL ASISTENTE POR PASOS POS (POS.JS)
   - Flujo Wizard Estricto sin Buscador
   - Numpad Táctil 60x60px con Lógica ATM Style (Desplazamiento Decimales Der -> Izq)
   - Escuchador Físico 'keydown' (Teclas 0-9, Backspace, Delete)
   - Cálculo Automático de Vuelto Bimoneda ($ USD y Bs. VES via API BCV)
   - Reinicio Automático `resetPOS()` tras impresión de comprobante
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { BcvRateStore } from '../core/bcv-rate-store.js';
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

  // DATOS FISCALES DINÁMICOS DE LA EMPRESA (MÓDULO 9)
  let companyInfo = {
    nombre: 'La Nueva Parisienne Panadería & Pastelería C.A.',
    rif: 'J-40123456-7',
    direccion: 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara',
    telefono: '(0251) 555-1234'
  };

  const IVA_RATE = 0.16; // 16% IVA Fiscal

  // 3. Elementos DOM
  const clientNameInput = document.getElementById('clientNameInput');
  const clientRifInput = document.getElementById('clientRifInput');

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
  const customDiscountWrapper = document.getElementById('customDiscountWrapper');
  const customDiscountInput = document.getElementById('customDiscountInput');
  const discountSavingsBadge = document.getElementById('discountSavingsBadge');
  const discountBadgeAmount = document.getElementById('discountBadgeAmount');
  const taxValEl = document.getElementById('taxVal');
  const totalValEl = document.getElementById('totalVal');
  const totalVesEl = document.getElementById('totalVesVal');
  
  // Paneles de Pago, Numpad y Modales
  const tenderInput = document.getElementById('tenderInput');
  const changeDueValUsd = document.getElementById('changeDueValUsd');
  const changeDueValVes = document.getElementById('changeDueValVes');
  const cardTotalUsdVal = document.getElementById('cardTotalUsdVal');
  const cardTotalVesVal = document.getElementById('cardTotalVesVal');
  const cardTransferMsg = document.getElementById('cardTransferMsg');
  const bankSelectGroup = document.getElementById('bankSelectGroup');
  const bankSelect = document.getElementById('bankSelect');
  const referenceInput = document.getElementById('referenceInput');
  const btnCompleteSale = document.getElementById('btnCompleteSale');
  const cashCalculatorPanel = document.getElementById('cashCalculatorPanel');
  const cardTransferPanel = document.getElementById('cardTransferPanel');
  
  const receiptModal = document.getElementById('receiptModal');
  const closeReceiptModalBtn = document.getElementById('closeReceiptModalBtn');
  const receiptContent = document.getElementById('receiptContent');
  const btnNewSale = document.getElementById('btnNewSale');
  const btnPrintReceipt = document.getElementById('btnPrintReceipt');

  // Modal de Confirmación Personalizado (Sin emergentes nativos)
  const customConfirmModal = document.getElementById('customConfirmModal');
  const confirmModalIcon = document.getElementById('confirmModalIcon');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalText = document.getElementById('confirmModalText');
  const btnConfirmCancel = document.getElementById('btnConfirmCancel');
  const btnConfirmAccept = document.getElementById('btnConfirmAccept');

  function showCustomConfirm({ icon = '⚠️', title = '¿Confirmar Acción?', text = '', acceptText = 'Sí, Confirmar', singleAction = false, onAccept }) {
    if (!customConfirmModal) return;
    if (confirmModalIcon) confirmModalIcon.textContent = icon;
    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalText) confirmModalText.innerHTML = text.replace(/\n/g, '<br>');
    if (btnConfirmAccept) btnConfirmAccept.textContent = acceptText;

    if (btnConfirmCancel) {
      btnConfirmCancel.style.display = singleAction ? 'none' : 'block';
    }

    customConfirmModal.classList.add('active');

    const handleAccept = () => {
      customConfirmModal.classList.remove('active');
      btnConfirmAccept.removeEventListener('click', handleAccept);
      btnConfirmCancel.removeEventListener('click', handleCancel);
      if (onAccept) onAccept();
    };

    const handleCancel = () => {
      customConfirmModal.classList.remove('active');
      btnConfirmAccept.removeEventListener('click', handleAccept);
      btnConfirmCancel.removeEventListener('click', handleCancel);
    };

    btnConfirmAccept.addEventListener('click', handleAccept);
    btnConfirmCancel.addEventListener('click', handleCancel);
  }

  // Inicialización Asíncrona Inmediata al Cargar Pantalla (DOMContentLoaded)
  initOrderNumber();
  await loadCompanyData();
  await loadLiveBcvRate();
  await loadProductsCatalog();

  // ==========================================================================
  // CONSULTA DE DATOS FISCALES DE LA EMPRESA DESDE MYSQL (MÓDULO 9)
  // ==========================================================================
  async function loadCompanyData() {
    try {
      const res = await fetch(`../api/get_empresa.php?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.empresa) {
          companyInfo = data.empresa;
        }
      }
    } catch (e) {
      console.warn('Error al cargar los datos fiscales de la empresa:', e);
    }
  }

  // ==========================================================================
  // REQUERIMIENTO 3: SINCRONIZACIÓN DE TASA CON CAJA USANDO LOCALSTORAGE (MÓDULO 3)
  // ==========================================================================
  async function resolveBcvRate() {
    // 1. Al cargar la página o calcular totales, primero pregunta si modo_tasa/modoTasa es manual
    const modoGuardado = localStorage.getItem('modo_tasa') || localStorage.getItem('modoTasa');
    if (modoGuardado === 'manual') {
      const tasaManualVal = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual'));
      if (tasaManualVal && tasaManualVal > 0) {
        updatePosRateBadge(tasaManualVal, 'Tasa: Manual (Editada)', true);
        return tasaManualVal;
      }
    }

    // 2. Si es automático, hacer fetch a ve.dolarapi.com/v1/dolares/oficial
    const apis = [
      'https://ve.dolarapi.com/v1/dolares/oficial',
      'https://bcv-api.vercel.app/api/bcv'
    ];

    for (const url of apis) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const liveRate = parseFloat(data.promedio || data.precio || data.monto || data.rate);
          if (liveRate && liveRate > 0) {
            localStorage.setItem('tasa_auto', liveRate.toString());
            localStorage.setItem('bcv_current_rate', liveRate.toString());
            updatePosRateBadge(liveRate, 'Tasa: BCV Oficial (En Vivo)', false);
            return liveRate;
          }
        }
      } catch (e) {
        console.warn(`Error al consultar ${url} en POS:`, e);
      }
    }

    const fallbackRate = parseFloat(localStorage.getItem('tasa_manual') || localStorage.getItem('tasaManual')) || 784.66;
    updatePosRateBadge(fallbackRate, 'Tasa: Resguardo', true);
    return fallbackRate;
  }

  function updatePosRateBadge(rate, labelText, isManual) {
    bcvRate = rate;
    const bcvRateValEl = document.getElementById('bcvRateVal');
    const bcvRateBadge = document.getElementById('bcvRateBadge');

    if (bcvRateValEl) {
      bcvRateValEl.textContent = `Bs. ${rate.toFixed(2)}`;
    }
    if (bcvRateBadge) {
      bcvRateBadge.innerHTML = `<span>🇻🇪 ${labelText}:</span> <strong>Bs. ${rate.toFixed(2)}</strong>`;
      bcvRateBadge.className = isManual ? 'bcv-rate-badge warning' : 'bcv-rate-badge';
    }
  }

  async function loadLiveBcvRate() {
    bcvRate = await resolveBcvRate();
    updateCartTotals();
  }

  // Escuchar cambios de localStorage y BroadcastChannel en tiempo real cuando el Gerente modifica la tasa o productos POS
  if (typeof BroadcastChannel !== 'undefined') {
    const rateChannel = new BroadcastChannel('lnp_bcv_channel');
    rateChannel.onmessage = async () => {
      await loadLiveBcvRate();
    };

    const posChannel = new BroadcastChannel('lnp_pos_catalog_channel');
    posChannel.onmessage = async () => {
      await loadProductsCatalog();
    };
  }

  window.addEventListener('storage', async (e) => {
    await loadLiveBcvRate();
    if (e.key === 'catalogo_pos') {
      await loadProductsCatalog();
    }
  });
  window.addEventListener('bcvRateChanged', async () => {
    await loadLiveBcvRate();
  });
  window.addEventListener('catalogoPosChanged', async () => {
    await loadProductsCatalog();
  });
  BcvRateStore.subscribe(async () => {
    await loadLiveBcvRate();
  });

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
    showCustomConfirm({
      icon: '🚫',
      title: '¿Empezar de Cero?',
      text: '¿Desea cancelar el pedido actual y reiniciar el punto de venta a su estado original?',
      acceptText: 'Sí, Cancelar Todo',
      onAccept: () => {
        resetPOS();
      }
    });
  });

  // Selector "Para Llevar" vs "Consumo Local" (Paso 2)
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderType = btn.dataset.type || 'Para Llevar';
    });
  });

  // ==========================================================================
  // ==========================================================================
  // PASO 1: CARGA DE PRODUCTOS DESDE LA ÚNICA FUENTE DE VERDAD (catalogo_pos)
  // ==========================================================================
  function syncProductsWithPosCatalog() {
    try {
      const storedCatalog = localStorage.getItem('catalogo_pos');
      if (storedCatalog) {
        const catalogList = JSON.parse(storedCatalog);
        if (Array.isArray(catalogList) && catalogList.length > 0) {
          productsList.forEach(p => {
            const match = catalogList.find(c => c.id === p.id || c.code === p.code || c.name === p.name);
            if (match) {
              p.stock = parseFloat(match.stock) || 0;
              if (match.salePrice) p.price = parseFloat(match.salePrice);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error al sincronizar stock desde catalogo_pos:', e);
    }
  }

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
    
    // Sincronización única con la clave 'catalogo_pos' en localStorage
    syncProductsWithPosCatalog();

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

    // Sincronizar stock dinámico en tiempo real desde la Única Fuente de Verdad (catalogo_pos)
    syncProductsWithPosCatalog();

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
      const availableStock = prod.stock;
      card.innerHTML = `
        <span class="product-stock-badge" style="${availableStock <= 0 ? 'background: rgba(198, 40, 40, 0.12); color: var(--color-danger); border-color: rgba(198, 40, 40, 0.3);' : ''}">${availableStock > 0 ? `Disponibles: ${availableStock}` : 'Agotado (0)'}</span>
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
    const currentStock = typeof product.stock === 'number' ? product.stock : 0;

    // 4. Prevención de Errores: Stock Insuficiente
    if (currentStock <= 0) {
      alert("Stock insuficiente.");
      return;
    }

    const existing = cart.find(item => item.product.id === product.id || item.product.code === product.code);
    if (existing) {
      if (existing.quantity < currentStock) {
        existing.quantity += 1;
      } else {
        alert("Stock insuficiente.");
        return;
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
        <div class="cart-qty-controls">
          <button type="button" class="btn-qty btn-dec">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button type="button" class="btn-qty btn-inc">+</button>
        </div>
        <span class="cart-item-total">$${(item.product.price * item.quantity).toFixed(2)}</span>
      `;

      row.querySelector('.btn-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(i => (i.product.id && i.product.id !== item.product.id) || (i.product.code && i.product.code !== item.product.code));
        }
        updateCartTotals();
        renderStep1Cart();
      });

      row.querySelector('.btn-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        const currentStock = typeof item.product.stock === 'number' ? item.product.stock : 0;

        if (item.quantity < currentStock) {
          item.quantity += 1;
          updateCartTotals();
          renderStep1Cart();
        } else {
          alert("Stock insuficiente.");
        }
      });

      step1CartItemsList.appendChild(row);
    });
  }

  function updateCartTotals() {
    // Requerimiento 3: Verificar si el modo es manual en localStorage antes de calcular
    const modoTasaLocal = localStorage.getItem('modoTasa');
    const tasaManualLocal = localStorage.getItem('tasaManual');
    if (modoTasaLocal === 'manual' && tasaManualLocal && parseFloat(tasaManualLocal) > 0) {
      bcvRate = parseFloat(tasaManualLocal);
    }

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

    if (discountSavingsBadge && discountBadgeAmount) {
      if (discountAmount > 0) {
        discountSavingsBadge.style.display = 'flex';
        discountBadgeAmount.textContent = `-$${discountAmount.toFixed(2)} USD (-${currentDiscountPercent}%)`;
      } else {
        discountSavingsBadge.style.display = 'none';
      }
    }

    // Actualizar Totales Prominentes Panel Tarjeta / Pago Móvil
    if (cardTotalUsdVal) cardTotalUsdVal.textContent = `$${finalTotalUsd.toFixed(2)}`;
    if (cardTotalVesVal) {
      cardTotalVesVal.textContent = `Bs. ${finalTotalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      if (cart.length === 0) return;
      showCustomConfirm({
        icon: '🗑️',
        title: '¿Vaciar Pedido?',
        text: '¿Está seguro de que desea eliminar todos los productos del carrito actual?',
        acceptText: 'Sí, Vaciar Carrito',
        onAccept: () => {
          cart = [];
          updateCartTotals();
          renderStep1Cart();
        }
      });
    });
  }

  function handleDiscountChange() {
    const val = discountSelect ? discountSelect.value : '0';
    if (val === 'custom') {
      if (customDiscountWrapper) customDiscountWrapper.style.display = 'flex';
      const customVal = parseFloat(customDiscountInput?.value || 0);
      currentDiscountPercent = Math.min(100, Math.max(0, customVal));
    } else {
      if (customDiscountWrapper) customDiscountWrapper.style.display = 'none';
      currentDiscountPercent = parseFloat(val) || 0;
    }
    updateCartTotals();
  }

  if (discountSelect) {
    discountSelect.addEventListener('change', handleDiscountChange);
  }
  if (customDiscountInput) {
    customDiscountInput.addEventListener('input', handleDiscountChange);
  }

  // ==========================================================================
  // PASO 2: LÓGICA NUMPAD TÁCTIL Y DESPLAZAMIENTO DECIMAL DER -> IZQ (ATM STYLE)
  // ==========================================================================

  // Manejador del cambio de método de pago (Efectivo, T. Débito, T. Crédito, Pago Móvil)
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
        if (bankSelectGroup) {
          bankSelectGroup.style.display = selectedPaymentMethod === 'transferencia' ? 'flex' : 'none';
        }
        if (cardTransferMsg) {
          if (selectedPaymentMethod === 'debito') {
            cardTransferMsg.textContent = '💳 Pase o inserte la Tarjeta de DÉBITO en el terminal de punto de venta por el monto exacto.';
          } else if (selectedPaymentMethod === 'credito') {
            cardTransferMsg.textContent = '💳 Pase o inserte la Tarjeta de CRÉDITO en el terminal de punto de venta por el monto exacto.';
          } else if (selectedPaymentMethod === 'transferencia') {
            cardTransferMsg.textContent = '📲 Escanee el código QR o realice el pago móvil por el monto exacto en Bolívares.';
          } else {
            cardTransferMsg.textContent = '💳 Pase o inserte la tarjeta en el terminal de punto de venta por el monto exacto.';
          }
        }
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

    // PREVENIR KEYSTROKE STEALING: Si el foco está en un campo de texto o selección de la interfaz
    const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
      if (document.activeElement !== tenderInput) {
        return; // Permitir tipeo libre en clientNameInput, clientRifInput, referenceInput, etc.
      }
    }

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

  // Limpiar resaltado de error al escribir en la Cédula/RIF del cliente
  if (clientRifInput) {
    clientRifInput.addEventListener('input', () => {
      if (clientRifInput.value.trim() !== '') {
        clientRifInput.style.border = '1px solid var(--border-subtle)';
        clientRifInput.style.background = '#FFFFFF';
      }
    });
  }

  // ==========================================================================
  // PASO 3: REGISTRO MYSQL Y REINICIO AUTOMÁTICO DE ESTADO (resetPOS)
  // ==========================================================================
  if (btnCompleteSale) {
    btnCompleteSale.addEventListener('click', async () => {
      if (cart.length === 0) return;

      // 0. VALIDACIÓN OBLIGATORIA: CÉDULA / RIF DEL CLIENTE (PARA TODOS LOS MÉTODOS DE PAGO)
      const rawRif = clientRifInput ? clientRifInput.value.trim() : '';
      if (!rawRif || rawRif === '') {
        if (clientRifInput) {
          clientRifInput.style.border = '2px solid var(--color-terracotta)';
          clientRifInput.style.background = '#FFF0F0';
          clientRifInput.focus();
        }

        showCustomConfirm({
          icon: '🪪',
          title: 'Cédula o RIF del Cliente Requerido',
          text: 'Por disposición fiscal y de control interno, es OBLIGATORIO ingresar la Cédula o RIF del cliente para finalizar la venta en cualquier método de pago (Efectivo, Débito, Crédito o Pago Móvil).',
          acceptText: 'Entendido / Ingresar Cédula',
          singleAction: true
        });
        return;
      }

      let rawSubtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      let discountVal = rawSubtotal * (currentDiscountPercent / 100);
      let totalUsd = (rawSubtotal - discountVal) * (1 + IVA_RATE);
      let totalVes = totalUsd * bcvRate;

      const clientName = (clientNameInput && clientNameInput.value.trim()) ? clientNameInput.value.trim() : 'Consumidor Final';
      const clientRif = rawRif;
      const bankName = (bankSelect && bankSelect.value.trim()) ? bankSelect.value.trim() : '';

      const salePayload = {
        order_number: `FAC-2026-${orderCounter}`,
        client_name: clientName,
        client_rif: clientRif,
        order_type: currentOrderType,
        payment_method: selectedPaymentMethod,
        bank_name: bankName,
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

      // 1. VALIDACIÓN: MONTO ENTREGADO INSUFICIENTE EN EFECTIVO
      if (selectedPaymentMethod === 'efectivo' && currentTenderAmount < totalUsd) {
        const missingUsd = totalUsd - currentTenderAmount;
        const missingVes = missingUsd * bcvRate;

        showCustomConfirm({
          icon: '⚠️',
          title: 'Monto Recibido Insuficiente',
          text: `El monto entregado ($${currentTenderAmount.toFixed(2)}) es menor al total de la venta ($${totalUsd.toFixed(2)}).\n\nFalta por recibir: $${missingUsd.toFixed(2)} USD (Bs. ${missingVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES).`,
          acceptText: 'Entendido / Ajustar Monto',
          singleAction: true
        });
        return;
      }

      // 2. VALIDACIÓN: MONTO ENTREGADO SUPERIOR (CONFIRMACIÓN DE VUELTO)
      if (selectedPaymentMethod === 'efectivo' && currentTenderAmount > totalUsd) {
        const changeUsd = currentTenderAmount - totalUsd;
        const changeVes = changeUsd * bcvRate;

        showCustomConfirm({
          icon: '💵',
          title: '¿Confirmar Cobro y Vuelto?',
          text: `Monto Recibido: $${currentTenderAmount.toFixed(2)} USD\nTotal de Venta: $${totalUsd.toFixed(2)} USD\n\nVuelto a Entregar: $${changeUsd.toFixed(2)} USD (Bs. ${changeVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES).\n\n¿Desea procesar la venta y emitir la factura?`,
          acceptText: 'Sí, Procesar Venta',
          singleAction: false,
          onAccept: () => {
            executeSaleProcess(salePayload);
          }
        });
        return;
      }

      // 3. PAGO EXACTO O TARJETA / PAGO MÓVIL
      await executeSaleProcess(salePayload);
    });
  }

  async function executeSaleProcess(salePayload) {
    btnCompleteSale.disabled = true;
    btnCompleteSale.textContent = 'Registrando Venta en MySQL...';

    // 1. Deducción al Facturar en la Única Fuente de Verdad: catalogo_pos en localStorage
    try {
      const storedCatalog = localStorage.getItem('catalogo_pos');
      let catalogList = storedCatalog ? JSON.parse(storedCatalog) : [];

      if (!Array.isArray(catalogList) || catalogList.length === 0) {
        catalogList = PRODUCTS_DATABASE.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          unitCost: p.unitCost || 1.0,
          salePrice: p.price,
          unit: p.unit || 'Und',
          stock: p.stock,
          minStock: 10,
          icon: p.icon,
          showInPos: true,
          description: p.description
        }));
      }

      // Restar la cantidad vendida exacta para cada producto en catalogo_pos
      cart.forEach(item => {
        const itemId = item.product.id;
        const itemCode = item.product.code;
        const itemName = item.product.name;
        const qtySold = parseFloat(item.quantity) || 0;

        const target = catalogList.find(p => p.id === itemId || p.code === itemCode || p.name === itemName);
        if (target) {
          target.stock = Math.max(0, (parseFloat(target.stock) || 0) - qtySold);
        }
      });

      // Sobrescribir el localStorage con la fuente unificada
      localStorage.setItem('catalogo_pos', JSON.stringify(catalogList));

      // 2. Registro Global de Auditoría (localStorage: 'movimientos_inventario')
      try {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const session = SessionStore.getSession();
        const activeUser = session?.user?.name || document.getElementById('cashierName')?.textContent || 'Élodie Martin';

        let formattedPaymentMethod = 'Efectivo';
        if (selectedPaymentMethod === 'debito') formattedPaymentMethod = 'Tarjeta Débito';
        else if (selectedPaymentMethod === 'credito') formattedPaymentMethod = 'Tarjeta Crédito';
        else if (selectedPaymentMethod === 'pagomovil') formattedPaymentMethod = 'Pago Móvil';
        else if (selectedPaymentMethod === 'efectivo') formattedPaymentMethod = 'Efectivo';

        const orderCodeText = salePayload.orderNumber || document.getElementById('orderNumber')?.textContent?.replace('🧾 Comprobante:', '')?.trim() || `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const newMovement = {
          id: `mov_${Date.now()}`,
          code: orderCodeText,
          timestamp: formattedTimestamp,
          type: 'Venta POS',
          category: 'venta',
          user: activeUser,
          paymentMethod: formattedPaymentMethod,
          status: 'Completado',
          amount: parseFloat(salePayload.totalUsd || 0),
          itemsCount: cart.reduce((sum, i) => sum + i.quantity, 0),
          breakdown: cart.map(i => ({
            name: `${i.product.icon || '🥖'} ${i.product.name} (x${i.quantity})`,
            price: `$${(i.product.price * i.quantity).toFixed(2)} USD`
          }))
        };

        const rawMovs = localStorage.getItem('movimientos_inventario');
        let movsList = rawMovs ? JSON.parse(rawMovs) : [];
        movsList.unshift(newMovement);
        localStorage.setItem('movimientos_inventario', JSON.stringify(movsList));

        // Disparar eventos de inventario y auditoría en tiempo real (Módulo 3 -> Módulo 4)
        window.dispatchEvent(new Event('catalogoPosChanged'));
        window.dispatchEvent(new Event('movimientosChanged'));
        if (typeof BroadcastChannel !== 'undefined') {
          const posChannel = new BroadcastChannel('lnp_pos_catalog_channel');
          posChannel.postMessage({ type: 'catalog_updated', timestamp: Date.now() });

          const movChannel = new BroadcastChannel('lnp_movements_channel');
          movChannel.postMessage({ type: 'movement_added', timestamp: Date.now() });
        }
      } catch (errMov) {
        console.error('Error registrando auditoría en movimientos_inventario:', errMov);
      }
    } catch (e) {
      console.error('Error al descontar stock de catalogo_pos al facturar:', e);
    }

    // Refrescar lista de productos del POS
    await loadProductsCatalog();

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

    // MUESTRA EL MODAL ANIMADO DE ÉXITO CON CHECKMARK SVG ANTES DEL TICKET
    showPosSuccessModal(() => {
      goToStep(3);
      showReceiptModal(salePayload);
      btnCompleteSale.disabled = false;
      btnCompleteSale.textContent = '✓ Finalizar Venta e Imprimir Ticket';
    });
  }

  function showPosSuccessModal(callback) {
    const posSuccessModal = document.getElementById('posSuccessModal');
    if (posSuccessModal) {
      posSuccessModal.style.display = 'flex';
      posSuccessModal.classList.add('active');

      const svg = posSuccessModal.querySelector('.success-checkmark-svg');
      if (svg) {
        svg.style.animation = 'none';
        void svg.offsetWidth;
        svg.style.animation = '';
      }

      setTimeout(() => {
        posSuccessModal.classList.remove('active');
        posSuccessModal.style.display = 'none';
        if (callback) callback();
      }, 1600);
    } else {
      if (callback) callback();
    }
  }

  function showReceiptModal(saleData) {
    if (!receiptContent || !receiptModal) return;

    const formattedDate = new Date().toLocaleString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    receiptContent.innerHTML = `
      <div class="ticket-thermal-container" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000000; text-align: left; line-height: 1.25;">
        <!-- CABECERA DINÁMICA DE LA EMPRESA (MÓDULO 9) -->
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">
          <div style="font-size: 13px; text-transform: uppercase;">${companyInfo.nombre || 'LA NUEVA PARISIENNE'}</div>
          <div>RIF: ${companyInfo.rif || 'J-40123456-7'}</div>
          <div style="font-size: 9px; font-weight: normal;">${companyInfo.direccion || 'Barquisimeto, Edo. Lara'}</div>
          <div style="font-size: 9px; font-weight: normal;">Teléfono: ${companyInfo.telefono || '(0251) 555-1234'}</div>
        </div>

        <div style="border-top: 1px dashed #000000; margin: 4px 0;"></div>

        <!-- DATOS DEL DOCUMENTO FISCAL Y CLIENTE DINÁMICOS -->
        <div style="font-size: 10px;">
          <div><strong>FACTURA DE VENTA N°:</strong> ${saleData.order_number}</div>
          <div><strong>FECHA / HORA:</strong> ${formattedDate}</div>
          <div><strong>CONDICIÓN:</strong> ${saleData.order_type || 'Para Llevar'}</div>
          <div style="border-top: 1px dotted #000; margin: 3px 0;"></div>
          <div><strong>CLIENTE:</strong> ${saleData.client_name}</div>
          <div><strong>C.I. / RIF:</strong> ${saleData.client_rif}</div>
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
          <div><strong>MEDIO DE PAGO:</strong> ${
            saleData.payment_method === 'debito' ? 'TARJETA DE DÉBITO' :
            (saleData.payment_method === 'credito' ? 'TARJETA DE CRÉDITO' :
            (saleData.payment_method === 'transferencia' ? 'PAGO MÓVIL / QR' :
            (saleData.payment_method === 'tarjeta' ? 'TARJETA (DÉBITO/CRÉDITO)' : 'EFECTIVO')))
          }</div>
          ${saleData.payment_method === 'efectivo' ? `
            <div>Monto Recibido ($): $${saleData.tender_amount.toFixed(2)}</div>
            <div>Vuelto Entregado ($): $${saleData.change_due.toFixed(2)} (Bs. ${(saleData.change_due * saleData.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</div>
          ` : `
            ${saleData.bank_name ? `<div><strong>BANCO EMISOR:</strong> ${saleData.bank_name}</div>` : ''}
            <div><strong>REF. OPERACIÓN:</strong> ${saleData.reference_code || 'N/A'}</div>
          `}
        </div>

        <div style="border-top: 1px dashed #000000; margin: 6px 0 4px 0;"></div>

        <!-- PIE DE PÁGINA DE FACTURA -->
        <div style="text-align: center; font-size: 10px; font-weight: bold;">
          <div>¡GRACIAS POR SU COMPRA!</div>
          <div style="font-size: 8px; font-weight: normal; margin-top: 2px;">COMPROBANTE DE CONTROL INTERNO</div>
          <div style="font-size: 8px; font-weight: normal;">${companyInfo.nombre || 'LA NUEVA PARISIENNE'}</div>
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
    if (bankSelect) bankSelect.value = '';
    if (clientNameInput) clientNameInput.value = '';
    if (clientRifInput) {
      clientRifInput.value = '';
      clientRifInput.style.border = '1px solid var(--border-subtle)';
      clientRifInput.style.background = '#FFFFFF';
    }
    if (discountSelect) discountSelect.value = '0';
    if (customDiscountInput) customDiscountInput.value = '';
    if (customDiscountWrapper) customDiscountWrapper.style.display = 'none';
    currentDiscountPercent = 0;
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
