/**
 * SavorSpace - Add / Edit Recipe Form Logic
 * Handles dynamic list building (ingredients & steps), image presets,
 * authentication guard, client-side validation, and API submission.
 */

let isEditMode = false;
let editRecipeId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthNotice();
  setupDynamicRowButtons();
  setupImagePresets();

  // Check if we are in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  editRecipeId = urlParams.get('id');

  if (editRecipeId) {
    isEditMode = true;
    loadRecipeForEditing(editRecipeId);
  } else {
    // Populate with 3 initial empty rows for fresh recipe creation
    addIngredientRow('250g Penne pasta');
    addIngredientRow('3 cloves garlic, minced');
    addIngredientRow('1 tbsp olive oil');

    addInstructionRow('Bring a large pot of salted water to a boil and cook pasta until al dente.');
    addInstructionRow('Heat olive oil in a pan over medium heat and sauté minced garlic until fragrant.');
  }

  // Setup form submit
  const form = document.getElementById('recipe-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

// Check if user is logged in
function checkAuthNotice() {
  const user = getLoggedInUser();
  const notice = document.getElementById('auth-alert-notice');
  const submitBtn = document.getElementById('btn-submit-recipe');

  if (!user && notice) {
    notice.style.display = 'block';
  }
}

// Setup image preset buttons
function setupImagePresets() {
  const container = document.getElementById('image-preset-buttons');
  const input = document.getElementById('recipe-image-input');
  if (!container || !input) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const url = btn.getAttribute('data-url');
    if (url) {
      input.value = url;
      showToast('Image preset selected!', 'info');
    }
  });
}

// Dynamic row builders for Ingredients and Steps
function setupDynamicRowButtons() {
  const addIngBtn = document.getElementById('btn-add-ingredient-row');
  const addStepBtn = document.getElementById('btn-add-instruction-row');

  if (addIngBtn) {
    addIngBtn.addEventListener('click', () => addIngredientRow());
  }

  if (addStepBtn) {
    addStepBtn.addEventListener('click', () => addInstructionRow());
  }
}

function addIngredientRow(initialValue = '') {
  const container = document.getElementById('ingredients-inputs-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.innerHTML = `
    <input type="text" class="form-control ingredient-input" placeholder="e.g. 1 cup sliced mushrooms" value="${escapeHtml(initialValue)}" required>
    <button type="button" class="btn-remove-row" title="Remove ingredient">×</button>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (container.querySelectorAll('.dynamic-item-row').length > 2) {
      row.remove();
    } else {
      showToast('A recipe needs at least 2 ingredients.', 'info');
    }
  });

  container.appendChild(row);
}

