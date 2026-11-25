const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { RECIPES_FILE } = require('../config/constants');

/**
 * Syllabus Concept Demonstration Routes
 * Clean learning examples for syllabus concepts:
 * - Node.js Streams (Readable, Writable, Piping)
 * - Node.js Buffers (Binary memory allocation, encoding, string conversions)
 * - Node.js EventEmitter (Custom event emitters and listeners)
 * - Node.js File System & Path (fs.stat, path methods)
 */

// 1. Streams Demo: Demonstrates reading files as a chunked stream and piping to response
router.get('/stream-demo', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="recipe-catalog-stream.txt"');

  // Create a readable stream from the recipes file
  const readStream = fs.createReadStream(RECIPES_FILE, {
    encoding: 'utf8',
    highWaterMark: 1024 // 1KB chunk size to demonstrate streaming
  });

  res.write('=== Node.js Streams Demonstration (College Web Tech Lab) ===\n');
  res.write('Status: Streaming data in chunks using fs.createReadStream & res.write\n');
  res.write('------------------------------------------------------------\n\n');

  readStream.on('data', (chunk) => {
    // Write each received chunk to the HTTP response stream
    res.write(chunk);
  });

  readStream.on('end', () => {
    res.write('\n\n------------------------------------------------------------\n');
    res.write('=== Stream transmission finished successfully. ===\n');
    res.end();
  });

  readStream.on('error', (err) => {
    console.error('Stream read error:', err);
    res.status(500).end('Error occurred while streaming file content.');
  });
});

// 2. Buffers Demo: Demonstrates creating, converting, and analyzing binary buffers
router.get('/buffer-demo', (req, res) => {
  // Demonstration string
  const text = 'SavorSpace: College Full-Stack Lab Project 2026';

  // Create buffer from UTF-8 string
  const bufUtf8 = Buffer.from(text, 'utf8');

  // Convert buffer to Base64 and Hexadecimal encodings
  const base64String = bufUtf8.toString('base64');
  const hexString = bufUtf8.toString('hex');

  // Allocate a blank buffer and write into it
  const allocatedBuf = Buffer.alloc(16);
  allocatedBuf.write('Node.js Buffers');

  // Concatenate two buffers
  const bufA = Buffer.from('Fresh ');
  const bufB = Buffer.from('Ingredients');
  const combined = Buffer.concat([bufA, bufB]);

  res.json({
    success: true,
    topic: 'Node.js Buffers (Binary Data Handling)',
    originalText: text,
    bufferLengthBytes: bufUtf8.length,
    rawBytesArray: Array.from(bufUtf8),
    encodings: {
      base64: base64String,
      hex: hexString
    },
    allocatedBufferExample: {
      size: allocatedBuf.length,
      contentString: allocatedBuf.toString('utf8').replace(/\0/g, '')
    },
    concatenatedBufferExample: {
      result: combined.toString('utf8')
    },
    explanation: 'Buffers represent raw binary memory allocated outside the V8 heap. Node uses them for file I/O, network streams, and cryptographic operations.'
  });
});

// 3. EventEmitter Demo: Demonstrates pub-sub event driven architecture
router.get('/events-demo', (req, res) => {
  const labEmitter = new EventEmitter();
  const eventLog = [];

  // Register listeners
  labEmitter.on('cookStarted', (data) => {
    eventLog.push({ step: 1, event: 'cookStarted', message: `Cooking started for "${data.recipeName}"` });
  });

  labEmitter.on('spiceAdded', (data) => {
    eventLog.push({ step: 2, event: 'spiceAdded', message: `Added ${data.spices.join(', ')} to the pot` });
  });

  labEmitter.on('cookFinished', (data) => {
    eventLog.push({ step: 3, event: 'cookFinished', message: `Done! Served hot after ${data.minutes} minutes.` });
  });

  // Emit events in sequence
  labEmitter.emit('cookStarted', { recipeName: 'Creamy Garlic Pasta' });
  labEmitter.emit('spiceAdded', { spices: ['Minced Garlic', 'Chili Flakes', 'Black Pepper'] });
  labEmitter.emit('cookFinished', { minutes: 20 });

  res.json({
    success: true,
    topic: 'Node.js EventEmitter (Event-Driven Architecture)',
    explanation: 'EventEmitter enables loose coupling where emitters trigger named events that invoke attached listener functions asynchronously.',
    eventLog
  });
});

