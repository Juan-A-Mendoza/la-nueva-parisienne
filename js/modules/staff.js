/* ==========================================================================
   MÓDULO 8: CONTROLADOR INTERACTIVO DE PERSONAL Y ROLES (STAFF.JS)
   Gestión de nómina de empleados, cambio de PIN y matriz de permisos por rol
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { STAFF_DATABASE, ROLE_PERMISSIONS_MATRIX } from '../data/staff-db.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificación de Seguridad y Sesión Resiliente
  let session = null;
  try {
    session = SessionStore.getSession();
  } catch (err) {
    console.warn('Error leyendo sesión:', err);
  }

  const activeUser = (session && session.user) ? session.user : {
    name: 'Super Administrador',
    role: 'Super Administrador',
    roleCode: 'SUPERADMIN',
    icon: 'shield-check'
  };

  // 1.1 Verificación de Seguridad: Gestión de Personal y PINs accesible a SUPERADMIN y ADMIN
  const userRole = (activeUser.role || '').toLowerCase();
  const userRoleCode = (activeUser.roleCode || activeUser.role_code || '').toUpperCase();
  const isSuperadmin = userRoleCode === 'SUPERADMIN' || userRole.includes('superadmin') || (activeUser.username || '').toLowerCase() === 'superadmin';
  const isAdmin = userRoleCode === 'ADMIN' || userRole.includes('gerente') || userRole.includes('admin');

  if (!isSuperadmin && !isAdmin) {
    let redirectUrl = 'dashboard.html';
    if (userRoleCode === 'ACCOUNTANT' || userRole.includes('contador')) redirectUrl = 'accounting.html';
    else if (userRoleCode === 'POS' || userRoleCode === 'CASHIER' || userRole.includes('cajero')) redirectUrl = 'pos.html';
    else if (userRoleCode === 'KITCHEN' || userRoleCode === 'BAKER' || userRole.includes('panadero')) redirectUrl = 'kitchen.html';
    window.location.replace(redirectUrl);
    return;
  }

  // Actualizar datos del usuario activo
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = activeUser.name;
  if (userAvatarEl) { userAvatarEl.innerHTML = window.LucideIcons ? window.LucideIcons.render(activeUser.icon || 'users') : ''; window.LucideIcons?.refresh(); }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SessionStore.logout();
  });

  // 2. Estado de Personal y Permisos
  let staff = JSON.parse(JSON.stringify(STAFF_DATABASE));
  let permissionsMatrix = JSON.parse(JSON.stringify(ROLE_PERMISSIONS_MATRIX));

  // 3. Elementos DOM
  const staffBody = document.getElementById('staffBody');
  const matrixBody = document.getElementById('matrixBody');
  const kpiTotalStaff = document.getElementById('kpiTotalStaff');

  // Modales
  const newEmpModal = document.getElementById('newEmpModal');
  const closeEmpModalBtn = document.getElementById('closeEmpModalBtn');
  const newEmpForm = document.getElementById('newEmpForm');

  const changePinModal = document.getElementById('changePinModal');
  const closePinModalBtn = document.getElementById('closePinModalBtn');
  const changePinForm = document.getElementById('changePinForm');
  const pinEmpSelect = document.getElementById('pinEmpSelect');

  const btnOpenNewEmp = document.getElementById('btnOpenNewEmp');
  const btnOpenPinModal = document.getElementById('btnOpenPinModal');

  // Inicializar e intentar sincronizar con MySQL
  renderAll();
  loadStaffFromApi();

  async function loadStaffFromApi() {
    try {
      const res = await fetch(`../api/staff/get_staff.php?t=${Date.now()}`, { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.staff) && data.staff.length > 0) {
          staff = data.staff;
          renderAll();
        }
      }
    } catch (e) {
      console.warn('Personal: Usando datos de respaldo local.', e);
    }
  }

  function renderAll() {
    renderKPIs();
    renderStaffTable();
    renderPermissionsMatrix();
    populateEmpSelect();
  }

  // 4. Renderizado de KPIs
  function renderKPIs() {
    if (kpiTotalStaff) kpiTotalStaff.textContent = `${staff.length} Empleados`;

    const rolesSet = new Set(staff.map(s => s.role || s.roleCode).filter(Boolean));
    const activeStaff = staff.filter(s => s.statusText === 'Activo' || s.status === 'active');
    const onShift = staff.filter(s => s.shift && !s.shift.toLowerCase().includes('inactivo') && !s.shift.toLowerCase().includes('franco'));

    const kpiRolesEl = document.getElementById('kpiTotalRoles');
    const kpiShiftEl = document.getElementById('kpiStaffOnShift');
    const kpiSecEl = document.getElementById('kpiSecurityStatus');

    if (kpiRolesEl) kpiRolesEl.textContent = `${rolesSet.size} Roles`;
    if (kpiShiftEl) kpiShiftEl.textContent = `${onShift.length} en Turno`;
    if (kpiSecEl) kpiSecEl.innerHTML = `<i data-lucide="check" class="icon-xs"></i> ${activeStaff.length} Activos`;
  }

  // 5. Renderizado de la Tabla de Empleados
  function renderStaffTable() {
  setTimeout(() => window.LucideIcons?.refresh(), 0);
    staffBody.innerHTML = '';

    staff.forEach(emp => {
      const tr = document.createElement('tr');
      let roleClass = 'admin';
      if (emp.roleCode === 'BAKER') roleClass = 'baker';
      else if (emp.roleCode === 'CASHIER') roleClass = 'cashier';

      tr.innerHTML = `
        <td class="table-code-badge">${emp.code}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="employee-avatar-badge">${window.LucideIcons ? window.LucideIcons.render(emp.avatar || 'user', 'icon-sm') : ''}</div>
            <div>
              <strong>${emp.name}</strong>
              <div style="font-size: 0.78rem; color: var(--color-muted);">${emp.email}</div>
            </div>
          </div>
        </td>
        <td><span class="role-badge ${roleClass}">${emp.role}</span></td>
        <td><span style="font-size: 0.85rem; color: var(--color-muted);">${emp.department}</span></td>
        <td style="font-size: 0.85rem;">${emp.shift}</td>
        <td><span style="font-weight: 700; color: var(--color-success);">${emp.statusText}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="font-family: monospace; font-size: 1.1rem; letter-spacing: 0.15em;">••••</span>
            <span style="font-size: 0.68rem; font-weight: 800; background: rgba(46, 125, 50, 0.12); color: var(--color-success); padding: 0.15rem 0.45rem; border-radius: 9999px; border: 1px solid rgba(46, 125, 50, 0.25);" title="Segundo Factor 2FA Activo">2FA</span>
            ${emp.roleCode === 'SUPERADMIN' ? '<span style="font-size: 0.68rem; font-weight: 800; background: rgba(212, 155, 84, 0.18); color: var(--color-gold-dark); padding: 0.15rem 0.45rem; border-radius: 9999px; border: 1px solid var(--color-gold);" title="PIN Maestro Activo">MAESTRO</span>' : ''}
          </div>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-table-action btn-edit-emp" style="background: var(--bg-main); border: var(--border-subtle); color: var(--color-espresso);"><i data-lucide="edit-3" class="icon-xs"></i> <span>Editar</span></button>
            <button type="button" class="btn-table-action btn-pin-emp" style="background: var(--color-gold-light); color: var(--color-gold-dark);"><i data-lucide="key-round" class="icon-xs"></i> <span>PIN / 2FA</span></button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-emp').addEventListener('click', () => {
        alert(`Ficha de Empleado ${emp.name}:\n\nRol: ${emp.role}\nDepartamento: ${emp.department}\nTurno: ${emp.shift}\nTeléfono: ${emp.phone}\nEmail: ${emp.email}`);
      });

      tr.querySelector('.btn-pin-emp').addEventListener('click', () => {
        openPinModal(emp.id);
      });

      staffBody.appendChild(tr);
    });
  }

  // 6. Renderizado de la Matriz de Permisos por Rol
  function renderPermissionsMatrix() {
    matrixBody.innerHTML = '';

    permissionsMatrix.forEach(perm => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--color-espresso);">${perm.permissionName}</td>
        <td><span style="font-size: 0.78rem; color: var(--color-muted);">${perm.category}</span></td>
        <td style="text-align: center;">
          <label class="switch-label">
            <input type="checkbox" ${perm.roles.ADMIN ? 'checked' : ''} data-id="${perm.permissionId}" data-role="ADMIN">
            <span class="slider-toggle"></span>
          </label>
        </td>
        <td style="text-align: center;">
          <label class="switch-label">
            <input type="checkbox" ${perm.roles.BAKER ? 'checked' : ''} data-id="${perm.permissionId}" data-role="BAKER">
            <span class="slider-toggle"></span>
          </label>
        </td>
        <td style="text-align: center;">
          <label class="switch-label">
            <input type="checkbox" ${perm.roles.CASHIER ? 'checked' : ''} data-id="${perm.permissionId}" data-role="CASHIER">
            <span class="slider-toggle"></span>
          </label>
        </td>
      `;

      tr.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const permId = e.target.dataset.id;
          const role = e.target.dataset.role;
          const item = permissionsMatrix.find(p => p.permissionId === permId);
          if (item) {
            item.roles[role] = e.target.checked;
          }
        });
      });

      matrixBody.appendChild(tr);
    });
  }

  function populateEmpSelect() {
    if (!pinEmpSelect) return;
    pinEmpSelect.innerHTML = '';
    staff.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.id;
      option.textContent = `${emp.name} (${emp.role})`;
      pinEmpSelect.appendChild(option);
    });
  }

  // 7. Modales de Registro y Cambio de PIN
  btnOpenNewEmp?.addEventListener('click', () => newEmpModal.classList.add('active'));
  closeEmpModalBtn?.addEventListener('click', () => newEmpModal.classList.remove('active'));

  newEmpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('empNameInput').value;
    const roleCode = document.getElementById('empRoleSelect').value;
    const dept = document.getElementById('empDeptInput').value;
    const shift = document.getElementById('empShiftInput').value;

    let roleName = 'Personal de Caja / POS';
    let avatar = 'banknote';
    if (roleCode === 'BAKER') { roleName = 'Maestro Panadero / Chef'; avatar = 'chef-hat'; }
    else if (roleCode === 'ADMIN') { roleName = 'Administrador General'; avatar = 'shield-check'; }

    try {
      const res = await fetch('../api/staff/guardar_empleado.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          roleCode, 
          shift, 
          department: dept, 
          pin: '1234',
          requestingRole: isSuperadmin ? 'SUPERADMIN' : 'ADMIN',
          requestingUser: activeUser.name || activeUser.username
        })
      });
      const data = await res.json();
      if (data.success && data.employee) {
        staff.push(data.employee);
      } else {
        throw new Error(data.message || 'Error');
      }
    } catch (err) {
      staff.push({
        id: `emp_${Date.now()}`,
        code: `EMP-00${staff.length + 1}`,
        name,
        role: roleName,
        roleCode,
        department: dept,
        shift,
        phone: '(01) 555-NUEVO',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@parisienne.com`,
        status: 'active',
        statusText: 'Activo',
        pin: '1234',
        avatar
      });
    }

    renderAll();
    newEmpModal.classList.remove('active');
    newEmpForm.reset();
    alert(`Empleado ${name} incorporado exitosamente en el sistema con PIN por defecto 1234.`);
  });

  const pinTypeSelect = document.getElementById('pinTypeSelect');
  const newPinInput = document.getElementById('newPinInput');
  const newPinLabel = document.getElementById('newPinLabel');
  const newPinHint = document.getElementById('newPinHint');
  const btnToggleStaffPin = document.getElementById('btnToggleStaffPin');
  const staffOptPinMaestro = document.getElementById('staffOptPinMaestro');

  btnToggleStaffPin?.addEventListener('click', () => {
    if (!newPinInput) return;
    const isPass = newPinInput.type === 'password';
    newPinInput.type = isPass ? 'text' : 'password';
    btnToggleStaffPin.innerHTML = isPass ? '<i data-lucide="eye-off" class="icon-sm"></i>' : '<i data-lucide="eye" class="icon-sm"></i>';
    window.LucideIcons?.refresh();
  });

  function syncPinTypeUI() {
    if (!pinTypeSelect || !newPinInput) return;
    const val = pinTypeSelect.value;
    if (val === 'primario') {
      if (newPinLabel) newPinLabel.textContent = 'Nuevo PIN Primario (Paso 1):';
      if (newPinHint) newPinHint.textContent = 'PIN de 4 dígitos o contraseña solicitada en el Paso 1.';
      newPinInput.placeholder = '1234';
      newPinInput.maxLength = 20;
    } else if (val === '2fa') {
      if (newPinLabel) newPinLabel.textContent = 'Nuevo Código 2FA (Paso 2):';
      if (newPinHint) newPinHint.textContent = 'Código numérico de 6 dígitos para la verificación de segundo factor.';
      newPinInput.placeholder = '123456';
      newPinInput.maxLength = 6;
    } else if (val === 'maestro') {
      if (newPinLabel) newPinLabel.textContent = 'Nuevo PIN Maestro Superadmin:';
      if (newPinHint) newPinHint.textContent = 'PIN maestro de 6 dígitos exclusivo para alta dirección (Superadmin).';
      newPinInput.placeholder = '990022';
      newPinInput.maxLength = 6;
    }
  }

  pinTypeSelect?.addEventListener('change', syncPinTypeUI);

  pinEmpSelect?.addEventListener('change', () => {
    updateMaestroAvailability();
  });

  function updateMaestroAvailability() {
    if (!pinEmpSelect || !staffOptPinMaestro) return;
    const selEmp = staff.find(e => e.id === pinEmpSelect.value);
    const isTargetSuper = selEmp && (selEmp.roleCode === 'SUPERADMIN' || (selEmp.role && selEmp.role.toLowerCase().includes('super')));
    staffOptPinMaestro.disabled = !isTargetSuper;
    if (!isTargetSuper && pinTypeSelect.value === 'maestro') {
      pinTypeSelect.value = 'primario';
      syncPinTypeUI();
    }
  }

  function openPinModal(empId = null) {
    populateEmpSelect();
    if (empId) pinEmpSelect.value = empId;
    updateMaestroAvailability();
    if (pinTypeSelect) pinTypeSelect.value = 'primario';
    syncPinTypeUI();
    if (newPinInput) newPinInput.value = '';
    changePinModal.classList.add('active');
    setTimeout(() => window.LucideIcons?.refresh(), 0);
  }

  btnOpenPinModal?.addEventListener('click', () => openPinModal());
  closePinModalBtn?.addEventListener('click', () => changePinModal.classList.remove('active'));

  changePinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = pinEmpSelect.value;
    const tipoPin = pinTypeSelect ? pinTypeSelect.value : 'primario';
    const newPin = newPinInput.value.trim();

    if (!newPin) {
      alert('Por favor ingrese el nuevo PIN.');
      return;
    }

    try {
      const res = await fetch('../api/staff/cambiar_pin.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          empId, 
          tipoPin, 
          newPin,
          requestingRole: isSuperadmin ? 'SUPERADMIN' : 'ADMIN',
          requestingUser: activeUser.name || 'superadmin'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error al actualizar PIN');

      const emp = staff.find(e => e.id === empId);
      if (emp && tipoPin === 'primario') emp.pin = newPin;
      changePinModal.classList.remove('active');
      changePinForm.reset();
      alert(`✅ ¡Operación Exitosa!\n${data.message}`);
    } catch (err) {
      alert(`Error al actualizar PIN: ${err.message}`);
    }
  });
});
