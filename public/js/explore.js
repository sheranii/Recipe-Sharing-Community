/**
 * SavorSpace - Explore Page Logic
 * Handles recipe searching, multi-criteria filtering, query parameter synchronization, and card rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeFiltersFromURL();
  applyFilters();

  // Attach change listeners for real-time responsiveness
  const selects = ['filter-category', 'filter-cuisine', 'filter-time', 'filter-sort'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => applyFilters());
    }
  });

  // Debounce search input
  const searchInput = document.getElementById('filter-search');
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => applyFilters(), 350);
    });
  }

  // Clear filters button
  const clearBtn = document.getElementById('btn-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', resetFilters);
  }
});

// Read URL parameters on page load and populate inputs
function initializeFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const search = urlParams.get('search');
  if (search) document.getElementById('filter-search').value = search;

  const category = urlParams.get('category');
  if (category) document.getElementById('filter-category').value = category;

  const cuisine = urlParams.get('cuisine');
  if (cuisine) document.getElementById('filter-cuisine').value = cuisine;

  const maxTime = urlParams.get('maxTime');
  if (maxTime) document.getElementById('filter-time').value = maxTime;

  const sort = urlParams.get('sort');
  if (sort) document.getElementById('filter-sort').value = sort;
}

// Fetch recipes matching current filter values
async function applyFilters() {
  const grid = document.getElementById('explore-recipe-grid');
  const countEl = document.getElementById('results-count');
  const badgesContainer = document.getElementById('active-filters-badges');

  const search = document.getElementById('filter-search').value.trim();
  const category = document.getElementById('filter-category').value;
  const cuisine = document.getElementById('filter-cuisine').value;
  const maxTime = document.getElementById('filter-time').value;
  const sort = document.getElementById('filter-sort').value;

  // Build filter object for API call
  const params = {};
  if (search) params.search = search;
  if (category && category !== 'All') params.category = category;
  if (cuisine && cuisine !== 'All') params.cuisine = cuisine;
  if (maxTime && maxTime !== 'All') params.maxTime = maxTime;
  if (sort) params.sort = sort;

  // Update URL without reloading page (preserves shareable filter links)
  const query = new URLSearchParams(params).toString();
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);

  // Update active filter badge tags in UI
  renderActiveFilterBadges(params, badgesContainer);

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
      Searching recipes...
    </div>
  `;

  try {
    const res = await API.getRecipes(params);
    const recipes = res.data || [];

    countEl.textContent = recipes.length;

    if (recipes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🍳</div>
          <h3 class="empty-state-title">No recipes matched your search</h3>
          <p class="empty-state-desc">
            Try adjusting your search keywords, clearing your filters, or share this recipe with the community!
          </p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <button onclick="resetFilters()" class="btn btn-outline btn-sm">Clear Filters</button>
            <a href="/add-recipe.html" class="btn btn-primary btn-sm">Submit New Recipe</a>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = recipes.map(r => renderRecipeCard(r)).join('');
  } catch (err) {
    console.error('Failed to filter recipes:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #c0392b;">
        Error loading recipes: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

// Render active filter badges
function renderActiveFilterBadges(params, container) {
  if (!container) return;
  const badges = [];

  if (params.search) badges.push(`Keyword: "${escapeHtml(params.search)}"`);
  if (params.category) badges.push(`Category: ${escapeHtml(params.category)}`);
  if (params.cuisine) badges.push(`Cuisine: ${escapeHtml(params.cuisine)}`);
  if (params.maxTime) badges.push(`Under ${params.maxTime}m`);

  if (badges.length === 0) {
    container.innerHTML = '';
  } else {
    container.innerHTML = badges.map(b => `<span class="active-filter-tag">${b}</span>`).join(' ');
  }
}

// Reset all filter controls
function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = 'All';
  document.getElementById('filter-cuisine').value = 'All';
  document.getElementById('filter-time').value = 'All';
  document.getElementById('filter-sort').value = 'newest';
  applyFilters();
}
