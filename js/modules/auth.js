/*
 * Inicio de sesión por departamento.
 * Los usuarios y sus claves se leen desde SessionStore; este módulo no crea
 * cuentas ni muestra perfiles registrados.
 */

import { SessionStore } from '../core/session-store.js';

document.addEventListener('DOMContentLoaded', async () => {
  const departments = [
    {
      id: 'gerencia',
      name: 'Gerencia General',
      icon: 'shield-check',
      roles: ['gerente general', 'admin'],
      subtitle: 'KPIs, auditoría y gestión de personal'
    },
    {
      id: 'caja',
      name: 'Caja y Facturación',
      icon: 'banknote',
      roles: ['cajero', 'pos', 'cashier'],
      subtitle: 'Punto de Venta POS y cobros'
    },
    {
      id: 'cocina',
      name: 'Producción y Cocina',
      icon: 'chef-hat',
      roles: ['panadero', 'kitchen', 'baker'],
      subtitle: 'Hornos, recetas y producción'
    },
    {
      id: 'contabilidad',
      name: 'Contabilidad & Finanzas',
      icon: 'bar-chart-3',
      roles: ['contador', 'contabilidad', 'accountant'],
      subtitle: 'Estados financieros y comprobantes'
    }
  ];

  const deptView = document.getElementById('deptView');
  const loginModal = document.getElementById('departmentLoginModal');
  const closeLoginModalButton = document.getElementById('btnCloseDepartmentLogin');
  const selectedDeptIcon = document.getElementById('selectedDeptIcon');
  const selectedDeptTitle = document.getElementById('selectedDeptTitle');
  const selectedDeptSubtitle = document.getElementById('selectedDeptSubtitle');
  const loginForm = document.getElementById('departmentLoginForm');
  const usernameInput = document.getElementById('departmentUsernameInput');
  const passwordInput = document.getElementById('departmentPasswordInput');
  const loginButton = document.getElementById('departmentLoginButton');
  const errorAlert = document.getElementById('departmentErrorAlert');

  let allProfiles = [];
  let currentDepartment = null;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function roleMatchesDepartment(profile, department) {
    if (!profile || !department) return false;
    const role = normalize(profile.role);
    const roleCode = normalize(profile.roleCode);
    return department.roles.some(candidate =>
      role.includes(candidate) || roleCode.includes(candidate)
    );
  }

  function showError(message) {
    if (!errorAlert) return;
    errorAlert.innerHTML = `<i data-lucide="alert-circle" class="icon-sm" style="margin-right: 0.35rem;"></i> ${message}`;
    errorAlert.style.display = 'flex';
    errorAlert.style.alignItems = 'center';
    window.LucideIcons?.refresh();
  }

  function clearError() {
    if (!errorAlert) return;
    errorAlert.textContent = '';
    errorAlert.style.display = 'none';
  }

  function resetLoginForm() {
    loginForm?.reset();
    clearError();
    if (loginButton) loginButton.disabled = false;
    const buttonText = loginButton?.querySelector('span');
    if (buttonText) buttonText.textContent = 'Iniciar Sesión';
  }

  function showDepartmentLogin(departmentId) {
    const department = departments.find(item => item.id === departmentId);
    if (!department) return;

    currentDepartment = department;
    if (selectedDeptIcon) {
      selectedDeptIcon.innerHTML = window.LucideIcons ? window.LucideIcons.render(department.icon, 'icon-xl') : '';
      window.LucideIcons?.refresh();
    }
    if (selectedDeptTitle) selectedDeptTitle.textContent = `Inicio de sesión — ${department.name}`;
    if (selectedDeptSubtitle) selectedDeptSubtitle.textContent = `${department.subtitle}. Ingrese sus credenciales para continuar.`;

    resetLoginForm();
    loginModal?.classList.add('active');
    loginModal?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-modal-open');
    window.setTimeout(() => usernameInput?.focus(), 0);
  }

  function closeDepartmentLogin() {
    currentDepartment = null;
    resetLoginForm();
    loginModal?.classList.remove('active');
    loginModal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-modal-open');
    deptView?.focus();
  }

  document.querySelectorAll('.dept-card').forEach(card => {
    const selectDepartment = event => {
      event?.preventDefault();
      showDepartmentLogin(card.dataset.dept);
    };

    card.addEventListener('click', selectDepartment);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') selectDepartment(event);
    });
  });

  closeLoginModalButton?.addEventListener('click', closeDepartmentLogin);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && loginModal?.classList.contains('active')) {
      closeDepartmentLogin();
    }
  });

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();

    const username = usernameInput?.value.trim() || '';
    const password = passwordInput?.value || '';
    if (!username || !password || !currentDepartment) return;

    const normUser = normalize(username);

    // Buscar perfil coincidente por usuario, código, ID, nombre o email
    let selectedProfile = allProfiles.find(profile =>
      normalize(profile.username) === normUser ||
      normalize(profile.code) === normUser ||
      normalize(profile.id) === normUser ||
      normalize(profile.email) === normUser ||
      normalize(profile.name) === normUser
    );

    // Si ingresó una palabra clave genérica como 'admin', 'cajero', 'panadero', 'contador'
    if (!selectedProfile) {
      if (normUser === 'admin' || normUser === 'gerente') {
        selectedProfile = allProfiles.find(p => normalize(p.roleCode) === 'admin' || normalize(p.role).includes('gerente'));
      } else if (normUser === 'cajero' || normUser === 'cajera' || normUser === 'cajero1' || normUser === 'pos') {
        selectedProfile = allProfiles.find(p => normalize(p.roleCode) === 'cashier' || normalize(p.roleCode) === 'pos');
      } else if (normUser === 'panadero' || normUser === 'chef' || normUser === 'panadero1' || normUser === 'cocina') {
        selectedProfile = allProfiles.find(p => normalize(p.roleCode) === 'baker' || normalize(p.roleCode) === 'kitchen');
      } else if (normUser === 'contador' || normUser === 'contador1' || normUser === 'finanzas') {
        selectedProfile = allProfiles.find(p => normalize(p.roleCode) === 'accountant');
      }
    }

    if (!selectedProfile) {
      showError('Usuario no encontrado o no registrado.');
      return;
    }

    if (!roleMatchesDepartment(selectedProfile, currentDepartment)) {
      showError('El usuario no pertenece al departamento seleccionado.');
      return;
    }

    if (loginButton) loginButton.disabled = true;
    const buttonText = loginButton?.querySelector('span');
    if (buttonText) buttonText.textContent = 'Validando...';

    try {
      const loginIdentifier = selectedProfile.id || selectedProfile.username || username;
      const result = await SessionStore.validateCredentialsAsync(loginIdentifier, password);
      if (result.success) {
        window.location.href = result.redirectUrl;
      } else {
        showError(result.message || 'Nombre de usuario o clave incorrectos.');
      }
    } catch (error) {
      console.error('Error validando las credenciales:', error);
      showError('No fue posible validar las credenciales. Intente nuevamente.');
    } finally {
      if (loginButton) loginButton.disabled = false;
      if (buttonText) buttonText.textContent = 'Iniciar Sesi\u00f3n';
    }
  });

  try {
    allProfiles = await SessionStore.getProfilesAsync();
  } catch (error) {
    console.error('Error cargando usuarios registrados:', error);
    showError('No fue posible cargar los usuarios registrados.');
  }
});
