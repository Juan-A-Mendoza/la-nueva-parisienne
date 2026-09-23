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
      icon: '\u{1F3E2}',
      roles: ['gerente general', 'admin'],
      subtitle: 'KPIs, auditor\u00eda y gesti\u00f3n de personal'
    },
    {
      id: 'caja',
      name: 'Caja y Facturaci\u00f3n',
      icon: '\u{1F4B0}',
      roles: ['cajero', 'pos', 'cashier'],
      subtitle: 'Punto de Venta POS y cobros'
    },
    {
      id: 'cocina',
      name: 'Producci\u00f3n y Cocina',
      icon: '\u{1F468}\u200D\u{1F373}',
      roles: ['panadero', 'kitchen', 'baker'],
      subtitle: 'Hornos, recetas y producci\u00f3n'
    },
    {
      id: 'contabilidad',
      name: 'Contabilidad & Finanzas',
      icon: '\u{1F4CA}',
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
    errorAlert.textContent = `\u274C ${message}`;
    errorAlert.style.display = 'block';
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
    if (buttonText) buttonText.textContent = 'Iniciar Sesi\u00f3n';
  }

  function showDepartmentLogin(departmentId) {
    const department = departments.find(item => item.id === departmentId);
    if (!department) return;

    currentDepartment = department;
    if (selectedDeptIcon) selectedDeptIcon.textContent = department.icon;
    if (selectedDeptTitle) selectedDeptTitle.textContent = `Inicio de sesi\u00f3n \u2014 ${department.name}`;
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

    const selectedProfile = allProfiles.find(profile =>
      normalize(profile.username) === normalize(username)
    );

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
      const result = await SessionStore.validateCredentialsAsync(username, password);
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
