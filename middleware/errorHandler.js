/**
 * Centralized Error Handling Middleware
 * Demonstrates Express 4-argument error handler (err, req, res, next)
 * and 404 Not Found route handler.
 */

// 404 Not Found handler for unmatched routes
function notFoundHandler(req, res, next) {
  // If it's an API request, return JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  }
  
  // For web requests, pass to next or return a friendly message
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>404 - Page Not Found | SavorSpace</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;background:#fbf9f4;">
      <div style="max-width:500px;padding:32px;background:#fff;border-radius:12px;border:1px solid #e8e3d9;">
        <h1 style="color:#2d4d3f;font-size:2rem;margin-bottom:12px;">Page Not Found (404)</h1>
        <p style="color:#555;margin-bottom:24px;">Sorry, the recipe or page you are looking for does not exist.</p>
        <a href="/" class="btn btn-primary" style="display:inline-block;padding:10px 20px;background:#3a6351;color:#fff;text-decoration:none;border-radius:6px;">Back to Homepage</a>
      </div>
    </body>
    </html>
  `);
}

// Global 500 Internal Error handler
function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
