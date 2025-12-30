# 🚀 REST APIs: Zero-to-Hero Complete Guide

---

## 1️⃣ The Basics (What & Why?)

### 🤔 What is a REST API?

**REST** (Representational State Transfer) is an **architectural style** for designing networked applications. Think of it as a set of rules/best practices for how your server and client should communicate.

**Simple analogy:** Imagine a restaurant 🍽️
- **Client (You)** = Customer who orders food
- **Server** = Kitchen that prepares food
- **REST API** = The menu & waiter system (standardized way to order)
- **HTTP Methods** = Types of requests (Order, Cancel, Modify)
- **JSON/Data** = The food that comes back to you

**Why REST?**
- ✅ **Platform Independent**: Same API works for web, mobile, IoT devices
- ✅ **Scalable**: Server and client can be updated independently
- ✅ **Stateless**: Each request is independent (no session baggage)
- ✅ **Cacheable**: Responses can be cached for better performance

---

### 🆚 Comparison: REST vs Other Approaches

| Feature | REST API | GraphQL | SOAP | Traditional Server (SSR) |
|---------|----------|---------|------|--------------------------|
| **Data Format** | JSON/XML | JSON | XML | HTML |
| **Flexibility** | Fixed endpoints | Query exactly what you need | Rigid structure | No API, direct rendering |
| **Learning Curve** | Easy | Medium | Complex | Easy |
| **Use Case** | Mobile + Web apps | Complex data needs | Enterprise/Banking | Only browsers |
| **Performance** | Good | Optimized queries | Slower (XML overhead) | Fast for browsers only |

**Example Scenario:**
```
Traditional SSR (Old Way):
Browser requests → Server renders HTML → Sends full page
❌ Mobile app can't use this!

REST API (Modern Way):
Any device requests → Server sends JSON → Device decides how to display
✅ Works everywhere!
```

---

## 2️⃣ Line-by-Line Code Breakdown

### 📦 **Initial Setup**

```javascript
const express = require("express")
const app = express()
const fs = require("fs")
const users = require('./MOCK_DATA.json')
const { json } = require("stream/consumers")

const Port = 8000
```

**What's happening:**
- `express`: Web framework to handle HTTP requests/responses
- `app`: Your application instance (the server)
- `fs`: File system module to read/write files
- `users`: Mock data array loaded from JSON file (simulating database)
- `Port 8000`: Where your server listens for requests

**Intent:** Setting up dependencies and loading data that will act as our "database"

---

### 🔧 **Middleware Configuration**

```javascript
app.use(express.urlencoded({extended: false}))
```

**What's happening:**
- `express.urlencoded()`: Middleware to parse incoming request bodies
- `extended: false`: Uses `querystring` library (simpler, for flat data)

**Why this is critical:**
Without this, when you do `req.body` in POST requests, you'll get **undefined**!

```javascript
// Without middleware:
req.body → undefined ❌

// With middleware:
req.body → { first_name: "John", email: "john@example.com" } ✅
```

**Real scenario:**
When a mobile app sends: `{ "name": "Alice", "email": "alice@gmail.com" }`
This middleware **parses it** so you can access it via `req.body.name`

---

### 🌐 **SSR Route (Server-Side Rendering)**

```javascript
app.get('/user' , (req,res) => {
    const html = `
    <ul>
        ${users.map(user => `
        <li>${user.first_name}</li>
        <li>${user.last_name}</li>
        <li>${user.email}</li>
        <li>${user.gender}</li>
        <li>${user.job_title}</li>
        `).join("")}
    </ul>
    `;
    res.send(html)
})
```

**Line-by-line logic:**

1. `app.get('/user', ...)`: Listen for GET requests on `/user` endpoint
2. `const html = \`...\``: Create HTML string using template literals
3. `users.map(user => ...)`: Loop through each user and generate `<li>` tags
4. `.join("")`: Convert array to single HTML string
5. `res.send(html)`: Send HTML back to browser

**Intent:**
This is **ONLY for browsers**. When you visit `http://localhost:8000/user` in Chrome, you see a formatted list.

**Problem with this approach:**
```
❌ Mobile app gets HTML → Can't parse it easily
❌ React app gets HTML → Has to extract data from markup
❌ Tight coupling → If you change HTML, mobile apps break
```

---

### 🔌 **REST API Route (JSON Response)**

```javascript
app.get('/api/user', (req,res) => {
    res.json(users)
})
```

**What's happening:**
- `res.json(users)`: Converts JavaScript array to JSON and sends it
- Headers automatically set to `Content-Type: application/json`

**Response looks like:**
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
]
```

**Why JSON?**
- ✅ Mobile app can parse it
- ✅ React can use it
- ✅ Any programming language understands JSON
- ✅ Lightweight (no HTML tags overhead)

---

### 🎯 **Dynamic Route Parameters**

```javascript
app.get("/api/user/:id", (req,res) => {
    const id = Number(req.params.id)
    const user = users.find((user) => user.id === id)
    return res.json(user)
})
```

**Line-by-line:**

1. `/:id`: Dynamic parameter in URL (e.g., `/api/user/5`)
2. `req.params.id`: Extracts `id` from URL (always a **string**)
3. `Number(req.params.id)`: Converts string to number for comparison
4. `users.find(...)`: Search array for user with matching ID
5. `res.json(user)`: Return single user object

**Example requests:**
```
GET /api/user/1  → Returns user with id: 1
GET /api/user/42 → Returns user with id: 42
GET /api/user/abc → Returns undefined (no user found)
```

**Critical detail:** `req.params.id` is **always a string**, even if URL is `/api/user/5`. That's why we convert it!

---

### ✍️ **POST Route (Create User)**

```javascript
app.post("/api/user" , (req,res) => {
    const body = req.body // Data from frontend
    users.push({...body, id: users.length + 1});
    fs.writeFile('./MOCK_DATA.json', JSON.stringify(users), (err,data) => {
        try {
            return res.json({status: "success" , id: users.length})
        } catch (err) {
            console.error(err)
        }
    })
})
```

**Step-by-step logic:**

1. `req.body`: Contains data sent from client (e.g., `{ first_name: "Alice", email: "alice@gmail.com" }`)
2. `users.push({...body, id: users.length + 1})`: 
   - `...body`: Spread operator copies all fields from `req.body`
   - `id: users.length + 1`: Auto-generate new ID
3. `fs.writeFile(...)`: Save updated array back to JSON file
4. `JSON.stringify(users)`: Convert JavaScript array to JSON string
5. Return success response with new user's ID

**Real-world flow:**
```
Mobile App sends →  { "first_name": "Alice", "email": "alice@gmail.com" }
                     ↓
