const express = require('express');
const router = express.Router({ mergeParams: true });
const { RECIPES_FILE } = require('../config/constants');
const { readJsonFile, writeJsonFile } = require('../services/fileStorage');
const { verifyToken } = require('../middleware/auth');
const { validateReview } = require('../middleware/validate');
const recipeEvents = require('../services/eventService');

/**
 * Review Routes
 * Handles submitting student reviews and ratings for recipes.
 */

// POST /api/recipes/:id/reviews - Add a review to a recipe
router.post('/:id/reviews', verifyToken, validateReview, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const recipes = await readJsonFile(RECIPES_FILE, []);
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    if (!Array.isArray(recipe.reviews)) {
      recipe.reviews = [];
    }

    // Optional: check if user already reviewed this recipe
    const existingIndex = recipe.reviews.findIndex(r => r.userId === req.user.id);

    const newReview = {
      id: `rev-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing review
      recipe.reviews[existingIndex] = newReview;
    } else {
      // Add new review at top
      recipe.reviews.unshift(newReview);
    }

    await writeJsonFile(RECIPES_FILE, recipes);

    // Emit event
    recipeEvents.emit('reviewAdded', { recipeId: id, review: newReview });

    // Calculate updated average
    const sum = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / recipe.reviews.length).toFixed(1));

    res.status(201).json({
      success: true,
      message: existingIndex !== -1 ? 'Your review has been updated!' : 'Review posted successfully!',
      review: newReview,
      averageRating: avg,
      reviewCount: recipe.reviews.length
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/:id/reviews - Get all reviews for a recipe
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipes = await readJsonFile(RECIPES_FILE, []);
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    res.json({
      success: true,
      data: recipe.reviews || []
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
