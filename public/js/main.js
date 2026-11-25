/**
 * SavorSpace - Homepage Logic
 * Loads community recipes and handles the search form redirect.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCommunityRecipes();
  setupSearchForm();
});

// Load community recipes into the grid
async function loadCommunityRecipes() {
  const container = document.getElementById('recent-recipe-grid');
  if (!container) return;

  try {
    const res = await API.getRecipes({ sort: 'newest' });
    const recipes = (res.data || []).slice(0, 6);

    if (recipes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
          No recipes added yet. Be the first to share one!
        </div>
      `;
      return;
    }

    container.innerHTML = recipes.map(r => renderRecipeCard(r)).join('');
  } catch (err) {
    console.error('Failed to load community recipes:', err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #c0392b;">
        Could not load recipes right now.
      </div>
    `;
  }
}

// Hook search form submit
function setupSearchForm() {
  const form = document.getElementById('hero-search-form');
  const input = document.getElementById('hero-search-input');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      window.location.href = `/explore.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = '/explore.html';
    }
  });
}