// 4. File System & Path Demo
router.get('/fs-demo', (req, res) => {
  const resolvedPath = path.resolve(RECIPES_FILE);
  const fileStats = fs.statSync(RECIPES_FILE);

  res.json({
    success: true,
    topic: 'Node.js File System (fs) & Path Modules',
    filePath: resolvedPath,
    filename: path.basename(resolvedPath),
    extension: path.extname(resolvedPath),
    directory: path.dirname(resolvedPath),
    fileSizeBytes: fileStats.size,
    lastModified: fileStats.mtime,
    isNormalFile: fileStats.isFile(),
    explanation: 'Node.js path module normalizes file separators across Windows and Linux. fs module provides both synchronous and asynchronous file system operations.'
  });
});

// 5. Complete Syllabus Concepts Mapping
router.get('/concepts', (req, res) => {
  res.json({
    project: 'SavorSpace Recipe Sharing Community',
    syllabusCoverage: [
      {
        concept: 'HTML5 Semantic Elements',
        location: 'public/*.html (<header>, <nav>, <main>, <section>, <article>, <footer>)',
        description: 'Clean semantic structure used across all 6 pages.'
      },
      {
        concept: 'CSS3 Box Model, Flexbox & Grid',
        location: 'public/css/style.css & components.css',
        description: 'Responsive CSS grid for recipe cards, flexbox for navbar, forms, and filters without external CSS frameworks.'
      },
      {
        concept: 'DOM Manipulation & Event Listeners',
        location: 'public/js/*.js',
        description: 'document.querySelector, addEventListener, dynamic list item addition/removal for ingredients and instructions.'
      },
      {
        concept: 'ES6 Features',
        location: 'Frontend & Backend code',
        description: 'Arrow functions, destructuring ({ title, prepTime }), template literals (`...`), spread/rest operators (...recipes), const/let.'
      },
      {
        concept: 'Promises, Async/Await & Fetch API',
        location: 'public/js/api.js, services/fileStorage.js, routes/*.js',
        description: 'Asynchronous API requests with fetch(), error catching with try/catch, async/await used across all route handlers.'
      },
      {
        concept: 'Node.js & CommonJS Modules',
        location: 'server.js, config/constants.js, routes/*.js',
        description: 'Modular architecture using require() and module.exports.'
      },
      {
        concept: 'File System (fs) & Path',
        location: 'services/fileStorage.js, routes/syllabusRoutes.js',
        description: 'Reading/writing JSON databases with fs.promises and path.join for cross-platform file paths.'
      },
      {
        concept: 'Streams & Buffers',
        location: 'routes/syllabusRoutes.js (/stream-demo, /buffer-demo)',
        description: 'Chunked HTTP file streaming with createReadStream and Buffer allocations.'
      },
      {
        concept: 'EventEmitter',
        location: 'services/eventService.js & routes/syllabusRoutes.js',
        description: 'Custom event emitter triggering notifications on recipe publication and review posting.'
      },
      {
        concept: 'Express Routing & CRUD Operations',
        location: 'routes/recipeRoutes.js, routes/authRoutes.js, routes/reviewRoutes.js',
        description: 'GET, POST, PUT, DELETE endpoints with express.Router().'
      },
      {
        concept: 'Route & Query Parameters',
        location: 'routes/recipeRoutes.js (:id for route param, ?search=&category= for query params)',
        description: 'Dynamic URL parameters and query string filtering.'
      },
      {
        concept: 'Express Middleware',
        location: 'middleware/logger.js, middleware/auth.js, middleware/validate.js, middleware/errorHandler.js',
        description: 'Custom request logging, JWT verification, validation/sanitization, and 404/500 error handlers.'
      },
      {
        concept: 'JWT Authentication & Password Hashing',
        location: 'routes/authRoutes.js, middleware/auth.js',
        description: 'Bcrypt salt hashing (10 rounds) and signed JSON Web Tokens for secure session management.'
      },
      {
        concept: 'API Testing',
        location: 'test/api-test.js',
        description: 'Automated test suite verifying REST API endpoints, auth checks, and error cases.'
      }
    ]
  });
});

module.exports = router;
