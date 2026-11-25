const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

/**
 * Authentication Middleware
 * Demonstrates JWT (JSON Web Tokens) verification, HTTP headers inspection,
 * and protecting REST API routes.
 */

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.'
    });
  }

  // Expecting format: "Bearer <token>"
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format should be: Bearer <token>'
    });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload (id, email, name) to request object
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.'
    });
  }
}

/**
 * Optional Auth Middleware
 * Attaches user to req if token exists, but doesn't block unauthenticated guests.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore token errors for optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = {
  verifyToken,
  optionalAuth
};
