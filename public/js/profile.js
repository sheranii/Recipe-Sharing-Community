/**
 * SavorSpace - Profile Page Logic
 * Manages user profile details, authored recipes, bookmarks, and bio updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupTabs();
  setupEditForm();
  setupLogoutButton();
});

let currentUserData = null;

async function loadProfile() {
  const guestView = document.getElementById('profile-guest-view');
  const authView = document.getElementById('profile-auth-view');

  const cachedUser = getLoggedInUser();
  if (!cachedUser) {
    if (guestView) guestView.style.display = 'block';
    if (authView) authView.style.display = 'none';
    return;
  }

  if (guestView) guestView.style.display = 'none';
  if (authView) authView.style.display = 'block';

  // Fetch fresh user profile from API
  try {
    const meRes = await API.getCurrentUser();
    currentUserData = meRes.user || cachedUser;
  } catch (e) {
    currentUserData = cachedUser;
  }

  renderProfileHeader(currentUserData);
  loadAuthoredRecipes(currentUserData.id);
  loadSavedRecipesTab();
}

function renderProfileHeader(user) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const bioEl = document.getElementById('profile-bio');
  const joinedEl = document.getElementById('profile-joined');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (bioEl) bioEl.textContent = user.bio || 'Home cook and student on SavorSpace.';

  if (joinedEl && user.createdAt) {
    const date = new Date(user.createdAt);
    const formatted = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    joinedEl.textContent = `Member since ${formatted}`;
  }

  // Prepopulate edit form
  const editName = document.getElementById('edit-profile-name');
  const editEmail = document.getElementById('edit-profile-email');
  const editBio = document.getElementById('edit-profile-bio');

  if (editName) editName.value = user.name;
  if (editEmail) editEmail.value = user.email;
  if (editBio) editBio.value = user.bio || '';
}

async function loadAuthoredRecipes(userId) {
  const grid = document.getElementById('my-recipes-grid');
  const statCount = document.getElementById('stat-recipes-count');
  const tabCounter = document.getElementById('tab-recipes-counter');
  const statReviews = document.getElementById('stat-reviews-count');

  if (!grid) return;

  try {
    const res = await API.getRecipes({ author: userId });
    const recipes = res.data || [];

    if (statCount) statCount.textContent = recipes.length;
    if (tabCounter) tabCounter.textContent = recipes.length;

    // Calculate total reviews across user's recipes
    const totalReviews = recipes.reduce((sum, r) => sum + (r.reviewCount || (r.reviews ? r.reviews.length : 0)), 0);
    if (statReviews) statReviews.textContent = totalReviews;

    if (recipes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🍳</div>
          <h3 class="empty-state-title">No recipes published yet</h3>
          <p class="empty-state-desc">
            Have a tasty student meal or hostel recipe to share? Add your first recipe and inspire others!
          </p>
          <a href="/add-recipe.html" class="btn btn-primary btn-sm">+ Add Your First Recipe</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = recipes.map(recipe => renderMyRecipeCard(recipe)).join('');
    setupCardActionListeners(grid);
  } catch (err) {
    console.error('Failed to load authored recipes:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #c0392b; padding: 24px;">
        Failed to load your recipes: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderMyRecipeCard(recipe) {
  const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
  const imgUrl = recipe.image || defaultImage;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return `
    <article class="recipe-card" data-id="${recipe.id}">
      <div class="recipe-card-media">
        <a href="/recipe.html?id=${recipe.id}">
          <img src="${escapeHtml(imgUrl)}" 
               alt="${escapeHtml(recipe.title)}" 
               class="recipe-card-img" 
               loading="lazy"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';">
        </a>
        <div class="recipe-card-badges">
          <span class="badge badge-category">${escapeHtml(recipe.category || 'Recipe')}</span>
          <span class="badge badge-difficulty ${(recipe.difficulty || 'Easy').toLowerCase()}">${escapeHtml(recipe.difficulty || 'Easy')}</span>
        </div>
      </div>
      <div class="recipe-card-body">
        <div class="recipe-card-meta">
          <span class="meta-item">⏱️ ${totalTime} mins</span>
          <span class="meta-item">•</span>
          <span class="meta-item">${escapeHtml(recipe.cuisine || 'Homestyle')}</span>
        </div>
        <h3 class="recipe-card-title">
          <a href="/recipe.html?id=${recipe.id}">${escapeHtml(recipe.title)}</a>
        </h3>
        <p class="recipe-card-desc">${escapeHtml(recipe.description || '')}</p>
        
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; gap: 8px; justify-content: flex-end;">
          <a href="/recipe.html?id=${recipe.id}" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">View</a>
          <a href="/edit-recipe.html?id=${recipe.id}" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem; color: var(--color-primary); border-color: var(--color-primary);">Edit</a>
          <button type="button" class="btn btn-outline btn-sm btn-delete-my-recipe" data-id="${recipe.id}" data-title="${escapeHtml(recipe.title)}" style="padding: 4px 10px; font-size: 0.8rem; color: #c0392b; border-color: #f2dede;">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function setupCardActionListeners(container) {
  container.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-delete-my-recipe');
    if (!deleteBtn) return;

    const recipeId = deleteBtn.getAttribute('data-id');
    const recipeTitle = deleteBtn.getAttribute('data-title');

    if (!confirm(`Are you sure you want to delete "${recipeTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      await API.deleteRecipe(recipeId);
      showToast('Recipe deleted successfully.', 'info');
      if (currentUserData) {
        loadAuthoredRecipes(currentUserData.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete recipe.', 'error');
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete';
    }
  });
}

async function loadSavedRecipesTab() {
  const grid = document.getElementById('my-saved-grid');
  const statSaved = document.getElementById('stat-saved-count');
  const tabCounter = document.getElementById('tab-saved-counter');
  if (!grid) return;

  try {
    const res = await API.getMySavedRecipes();
    const saved = res.data || [];

    if (statSaved) statSaved.textContent = saved.length;
    if (tabCounter) tabCounter.textContent = saved.length;

    if (saved.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">❤️</div>
          <h3 class="empty-state-title">No saved recipes yet</h3>
          <p class="empty-state-desc">
            When you see a dish you want to cook later, click the bookmark heart icon to save it here.
          </p>
          <a href="/explore.html" class="btn btn-primary btn-sm">Explore Recipes</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = saved.map(r => renderRecipeCard(r)).join('');
  } catch (err) {
    console.error('Failed to load saved recipes tab:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #c0392b; padding: 20px;">
        Could not load saved recipes.
      </div>
    `;
  }
}

function setupTabs() {
  const buttons = document.querySelectorAll('.profile-tab-button');
  const panes = {
    recipes: document.getElementById('tab-content-recipes'),
    saved: document.getElementById('tab-content-saved'),
    settings: document.getElementById('tab-content-settings')
  };

  function switchTab(targetTab) {
    buttons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
    });

    Object.entries(panes).forEach(([key, pane]) => {
      if (pane) {
        pane.style.display = key === targetTab ? 'block' : 'none';
      }
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Toggle edit profile button in header
  const toggleEditBtn = document.getElementById('btn-toggle-edit');
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener('click', () => {
      switchTab('settings');
      const nameInput = document.getElementById('edit-profile-name');
      if (nameInput) nameInput.focus();
    });
  }

  const cancelEditBtn = document.getElementById('btn-cancel-profile');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      switchTab('recipes');
    });
  }
}

function setupEditForm() {
  const form = document.getElementById('edit-profile-form');
  const saveBtn = document.getElementById('btn-save-profile');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-profile-name').value.trim();
    const bio = document.getElementById('edit-profile-bio').value.trim();

    if (!name || name.length < 2) {
      showToast('Full name must be at least 2 characters long.', 'error');
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const res = await API.updateProfile({ name, bio });
      showToast(res.message || 'Profile updated successfully!', 'success');
      currentUserData = res.user;

      renderProfileHeader(currentUserData);
      initNavigation(); // Updates navbar pill & tooltip with new username

      // Switch back to recipes tab
      const recipesTabBtn = document.getElementById('tab-btn-recipes');
      if (recipesTabBtn) recipesTabBtn.click();
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }
  });
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById('btn-profile-logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    API.logout();
    showToast('Signed out of profile.', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  });
}
