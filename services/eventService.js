const EventEmitter = require('events');

/**
 * Event Service
 * Demonstrates Node.js core 'events' module (EventEmitter).
 * Used for loose coupling and notifying subsystems when important actions occur.
 */
class RecipeEventEmitter extends EventEmitter {}

const recipeEvents = new RecipeEventEmitter();

// Event Listener 1: Log when a new recipe is published
recipeEvents.on('recipeCreated', (recipe) => {
  console.log(`[Event: recipeCreated] New recipe posted: "${recipe.title}" by ${recipe.author.name} (ID: ${recipe.id})`);
});

// Event Listener 2: Log when a review is added
recipeEvents.on('reviewAdded', ({ recipeId, review }) => {
  console.log(`[Event: reviewAdded] Recipe ${recipeId} received a ${review.rating}-star review from ${review.userName}`);
});

// Event Listener 3: Log user registration
recipeEvents.on('userRegistered', (user) => {
  console.log(`[Event: userRegistered] New student joined SavorSpace: ${user.name} (${user.email})`);
});

module.exports = recipeEvents;
