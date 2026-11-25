/**
 * SavorSpace - Automated API Test Suite
 * Built for College Web Development Lab Project
 * 
 * Demonstrates: API testing, Assertions, Fetch API, Async/Await,
 * Status code checks, and JSON response verification.
 * 
 * Run with: npm test
 */

const assert = require('assert');
const { app } = require('../server');
const http = require('http');

let serverInstance;
let PORT = 3099; // Test port to avoid conflict
let BASE_URL = `http://localhost:${PORT}`;

let authToken = '';
let testRecipeId = '';

async function runTests() {
  console.log('\n--- Starting SavorSpace API Test Suite ---\n');
  let passed = 0;
  let failed = 0;

  // Helper test runner
  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      resolve();
    });
  });

  try {
    // Test 1: Health check
    await test('GET /api/health should return status 200 and healthy status', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.project, 'SavorSpace Recipe Sharing Community');
    });

    // Test 2: Get all recipes
    await test('GET /api/recipes should return recipe list with count', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 1);
    });

    // Test 3: Search and Filter query parameters
    await test('GET /api/recipes?cuisine=Italian should filter recipes correctly', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes?cuisine=Italian`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.every(r => r.cuisine.toLowerCase() === 'italian'));
    });

    // Test 4: Demo user login to acquire JWT token
    await test('POST /api/auth/login with valid credentials returns JWT token', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'aarav@college.edu',
          password: 'password123'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.strictEqual(data.user.email, 'aarav@college.edu');
      authToken = data.token;
    });

    // Test 5: Verify protected route /api/auth/me
    await test('GET /api/auth/me with Bearer token returns current user profile', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.name, 'Aarav Sharma');
    });

    // Test 6: Auth protection - creating recipe without token must return 401
    await test('POST /api/recipes without auth token must be rejected with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Recipe' })
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // Test 7: Create recipe with auth token
    await test('POST /api/recipes with valid auth token creates a recipe', async () => {
      const payload = {
        title: 'Student Test Scrambled Eggs',
        description: 'A super fast 5-minute scrambled egg test recipe.',
        category: 'Breakfast',
        cuisine: 'American',
        prepTime: 2,
        cookTime: 5,
        servings: 1,
        difficulty: 'Easy',
        ingredients: ['2 eggs', '1 tbsp butter', 'Pinch of salt'],
        instructions: ['Crack eggs into bowl and whisk.', 'Melt butter in pan and pour eggs.', 'Stir gently until soft curds form.']
      };

      const res = await fetch(`${BASE_URL}/api/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.id);
      testRecipeId = data.data.id;
    });

    // Test 8: Save and unsave recipe toggle
    await test('POST /api/recipes/:id/save toggles bookmark status', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes/${testRecipeId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.isSaved, true);
    });

    // Test 9: Add review to recipe
    await test('POST /api/recipes/:id/reviews posts a review and updates average rating', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes/${testRecipeId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Cooked this in 5 minutes flat, perfectly fluffy!'
        })
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.averageRating, 5);
    });

    // Test 10: Clean up test recipe (DELETE)
    await test('DELETE /api/recipes/:id deletes the created test recipe', async () => {
      const res = await fetch(`${BASE_URL}/api/recipes/${testRecipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    // Test 11: Syllabus Buffer & EventEmitter endpoints
    await test('GET /api/syllabus/buffer-demo returns binary buffer demonstration', async () => {
      const res = await fetch(`${BASE_URL}/api/syllabus/buffer-demo`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.encodings.base64);
    });

    await test('GET /api/syllabus/events-demo returns EventEmitter log', async () => {
      const res = await fetch(`${BASE_URL}/api/syllabus/events-demo`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.eventLog.length, 3);
    });

  } finally {
    // Close server
    serverInstance.close();
  }

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
