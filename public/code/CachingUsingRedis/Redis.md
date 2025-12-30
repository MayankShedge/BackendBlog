## Redis Cache in Node js :
- When we have a application where user has to query to the database a lot for his data fetching.
- In this case suppose the DB contains a lot of `foreign keys` and a lot of other `tables` included then hamara user agar just aaya app mai and he refreshed it toh when the data is required we again need to carry out the same querying.
- Due to this user has to face 2 hardships :
 1. `ReQuery` the whole database 
 2. Res time increases
- Ab in sab problems ko tackle karne ke liye we have redis jaise services. When the data is first time loaded and jo data ham `compute` karke lare hai from the database by running various queries on it.
- Now, ye jo `computed data` hamlog lare hai usse `Redis` apne pass `cache` lega. So isse jab user refresh marega instead of querying again to DB as the same was present or rather stored in it earlier.
- Ab as we know that RAM memory is temporary but fast access so it adds even more plus point to it. 
---
## Deep Dive :
# ⚡ Redis: Zero-to-Hero Complete Guide

---

## 1️⃣ The Basics (What & Why?)

### 🤔 What is Redis?

**Redis** (Remote Dictionary Server) is an **in-memory data structure store** used as a database, cache, message broker, and streaming engine. Think of it as a super-fast key-value store that lives in RAM.

**Simple analogy:** 🏪
- **Regular Database (MongoDB/MySQL)** = Warehouse (slow, large capacity)
- **Redis** = Front desk counter (fast, limited space, frequently accessed items)
- **Your App** = Customer who needs quick access to data

**Why Redis is FAST:**
- ✅ Data stored in **RAM** (not disk) → Microsecond latency
- ✅ Simple **key-value** model → No complex queries
- ✅ **Single-threaded** → No lock contention
- ✅ Optimized **data structures** → Efficient operations

---

### 🆚 Comparison: Redis vs Other Solutions

| Feature | Redis | Memcached | MongoDB | PostgreSQL |
|---------|-------|-----------|---------|------------|
| **Type** | In-memory DB | In-memory cache | Document DB | Relational DB |
| **Storage** | RAM | RAM | Disk | Disk |
| **Persistence** | Optional | No | Yes | Yes |
| **Data Types** | 10+ types | Strings only | Documents | Tables/JSON |
| **Speed** | Ultra-fast (μs) | Ultra-fast (μs) | Fast (ms) | Medium (ms) |
| **Use Case** | Cache, Queue, Real-time | Simple cache | Complex data | Transactions |
| **Complexity** | Low | Very Low | Medium | High |

---

### 📊 **Redis vs Memcached**

**Redis:**
```javascript
// Rich data structures
await redis.set('user:1:name', 'Alice');
await redis.hset('user:1', 'name', 'Alice', 'age', 30);
await redis.lpush('queue', 'job1', 'job2');
await redis.zadd('leaderboard', 100, 'player1');
// + Persistence, Pub/Sub, Transactions
```

**Memcached:**
```javascript
// Only strings
await memcached.set('user:1:name', 'Alice');
await memcached.get('user:1:name');
// That's it! No lists, hashes, or advanced features
```

---

### 🎯 **When to Use Redis**

**✅ Perfect for:**
- **Caching**: Store frequently accessed data (user sessions, API responses)
- **Session Storage**: Fast user session management
- **Rate Limiting**: Track API request counts
- **Real-time Analytics**: Leaderboards, counters, live dashboards
- **Pub/Sub**: Real-time messaging, notifications
- **Queue Systems**: Background job processing
- **Geospatial**: Location-based queries

**❌ NOT suitable for:**
- Primary database with complex relationships
- Large datasets (hundreds of GB) - too expensive for RAM
- Complex queries requiring JOINs
- Financial transactions requiring ACID guarantees (use PostgreSQL)

---

### 💡 **Redis Data Structures**

```
┌──────────────────────────────────────────────────────────────┐
│                  REDIS DATA STRUCTURES                        │
└──────────────────────────────────────────────────────────────┘

1. STRING        → Simple key-value pairs
2. HASH          → Objects (like JSON)
3. LIST          → Ordered collection (queue/stack)
4. SET           → Unique unordered collection
5. SORTED SET    → Set with scores (leaderboards)
6. BITMAP        → Bit-level operations
7. HYPERLOGLOG   → Cardinality estimation
8. GEOSPATIAL    → Location data
9. STREAM        → Log/event stream
10. JSON         → Native JSON support (RedisJSON module)
```

---

## 2️⃣ Installation & Setup

### 🐳 **Method 1: Docker (Recommended)**

**Why Docker?**
- ✅ No local installation mess
- ✅ Easy to start/stop
- ✅ Consistent across all OS (Windows, Mac, Linux)
- ✅ Easy to clean up

**Step 1: Install Docker**
```bash
# Download from: https://www.docker.com/products/docker-desktop
# Verify installation
docker --version
```

**Step 2: Run Redis Container**
```bash
# Pull and run Redis (latest version)
docker run --name my-redis -p 6379:6379 -d redis

# Explanation:
# --name my-redis     → Container name
# -p 6379:6379        → Map port 6379 (host:container)
# -d                  → Run in background (detached)
# redis               → Image name
```

**Step 3: Test Connection**
```bash
# Connect to Redis CLI
docker exec -it my-redis redis-cli

# Test commands
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET mykey "Hello Redis"
OK

127.0.0.1:6379> GET mykey
"Hello Redis"

127.0.0.1:6379> exit
```

**Step 4: Run Redis with Persistence**
```bash
# Create volume for data persistence
docker volume create redis-data

# Run with volume mounted
docker run --name my-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  -d redis redis-server --appendonly yes

# Data persists even if container is deleted!
```

**Step 5: Run Redis with Password**
```bash
docker run --name my-redis \
  -p 6379:6379 \
  -d redis redis-server --requirepass myStrongPassword123
```

**Docker Compose (Better for projects)**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: my-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass myStrongPassword123
    restart: unless-stopped
    networks:
      - app-network

  redis-commander:
    image: rediscommander/redis-commander
    container_name: redis-ui
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379:0:myStrongPassword123
    depends_on:
      - redis
    networks:
      - app-network

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
```

**Start services:**
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f redis

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Access Redis Commander UI:**
```
Open browser: http://localhost:8081
Visual interface to browse Redis data!
```

---

### 💻 **Method 2: Local Installation**

**macOS:**
```bash
# Using Homebrew
brew install redis

# Start Redis
redis-server

# Or run as background service
brew services start redis

# Connect
redis-cli
```

**Ubuntu/Debian:**
```bash
# Install
sudo apt update
sudo apt install redis-server

# Start
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server

# Connect
redis-cli
```

**Windows:**
```bash
# Use WSL2 (recommended) or download from:
# https://github.com/microsoftarchive/redis/releases

# Or use Docker (easiest)
```

---

### 📦 **Node.js Setup**

**Install Redis client:**
```bash
npm install redis
```

**Basic Connection (No Docker):**

`redis-client.js`
```javascript
const redis = require('redis');

// Create client
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

// Connect
client.connect();

// Handle events
client.on('connect', () => {
  console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

module.exports = client;
```

**Docker Connection:**

`redis-client.js`
```javascript
const redis = require('redis');

// Create client (with password)
const client = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  },
  password: 'myStrongPassword123' // If you set password
});

// Connect with error handling
async function connectRedis() {
  try {
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Test connection
    const pong = await client.ping();
    console.log('PING response:', pong);
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

connectRedis();

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.quit();
  console.log('👋 Redis connection closed');
  process.exit(0);
});

