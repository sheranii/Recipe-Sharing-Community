/**
 * SavorSpace - API Client Module
 * Demonstrates: Fetch API, Promises, async/await, Bearer Authorization,
 * query string construction, and robust error handling.
 */

const API_BASE = '/api';

const API = {
  // Helper to retrieve saved auth token
  getToken() {
    return localStorage.getItem('savorspace_token');
  },

  // Helper to set or clear auth token
  setToken(token) {
    if (token) {
      localStorage.setItem('savorspace_token', token);
    } else {
      localStorage.removeItem('savorspace_token');
    }
  },

  // Core fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.message || `Request failed with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.errors = data.errors;
        throw err;
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  // Recipe Endpoints
  async getRecipes(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/recipes${queryString}`);
  },

  async getFeaturedRecipes() {
    return this.request('/recipes/featured');
  },

  async getCategories() {
    return this.request('/recipes/categories');
  },

  async getRecipeById(id) {
    return this.request(`/recipes/${id}`);
  },

  async createRecipe(recipeData) {
    return this.request('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData)
    });
  },

  async updateRecipe(id, recipeData) {
    return this.request(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData)
    });
  },

  async deleteRecipe(id) {
    return this.request(`/recipes/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleSaveRecipe(id) {
    return this.request(`/recipes/${id}/save`, {
      method: 'POST'
    });
  },

  async getMySavedRecipes() {
    return this.request('/recipes/saved/my-saved');
  },

  async postReview(recipeId, reviewData) {
    return this.request(`/recipes/${recipeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Auth Endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
      localStorage.setItem('savorspace_user', JSON.stringify(res.user));
    }
    return res;
  },

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.token) {
      this.setToken(res.token);
      localStorage.setItem('savorspace_user', JSON.stringify(res.user));
    }
    return res;
  },

  async getCurrentUser() {
    return this.request('/auth/me');
  },

  async getDemoUsers() {
    return this.request('/auth/demo-users');
  },

  logout() {
    this.setToken(null);
    localStorage.removeItem('savorspace_user');
  }
};

window.API = API;
