# SavorSpace — Student Recipe Sharing Community Platform

A clean, beginner-level Recipe Sharing Community web application developed for the **Full-Stack Web Development Course**.

Designed with a warm, natural aesthetic (cream backgrounds, muted sage green accents, clean typography) to feel like an authentic student project.

---

## 📖 Project Overview

SavorSpace demonstrates the core concepts of building a full-stack recipe-sharing website:
- **Homepage**: Clean navigation, search, and a grid of community-submitted recipes.
- **Recipe Browsing**: Search by name/ingredients and filter by category (Breakfast, Lunch, Dinner, Dessert) and cooking time.
- **Recipe Detail View**: Ingredients list with interactive checkboxes, step-by-step cooking instructions, and user reviews.
- **Add Recipe**: A straightforward form with dynamic rows for ingredients and cooking steps.
- **Saved Recipes**: Personal list of bookmarked recipes.
- **User Authentication**: Basic login and registration using JSON Web Tokens (JWT) and bcrypt password hashing.
- **Syllabus Topics Page (`/syllabus.html`)**: A concise summary of course concepts and how they are demonstrated in the project.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5 Semantic Elements, CSS3 (Flexbox & Grid), Vanilla JavaScript (ES6+), Fetch API |
| **Styling** | Custom Vanilla CSS (clean cream `#fbf9f4` & sage green `#335946` color palette) |
| **Backend** | Node.js, Express.js, CommonJS modules (`require` / `module.exports`) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Storage** | Node.js File System (`fs.promises`, `path`), JSON data files |
| **Testing** | Automated API test suite (`npm test`) |

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Open your browser and visit: **`http://localhost:3000`**

### 3. Run Automated Tests
```bash
npm test
```

---

## 📚 Syllabus Concepts Demonstrated

- **HTML5 & Semantic Structure**: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- **CSS Layouts**: CSS Grid for recipe cards, Flexbox for navbars and form controls. Responsive with media queries.
- **JavaScript & DOM**: Event listeners, dynamic row generation for ingredients and steps, and interactive checkbox toggles.
- **Asynchronous Fetch API**: Client scripts use `async/await` and `fetch()` to load and submit recipes without full-page reloads.
- **Node.js & Express**: Express application structure, custom request logging middleware, static file serving, and route parameters.
- **REST APIs & JSON Persistence**: Structured endpoints (`GET /api/recipes`, `POST /api/recipes`, etc.) storing data in JSON files with `fs.promises`.

---

## 📁 Project Structure

```
Recipe Sharing Community/
├── config/
│   └── constants.js             # Configuration, port, and file paths
├── data/
│   ├── recipes.json             # Persistent recipes store
│   └── users.json               # Hashed student accounts & bookmarks
├── middleware/
│   ├── auth.js                  # JWT token verification
│   ├── errorHandler.js          # Centralized error handlers
│   ├── logger.js                # Request logging middleware
│   └── validate.js              # Request validation & sanitization
├── routes/
│   ├── authRoutes.js            # Authentication routes (/api/auth)
│   ├── recipeRoutes.js          # Recipe CRUD routes (/api/recipes)
│   ├── reviewRoutes.js          # Review routes (/api/recipes/:id/reviews)
│   └── syllabusRoutes.js        # Syllabus concept routes (/api/syllabus)
├── services/
│   ├── eventService.js          # Node.js EventEmitter implementation
│   └── fileStorage.js           # Safe fs.promises read/write helpers
├── test/
│   └── api-test.js              # Automated test suite
├── public/                      # Frontend Assets
│   ├── index.html               # Homepage
│   ├── explore.html             # Recipe catalog and search filters
│   ├── recipe.html              # Recipe details and reviews
│   ├── add-recipe.html          # Add recipe form
│   ├── edit-recipe.html         # Edit recipe form
│   ├── saved.html               # Saved recipes page
│   ├── login.html               # Student login and registration
│   ├── syllabus.html            # Course syllabus topics summary
│   ├── css/
│   │   ├── style.css            # Core stylesheet
│   │   └── components.css       # Recipe cards, buttons, forms
│   └── js/
│       ├── api.js               # Fetch API client
│       ├── auth.js              # Auth state & card rendering helper
│       ├── main.js              # Homepage script
│       ├── explore.js           # Search and filter script
│       ├── recipe-detail.js     # Recipe detail script
│       ├── add-recipe.js        # Add recipe form script
│       └── saved.js             # Saved recipes script
├── server.js                    # Express app entry point
├── package.json                 # Project configuration
└── README.md                    # Project documentation
```
