/* ==========================================================================
   MÓDULO 2: CONTROLADOR INTERACTIVO DE PRODUCCIÓN Y COCINA (KITCHEN.JS)
   Gestión en tiempo real de hornos, temporizadores, comandas KDS y lotes
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { OVENS_INITIAL_STATE, KDS_ORDERS_INITIAL_STATE, STAGING_BATCHES_INITIAL_STATE } from '../data/kitchen-db.js';
import { BAKERY_RECIPES } from '../data/recipes-db.js';
import { INVENTORY_DATABASE } from '../data/inventory-db.js';
import { PRODUCTS_DATABASE } from '../data/products-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión Resiliente
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo sesión:', err);
  }

  const activeChef = (session && session.user) ? session.user : {
    name: 'Carlos Eduardo Rivas',
    role: 'Maestro Panadero',
    roleCode: 'KITCHEN',
    icon: 'chef-hat'
  };

  // 1.1 Verificación de Permisos (Solo Superadmin y Panadero)
  const userRole = (activeChef.role || '').toLowerCase();
  const userRoleCode = (activeChef.roleCode || activeChef.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin');
  const isBaker = isSuperadmin || userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero') || userRole.includes('chef');

  if (!isBaker) {
    let redirectUrl = 'dashboard.html';
    if (userRoleCode === 'ACCOUNTANT' || userRole.includes('contador')) redirectUrl = 'accounting.html';
    else if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    window.location.replace(redirectUrl);
    return;
  }

  // Actualizar datos del Chef activo
  const chefNameEl = document.getElementById('chefName');
  const chefAvatarEl = document.getElementById('chefAvatar');
  if (chefNameEl) chefNameEl.textContent = activeChef.name;
  if (chefAvatarEl) { chefAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeChef.icon || 'chef-hat') : ''; window.LucideIcons?.refresh(); }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de la Aplicación de Cocina (Persistente desde Backend PHP/MySQL)
  let ovens = [];
  let replenishmentAlerts = [];
  let specialOrders = [];
  let stagingBatches = [];
  let bakedTodayCount = 142;
  let selectedStagingBatchId = null;

  // Función compartida para abrir el recetario pre-seleccionado desde alertas de reposición
  let openRecetarioForReplenishment = null;

  // Clave de almacenamiento y gestión reactiva de Recetas (Local & Persistente)
  const LOCAL_STORAGE_RECIPES_KEY = 'recetas_panaderia';

  function loadActiveRecipes() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_RECIPES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo recetas de localStorage:', e);
    }
    const defaultList = JSON.parse(JSON.stringify(BAKERY_RECIPES));
    try {
      localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(defaultList));
    } catch (e) {}
    return defaultList;
  }

  function saveActiveRecipes(list) {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error guardando recetas en localStorage:', e);
    }
  }

  let activeRecipes = loadActiveRecipes();

  // Lotes por defecto con trazabilidad de 3 fases
  const DEFAULT_STAGING_BATCHES = [
    {
      id: 'stage_045',
      code: 'Lote #045',
      productName: 'Pain au Chocolat (Chocolatina)',
      productCode: 'PAN-003',
      icon: 'croissant',
      units: 40,
      phase: 3, // 1: Amasado, 2: Leudado, 3: Listo para Horno
      prepStatus: 'Leudado Completo (Listo para Horno)',
      fermentRemainingMin: 0,
      recommendedTemp: 190,
      recommendedTimeMin: 16
    },
    {
      id: 'stage_046',
      code: 'Lote #046',
      productName: 'Brioche de Vainilla de Madagascar',
      productCode: 'PAN-004',
      icon: 'cake',
      units: 25,
      phase: 2,
      prepStatus: 'En Cámara de Fermentación',
      fermentRemainingMin: 35,
      recommendedTemp: 180,
      recommendedTimeMin: 22
    },
    {
      id: 'stage_047',
      code: 'Lote #047',
      productName: 'Baguette Tradicional Parisina',
      productCode: 'PAN-001',
      icon: 'croissant',
      units: 50,
      phase: 1,
      prepStatus: 'Amasado y División en Mesa',
      fermentRemainingMin: 75,
      recommendedTemp: 240,
      recommendedTimeMin: 22
    }
  ];

  // 3. Elementos DOM
  const ovensContainer = document.getElementById('ovensContainer');
  const demandContainer = document.getElementById('demandContainer') || document.getElementById('kdsContainer');
  const stagingContainer = document.getElementById('stagingContainer');
  
  // KPI Badges
  const activeOvensKpi = document.getElementById('activeOvensKpi');
  const pendingOrdersKpi = document.getElementById('pendingOrdersKpi');
  const bakedTodayKpi = document.getElementById('bakedTodayKpi');
  const activeBatchesKpi = document.getElementById('activeBatchesKpi');
  const ovensCountBadge = document.getElementById('ovensCountBadge');
  
  // Modal de Carga de Lote a Horno
  const loadOvenModal = document.getElementById('loadOvenModal');
  const closeLoadOvenModalBtn = document.getElementById('closeLoadOvenModalBtn');
  const cancelLoadOvenModalBtn = document.getElementById('cancelLoadOvenModalBtn');
  const loadOvenForm = document.getElementById('loadOvenForm');
  const modalBatchName = document.getElementById('modalBatchName');
  const ovenProductSelect = document.getElementById('ovenProductSelect');
  const ovenSelect = document.getElementById('ovenSelect');
  const ovenUnitsInput = document.getElementById('ovenUnitsInput');
  const bakeTempInput = document.getElementById('bakeTempInput');
  const bakeTimeInput = document.getElementById('bakeTimeInput');
  const ovenRecipeTipText = document.getElementById('ovenRecipeTipText');

  // Modal de Descarga de Horno e Ingreso a Vitrina POS
  const modalDescargaVitrina = document.getElementById('modalDescargaVitrina');
  const closeDescargaVitrinaBtn = document.getElementById('closeDescargaVitrinaBtn');
  const cancelDescargaVitrinaBtn = document.getElementById('cancelDescargaVitrinaBtn');
  const formDescargaVitrina = document.getElementById('formDescargaVitrina');
  const descargaOvenId = document.getElementById('descargaOvenId');
  const descargaProductCode = document.getElementById('descargaProductCode');
  const descargaOvenName = document.getElementById('descargaOvenName');
  const descargaProductName = document.getElementById('descargaProductName');
  const descargaBatchCode = document.getElementById('descargaBatchCode');
  const descargaTotalBaked = document.getElementById('descargaTotalBaked');
  const descargaWasteQty = document.getElementById('descargaWasteQty');
  const descargaWasteReason = document.getElementById('descargaWasteReason');
  const descargaNetQty = document.getElementById('descargaNetQty');

  // Constante y Helpers de Persistencia Local & Sincronización
  const LOCAL_STORAGE_OVENS_KEY = 'lnp_kitchen_ovens_state';

  function saveOvensToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_OVENS_KEY, JSON.stringify(ovens));
    } catch (e) {}
  }

  function loadOvensFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_OVENS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          ovens = parsed.map(o => {
            if (o.status === 'baking' && o.endTime) {
              const rem = Math.max(0, Math.round((o.endTime - now) / 1000));
              if (o.batch) o.batch.remainingSeconds = rem;
              if (rem <= 0) {
                o.status = 'ready';
              }
            }
            return o;
          });
          renderOvens();
          updateKPIs();
        }
      }
    } catch (e) {
      console.warn('Error leyendo estado local de hornos:', e);
    }
  }

  function addStockToPosAndInventory(prodCode, prodName, netUnits, newDbStock) {
    try {
      // 1. Sincronizar 'catalogo_pos' en localStorage (Fuente de Verdad del POS y Gerente)
      let catalogList = [];
      const stored = localStorage.getItem('catalogo_pos');
      if (stored) {
        try { catalogList = JSON.parse(stored); } catch (e) { catalogList = []; }
      }
      if (!Array.isArray(catalogList) || catalogList.length === 0) {
        catalogList = JSON.parse(JSON.stringify(PRODUCTS_DATABASE));
      }

      const pCodeClean = (prodCode || '').trim();
      const pNameClean = (prodName || '').trim().toLowerCase();

      let found = catalogList.find(p => 
        (pCodeClean && (p.code === pCodeClean || p.id === pCodeClean)) ||
        (pNameClean && p.name && (p.name.toLowerCase() === pNameClean || p.name.toLowerCase().includes(pNameClean) || pNameClean.includes(p.name.toLowerCase())))
      );

      if (found) {
        if (typeof newDbStock === 'number' && newDbStock > 0) {
          found.stock = newDbStock;
        } else {
          found.stock = (parseFloat(found.stock) || 0) + netUnits;
        }
      } else {
        found = {
          id: `prod_${pCodeClean || Date.now()}`,
          code: pCodeClean || 'PAN-001',
          name: prodName || 'Producto Horneado',
          category: 'panaderia',
          price: 2.50,
          unitCost: 1.20,
          unit: 'Und',
          stock: (typeof newDbStock === 'number' && newDbStock > 0) ? newDbStock : netUnits,
          minStock: 15,
          icon: '🥖',
          showInPos: true,
          description: 'Recién horneado en cocina.'
        };
        catalogList.push(found);
      }

      localStorage.setItem('catalogo_pos', JSON.stringify(catalogList));

      // 2. Registrar movimiento en la auditoría de inventario (movimientos_inventario)
      let movs = [];
      try {
        const storedMovs = localStorage.getItem('movimientos_inventario');
        if (storedMovs) movs = JSON.parse(storedMovs);
      } catch (e) {}
      if (!Array.isArray(movs)) movs = [];

      const newMov = {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: 'ingreso_produccion',
        concept: `Horneado Finalizado: +${netUnits} ud de ${found.name}`,
        category: 'Producto Terminado',
        item: found.name,
        code: found.code,
        quantity: netUnits,
        unit: found.unit || 'Und',
        user: activeChef.name || 'Maestro Panadero',
        status: 'Completado'
      };
      movs.unshift(newMov);
      localStorage.setItem('movimientos_inventario', JSON.stringify(movs.slice(0, 100)));

      // 3. Notificar en vivo vía eventos y BroadcastChannel a Caja y Tablero
      window.dispatchEvent(new Event('catalogoPosChanged'));
      window.dispatchEvent(new StorageEvent('storage', { key: 'catalogo_pos' }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'movimientos_inventario' }));

      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('lnp_pos_catalog_channel');
        channel.postMessage({
          type: 'catalog_updated',
          productCode: found.code,
          unitsAdded: netUnits,
          totalStock: found.stock,
          timestamp: Date.now()
        });
        setTimeout(() => channel.close(), 1000);
      }
    } catch (errSync) {
      console.error('Error sincronizando stock con POS e Inventario:', errSync);
    }
  }

  // 4. FUNCIÓN DE CARGA DINÁMICA INTEGRAL (GET_ESTADO_COMPLETO.PHP)
  async function fetchKitchenState() {
    try {
      let response = await fetch('../api/kitchen/get_estado_completo.php');
      if (!response.ok) {
        response = await fetch('api/kitchen/get_estado_completo.php');
      }
      if (!response.ok) {
        response = await fetch('../api_hornos.php');
      }
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      
      if (data && data.success) {
        if (Array.isArray(data.hornos) && data.hornos.length > 0) {
          const currentOvensMap = new Map(ovens.map(o => [o.id, o]));
          const now = Date.now();

          ovens = data.hornos.map(h => {
            const current = currentOvensMap.get(h.id);
            let endTimeMs = h.endTime ? new Date(h.endTime).getTime() : null;
            let startTimeMs = h.startTime ? new Date(h.startTime).getTime() : null;

            // Conservar precisión local si el temporizador ya estaba corriendo
            if (current && current.status === 'baking' && current.endTime && (!endTimeMs || Math.abs(current.endTime - endTimeMs) < 10000)) {
              endTimeMs = current.endTime;
              startTimeMs = current.startTime || startTimeMs;
            }

            if (h.status === 'baking' && endTimeMs) {
              const rem = Math.max(0, Math.round((endTimeMs - now) / 1000));
              if (h.batch) h.batch.remainingSeconds = rem;
              if (rem <= 0) {
                h.status = 'ready';
              }
            } else if (h.status === 'baking' && !endTimeMs && h.batch && h.batch.remainingSeconds > 0) {
              endTimeMs = now + (h.batch.remainingSeconds * 1000);
            }

            h.startTime = startTimeMs;
            h.endTime = endTimeMs;
            return h;
          });
          saveOvensToLocalStorage();
        }

        if (Array.isArray(data.alertas_reposicion)) {
          replenishmentAlerts = data.alertas_reposicion;
        }

        if (Array.isArray(data.encargos)) {
          specialOrders = data.encargos;
        }

        if (Array.isArray(data.lotes) && data.lotes.length > 0) {
          stagingBatches = data.lotes.map(l => {
            let phase = 3;
            const st = (l.estado_leudado || '').toLowerCase();
            if (st.includes('amasado')) phase = 1;
            else if (st.includes('leudado') || st.includes('ferment') || st.includes('reposo')) phase = 2;
            return {
              id: l.id,
              code: l.codigo,
              productName: l.producto,
              productCode: l.codigo_producto || '',
              icon: l.icono || 'croissant',
              units: parseInt(l.cantidad) || 50,
              phase: phase,
              prepStatus: l.estado_leudado || 'Listo para Horno',
              fermentRemainingMin: phase === 2 ? 40 : 0,
              recommendedTemp: parseInt(l.temperatura_recomendada) || 200,
              recommendedTimeMin: parseInt(l.tiempo_recomendado_min) || 20
            };
          });
        }
      }
    } catch (err) {
      console.warn('API get_estado_completo no disponible, aplicando estado por defecto:', err);
      if (!ovens || ovens.length === 0) ovens = JSON.parse(JSON.stringify(OVENS_INITIAL_STATE));
      if (!stagingBatches) stagingBatches = [];
    }

    renderAll();
  }

  // Bucle de Temporizadores en Tiempo Real (Cada 1 Segundo basado en tiempo real)
  setInterval(() => {
    let stateChanged = false;
    const now = Date.now();

    ovens.forEach(oven => {
      if (oven.status === 'baking' && oven.batch) {
        if (oven.endTime) {
          const rem = Math.max(0, Math.round((oven.endTime - now) / 1000));
          if (oven.batch.remainingSeconds !== rem) {
            oven.batch.remainingSeconds = rem;
            stateChanged = true;
          }
          if (rem <= 0) {
            oven.status = 'ready';
            stateChanged = true;
            fetch('../api/kitchen/forzar_horneado_listo.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ovenId: oven.id })
            }).catch(() => {});
          }
        } else if (oven.batch.remainingSeconds > 0) {
          oven.batch.remainingSeconds--;
          stateChanged = true;
          if (oven.batch.remainingSeconds <= 0) {
            oven.status = 'ready';
          }
        }
      }
    });

    if (stateChanged) {
      renderOvens();
      updateKPIs();
      saveOvensToLocalStorage();
    }
  }, 1000);

  function renderAll() {
    renderOvens();
    renderDemandMonitor();
    renderStagingBatches();
    updateKPIs();
  }

  function updateKPIs() {
    const activeCount = ovens.filter(o => o.status === 'baking' || o.status === 'ready').length;
    if (activeOvensKpi) activeOvensKpi.textContent = `${activeCount} / ${ovens.length}`;
    if (pendingOrdersKpi) pendingOrdersKpi.textContent = `${replenishmentAlerts.length} alertas`;
    if (bakedTodayKpi) bakedTodayKpi.textContent = `${bakedTodayCount} ud`;
    if (activeBatchesKpi) activeBatchesKpi.textContent = `${stagingBatches.length} lotes`;
    if (ovensCountBadge) ovensCountBadge.textContent = `${ovens.length} Hornos`;
  }

  // 4. Renderizado de Hornos Industriales
  function renderOvens() {
    setTimeout(() => window.LucideIcons?.refresh(), 0);
    ovensContainer.innerHTML = '';

    ovens.forEach(oven => {
      const card = document.createElement('div');
      const isReady = oven.status === 'ready';
      card.className = `oven-card ${isReady ? 'ready-alert' : ''}`;

      let statusBadgeClass = 'baking';
      let statusText = 'En Horneado';
      if (oven.status === 'ready') { statusBadgeClass = 'ready'; statusText = '¡HORNEADO LISTO!'; }
      else if (oven.status === 'preheating') { statusBadgeClass = 'preheating'; statusText = 'Precalentando'; }
      else if (oven.status === 'idle') { statusBadgeClass = 'idle'; statusText = 'Disponible / Apagado'; }

      let progressPct = 0;
      let timerFormatted = '--:--';
      if (oven.batch && oven.batch.totalTimeSeconds > 0) {
        const elapsed = oven.batch.totalTimeSeconds - oven.batch.remainingSeconds;
        progressPct = Math.min(100, Math.round((elapsed / oven.batch.totalTimeSeconds) * 100));
        
        const mins = Math.floor(oven.batch.remainingSeconds / 60);
        const secs = oven.batch.remainingSeconds % 60;
        timerFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      card.innerHTML = `
        <div class="oven-header">
          <div class="oven-title-group">
            <h3>${oven.name}</h3>
            <p>${oven.type}</p>
          </div>
          <span class="oven-status-badge ${statusBadgeClass}">${statusText}</span>
        </div>

        ${oven.batch ? `
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--color-espresso); display: flex; align-items: center; gap: 0.4rem;">
          <span>${window.LucideIcons ? window.LucideIcons.render(oven.batch.icon || 'croissant', 'icon-sm') : ''}</span>
          <span>${oven.batch.productName} (${oven.batch.units} ud)</span>
        </div>` : '<div style="font-size: 0.85rem; color: var(--color-muted); font-style: italic;">Sin lote cargado actualmente</div>'}

        <div class="oven-metrics-row">
          <div class="metric-box">
            <label>Temperatura</label>
            <div class="metric-value">${oven.currentTemp}°C</div>
          </div>
          <div class="metric-box">
            <label>Tiempo Restante</label>
            <div class="metric-value">${oven.status === 'baking' || oven.status === 'ready' ? timerFormatted : '--:--'}</div>
          </div>
        </div>

        ${oven.batch ? `
        <div class="baking-progress-container">
          <div class="baking-progress-bar">
            <div class="baking-progress-fill ${isReady ? 'ready-fill' : ''}" style="width: ${progressPct}%;"></div>
          </div>
        </div>` : ''}

        <div style="margin-top: 0.5rem;">
          ${isReady ? `
            <button type="button" class="btn-oven-action btn-ready"><i data-lucide="store" class="icon-xs"></i> <span>Descargar a Vitrina POS</span></button>
          ` : oven.status === 'baking' ? `
            <button type="button" class="btn-oven-action" style="background: var(--bg-main); color: var(--color-espresso); border: 1px solid var(--color-subtle);"><i data-lucide="eye" class="icon-xs"></i> <span>Ver Detalles de Horneado</span></button>
          ` : `
            <button type="button" class="btn-oven-action">+ Cargar Nuevo Lote</button>
          `}
        </div>
      `;

      // Event listeners para botones de hornos
      const actionBtn = card.querySelector('.btn-oven-action');
      actionBtn?.addEventListener('click', () => {
        if (isReady) {
          openDescargaVitrinaModal(oven.id);
        } else if (oven.status === 'baking') {
          openOvenDetailModal(oven.id);
        } else if (oven.status === 'idle' || oven.status === 'preheating') {
          openLoadOvenModal(null, oven.id);
        }
      });

      ovensContainer.appendChild(card);
    });
  }

  // 5. Renderizado del Monitor de Demanda (Vitrina & Encargos Especiales)
  function renderDemandMonitor() {
    setTimeout(() => window.LucideIcons?.refresh(), 0);
    if (!demandContainer) return;
    demandContainer.innerHTML = '';

    // SECCIÓN 1: ALERTAS DE REPOSICIÓN DE VITRINA
    const alertSection = document.createElement('div');
    alertSection.innerHTML = `
      <div class="demand-section-title">
        <i data-lucide="bell-ring" class="icon-xs" style="color: var(--color-terracotta);"></i>
        <span>Alertas de Reposición en Vitrina (${replenishmentAlerts.length})</span>
      </div>
    `;

    if (replenishmentAlerts.length === 0) {
      const emptyAlert = document.createElement('div');
      emptyAlert.style.cssText = 'padding: 1rem; background: rgba(46,125,50,0.06); border: 1px dashed rgba(46,125,50,0.3); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-success); text-align: center;';
      emptyAlert.innerHTML = '<span class="badge-clean-icon"><i data-lucide="check-circle" class="icon-xs"></i> Vitrina 100% abastecida. Sin alertas de quiebre de stock.</span>';
      alertSection.appendChild(emptyAlert);
    } else {
      replenishmentAlerts.forEach(alert => {
        const card = document.createElement('div');
        card.className = `demand-alert-card ${alert.isCritical ? 'critical' : ''}`;

        const pct = Math.min(100, Math.round((alert.currentStock / Math.max(1, alert.minStock * 2)) * 100));
        const badgeClass = alert.isCritical ? 'critical' : 'warning';
        const badgeText = alert.isCritical ? '¡Stock Crítico!' : 'Stock Bajo';

        card.innerHTML = `
          <div class="demand-card-header">
            <div>
              <h4 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: var(--color-espresso);">${alert.name}</h4>
              <span style="font-size: 0.76rem; color: var(--color-muted); font-weight: 700;">Código: ${alert.code}</span>
            </div>
            <span class="demand-badge ${badgeClass}">${badgeText}</span>
          </div>

          <div class="demand-stock-meter">
            <div class="demand-meter-header">
              <span>Stock en Vitrina POS:</span>
              <strong>${alert.currentStock} / ${alert.minStock} mín</strong>
            </div>
            <div class="demand-meter-track">
              <div class="demand-meter-fill ${alert.isCritical ? 'critical' : ''}" style="width: ${pct}%;"></div>
            </div>
          </div>

          <button type="button" class="btn-knead-replenish">
            <i data-lucide="plus-circle" class="icon-xs"></i>
            <span>Amasar Lote de Reposición (${alert.suggestedBatch || 50} ud)</span>
          </button>
        `;

        card.querySelector('.btn-knead-replenish')?.addEventListener('click', () => {
          if (typeof openRecetarioForReplenishment === 'function') {
            openRecetarioForReplenishment(alert.code, alert.suggestedBatch || 50);
          }
        });

        alertSection.appendChild(card);
      });
    }

    demandContainer.appendChild(alertSection);

    // SECCIÓN 2: ENCARGOS PROGRAMADOS & COMANDAS
    const ordersSection = document.createElement('div');
    ordersSection.style.marginTop = '0.5rem';
    ordersSection.innerHTML = `
      <div class="demand-section-title">
        <i data-lucide="clipboard-list" class="icon-xs" style="color: var(--color-gold-dark);"></i>
        <span>Encargos Programados &amp; Comandas (${specialOrders.length})</span>
      </div>
    `;

    if (specialOrders.length === 0) {
      const emptyOrders = document.createElement('div');
      emptyOrders.style.cssText = 'padding: 1rem; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-muted); text-align: center;';
      emptyOrders.innerHTML = 'Sin comandas especiales pendientes.';
      ordersSection.appendChild(emptyOrders);
    } else {
      specialOrders.forEach(ord => {
        const card = document.createElement('div');
        const st = ord.estado_preparacion || 'pending';
        card.className = `demand-order-card status-${st}`;

        let statusText = 'Pendiente';
        let actionBtnText = '<i data-lucide="play" class="icon-xs"></i> <span>Iniciar Preparación</span>';
        if (st === 'in_progress') {
          statusText = 'En Preparación';
          actionBtnText = '<i data-lucide="check" class="icon-xs"></i> <span>Marcar Listo para Entrega</span>';
        } else if (st === 'ready') {
          statusText = '¡Listo para Entregar!';
          actionBtnText = '<i data-lucide="archive" class="icon-xs"></i> <span>Archivar / Despachado</span>';
        }

        const dateStr = ord.fecha_hora ? ord.fecha_hora.split(' ')[1]?.slice(0, 5) : '';

        card.innerHTML = `
          <div class="demand-card-header">
            <div>
              <span class="demand-order-code">${ord.numero_factura}</span>
              ${dateStr ? `<span style="font-size: 0.75rem; color: var(--color-muted); margin-left: 0.4rem;">${dateStr}</span>` : ''}
            </div>
            <span class="demand-badge ${st === 'ready' ? 'ready' : (st === 'in_progress' ? 'warning' : 'neutral')}">${statusText}</span>
          </div>

          <div class="demand-order-items">
            ${ord.detalles_pedido}
          </div>

          <button type="button" class="btn-oven-action btn-order-action" style="margin-top: 0.5rem;">${actionBtnText}</button>
        `;

        card.querySelector('.btn-order-action')?.addEventListener('click', async () => {
          let nextState = 'in_progress';
          if (ord.estado_preparacion === 'pending') {
            nextState = 'in_progress';
          } else if (ord.estado_preparacion === 'in_progress') {
            nextState = 'ready';
          } else if (ord.estado_preparacion === 'ready') {
            nextState = 'delivered';
          }

          try {
            await fetch('../api/kitchen/actualizar_comanda.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: ord.id, estado: nextState })
            });
          } catch (e) {
            console.warn('Error actualizando comanda en MySQL:', e);
          }

          if (nextState === 'delivered') {
            specialOrders = specialOrders.filter(o => o.id !== ord.id);
          } else {
            ord.estado_preparacion = nextState;
          }
          renderDemandMonitor();
          updateKPIs();
        });

        ordersSection.appendChild(card);
      });
    }

    demandContainer.appendChild(ordersSection);
  }

  // 6. Renderizado de Plan de Producción & Leudado (Staging)
  function renderStagingBatches() {
    setTimeout(() => window.LucideIcons?.refresh(), 0);
    stagingContainer.innerHTML = '';

    if (stagingBatches.length === 0) {
      stagingContainer.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; background: white; border-radius: var(--radius-sm); border: 1px dashed var(--border-subtle); color: var(--color-muted); font-size: 0.88rem;">
          <i data-lucide="layers" class="icon-md" style="margin-bottom: 0.4rem; opacity: 0.5;"></i>
          <div>No hay lotes en plan de producción.</div>
          <div style="font-size: 0.78rem; margin-top: 0.3rem;">Abre el Recetario o una alerta de vitrina para iniciar un nuevo lote.</div>
        </div>
      `;
      return;
    }

    stagingBatches.forEach(st => {
      const card = document.createElement('div');
      card.className = 'staging-card';

      const phase = st.phase || (st.prepStatus?.includes('Listo') ? 3 : (st.prepStatus?.includes('Leudado') ? 2 : 1));
      st.phase = phase;

      let actionHtml = '';
      if (phase === 1) {
        actionHtml = `
          <button type="button" class="btn-batch-advance">
            <i data-lucide="arrow-right" class="icon-xs"></i> <span>Amasado Listo → Iniciar Leudado</span>
          </button>
        `;
      } else if (phase === 2) {
        actionHtml = `
          <button type="button" class="btn-batch-advance">
            <i data-lucide="check" class="icon-xs"></i> <span>Completar Leudado (Listo Horno)</span>
          </button>
        `;
      } else {
        actionHtml = `
          <button type="button" class="btn-load-oven">
            <i data-lucide="arrow-up-right" class="icon-xs"></i> <span>Cargar a Horno Libre</span>
          </button>
        `;
      }

      card.innerHTML = `
        <div class="staging-title">
          <span style="display:inline-flex;align-items:center;">${window.LucideIcons ? window.LucideIcons.render(st.icon || 'croissant', 'icon-lg') : ''}</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--color-espresso);">${st.productName}</div>
            <span style="font-size: 0.78rem; color: var(--color-muted); font-weight: bold;">${st.code} (${st.units} ud)</span>
          </div>
        </div>

        <div class="batch-phases-stepper">
          <div class="phase-step ${phase >= 1 ? 'completed' : ''} ${phase === 1 ? 'active' : ''}">
            <div class="phase-dot">1</div>
            <span class="phase-label">Amasado</span>
          </div>
          <div class="phase-step ${phase >= 2 ? 'completed' : ''} ${phase === 2 ? 'active' : ''}">
            <div class="phase-dot">2</div>
            <span class="phase-label">Leudado ${phase === 2 && st.fermentRemainingMin ? `(${st.fermentRemainingMin}m)` : ''}</span>
          </div>
          <div class="phase-step ${phase >= 3 ? 'completed' : ''} ${phase === 3 ? 'active' : ''}">
            <div class="phase-dot">3</div>
            <span class="phase-label">Listo Horno</span>
          </div>
        </div>

        <div style="margin-top: 0.65rem;">
          ${actionHtml}
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 0.4rem; padding-top: 0.35rem; border-top: 1px dashed rgba(0,0,0,0.06);">
          <button type="button" class="btn-batch-discard" style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;" title="Cancelar o descartar este lote">
            <i data-lucide="trash-2" class="icon-xs"></i> <span>Descartar Lote</span>
          </button>
        </div>
      `;

      if (phase === 1) {
        card.querySelector('.btn-batch-advance')?.addEventListener('click', async () => {
          st.phase = 2;
          st.prepStatus = 'En Cámara de Fermentación';
          st.fermentRemainingMin = st.fermentRemainingMin || 45;
          renderStagingBatches();
          try {
            await fetch('../api/kitchen/gestionar_lote.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'advance', id: st.id, fase: 2, estado_leudado: st.prepStatus })
            });
          } catch (e) {
            console.warn('Error al avanzar fase de lote:', e);
          }
        });
      } else if (phase === 2) {
        card.querySelector('.btn-batch-advance')?.addEventListener('click', async () => {
          st.phase = 3;
          st.prepStatus = 'Leudado Completo (Listo para Horno)';
          st.fermentRemainingMin = 0;
          renderStagingBatches();
          try {
            await fetch('../api/kitchen/gestionar_lote.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'advance', id: st.id, fase: 3, estado_leudado: st.prepStatus })
            });
          } catch (e) {
            console.warn('Error al avanzar fase de lote:', e);
          }
        });
      } else {
        card.querySelector('.btn-load-oven')?.addEventListener('click', () => {
          openLoadOvenModal(st.id);
        });
      }

      card.querySelector('.btn-batch-discard')?.addEventListener('click', async () => {
        if (!confirm(`¿Deseas descartar el ${st.code} (${st.productName})?`)) return;
        try {
          await fetch('../api/kitchen/gestionar_lote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'discard', id: st.id })
          });
        } catch (e) {
          console.warn('Error al descartar lote:', e);
        }
        stagingBatches = stagingBatches.filter(b => b.id !== st.id);
        renderStagingBatches();
        updateKPIs();
      });

      stagingContainer.appendChild(card);
    });
  }

  // 6.5 Modal de Descarga de Horno e Ingreso a Vitrina POS
  function openDescargaVitrinaModal(ovenId) {
    const oven = ovens.find(o => o.id === ovenId);
    if (!oven || !oven.batch) return;

    if (!modalDescargaVitrina) return;

    descargaOvenId.value = oven.id;

    let pCode = oven.batch.productCode || '';
    if (!pCode) {
      const n = (oven.batch.productName || '').toLowerCase();
      if (n.includes('baguette')) pCode = 'PAN-001';
      else if (n.includes('croissant')) pCode = 'PAN-002';
      else if (n.includes('chocolat')) pCode = 'PAN-003';
      else if (n.includes('brioche')) pCode = 'PAN-004';
      else if (n.includes('focaccia')) pCode = 'PAN-005';
      else if (n.includes('jamón') || n.includes('jamon')) pCode = 'PAN-007';
      else pCode = 'PAN-001';
    }
    descargaProductCode.value = pCode;

    if (descargaOvenName) descargaOvenName.textContent = oven.name;
    if (descargaProductName) descargaProductName.textContent = oven.batch.productName;
    if (descargaBatchCode) descargaBatchCode.textContent = oven.batch.code || 'Lote Activo';
    if (descargaTotalBaked) descargaTotalBaked.textContent = `${oven.batch.units} ud`;

    if (descargaWasteQty) {
      descargaWasteQty.value = 0;
      descargaWasteQty.max = oven.batch.units;
    }
    if (descargaWasteReason) descargaWasteReason.value = 'Sin merma';
    if (descargaNetQty) descargaNetQty.textContent = `${oven.batch.units} ud`;

    modalDescargaVitrina.style.display = 'flex';
    modalDescargaVitrina.classList.add('active');
    modalDescargaVitrina.setAttribute('aria-hidden', 'false');
    window.LucideIcons?.refresh();
  }

  function closeDescargaVitrinaModal() {
    if (!modalDescargaVitrina) return;
    modalDescargaVitrina.style.display = 'none';
    modalDescargaVitrina.classList.remove('active');
    modalDescargaVitrina.setAttribute('aria-hidden', 'true');
  }

  closeDescargaVitrinaBtn?.addEventListener('click', closeDescargaVitrinaModal);
  cancelDescargaVitrinaBtn?.addEventListener('click', closeDescargaVitrinaModal);
  modalDescargaVitrina?.addEventListener('click', (e) => {
    if (e.target === modalDescargaVitrina) closeDescargaVitrinaModal();
  });

  descargaWasteQty?.addEventListener('input', () => {
    const oven = ovens.find(o => o.id === descargaOvenId.value);
    const total = oven && oven.batch ? oven.batch.units : 50;
    const waste = Math.max(0, Math.min(total, parseInt(descargaWasteQty.value) || 0));
    const net = Math.max(0, total - waste);
    if (descargaNetQty) descargaNetQty.textContent = `${net} ud`;

    if (waste > 0 && descargaWasteReason && descargaWasteReason.value === 'Sin merma') {
      descargaWasteReason.value = 'Exceso de horneado / Quemado';
    } else if (waste === 0 && descargaWasteReason) {
      descargaWasteReason.value = 'Sin merma';
    }
  });

  formDescargaVitrina?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oven = ovens.find(o => o.id === descargaOvenId.value);
    if (!oven || !oven.batch) {
      closeDescargaVitrinaModal();
      return;
    }

    const totalUnits = oven.batch.units;
    const waste = parseInt(descargaWasteQty.value) || 0;
    const net = Math.max(0, totalUnits - waste);
    const reason = descargaWasteReason.value;
    const pCode = descargaProductCode.value;
    const pName = oven.batch.productName;

    const submitBtn = formDescargaVitrina.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Guardando en Vitrina...</span>';
    }

    try {
      let res = await fetch('../api/kitchen/completar_horneado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ovenId: oven.id,
          productCode: pCode,
          productName: pName,
          totalBaked: totalUnits,
          wasteQty: waste,
          wasteReason: reason,
          bakerName: activeChef.name
        })
      });

      if (!res.ok) {
        res = await fetch('api/kitchen/completar_horneado.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ovenId: oven.id,
            productCode: pCode,
            productName: pName,
            totalBaked: totalUnits,
            wasteQty: waste,
            wasteReason: reason,
            bakerName: activeChef.name
          })
        });
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Error al completar descarga');
      }

      // Actualizar estado local
      bakedTodayCount += net;
      oven.status = 'idle';
      oven.batch = null;
      oven.startTime = null;
      oven.endTime = null;
      saveOvensToLocalStorage();

      // Sincronizar catálogo POS e Inventario en tiempo real
      addStockToPosAndInventory(data.productCode || pCode, data.productName || pName, net, data.newStock);

      closeDescargaVitrinaModal();

      // Mostrar modal animado de éxito
      const modal = document.getElementById('modalExitoNotificacion');
      const titleEl = document.getElementById('modalExitoTitle');
      const msgEl = document.getElementById('modalExitoMsg');

      if (titleEl) titleEl.textContent = '¡Lote Ingresado a Vitrina POS!';
      if (msgEl) {
        msgEl.innerHTML = `Se descargó el <strong>${pName}</strong> del <strong>${oven.name}</strong>.<br/><br/>Se sumaron <strong>+${net} unidades netas</strong> al stock disponible de vitrina para venta en caja (Mermas: ${waste} ud - ${reason}).`;
      }
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
      }

      // Refrescar estado y alertas de reposición
      fetchKitchenState();

    } catch (err) {
      console.error('Error al descargar a vitrina:', err);
      alert('Error al registrar descarga en vitrina: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="check-check" class="icon-sm"></i> <span>Confirmar e Ingresar a Vitrina</span>';
      }
    }
  });

  // 7. Modal de Asignación de Horno e Inicio de Horneado
  function openLoadOvenModal(batchId = null, ovenId = null) {
    selectedStagingBatchId = batchId;
    
    // Ocultar banner de error previo
    const ovenErrorBanner = document.getElementById('ovenErrorBanner');
    if (ovenErrorBanner) {
      ovenErrorBanner.style.display = 'none';
      ovenErrorBanner.innerHTML = '';
    }

    // 1. Rellenar selector de hornos con estado de disponibilidad
    ovenSelect.innerHTML = '';
    ovens.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      const isAvailable = o.status === 'idle' || o.status === 'preheating';
      option.textContent = `${o.name} (${isAvailable ? 'Disponible' : 'Ocupado - En uso'})`;
      if (ovenId && o.id === ovenId) option.selected = true;
      ovenSelect.appendChild(option);
    });

    // 2. Poblar selector de panes y lotes
    if (ovenProductSelect) {
      ovenProductSelect.innerHTML = '';

      // Grupo A: Lotes listos en Producción / Leudado
      if (stagingBatches.length > 0) {
        const groupBatches = document.createElement('optgroup');
        groupBatches.label = '📋 Lotes en Plan de Producción / Leudado';

        stagingBatches.forEach(b => {
          const opt = document.createElement('option');
          opt.value = `batch:${b.id}`;
          opt.textContent = `${b.productName} (${b.units} ud) — ${b.code} [${b.prepStatus || 'Listo'}]`;
          opt.dataset.type = 'batch';
          opt.dataset.batchId = b.id;
          opt.dataset.units = b.units;
          opt.dataset.temp = b.recommendedTemp || 200;
          opt.dataset.time = b.recommendedTimeMin || 20;
          opt.dataset.name = b.productName;
          opt.dataset.icon = b.icon || 'croissant';
          opt.dataset.code = b.productCode || '';
          if (batchId && b.id === batchId) opt.selected = true;
          groupBatches.appendChild(opt);
        });
        ovenProductSelect.appendChild(groupBatches);
      }

      // Grupo B: Catálogo de Panes Artesanales (Recetario)
      const groupRecipes = document.createElement('optgroup');
      groupRecipes.label = '🥖 Panes Artesanales (Recetario Maestro)';
      activeRecipes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = `recipe:${r.id}`;
        opt.textContent = `${r.icon} ${r.name} (${r.code}) — Receta Estándar`;
        opt.dataset.type = 'recipe';
        opt.dataset.recipeId = r.id;
        opt.dataset.units = r.defaultQty || 50;
        opt.dataset.temp = r.bakingProfile?.temp || 200;
        opt.dataset.time = r.bakingProfile?.timeMin || 20;
        opt.dataset.name = r.name;
        opt.dataset.icon = r.lucideIcon || 'croissant';
        opt.dataset.code = r.code;
        opt.dataset.ovenType = r.bakingProfile?.ovenType || 'Industrial';
        groupRecipes.appendChild(opt);
      });
      ovenProductSelect.appendChild(groupRecipes);

      // Si no se pasó batchId, seleccionar la primera opción disponible
      if (!batchId && ovenProductSelect.options.length > 0) {
        ovenProductSelect.selectedIndex = 0;
      }
    }

    // 3. Sincronizar parámetros técnicos según la selección
    syncOvenProductParams();

    if (modalBatchName) {
      if (batchId) {
        const batch = stagingBatches.find(b => b.id === batchId);
        modalBatchName.textContent = batch ? `Cargar ${batch.productName} a Horno` : 'Cargar y Hornear Pan';
      } else {
        modalBatchName.textContent = 'Cargar y Hornear Pan';
      }
    }

    loadOvenModal.classList.add('active');
    window.LucideIcons?.refresh();
  }

  function syncOvenProductParams() {
    if (!ovenProductSelect) return;
    const selectedOpt = ovenProductSelect.options[ovenProductSelect.selectedIndex];
    if (!selectedOpt) return;

    const temp = parseInt(selectedOpt.dataset.temp) || 200;
    const time = parseInt(selectedOpt.dataset.time) || 15;
    const units = parseInt(selectedOpt.dataset.units) || 50;
    const ovenType = selectedOpt.dataset.ovenType || '';

    if (bakeTempInput) bakeTempInput.value = temp;
    if (bakeTimeInput) bakeTimeInput.value = time;
    if (ovenUnitsInput) ovenUnitsInput.value = units;

    if (ovenRecipeTipText) {
      const tip = ovenType 
        ? `Horno recomendado: <strong>${ovenType}</strong>. Temp: <strong>${temp}°C</strong> &bull; Tiempo: <strong>${time} min</strong>.`
        : `Parámetros sugeridos: <strong>${temp}°C</strong> durante <strong>${time} min</strong> para ${units} unidades.`;
      ovenRecipeTipText.innerHTML = tip;
    }
  }

  ovenProductSelect?.addEventListener('change', syncOvenProductParams);

  closeLoadOvenModalBtn?.addEventListener('click', () => {
    loadOvenModal.classList.remove('active');
  });

  cancelLoadOvenModalBtn?.addEventListener('click', () => {
    loadOvenModal.classList.remove('active');
  });

  loadOvenModal?.addEventListener('click', (e) => {
    if (e.target === loadOvenModal) {
      loadOvenModal.classList.remove('active');
    }
  });

  loadOvenForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetOvenId = ovenSelect.value;
    const oven = ovens.find(o => o.id === targetOvenId);

    // VALIDACIÓN DE HORNO OCUPADO
    if (!oven || oven.status === 'baking' || oven.status === 'ready') {
      const ovenErrorBanner = document.getElementById('ovenErrorBanner');
      if (ovenErrorBanner) {
        ovenErrorBanner.innerHTML = `<span class="badge-clean-icon"><i data-lucide="alert-triangle" class="icon-sm"></i> <strong>Error de Operación:</strong> El ${oven ? oven.name : "horno seleccionado"} ya está ocupado en un ciclo activo. Seleccione un horno libre.</span>`;
        ovenErrorBanner.style.display = 'block';
      }
      return false;
    }

    const temp = parseInt(bakeTempInput.value) || 200;
    const timeMin = parseInt(bakeTimeInput.value) || 15;
    const units = parseInt(ovenUnitsInput?.value) || 50;

    const selectedOpt = ovenProductSelect ? ovenProductSelect.options[ovenProductSelect.selectedIndex] : null;
    const isBatch = selectedOpt && selectedOpt.dataset.type === 'batch';
    const batchId = isBatch ? selectedOpt.dataset.batchId : null;

    let productName = selectedOpt ? selectedOpt.dataset.name : 'Pan Artesanal';
    let productCode = selectedOpt ? selectedOpt.dataset.code : 'PAN-001';
    let icon = selectedOpt ? selectedOpt.dataset.icon : 'croissant';
    let batchCode = `Lote #${String(stagingBatches.length + 50).padStart(3, '0')}`;

    if (isBatch) {
      const stBatch = stagingBatches.find(b => b.id === batchId);
      if (stBatch) {
        productName = stBatch.productName;
        productCode = stBatch.productCode || productCode;
        icon = stBatch.icon || icon;
        batchCode = stBatch.code || batchCode;
        stagingBatches = stagingBatches.filter(b => b.id !== batchId);
      }
    }

    const batchInfo = {
      id: batchId || `batch_${Date.now()}`,
      code: batchCode,
      productName: productName,
      productCode: productCode,
      icon: icon,
      units: units,
      totalTimeSeconds: timeMin * 60,
      remainingSeconds: timeMin * 60
    };

    const now = Date.now();
    const durationMs = timeMin * 60 * 1000;

    oven.currentTemp = temp;
    oven.targetTemp = temp;
    oven.status = 'baking';
    oven.batch = batchInfo;
    oven.startTime = now;
    oven.endTime = now + durationMs;
    saveOvensToLocalStorage();

    // Persistir inicio de horneado en MySQL
    const ovenPayload = {
      ovenId: targetOvenId,
      batchId: batchInfo.id,
      productName: batchInfo.productName,
      productCode: batchInfo.productCode,
      temp: temp,
      timeMin: timeMin,
      units: batchInfo.units
    };
    fetch('../api/kitchen/iniciar_horneado.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ovenPayload)
    }).then(r => r.json()).then(data => {
      if (data && data.success && data.oven) {
        if (data.oven.endTime) {
          oven.endTime = new Date(data.oven.endTime).getTime();
        }
        saveOvensToLocalStorage();
      }
    }).catch(() => {
      fetch('api/kitchen/iniciar_horneado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ovenPayload)
      }).catch(err => console.warn('Iniciar horneado local:', err));
    });

    loadOvenModal.classList.remove('active');
    renderAll();
  });

  // 8. Modal de Detalles de Horneado Activo
  const ovenDetailModal = document.getElementById('ovenDetailModal');
  const closeOvenDetailModalBtn = document.getElementById('closeOvenDetailModalBtn');
  const closeOvenDetailModalFooterBtn = document.getElementById('closeOvenDetailModalFooterBtn');
  const btnFastFinishBake = document.getElementById('btnFastFinishBake');
  let currentDetailOvenId = null;

  function openOvenDetailModal(ovenId) {
    currentDetailOvenId = ovenId;
    const oven = ovens.find(o => o.id === ovenId);
    if (!oven || !oven.batch) return;

    const mins = Math.floor(oven.batch.remainingSeconds / 60);
    const secs = oven.batch.remainingSeconds % 60;
    const timerFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const elapsed = oven.batch.totalTimeSeconds - oven.batch.remainingSeconds;
    const progressPct = Math.min(100, Math.round((elapsed / oven.batch.totalTimeSeconds) * 100));

    document.getElementById('modalDetailOvenIcon').innerHTML = window.LucideIcons ? window.LucideIcons.render(oven.batch.icon || 'croissant', 'icon-xl') : ''; window.LucideIcons?.refresh();
    document.getElementById('modalDetailOvenTitle').textContent = `Detalle de Horneado - ${oven.name}`;
    document.getElementById('modalDetailOvenSubtitle').textContent = `Monitoreo en Tiempo Real (${oven.type})`;
    document.getElementById('modalDetailTimer').textContent = timerFormatted;
    document.getElementById('modalDetailProgressPct').textContent = `${progressPct}%`;
    
    const progressBar = document.getElementById('modalDetailProgressBar');
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    document.getElementById('modalDetailProduct').textContent = oven.batch.productName;
    document.getElementById('modalDetailUnits').textContent = `${oven.batch.units} ud`;
    document.getElementById('modalDetailTemp').textContent = `${oven.currentTemp}°C (Target: ${oven.targetTemp}°C)`;
    document.getElementById('modalDetailTotalTime').textContent = `${Math.round(oven.batch.totalTimeSeconds / 60)} min`;
    document.getElementById('modalDetailOvenType').textContent = oven.type;
    document.getElementById('modalDetailChef').textContent = session.user.name || 'Chef Principal';

    if (ovenDetailModal) ovenDetailModal.classList.add('active');
  }

  btnFastFinishBake?.addEventListener('click', async () => {
    if (!currentDetailOvenId) return;
    const oven = ovens.find(o => o.id === currentDetailOvenId);
    if (!oven || oven.status !== 'baking') return;

    btnFastFinishBake.disabled = true;
    btnFastFinishBake.innerHTML = '<span>Finalizando horneado...</span>';

    try {
      let res = await fetch('../api/kitchen/forzar_horneado_listo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ovenId: oven.id })
      });
      if (!res.ok) {
        res = await fetch('api/kitchen/forzar_horneado_listo.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ovenId: oven.id })
        });
      }
    } catch (e) {}

    oven.status = 'ready';
    if (oven.batch) oven.batch.remainingSeconds = 0;
    oven.endTime = Date.now();
    saveOvensToLocalStorage();
    renderAll();
    ovenDetailModal?.classList.remove('active');

    btnFastFinishBake.disabled = false;
    btnFastFinishBake.innerHTML = '<i data-lucide="check-circle" class="icon-xs"></i> <span>¡Marcar Horneado Listo!</span>';

    // Abrir directamente modal de descarga para ingresar a vitrina POS
    openDescargaVitrinaModal(oven.id);
  });

  closeOvenDetailModalBtn?.addEventListener('click', () => {
    ovenDetailModal?.classList.remove('active');
  });

  closeOvenDetailModalFooterBtn?.addEventListener('click', () => {
    ovenDetailModal?.classList.remove('active');
  });

  ovenDetailModal?.addEventListener('click', (e) => {
    if (e.target === ovenDetailModal) {
      ovenDetailModal.classList.remove('active');
    }
  });

  // 9. SISTEMA DE REQUISICIÓN DE MATERIA PRIMA (MÓDULO 2 COCINA <-> MÓDULO 4 GERENCIA)
  function inicializarRequisicionCocina() {
    try {
      const DEFAULT_TICKETS = [
        {
          id: 'REQ-001',
          date: '24/08/2026 14:30',
          baker: session?.user?.name || 'Jean-Luc Dubois',
          itemCode: 'MAT-001',
          itemName: 'Harina de Trigo Todo Uso',
          qty: 50,
          unit: 'kg',
          notes: 'Amasado urgente de baguettes para el turno tarde.',
          status: 'Pendiente',
          reason: ''
        },
        {
          id: 'REQ-002',
          date: '24/08/2026 11:15',
          baker: session?.user?.name || 'Jean-Luc Dubois',
          itemCode: 'MAT-002',
          itemName: 'Mantequilla Sin Sal 82%',
          qty: 15,
          unit: 'kg',
          notes: 'Para lamine de masa hojaldrada de Croissants.',
          status: 'Aprobado',
          reason: 'Aprobado por Gerencia General'
        },
        {
          id: 'REQ-003',
          date: '24/08/2026 09:00',
          baker: session?.user?.name || 'Jean-Luc Dubois',
          itemCode: 'MAT-003',
          itemName: 'Azúcar Refinada Extra',
          qty: 100,
          unit: 'kg',
          notes: 'Reserva para pastelería y brioches.',
          status: 'Rechazado',
          reason: 'Excede límite por turno. Solicitar máx 25 kg.'
        }
      ];

      function getTicketsFromStorage() {
        try {
          const raw = localStorage.getItem('tickets_requisicion');
          if (!raw) {
            localStorage.setItem('tickets_requisicion', JSON.stringify(DEFAULT_TICKETS));
            return DEFAULT_TICKETS;
          }
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : DEFAULT_TICKETS;
        } catch (e) {
          console.warn('Error leyendo tickets_requisicion:', e);
          return DEFAULT_TICKETS;
        }
      }

      function saveTicketsToStorage(tickets) {
        try {
          localStorage.setItem('tickets_requisicion', JSON.stringify(tickets));
          window.dispatchEvent(new CustomEvent('ticketsUpdated'));
        } catch (e) {
          console.error('Error guardando tickets_requisicion:', e);
        }
      }

      function getRawMaterialsFromStorage() {
        try {
          const raw = localStorage.getItem('materias_primas');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch (e) {}
        return [
          { code: 'MAT-001', name: 'Harina de Trigo Todo Uso', unit: 'kg' },
          { code: 'MAT-002', name: 'Mantequilla Sin Sal 82%', unit: 'kg' },
          { code: 'MAT-003', name: 'Azúcar Refinada Extra', unit: 'kg' },
          { code: 'MAT-004', name: 'Levadura Fresca Instantánea', unit: 'kg' },
          { code: 'MAT-005', name: 'Leche Entera Pasteurizada', unit: 'L' },
          { code: 'MAT-006', name: 'Sal Marina Fina', unit: 'kg' }
        ];
      }

      function populateRawMaterialsSelect() {
        const solicitarMpSelect = document.getElementById('solicitarMpSelect');
        const solicitarMpUom = document.getElementById('solicitarMpUom');
        if (!solicitarMpSelect) return;

        const items = getRawMaterialsFromStorage();
        solicitarMpSelect.innerHTML = '';
        items.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.code || item.id;
          opt.textContent = `${item.name} (${item.unit || 'kg'})`;
          opt.dataset.unit = item.unit || 'kg';
          opt.dataset.name = item.name;
          solicitarMpSelect.appendChild(opt);
        });

        if (items.length > 0 && solicitarMpUom) {
          solicitarMpUom.value = items[0].unit || 'kg';
        }

        solicitarMpSelect.addEventListener('change', () => {
          const selectedOption = solicitarMpSelect.options[solicitarMpSelect.selectedIndex];
          if (selectedOption && solicitarMpUom) {
            solicitarMpUom.value = selectedOption.dataset.unit || 'kg';
          }
        });
      }

      function cleanManagerName(rawName) {
        if (!rawName) return '';
        return rawName.replace(/\s*\(@[^)]+\)/gi, '').trim();
      }

      function renderMyTicketsTable() {
        const tbody = document.getElementById('kitchenMyTicketsTbody');
        const badgeCount = document.getElementById('kitchenTicketsBadgeCount');
        if (!tbody) return;

        const tickets = getTicketsFromStorage();
        if (badgeCount) badgeCount.textContent = `${tickets.length} Ticket(s) Registrado(s)`;

        tbody.innerHTML = '';
        if (tickets.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-muted); padding: 1.5rem;">No has realizado solicitudes de materia prima aún.</td></tr>`;
          return;
        }

        tickets.forEach(ticket => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid var(--border-subtle)';

          let statusBadge = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(255,152,0,0.15); color: #E65100; border: 1px solid rgba(255,152,0,0.3); font-weight: 700;"><i data-lucide="clock" class="icon-xs"></i> Pendiente</span>`;
          if (ticket.status === 'Aprobado') {
            statusBadge = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(46,125,50,0.15); color: var(--color-success); border: 1px solid rgba(46,125,50,0.3); font-weight: 700;"><i data-lucide="check" class="icon-xs"></i> Aprobado</span>`;
          } else if (ticket.status === 'Rechazado') {
            statusBadge = `<span class="badge-stock-normal badge-clean-icon" style="background: rgba(198,40,40,0.15); color: var(--color-danger); border: 1px solid rgba(198,40,40,0.3); font-weight: 700;"><i data-lucide="x" class="icon-xs"></i> Rechazado</span>`;
          }

          let responseText = '<span style="color: var(--color-muted); font-style: italic;">Esperando revisión gerencial...</span>';
          if (ticket.status === 'Aprobado') {
            const mgr = cleanManagerName(ticket.processedBy);
            const mgrLabel = mgr ? `: ${mgr}` : '';
            responseText = `<span style="color: var(--color-success); font-weight: 700;" class="badge-clean-icon"><i data-lucide="check" class="icon-xs"></i> Aprobado por Gerencia${mgrLabel}</span> <br/><span style="font-size: 0.76rem; color: var(--color-muted);"><i data-lucide="clock" class="icon-xs"></i> ${ticket.processedAt || ticket.date}</span>`;
          } else if (ticket.status === 'Rechazado') {
            const mgr = cleanManagerName(ticket.processedBy);
            const mgrLabel = mgr ? `: ${mgr}` : '';
            const motivoText = ticket.reason ? ` — Motivo: "${ticket.reason}"` : '';
            responseText = `<span style="color: var(--color-danger); font-weight: 700;" class="badge-clean-icon"><i data-lucide="x" class="icon-xs"></i> Rechazado por Gerencia${mgrLabel}</span>${motivoText} <br/><span style="font-size: 0.76rem; color: var(--color-muted);"><i data-lucide="clock" class="icon-xs"></i> ${ticket.processedAt || ticket.date}</span>`;
          }

          tr.innerHTML = `
            <td style="padding: 0.75rem 1rem;"><span class="table-code-badge" style="font-weight: 800;">${ticket.id}</span></td>
            <td style="padding: 0.75rem 1rem; font-size: 0.85rem;">${ticket.date}</td>
            <td style="padding: 0.75rem 1rem;"><strong>${ticket.itemName}</strong></td>
            <td style="padding: 0.75rem 1rem;"><strong style="color: var(--color-gold-dark);">${ticket.qty} ${ticket.unit}</strong></td>
            <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--color-muted);">${ticket.notes || '-'}</td>
            <td style="padding: 0.75rem 1rem;">${statusBadge}</td>
            <td style="padding: 0.75rem 1rem; font-size: 0.84rem;">${responseText}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      const modalSolicitarMp = document.getElementById('modalSolicitarMp');
      const btnOpenSolicitarMpModal = document.getElementById('btnOpenSolicitarMpModal');
      const closeSolicitarMpModalBtn = document.getElementById('closeSolicitarMpModalBtn');
      const cancelSolicitarMpModalBtn = document.getElementById('cancelSolicitarMpModalBtn');
      const solicitarMpForm = document.getElementById('solicitarMpForm');

      btnOpenSolicitarMpModal?.addEventListener('click', () => {
        populateRawMaterialsSelect();
        if (modalSolicitarMp) {
          modalSolicitarMp.style.display = 'flex';
          modalSolicitarMp.classList.add('active');
        }
      });

      function closeSolicitarMpModal() {
        if (modalSolicitarMp) {
          modalSolicitarMp.style.display = 'none';
          modalSolicitarMp.classList.remove('active');
          solicitarMpForm?.reset();
        }
      }

      closeSolicitarMpModalBtn?.addEventListener('click', closeSolicitarMpModal);
      cancelSolicitarMpModalBtn?.addEventListener('click', closeSolicitarMpModal);
      modalSolicitarMp?.addEventListener('click', (e) => {
        if (e.target === modalSolicitarMp) closeSolicitarMpModal();
      });

      function showSuccessModal(title, message) {
        const modal = document.getElementById('modalExitoNotificacion');
        const titleEl = document.getElementById('modalExitoTitle');
        const msgEl = document.getElementById('modalExitoMsg');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.innerHTML = message;

        if (modal) {
          modal.style.display = 'flex';
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');

          const svg = modal.querySelector('.success-checkmark-svg');
          const wrapper = modal.querySelector('.success-checkmark-wrapper');
          if (wrapper) {
            wrapper.style.animation = 'none';
            void wrapper.offsetWidth;
            wrapper.style.animation = '';
          }
          if (svg) {
            svg.style.animation = 'none';
            void svg.offsetWidth;
            svg.style.animation = '';
          }
        }
      }

      function closeSuccessModal() {
        const modal = document.getElementById('modalExitoNotificacion');
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
        }
      }

      document.getElementById('closeSuccessModalBtn')?.addEventListener('click', closeSuccessModal);
      document.getElementById('modalExitoNotificacion')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalExitoNotificacion') closeSuccessModal();
      });

      // --- 1. MODAL: NUEVO ENCARGO O COMANDA MANUAL ---
      const modalNuevoEncargo = document.getElementById('modalNuevoEncargo');
      const btnOpenNuevoEncargoModal = document.getElementById('btnOpenNuevoEncargoModal');
      const closeNuevoEncargoModalBtn = document.getElementById('closeNuevoEncargoModalBtn');
      const cancelNuevoEncargoModalBtn = document.getElementById('cancelNuevoEncargoModalBtn');
      const nuevoEncargoForm = document.getElementById('nuevoEncargoForm');

      btnOpenNuevoEncargoModal?.addEventListener('click', () => {
        if (modalNuevoEncargo) {
          modalNuevoEncargo.style.display = 'flex';
          modalNuevoEncargo.classList.add('active');
          document.getElementById('encargoReferencia')?.focus();
        }
      });

      function closeNuevoEncargoModal() {
        if (modalNuevoEncargo) {
          modalNuevoEncargo.style.display = 'none';
          modalNuevoEncargo.classList.remove('active');
          nuevoEncargoForm?.reset();
        }
      }

      closeNuevoEncargoModalBtn?.addEventListener('click', closeNuevoEncargoModal);
      cancelNuevoEncargoModalBtn?.addEventListener('click', closeNuevoEncargoModal);
      modalNuevoEncargo?.addEventListener('click', (e) => {
        if (e.target === modalNuevoEncargo) closeNuevoEncargoModal();
      });

      nuevoEncargoForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ref = document.getElementById('encargoReferencia')?.value?.trim() || ('ENC-' + Date.now().toString().slice(-4));
        const det = document.getElementById('encargoDetalles')?.value?.trim();
        if (!det) return;

        try {
          const res = await fetch('../api/kitchen/crear_comanda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero_factura: ref, detalles_pedido: det })
          });
          const data = await res.json();
          if (data && data.success) {
            specialOrders.unshift({
              id: data.comanda.id,
              numero_factura: data.comanda.numero_factura,
              detalles_pedido: data.comanda.detalles_pedido,
              estado_preparacion: 'pending',
              fecha_hora: data.comanda.fecha_hora
            });
            renderDemandMonitor();
            updateKPIs();
            closeNuevoEncargoModal();
            showSuccessModal('¡Encargo Registrado!', `El encargo "<strong>${ref}</strong>" ha sido enviado a la pantalla de cocina.`);
          } else {
            alert(data.message || 'Error al guardar encargo');
          }
        } catch (err) {
          console.error('Error creando encargo:', err);
          alert('Error de conexión al registrar encargo.');
        }
      });

      // --- 2. MODAL: CREAR LOTE DIRECTO DE PRODUCCIÓN ---
      const modalNuevoLote = document.getElementById('modalNuevoLote');
      const btnOpenNuevoLoteModal = document.getElementById('btnOpenNuevoLoteModal');
      const closeNuevoLoteModalBtn = document.getElementById('closeNuevoLoteModalBtn');
      const cancelNuevoLoteModalBtn = document.getElementById('cancelNuevoLoteModalBtn');
      const nuevoLoteForm = document.getElementById('nuevoLoteForm');

      btnOpenNuevoLoteModal?.addEventListener('click', () => {
        if (modalNuevoLote) {
          modalNuevoLote.style.display = 'flex';
          modalNuevoLote.classList.add('active');
          document.getElementById('loteProductoNombre')?.focus();
        }
      });

      function closeNuevoLoteModal() {
        if (modalNuevoLote) {
          modalNuevoLote.style.display = 'none';
          modalNuevoLote.classList.remove('active');
          nuevoLoteForm?.reset();
        }
      }

      closeNuevoLoteModalBtn?.addEventListener('click', closeNuevoLoteModal);
      cancelNuevoLoteModalBtn?.addEventListener('click', closeNuevoLoteModal);
      modalNuevoLote?.addEventListener('click', (e) => {
        if (e.target === modalNuevoLote) closeNuevoLoteModal();
      });

      nuevoLoteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prod = document.getElementById('loteProductoNombre')?.value?.trim();
        const qty = parseInt(document.getElementById('loteCantidad')?.value, 10) || 50;
        const temp = parseInt(document.getElementById('loteTemperatura')?.value, 10) || 220;
        const timeMin = parseInt(document.getElementById('loteTiempoMin')?.value, 10) || 20;
        if (!prod) return;

        try {
          const res = await fetch('../api/kitchen/gestionar_lote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              producto: prod,
              cantidad: qty,
              temperatura_recomendada: temp,
              tiempo_recomendado_min: timeMin,
              icono: 'croissant'
            })
          });
          const data = await res.json();
          if (data && data.success) {
            const lote = data.lote;
            stagingBatches.unshift({
              id: lote.id,
              code: lote.codigo,
              productName: `${lote.cantidad}x ${lote.producto}`,
              productCode: '',
              icon: lote.icono || 'croissant',
              units: lote.cantidad,
              phase: 1,
              prepStatus: lote.estado_leudado,
              fermentRemainingMin: 60,
              recommendedTemp: lote.temperatura_recomendada,
              recommendedTimeMin: lote.tiempo_recomendado_min
            });
            renderStagingBatches();
            updateKPIs();
            closeNuevoLoteModal();
            showSuccessModal('¡Lote Creado en Producción!', `Se inició el <strong>${lote.codigo}</strong> (${lote.cantidad} ud de "${lote.producto}") en mesa de panadería.`);
          } else {
            alert(data.message || 'Error al iniciar lote');
          }
        } catch (err) {
          console.error('Error creando lote:', err);
          alert('Error de conexión al crear lote.');
        }
      });

      solicitarMpForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const select = document.getElementById('solicitarMpSelect');
        const qtyVal = parseFloat(document.getElementById('solicitarMpCantidad')?.value || 0);
        const notesVal = document.getElementById('solicitarMpNotas')?.value?.trim() || '';
        const uomVal = document.getElementById('solicitarMpUom')?.value || 'kg';

        if (!select || qtyVal <= 0) return;

        const selectedOption = select.options[select.selectedIndex];
        const itemCode = select.value;
        const itemName = selectedOption ? (selectedOption.dataset.name || selectedOption.textContent.split(' (')[0]) : itemCode;

        const tickets = getTicketsFromStorage();
        const nextNum = tickets.length + 1;
        const newId = `REQ-${String(nextNum).padStart(3, '0')}`;

        const now = new Date();
        const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newTicket = {
          id: newId,
          date: dateFormatted,
          baker: session?.user?.name || 'Jean-Luc Dubois',
          itemCode,
          itemName,
          qty: qtyVal,
          unit: uomVal,
          notes: notesVal,
          status: 'Pendiente',
          reason: ''
        };

        tickets.unshift(newTicket);
        saveTicketsToStorage(tickets);
        renderMyTicketsTable();
        closeSolicitarMpModal();

        showSuccessModal(
          '¡Requisición Enviada con Éxito!',
          `Se generó el ticket <strong style="color: var(--color-gold-dark); font-size: 1.05rem;">#${newId}</strong> para <strong>${qtyVal} ${uomVal}</strong> de <strong>"${itemName}"</strong>.<br/><br/><span style="font-size: 0.88rem; color: var(--color-muted);">El estado cambió a <strong>Pendiente de aprobación por Gerencia</strong>.</span>`
        );
      });

      renderMyTicketsTable();
      window.addEventListener('ticketsUpdated', renderMyTicketsTable);
      window.addEventListener('storage', (e) => {
        if (e.key === 'tickets_requisicion') renderMyTicketsTable();
      });
    } catch (err) {
      console.error('Error inicializando requisición en Cocina:', err);
    }
  }

  inicializarRequisicionCocina();

  // ==========================================================================
  // 9. RECETARIO MAESTRO & CALCULADORA INTERACTIVA DE HORNEADO DE PANES
  // ==========================================================================
  function inicializarRecetarioCocina() {
    try {
      const recetarioModal = document.getElementById('recetarioModal');
      const btnOpenRecetarioModal = document.getElementById('btnOpenRecetarioModal');
      const btnCloseRecetarioModal = document.getElementById('btnCloseRecetarioModal');
      const btnCloseRecetarioFooter = document.getElementById('btnCloseRecetarioFooter');
      const breadChipsContainer = document.getElementById('breadChipsContainer');
      const recetarioQtyInput = document.getElementById('recetarioQtyInput');
      const btnQtyMinus = document.getElementById('btnQtyMinus');
      const btnQtyPlus = document.getElementById('btnQtyPlus');
      const btnSendBatchToKitchen = document.getElementById('btnSendBatchToKitchen');
      const btnSendBatchText = document.getElementById('btnSendBatchText');
      const btnSolicitarInsumosFaltantesWrapper = document.getElementById('btnSolicitarInsumosFaltantesWrapper');
      const btnSolicitarInsumosFaltantes = document.getElementById('btnSolicitarInsumosFaltantes');
      const btnSolicitarInsumosFaltantesText = document.getElementById('btnSolicitarInsumosFaltantesText');
      const tabBtnInsumos = document.getElementById('tabBtnInsumos');
      const tabBtnHorno = document.getElementById('tabBtnHorno');
      const recetarioTabInsumos = document.getElementById('recetarioTabInsumos');
      const recetarioTabHorno = document.getElementById('recetarioTabHorno');

      let currentRecipeId = 'rec_baguette';
      let currentRecipeQty = 50;
      let liveInventory = JSON.parse(JSON.stringify(INVENTORY_DATABASE));

      // Helper para asociar iconos visuales representativos a los insumos
      function getIngredientIcon(name) {
        const n = (name || '').toLowerCase();
        if (n.includes('harina')) return '🌾';
        if (n.includes('mantequilla')) return '🧈';
        if (n.includes('leche') || n.includes('agua')) return '🥛';
        if (n.includes('huevo') || n.includes('yema')) return '🥚';
        if (n.includes('chocolate') || n.includes('cacao')) return '🍫';
        if (n.includes('levadura')) return '🍞';
        if (n.includes('azúcar') || n.includes('azucar') || n.includes('miel') || n.includes('papelón') || n.includes('vainilla')) return '🍯';
        if (n.includes('sal')) return '🧂';
        if (n.includes('aceituna') || n.includes('aceite')) return '🫒';
        if (n.includes('jamón') || n.includes('jamon') || n.includes('tocino') || n.includes('pavo')) return '🥓';
        if (n.includes('queso')) return '🧀';
        if (n.includes('pasas')) return '🍇';
        if (n.includes('anís') || n.includes('anis')) return '🌿';
        return '📦';
      }

      // Manejo de pestañas para evitar saturación visual
      function switchRecetarioTab(tabName) {
        if (tabName === 'insumos') {
          tabBtnInsumos?.classList.add('active');
          tabBtnHorno?.classList.remove('active');
          if (recetarioTabInsumos) recetarioTabInsumos.style.display = 'block';
          if (recetarioTabHorno) recetarioTabHorno.style.display = 'none';
        } else {
          tabBtnHorno?.classList.add('active');
          tabBtnInsumos?.classList.remove('active');
          if (recetarioTabHorno) recetarioTabHorno.style.display = 'block';
          if (recetarioTabInsumos) recetarioTabInsumos.style.display = 'none';
        }
        window.LucideIcons?.refresh();
      }

      tabBtnInsumos?.addEventListener('click', () => switchRecetarioTab('insumos'));
      tabBtnHorno?.addEventListener('click', () => switchRecetarioTab('horno'));

      async function syncLiveInventory() {
        try {
          const res = await fetch('../api/inventory/get_inventory.php');
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.inventory) && data.inventory.length > 0) {
              liveInventory = data.inventory;
              calculateAndRenderRecipe();
            }
          }
        } catch (e) {
          console.warn('Recetario: Usando inventario maestro local.', e);
        }
      }
      syncLiveInventory();

      function openRecetarioModal() {
        if (!recetarioModal) return;
        recetarioModal.style.display = 'flex';
        recetarioModal.classList.add('active');
        recetarioModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('auth-modal-open');
        calculateAndRenderRecipe();
        window.LucideIcons?.refresh();
      }

      function closeRecetarioModal() {
        if (!recetarioModal) return;
        recetarioModal.style.display = 'none';
        recetarioModal.classList.remove('active');
        recetarioModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('auth-modal-open');
      }

      openRecetarioForReplenishment = function(code, suggestedQty) {
        const matched = activeRecipes.find(r => r.code === code || r.name.toLowerCase().includes((code || '').toLowerCase()));
        if (matched) {
          currentRecipeId = matched.id;
          if (recetarioQtyInput) {
            recetarioQtyInput.value = suggestedQty || matched.defaultQty || 50;
          }
          openRecetarioModal();
          renderBreadChips();
          calculateAndRenderRecipe();
        } else {
          openRecetarioModal();
        }
      };

      btnOpenRecetarioModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openRecetarioModal();
      });

      btnCloseRecetarioModal?.addEventListener('click', closeRecetarioModal);
      btnCloseRecetarioFooter?.addEventListener('click', closeRecetarioModal);
      recetarioModal?.addEventListener('click', (e) => {
        if (e.target === recetarioModal) closeRecetarioModal();
      });

      // Renderizado de las tarjetas selectoras de pan en CUADRÍCULA VISUAL
      function renderBreadChips() {
        if (!breadChipsContainer) return;
        breadChipsContainer.innerHTML = '';

        activeRecipes.forEach(recipe => {
          const card = document.createElement('div');
          card.className = `bread-grid-card ${recipe.id === currentRecipeId ? 'active' : ''}`;
          card.dataset.recipeId = recipe.id;

          card.innerHTML = `
            <div class="bread-grid-icon-box">${recipe.icon}</div>
            <div class="bread-grid-name">${recipe.name}</div>
            <div class="bread-grid-meta">
              <span>${recipe.bakingProfile?.temp || 200}°C</span>
              <span>&bull;</span>
              <span>${recipe.bakingProfile?.timeMin || 20}m</span>
            </div>
          `;

          card.addEventListener('click', () => {
            currentRecipeId = recipe.id;
            document.querySelectorAll('.bread-grid-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            calculateAndRenderRecipe();
          });

          breadChipsContainer.appendChild(card);
        });
      }

      // Cálculo reactivo de ingredientes y parámetros técnicos sin saturación
      function calculateAndRenderRecipe() {
        const recipe = activeRecipes.find(r => r.id === currentRecipeId) || activeRecipes[0];
        if (!recipe) return;
        currentRecipeId = recipe.id;
        let qty = parseInt(recetarioQtyInput?.value || 50, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (qty > 1000) qty = 1000;
        currentRecipeQty = qty;

        // 1. Actualización de la Barra Hero
        const heroIcon = document.getElementById('heroBreadIcon');
        const heroName = document.getElementById('heroBreadName');
        const heroDesc = document.getElementById('heroBreadDesc');
        const catBadge = document.getElementById('recetarioActiveCategoryBadge');

        if (heroIcon) heroIcon.textContent = recipe.icon;
        if (heroName) heroName.textContent = recipe.name;
        if (heroDesc) heroDesc.textContent = `${recipe.category} • Código: ${recipe.code} • ${recipe.unitWeightGrams}g / ud`;
        if (catBadge) catBadge.textContent = `${recipe.category} • ${recipe.code}`;

        // Peso total de masa
        const totalDoughKg = (currentRecipeQty * recipe.unitWeightGrams / 1000);
        const doughEl = document.getElementById('recipeTotalDoughWeight');
        if (doughEl) {
          doughEl.textContent = `${totalDoughKg.toFixed(2)} kg`;
        }

        // Métricas rápidas de la barra Hero
        const heroTemp = document.getElementById('specBakeTemp');
        const heroTime = document.getElementById('specBakeTime');
        const heroOven = document.getElementById('specOvenShort');
        if (heroTemp) heroTemp.textContent = `${recipe.bakingProfile.temp} °C`;
        if (heroTime) heroTime.textContent = `${recipe.bakingProfile.timeMin} min`;
        if (heroOven) {
          const ovenShort = recipe.bakingProfile.ovenType.includes('Piedra') ? 'Piedra' : 
                           (recipe.bakingProfile.ovenType.includes('Convección') ? 'Convección' : 'Rotativo');
          heroOven.textContent = ovenShort;
        }

        // Sincronizar botones de presets
        document.querySelectorAll('.qty-preset-btn').forEach(btn => {
          const pQty = parseInt(btn.dataset.qty, 10);
          btn.classList.toggle('active', pQty === currentRecipeQty);
        });

        // 2. Renderizado de Insumos en TARJETAS VISUALES (TILES)
        const tilesContainer = document.getElementById('recipeIngredientsTilesContainer');
        let missingIngredients = [];

        if (tilesContainer) {
          tilesContainer.innerHTML = '';

          recipe.ingredients.forEach(ing => {
            const needed = ing.qty * currentRecipeQty;
            let neededFormatted = '';
            if (ing.unit === 'kg') {
              neededFormatted = needed < 1 
                ? `${(needed * 1000).toFixed(0)} g` 
                : `${needed.toFixed(2)} kg`;
            } else if (ing.unit === 'L') {
              neededFormatted = needed < 1 
                ? `${(needed * 1000).toFixed(0)} ml` 
                : `${needed.toFixed(2)} L`;
            } else {
              neededFormatted = `${Math.ceil(needed)} ${ing.unit}`;
            }

            let isShortage = false;
            let stockDisplay = 'Stock: En Cocina';
            let statusBadge = '<span class="badge-stock-ok"><i data-lucide="check" class="icon-xs"></i> Disponible</span>';

            if (ing.matCode) {
              const invItem = liveInventory.find(item => item.code === ing.matCode || item.id === ing.matCode);
              if (invItem) {
                const currentStock = Number(invItem.currentStock || 0);
                stockDisplay = `Stock: ${currentStock.toFixed(1)} ${invItem.unit}`;

                if (currentStock >= needed) {
                  statusBadge = `<span class="badge-stock-ok"><i data-lucide="check" class="icon-xs"></i> Suficiente (${currentStock.toFixed(0)} ${invItem.unit})</span>`;
                } else {
                  isShortage = true;
                  const missingQty = Math.max(0, needed - currentStock);
                  missingIngredients.push({
                    name: ing.name,
                    matCode: ing.matCode,
                    missingQty,
                    unit: ing.unit
                  });
                  statusBadge = `<span class="badge-stock-danger"><i data-lucide="alert-circle" class="icon-xs"></i> Faltan ${missingQty.toFixed(1)} ${ing.unit}</span>`;
                }
              } else {
                stockDisplay = 'Stock: Almacén General';
                statusBadge = '<span class="badge-stock-ok"><i data-lucide="check" class="icon-xs"></i> En Almacén</span>';
              }
            }

            const tile = document.createElement('div');
            tile.className = `ingredient-tile-card ${isShortage ? 'shortage' : ''}`;
            tile.innerHTML = `
              <div class="ingredient-tile-top">
                <span class="ingredient-tile-icon">${getIngredientIcon(ing.name)}</span>
                ${statusBadge}
              </div>
              <div class="ingredient-tile-name">${ing.name}</div>
              <div class="ingredient-tile-amount">${neededFormatted}</div>
              <div class="ingredient-tile-stock">
                <span>${stockDisplay}</span>
                <span style="font-weight: 700; opacity: 0.65;">${ing.matCode || 'INS-EXT'}</span>
              </div>
            `;
            tilesContainer.appendChild(tile);
          });
        }

        // 3. Banner de alerta y botón de requisición a Gerencia
        const alertBanner = document.getElementById('recipeStockAlertBanner');
        if (alertBanner) {
          if (missingIngredients.length === 0) {
            alertBanner.style.background = 'rgba(46, 125, 50, 0.08)';
            alertBanner.style.border = '1px solid rgba(46, 125, 50, 0.25)';
            alertBanner.style.color = 'var(--color-success)';
            alertBanner.innerHTML = `<span style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="check-circle" class="icon-sm"></i> <span>¡Stock Verificado! Hay suficientes insumos en almacén para hornear este lote de ${currentRecipeQty} ${recipe.name}.</span></span>`;
            if (btnSolicitarInsumosFaltantesWrapper) btnSolicitarInsumosFaltantesWrapper.style.display = 'none';
          } else {
            alertBanner.style.background = 'rgba(198, 40, 40, 0.08)';
            alertBanner.style.border = '1px solid rgba(198, 40, 40, 0.25)';
            alertBanner.style.color = 'var(--color-danger)';
            alertBanner.innerHTML = `<span style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="alert-triangle" class="icon-sm"></i> <span>Alerta de Almacén: Se detectaron ${missingIngredients.length} insumo(s) insuficientes para ${currentRecipeQty} unidades.</span></span>`;
            
            if (btnSolicitarInsumosFaltantesWrapper) {
              btnSolicitarInsumosFaltantesWrapper.style.display = 'block';
              const firstMissing = missingIngredients[0];
              if (btnSolicitarInsumosFaltantesText) {
                btnSolicitarInsumosFaltantesText.textContent = `Solicitar ${firstMissing.name} (Faltan ${firstMissing.missingQty.toFixed(1)} ${firstMissing.unit}) a Gerencia / Almacén`;
              }
              if (btnSolicitarInsumosFaltantes) {
                btnSolicitarInsumosFaltantes.onclick = () => {
                  closeRecetarioModal();
                  const modalMp = document.getElementById('modalSolicitarMp');
                  const selectMp = document.getElementById('solicitarMpSelect');
                  const cantMp = document.getElementById('solicitarMpCantidad');
                  const notasMp = document.getElementById('solicitarMpNotas');
                  if (modalMp) {
                    modalMp.style.display = 'flex';
                    modalMp.classList.add('active');
                    if (selectMp) {
                      selectMp.value = firstMissing.matCode;
                      selectMp.dispatchEvent(new Event('change'));
                    }
                    if (cantMp) {
                      cantMp.value = Math.ceil(firstMissing.missingQty);
                    }
                    if (notasMp) {
                      notasMp.value = `Faltante calculado automáticamente por el Recetario para lote de ${currentRecipeQty}x ${recipe.name}.`;
                    }
                  }
                };
              }
            }
          }
        }

        // 4. Parámetros Técnicos de Horno (Pestaña 2)
        const specOven = document.getElementById('specOvenType');
        const specSteam = document.getElementById('specBakeSteam');
        const specFerm = document.getElementById('specFermentation');

        if (specOven) specOven.textContent = recipe.bakingProfile.ovenType;
        if (specSteam) specSteam.textContent = recipe.bakingProfile.steam;
        if (specFerm) specFerm.textContent = recipe.bakingProfile.fermentationTime;

        // Pasos de preparación secuenciales
        const stepsContainer = document.getElementById('recipeStepsContainer');
        if (stepsContainer) {
          stepsContainer.innerHTML = '';
          recipe.steps.forEach((st, idx) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'recipe-step-item';
            stepDiv.innerHTML = `
              <span class="recipe-step-num">${idx + 1}</span>
              <div class="recipe-step-text">
                <strong>${st.title}:</strong> ${st.desc}
              </div>
            `;
            stepsContainer.appendChild(stepDiv);
          });
        }

        // Secreto del Maestro Panadero
        const tipEl = document.getElementById('recipeChefTipText');
        if (tipEl) tipEl.textContent = recipe.chefTip;

        // Botón de Crear Lote en Cocina
        if (btnSendBatchText) {
          btnSendBatchText.textContent = `Crear Lote en Cocina (${currentRecipeQty} ud)`;
        }

        window.LucideIcons?.refresh();
      }

      // Controles táctiles de cantidad (+ / - / input)
      recetarioQtyInput?.addEventListener('input', () => {
        calculateAndRenderRecipe();
      });

      btnQtyMinus?.addEventListener('click', () => {
        let val = parseInt(recetarioQtyInput?.value || 50, 10);
        val = Math.max(1, val - 5);
        if (recetarioQtyInput) recetarioQtyInput.value = val;
        calculateAndRenderRecipe();
      });

      btnQtyPlus?.addEventListener('click', () => {
        let val = parseInt(recetarioQtyInput?.value || 50, 10);
        val = Math.min(1000, val + 5);
        if (recetarioQtyInput) recetarioQtyInput.value = val;
        calculateAndRenderRecipe();
      });

      document.querySelectorAll('.qty-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.qty-preset-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const presetQty = parseInt(btn.dataset.qty, 10);
          if (recetarioQtyInput) recetarioQtyInput.value = presetQty;
          calculateAndRenderRecipe();
        });
      });

      // Acción: Enviar Lote al Staging de Cocina con Consumo Real de Materia Prima
      btnSendBatchToKitchen?.addEventListener('click', async () => {
        const recipe = activeRecipes.find(r => r.id === currentRecipeId) || activeRecipes[0];
        const nextBatchNum = stagingBatches.length + 48;
        const batchCode = `Lote #${String(nextBatchNum).padStart(3, '0')}`;

        const ingredientsPayload = recipe.ingredients.map(ing => ({
          matCode: ing.matCode,
          name: ing.name,
          qtyNeeded: ing.qty * currentRecipeQty,
          unit: ing.unit
        }));

        if (btnSendBatchText) btnSendBatchText.textContent = 'Verificando y consumiendo insumos...';
        btnSendBatchToKitchen.disabled = true;

        try {
          let res = await fetch('../api/kitchen/consumir_materia_prima_lote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipeCode: recipe.code,
              recipeName: recipe.name,
              batchCode: batchCode,
              units: currentRecipeQty,
              ingredients: ingredientsPayload,
              bakingTemp: recipe.bakingProfile.temp,
              bakingTimeMin: recipe.bakingProfile.timeMin
            })
          });

          if (!res.ok && res.status !== 400) {
            res = await fetch('api/kitchen/consumir_materia_prima_lote.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipeCode: recipe.code,
                recipeName: recipe.name,
                batchCode: batchCode,
                units: currentRecipeQty,
                ingredients: ingredientsPayload,
                bakingTemp: recipe.bakingProfile.temp,
                bakingTimeMin: recipe.bakingProfile.timeMin
              })
            });
          }

          const data = await res.json();

          if (data && data.success) {
            // Actualizar inventario local con las deducciones realizadas
            if (Array.isArray(data.deductions)) {
              data.deductions.forEach(d => {
                const item = liveInventory.find(i => i.code === d.code || i.id === d.code);
                if (item) item.currentStock = d.newStock;
              });

              // Sincronizar 'materias_primas' en localStorage para que Gerencia e Inventario lo vean de inmediato
              try {
                const rawMp = localStorage.getItem('materias_primas');
                let mpList = rawMp ? JSON.parse(rawMp) : [];
                if (Array.isArray(mpList)) {
                  data.deductions.forEach(d => {
                    const m = mpList.find(x => x.code === d.code || x.id === d.code || x.name === d.name);
                    if (m) m.stock = d.newStock;
                  });
                  localStorage.setItem('materias_primas', JSON.stringify(mpList));
                }
              } catch (e) {}

              // Registrar auditoría en movimientos_inventario
              try {
                const rawMovs = localStorage.getItem('movimientos_inventario');
                let movs = rawMovs ? JSON.parse(rawMovs) : [];
                movs.unshift({
                  id: 'mov_' + Date.now(),
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                  type: 'Consumo Producción',
                  category: 'materia_prima',
                  concept: `Amasado de Lote: ${batchCode} (${currentRecipeQty}x ${recipe.name})`,
                  user: activeChef.name || 'Maestro Panadero',
                  status: 'Completado',
                  itemsCount: data.deductions.length,
                  breakdown: data.deductions.map(d => ({ name: `${d.name}: -${d.qtyNeeded} ${d.unit}`, price: `Stock restante: ${d.newStock} ${d.unit}` }))
                });
                localStorage.setItem('movimientos_inventario', JSON.stringify(movs.slice(0, 100)));
              } catch (e) {}

              // Notificar en tiempo real a Gerencia y demás módulos
              window.dispatchEvent(new Event('materiasPrimasChanged'));
              window.dispatchEvent(new Event('movimientosChanged'));
              if (typeof BroadcastChannel !== 'undefined') {
                const matChannel = new BroadcastChannel('lnp_materials_channel');
                matChannel.postMessage({ type: 'materials_deducted', batch: batchCode, deductions: data.deductions, timestamp: Date.now() });
                setTimeout(() => matChannel.close(), 1000);
              }
            }

            const newBatch = {
              id: data.batch?.id || `stage_${Date.now()}`,
              code: batchCode,
              productName: `${currentRecipeQty}x ${recipe.name}`,
              productCode: recipe.code,
              icon: recipe.lucideIcon || 'croissant',
              units: currentRecipeQty,
              phase: 1, // Fase 1: Amasado
              prepStatus: 'Fase 1: Amasado y División en Mesa',
              fermentRemainingMin: 60,
              recommendedTemp: recipe.bakingProfile.temp,
              recommendedTimeMin: recipe.bakingProfile.timeMin
            };

            stagingBatches.unshift(newBatch);
            renderStagingBatches();
            updateKPIs();
            closeRecetarioModal();

            // Notificación animada de éxito
            const modal = document.getElementById('modalExitoNotificacion');
            const titleEl = document.getElementById('modalExitoTitle');
            const msgEl = document.getElementById('modalExitoMsg');

            if (titleEl) titleEl.textContent = '¡Lote Creado & Materia Prima Descontada!';
            if (msgEl) {
              msgEl.innerHTML = `Se ha iniciado el <strong>${newBatch.code}</strong> para <strong>${currentRecipeQty} unidades</strong> de <strong>"${recipe.name}"</strong>.<br/><br/>Los ingredientes requeridos fueron descontados del almacén de materias primas. El lote ahora está en la <strong>Fase 1 (Amasado)</strong>.`;
            }
            if (modal) {
              modal.style.display = 'flex';
              modal.classList.add('active');
              modal.setAttribute('aria-hidden', 'false');
            }
          } else if (data && data.code === 'INSUFFICIENT_STOCK') {
            const firstDeficit = data.missing && data.missing[0];
            const deficitMsg = firstDeficit 
              ? `Falta ${firstDeficit.deficit} ${firstDeficit.unit} de "${firstDeficit.name}".`
              : 'Stock insuficiente.';
            alert(`No es posible amasar este lote por falta de insumos en almacén: ${deficitMsg}\nPuedes generar una requisición a Gerencia usando el botón de Solicitar Materia Prima.`);
          } else {
            throw new Error(data.message || 'Error al procesar lote');
          }
        } catch (err) {
          console.warn('Fallo en consumir_materia_prima_lote (modo offline/resiliente):', err);
          const newBatch = {
            id: `stage_${Date.now()}`,
            code: batchCode,
            productName: `${currentRecipeQty}x ${recipe.name}`,
            productCode: recipe.code,
            icon: recipe.lucideIcon || 'croissant',
            units: currentRecipeQty,
            phase: 1,
            prepStatus: 'Fase 1: Amasado y División en Mesa',
            fermentRemainingMin: 60,
            recommendedTemp: recipe.bakingProfile.temp,
            recommendedTimeMin: recipe.bakingProfile.timeMin
          };

          stagingBatches.unshift(newBatch);
          renderStagingBatches();
          updateKPIs();
          closeRecetarioModal();
        } finally {
          btnSendBatchToKitchen.disabled = false;
          if (btnSendBatchText) btnSendBatchText.textContent = `Crear Lote en Cocina (${currentRecipeQty} ud)`;
        }
      });


      // ======================================================================
      // MODAL DE GESTIÓN Y EDICIÓN DE RECETAS (AGREGAR / MODIFICAR)
      // ======================================================================
      const modalRecetaForm = document.getElementById('modalRecetaForm');
      const modalRecetaFormTitle = document.getElementById('modalRecetaFormTitle');
      const modalRecetaFormSubtitle = document.getElementById('modalRecetaFormSubtitle');
      const closeRecetaFormModalBtn = document.getElementById('closeRecetaFormModalBtn');
      const cancelRecetaFormModalBtn = document.getElementById('cancelRecetaFormModalBtn');
      const recetaForm = document.getElementById('recetaForm');
      const recetaFormId = document.getElementById('recetaFormId');
      const btnEliminarRecetaBtn = document.getElementById('btnEliminarRecetaBtn');
      const saveRecetaFormBtnText = document.getElementById('saveRecetaFormBtnText');

      const btnOpenAgregarRecetaModal = document.getElementById('btnOpenAgregarRecetaModal');
      const btnOpenModificarRecetaModal = document.getElementById('btnOpenModificarRecetaModal');

      const recetaIngredientsTableBody = document.getElementById('recetaIngredientsTableBody');
      const btnAddIngredientRow = document.getElementById('btnAddIngredientRow');
      const recetaStepsContainerForm = document.getElementById('recetaStepsContainerForm');
      const btnAddStepRow = document.getElementById('btnAddStepRow');

      // Selector rápido de emojis para el icono del pan
      document.querySelectorAll('.btn-emoji-quick').forEach(btn => {
        btn.addEventListener('click', () => {
          const iconInput = document.getElementById('recetaInputIcon');
          if (iconInput) iconInput.value = btn.dataset.emoji || '🥖';
        });
      });

      // Función para añadir una fila de insumo a la tabla del formulario
      function addIngredientRow(data = {}) {
        if (!recetaIngredientsTableBody) return;
        const tr = document.createElement('tr');

        let matOptions = '<option value="">(Sin código / Insumo externo)</option>';
        if (Array.isArray(liveInventory) && liveInventory.length > 0) {
          liveInventory.forEach(inv => {
            const isSel = (data.matCode && (data.matCode === inv.code || data.matCode === inv.id)) ? 'selected' : '';
            matOptions += `<option value="${inv.code || inv.id}" data-name="${inv.name}" data-unit="${inv.unit}" ${isSel}>${inv.code || ''} - ${inv.name}</option>`;
          });
        }

        const nameVal = data.name || '';
        const qtyVal = (typeof data.qty === 'number') ? data.qty : (data.qty || 0.100);
        const unitVal = data.unit || 'kg';
        const isKeyVal = Boolean(data.isKey);

        tr.innerHTML = `
          <td>
            <input type="text" class="form-control-custom ing-name-input" placeholder="Nombre insumo" value="${nameVal}" required style="width: 100%; height: 34px; padding: 0 0.5rem; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);" />
          </td>
          <td>
            <select class="form-control-custom ing-matcode-select" style="width: 100%; height: 34px; padding: 0 0.4rem; font-size: 0.78rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              ${matOptions}
            </select>
          </td>
          <td>
            <input type="number" step="0.0001" min="0.0001" class="form-control-custom ing-qty-input" value="${qtyVal}" required style="width: 100%; height: 34px; padding: 0 0.5rem; text-align: right; font-weight: 700; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);" />
          </td>
          <td>
            <select class="form-control-custom ing-unit-select" style="width: 100%; height: 34px; padding: 0 0.35rem; font-size: 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <option value="kg" ${unitVal === 'kg' ? 'selected' : ''}>kg</option>
              <option value="g" ${unitVal === 'g' ? 'selected' : ''}>g</option>
              <option value="L" ${unitVal === 'L' ? 'selected' : ''}>L</option>
              <option value="ml" ${unitVal === 'ml' ? 'selected' : ''}>ml</option>
              <option value="ud" ${unitVal === 'ud' ? 'selected' : ''}>ud</option>
            </select>
          </td>
          <td style="text-align: center;">
            <input type="checkbox" class="ing-key-checkbox" ${isKeyVal ? 'checked' : ''} title="Insumo clave / crítico" style="transform: scale(1.1); cursor: pointer;" />
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-remove-ing-row" title="Eliminar fila" style="background: transparent; border: none; color: var(--color-danger); cursor: pointer; padding: 4px;">
              <i data-lucide="trash-2" class="icon-xs"></i>
            </button>
          </td>
        `;

        const selectEl = tr.querySelector('.ing-matcode-select');
        const nameInput = tr.querySelector('.ing-name-input');
        const unitSelect = tr.querySelector('.ing-unit-select');

        selectEl?.addEventListener('change', () => {
          const selectedOpt = selectEl.options[selectEl.selectedIndex];
          if (selectedOpt && selectedOpt.value) {
            if (!nameInput.value || nameInput.value.trim() === '') {
              nameInput.value = selectedOpt.dataset.name || '';
            }
            if (selectedOpt.dataset.unit) {
              unitSelect.value = selectedOpt.dataset.unit;
            }
          }
        });

        tr.querySelector('.btn-remove-ing-row')?.addEventListener('click', () => {
          if (recetaIngredientsTableBody.children.length > 1) {
            tr.remove();
          } else {
            alert('La receta debe contener al menos un insumo.');
          }
        });

        recetaIngredientsTableBody.appendChild(tr);
        window.LucideIcons?.refresh();
      }

      // Función para añadir un paso de preparación artesanal al formulario
      function addStepRow(data = {}) {
        if (!recetaStepsContainerForm) return;
        const stepIndex = recetaStepsContainerForm.children.length + 1;
        const stepDiv = document.createElement('div');
        stepDiv.className = 'receta-step-form-item';

        const titleVal = data.title || `Paso ${stepIndex}`;
        const descVal = data.desc || '';

        stepDiv.innerHTML = `
          <div class="receta-step-number-badge">${stepIndex}</div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
            <input type="text" class="form-control-custom step-title-input" placeholder="Título del paso (ej: Amasado, Autólisis, etc.)" value="${titleVal}" required style="width: 100%; height: 34px; padding: 0 0.65rem; font-weight: 700; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);" />
            <textarea class="form-control-custom step-desc-input" rows="2" placeholder="Descripción detallada de la técnica artesanal..." required style="width: 100%; padding: 0.4rem 0.65rem; font-size: 0.8rem; font-family: inherit; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">${descVal}</textarea>
          </div>
          <button type="button" class="btn-remove-step-row" title="Eliminar paso">
            <i data-lucide="trash-2" class="icon-xs"></i>
          </button>
        `;

        stepDiv.querySelector('.btn-remove-step-row')?.addEventListener('click', () => {
          if (recetaStepsContainerForm.children.length > 1) {
            stepDiv.remove();
            Array.from(recetaStepsContainerForm.children).forEach((child, i) => {
              const badge = child.querySelector('.receta-step-number-badge');
              if (badge) badge.textContent = i + 1;
            });
          } else {
            alert('La receta debe contener al menos un paso de elaboración.');
          }
        });

        recetaStepsContainerForm.appendChild(stepDiv);
        window.LucideIcons?.refresh();
      }

      // Apertura del modal en modo Crear o Modificar
      function openRecipeFormModal(recipeIdToEdit = null) {
        if (!modalRecetaForm) return;

        if (recetaIngredientsTableBody) recetaIngredientsTableBody.innerHTML = '';
        if (recetaStepsContainerForm) recetaStepsContainerForm.innerHTML = '';

        if (recipeIdToEdit) {
          // MODO MODIFICAR
          const rec = activeRecipes.find(r => r.id === recipeIdToEdit);
          if (!rec) return;

          if (modalRecetaFormTitle) modalRecetaFormTitle.textContent = `Modificar Receta: ${rec.name}`;
          if (modalRecetaFormSubtitle) modalRecetaFormSubtitle.textContent = `Edita los parámetros, insumos y guía de horneado de (${rec.code})`;
          if (saveRecetaFormBtnText) saveRecetaFormBtnText.textContent = 'Guardar Cambios';

          if (recetaFormId) recetaFormId.value = rec.id;
          const inputName = document.getElementById('recetaInputName');
          const inputCode = document.getElementById('recetaInputCode');
          const inputIcon = document.getElementById('recetaInputIcon');
          const inputCat = document.getElementById('recetaInputCategory');
          const inputWeight = document.getElementById('recetaInputUnitWeight');
          const inputDefaultQty = document.getElementById('recetaInputDefaultQty');
          const inputDesc = document.getElementById('recetaInputDesc');

          if (inputName) inputName.value = rec.name || '';
          if (inputCode) inputCode.value = rec.code || '';
          if (inputIcon) inputIcon.value = rec.icon || '🥖';
          if (inputCat) inputCat.value = rec.category || 'Panadería Francesa';
          if (inputWeight) inputWeight.value = rec.unitWeightGrams || 250;
          if (inputDefaultQty) inputDefaultQty.value = rec.defaultQty || 50;
          if (inputDesc) inputDesc.value = rec.description || '';

          const inputTemp = document.getElementById('recetaInputTemp');
          const inputTime = document.getElementById('recetaInputTime');
          const inputOvenType = document.getElementById('recetaInputOvenType');
          const inputSteam = document.getElementById('recetaInputSteam');
          const inputFerm = document.getElementById('recetaInputFerm');
          const inputDamper = document.getElementById('recetaInputDamper');
          const inputChefTip = document.getElementById('recetaInputChefTip');

          if (inputTemp) inputTemp.value = rec.bakingProfile?.temp || 220;
          if (inputTime) inputTime.value = rec.bakingProfile?.timeMin || 20;
          if (inputOvenType) inputOvenType.value = rec.bakingProfile?.ovenType || 'Bóveda de Piedra / Giratorio Industrial';
          if (inputSteam) inputSteam.value = rec.bakingProfile?.steam || '';
          if (inputFerm) inputFerm.value = rec.bakingProfile?.fermentationTime || '';
          if (inputDamper) inputDamper.value = rec.bakingProfile?.damper || '';
          if (inputChefTip) inputChefTip.value = rec.chefTip || '';

          if (Array.isArray(rec.ingredients) && rec.ingredients.length > 0) {
            rec.ingredients.forEach(ing => addIngredientRow(ing));
          } else {
            addIngredientRow({ name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.160, unit: 'kg', isKey: true });
          }

          if (Array.isArray(rec.steps) && rec.steps.length > 0) {
            rec.steps.forEach(st => addStepRow(st));
          } else {
            addStepRow({ title: 'Amasado', desc: 'Amasar todos los ingredientes hasta desarrollar membrana elástica.' });
            addStepRow({ title: 'Horneado', desc: 'Hornear a temperatura indicada según especificaciones.' });
          }

          if (btnEliminarRecetaBtn) {
            btnEliminarRecetaBtn.style.display = rec.id.startsWith('rec_custom_') ? 'inline-flex' : 'none';
          }
        } else {
          // MODO AGREGAR NUEVA
          if (modalRecetaFormTitle) modalRecetaFormTitle.textContent = 'Agregar Nueva Receta Artesanal';
          if (modalRecetaFormSubtitle) modalRecetaFormSubtitle.textContent = 'Registra una nueva fórmula con perfiles de horneado e insumos';
          if (saveRecetaFormBtnText) saveRecetaFormBtnText.textContent = 'Crear Receta';

          if (recetaFormId) recetaFormId.value = '';
          const nextNum = activeRecipes.length + 1;
          const suggestedCode = `PAN-${String(nextNum).padStart(3, '0')}`;

          const inputName = document.getElementById('recetaInputName');
          const inputCode = document.getElementById('recetaInputCode');
          const inputIcon = document.getElementById('recetaInputIcon');
          const inputCat = document.getElementById('recetaInputCategory');
          const inputWeight = document.getElementById('recetaInputUnitWeight');
          const inputDefaultQty = document.getElementById('recetaInputDefaultQty');
          const inputDesc = document.getElementById('recetaInputDesc');

          if (inputName) inputName.value = '';
          if (inputCode) inputCode.value = suggestedCode;
          if (inputIcon) inputIcon.value = '🥖';
          if (inputCat) inputCat.value = 'Panadería Francesa';
          if (inputWeight) inputWeight.value = 250;
          if (inputDefaultQty) inputDefaultQty.value = 50;
          if (inputDesc) inputDesc.value = '';

          const inputTemp = document.getElementById('recetaInputTemp');
          const inputTime = document.getElementById('recetaInputTime');
          const inputOvenType = document.getElementById('recetaInputOvenType');
          const inputSteam = document.getElementById('recetaInputSteam');
          const inputFerm = document.getElementById('recetaInputFerm');
          const inputDamper = document.getElementById('recetaInputDamper');
          const inputChefTip = document.getElementById('recetaInputChefTip');

          if (inputTemp) inputTemp.value = 220;
          if (inputTime) inputTime.value = 20;
          if (inputOvenType) inputOvenType.value = 'Bóveda de Piedra / Giratorio Industrial';
          if (inputSteam) inputSteam.value = 'Vapor inicial abundante (5 segundos)';
          if (inputFerm) inputFerm.value = '2h fermentación controlada a 26°C';
          if (inputDamper) inputDamper.value = 'Cerrado 15 min, abrir últimos 5 min';
          if (inputChefTip) inputChefTip.value = 'Mantener la temperatura del amasado en torno a 24°C para preservar los aromas.';

          addIngredientRow({ name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.160, unit: 'kg', isKey: true });
          addIngredientRow({ name: 'Agua Filtrada', matCode: '', qty: 0.100, unit: 'L', isKey: false });
          addIngredientRow({ name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.003, unit: 'kg', isKey: true });
          addIngredientRow({ name: 'Sal Marina Fina', matCode: '', qty: 0.003, unit: 'kg', isKey: false });

          addStepRow({ title: 'Amasado y Fuerza', desc: 'Mezclar harina, agua y levadura; amasar 8 minutos hasta obtener membrana suave.' });
          addStepRow({ title: 'Fermentación en Bloque', desc: 'Reposo en cubeta engrasada durante 1h 30m realizando pliegues.' });
          addStepRow({ title: 'División y Formado', desc: 'Dividir en porciones uniformes, bolear y dejar reposar 15 minutos.' });
          addStepRow({ title: 'Horneado con Vapor', desc: 'Hornear con vapor inicial hasta obtener corteza dorada y crujiente.' });

          if (btnEliminarRecetaBtn) btnEliminarRecetaBtn.style.display = 'none';
        }

        modalRecetaForm.style.display = 'flex';
        modalRecetaForm.classList.add('active');
        modalRecetaForm.setAttribute('aria-hidden', 'false');
        window.LucideIcons?.refresh();
      }

      function closeRecipeFormModal() {
        if (!modalRecetaForm) return;
        modalRecetaForm.style.display = 'none';
        modalRecetaForm.classList.remove('active');
        modalRecetaForm.setAttribute('aria-hidden', 'true');
      }

      // Procesar guardado de receta (Agregar o Modificar)
      recetaForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const idVal = recetaFormId ? recetaFormId.value.trim() : '';
        const nameVal = document.getElementById('recetaInputName')?.value.trim();
        const codeVal = document.getElementById('recetaInputCode')?.value.trim().toUpperCase();
        const iconVal = document.getElementById('recetaInputIcon')?.value.trim() || '🥖';
        const catVal = document.getElementById('recetaInputCategory')?.value || 'Panadería Francesa';
        const weightVal = parseFloat(document.getElementById('recetaInputUnitWeight')?.value) || 250;
        const defaultQtyVal = parseInt(document.getElementById('recetaInputDefaultQty')?.value, 10) || 50;
        const descVal = document.getElementById('recetaInputDesc')?.value.trim();

        const tempVal = parseInt(document.getElementById('recetaInputTemp')?.value, 10) || 220;
        const timeVal = parseInt(document.getElementById('recetaInputTime')?.value, 10) || 20;
        const ovenVal = document.getElementById('recetaInputOvenType')?.value || 'Bóveda de Piedra / Giratorio Industrial';
        const steamVal = document.getElementById('recetaInputSteam')?.value.trim();
        const fermVal = document.getElementById('recetaInputFerm')?.value.trim();
        const damperVal = document.getElementById('recetaInputDamper')?.value.trim();
        const chefTipVal = document.getElementById('recetaInputChefTip')?.value.trim();

        if (!nameVal || !codeVal) {
          alert('Por favor completa el nombre y el código de la receta.');
          return;
        }

        const ingRows = recetaIngredientsTableBody ? Array.from(recetaIngredientsTableBody.querySelectorAll('tr')) : [];
        const ingredients = [];
        ingRows.forEach(row => {
          const ingName = row.querySelector('.ing-name-input')?.value.trim();
          const ingMatCode = row.querySelector('.ing-matcode-select')?.value.trim() || null;
          const ingQty = parseFloat(row.querySelector('.ing-qty-input')?.value) || 0;
          const ingUnit = row.querySelector('.ing-unit-select')?.value || 'kg';
          const ingIsKey = Boolean(row.querySelector('.ing-key-checkbox')?.checked);

          if (ingName && ingQty > 0) {
            ingredients.push({
              name: ingName,
              matCode: ingMatCode || null,
              qty: ingQty,
              unit: ingUnit,
              isKey: ingIsKey
            });
          }
        });

        if (ingredients.length === 0) {
          alert('Por favor especifica al menos un ingrediente válido para la receta.');
          return;
        }

        const stepRows = recetaStepsContainerForm ? Array.from(recetaStepsContainerForm.querySelectorAll('.receta-step-form-item')) : [];
        const steps = [];
        stepRows.forEach((row, i) => {
          const stepTitle = row.querySelector('.step-title-input')?.value.trim() || `Paso ${i + 1}`;
          const stepDesc = row.querySelector('.step-desc-input')?.value.trim() || '';
          if (stepTitle || stepDesc) {
            steps.push({
              title: stepTitle,
              desc: stepDesc
            });
          }
        });

        if (steps.length === 0) {
          steps.push({ title: 'Horneado Artesanal', desc: 'Hornear según los parámetros térmicos establecidos.' });
        }

        const isEditing = Boolean(idVal);
        let targetId = idVal;

        if (isEditing) {
          const index = activeRecipes.findIndex(r => r.id === idVal);
          if (index !== -1) {
            activeRecipes[index] = {
              ...activeRecipes[index],
              name: nameVal,
              code: codeVal,
              icon: iconVal,
              category: catVal,
              unitWeightGrams: weightVal,
              defaultQty: defaultQtyVal,
              description: descVal || activeRecipes[index].description,
              bakingProfile: {
                temp: tempVal,
                timeMin: timeVal,
                ovenType: ovenVal,
                steam: steamVal,
                fermentationTime: fermVal,
                damper: damperVal
              },
              ingredients: ingredients,
              steps: steps,
              chefTip: chefTipVal
            };
          }
        } else {
          targetId = `rec_custom_${Date.now()}`;
          const newRecipe = {
            id: targetId,
            code: codeVal,
            name: nameVal,
            category: catVal,
            icon: iconVal,
            lucideIcon: 'croissant',
            description: descVal || `Fórmula artesanal de ${nameVal} creada por el Maestro Panadero.`,
            unitWeightGrams: weightVal,
            defaultQty: defaultQtyVal,
            bakingProfile: {
              temp: tempVal,
              timeMin: timeVal,
              ovenType: ovenVal,
              steam: steamVal,
              fermentationTime: fermVal,
              damper: damperVal
            },
            ingredients: ingredients,
            steps: steps,
            chefTip: chefTipVal || 'Supervisar el greñado y el golpe de vapor para asegurar el desarrollo óptimo de corteza.'
          };
          activeRecipes.push(newRecipe);
        }

        saveActiveRecipes(activeRecipes);
        currentRecipeId = targetId;

        renderBreadChips();
        calculateAndRenderRecipe();
        closeRecipeFormModal();

        const modalExito = document.getElementById('modalExitoNotificacion');
        const titleEl = document.getElementById('modalExitoTitle');
        const msgEl = document.getElementById('modalExitoMsg');
        if (titleEl) titleEl.textContent = isEditing ? '¡Receta Modificada con Éxito!' : '¡Nueva Receta Creada con Éxito!';
        if (msgEl) {
          msgEl.innerHTML = `La fórmula de <strong>"${nameVal}" (${codeVal})</strong> ha sido guardada en el <strong>Recetario Maestro &amp; Calculadora</strong>.<br/><br/>Ya está lista para calcular insumos y crear lotes de horneado en cocina.`;
        }
        if (modalExito) {
          modalExito.style.display = 'flex';
          modalExito.classList.add('active');
          modalExito.setAttribute('aria-hidden', 'false');
        }

        window.LucideIcons?.refresh();
      });

      // Eliminar receta personalizada
      btnEliminarRecetaBtn?.addEventListener('click', () => {
        const idVal = recetaFormId ? recetaFormId.value.trim() : '';
        if (!idVal) return;
        const rec = activeRecipes.find(r => r.id === idVal);
        if (!rec) return;

        if (confirm(`¿Deseas eliminar la receta "${rec.name}" (${rec.code}) del catálogo?`)) {
          activeRecipes = activeRecipes.filter(r => r.id !== idVal);
          saveActiveRecipes(activeRecipes);
          currentRecipeId = activeRecipes[0]?.id || 'rec_baguette';
          renderBreadChips();
          calculateAndRenderRecipe();
          closeRecipeFormModal();
        }
      });

      // Vincular botones superiores de apertura para Agregar y Modificar Receta
      btnOpenAgregarRecetaModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openRecipeFormModal(null);
      });
      btnAddIngredientRow?.addEventListener('click', () => addIngredientRow());
      btnAddStepRow?.addEventListener('click', () => addStepRow());

      btnOpenModificarRecetaModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openRecipeFormModal(currentRecipeId);
      });

      closeRecetaFormModalBtn?.addEventListener('click', closeRecipeFormModal);
      cancelRecetaFormModalBtn?.addEventListener('click', closeRecipeFormModal);
      modalRecetaForm?.addEventListener('click', (e) => {
        if (e.target === modalRecetaForm) closeRecipeFormModal();
      });

      renderBreadChips();
      calculateAndRenderRecipe();
    } catch (err) {
      console.error('Error inicializando Recetario en Cocina:', err);
    }
  }

  inicializarRecetarioCocina();

  // Cargar estado inicial inmediato desde almacenamiento local para evitar parpadeos
  loadOvensFromLocalStorage();

  // Escuchar actualizaciones de POS y Caja para refrescar alertas de vitrina en tiempo real
  if (typeof BroadcastChannel !== 'undefined') {
    const listenPosChannel = new BroadcastChannel('lnp_pos_catalog_channel');
    listenPosChannel.onmessage = () => {
      fetchKitchenState();
    };
  }
  window.addEventListener('catalogoPosChanged', () => fetchKitchenState());

  // Cargar estado inicial integral desde la base de datos MySQL
  fetchKitchenState();
});