module.exports = client;
```

**Using Environment Variables:**

`.env`
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=myStrongPassword123
NODE_ENV=development
```

`redis-client.js`
```javascript
require('dotenv').config();
const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD
});

client.connect().catch(console.error);

module.exports = client;
```

---

## 3️⃣ Redis Data Structures & Operations

### 🔤 **1. STRINGS (Most Common)**

Strings are the simplest Redis data type - can store text, numbers, or serialized objects.

**Basic Operations:**

`1-strings-basic.js`
```javascript
const redis = require('./redis-client');

async function stringOperations() {
  try {
    // ===== SET & GET =====
    await redis.set('name', 'Alice');
    const name = await redis.get('name');
    console.log('Name:', name); // "Alice"
    
    // ===== SET with expiration (TTL) =====
    await redis.set('session:user123', 'token_abc', {
      EX: 3600 // Expires in 3600 seconds (1 hour)
    });
    
    // Alternative: SETEX
    await redis.setEx('otp:user123', 300, '123456'); // 5 minutes
    
    // ===== GET with default if not exists =====
    const result = await redis.get('nonexistent') || 'default';
    console.log('Result:', result); // "default"
    
    // ===== Multiple SET & GET =====
    await redis.mSet({
      'user:1:name': 'Alice',
      'user:1:email': 'alice@example.com',
      'user:1:age': '30'
    });
    
    const userData = await redis.mGet(['user:1:name', 'user:1:email', 'user:1:age']);
    console.log('User data:', userData); // ['Alice', 'alice@example.com', '30']
    
    // ===== INCREMENT & DECREMENT (for numbers) =====
    await redis.set('page_views', 0);
    await redis.incr('page_views'); // 1
    await redis.incr('page_views'); // 2
    await redis.incrBy('page_views', 10); // 12
    await redis.decr('page_views'); // 11
    
    const views = await redis.get('page_views');
    console.log('Page views:', views); // "11"
    
    // ===== APPEND =====
    await redis.set('message', 'Hello');
    await redis.append('message', ' World');
    const message = await redis.get('message');
    console.log('Message:', message); // "Hello World"
    
    // ===== CHECK IF EXISTS =====
    const exists = await redis.exists('name');
    console.log('Name exists?', exists === 1); // true
    
    // ===== DELETE =====
    await redis.del('name');
    
    // ===== SET ONLY IF NOT EXISTS =====
    const wasSet = await redis.setNX('counter', 100);
    console.log('Was set?', wasSet); // true or false
    
    // ===== GET AND DELETE (atomic) =====
    const deletedValue = await redis.getDel('session:user123');
    console.log('Deleted session:', deletedValue);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

stringOperations();
```

**Real-World Use Cases:**

`2-strings-usecase.js`
```javascript
const redis = require('./redis-client');

// ===== USE CASE 1: User Session Management =====
async function createSession(userId, sessionData) {
  const sessionId = `session:${userId}:${Date.now()}`;
  await redis.set(sessionId, JSON.stringify(sessionData), {
    EX: 86400 // 24 hours
  });
  return sessionId;
}

async function getSession(sessionId) {
  const data = await redis.get(sessionId);
  return data ? JSON.parse(data) : null;
}

// ===== USE CASE 2: Rate Limiting =====
async function isRateLimited(userId, maxRequests = 100, window = 3600) {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window); // Set expiration on first request
  }
  
  return current > maxRequests;
}

// Usage:
async function handleAPIRequest(userId) {
  const limited = await isRateLimited(userId);
  
  if (limited) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
  
  // Process request...
  return { success: true };
}

// ===== USE CASE 3: Cache API Response =====
async function getCachedAPIResponse(endpoint) {
  const cacheKey = `api_cache:${endpoint}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('✅ Cache hit');
    return JSON.parse(cached);
  }
  
  console.log('❌ Cache miss - fetching from API');
  
  // Simulate API call
  const response = await fetch(endpoint);
  const data = await response.json();
  
  // Store in cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(data), { EX: 300 });
  
  return data;
}

// ===== USE CASE 4: Distributed Lock =====
async function acquireLock(lockName, timeout = 10000) {
  const lockKey = `lock:${lockName}`;
  const lockValue = Date.now().toString();
  
  const acquired = await redis.set(lockKey, lockValue, {
    NX: true, // Only set if not exists
    PX: timeout // Milliseconds
  });
  
  return acquired ? lockValue : null;
}

async function releaseLock(lockName, lockValue) {
  const lockKey = `lock:${lockName}`;
  const currentValue = await redis.get(lockKey);
  
  if (currentValue === lockValue) {
    await redis.del(lockKey);
    return true;
  }
  
  return false;
}

// Usage:
async function criticalSection() {
  const lockValue = await acquireLock('payment_processing');
  
  if (!lockValue) {
    console.log('Could not acquire lock');
    return;
  }
  
  try {
    // Perform critical operation
    console.log('Processing payment...');
    await processPayment();
  } finally {
    await releaseLock('payment_processing', lockValue);
  }
}

module.exports = {
  createSession,
  getSession,
  isRateLimited,
  getCachedAPIResponse,
  acquireLock,
  releaseLock
};
```

---

### 📦 **2. HASHES (Objects/Dictionaries)**

Hashes are perfect for storing objects with multiple fields.

`3-hashes.js`
```javascript
const redis = require('./redis-client');

