/**
 * SavorSpace - Recipe Sharing Community Platform
 * Main Server Entry Point
 * 
 * Built with Node.js & Express for College Web Development Project
 * Demonstrates: CommonJS modules, Express middleware, REST APIs, Static file serving,
 * Error handling, and JSON persistence.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// Import configuration
const { PORT } = require('./config/constants');

// Import custom middleware
const requestLogger = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import modular route handlers
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');

// Initialize Express application
const app = express();

// Core Middleware
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json()); // Built-in middleware for parsing application/json
app.use(express.urlencoded({ extended: true })); // Middleware for URL-encoded forms
app.use(requestLogger); // Custom request logging middleware

// Serve static frontend files (HTML, CSS, Client JS, Images) from /public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/recipes', reviewRoutes); // Mounts /api/recipes/:id/reviews
app.use('/api/syllabus', syllabusRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'SavorSpace Recipe Sharing Community',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 404 Not Found Handler
app.use(notFoundHandler);

// Global Error Handler (must be defined last)
app.use(errorHandler);

// Start the HTTP server only when run directly (not when required for testing)
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(` SavorSpace Recipe Community Server Running!`);
    console.log(` Web App:      http://localhost:${PORT}`);
    console.log(` Explore:      http://localhost:${PORT}/explore.html`);
    console.log(` Add Recipe:   http://localhost:${PORT}/add-recipe.html`);
    console.log(` Syllabus Hub: http://localhost:${PORT}/syllabus.html`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/recipes`);
    console.log('====================================================');
  });
}

module.exports = { app, server };
