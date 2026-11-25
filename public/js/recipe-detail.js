/**
 * SavorSpace - Recipe Details Page Logic
 * Handles single recipe display, interactive ingredient checking,
 * author permissions, bookmarking, and community reviews.
 */

let currentRecipe = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    showErrorState('No recipe ID specified in URL.');
    return;
  }

  loadRecipeDetails(recipeId);
  setupStarRatingSelector();
  setupReviewForm(recipeId);
  setupShareButton();
});

// Fetch and render recipe data
async function loadRecipeDetails(recipeId) {
  const loadingEl = document.getElementById('recipe-detail-loading');
  const contentEl = document.getElementById('recipe-detail-content');

  try {
    const res = await API.getRecipeById(recipeId);
    currentRecipe = res.data;

    document.title = `${currentRecipe.title} - SavorSpace`;

    // Populate Breadcrumbs
    document.getElementById('breadcrumb-category').textContent = currentRecipe.category || 'Recipe';
    document.getElementById('breadcrumb-title').textContent = currentRecipe.title;

    // Header & Meta
    document.getElementById('recipe-title').textContent = currentRecipe.title;
    document.getElementById('recipe-description').textContent = currentRecipe.description || '';

    // Author
    const authorName = currentRecipe.author ? currentRecipe.author.name : 'Home Cook';
    document.getElementById('author-name').textContent = authorName;
    document.getElementById('author-avatar').textContent = authorName.charAt(0).toUpperCase();

    // Date
    if (currentRecipe.createdAt) {
      const dateFormatted = new Date(currentRecipe.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      document.getElementById('recipe-date').textContent = `Posted on ${dateFormatted}`;
    }

    // Hero Image
    const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
    document.getElementById('recipe-image').src = currentRecipe.image || defaultImage;
    document.getElementById('recipe-image').alt = currentRecipe.title;

    // Quick Stats
    document.getElementById('stat-prep-time').textContent = `${currentRecipe.prepTime || 0} mins`;
    document.getElementById('stat-cook-time').textContent = `${currentRecipe.cookTime || 0} mins`;
    document.getElementById('stat-servings').textContent = `${currentRecipe.servings || 2} servings`;
    document.getElementById('stat-difficulty').textContent = currentRecipe.difficulty || 'Easy';

    // Ingredients Checklist
    renderIngredients(currentRecipe.ingredients || []);

    // Step-by-Step Instructions
    renderInstructions(currentRecipe.instructions || []);

    // Student Notes
    const notesCard = document.getElementById('recipe-notes-card');
    const notesText = document.getElementById('recipe-notes-text');
    if (currentRecipe.notes && currentRecipe.notes.trim()) {
      notesText.textContent = currentRecipe.notes;
      notesCard.style.display = 'block';
    } else {
      notesCard.style.display = 'none';
    }

    // Save button state
    updateSaveButtonState(Boolean(currentRecipe.isSaved));
    setupSaveButton(currentRecipe.id);

    // Author Owner Actions (Edit / Delete)
    setupAuthorActions(currentRecipe);

    // Reviews
    renderReviews(currentRecipe.reviews || [], currentRecipe.averageRating);

    // Display content
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

  } catch (err) {
    console.error('Failed to load recipe details:', err);
    showErrorState(err.message || 'Recipe could not be loaded.');
  }
}

// Show error state
function showErrorState(msg) {
  const loadingEl = document.getElementById('recipe-detail-loading');
  loadingEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3 class="empty-state-title">Recipe Not Found</h3>
      <p class="empty-state-desc">${escapeHtml(msg)}</p>
      <a href="/explore.html" class="btn btn-primary btn-sm">Back to Explore Recipes</a>
    </div>
  `;
}

// Render Ingredients with interactive strike-through checkboxes
function renderIngredients(ingredients) {
  const list = document.getElementById('ingredients-list');
  if (ingredients.length === 0) {
    list.innerHTML = `<li style="color:var(--text-muted);">No ingredients listed.</li>`;
    return;
  }

  list.innerHTML = ingredients.map((ing, idx) => `
    <li>
      <label class="ingredient-item">
        <input type="checkbox" id="ing-${idx}">
        <span>${escapeHtml(ing)}</span>
      </label>
    </li>
  `).join('');

  // Add click toggle to cross-out items
  list.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const label = e.target.closest('.ingredient-item');
      if (e.target.checked) {
        label.classList.add('checked');
      } else {
        label.classList.remove('checked');
      }
    });
  });
}

// Render Instruction Steps
function renderInstructions(steps) {
  const list = document.getElementById('steps-list');
  if (steps.length === 0) {
    list.innerHTML = `<li style="color:var(--text-muted);">No instructions listed.</li>`;
    return;
  }

  list.innerHTML = steps.map((step, idx) => `
    <li class="step-item">
      <div class="step-number">${idx + 1}</div>
      <div class="step-text">${escapeHtml(step)}</div>
    </li>
  `).join('');
}

// Setup Save Button
function setupSaveButton(recipeId) {
  const btn = document.getElementById('btn-save-detail');
  if (!btn) return;

  btn.onclick = async () => {
    const user = getLoggedInUser();
    if (!user) {
      showToast('Please log in to save recipes to your collection.', 'info');
      setTimeout(() => { window.location.href = '/login.html'; }, 1000);
      return;
    }

    try {
      btn.disabled = true;
      const res = await API.toggleSaveRecipe(recipeId);
      updateSaveButtonState(res.isSaved);
      showToast(res.message, res.isSaved ? 'success' : 'info');
    } catch (err) {
      showToast(err.message || 'Could not update save status.', 'error');
    } finally {
      btn.disabled = false;
    }
  };
}

function updateSaveButtonState(isSaved) {
  const btn = document.getElementById('btn-save-detail');
  const icon = document.getElementById('detail-save-icon');
  const text = document.getElementById('detail-save-text');
  if (!btn || !icon || !text) return;

  if (isSaved) {
    btn.classList.add('saved');
    icon.setAttribute('fill', 'currentColor');
    text.textContent = 'Saved to Collection';
    btn.style.color = '#c0392b';
    btn.style.borderColor = '#eeb3ac';
  } else {
    btn.classList.remove('saved');
    icon.setAttribute('fill', 'none');
    text.textContent = 'Save Recipe';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

// Author Owner Permissions (Edit / Delete)
function setupAuthorActions(recipe) {
  const actionsContainer = document.getElementById('author-owner-actions');
  const editBtn = document.getElementById('btn-edit-recipe');
  const deleteBtn = document.getElementById('btn-delete-recipe');
  if (!actionsContainer || !editBtn || !deleteBtn) return;

  const user = getLoggedInUser();
  const isAuthor = user && recipe.author && recipe.author.id === user.id;

  if (isAuthor) {
    actionsContainer.style.display = 'inline-flex';
    editBtn.href = `/edit-recipe.html?id=${recipe.id}`;

    deleteBtn.onclick = async () => {
      const confirmDelete = confirm(`Are you sure you want to delete "${recipe.title}"? This cannot be undone.`);
      if (!confirmDelete) return;

      try {
        deleteBtn.disabled = true;
        const res = await API.deleteRecipe(recipe.id);
        showToast(res.message, 'success');
        setTimeout(() => {
          window.location.href = '/explore.html';
        }, 1000);
      } catch (err) {
        showToast(err.message || 'Failed to delete recipe.', 'error');
        deleteBtn.disabled = false;
      }
    };
  } else {
    actionsContainer.style.display = 'none';
  }
}

// Setup Share / Copy Link Button
function setupShareButton() {
  const shareBtn = document.getElementById('btn-copy-link');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Recipe link copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy link.', 'error'));
  });
}

// Star Rating Selector
function setupStarRatingSelector() {
  const starButtons = document.querySelectorAll('#star-selector .star-btn');
  const ratingInput = document.getElementById('selected-rating-value');

  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'), 10);
      ratingInput.value = rating;

      starButtons.forEach(b => {
        const val = parseInt(b.getAttribute('data-rating'), 10);
        if (val <= rating) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    });
  });
}

// Setup Review Submission Form
function setupReviewForm(recipeId) {
  const form = document.getElementById('recipe-review-form');
  const submitBtn = document.getElementById('btn-submit-review');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = getLoggedInUser();
    if (!user) {
      showToast('Please log in to submit a review.', 'info');
      setTimeout(() => { window.location.href = '/login.html'; }, 1000);
      return;
    }

    const rating = document.getElementById('selected-rating-value').value;
    const comment = document.getElementById('review-comment').value.trim();

    if (!comment || comment.length < 4) {
      showToast('Please write a comment with at least 4 characters.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      const res = await API.postReview(recipeId, { rating, comment });
      showToast(res.message, 'success');

      // Clear form
      document.getElementById('review-comment').value = '';

      // Reload recipe details to refresh review count & list
      loadRecipeDetails(recipeId);
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  });
}

// Render Reviews List
function renderReviews(reviews, avgRating) {
  const list = document.getElementById('reviews-list');
  const avgEl = document.getElementById('reviews-avg-stars');
  const countEl = document.getElementById('reviews-count-text');

  avgEl.textContent = avgRating > 0 ? `★ ${avgRating}` : '★ New';
  countEl.textContent = `(${reviews.length} review${reviews.length === 1 ? '' : 's'})`;

  if (!reviews || reviews.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 0.92rem;">
        No reviews yet for this recipe. Be the first student to review it!
      </div>
    `;
    return;
  }

  list.innerHTML = reviews.map(rev => {
    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    const dateFormatted = rev.date ? new Date(rev.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : '';

    return `
      <article class="review-item">
        <div class="review-author-meta">
          <span class="review-user-name">${escapeHtml(rev.userName || 'Student')}</span>
          <span class="review-date">${dateFormatted}</span>
        </div>
        <div class="review-stars">${stars}</div>
        <p class="review-comment">${escapeHtml(rev.comment)}</p>
      </article>
    `;
  }).join('');
}