function addInstructionRow(initialValue = '') {
  const container = document.getElementById('instructions-inputs-container');
  if (!container) return;

  const stepIndex = container.querySelectorAll('.dynamic-item-row').length + 1;
  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.innerHTML = `
    <span style="font-weight:700; color:var(--color-primary); min-width:24px;">${stepIndex}.</span>
    <input type="text" class="form-control instruction-input" placeholder="e.g. Sauté the onions until translucent." value="${escapeHtml(initialValue)}" required>
    <button type="button" class="btn-remove-row" title="Remove step">×</button>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (container.querySelectorAll('.dynamic-item-row').length > 2) {
      row.remove();
      renumberSteps();
    } else {
      showToast('A recipe needs at least 2 instruction steps.', 'info');
    }
  });

  container.appendChild(row);
}

function renumberSteps() {
  const container = document.getElementById('instructions-inputs-container');
  if (!container) return;
  const rows = container.querySelectorAll('.dynamic-item-row');
  rows.forEach((row, idx) => {
    const span = row.querySelector('span');
    if (span) span.textContent = `${idx + 1}.`;
  });
}

// Load recipe details if in edit mode
async function loadRecipeForEditing(id) {
  try {
    const res = await API.getRecipeById(id);
    const recipe = res.data;

    const user = getLoggedInUser();
    if (!user || (recipe.author && recipe.author.id !== user.id)) {
      showToast('You can only edit recipes that you authored.', 'error');
      setTimeout(() => { window.location.href = `/recipe.html?id=${id}`; }, 1200);
      return;
    }

    // Populate standard form fields
    document.getElementById('recipe-title-input').value = recipe.title || '';
    document.getElementById('recipe-desc-input').value = recipe.description || '';
    document.getElementById('recipe-category-select').value = recipe.category || 'Dinner';
    document.getElementById('recipe-cuisine-select').value = recipe.cuisine || 'Italian';
    document.getElementById('recipe-difficulty-select').value = recipe.difficulty || 'Easy';
    document.getElementById('recipe-prep-time').value = recipe.prepTime || 10;
    document.getElementById('recipe-cook-time').value = recipe.cookTime || 15;
    document.getElementById('recipe-servings').value = recipe.servings || 2;
    document.getElementById('recipe-image-input').value = recipe.image || '';
    document.getElementById('recipe-notes-input').value = recipe.notes || '';

    // Populate Ingredients
    const ingContainer = document.getElementById('ingredients-inputs-container');
    ingContainer.innerHTML = '';
    (recipe.ingredients || []).forEach(ing => addIngredientRow(ing));

    // Populate Instructions
    const stepContainer = document.getElementById('instructions-inputs-container');
    stepContainer.innerHTML = '';
    (recipe.instructions || []).forEach(step => addInstructionRow(step));

    // Cancel link
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.href = `/recipe.html?id=${id}`;
    }

  } catch (err) {
    showToast('Failed to load recipe for editing.', 'error');
    console.error(err);
  }
}

// Form Submission Handler
async function handleFormSubmit(e) {
  e.preventDefault();

  const user = getLoggedInUser();
  if (!user) {
    showToast('Please log in or create an account to publish a recipe.', 'error');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  const errorBox = document.getElementById('form-error-box');
  errorBox.style.display = 'none';
  errorBox.innerHTML = '';

  // Extract ingredients
  const ingredientInputs = document.querySelectorAll('.ingredient-input');
  const ingredients = Array.from(ingredientInputs)
    .map(i => i.value.trim())
    .filter(val => val.length > 0);

  // Extract instructions
  const instructionInputs = document.querySelectorAll('.instruction-input');
  const instructions = Array.from(instructionInputs)
    .map(i => i.value.trim())
    .filter(val => val.length > 0);

  // Validation
  const errors = [];
  if (ingredients.length < 2) {
    errors.push('Please provide at least 2 ingredients.');
  }
  if (instructions.length < 2) {
    errors.push('Please provide at least 2 instruction steps.');
  }

  if (errors.length > 0) {
    errorBox.innerHTML = errors.map(e => `<div>• ${escapeHtml(e)}</div>`).join('');
    errorBox.style.display = 'block';
    return;
  }

  const payload = {
    title: document.getElementById('recipe-title-input').value.trim(),
    description: document.getElementById('recipe-desc-input').value.trim(),
    category: document.getElementById('recipe-category-select').value,
    cuisine: document.getElementById('recipe-cuisine-select').value,
    difficulty: document.getElementById('recipe-difficulty-select').value,
    prepTime: parseInt(document.getElementById('recipe-prep-time').value, 10),
    cookTime: parseInt(document.getElementById('recipe-cook-time').value, 10),
    servings: parseInt(document.getElementById('recipe-servings').value, 10),
    image: document.getElementById('recipe-image-input').value.trim(),
    ingredients,
    instructions,
    notes: document.getElementById('recipe-notes-input').value.trim()
  };

  const submitBtn = document.getElementById('btn-submit-recipe');
  submitBtn.disabled = true;
  submitBtn.textContent = isEditMode ? 'Saving Changes...' : 'Publishing...';

  try {
    let res;
    if (isEditMode) {
      res = await API.updateRecipe(editRecipeId, payload);
      showToast('Recipe updated successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/recipe.html?id=${editRecipeId}`;
      }, 700);
    } else {
      res = await API.createRecipe(payload);
      showToast('Recipe published to community!', 'success');
      setTimeout(() => {
        window.location.href = `/recipe.html?id=${res.data.id}`;
      }, 700);
    }
  } catch (err) {
    console.error('Submission error:', err);
    errorBox.innerHTML = `<div>${escapeHtml(err.message)}</div>`;
    if (Array.isArray(err.errors)) {
      errorBox.innerHTML += err.errors.map(e => `<div>• ${escapeHtml(e)}</div>`).join('');
    }
    errorBox.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = isEditMode ? 'Save Changes' : 'Publish Recipe';
  }
}
