/**
 * SavorSpace - Saved Recipes Page Logic
 * Retrieves and renders bookmarked recipes for the current authenticated user.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadSavedRecipes();

  // Listen for save button clicks on this page to dynamically remove unsaved cards
  document.addEventListener('click', (e) => {
    const saveBtn = e.target.closest('.btn-card-save');
    if (!saveBtn) return;
    const card = saveBtn.closest('.recipe-card');
    if (card) {
      setTimeout(() => {
        // If it got unsaved, fade out and remove
        if (!saveBtn.classList.contains('saved')) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.transition = 'all 0.25s ease';
          setTimeout(() => {
            card.remove();
            checkEmptyState();
          }, 250);
        }
      }, 300);
    }
  });
});

async function loadSavedRecipes() {
  const grid = document.getElementById('saved-recipe-grid');
  if (!grid) return;

  const user = getLoggedInUser();
  if (!user) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔒</div>
        <h3 class="empty-state-title">Log in to view saved recipes</h3>
        <p class="empty-state-desc">
          Sign in with your student account or demo profile to bookmark dishes and access your favorites anywhere.
        </p>
        <a href="/login.html" class="btn btn-primary btn-sm">Log In Now</a>
      </div>
    `;
    return;
  }

  try {
    const res = await API.getMySavedRecipes();
    const recipes = res.data || [];

    if (recipes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📖</div>
          <h3 class="empty-state-title">No saved recipes yet</h3>
          <p class="empty-state-desc">
            Whenever you find a dish you want to cook later, click the bookmark heart icon on any recipe card to save it here.
          </p>
          <a href="/explore.html" class="btn btn-primary btn-sm">Explore Recipes</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = recipes.map(r => renderRecipeCard(r)).join('');
  } catch (err) {
    console.error('Failed to load saved recipes:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #c0392b;">
        Failed to load saved recipes: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function checkEmptyState() {
  const grid = document.getElementById('saved-recipe-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.recipe-card');
  if (cards.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📖</div>
        <h3 class="empty-state-title">No saved recipes left</h3>
        <p class="empty-state-desc">You have removed all recipes from your saved list.</p>
        <a href="/explore.html" class="btn btn-primary btn-sm">Explore Recipes</a>
      </div>
    `;
  }
}