Server receives →   req.body = { first_name: "Alice", email: "alice@gmail.com" }
                     ↓
Add ID →            { first_name: "Alice", email: "alice@gmail.com", id: 101 }
                     ↓
Save to file →      MOCK_DATA.json updated
                     ↓
Response →          { "status": "success", "id": 101 }
```

---

### 🔗 **Route Grouping (Same Path, Different Methods)**

```javascript
app.route("/api/user/:id")
    .get((req,res) => {
        const id = Number(req.params.id)
        const user = users.find((user) => user.id === id)
        return res.json(user)
    })
    .put((req,res) => {})
    .delete((req,res) => {})
```

**Why group routes?**
Instead of writing:
```javascript
app.get("/api/user/:id", ...)
app.put("/api/user/:id", ...)
app.delete("/api/user/:id", ...)
```

You write it **once** with `.route()` and chain methods.

**Benefits:**
- ✅ Cleaner code
- ✅ Less repetition
- ✅ Easy to see all operations on same resource

---

### 🚀 **Server Start**

```javascript
app.listen(Port, () => {
    console.log(`App started at port ${Port}`);
})
```

**What happens:**
- Server starts listening on port 8000
- Now you can make requests to `http://localhost:8000`

---

## 3️⃣ Visual Flow Diagrams

### 📊 **Request Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ Browser  │   │  Mobile  │   │  React   │   │   IoT    │    │
│  │          │   │   App    │   │   App    │   │  Device  │    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘    │
└───────┼──────────────┼──────────────┼──────────────┼───────────┘
        │              │              │              │
        │  HTTP Request (GET, POST, PUT, DELETE)    │
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE LAYER                             │  │
│  │  ┌────────────────────────────────────────────────┐      │  │
│  │  │  app.use(express.urlencoded())                 │      │  │
│  │  │  → Parses incoming request body                │      │  │
│  │  └────────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 ROUTING LAYER                             │  │
│  │                                                            │  │
│  │  GET  /user          → SSR (HTML Response)               │  │
│  │  GET  /api/user      → JSON (All Users)                  │  │
│  │  GET  /api/user/:id  → JSON (Single User)                │  │
│  │  POST /api/user      → Create User                       │  │
│  │  PUT  /api/user/:id  → Update User                       │  │
│  │  DELETE /api/user/:id → Delete User                      │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CONTROLLER/HANDLER                           │  │
│  │  • Process request                                        │  │
│  │  • Interact with data (users array)                      │  │
│  │  • Prepare response                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 DATA LAYER                                │  │
│  │  ┌────────────────────────────────────────┐              │  │
│  │  │   MOCK_DATA.json (File System)         │              │  │
│  │  │   (In production: MongoDB, PostgreSQL) │              │  │
│  │  └────────────────────────────────────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│                      RESPONSE                                    │
│              (HTML or JSON based on route)                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  HTTP Response │
                    │  Status: 200   │
                    │  Body: Data    │
                    └───────────────┘
```

---

### 🔄 **POST Request Flow (Create User)**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Client sends POST request                               │
│                                                                  │
│  Mobile App → POST /api/user                                    │
│               Headers: { Content-Type: application/json }        │
│               Body: {                                            │
│                 "first_name": "Alice",                          │
│                 "email": "alice@gmail.com"                      │
│               }                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Middleware parses body                                   │
│                                                                  │
│  app.use(express.urlencoded())                                  │
│  ↓                                                               │
│  req.body = {                                                    │
│    first_name: "Alice",                                         │
│    email: "alice@gmail.com"                                     │
│  }                                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Route handler processes request                          │
│                                                                  │
│  const body = req.body                                           │
│  ↓                                                               │
│  users.push({                                                    │
│    ...body,              ← Spread existing fields               │
│    id: users.length + 1  ← Auto-generate ID                     │
│  })                                                              │
│  ↓                                                               │
│  users = [                                                       │
│    { id: 1, first_name: "John", ... },                          │
│    { id: 2, first_name: "Alice", email: "alice@gmail.com" } ✅  │
│  ]                                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Persist to file                                          │
│                                                                  │
│  fs.writeFile('./MOCK_DATA.json',                              │
│    JSON.stringify(users),                                       │
│    callback                                                      │
│  )                                                               │
│  ↓                                                               │
│  MOCK_DATA.json ← Updated with new user                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Send response                                            │
│                                                                  │
│  res.json({                                                      │
│    status: "success",                                           │
│    id: 2                                                         │
│  })                                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Client receives response                                 │
│                                                                  │
│  Mobile App ← { "status": "success", "id": 2 }                  │
│  ↓                                                               │
│  Display: "User created successfully!"                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🌊 **SSR vs REST API Flow**

```
════════════════════════════════════════════════════════════════
                    SSR APPROACH (Browser Only)
════════════════════════════════════════════════════════════════

Browser → GET /user
              ↓
         [Express Server]
              ↓
    Generate HTML with user.map()
              ↓
         <ul>
           <li>John</li>
           <li>Doe</li>
           <li>john@example.com</li>
         </ul>
              ↓
Browser ← Renders HTML directly
              ↓
      ❌ Mobile App can't use this!


════════════════════════════════════════════════════════════════
                   REST API APPROACH (Universal)
════════════════════════════════════════════════════════════════

Any Device → GET /api/user
              ↓
         [Express Server]
              ↓
        res.json(users)
              ↓
         [
           {
             "id": 1,
             "first_name": "John",
             "email": "john@example.com"
           }
         ]
              ↓
      ┌──────┴──────┐
      ▼             ▼
   Browser       Mobile App
      │             │
   Use React    Native UI
   to render    components
      │             │
      ✅            ✅
   Both work!
