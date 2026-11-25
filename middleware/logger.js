/**
 * Request Logger Middleware
 * Demonstrates custom Express middleware, request inspection, and timing.
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Hook into response finish event to calculate request duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = requestLogger;
