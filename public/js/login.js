document.addEventListener('DOMContentLoaded', () => {
  checkAlreadyLoggedIn();
  setupTabs();
  setupLoginForm();
  setupRegisterForm();
  setupDemoFill();

  // Check URL parameter to default to register tab if requested
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'register') {
    switchToRegisterTab();
  }
});

// Check if a user session already exists in localStorage
function checkAlreadyLoggedIn() {
  const user = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
  const loggedInBox = document.getElementById('already-logged-in-box');
  const userNameEl = document.getElementById('logged-in-user-name');
  const switchBtn = document.getElementById('btn-switch-account');

  if (user && loggedInBox && userNameEl) {
    userNameEl.textContent = `${user.name} (${user.email})`;
    loggedInBox.style.display = 'block';

    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        if (window.API) {
          API.logout();
        } else {
          localStorage.removeItem('savorspace_token');
          localStorage.removeItem('savorspace_user');
        }
        loggedInBox.style.display = 'none';
        if (typeof initNavigation === 'function') {
          initNavigation();
        }
        showToast('Logged out of previous session.', 'info');
      });
    }
  }
}

// Setup Tab Switching
function setupTabs() {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');

  loginTab.addEventListener('click', switchToLoginTab);
  registerTab.addEventListener('click', switchToRegisterTab);
}

function switchToLoginTab() {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const errorBox = document.getElementById('auth-error-box');

  loginTab.style.borderBottom = '2px solid var(--color-primary)';
  loginTab.style.color = 'var(--color-primary)';
  loginTab.style.fontWeight = '700';

  registerTab.style.borderBottom = '2px solid transparent';
  registerTab.style.color = 'var(--text-muted)';
  registerTab.style.fontWeight = '600';

  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  errorBox.style.display = 'none';
}

function switchToRegisterTab() {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const errorBox = document.getElementById('auth-error-box');

  registerTab.style.borderBottom = '2px solid var(--color-primary)';
  registerTab.style.color = 'var(--color-primary)';
  registerTab.style.fontWeight = '700';

  loginTab.style.borderBottom = '2px solid transparent';
  loginTab.style.color = 'var(--text-muted)';
  loginTab.style.fontWeight = '600';

  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
  errorBox.style.display = 'none';
}

function showAuthError(message, errors = []) {
  const errorBox = document.getElementById('auth-error-box');
  let content = `<strong>${escapeHtml(message)}</strong>`;
  if (errors && errors.length > 0) {
    content += '<ul style="margin-top:6px; padding-left:18px;">';
    errors.forEach(err => {
      content += `<li>${escapeHtml(err)}</li>`;
    });
    content += '</ul>';
  }
  errorBox.innerHTML = content;
  errorBox.style.display = 'block';
}

// 1-Click Demo Credentials Quick Fill
function setupDemoFill() {
  const demoBtn = document.getElementById('btn-demo-fill');
  if (!demoBtn) return;

  demoBtn.addEventListener('click', () => {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (emailInput && passInput) {
      emailInput.value = 'aarav@college.edu';
      passInput.value = 'password123';
      showToast('Demo credentials filled! Click Log In to enter.', 'info');
    }
  });
}

// Setup Login Form
function setupLoginForm() {
  const form = document.getElementById('login-form');
  const btn = document.getElementById('btn-submit-login');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('auth-error-box');
    if (errorBox) errorBox.style.display = 'none';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const res = await API.login(email, password);
      showToast(res.message, 'success');

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/explore.html';
      setTimeout(() => {
        window.location.href = redirect;
      }, 600);
    } catch (err) {
      showAuthError(err.message || 'Invalid email or password.');
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });
}

// Setup Register Form
function setupRegisterForm() {
  const form = document.getElementById('register-form');
  const btn = document.getElementById('btn-submit-register');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('auth-error-box');
    if (errorBox) errorBox.style.display = 'none';

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const bioInput = document.getElementById('register-bio');
    const bio = bioInput ? bioInput.value.trim() : '';

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const res = await API.register({ name, email, password, bio });
      showToast(res.message, 'success');

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/explore.html';
      setTimeout(() => {
        window.location.href = redirect;
      }, 600);
    } catch (err) {
      showAuthError(err.message || 'Registration failed.', err.errors);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}