```

---

## 4️⃣ Real-World Production Examples

### 🛒 **Example 1: E-Commerce Shopping Cart API**

```javascript
const express = require("express");
const app = express();
app.use(express.json());

// Mock database
let products = [
  { id: 1, name: "iPhone 15", price: 79999, stock: 50 },
  { id: 2, name: "MacBook Pro", price: 199999, stock: 20 }
];

let cart = [];

// ✅ Get all products
app.get("/api/products", (req, res) => {
  res.json({
    success: true,
    data: products
  });
});

// ✅ Get single product
app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }
  
  res.json({ success: true, data: product });
});

// ✅ Add to cart (POST)
app.post("/api/cart", (req, res) => {
  const { productId, quantity } = req.body;
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: "Insufficient stock"
    });
  }
  
  // Add to cart
  cart.push({
    id: cart.length + 1,
    productId,
    productName: product.name,
    quantity,
    totalPrice: product.price * quantity
  });
  
  // Update stock
  product.stock -= quantity;
  
  res.status(201).json({
    success: true,
    message: "Item added to cart",
    data: cart
  });
});

// ✅ View cart (GET)
app.get("/api/cart", (req, res) => {
  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  res.json({
    success: true,
    data: {
      items: cart,
      totalAmount,
      itemCount: cart.length
    }
  });
});

// ✅ Remove from cart (DELETE)
app.delete("/api/cart/:id", (req, res) => {
  const itemId = Number(req.params.id);
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart"
    });
  }
  
  // Restore stock
  const item = cart[itemIndex];
  const product = products.find(p => p.id === item.productId);
  product.stock += item.quantity;
  
  // Remove from cart
  cart.splice(itemIndex, 1);
  
  res.json({
    success: true,
    message: "Item removed from cart"
  });
});

app.listen(3000, () => console.log("Shopping Cart API running on port 3000"));
```

**Usage:**
```bash
# Get all products
GET http://localhost:3000/api/products

# Add to cart
POST http://localhost:3000/api/cart
Body: { "productId": 1, "quantity": 2 }

# View cart
GET http://localhost:3000/api/cart

# Remove from cart
DELETE http://localhost:3000/api/cart/1
```

---

### 🔐 **Example 2: User Authentication System**

```javascript
const express = require("express");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For tokens
const app = express();
app.use(express.json());

const SECRET_KEY = "your-secret-key-here";
let users = [];

// ✅ Register new user (POST)
app.post("/api/auth/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  
  // Validation
  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User already exists"
    });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    fullName,
    createdAt: new Date()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName
    }
  });
});

// ✅ Login user (POST)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    SECRET_KEY,
    { expiresIn: "24h" }
  );
  
  res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      }
    }
  });
});

// ✅ Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    req.user = user;
    next();
  });
};

// ✅ Protected route (GET)
app.get("/api/profile", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt
    }
  });
});

app.listen(3000, () => console.log("Auth API running on port 3000"));
```

**Usage Flow:**
```bash
# 1. Register
POST http://localhost:3000/api/auth/register
Body: { "email": "alice@example.com", "password": "secret123", "fullName": "Alice Smith" }

# 2. Login
POST http://localhost:3000/api/auth/login
Body: { "email": "alice@example.com", "password": "secret123" }
Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

# 3. Access protected route
GET http://localhost:3000/api/profile
Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### 📊 **Example 3: Blog/Content Management System**

```javascript
const express = require("express");
const app = express();
app.use(express.json());

let posts = [
  {
    id: 1,
    title: "Getting Started with REST APIs",
    content: "REST APIs are amazing...",
    author: "John Doe",
    tags: ["tutorial", "backend"],
    published: true,
    createdAt: new Date("2024-01-15")
  }
];

// ✅ Get all posts (with filtering and pagination)
app.get("/api/posts", (req, res) => {
  const { published, tag, page = 1, limit = 10 } = req.query;
  
  let filteredPosts = posts;
  
  // Filter by published status
  if (published !== undefined) {
    filteredPosts = filteredPosts.filter(p => p.published === (published === "true"));
  }
  
  // Filter by tag
  if (tag) {
    filteredPosts = filteredPosts.filter(p => p.tags.includes(tag));
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedPosts,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(filteredPosts.length / limit),
      totalPosts: filteredPosts.length
    }
  });
});

// ✅ Get single post
app.get("/api/posts/:id", (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found"
    });
  }
  
  res.json({ success: true, data: post });
});

// ✅ Create new post
app.post("/api/posts", (req, res) => {
  const { title, content, author, tags } = req.body;
  
  // Validation
  if (!title || !content || !author) {
    return res.status(400).json({
      success: false,
      message: "Title, content, and author are required"
    });
  }
  
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author,
    tags: tags || [],
    published: false,
    createdAt: new Date()
  };
  
  posts.push(newPost);
  
  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: newPost
  });
});

// ✅ Update post (PATCH - partial update)
app.patch("/api/posts/:id", (req, res) => {
  const postId = Number(req.params.id);
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Post not found"
    });
  }
  
  // Update only provided fields
  posts[postIndex] = {
    ...posts[postIndex],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    message: "Post updated successfully",
    data: posts[postIndex]
  });
});

// ✅ Publish/Unpublish post (PUT - complete replacement)
app.put("/api/posts/:id/publish", (req, res) => {
  const postId = Number(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found"
    });
  }
  
  post.published = !post.published;
  post.publishedAt = post.published ? new Date() : null;
  
  res.json({
    success: true,
    message: `Post ${post.published ? "published" : "unpublished"} successfully`,
    data: post
  });
});

// ✅ Delete post
app.delete("/api/posts/:id", (req, res) => {
  const postId = Number(req.params.id);
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Post not found"
    });
  }
  
  posts.splice(postIndex, 1);
  
  res.json({
    success: true,
    message: "Post deleted successfully"
  });
});

app.listen(3000, () => console.log("Blog API running on port 3000"));
```

