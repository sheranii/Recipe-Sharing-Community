/**
 * SavorSpace - Authentication State & UI Helper Module
 * Manages active user session, navigation updates, toasts, and shared card rendering.
 */

// Helper to get cached user
function getLoggedInUser() {
  const userJson = localStorage.getItem('savorspace_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Update Header Navbar according to auth state
function initNavigation() {
  const authContainer = document.getElementById('nav-auth-container');
  if (!authContainer) return;

  const user = getLoggedInUser();

  if (user) {
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const isProfilePage = window.location.pathname.endsWith('/profile.html') || window.location.pathname.endsWith('/profile');

    // Add Profile to mobile/desktop nav links if not present
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('nav-profile-item')) {
      const profileLi = document.createElement('li');
      profileLi.id = 'nav-profile-item';
      profileLi.innerHTML = `<a href="/profile.html" class="nav-link ${isProfilePage ? 'active' : ''}">Profile</a>`;
      navLinks.appendChild(profileLi);
    }

    authContainer.innerHTML = `
      <a href="/profile.html" class="user-menu-pill ${isProfilePage ? 'active' : ''}" id="nav-profile-pill" title="${escapeHtml(user.name)}" aria-label="Profile: ${escapeHtml(user.name)}">
        <span class="user-avatar-initial" title="${escapeHtml(user.name)}" data-username="${escapeHtml(user.name)}">${initial}</span>
        <span class="profile-nav-text">Profile</span>
        <span class="user-hover-tooltip">${escapeHtml(user.name)}</span>
      </a>
      <button id="logout-btn" class="btn btn-outline btn-sm">Log Out</button>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        API.logout();
        showToast('Logged out successfully.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    }
  } else {
    authContainer.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="/login.html?mode=register" class="btn btn-primary btn-sm">Join SavorSpace</a>
    `;
  }

  // Setup mobile navigation toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navWrapper = document.getElementById('nav-links-wrapper');
  if (mobileToggle && navWrapper) {
    mobileToggle.addEventListener('click', () => {
      navWrapper.classList.toggle('open');
    });
  }
}

// Utility: HTML escape string for safe DOM insertion
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Shared Recipe Card Component Renderer
function renderRecipeCard(recipe) {
  const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
  const imgUrl = recipe.image || defaultImage;
  const isSaved = Boolean(recipe.isSaved);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const diffClass = (recipe.difficulty || 'Easy').toLowerCase();

  return `
    <article class="recipe-card" data-id="${recipe.id}">
      <div class="recipe-card-media">
        <a href="/recipe.html?id=${recipe.id}" aria-label="View ${escapeHtml(recipe.title)}">
          <img src="${escapeHtml(imgUrl)}" 
               alt="${escapeHtml(recipe.title)}" 
               class="recipe-card-img" 
               loading="lazy"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';">
        </a>
        <div class="recipe-card-badges">
          <span class="badge badge-category">${escapeHtml(recipe.category || 'Recipe')}</span>
          <span class="badge badge-difficulty ${diffClass}">${escapeHtml(recipe.difficulty || 'Easy')}</span>
        </div>
        <button class="btn-card-save ${isSaved ? 'saved' : ''}" 
                data-recipe-id="${recipe.id}" 
                title="${isSaved ? 'Remove from saved' : 'Save recipe'}"
                aria-label="Save recipe">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="recipe-card-body">
        <div class="recipe-card-meta">
          <span class="meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${totalTime} mins
          </span>
          <span class="meta-item">•</span>
          <span class="meta-item">${escapeHtml(recipe.cuisine || 'Homestyle')}</span>
          <span class="meta-item">•</span>
          <span class="meta-item">${recipe.servings || 2} servings</span>
        </div>
        <h3 class="recipe-card-title">
          <a href="/recipe.html?id=${recipe.id}">${escapeHtml(recipe.title)}</a>
        </h3>
        <p class="recipe-card-desc">${escapeHtml(recipe.description || '')}</p>
        <div class="recipe-card-footer">
          <span class="recipe-author">by ${escapeHtml(recipe.author ? recipe.author.name : 'Home Cook')}</span>
          <div class="recipe-rating">
            <span>★</span>
            <span>${recipe.averageRating > 0 ? recipe.averageRating : 'New'}</span>
            ${recipe.reviewCount ? `<span style="color:var(--text-muted);font-weight:normal;">(${recipe.reviewCount})</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `;
}

// Global handler for save button clicks on recipe cards
document.addEventListener('click', async (e) => {
  const saveBtn = e.target.closest('.btn-card-save');
  if (!saveBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const user = getLoggedInUser();
  if (!user) {
    showToast('Please log in to save recipes to your collection.', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1200);
    return;
  }

  const recipeId = saveBtn.getAttribute('data-recipe-id');
  if (!recipeId) return;

  try {
    saveBtn.disabled = true;
    const res = await API.toggleSaveRecipe(recipeId);
    if (res.isSaved) {
      saveBtn.classList.add('saved');
      saveBtn.querySelector('svg').setAttribute('fill', 'currentColor');
      showToast(res.message, 'success');
    } else {
      saveBtn.classList.remove('saved');
      saveBtn.querySelector('svg').setAttribute('fill', 'none');
      showToast(res.message, 'info');
    }
  } catch (err) {
    showToast(err.message || 'Could not update saved status.', 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

// Run navigation initialization on DOM ready
document.addEventListener('DOMContentLoaded', initNavigation);
