/* ==========================================================================
   MÓDULO 2: CONTROLADOR INTERACTIVO DE PRODUCCIÓN Y COCINA (KITCHEN.JS)
   Gestión en tiempo real de hornos, temporizadores, comandas KDS y lotes
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { OVENS_INITIAL_STATE, KDS_ORDERS_INITIAL_STATE, STAGING_BATCHES_INITIAL_STATE } from '../data/kitchen-db.js';
import { BAKERY_RECIPES } from '../data/recipes-db.js';
import { INVENTORY_DATABASE } from '../data/inventory-db.js';

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
  let kdsOrders = JSON.parse(JSON.stringify(KDS_ORDERS_INITIAL_STATE));
  let stagingBatches = [];
  
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

  // 4. FUNCIÓN INICIAL DE CARGA DESDE LA BASE DE DATOS REAL (API_HORNOS.PHP)
  async function fetchKitchenState() {
    try {
      let response = await fetch('../api_hornos.php');
      if (!response.ok) {
        response = await fetch('api_hornos.php');
      }
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.hornos)) {
        // Mapear los campos de la tabla MySQL `hornos` a la estructura de las tarjetas
        ovens = data.hornos.map(h => {
          let batchObj = null;
          if (h.lote_actual || h.batch) {
            batchObj = h.batch || {
              id: `batch_${h.id}`,
              productName: h.lote_actual || 'Lote Activo',
              icon: (h.lote_actual && h.lote_actual.includes('Croissant')) ? 'croissant' : ((h.lote_actual && h.lote_actual.includes('Focaccia')) ? 'wheat' : 'croissant'),
              units: 50,
              totalTimeSeconds: parseInt(h.tiempo_restante || 0) > 0 ? (parseInt(h.tiempo_restante || 0) + 300) : 1200,
              remainingSeconds: parseInt(h.tiempo_restante || 0)
            };
          }

          return {
            id: h.id,
            name: h.nombre_horno || h.name || 'Horno Industrial',
            type: h.type || 'Industrial',
            currentTemp: parseInt(h.temperatura_actual || h.currentTemp || 180),
            targetTemp: parseInt(h.temperatura_objetivo || h.targetTemp || 200),
            status: h.estado || h.status || 'idle',
            batch: batchObj
          };
        });
      } else {
        ovens = JSON.parse(JSON.stringify(OVENS_INITIAL_STATE));
      }
    } catch (err) {
      console.warn('API api_hornos.php no disponible, aplicando estado por defecto:', err);
      ovens = JSON.parse(JSON.stringify(OVENS_INITIAL_STATE));
    }

    if (!stagingBatches || stagingBatches.length === 0) {
      stagingBatches = JSON.parse(JSON.stringify(STAGING_BATCHES_INITIAL_STATE));
    }

    renderAll();
  }

  // Inicializar renderizado dinámico desde la BD
  fetchKitchenState();

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
            <button type="button" class="btn-oven-action btn-ready"><i data-lucide="check" class="icon-xs"></i> <span>Retirar y Enfriar Lote</span></button>
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
          // Retirar Lote listo
          bakedTodayCount += oven.batch ? oven.batch.units : 20;
          oven.status = 'idle';
          oven.batch = null;
          renderAll();
        } else if (oven.status === 'baking') {
          // ABRIR MODAL DE DETALLES DE HORNEADO
          openOvenDetailModal(oven.id);
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
        const itemIconHtml = window.LucideIcons ? window.LucideIcons.render(it.icon || 'utensils', 'icon-xs') : '';
        itemsHtml += `
          <li class="kds-item-row">
            <span class="kds-item-qty">${it.qty}x</span>
            <span style="display:inline-flex; align-items:center; gap:0.35rem;">${itemIconHtml} ${it.name}</span>
          </li>
        `;
      });

      let statusBadgeText = 'Pendiente';
      let actionBtnText = '<i data-lucide="play" class="icon-xs"></i> <span>Iniciar Preparación</span>';
      if (order.status === 'in_progress') {
        statusBadgeText = 'En Preparación';
        actionBtnText = '<i data-lucide="check" class="icon-xs"></i> <span>Marcar Listo</span>';
      } else if (order.status === 'ready') {
        statusBadgeText = '¡Listo para Entregar!';
        actionBtnText = '<i data-lucide="archive" class="icon-xs"></i> <span>Archivar / Entregado</span>';
      }

      const clockIcon = window.LucideIcons ? window.LucideIcons.render('clock', 'icon-xs') : '';
      card.innerHTML = `
        <div class="kds-header">
          <span class="kds-order-code">${order.code}</span>
          <span class="kds-time-elapsed" style="display:inline-flex; align-items:center; gap:0.25rem;">${clockIcon} hace ${order.timeElapsedMin} min</span>
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
  setTimeout(() => window.LucideIcons?.refresh(), 0);
    stagingContainer.innerHTML = '';

    stagingBatches.forEach(st => {
      const card = document.createElement('div');
      card.className = 'staging-card';

      card.innerHTML = `
        <div class="staging-title">
          <span style="display:inline-flex;align-items:center;">${window.LucideIcons ? window.LucideIcons.render(st.icon || 'croissant', 'icon-lg') : ''}</span>
          <div>
            <div>${st.productName}</div>
            <span style="font-size: 0.78rem; color: var(--color-muted); font-weight: bold;">${st.code} (${st.units} ud)</span>
          </div>
        </div>
        <span class="staging-status-badge badge-clean-icon"><i data-lucide="check" class="icon-xs"></i> ${st.prepStatus}</span>
        <button type="button" class="btn-load-oven"><i data-lucide="arrow-up-right" class="icon-xs"></i> <span>Cargar a Horno Libre</span></button>
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
    
    // Ocultar banner de error previo
    const ovenErrorBanner = document.getElementById('ovenErrorBanner');
    if (ovenErrorBanner) {
      ovenErrorBanner.style.display = 'none';
      ovenErrorBanner.innerHTML = '';
    }

    // Rellenar selector de hornos con estado de disponibilidad
    ovenSelect.innerHTML = '';
    ovens.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      const isAvailable = o.status === 'idle' || o.status === 'preheating';
      option.textContent = `${o.name} (${isAvailable ? 'Disponible' : 'Ocupado - En uso'})`;
      if (ovenId && o.id === ovenId) option.selected = true;
      ovenSelect.appendChild(option);
    });

    if (batchId) {
      const batch = stagingBatches.find(b => b.id === batchId);
      if (batch) {
        modalBatchName.textContent = `${batch.productName} (${batch.units} ud)`;
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

  loadOvenModal?.addEventListener('click', (e) => {
    if (e.target === loadOvenModal) {
      loadOvenModal.classList.remove('active');
    }
  });

  loadOvenForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetOvenId = ovenSelect.value;
    const oven = ovens.find(o => o.id === targetOvenId);

    // VALIDACIÓN DE HORNO OCUPADO (LÓGICA CRÍTICA OBLIGATORIA)
    if (!oven || oven.status === 'baking' || oven.status === 'ready') {
      const ovenErrorBanner = document.getElementById('ovenErrorBanner');
      if (ovenErrorBanner) {
        ovenErrorBanner.innerHTML = `<span class="badge-clean-icon"><i data-lucide="alert-triangle" class="icon-sm"></i> <strong>Error de Operación:</strong> El ${oven ? oven.name : "horno seleccionado"} ya está ocupado en un ciclo activo. Seleccione un horno libre.</span>`;
        ovenErrorBanner.style.display = 'block';
      }
      return false; // Interrumpir ejecución inmediatamente
    }

    const temp = parseInt(bakeTempInput.value) || 200;
    const timeMin = parseInt(bakeTimeInput.value) || 15;

    let batchInfo = {
      id: `batch_${Date.now()}`,
      productName: 'Lote Personalizado',
      icon: 'croissant',
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

    oven.currentTemp = temp;
    oven.targetTemp = temp;
    oven.status = 'baking';
    oven.batch = batchInfo;

    loadOvenModal.classList.remove('active');
    renderAll();
  });

  // 8. Modal de Detalles de Horneado Activo
  const ovenDetailModal = document.getElementById('ovenDetailModal');
  const closeOvenDetailModalBtn = document.getElementById('closeOvenDetailModalBtn');
  const closeOvenDetailModalFooterBtn = document.getElementById('closeOvenDetailModalFooterBtn');

  function openOvenDetailModal(ovenId) {
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
      const btnPrintRecipeSheet = document.getElementById('btnPrintRecipeSheet');
      const btnSolicitarInsumosFaltantesWrapper = document.getElementById('btnSolicitarInsumosFaltantesWrapper');
      const btnSolicitarInsumosFaltantes = document.getElementById('btnSolicitarInsumosFaltantes');
      const btnSolicitarInsumosFaltantesText = document.getElementById('btnSolicitarInsumosFaltantesText');
      const recetarioPrintContainer = document.getElementById('recetarioPrintContainer');
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

        BAKERY_RECIPES.forEach(recipe => {
          const card = document.createElement('div');
          card.className = `bread-grid-card ${recipe.id === currentRecipeId ? 'active' : ''}`;
          card.dataset.recipeId = recipe.id;

          card.innerHTML = `
            <div class="bread-grid-icon-box">${recipe.icon}</div>
            <div class="bread-grid-name">${recipe.name}</div>
            <div class="bread-grid-meta">
              <span>${recipe.bakingProfile.temp}°C</span>
              <span>&bull;</span>
              <span>${recipe.bakingProfile.timeMin}m</span>
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
        const recipe = BAKERY_RECIPES.find(r => r.id === currentRecipeId) || BAKERY_RECIPES[0];
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

      // Acción: Enviar Lote al Staging de Cocina
      btnSendBatchToKitchen?.addEventListener('click', () => {
        const recipe = BAKERY_RECIPES.find(r => r.id === currentRecipeId) || BAKERY_RECIPES[0];
        const nextBatchNum = stagingBatches.length + 48;
        const newBatch = {
          id: `stage_${Date.now()}`,
          code: `Lote #${String(nextBatchNum).padStart(3, '0')}`,
          productName: `${currentRecipeQty}x ${recipe.name}`,
          icon: recipe.lucideIcon || 'croissant',
          units: currentRecipeQty,
          prepStatus: 'Leudado Completo (Listo para Horno)',
          recommendedTemp: recipe.bakingProfile.temp,
          recommendedTimeMin: recipe.bakingProfile.timeMin
        };

        stagingBatches.unshift(newBatch);
        renderStagingBatches();
        closeRecetarioModal();

        // Notificación de éxito
        const modal = document.getElementById('modalExitoNotificacion');
        const titleEl = document.getElementById('modalExitoTitle');
        const msgEl = document.getElementById('modalExitoMsg');

        if (titleEl) titleEl.textContent = '¡Lote Programado en Cocina!';
        if (msgEl) {
          msgEl.innerHTML = `Se ha creado con éxito el <strong>${newBatch.code}</strong> para <strong>${currentRecipeQty} unidades</strong> de <strong>"${recipe.name}"</strong>.<br/><br/>Ya está disponible en la columna de <strong>Lotes Listos para Horneado</strong> listo para cargarse en cualquier horno industrial libre.`;
        }
        if (modal) {
          modal.style.display = 'flex';
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
        }
      });

      // Acción: Imprimir Ficha Técnica de Cocina
      btnPrintRecipeSheet?.addEventListener('click', () => {
        const recipe = BAKERY_RECIPES.find(r => r.id === currentRecipeId) || BAKERY_RECIPES[0];
        const totalDoughKg = (currentRecipeQty * recipe.unitWeightGrams / 1000);
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

        if (!recetarioPrintContainer) return;

        let ingHtml = '';
        recipe.ingredients.forEach(ing => {
          const needed = ing.qty * currentRecipeQty;
          const neededStr = ing.unit === 'kg' 
            ? (needed < 1 ? `${(needed*1000).toFixed(0)} g (${needed.toFixed(3)} kg)` : `${needed.toFixed(2)} kg`)
            : (ing.unit === 'L' ? (needed < 1 ? `${(needed*1000).toFixed(0)} ml` : `${needed.toFixed(2)} L`) : `${Math.ceil(needed)} ud`);
          ingHtml += `
            <tr>
              <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;"><strong>${ing.name}</strong> ${ing.matCode ? `(${ing.matCode})` : ''}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 700;">${neededStr}</td>
            </tr>
          `;
        });

        let stepsHtml = '';
        recipe.steps.forEach((st, idx) => {
          stepsHtml += `
            <li style="margin-bottom: 8px; font-size: 0.9rem; line-height: 1.4;">
              <strong>${idx + 1}. ${st.title}:</strong> ${st.desc}
            </li>
          `;
        });

        recetarioPrintContainer.innerHTML = `
          <div style="font-family: Arial, sans-serif; color: #2C1D11; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #2C1D11; padding-bottom: 12px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 1.4rem; margin: 0; text-transform: uppercase;">La Nueva Parisienne Panadería &amp; Pastelería C.A.</h1>
                <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: #666;">FICHA TÉCNICA DE PRODUCCIÓN Y HORNEADO DE PANADERÍA &bull; RIF: J-40123456-7</p>
              </div>
              <div style="text-align: right; font-size: 0.85rem;">
                <div><strong>Fecha:</strong> ${dateStr}, ${timeStr}</div>
                <div><strong>Maestro Panadero:</strong> ${activeChef.name}</div>
              </div>
            </div>

            <div style="background: #FAF7F2; border: 1px solid #E5D5C5; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.8rem; text-transform: uppercase; color: #C48B44; font-weight: bold;">FÓRMULA ARTESANAL:</span>
                <h2 style="margin: 2px 0 0 0; font-size: 1.3rem;">${recipe.icon} ${recipe.name} (${recipe.code})</h2>
                <span style="font-size: 0.85rem; color: #666;">Categoría: ${recipe.category} &bull; Peso unitario cocido: ~${recipe.unitWeightGrams} g</span>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: 800; color: #2C1D11;">${currentRecipeQty} Unidades</div>
                <div style="font-size: 0.85rem; font-weight: bold; color: #C48B44;">Masa Total Requerida: ${totalDoughKg.toFixed(2)} kg</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px;">
              <div>
                <h3 style="font-size: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 0;">1. INSUMOS Y MATERIAS PRIMAS REQUERIDAS</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                  <thead>
                    <tr style="background: #f0f0f0;">
                      <th style="padding: 6px 10px; text-align: left;">Ingrediente</th>
                      <th style="padding: 6px 10px; text-align: right;">Cantidad Neta</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ingHtml}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 style="font-size: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 0;">2. PARÁMETROS DE HORNEADO</h3>
                <div style="background: #f9f9f9; padding: 10px 14px; border-radius: 6px; font-size: 0.88rem; line-height: 1.6;">
                  <div><strong>🌡️ Temperatura:</strong> ${recipe.bakingProfile.temp} °C</div>
                  <div><strong>⏱️ Tiempo de Horno:</strong> ${recipe.bakingProfile.timeMin} minutos</div>
                  <div><strong>🔥 Horno Recomendado:</strong> ${recipe.bakingProfile.ovenType}</div>
                  <div><strong>💨 Inyección de Vapor:</strong> ${recipe.bakingProfile.steam}</div>
                  <div><strong>⏳ Leudado / Fermentación:</strong> ${recipe.bakingProfile.fermentationTime}</div>
                  <div><strong>🚪 Tiro de Salida:</strong> ${recipe.bakingProfile.damper}</div>
                </div>

                <div style="margin-top: 10px; padding: 8px 12px; background: #FFF8E7; border-left: 4px solid #C48B44; font-size: 0.82rem; font-style: italic;">
                  <strong>Secreto del Maestro:</strong> ${recipe.chefTip}
                </div>
              </div>
            </div>

            <h3 style="font-size: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">3. MÉTODO DE PREPARACIÓN Y HORNEADO</h3>
            <ol style="padding-left: 20px; margin-top: 0;">
              ${stepsHtml}
            </ol>

            <div style="margin-top: 30px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #ccc; font-size: 0.85rem;">
              <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #000; margin-bottom: 4px;"></div>
                <span>${activeChef.name}<br/><strong>Maestro Panadero</strong></span>
              </div>
              <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #000; margin-bottom: 4px;"></div>
                <span>Control de Calidad / Horno<br/><strong>Firma &amp; Sello</strong></span>
              </div>
            </div>
          </div>
        `;

        document.body.classList.add('printing-recipe');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-recipe');
        }, 1000);
      });

      renderBreadChips();
      calculateAndRenderRecipe();
    } catch (err) {
      console.error('Error inicializando Recetario en Cocina:', err);
    }
  }

  inicializarRecetarioCocina();
});