**Usage:**
```bash
# Get all published posts
GET http://localhost:3000/api/posts?published=true

# Get posts by tag
GET http://localhost:3000/api/posts?tag=tutorial

# Pagination
GET http://localhost:3000/api/posts?page=2&limit=5

# Create post
POST http://localhost:3000/api/posts
Body: {
  "title": "Advanced Node.js",
  "content": "...",
  "author": "Jane Doe",
  "tags": ["nodejs", "backend"]
}

# Update post (partial)
PATCH http://localhost:3000/api/posts/1
Body: { "title": "Updated Title" }

# Publish post
PUT http://localhost:3000/api/posts/1/publish

# Delete post
DELETE http://localhost:3000/api/posts/1
```

---

## 5️⃣ Best Practices & Common Pitfalls

### ✅ **Best Practices**

#### 1. **Use Proper HTTP Status Codes**
```javascript
// ✅ CORRECT
app.post("/api/user", (req, res) => {
  // Success - resource created
  res.status(201).json({ message: "User created" });
});

app.get("/api/user/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    // Not found
    return res.status(404).json({ message: "User not found" });
  }
  // Success
  res.status(200).json(user);
});

// ❌ WRONG
app.post("/api/user", (req, res) => {
  res.json({ message: "User created" }); // Missing status 201
});
```

**Common HTTP Status Codes:**
- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE (no response body)
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but no permission
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server crash

---

#### 2. **Always Validate Input**

```javascript
// ✅ CORRECT - With validation
app.post("/api/user", (req, res) => {
  const { email, password, age } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format"
    });
  }
  
  // Age validation
  if (age && (age < 18 || age > 120)) {
    return res.status(400).json({
      success: false,
      message: "Age must be between 18 and 120"
    });
  }
  
  // Proceed with creation...
});

// ❌ WRONG - No validation
app.post("/api/user", (req, res) => {
  const user = req.body;
  users.push(user); // Dangerous! Any data can be injected
  res.json({ success: true });
});
```

---

#### 3. **Use Consistent Response Structure**

```javascript
// ✅ CORRECT - Consistent structure
const sendResponse = (res, statusCode, success, message, data = null) => {
  res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

app.get("/api/user/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    return sendResponse(res, 404, false, "User not found");
  }
  sendResponse(res, 200, true, "User found", user);
});

// ❌ WRONG - Inconsistent responses
app.get("/api/user/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    return res.json({ error: "Not found" }); // Different structure
  }
  res.json({ user }); // Different structure
});
```

---

#### 4. **Never Trust User Input (Security)**

```javascript
// ✅ CORRECT - Sanitize and limit fields
app.post("/api/user", (req, res) => {
  // Only accept specific fields
  const { first_name, last_name, email } = req.body;
  
  const newUser = {
    id: users.length + 1,
    first_name: first_name.trim(), // Remove whitespace
    last_name: last_name.trim(),
    email: email.toLowerCase().trim(), // Normalize email
    createdAt: new Date(), // Server-generated, not from client
    role: "user" // Server-defined, not from client
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// ❌ WRONG - Accepting everything blindly
app.post("/api/user", (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body // ⚠️ User could send { role: "admin" }!
  };
  users.push(newUser);
  res.json(newUser);
});
```

**Real Attack Scenario:**
```javascript
// Attacker sends:
POST /api/user
{
  "first_name": "Hacker",
  "email": "hacker@evil.com",
  "role": "admin",        // ⚠️ Privilege escalation
  "isVerified": true,     // ⚠️ Bypass verification
  "accountBalance": 99999 // ⚠️ Money injection
}

// With ...req.body, all these malicious fields get saved!
```

---

#### 5. **Use Environment Variables for Secrets**

```javascript
// ✅ CORRECT
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// .env file (never commit to Git!)
// PORT=3000
// DATABASE_URL=mongodb://localhost:27017/myapp
// JWT_SECRET=super-secret-key-change-in-production

// ❌ WRONG - Hardcoded secrets
const JWT_SECRET = "my-secret-key-123"; // ⚠️ Exposed in Git!
const DB_PASSWORD = "admin123"; // ⚠️ Security risk!
```

---

#### 6. **Implement Rate Limiting**

```javascript
const rateLimit = require("express-rate-limit");

// ✅ Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: "Too many requests, please try again later"
});

app.use("/api/", limiter);

// Stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  message: "Too many login attempts, please try again later"
});

app.use("/api/auth/login", authLimiter);
```

---

### ⚠️ **Common Pitfalls**

#### 1. **Not Handling Async Errors**

```javascript
// ❌ WRONG - Unhandled promise rejection crashes server
app.get("/api/users", async (req, res) => {
  const users = await database.getUsers(); // If this fails, server crashes!
  res.json(users);
});

// ✅ CORRECT - Always use try-catch
app.get("/api/users", async (req, res) => {
  try {
    const users = await database.getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});
```

---

#### 2. **Forgetting Middleware Order**

```javascript
// ❌ WRONG - Middleware AFTER routes (won't work!)
app.post("/api/user", (req, res) => {
  console.log(req.body); // undefined!
  res.json(req.body);
});

app.use(express.json()); // Too late!

// ✅ CORRECT - Middleware BEFORE routes
app.use(express.json()); // Parses body

app.post("/api/user", (req, res) => {
  console.log(req.body); // Works!
  res.json(req.body);
});
```

---

#### 3. **Not Using .json() for Parsing**

```javascript
// ❌ WRONG - Using urlencoded for JSON data
app.use(express.urlencoded({ extended: false }));

// Client sends: { "name": "Alice" } (JSON)
// req.body → undefined ❌

// ✅ CORRECT - Use both if needed
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: false })); // For form data
```

---

#### 4. **Direct File Write Without Proper Error Handling**

```javascript
// ❌ WRONG - No error handling
app.post("/api/user", (req, res) => {
  users.push(req.body);
  fs.writeFileSync("./users.json", JSON.stringify(users)); // Blocks server!
  res.json({ success: true });
});

// ✅ CORRECT - Async with error handling
app.post("/api/user", async (req, res) => {
  try {
    users.push(req.body);
    await fs.promises.writeFile("./users.json", JSON.stringify(users, null, 2));
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("File write error:", error);
    res.status(500).json({ success: false, message: "Failed to save user" });
  }
});
```

