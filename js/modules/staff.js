/* ==========================================================================
   MÓDULO 8: CONTROLADOR INTERACTIVO DE PERSONAL Y ROLES (STAFF.JS)
   Gestión de nómina de empleados, cambio de PIN y matriz de permisos por rol
   ========================================================================== */

import { SessionStore } from '../core/session-store.js';
import { STAFF_DATABASE, ROLE_PERMISSIONS_MATRIX } from '../data/staff-db.js';

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

  // Inicializar
  renderAll();

  function renderAll() {
    renderKPIs();
    renderStaffTable();
    renderPermissionsMatrix();
    populateEmpSelect();
  }

  // 4. Renderizado de KPIs
  function renderKPIs() {
    if (kpiTotalStaff) kpiTotalStaff.textContent = `${staff.length} Empleados`;
  }

  // 5. Renderizado de la Tabla de Empleados
  function renderStaffTable() {
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
            <div class="employee-avatar-badge">${emp.avatar}</div>
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
        <td><span style="font-family: monospace; font-size: 1.1rem; letter-spacing: 0.15em;">••••</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-table-action btn-edit-emp" style="background: var(--bg-main); border: var(--border-subtle); color: var(--color-espresso);">✏️ Editar</button>
            <button type="button" class="btn-table-action btn-pin-emp" style="background: var(--color-gold-light); color: var(--color-gold-dark);">🔑 PIN</button>
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

  newEmpForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('empNameInput').value;
    const roleCode = document.getElementById('empRoleSelect').value;
    const dept = document.getElementById('empDeptInput').value;
    const shift = document.getElementById('empShiftInput').value;

    let roleName = 'Personal de Caja / POS';
    let avatar = '👩‍💼';
    if (roleCode === 'BAKER') { roleName = 'Maestro Panadero / Chef'; avatar = '👨‍🍳'; }
    else if (roleCode === 'ADMIN') { roleName = 'Administrador General'; avatar = '👨‍💼'; }

    const newEmp = {
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
      statusText: '✓ Activo',
      pin: '1234',
      avatar
    };

    staff.push(newEmp);
    renderAll();
    newEmpModal.classList.remove('active');
    alert(`Empleado ${name} incorporado exitosamente con PIN por defecto 1234.`);
  });

  function openPinModal(empId = null) {
    populateEmpSelect();
    if (empId) pinEmpSelect.value = empId;
    changePinModal.classList.add('active');
  }

  btnOpenPinModal?.addEventListener('click', () => openPinModal());
  closePinModalBtn?.addEventListener('click', () => changePinModal.classList.remove('active'));

  changePinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = pinEmpSelect.value;
    const newPin = document.getElementById('newPinInput').value;

    const emp = staff.find(e => e.id === empId);
    if (emp) {
      emp.pin = newPin;
      changePinModal.classList.remove('active');
      alert(`PIN de acceso para ${emp.name} actualizado correctamente.`);
    }
  });
});
