/**
 * Input Validation & Sanitization Middleware
 * Demonstrates request sanitization, data integrity checks, and descriptive error messages.
 */

// Simple HTML escaping to sanitize against stored XSS in user submissions
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, ''); // Strip dangerous bracket characters
}

// Validation for Recipe Creation / Update
function validateRecipe(req, res, next) {
  const { title, description, category, cuisine, prepTime, cookTime, servings, ingredients, instructions } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Recipe title must be at least 3 characters long.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long.');
  }

  if (!category || typeof category !== 'string') {
    errors.push('Please select a valid recipe category.');
  }

  if (!cuisine || typeof cuisine !== 'string') {
    errors.push('Please select or specify a cuisine.');
  }

  const parsedPrep = parseInt(prepTime, 10);
  if (isNaN(parsedPrep) || parsedPrep < 0) {
    errors.push('Prep time must be a non-negative number of minutes.');
  }

  const parsedCook = parseInt(cookTime, 10);
  if (isNaN(parsedCook) || parsedCook < 0) {
    errors.push('Cook time must be a non-negative number of minutes.');
  }

  const parsedServings = parseInt(servings, 10);
  if (isNaN(parsedServings) || parsedServings < 1) {
    errors.push('Servings must be at least 1.');
  }

  if (!Array.isArray(ingredients) || ingredients.filter(i => typeof i === 'string' && i.trim().length > 0).length < 2) {
    errors.push('Please provide at least 2 ingredients.');
  }

  if (!Array.isArray(instructions) || instructions.filter(s => typeof s === 'string' && s.trim().length > 0).length < 2) {
    errors.push('Please provide at least 2 instruction steps.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the errors and try again.',
      errors
    });
  }

  // Sanitize fields before passing to controllers
  req.body.title = sanitizeString(title);
  req.body.description = sanitizeString(description);
  req.body.category = sanitizeString(category);
  req.body.cuisine = sanitizeString(cuisine);
  req.body.prepTime = parsedPrep;
  req.body.cookTime = parsedCook;
  req.body.servings = parsedServings;
  req.body.ingredients = ingredients.map(i => sanitizeString(i)).filter(Boolean);
  req.body.instructions = instructions.map(s => sanitizeString(s)).filter(Boolean);
  if (req.body.notes) {
    req.body.notes = sanitizeString(req.body.notes);
  }

  next();
}

// Validation for User Registration
function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Registration validation failed.',
      errors
    });
  }

  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();
  if (req.body.bio) {
    req.body.bio = sanitizeString(req.body.bio);
  }

  next();
}

// Validation for User Login
function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

// Validation for Recipe Review
function validateReview(req, res, next) {
  const { rating, comment } = req.body;
  const parsedRating = parseInt(rating, 10);

  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be a whole number between 1 and 5 stars.'
    });
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Please write a review comment with at least 4 characters.'
    });
  }

  req.body.rating = parsedRating;
  req.body.comment = sanitizeString(comment);
  next();
}

module.exports = {
  validateRecipe,
  validateRegister,
  validateLogin,
  validateReview,
  sanitizeString
};