---

#### 5. **Exposing Sensitive Data in Responses**

```javascript
// ❌ WRONG - Sending password in response
app.get("/api/user/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  res.json(user); // Contains password field! ⚠️
});

// ✅ CORRECT - Exclude sensitive fields
app.get("/api/user/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Remove password before sending
  const { password, ...safeUser } = user;
  res.json(safeUser);
});
```

---

### 🏢 **Enterprise-Level Practices**

#### 1. **Logging & Monitoring**

```javascript
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  next();
});

// Log errors
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url
  });
  res.status(500).json({ message: "Internal server error" });
});
```

---

#### 2. **Database Instead of File System**

```javascript
// ❌ Development: File system
const users = require("./users.json");

// ✅ Production: Database
const mongoose = require("mongoose");
const User = require("./models/User");

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password") // Exclude password
      .limit(100) // Pagination
      .sort({ createdAt: -1 }); // Newest first
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

#### 3. **API Versioning**

```javascript
// ✅ Version your APIs
app.use("/api/v1/users", userRoutesV1);
app.use("/api/v2/users", userRoutesV2); // New version with breaking changes

// Allows clients to migrate gradually
```

---

#### 4. **CORS Configuration**

```javascript
const cors = require("cors");

// ✅ Production: Whitelist specific domains
const corsOptions = {
  origin: ["https://yourapp.com", "https://admin.yourapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));

// ❌ Development only: Allow all origins
app.use(cors()); // Never use in production!
```

---

## 6️⃣ Interview Preparation

### 🎯 **Top 20 REST API Interview Questions**

---

#### **Q1: What is REST? Explain its principles.**

**Answer:**
REST (Representational State Transfer) is an architectural style for designing networked applications. It was introduced by Roy Fielding in 2000.

**6 Key Principles:**
1. **Client-Server Architecture**: Separation of concerns (UI vs data storage)
2. **Stateless**: Each request contains all necessary information
3. **Cacheable**: Responses must define if they're cacheable
4. **Uniform Interface**: Standardized way of communication
5. **Layered System**: Client can't tell if connected directly to server
6. **Code on Demand (Optional)**: Server can send executable code

**Example:**
```
Stateless means:
Request 1: GET /api/user/1 (includes auth token)
Request 2: GET /api/user/2 (includes auth token again)

Server doesn't remember Request 1 when handling Request 2.
```

---

#### **Q2: What's the difference between PUT and PATCH?**

**Answer:**

| Aspect | PUT | PATCH |
|--------|-----|-------|
| **Purpose** | Replace entire resource | Update partial resource |
| **Idempotent** | Yes | Yes (usually) |
| **Data sent** | Complete object | Only changed fields |

**Example:**
```javascript
// Original user
{ id: 1, name: "John", email: "john@example.com", age: 30 }

// PUT - Replace entire resource
PUT /api/user/1
Body: { name: "John Doe", email: "john@example.com", age: 31 }
// Must send ALL fields

// PATCH - Update only specific fields
PATCH /api/user/1
Body: { age: 31 }
// Only send what changed
```

---

#### **Q3: What are idempotent methods? Which HTTP methods are idempotent?**

**Answer:**
**Idempotent** means making the same request multiple times produces the same result.

**Idempotent Methods:**
- ✅ **GET**: Reading data multiple times doesn't change it
- ✅ **PUT**: Replacing a resource multiple times = same end state
- ✅ **DELETE**: Deleting something twice = still deleted (404 second time)
- ❌ **POST**: Creating a user twice = 2 different users

**Example:**
```javascript
// Idempotent (PUT)
PUT /api/user/1
Body: { name: "Alice" }
// Result: name = "Alice"

// Call again
PUT /api/user/1
Body: { name: "Alice" }
// Result: Still name = "Alice" (same state)

// NOT Idempotent (POST)
POST /api/users
Body: { name: "Bob" }
// Result: User created with id=1

// Call again
POST /api/users
Body: { name: "Bob" }
// Result: Another user created with id=2 (different state!)
```

---

#### **Q4: What's the difference between REST and SOAP?**

**Answer:**

| Feature | REST | SOAP |
|---------|------|------|
| **Protocol** | Architectural style | Protocol |
| **Data Format** | JSON, XML, HTML | Only XML |
| **Transport** | HTTP, HTTPS | HTTP, SMTP, TCP |
| **Performance** | Faster (lightweight) | Slower (XML overhead) |
| **Security** | HTTPS, OAuth | WS-Security |
| **Use Case** | Web/Mobile apps | Enterprise/Banking |

**Example:**
```xml
<!-- SOAP Request (Verbose) -->
<soap:Envelope>
  <soap:Body>
    <GetUser>
      <UserId>123</UserId>
    </GetUser>
  </soap:Body>
</soap:Envelope>

<!-- REST Request (Simple) -->
GET /api/users/123
```

---

#### **Q5: How do you handle versioning in REST APIs?**

**Answer:**
There are 4 common approaches:

**1. URI Versioning (Most Common)**
```javascript
app.get("/api/v1/users", ...);
app.get("/api/v2/users", ...);

// URL: https://api.example.com/api/v1/users
```

**2. Query Parameter**
```javascript
app.get("/api/users", (req, res) => {
  const version = req.query.version || "1";
  if (version === "2") {
    // v2 logic
  } else {
    // v1 logic
  }
});

// URL: https://api.example.com/api/users?version=2
```

**3. Header Versioning**
```javascript
app.get("/api/users", (req, res) => {
  const version = req.headers["api-version"] || "1";
  // Route based on version
});

// Header: api-version: 2
```

**4. Content Negotiation (Accept Header)**
```javascript
// Header: Accept: application/vnd.myapi.v2+json
```

**Best Practice:** URI versioning for major changes, headers for minor ones.

---

#### **Q6: What are the common HTTP status codes and when to use them?**

**Answer:**

**2xx Success:**
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST (resource created)
- `204 No Content`: Successful DELETE (no response body)

**4xx Client Errors:**
- `400 Bad Request`: Invalid input/validation failed
- `401 Unauthorized`: Authentication missing/invalid
- `403 Forbidden`: Authenticated but no permission
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate resource (e.g., email already exists)

**5xx Server Errors:**
- `500 Internal Server Error`: Unexpected server crash
- `503 Service Unavailable`: Server temporarily down

**Example Usage:**
```javascript
app.post("/api/users", (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ message: "Email required" }); // 400
  }
  
  const exists = users.find(u => u.email === req.body.email);
  if (exists) {
    return res.status(409).json({ message: "User already exists" }); // 409
  }
  
  // Create user
  res.status(201).json(newUser); // 201
});
```

---

#### **Q7: What is CORS and why is it needed?**

**Answer:**
**CORS** (Cross-Origin Resource Sharing) is a security feature that controls which domains can access your API.

**Problem:**
```
Your API:    http://api.example.com
Your Frontend: http://app.example.com (Different origin!)

