const express = require('express');
const router = express.Router();
const { RECIPES_FILE, USERS_FILE } = require('../config/constants');
const { readJsonFile, writeJsonFile } = require('../services/fileStorage');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateRecipe } = require('../middleware/validate');
const recipeEvents = require('../services/eventService');

/**
 * Recipe Routes
 * Complete CRUD operations, query parameter filtering, search, sorting, and bookmarking.
 */

// Helper to compute average rating
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Number((sum / reviews.length).toFixed(1));
}

// GET /api/recipes/featured - Curated featured recipes for homepage
router.get('/featured', async (req, res, next) => {
  try {
    const recipes = await readJsonFile(RECIPES_FILE, []);
    // Pick recipes with highest likes / ratings
    const featured = [...recipes]
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 3)
      .map(r => ({
        ...r,
        averageRating: calculateAverageRating(r.reviews),
        reviewCount: r.reviews ? r.reviews.length : 0
      }));

    res.json({
      success: true,
      data: featured
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/categories - Summary of categories & cuisines with counts
router.get('/categories', async (req, res, next) => {
  try {
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const categoryCounts = {};
    const cuisineCounts = {};

    recipes.forEach(r => {
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
      if (r.cuisine) {
        cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        categories: categoryCounts,
        cuisines: cuisineCounts,
        totalRecipes: recipes.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/saved/my-saved - Get all recipes bookmarked by current user
router.get('/saved/my-saved', verifyToken, async (req, res, next) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const recipes = await readJsonFile(RECIPES_FILE, []);
    const savedIds = new Set(user.savedRecipeIds || []);
    const savedRecipes = recipes
      .filter(r => savedIds.has(r.id))
      .map(r => ({
        ...r,
        averageRating: calculateAverageRating(r.reviews),
        reviewCount: r.reviews ? r.reviews.length : 0,
        isSaved: true
      }));

    res.json({
      success: true,
      count: savedRecipes.length,
      data: savedRecipes
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes - Filter, search, and list recipes (Query parameters demo)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const { search, category, cuisine, maxTime, difficulty, sort, author } = req.query;

    let filtered = [...recipes];

    // Filter by text search (searches title, description, and ingredients)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(r => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = r.description.toLowerCase().includes(q);
        const ingMatch = Array.isArray(r.ingredients) && r.ingredients.some(i => i.toLowerCase().includes(q));
        const cuisineMatch = r.cuisine && r.cuisine.toLowerCase().includes(q);
        return titleMatch || descMatch || ingMatch || cuisineMatch;
      });
    }

    // Filter by category
    if (category && category !== 'All') {
      filtered = filtered.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by cuisine
    if (cuisine && cuisine !== 'All') {
      filtered = filtered.filter(r => r.cuisine && r.cuisine.toLowerCase() === cuisine.toLowerCase());
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'All') {
      filtered = filtered.filter(r => r.difficulty && r.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Filter by max total cooking time (prepTime + cookTime)
    if (maxTime) {
      const maxMinutes = parseInt(maxTime, 10);
      if (!isNaN(maxMinutes)) {
        filtered = filtered.filter(r => (r.prepTime + r.cookTime) <= maxMinutes);
      }
    }

    // Filter by author ID
    if (author) {
      filtered = filtered.filter(r => r.author && r.author.id === author);
    }

    // Compute ratings and saved status for each recipe
    const userId = req.user ? req.user.id : null;
    let results = filtered.map(r => ({
      ...r,
      averageRating: calculateAverageRating(r.reviews),
      reviewCount: r.reviews ? r.reviews.length : 0,
      isSaved: userId && Array.isArray(r.savedBy) ? r.savedBy.includes(userId) : false
    }));

    // Sorting
    if (sort === 'quickest') {
      results.sort((a, b) => (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime));
    } else if (sort === 'highest-rated') {
      results.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'popular') {
      results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Default: newest first
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/:id - Single recipe details
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found. It may have been removed.'
      });
    }

    const userId = req.user ? req.user.id : null;
    const detailed = {
      ...recipe,
      averageRating: calculateAverageRating(recipe.reviews),
      reviewCount: recipe.reviews ? recipe.reviews.length : 0,
      isSaved: userId && Array.isArray(recipe.savedBy) ? recipe.savedBy.includes(userId) : false,
      isOwner: userId && recipe.author && recipe.author.id === userId
    };

    res.json({
      success: true,
      data: detailed
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/recipes - Create a new recipe (Protected)
router.post('/', verifyToken, validateRecipe, async (req, res, next) => {
  try {
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const {
      title,
      description,
      category,
      cuisine,
      prepTime,
      cookTime,
      servings,
      image,
      ingredients,
      instructions,
      notes
    } = req.body;

    // Use placeholder photo if user didn't provide image URL
    const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
    const cleanImage = (image && typeof image === 'string' && image.startsWith('http'))
      ? image.trim()
      : defaultImage;

    const newRecipe = {
      id: `recipe-${Date.now()}`,
      title,
      description,
      category,
      cuisine,
      prepTime,
      cookTime,
      servings,
      difficulty: req.body.difficulty || 'Easy',
      image: cleanImage,
      ingredients,
      instructions,
      notes: notes || '',
      author: {
        id: req.user.id,
        name: req.user.name
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      savedBy: [],
      reviews: []
    };

    recipes.unshift(newRecipe); // Add to beginning of array
    await writeJsonFile(RECIPES_FILE, recipes);

    // Emit event
    recipeEvents.emit('recipeCreated', newRecipe);

    res.status(201).json({
      success: true,
      message: 'Recipe published successfully!',
      data: newRecipe
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/recipes/:id - Update an existing recipe (Protected, Author only)
router.put('/:id', verifyToken, validateRecipe, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const index = recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    const existing = recipes[index];

    // Check ownership
    if (existing.author && existing.author.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You can only edit recipes that you posted.'
      });
    }

    const {
      title,
      description,
      category,
      cuisine,
      prepTime,
      cookTime,
      servings,
      difficulty,
      image,
      ingredients,
      instructions,
      notes
    } = req.body;

    recipes[index] = {
      ...existing,
      title,
      description,
      category,
      cuisine,
      prepTime,
      cookTime,
      servings,
      difficulty: difficulty || existing.difficulty,
      image: (image && typeof image === 'string' && image.startsWith('http')) ? image.trim() : existing.image,
      ingredients,
      instructions,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile(RECIPES_FILE, recipes);

    res.json({
      success: true,
      message: 'Recipe updated successfully!',
      data: recipes[index]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/recipes/:id - Delete a recipe (Protected, Author only)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const index = recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    const existing = recipes[index];

    // Check ownership
    if (existing.author && existing.author.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You can only delete your own recipes.'
      });
    }

    recipes.splice(index, 1);
    await writeJsonFile(RECIPES_FILE, recipes);

    // Clean up users' savedRecipeIds
    const users = await readJsonFile(USERS_FILE, []);
    let usersUpdated = false;
    users.forEach(u => {
      if (Array.isArray(u.savedRecipeIds) && u.savedRecipeIds.includes(id)) {
        u.savedRecipeIds = u.savedRecipeIds.filter(savedId => savedId !== id);
        usersUpdated = true;
      }
    });
    if (usersUpdated) {
      await writeJsonFile(USERS_FILE, users);
    }

    res.json({
      success: true,
      message: `Recipe "${existing.title}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/recipes/:id/save - Toggle bookmarking recipe (Protected)
router.post('/:id/save', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recipes = await readJsonFile(RECIPES_FILE, []);
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!Array.isArray(recipe.savedBy)) {
      recipe.savedBy = [];
    }
    if (!Array.isArray(user.savedRecipeIds)) {
      user.savedRecipeIds = [];
    }

    const isAlreadySaved = recipe.savedBy.includes(userId);

    if (isAlreadySaved) {
      // Unsave
      recipe.savedBy = recipe.savedBy.filter(uid => uid !== userId);
      user.savedRecipeIds = user.savedRecipeIds.filter(rid => rid !== id);
    } else {
      // Save
      recipe.savedBy.push(userId);
      user.savedRecipeIds.push(id);
    }

    await writeJsonFile(RECIPES_FILE, recipes);
    await writeJsonFile(USERS_FILE, users);

    res.json({
      success: true,
      isSaved: !isAlreadySaved,
      message: !isAlreadySaved ? 'Recipe added to your saved list!' : 'Recipe removed from your saved list.',
      totalSaves: recipe.savedBy.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
