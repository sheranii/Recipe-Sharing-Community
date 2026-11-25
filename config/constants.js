const path = require('path');

// SavorSpace Application Constants and Configuration
module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'savorspace-super-secret-key-college-demo-2026',
  JWT_EXPIRES_IN: '7d',
  DATA_DIR: path.join(__dirname, '..', 'data'),
  RECIPES_FILE: path.join(__dirname, '..', 'data', 'recipes.json'),
  USERS_FILE: path.join(__dirname, '..', 'data', 'users.json')
};