Browser blocks request by default for security.
```

**Solution:**
```javascript
const cors = require("cors");

// Allow specific origins
app.use(cors({
  origin: "http://app.example.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
```

**Without CORS:**
```
Frontend makes request → Browser blocks it → Error in console:
"Access to fetch at 'http://api.example.com' from origin 
'http://app.example.com' has been blocked by CORS policy"
```

**With CORS:**
```
Server sends header: Access-Control-Allow-Origin: http://app.example.com
Browser allows the request ✅
```

---

#### **Q8: How do you implement authentication in REST APIs?**

**Answer:**
There are 3 main approaches:

**1. JWT (JSON Web Tokens) - Most Common**
```javascript
// Login
app.post("/api/login", (req, res) => {
  const user = authenticateUser(req.body);
  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "24h" });
  res.json({ token });
});

// Protected route
app.get("/api/profile", authenticateToken, (req, res) => {
  // req.user contains decoded token
  res.json(req.user);
});

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}
```

**2. API Keys**
```javascript
app.get("/api/data", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.VALID_API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }
  // Proceed
});
```

**3. OAuth 2.0 (Third-party login)**
```javascript
// Used for "Login with Google/Facebook"
// Complex implementation, usually use libraries like Passport.js
```

---

#### **Q9: What's the difference between authentication and authorization?**

**Answer:**

| Aspect | Authentication | Authorization |
|--------|---------------|---------------|
| **Question** | Who are you? | What can you do? |
| **Process** | Verify identity | Check permissions |
| **Example** | Login with password | Admin can delete users |
| **Status Code** | 401 Unauthorized | 403 Forbidden |

**Example:**
```javascript
// Authentication: Who are you?
app.use("/api/protected", authenticateToken); // Verify JWT

// Authorization: What can you do?
app.delete("/api/users/:id", (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" }); // 403
  }
  // Proceed with deletion
});

// Scenario:
// User Bob (role: "user") is authenticated ✅
// Bob tries to delete a user → 403 Forbidden (lacks authorization) ❌
```

---

#### **Q10: How do you handle pagination in REST APIs?**

**Answer:**

**1. Offset-Based Pagination**
```javascript
app.get("/api/posts", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const paginatedPosts = posts.slice(offset, offset + limit);
  
  res.json({
    data: paginatedPosts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(posts.length / limit),
      totalItems: posts.length,
      itemsPerPage: limit
    }
  });
});

// Request: GET /api/posts?page=2&limit=10
```

**2. Cursor-Based Pagination (Better for large datasets)**
```javascript
app.get("/api/posts", (req, res) => {
  const cursor = req.query.cursor; // Last item ID from previous page
  const limit = 10;
  
  let startIndex = 0;
  if (cursor) {
    startIndex = posts.findIndex(p => p.id === cursor) + 1;
  }
  
  const paginatedPosts = posts.slice(startIndex, startIndex + limit);
  const nextCursor = paginatedPosts[paginatedPosts.length - 1]?.id;
  
  res.json({
    data: paginatedPosts,
    nextCursor: nextCursor || null
  });
});

// Request: GET /api/posts?cursor=abc123
```

---

#### **Q11: What is rate limiting and why is it important?**

**Answer:**
**Rate limiting** restricts the number of requests a client can make in a time window.

**Why Important:**
- ✅ Prevent DoS attacks
- ✅ Protect server resources
- ✅ Fair usage across users
- ✅ Control API costs

**Implementation:**
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

app.use("/api/", limiter);

// Response headers:
// X-RateLimit-Limit: 100
// X-RateLimit-Remaining: 99
// X-RateLimit-Reset: 1234567890
```

---

#### **Q12: How do you handle errors in REST APIs?**

**Answer:**

**1. Global Error Handler**
```javascript
// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});
```

**2. Custom Error Classes**
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage
app.get("/api/user/:id", (req, res, next) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.json(user);
});
```

**3. Async Error Wrapper**
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get("/api/users", asyncHandler(async (req, res) => {
  const users = await database.getUsers(); // If fails, caught by asyncHandler
  res.json(users);
}));
```

---

#### **Q13: What's the difference between req.params, req.query, and req.body?**

**Answer:**

```javascript
// URL: http://localhost:3000/api/users/123?sort=name&order=asc
// Body: { "name": "Alice" }

app.post("/api/users/:id", (req, res) => {
  console.log(req.params); // { id: "123" } - URL path parameters
  console.log(req.query);  // { sort: "name", order: "asc" } - Query string
  console.log(req.body);   // { name: "Alice" } - Request body
});
```

| Type | Location | Example | Use Case |
|------|----------|---------|----------|
| `req.params` | URL path | `/users/:id` | Resource identification |
| `req.query` | URL query string | `?page=2&limit=10` | Filtering, sorting, pagination |
| `req.body` | Request body | POST/PUT data | Sending data to server |

---

#### **Q14: What is middleware in Express? Give examples.**

**Answer:**
**Middleware** are functions that execute during the request-response cycle.

**Types:**

**1. Application-Level Middleware**
```javascript
// Runs for all routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass control to next middleware
});
```

**2. Route-Level Middleware**
```javascript
const checkAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "No token" });
  }
  next();
};

app.get("/api/profile", checkAuth, (req, res) => {
  res.json({ message: "Protected route" });
});
```