async function hashOperations() {
  try {
    // ===== SET SINGLE FIELD =====
    await redis.hSet('user:1', 'name', 'Alice');
    
    // ===== SET MULTIPLE FIELDS =====
    await redis.hSet('user:1', {
      name: 'Alice',
      email: 'alice@example.com',
      age: 30,
      country: 'USA'
    });
    
    // ===== GET SINGLE FIELD =====
    const name = await redis.hGet('user:1', 'name');
    console.log('Name:', name); // "Alice"
    
    // ===== GET ALL FIELDS =====
    const user = await redis.hGetAll('user:1');
    console.log('User:', user);
    // { name: 'Alice', email: 'alice@example.com', age: '30', country: 'USA' }
    
    // ===== GET MULTIPLE FIELDS =====
    const fields = await redis.hmGet('user:1', ['name', 'email']);
    console.log('Fields:', fields); // ['Alice', 'alice@example.com']
    
    // ===== CHECK IF FIELD EXISTS =====
    const hasEmail = await redis.hExists('user:1', 'email');
    console.log('Has email?', hasEmail === 1); // true
    
    // ===== DELETE FIELD =====
    await redis.hDel('user:1', 'country');
    
    // ===== INCREMENT FIELD =====
    await redis.hSet('user:1', 'login_count', 0);
    await redis.hIncrBy('user:1', 'login_count', 1);
    
    // ===== GET ALL KEYS =====
    const keys = await redis.hKeys('user:1');
    console.log('Keys:', keys); // ['name', 'email', 'age', 'login_count']
    
    // ===== GET ALL VALUES =====
    const values = await redis.hVals('user:1');
    console.log('Values:', values);
    
    // ===== COUNT FIELDS =====
    const fieldCount = await redis.hLen('user:1');
    console.log('Field count:', fieldCount);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: Product Catalog =====
async function productOperations() {
  // Store product
  await redis.hSet('product:1001', {
    name: 'iPhone 15 Pro',
    price: 999.99,
    stock: 50,
    category: 'Electronics',
    rating: 4.5
  });
  
  // Update stock after purchase
  await redis.hIncrBy('product:1001', 'stock', -1);
  
  // Get product details
  const product = await redis.hGetAll('product:1001');
  console.log('Product:', product);
  
  // Check if in stock
  const stock = parseInt(await redis.hGet('product:1001', 'stock'));
  const inStock = stock > 0;
  console.log('In stock?', inStock);
}

hashOperations();
productOperations();
```

---

### 📋 **3. LISTS (Queues/Stacks)**

Lists are ordered collections - perfect for queues, activity feeds, timelines.

`4-lists.js`
```javascript
const redis = require('./redis-client');

async function listOperations() {
  try {
    // ===== PUSH TO LIST =====
    // Left push (add to beginning)
    await redis.lPush('queue', 'job1');
    await redis.lPush('queue', 'job2', 'job3'); // Multiple at once
    
    // Right push (add to end)
    await redis.rPush('queue', 'job4');
    
    // ===== POP FROM LIST =====
    // Left pop (remove from beginning)
    const job = await redis.lPop('queue');
    console.log('Popped job:', job); // "job3"
    
    // Right pop (remove from end)
    const lastJob = await redis.rPop('queue');
    console.log('Last job:', lastJob); // "job4"
    
    // ===== BLOCKING POP (wait until element available) =====
    // Useful for worker queues
    const result = await redis.blPop('work_queue', 10); // Wait up to 10 seconds
    
    // ===== GET ELEMENTS =====
    await redis.rPush('messages', 'msg1', 'msg2', 'msg3', 'msg4', 'msg5');
    
    // Get range (0 to -1 means all)
    const allMessages = await redis.lRange('messages', 0, -1);
    console.log('All messages:', allMessages);
    
    // Get first 3
    const first3 = await redis.lRange('messages', 0, 2);
    console.log('First 3:', first3);
    
    // Get last 2
    const last2 = await redis.lRange('messages', -2, -1);
    console.log('Last 2:', last2);
    
    // ===== GET SPECIFIC INDEX =====
    const secondMsg = await redis.lIndex('messages', 1);
    console.log('Second message:', secondMsg);
    
    // ===== GET LENGTH =====
    const length = await redis.lLen('messages');
    console.log('List length:', length);
    
    // ===== TRIM LIST (keep only range) =====
    await redis.lTrim('messages', 0, 2); // Keep only first 3
    
    // ===== INSERT =====
    await redis.lInsert('messages', 'BEFORE', 'msg2', 'new_msg');
    
    // ===== REMOVE =====
    await redis.lRem('messages', 1, 'msg2'); // Remove 1 occurrence of 'msg2'
    
    // ===== SET VALUE AT INDEX =====
    await redis.lSet('messages', 0, 'updated_msg');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: Task Queue =====
class TaskQueue {
  constructor(queueName) {
    this.queueName = queueName;
  }
  
  // Add task to queue
  async enqueue(task) {
    await redis.rPush(this.queueName, JSON.stringify(task));
    console.log('✅ Task added to queue:', task);
  }
  
  // Get task from queue (blocking)
  async dequeue(timeout = 0) {
    const result = await redis.blPop(this.queueName, timeout);
    if (result) {
      const task = JSON.parse(result.element);
      console.log('📋 Processing task:', task);
      return task;
    }
    return null;
  }
  
  // Get queue size
  async size() {
    return await redis.lLen(this.queueName);
  }
  
  // Peek at next task without removing
  async peek() {
    const task = await redis.lIndex(this.queueName, 0);
    return task ? JSON.parse(task) : null;
  }
}

// ===== REAL-WORLD: Activity Feed =====
class ActivityFeed {
  constructor(userId) {
    this.key = `feed:${userId}`;
    this.maxItems = 100; // Keep last 100 activities
  }
  
  // Add activity
  async addActivity(activity) {
    const activityData = {
      ...activity,
      timestamp: Date.now()
    };
    
    await redis.lPush(this.key, JSON.stringify(activityData));
    await redis.lTrim(this.key, 0, this.maxItems - 1); // Keep only last 100
  }
  
  // Get recent activities
  async getActivities(count = 20) {
    const activities = await redis.lRange(this.key, 0, count - 1);
    return activities.map(a => JSON.parse(a));
  }
}

// Usage:
async function queueExample() {
  const queue = new TaskQueue('email_queue');
  
  // Producer: Add tasks
  await queue.enqueue({ type: 'welcome_email', userId: 123 });
  await queue.enqueue({ type: 'newsletter', userId: 456 });
  
  // Consumer: Process tasks
  const task = await queue.dequeue(5); // Wait up to 5 seconds
  if (task) {
    console.log('Processing:', task);
  }
  
  // Check queue size
  const size = await queue.size();
  console.log('Queue size:', size);
}

async function feedExample() {
  const feed = new ActivityFeed('user_123');
  
  await feed.addActivity({
    type: 'post_created',
    postId: 789,
    message: 'Alice created a new post'
  });
  
  await feed.addActivity({
    type: 'comment_added',
    commentId: 101,
    message: 'Bob commented on your post'
  });
  
  const activities = await feed.getActivities(10);
  console.log('Recent activities:', activities);
}

listOperations();
queueExample();
feedExample();
```

---

### 🎯 **4. SETS (Unique Collections)**

Sets store unique, unordered elements - perfect for tags, relationships, tracking unique visitors.

`5-sets.js`
```javascript
const redis = require('./redis-client');

async function setOperations() {
  try {
    // ===== ADD MEMBERS =====
    await redis.sAdd('tags', 'nodejs', 'javascript', 'redis');
    await redis.sAdd('tags', 'nodejs'); // Duplicate ignored
    
    // ===== GET ALL MEMBERS =====
    const tags = await redis.sMembers('tags');
    console.log('Tags:', tags); // ['nodejs', 'javascript', 'redis']
    
    // ===== CHECK IF MEMBER EXISTS =====
    const hasNode = await redis.sIsMember('tags', 'nodejs');
    console.log('Has nodejs?', hasNode === 1); // true
    
    // ===== REMOVE MEMBER =====
    await redis.sRem('tags', 'javascript');
    
    // ===== GET COUNT =====
    const count = await redis.sCard('tags');
    console.log('Tag count:', count);
    
    // ===== POP RANDOM MEMBER =====
    const randomTag = await redis.sPop('tags');
    console.log('Random tag:', randomTag);
    
    // ===== GET RANDOM MEMBER (without removing) =====
    const randomTag2 = await redis.sRandMember('tags');
    
    // ===== SET OPERATIONS =====
    await redis.sAdd('set1', 'a', 'b', 'c');
    await redis.sAdd('set2', 'b', 'c', 'd');
    
    // Union (all unique elements from both sets)
    const union = await redis.sUnion(['set1', 'set2']);
    console.log('Union:', union); // ['a', 'b', 'c', 'd']
    
    // Intersection (common elements)
    const intersection = await redis.sInter(['set1', 'set2']);
    console.log('Intersection:', intersection); // ['b', 'c']
    
    // Difference (in set1 but not in set2)
    const difference = await redis.sDiff(['set1', 'set2']);
    console.log('Difference:', difference); // ['a']
    
    // ===== MOVE MEMBER =====
    await redis.sMove('set1', 'set2', 'a');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: User Followers/Following =====
class SocialGraph {
  async follow(userId, targetUserId) {
    // Add to user's following list
    await redis.sAdd(`user:${userId}:following`, targetUserId);
    
    // Add to target's followers list
    await redis.sAdd(`user:${targetUserId}:followers`, userId);
    
    console.log(`✅ User ${userId} followed ${targetUserId}`);
  }
  
  async unfollow(userId, targetUserId) {
    await redis.sRem(`user:${userId}:following`, targetUserId);
    await redis.sRem(`user:${targetUserId}:followers`, userId);
  }
  
  async getFollowers(userId) {
    return await redis.sMembers(`user:${userId}:followers`);
  }
  
  async getFollowing(userId) {
    return await redis.sMembers(`user:${userId}:following`);
  }
  
  async getFollowerCount(userId) {
    return await redis.sCard(`user:${userId}:followers`);
  }
  
  async isFollowing(userId, targetUserId) {
    const result = await redis.sIsMember(`user:${userId}:following`, targetUserId);
    return result === 1;
  }
  
  // Get mutual friends
  async getMutualFollowers(userId1, userId2) {
    return await redis.sInter([
      `user:${userId1}:followers`,
      `user:${userId2}:followers`
    ]);
  }
  
  // Suggest friends (followers of people you follow)
  async suggestFriends(userId) {
    const following = await this.getFollowing(userId);
    const suggestions = new Set();
    
    for (const followedUserId of following) {
      const theirFollowing = await this.getFollowing(followedUserId);
      theirFollowing.forEach(id => {
        if (id !== userId && !following.includes(id)) {
          suggestions.add(id);
        }
      });
    }
    
    return Array.from(suggestions);
  }
}

// ===== REAL-WORLD: Unique Page Visitors =====
async function trackVisitor(pageId, userId) {
  const key = `page:${pageId}:visitors`;
  await redis.sAdd(key, userId);
  
  // Set expiration (reset daily)
  await redis.expire(key, 86400);
}

async function getUniqueVisitors(pageId) {
  return await redis.sCard(`page:${pageId}:visitors`);
}

// ===== REAL-WORLD: Online Users =====
async function userOnline(userId) {
  await redis.sAdd('online_users', userId);
  // Set expiration to auto-remove if not refreshed
  await redis.expire(`online_status:${userId}`, 300); // 5 minutes
}

async function userOffline(userId) {
  await redis.sRem('online_users', userId);
}

async function getOnlineUsers() {
  return await redis.sMembers('online_users');
}

async function isUserOnline(userId) {
  const result = await redis.sIsMember('online_users', userId);
  return result === 1;
}

// Usage Examples:
async function examples() {
  const social = new SocialGraph();
  
  await social.follow('user_1', 'user_2');
  await social.follow('user_1', 'user_3');
  await social.follow('user_2', 'user_3');
  
  const followers = await social.getFollowers('user_3');
  console.log('User 3 followers:', followers); // ['user_1', 'user_2']
  
  const mutual = await social.getMutualFollowers('user_1', 'user_2');
  console.log('Mutual followers:', mutual);
  
  // Track visitors
  await trackVisitor('page_123', 'user_1');
  await trackVisitor('page_123', 'user_2');
  await trackVisitor('page_123', 'user_1'); // Duplicate ignored
  
  const uniqueVisitors = await getUniqueVisitors('page_123');
  console.log('Unique visitors:', uniqueVisitors); // 2
}

setOperations();
examples();
```

---

### 🏆 **5. SORTED SETS (Leaderboards)**

Sorted Sets are sets where each member has a score - perfect for leaderboards, rankings, time-series data.

`6-sorted-sets.js`
```javascript
const redis = require('./redis-client');

async function sortedSetOperations() {
  try {
    // ===== ADD MEMBERS WITH SCORES =====
    await redis.zAdd('leaderboard', [
      { score: 100, value: 'player1' },
      { score: 250, value: 'player2' },
      { score: 150, value: 'player3' }
    ]);
    
    // ===== GET RANK (position) =====
    const rank = await redis.zRank('leaderboard', 'player2');
    console.log('Player2 rank:', rank); // 2 (0-indexed, highest score)
    
    // Reverse rank (from highest to lowest)
    const revRank = await redis.zRevRank('leaderboard', 'player2');
    console.log('Player2 reverse rank:', revRank); // 0 (top player)
    
    // ===== GET SCORE =====
    const score = await redis.zScore('leaderboard', 'player2');
    console.log('Player2 score:', score); // "250"
    
    // ===== INCREMENT SCORE =====
    await redis.zIncrBy('leaderboard', 50, 'player1'); // Add 50 to player1's score
    
    // ===== GET TOP PLAYERS (with scores) =====
    const topPlayers = await redis.zRangeWithScores('leaderboard', 0, 2);
    console.log('Top 3 players:', topPlayers);
    // [{ value: 'player1', score: 150 }, { value: 'player3', score: 150 }, ...]
    
    // ===== GET TOP PLAYERS (descending) =====
    const topDesc = await redis.zRevRangeWithScores('leaderboard', 0, 2);
    console.log('Top 3 (highest first):', topDesc);
    
    // ===== GET MEMBERS BY SCORE RANGE =====
    const range = await redis.zRangeByScore('leaderboard', 100, 200);
    console.log('Players with 100-200 points:', range);
    
    // ===== COUNT MEMBERS =====
    const count = await redis.zCard('leaderboard');
    console.log('Total players:', count);
    
    // ===== COUNT IN SCORE RANGE =====
    const countInRange = await redis.zCount('leaderboard', 100, 200);
    console.log('Players with 100-200 points:', countInRange);
    
    // ===== REMOVE MEMBER =====
    await redis.zRem('leaderboard', 'player1');
    
    // ===== REMOVE BY RANK =====
    await redis.zRemRangeByRank('leaderboard', 0, 0); // Remove lowest ranked
    
    // ===== REMOVE BY SCORE =====
    await redis.zRemRangeByScore('leaderboard', 0, 50); // Remove all below 50
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: Gaming Leaderboard =====
class Leaderboard {
  constructor(name) {
    this.key = `leaderboard:${name}`;
  }
  
  // Update player score
  async updateScore(playerId, points) {
    await redis.zIncrBy(this.key, points, playerId);
    console.log(`✅ Added ${points} points to ${playerId}`);
  }
  
  // Get player rank (1-indexed)
  async getPlayerRank(playerId) {
    const rank = await redis.zRevRank(this.key, playerId);
    return rank !== null ? rank + 1 : null; // Convert to 1-indexed
  }
  
  // Get player score
  async getPlayerScore(playerId) {
    return await redis.zScore(this.key, playerId);
  }
  
  // Get top N players
  async getTopPlayers(count = 10) {
    const players = await redis.zRevRangeWithScores(this.key, 0, count - 1);
    return players.map((p, index) => ({
      rank: index + 1,
      playerId: p.value,
      score: p.score
    }));
  }
  
  // Get players around a specific player
  async getPlayersAround(playerId, range = 2) {
    const rank = await redis.zRevRank(this.key, playerId);
    if (rank === null) return [];
    
    const start = Math.max(0, rank - range);
    const end = rank + range;
    
    const players = await redis.zRevRangeWithScores(this.key, start, end);
    return players.map((p, index) => ({
      rank: start + index + 1,
      playerId: p.value,
      score: p.score
    }));
  }
  
  // Get total players
  async getTotalPlayers() {
    return await redis.zCard(this.key);
  }
}

// ===== REAL-WORLD: Trending Posts (Time-decay) =====
class TrendingPosts {
  constructor() {
    this.key = 'trending:posts';
  }
  
  // Add post with initial score
  async addPost(postId, initialScore = 0) {
    const timestamp = Date.now();
    const score = initialScore + timestamp / 10000; // Time-weighted score
    await redis.zAdd(this.key, [{ score, value: postId }]);
  }
  
  // Upvote post
  async upvote(postId) {
    await redis.zIncrBy(this.key, 10, postId); // Add 10 to score
  }
  
  // Get trending posts
  async getTrending(count = 20) {
    return await redis.zRevRange(this.key, 0, count - 1);
  }
  
  // Remove old posts (older than 7 days)
  async removeOldPosts() {
    const sevenDaysAgo = (Date.now() - 7 * 24 * 60 * 60 * 1000) / 10000;
    await redis.zRemRangeByScore(this.key, 0, sevenDaysAgo);
  }
}

// ===== REAL-WORLD: Priority Queue =====
class PriorityQueue {
  constructor(name) {
    this.key = `priority_queue:${name}`;
  }
  
  // Add task with priority
  async addTask(taskId, priority) {
    await redis.zAdd(this.key, [{ score: priority, value: taskId }]);
  }
  
  // Get highest priority task
  async getNextTask() {
    const tasks = await redis.zRevRangeWithScores(this.key, 0, 0);
    if (tasks.length === 0) return null;
    
    const task = tasks[0];
    await redis.zRem(this.key, task.value);
    
    return {
      taskId: task.value,
      priority: task.score
    };
  }
  
  // Get pending task count
  async getPendingCount() {
    return await redis.zCard(this.key);
  }
}

// Usage Examples:
async function examples() {
  // Leaderboard
  const leaderboard = new Leaderboard('global');
  
  await leaderboard.updateScore('alice', 100);
  await leaderboard.updateScore('bob', 150);
  await leaderboard.updateScore('charlie', 120);
  await leaderboard.updateScore('alice', 50); // Alice now has 150
  
  const topPlayers = await leaderboard.getTopPlayers(3);
  console.log('Top players:', topPlayers);
  
  const aliceRank = await leaderboard.getPlayerRank('alice');
  console.log('Alice rank:', aliceRank);
  
  const around = await leaderboard.getPlayersAround('charlie', 1);
  console.log('Players around Charlie:', around);
  
  // Trending posts
  const trending = new TrendingPosts();
  
  await trending.addPost('post_1', 50);
  await trending.addPost('post_2', 30);
  await trending.addPost('post_3', 70);
  
  await trending.upvote('post_2');
  await trending.upvote('post_2');
  await trending.upvote('post_2');
  
  const trendingPosts = await trending.getTrending(5);
  console.log('Trending posts:', trendingPosts);
  
  // Priority queue
  const queue = new PriorityQueue('tasks');
  
  await queue.addTask('task_1', 5);   // Low priority
  await queue.addTask('task_2', 10);  // High priority
  await queue.addTask('task_3', 7);   // Medium priority
  
  const nextTask = await queue.getNextTask();
  console.log('Next task:', nextTask); // task_2 (highest priority)
}

sortedSetOperations();
examples();
```

---

## 4️⃣ Advanced Redis Features

### ⏰ **1. TTL & Expiration**

`7-ttl-expiration.js`
```javascript
const redis = require('./redis-client');

async function ttlOperations() {
  try {
    // ===== SET WITH EXPIRATION =====
    // Method 1: SET with EX (seconds)
    await redis.set('temp_token', 'abc123', { EX: 300 }); // 5 minutes
    
    // Method 2: SET with PX (milliseconds)
    await redis.set('flash_sale', 'active', { PX: 60000 }); // 60 seconds
    
    // Method 3: SETEX command
    await redis.setEx('otp', 300, '123456');
    
    // ===== SET EXPIRATION ON EXISTING KEY =====
    await redis.set('session', 'data');
    await redis.expire('session', 3600); // 1 hour
    
    // Expire at specific timestamp
    const futureTime = Date.now() + 86400000; // 24 hours from now
    await redis.expireAt('session', Math.floor(futureTime / 1000));
    
    // ===== CHECK TTL (Time To Live) =====
    const ttl = await redis.ttl('otp');
    console.log('OTP expires in:', ttl, 'seconds');
    
    // -1 means key exists but no expiration
    // -2 means key doesn't exist
    
    // ===== REMOVE EXPIRATION =====
    await redis.persist('session'); // Now permanent
    
    // ===== CHECK IF KEY EXISTS =====
    const exists = await redis.exists('temp_token');
    console.log('Token exists?', exists === 1);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: OTP System =====
class OTPService {
  async generateOTP(userId) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${userId}`;
    
    // Store OTP with 5-minute expiration
    await redis.setEx(key, 300, otp);
    
    console.log(`📧 OTP ${otp} sent to user ${userId}`);
    return otp;
  }
  
  async verifyOTP(userId, otp) {
    const key = `otp:${userId}`;
    const storedOTP = await redis.get(key);
    
    if (!storedOTP) {
      return { success: false, message: 'OTP expired or not found' };
    }
    
    if (storedOTP === otp) {
      await redis.del(key); // Delete after successful verification
      return { success: true, message: 'OTP verified' };
    }
    
    return { success: false, message: 'Invalid OTP' };
  }
  
  async getRemainingTime(userId) {
    const key = `otp:${userId}`;
    const ttl = await redis.ttl(key);
    
    if (ttl === -2) return { exists: false };
    if (ttl === -1) return { exists: true, expires: false };
    
    return { exists: true, remainingSeconds: ttl };
  }
}

// ===== REAL-WORLD: Flash Sale =====
async function startFlashSale(productId, durationSeconds) {
  const key = `flash_sale:${productId}`;
  
  await redis.set(key, JSON.stringify({
    originalPrice: 999,
    salePrice: 699,
    startTime: Date.now()
  }), {
    EX: durationSeconds
  });
  
  console.log(`🔥 Flash sale started for product ${productId}`);
}

async function isFlashSaleActive(productId) {
  const key = `flash_sale:${productId}`;
  const data = await redis.get(key);
  
  if (data) {
    const remaining = await redis.ttl(key);
    return {
      active: true,
      data: JSON.parse(data),
      remainingSeconds: remaining
    };
  }
  
  return { active: false };
}

// Usage:
async function examples() {
  const otpService = new OTPService();
  
  // Generate OTP
  await otpService.generateOTP('user_123');
  
  // Check remaining time
  const timeLeft = await otpService.getRemainingTime('user_123');
  console.log('OTP expires in:', timeLeft);
  
  // Verify OTP
  const result = await otpService.verifyOTP('user_123', '123456');
  console.log('Verification result:', result);
  
  // Flash sale
  await startFlashSale('product_999', 3600); // 1 hour
  const saleStatus = await isFlashSaleActive('product_999');
  console.log('Flash sale status:', saleStatus);
}

ttlOperations();
examples();
```

---

### 📢 **2. Pub/Sub (Publish/Subscribe)**

`8-pubsub.js`
```javascript
const redis = require('redis');

// Create separate clients for pub/sub
const publisher = redis.createClient();
const subscriber = redis.createClient();

async function setupPubSub() {
  await publisher.connect();
  await subscriber.connect();
  
  // ===== SUBSCRIBE TO CHANNEL =====
  await subscriber.subscribe('notifications', (message) => {
    console.log('📬 Received notification:', message);
  });
  
  // Subscribe to multiple channels
  await subscriber.subscribe('chat:room1', (message) => {
    console.log('💬 Chat message:', message);
  });
  
  // ===== PATTERN SUBSCRIBE (wildcards) =====
  await subscriber.pSubscribe('user:*:notifications', (message, channel) => {
    console.log(`📩 Message from ${channel}:`, message);
  });
  
  // ===== PUBLISH MESSAGE =====
  await publisher.publish('notifications', 'New order received');
  await publisher.publish('chat:room1', JSON.stringify({
    user: 'Alice',
    message: 'Hello everyone!'
  }));
  
  await publisher.publish('user:123:notifications', 'You have a new follower');
}

// ===== REAL-WORLD: Real-time Chat System =====
class ChatSystem {
  constructor() {
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();
  }
  
  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }
  
  // Join chat room
  async joinRoom(roomId, callback) {
    const channel = `chat:${roomId}`;
    await this.subscriber.subscribe(channel, (message) => {
      const data = JSON.parse(message);
      callback(data);
    });
    console.log(`✅ Joined room ${roomId}`);
  }
  
  // Leave chat room
  async leaveRoom(roomId) {
    const channel = `chat:${roomId}`;
    await this.subscriber.unsubscribe(channel);
    console.log(`👋 Left room ${roomId}`);
  }
  
  // Send message
  async sendMessage(roomId, userId, message) {
    const channel = `chat:${roomId}`;
    const data = {
      userId,
      message,
      timestamp: Date.now()
    };
    await this.publisher.publish(channel, JSON.stringify(data));
  }
  
  // Broadcast to all users
  async broadcast(message) {
    await this.publisher.publish('global:broadcast', JSON.stringify(message));
  }
}

// ===== REAL-WORLD: Notification System =====
class NotificationSystem {
  constructor() {
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();
  }
  
  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }
  
  // Subscribe to user notifications
  async subscribeToUser(userId, callback) {
    const channel = `user:${userId}:notifications`;
    await this.subscriber.subscribe(channel, (message) => {
      const notification = JSON.parse(message);
      callback(notification);
    });
  }
  
  // Send notification to user
  async sendNotification(userId, notification) {
    const channel = `user:${userId}:notifications`;
    await this.publisher.publish(channel, JSON.stringify(notification));
  }
  
  // Send to multiple users
  async notifyMultipleUsers(userIds, notification) {
    for (const userId of userIds) {
      await this.sendNotification(userId, notification);
    }
  }
}

// Usage Examples:
async function examples() {
  // Chat system
  const chat = new ChatSystem();
  await chat.init();
  
  // User 1 joins room
  await chat.joinRoom('room_123', (data) => {
    console.log(`[User 1] ${data.userId}: ${data.message}`);
  });
  
  // User 2 joins same room
  await chat.joinRoom('room_123', (data) => {
    console.log(`[User 2] ${data.userId}: ${data.message}`);
  });
  
  // Send messages
  await chat.sendMessage('room_123', 'alice', 'Hello!');
  await chat.sendMessage('room_123', 'bob', 'Hi Alice!');
  
  // Notification system
  const notifications = new NotificationSystem();
  await notifications.init();
  
  // User subscribes to their notifications
  await notifications.subscribeToUser('user_123', (notification) => {
    console.log('🔔 New notification:', notification);
  });
  
  // Send notification
  await notifications.sendNotification('user_123', {
    type: 'new_follower',
    message: 'Alice started following you',
    timestamp: Date.now()
  });
}

setupPubSub();
examples();
```

---

### 🔄 **3. Transactions & Pipelining**

`9-transactions.js`
```javascript
const redis = require('./redis-client');

async function transactionOperations() {
  try {
    // ===== BASIC TRANSACTION (MULTI/EXEC) =====
    // All commands execute atomically
    const multi = redis.multi();
    
    multi.set('account:1:balance', 1000);
    multi.set('account:2:balance', 500);
    multi.incrBy('account:1:balance', -100);
    multi.incrBy('account:2:balance', 100);
    
    const results = await multi.exec();
    console.log('Transaction results:', results);
    
    // ===== WATCH (Optimistic Locking) =====
    // Watch key for changes
    await redis.watch('inventory:product_1');
    
    const stock = parseInt(await redis.get('inventory:product_1'));
    
    if (stock > 0) {
      const multi2 = redis.multi();
      multi2.decrBy('inventory:product_1', 1);
      multi2.incrBy('sales:product_1', 1);
      
      const result = await multi2.exec();
      
      if (result === null) {
        console.log('Transaction failed - key was modified');
      } else {
        console.log('✅ Purchase successful');
      }
    }
    
    await redis.unwatch(); // Clear watches
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== PIPELINING (Better Performance) =====
async function pipelineOperations() {
  try {
    // Pipeline batches commands (not atomic like transactions)
    const pipeline = redis.multi(); // or redis.pipeline() in some clients
    
    // Add many commands
    for (let i = 0; i < 1000; i++) {
      pipeline.set(`key:${i}`, `value${i}`);
    }
    
    // Execute all at once
    const results = await pipeline.exec();
    console.log(`✅ Executed ${results.length} commands`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== REAL-WORLD: Bank Transfer =====
async function transferMoney(fromAccount, toAccount, amount) {
  const fromKey = `account:${fromAccount}:balance`;
  const toKey = `account:${toAccount}:balance`;
  
  try {
    // Watch both accounts
    await redis.watch([fromKey, toKey]);
    
    // Check balance
    const balance = parseFloat(await redis.get(fromKey));
    
    if (balance < amount) {
      await redis.unwatch();
      throw new Error('Insufficient funds');
    }
    
    // Execute transfer
    const multi = redis.multi();
    multi.decrBy(fromKey, amount);
    multi.incrBy(toKey, amount);
    
    const result = await multi.exec();
    
    if (result === null) {
      throw new Error('Transaction failed - accounts were modified');
    }
    
    console.log(`✅ Transferred $${amount} from ${fromAccount} to ${toAccount}`);
    return { success: true };
    
  } catch (error) {
    console.error('Transfer failed:', error);
    return { success: false, error: error.message };
  }
}

// ===== REAL-WORLD: Atomic Counter with Limit =====
async function incrementWithLimit(key, limit) {
  await redis.watch(key);
  
  const current = parseInt(await redis.get(key)) || 0;
  
  if (current >= limit) {
    await redis.unwatch();
    return { success: false, message: 'Limit reached' };
  }
  
  const multi = redis.multi();
  multi.incr(key);
  
  const result = await multi.exec();
  
  if (result === null) {
    return { success: false, message: 'Conflict - try again' };
  }
  
  return { success: true, newValue: current + 1 };
}

// ===== REAL-WORLD: Inventory Management =====
class Inventory {
  async purchaseProduct(productId, quantity) {
    const key = `inventory:${productId}`;
    
    try {
      await redis.watch(key);
      
      const stock = parseInt(await redis.get(key)) || 0;
      
      if (stock < quantity) {
        await redis.unwatch();
        return { success: false, message: 'Insufficient stock' };
      }
      
      const multi = redis.multi();
      multi.decrBy(key, quantity);
      multi.incrBy(`sales:${productId}`, quantity);
      
      const result = await multi.exec();
      
      if (result === null) {
        return { success: false, message: 'Stock changed - try again' };
      }
      
      return {
        success: true,
        remainingStock: stock - quantity
      };
      
    } catch (error) {
      await redis.unwatch();
      throw error;
    }
  }
  
  async restockProduct(productId, quantity) {
    await redis.incrBy(`inventory:${productId}`, quantity);
    console.log(`✅ Restocked ${quantity} units of product ${productId}`);
  }
  
  async getStock(productId) {
    return parseInt(await redis.get(`inventory:${productId}`)) || 0;
  }
}

// Usage:
async function examples() {
  // Transfer money
  await redis.set('account:alice:balance', 1000);
  await redis.set('account:bob:balance', 500);
  
  await transferMoney('alice', 'bob', 200);
  
  const aliceBalance = await redis.get('account:alice:balance');
  const bobBalance = await redis.get('account:bob:balance');
  
  console.log('Alice balance:', aliceBalance); // 800
  console.log('Bob balance:', bobBalance); // 700
  
  // Inventory
  const inventory = new Inventory();
  await inventory.restockProduct('product_1', 100);
  
  const result = await inventory.purchaseProduct('product_1', 5);
  console.log('Purchase result:', result);
  
  const stock = await inventory.getStock('product_1');
  console.log('Remaining stock:', stock); // 95
}

transactionOperations();
pipelineOperations();
examples();
```

---

## 5️⃣ Redis with Express.js - Complete Examples

### 🚀 **Complete Express + Redis Application**

**Project Structure:**
```
redis-express-app/
├── config/
│   └── redis.js
├── middleware/
│   ├── cache.js
│   └── rateLimit.js
├── routes/
│   ├── users.js
│   └── products.js
├── services/
│   ├── sessionService.js
│   └── cacheService.js
├── server.js
├── package.json
└── .env
```

**Install dependencies:**
```bash
npm init -y
npm install express redis dotenv
```

**`.env`**
```
PORT=5000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=myStrongPassword123
NODE_ENV=development
```

**`config/redis.js`**
```javascript
const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD
});

client.on('error', (err) => console.error('❌ Redis Client Error', err));
client.on('connect', () => console.log('✅ Redis Connected'));
client.on('ready', () => console.log('✅ Redis Ready'));

// Connect immediately
(async () => {
  await client.connect();
})();

module.exports = client;
```

---

**`middleware/cache.js`**
```javascript
const redis = require('../config/redis');

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        console.log('✅ Cache HIT:', key);
        return res.json(JSON.parse(cachedData));
      }
      
      console.log('❌ Cache MISS:', key);
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json
      res.json = (data) => {
        // Cache the response
        redis.setEx(key, duration, JSON.stringify(data))
          .catch(err => console.error('Cache set error:', err));
        
        // Send response
        return originalJson(data);
      };
      
      next();
      
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache
const clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️ Cleared ${keys.length} cache keys`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

module.exports = { cache, clearCache };
```

---

**`middleware/rateLimit.js`**
```javascript
const redis = require('../config/redis');

// Rate limiting middleware
const rateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    max = 10, // 10 requests per window
    message = 'Too many requests, please try again later'
  } = options;
  
  return async (req, res, next) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `rate_limit:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      // Set headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      
      if (current > max) {
        const ttl = await redis.ttl(key);
        res.setHeader('Retry-After', ttl);
        
        return res.status(429).json({
          success: false,
          message,
          retryAfter: ttl
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Fail open - allow request if Redis is down
    }
  };
};

module.exports = rateLimit;
```

---

**`services/sessionService.js`**
```javascript
const redis = require('../config/redis');

class SessionService {
  constructor() {
    this.prefix = 'session:';
    this.ttl = 86400; // 24 hours
  }
  
  // Create session
  async create(userId, data) {
    const sessionId = `${this.prefix}${userId}:${Date.now()}`;
    const sessionData = {
      userId,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    await redis.setEx(
      sessionId,
      this.ttl,
      JSON.stringify(sessionData)
    );
    
    return sessionId;
  }
  
  // Get session
  async get(sessionId) {
    const data = await redis.get(sessionId);
    return data ? JSON.parse(data) : null;
  }
  
  // Update session
  async update(sessionId, data) {
    const existing = await this.get(sessionId);
    if (!existing) return null;
    
    const updated = { ...existing, ...data };
    const ttl = await redis.ttl(sessionId);
    
    await redis.setEx(sessionId, ttl, JSON.stringify(updated));
    return updated;
  }
  
  // Delete session
  async delete(sessionId) {
    await redis.del(sessionId);
  }
  
  // Refresh session TTL
  async refresh(sessionId) {
    await redis.expire(sessionId, this.ttl);
  }
  
  // Get all user sessions
  async getUserSessions(userId) {
    const pattern = `${this.prefix}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    const sessions = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        sessions.push({
          sessionId: key,
          data: JSON.parse(data)
        });
      }
    }
    
    return sessions;
  }
  
  // Delete all user sessions
  async deleteAllUserSessions(userId) {
    const pattern = `${this.prefix}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    return keys.length;
  }
}

module.exports = new SessionService();
```

---

**`services/cacheService.js`**
```javascript
const redis = require('../config/redis');

class CacheService {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key, value, ttl = 3600) {
    await redis.setEx(key, ttl, JSON.stringify(value));
  }
  
  async delete(key) {
    await redis.del(key);
  }
  
  async deletePattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    return keys.length;
  }
  
  async remember(key, ttl, callback) {
    let data = await this.get(key);
    
    if (data === null) {
      data = await callback();
      await this.set(key, data, ttl);
    }
    
    return data;
  }
  
  async increment(key, amount = 1) {
    return await redis.incrBy(key, amount);
  }
  
  async decrement(key, amount = 1) {
    return await redis.decrBy(key, amount);
  }
  
  async exists(key) {
    return await redis.exists(key) === 1;
  }
  
  async ttl(key) {
    return await redis.ttl(key);
  }
}

module.exports = new CacheService();
```

---

**`routes/users.js`**
```javascript
const express = require('express');
const router = express.Router();
const { cache, clearCache } = require('../middleware/cache');
const rateLimit = require('../middleware/rateLimit');
const sessionService = require('../services/sessionService');

// Mock database
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' }
];

// Get all users (with caching)
router.get('/', cache(60), (req, res) => {
  // Simulate slow database query
  setTimeout(() => {
    res.json({
      success: true,
      data: users,
      cached: false
    });
  }, 1000);
});

// Get user by ID (with caching)
router.get('/:id', cache(300), (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create user (clear cache)
router.post('/', rateLimit({ max: 5, windowMs: 60000 }), async (req, res) => {
  const { name, email, role } = req.body;
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    role: role || 'user'
  };
  
  users.push(newUser);
  
  // Clear users cache
  await clearCache('cache:/api/users*');
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Login (create session)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simulate authentication
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Create session
  const sessionId = await sessionService.create(user.id, {
    email: user.email,
    role: user.role,
    ip: req.ip
  });
  
  res.json({
    success: true,
    sessionId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Get session
router.get('/session/:sessionId', async (req, res) => {
  const session = await sessionService.get(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }
  
  res.json({
    success: true,
    data: session
  });
});

// Logout (delete session)
router.delete('/logout/:sessionId', async (req, res) => {
  await sessionService.delete(req.params.sessionId);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
```

---

**`routes/products.js`**
```javascript
const express = require('express');
const router = express.Router();
const redis = require('../config/redis');
const { cache } = require('../middleware/cache');
const cacheService = require('../services/cacheService');

// Mock products
const products = [
  { id: 1, name: 'iPhone 15 Pro', price: 999, stock: 50, views: 0 },
  { id: 2, name: 'MacBook Pro', price: 1999, stock: 30, views: 0 },
  { id: 3, name: 'AirPods Pro', price: 249, stock: 100, views: 0 }
];

// Get all products (with caching)
router.get('/', cache(30), (req, res) => {
  res.json({
    success: true,
    data: products
  });
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Increment view count in Redis
  const viewKey = `product:${productId}:views`;
  const views = await redis.incr(viewKey);
  
  res.json({
    success: true,
    data: {
      ...product,
      views
    }
  });
});

// Get trending products (most viewed)
router.get('/trending/top', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // Get top products from sorted set
  const topProducts = await redis.zRevRangeWithScores('trending:products', 0, limit - 1);
  
  const results = topProducts.map(item => ({
    productId: item.value,
    score: item.score
  }));
  
  res.json({
    success: true,
    data: results
  });
});

// Track product view for trending
router.post('/:id/view', async (req, res) => {
  const productId = req.params.id;
  
  // Add to trending sorted set
  await redis.zIncrBy('trending:products', 1, productId);
  
  res.json({
    success: true,
    message: 'View tracked'
  });
});

// Purchase product (with inventory check)
router.post('/:id/purchase', async (req, res) => {
  const productId = parseInt(req.params.id);
  const quantity = parseInt(req.body.quantity) || 1;
  
  const inventoryKey = `inventory:${productId}`;
  
  try {
    // Use WATCH for optimistic locking
    await redis.watch(inventoryKey);
    
    const stock = parseInt(await redis.get(inventoryKey)) || 0;
    
    if (stock < quantity) {
      await redis.unwatch();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }
    
    // Execute transaction
    const multi = redis.multi();
    multi.decrBy(inventoryKey, quantity);
    multi.incrBy(`sales:${productId}`, quantity);
    
    const result = await multi.exec();
    
    if (result === null) {
      return res.status(409).json({
        success: false,
        message: 'Stock changed - please try again'
      });
    }
    
    res.json({
      success: true,
      message: 'Purchase successful',
      remainingStock: stock - quantity
    });
    
  } catch (error) {
    await redis.unwatch();
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

---

**`server.js`**
```javascript
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  const redis = require('./config/redis');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  const redis = require('./config/redis');
  await redis.quit();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
```

---

**Test the API:**

```bash
# Start Redis (Docker)
docker-compose up -d

# Start server
npm start

# Test endpoints

# 1. Get users (first call - slow, no cache)
curl http://localhost:5000/api/users

# 2. Get users again (fast, from cache)
curl http://localhost:5000/api/users

# 3. Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# 4. Get products
curl http://localhost:5000/api/products

# 5. View product (increments view count)
curl http://localhost:5000/api/products/1

# 6. Purchase product
curl -X POST http://localhost:5000/api/products/1/purchase \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'

# 7. Track product view for trending
curl -X POST http://localhost:5000/api/products/1/view

# 8. Get trending products
curl http://localhost:5000/api/products/trending/top?limit=5
```

---

## 6️⃣ Best Practices & Common Pitfalls

### ✅ **Best Practices**

#### 1. **Use Connection Pooling**

```javascript
// ❌ WRONG - Creating new client for each request
app.get('/api/data', async (req, res) => {
  const client = redis.createClient();
  await client.connect();
  const data = await client.get('key');
  await client.quit();
  res.json(data);
});

// ✅ CORRECT - Reuse single client
const client = redis.createClient();
await client.connect();

app.get('/api/data', async (req, res) => {
  const data = await client.get('key');
  res.json(data);
});
```

---

#### 2. **Always Set TTL on Keys**

```javascript
// ❌ WRONG - Keys never expire (memory leak)
await redis.set('session:user123', 'data');

// ✅ CORRECT - Always set expiration
await redis.setEx('session:user123', 3600, 'data');
```

---

#### 3. **Use Namespacing**

```javascript
// ✅ CORRECT - Organized key structure
const keys = {
  user: (id) => `user:${id}`,
  userSession: (id) => `session:user:${id}`,
  userCache: (id) => `cache:user:${id}`,
  product: (id) => `product:${id}`,
  inventory: (id) => `inventory:product:${id}`
};

await redis.set(keys.user(123), 'Alice');
```

---

#### 4. **Handle Errors Gracefully**

```javascript
// ✅ CORRECT - Fail gracefully if Redis is down
async function getCachedData(key, fallback) {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : await fallback();
  } catch (error) {
    console.error('Redis error:', error);
    return await fallback(); // Continue without cache
  }
}
```

---

#### 5. **Use Pipelining for Bulk Operations**

```javascript
// ❌ WRONG - Multiple round trips
for (let i = 0; i < 1000; i++) {
  await redis.set(`key:${i}`, `value${i}`);
}

// ✅ CORRECT - Single round trip
const pipeline = redis.multi();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value${i}`);
}
await pipeline.exec();
```

---

### ⚠️ **Common Pitfalls**

#### 1. **Forgetting to Parse JSON**

```javascript
// ❌ WRONG
await redis.set('user', { name: 'Alice' }); // Stores [object Object]

// ✅ CORRECT
await redis.set('user', JSON.stringify({ name: 'Alice' }));
const data = JSON.parse(await redis.get('user'));
```

---

#### 2. **Not Handling Non-Existent Keys**

```javascript
// ❌ WRONG - Crashes if key doesn't exist
const count = parseInt(await redis.get('counter'));

// ✅ CORRECT
const count = parseInt(await redis.get('counter')) || 0;
```

---

#### 3. **Memory Leak from Keys Without TTL**

```javascript
// ❌ WRONG - Keys accumulate forever
await redis.set(`temp:${Date.now()}`, 'data');

// ✅ CORRECT - Always set TTL for temporary data
await redis.setEx(`temp:${Date.now()}`, 3600, 'data');
```

---

#### 4. **Using Blocking Commands in API Routes**

```javascript
// ❌ WRONG - Blocks entire server
app.get('/api/data', async (req, res) => {
  const data = await redis.blPop('queue', 0); // Blocks forever!
  res.json(data);
});

// ✅ CORRECT - Use timeout or separate worker
const data = await redis.blPop('queue', 5); // 5 second timeout
```

---

## 7️⃣ Cheat Sheet / Summary

### 🔥 **Quick Reference**

**Basic Commands:**
```javascript
// Strings
await redis.set('key', 'value');
await redis.get('key');
await redis.setEx('key', 60, 'value'); // With TTL
await redis.incr('counter');
await redis.del('key');

// Hashes
await redis.hSet('user:1', { name: 'Alice', age: 30 });
await redis.hGetAll('user:1');
await redis.hGet('user:1', 'name');

// Lists
await redis.lPush('queue', 'item');
await redis.rPush('queue', 'item');
await redis.lPop('queue');
await redis.lRange('queue', 0, -1);

// Sets
await redis.sAdd('tags', 'nodejs', 'redis');
await redis.sMembers('tags');
await redis.sIsMember('tags', 'nodejs');

// Sorted Sets
await redis.zAdd('leaderboard', [{ score: 100, value: 'player1' }]);
await redis.zRevRangeWithScores('leaderboard', 0, 9);
await redis.zRank('leaderboard', 'player1');

// TTL
await redis.expire('key', 300);
await redis.ttl('key');
await redis.persist('key');
```

---

**Docker Commands:**
```bash
# Start Redis
docker run --name redis -p 6379:6379 -d redis

# With password
docker run --name redis -p 6379:6379 -d redis redis-server --requirepass mypassword

# Connect to CLI
docker exec -it redis redis-cli

# View logs
docker logs redis

# Stop/Start
docker stop redis
docker start redis

# Remove
docker rm -f redis
```
---

## 🎉 **Key Takeaways**

✅ **Redis is ultra-fast** because it stores data in RAM  
✅ **Use for caching**, not as primary database  
✅ **Always set TTL** to prevent memory leaks  
✅ **Docker makes setup easy** across all platforms  
✅ **Namespace your keys** for organization  
✅ **Handle errors gracefully** - app should work without Redis  
✅ **Use right data structure** for the job  
✅ **Monitor memory usage** in production  
✅ **Set up persistence** for important data  
✅ **Use transactions** for atomic operations  

---