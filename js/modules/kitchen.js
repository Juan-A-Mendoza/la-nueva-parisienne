/* ==========================================================================
   MÓDULO 2: CONTROLADOR INTERACTIVO DE PRODUCCIÓN Y COCINA (KITCHEN.JS)
   Gestión en tiempo real de hornos, temporizadores, comandas KDS y lotes
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { OVENS_INITIAL_STATE, KDS_ORDERS_INITIAL_STATE, STAGING_BATCHES_INITIAL_STATE } from '../data/kitchen-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión
  const session = SessionStore.getSession();
  if (!session) {
    alert('Sesión no encontrada. Por favor inicie sesión.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar datos del Chef activo
  const chefNameEl = document.getElementById('chefName');
  const chefAvatarEl = document.getElementById('chefAvatar');
  if (chefNameEl) chefNameEl.textContent = session.user.name;
  if (chefAvatarEl) chefAvatarEl.textContent = session.user.icon;

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de la Aplicación de Cocina
  let ovens = JSON.parse(JSON.stringify(OVENS_INITIAL_STATE));
  let kdsOrders = JSON.parse(JSON.stringify(KDS_ORDERS_INITIAL_STATE));
  let stagingBatches = JSON.parse(JSON.stringify(STAGING_BATCHES_INITIAL_STATE));
  
  let bakedTodayCount = 142;
  let selectedStagingBatchId = null;

  // 3. Elementos DOM
  const ovensContainer = document.getElementById('ovensContainer');
  const kdsContainer = document.getElementById('kdsContainer');
  const stagingContainer = document.getElementById('stagingContainer');
  
  // KPI Badges
  const activeOvensKpi = document.getElementById('activeOvensKpi');
  const pendingOrdersKpi = document.getElementById('pendingOrdersKpi');
  const bakedTodayKpi = document.getElementById('bakedTodayKpi');
  
  // Modal de Carga de Lote
  const loadOvenModal = document.getElementById('loadOvenModal');
  const closeLoadOvenModalBtn = document.getElementById('closeLoadOvenModalBtn');
  const loadOvenForm = document.getElementById('loadOvenForm');
  const modalBatchName = document.getElementById('modalBatchName');
  const ovenSelect = document.getElementById('ovenSelect');
  const bakeTempInput = document.getElementById('bakeTempInput');
  const bakeTimeInput = document.getElementById('bakeTimeInput');

  // Inicializar renderizado
  renderAll();

  // Bucle de Temporizadores en Tiempo Real (Cada 1 Segundo)
  setInterval(() => {
    let stateChanged = false;
    ovens.forEach(oven => {
      if (oven.status === 'baking' && oven.batch && oven.batch.remainingSeconds > 0) {
        oven.batch.remainingSeconds--;
        stateChanged = true;

        if (oven.batch.remainingSeconds <= 0) {
          oven.status = 'ready';
        }
      }
    });

    if (stateChanged) {
      renderOvens();
    }
  }, 1000);

  function renderAll() {
    renderOvens();
    renderKDSOrders();
    renderStagingBatches();
    updateKPIs();
  }

  function updateKPIs() {
    const activeCount = ovens.filter(o => o.status === 'baking' || o.status === 'ready').length;
    const pendingCount = kdsOrders.filter(o => o.status !== 'ready').length;

    if (activeOvensKpi) activeOvensKpi.textContent = `${activeCount} / ${ovens.length}`;
    if (pendingOrdersKpi) pendingOrdersKpi.textContent = `${pendingCount} órdenes`;
    if (bakedTodayKpi) bakedTodayKpi.textContent = `${bakedTodayCount} ud`;
  }

  // 4. Renderizado de Hornos Industriales
  function renderOvens() {
    ovensContainer.innerHTML = '';

    ovens.forEach(oven => {
      const card = document.createElement('div');
      const isReady = oven.status === 'ready';
      card.className = `oven-card ${isReady ? 'ready-alert' : ''}`;

      let statusBadgeClass = 'baking';
      let statusText = 'En Horneado';
      if (oven.status === 'ready') { statusBadgeClass = 'ready'; statusText = '¡HORNEADO LISTO! 🔔'; }
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
          <span>${oven.batch.icon}</span>
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
            <button type="button" class="btn-oven-action btn-ready">✓ Retirar e Enfriar Lote</button>
          ` : oven.status === 'baking' ? `
            <button type="button" class="btn-oven-action" style="background: var(--bg-main); color: var(--color-espresso); border: 1px solid var(--color-subtle);">👁️ Ver Detalles de Horneado</button>
          ` : `
            <button type="button" class="btn-oven-action">+ Cargar Nuevo Lote</button>
          `}
        </div>
      `;

      // Event listeners para botones de hornos
      const actionBtn = card.querySelector('.btn-oven-action');
      actionBtn?.addEventListener('click', () => {
        if (isReady) {
          // Retirar Lote listo
          bakedTodayCount += oven.batch ? oven.batch.units : 20;
          oven.status = 'idle';
          oven.batch = null;
          renderAll();
        } else if (oven.status === 'idle' || oven.status === 'preheating') {
          openLoadOvenModal(null, oven.id);
        }
      });

      ovensContainer.appendChild(card);
    });
  }

  // 5. Renderizado de Comandas KDS
  function renderKDSOrders() {
    kdsContainer.innerHTML = '';

    kdsOrders.forEach(order => {
      const card = document.createElement('div');
      card.className = `kds-order-card status-${order.status}`;

      let itemsHtml = '';
      order.items.forEach(it => {
        itemsHtml += `
          <li class="kds-item-row">
            <span class="kds-item-qty">${it.qty}x</span>
            <span>${it.icon} ${it.name}</span>
          </li>
        `;
      });

      let statusBadgeText = 'Pendiente';
      let actionBtnText = '▶ Iniciar Preparación';
      if (order.status === 'in_progress') {
        statusBadgeText = 'En Preparación';
        actionBtnText = '✓ Marcar Listo';
      } else if (order.status === 'ready') {
        statusBadgeText = '¡Listo para Entregar!';
        actionBtnText = '📦 Archivar / Entregado';
      }

      card.innerHTML = `
        <div class="kds-header">
          <span class="kds-order-code">${order.code}</span>
          <span class="kds-time-elapsed">⏱️ hace ${order.timeElapsedMin} min</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--color-muted); font-weight: 600;">
          ${order.orderType} — ${order.customerName}
        </div>
        <ul class="kds-items-list">
          ${itemsHtml}
        </ul>
        <button type="button" class="btn-oven-action btn-kds-action">${actionBtnText}</button>
      `;

      card.querySelector('.btn-kds-action').addEventListener('click', () => {
        if (order.status === 'pending') {
          order.status = 'in_progress';
        } else if (order.status === 'in_progress') {
          order.status = 'ready';
        } else if (order.status === 'ready') {
          kdsOrders = kdsOrders.filter(o => o.id !== order.id);
        }
        renderAll();
      });

      kdsContainer.appendChild(card);
    });
  }

  // 6. Renderizado de Lotes Listos para Horno (Staging)
  function renderStagingBatches() {
    stagingContainer.innerHTML = '';

    stagingBatches.forEach(st => {
      const card = document.createElement('div');
      card.className = 'staging-card';

      card.innerHTML = `
        <div class="staging-title">
          <span style="font-size: 1.5rem;">${st.icon}</span>
          <div>
            <div>${st.productName}</div>
            <span style="font-size: 0.78rem; color: var(--color-muted); font-weight: bold;">${st.code} (${st.units} ud)</span>
          </div>
        </div>
        <span class="staging-status-badge">✔ ${st.prepStatus}</span>
        <button type="button" class="btn-load-oven">📥 Cargar a Horno Libre</button>
      `;

      card.querySelector('.btn-load-oven').addEventListener('click', () => {
        openLoadOvenModal(st.id);
      });

      stagingContainer.appendChild(card);
    });
  }

  // 7. Modal de Asignación de Horno
  function openLoadOvenModal(batchId = null, ovenId = null) {
    selectedStagingBatchId = batchId;
    
    // Rellenar selector de hornos
    ovenSelect.innerHTML = '';
    ovens.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      option.textContent = `${o.name} (${o.status === 'idle' || o.status === 'preheating' ? 'Disponible' : 'Ocupado'})`;
      if (ovenId && o.id === ovenId) option.selected = true;
      ovenSelect.appendChild(option);
    });

    if (batchId) {
      const batch = stagingBatches.find(b => b.id === batchId);
      if (batch) {
        modalBatchName.textContent = `${batch.icon} ${batch.productName} (${batch.units} ud)`;
        bakeTempInput.value = batch.recommendedTemp;
        bakeTimeInput.value = batch.recommendedTimeMin;
      }
    } else {
      modalBatchName.textContent = 'Selección de Lote de Producción';
    }

    loadOvenModal.classList.add('active');
  }

  closeLoadOvenModalBtn?.addEventListener('click', () => {
    loadOvenModal.classList.remove('active');
  });

  loadOvenForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetOvenId = ovenSelect.value;
    const temp = parseInt(bakeTempInput.value) || 200;
    const timeMin = parseInt(bakeTimeInput.value) || 15;

    const oven = ovens.find(o => o.id === targetOvenId);
    let batchInfo = {
      id: `batch_${Date.now()}`,
      productName: 'Lote Personalizado',
      icon: '🥐',
      units: 30,
      totalTimeSeconds: timeMin * 60,
      remainingSeconds: timeMin * 60
    };

    if (selectedStagingBatchId) {
      const stBatch = stagingBatches.find(b => b.id === selectedStagingBatchId);
      if (stBatch) {
        batchInfo.productName = stBatch.productName;
        batchInfo.icon = stBatch.icon;
        batchInfo.units = stBatch.units;
        stagingBatches = stagingBatches.filter(b => b.id !== selectedStagingBatchId);
      }
    }

    if (oven) {
      oven.currentTemp = temp;
      oven.targetTemp = temp;
      oven.status = 'baking';
      oven.batch = batchInfo;
    }

    loadOvenModal.classList.remove('active');
    renderAll();
  });
});