**3. Built-in Middleware**
```javascript
app.use(express.json()); // Parse JSON bodies
app.use(express.static("public")); // Serve static files
```

**4. Third-party Middleware**
```javascript
const cors = require("cors");
const helmet = require("helmet");

app.use(cors());
app.use(helmet()); // Security headers
```

**5. Error-Handling Middleware**
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});
```

---

#### **Q15: How do you secure REST APIs?**

**Answer:**

**1. Use HTTPS (Always!)**
```javascript
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("certificate.pem")
};

https.createServer(options, app).listen(443);
```

**2. Authentication & Authorization**
```javascript
// JWT, OAuth, API Keys (covered in Q8)
```

**3. Input Validation & Sanitization**
```javascript
const { body, validationResult } = require("express-validator");

app.post("/api/user",
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed
  }
);
```

**4. Helmet (Security Headers)**
```javascript
const helmet = require("helmet");
app.use(helmet()); // Sets various HTTP headers
```

**5. Rate Limiting**
```javascript
// Covered in Q11
```

**6. CORS Configuration**
```javascript
// Covered in Q7
```

**7. SQL Injection Prevention**
```javascript
// ❌ Vulnerable
app.get("/api/users", (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  // Attacker sends: ?id=1 OR 1=1 (returns all users!)
});

// ✅ Use parameterized queries
app.get("/api/users", (req, res) => {
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [req.query.id], (err, results) => {
    res.json(results);
  });
});
```

**8. Don't Expose Sensitive Data**
```javascript
// ❌ Wrong
res.json(user); // Includes password field

// ✅ Correct
const { password, ...safeUser } = user;
res.json(safeUser);
```

---

#### **Q16: What's the difference between JSON.stringify() and res.json()?**

**Answer:**

```javascript
const user = { name: "Alice", age: 25 };

// JSON.stringify() - Converts to string
const jsonString = JSON.stringify(user);
console.log(typeof jsonString); // "string"
console.log(jsonString); // '{"name":"Alice","age":25}'

// res.json() - Does 3 things:
app.get("/api/user", (req, res) => {
  res.json(user);
  // 1. Converts to JSON string: JSON.stringify(user)
  // 2. Sets header: Content-Type: application/json
  // 3. Sends response to client
});

// Equivalent to:
res.setHeader("Content-Type", "application/json");
res.send(JSON.stringify(user));
```

---

#### **Q17: What is the purpose of express.urlencoded() and express.json()?**

**Answer:**

**express.json()** - Parses JSON request bodies
```javascript
app.use(express.json());

// Client sends:
// Content-Type: application/json
// Body: {"name": "Alice"}

app.post("/api/user", (req, res) => {
  console.log(req.body); // { name: "Alice" }
});
```

**express.urlencoded()** - Parses URL-encoded form data
```javascript
app.use(express.urlencoded({ extended: false }));

// Client sends (HTML form):
// Content-Type: application/x-www-form-urlencoded
// Body: name=Alice&email=alice@example.com

app.post("/api/user", (req, res) => {
  console.log(req.body); // { name: "Alice", email: "alice@example.com" }
});
```

**When to use both:**
```javascript
app.use(express.json());        // For API clients (React, mobile apps)
app.use(express.urlencoded({ extended: false })); // For HTML forms
```

---

#### **Q18: How do you test REST APIs?**

**Answer:**

**1. Manual Testing (Postman/Insomnia)**
```
GET http://localhost:3000/api/users
Headers: Authorization: Bearer <token>
```

**2. Automated Testing with Jest + Supertest**
```javascript
const request = require("supertest");
const app = require("./app");

describe("User API", () => {
  test("GET /api/users should return all users", async () => {
    const response = await request(app)
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /json/);
    
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  test("POST /api/users should create a user", async () => {
    const newUser = { name: "Alice", email: "alice@example.com" };
    
    const response = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(201);
    
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Alice");
  });
  
  test("GET /api/users/999 should return 404", async () => {
    await request(app)
      .get("/api/users/999")
      .expect(404);
  });
});
```

**3. Integration Testing**
```javascript
// Test with real database
beforeAll(async () => {
  await database.connect();
});

afterAll(async () => {
  await database.disconnect();
});
```

---

#### **Q19: What are some best practices for API documentation?**

**Answer:**

**1. Use Swagger/OpenAPI**
```javascript
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Access at: http://localhost:3000/api-docs
```

**2. Include in documentation:**
- ✅ Endpoint URL and method
- ✅ Request parameters (path, query, body)
- ✅ Request examples
- ✅ Response format and status codes
- ✅ Authentication requirements
- ✅ Error responses
- ✅ Rate limits

**Example:**
```markdown
## Get User by ID

**Endpoint:** `GET /api/users/:id`

**Parameters:**
- `id` (path, required) - User ID

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Errors:**
- `404` - User not found
- `401` - Unauthorized
```

---

#### **Q20: What's the difference between stateless and stateful APIs?**

**Answer:**

**Stateless (REST principle):**
```javascript
// Request 1
GET /api/user/1
Headers: { Authorization: "Bearer token123" }
// Server doesn't store session

// Request 2
GET /api/user/2
Headers: { Authorization: "Bearer token123" }
// Server treats this independently (doesn't remember Request 1)
```

**Stateful (Traditional approach):**
```javascript
// Request 1
POST /api/login
// Server creates session: { sessionId: "abc", userId: 1 }

// Request 2
GET /api/user
Headers: { Cookie: "sessionId=abc" }
// Server looks up session: "Oh, this is user 1"
// Server remembers previous request
```

| Feature | Stateless | Stateful |
|---------|-----------|----------|
| **Server memory** | No session storage | Stores sessions |
| **Scalability** | Easy to scale | Difficult (sticky sessions) |
| **Each request** | Contains all info | Relies on session |
| **Example** | JWT tokens | Session cookies |

**Why REST prefers stateless:**
```
Stateless allows:
- Load balancing across multiple servers
- Easy horizontal scaling
- Better performance (no session lookups)
```

---

## 7️⃣ Cheat Sheet / Summary

### 🔥 **Quick Reference Guide**

---

### **Basic Server Setup**
```javascript
const express = require("express");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/api/resource", (req, res) => { /* ... */ });
app.post("/api/resource", (req, res) => { /* ... */ });
app.put("/api/resource/:id", (req, res) => { /* ... */ });
app.patch("/api/resource/:id", (req, res) => { /* ... */ });
app.delete("/api/resource/:id", (req, res) => { /* ... */ });

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
```

---

### **HTTP Methods Cheat Sheet**

| Method | Purpose | Idempotent | Request Body | Success Code |
|--------|---------|------------|--------------|--------------|
| GET | Read data | ✅ Yes | ❌ No | 200 |
| POST | Create data | ❌ No | ✅ Yes | 201 |
| PUT | Replace data | ✅ Yes | ✅ Yes | 200 |
| PATCH | Update partial | ✅ Yes | ✅ Yes | 200 |
| DELETE | Delete data | ✅ Yes | ❌ No | 204/200 |

---

### **Common Status Codes**

```javascript
// Success
res.status(200).json(data);       // OK
res.status(201).json(data);       // Created
res.status(204).send();           // No Content

// Client Errors
res.status(400).json({ message: "Bad Request" });
res.status(401).json({ message: "Unauthorized" });
res.status(403).json({ message: "Forbidden" });
res.status(404).json({ message: "Not Found" });
res.status(409).json({ message: "Conflict" });

// Server Errors
res.status(500).json({ message: "Internal Server Error" });
res.status(503).json({ message: "Service Unavailable" });
```

---

### **Request Data Access**

```javascript
// URL: http://localhost:3000/api/users/123?sort=name&order=asc
// Body: { "name": "Alice" }

app.post("/api/users/:id", (req, res) => {
  const id = req.params.id;           // "123" (from URL path)
  const sort = req.query.sort;        // "name" (from query string)
  const order = req.query.order;      // "asc"
  const name = req.body.name;         // "Alice" (from request body)
  const token = req.headers.authorization; // Bearer token
});
```

---

### **Response Helpers**

```javascript
// JSON response
res.json({ success: true, data: user });

// Send text
res.send("Hello World");

// Set status and send
res.status(404).json({ message: "Not found" });

// Redirect
res.redirect("/login");

// Set headers
res.setHeader("Content-Type", "application/json");
```

---

### **Middleware Pattern**

```javascript
// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
  // Verify token
  req.user = verifyToken(token);
  next();
};

