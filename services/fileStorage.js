const fs = require('fs').promises;
const path = require('path');

/**
 * File Storage Helper
 * Demonstrates Node.js 'fs' (file system) and 'path' module usage for data persistence.
 * Safe file reading and writing with automatic directory creation.
 */

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file does not exist, initialize it with defaultValue
    if (err.code === 'ENOENT') {
      await ensureDirectoryExists(path.dirname(filePath));
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    throw err;
  }
}

async function writeJsonFile(filePath, data) {
  await ensureDirectoryExists(path.dirname(filePath));
  // Format with 2 spaces for human-readable JSON files
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData, 'utf8');
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