// Use in route
app.get("/api/profile", authenticate, (req, res) => {
  res.json(req.user);
});
```

---

### **Error Handling Pattern**

```javascript
// Async wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get("/api/users", asyncHandler(async (req, res) => {
  const users = await database.getUsers();
  res.json(users);
}));

// Global error handler (must be last)
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message
  });
});
```

---

### **Pagination Template**

```javascript
app.get("/api/posts", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const paginatedData = data.slice(offset, offset + limit);
  
  res.json({
    data: paginatedData,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(data.length / limit),
      totalItems: data.length
    }
  });
});
```

---

### **Validation Template**

```javascript
app.post("/api/user", (req, res) => {
  const { email, password, age } = req.body;
  
  // Required fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  
  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }
  
  // Password length
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be 8+ characters" });
  }
  
  // Proceed with creation...
});
```

---

### **CORS Setup**

```javascript
const cors = require("cors");

// Allow all (development only)
app.use(cors());

// Production: Whitelist domains
app.use(cors({
  origin: ["https://yourapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
```

---

### **JWT Authentication Template**

```javascript
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

// Generate token
const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "24h" });

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};
```

---

### **File Operations**

```javascript
const fs = require("fs").promises;

// Read JSON file
const data = JSON.parse(await fs.readFile("./data.json", "utf-8"));

// Write JSON file
await fs.writeFile("./data.json", JSON.stringify(data, null, 2));

// Append to file
await fs.appendFile("./logs.txt", `${new Date()}: ${message}\n`);
```

---

### **Rate Limiting**

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Max 100 requests
});

app.use("/api/", limiter);
```

---

### **Logging**

```javascript
// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Or use Morgan
const morgan = require("morgan");
app.use(morgan("combined"));
```

---

### **Environment Variables**

```javascript
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;
const SECRET = process.env.JWT_SECRET;
```

---

### **Database Query Pattern (MongoDB)**

```javascript
const User = require("./models/User");

// Find all
const users = await User.find().select("-password").limit(100);

// Find by ID
const user = await User.findById(id);

// Create
const newUser = await User.create({ name, email });

// Update
const updated = await User.findByIdAndUpdate(id, { name }, { new: true });

// Delete
await User.findByIdAndDelete(id);
```

---

### **Complete CRUD Template**

```javascript
const express = require("express");
const router = express.Router();
let items = []; // Replace with database

// GET all
router.get("/", (req, res) => {
  res.json({ success: true, data: items });
});

// GET one
router.get("/:id", (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: item });
});

// POST create
router.post("/", (req, res) => {
  const newItem = { id: items.length + 1, ...req.body };
  items.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

// PATCH update
router.patch("/:id", (req, res) => {
  const index = items.findIndex(i => i.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Not found" });
  items[index] = { ...items[index], ...req.body };
  res.json({ success: true, data: items[index] });
});

// DELETE
router.delete("/:id", (req, res) => {
  const index = items.findIndex(i => i.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Not found" });
  items.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
```

---

### **Key Takeaways**

✅ **Always validate input** - Never trust user data  
✅ **Use proper status codes** - 200, 201, 400, 401, 404, 500  
✅ **Handle errors gracefully** - Try-catch + global error handler  
✅ **Secure your API** - HTTPS, JWT, rate limiting, CORS  
✅ **Keep it stateless** - Each request is independent  
✅ **Document your API** - Use Swagger or clear README  
✅ **Version your API** - /api/v1, /api/v2  
✅ **Test thoroughly** - Unit + integration tests  

---

### **Production Checklist**

```javascript
// ✅ Environment variables
require("dotenv").config();

// ✅ Security
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ✅ Logging
app.use(morgan("combined"));

// ✅ Error handling
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    database.disconnect();
    process.exit(0);
  });
});
```

---
