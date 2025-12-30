# Zero-to-Hero: Node.js `fs` Module (File System)

---

## 1. The Basics (What & Why?)

### **What is the `fs` Module?**

The `fs` (File System) module in Node.js allows you to interact with the file system on your computer. You can **create, read, update, delete, and rename** files and directories.

**Simple Analogy:**
Think of your computer's file system as a library:
- **`fs` module** = Librarian that helps you find, read, write, and organize books
- **Files** = Books
- **Directories** = Shelves

```javascript
const fs = require('fs'); // Import the librarian
```

**Why do we need it?**
- Store user data (profiles, preferences)
- Save logs for debugging
- Process uploaded files (images, documents)
- Read configuration files
- Generate reports (CSV, PDF)
- Build CLI tools

---

### **The Three Flavors of `fs`**

Node.js provides **three ways** to work with files:

| Method | Style | Blocking? | Use Case |
|--------|-------|-----------|----------|
| **Synchronous** (`fs.readFileSync`) | Procedural | ❌ **YES** (blocks code) | Small scripts, initialization code |
| **Callback** (`fs.readFile`) | Callback-based | ✅ No (async) | Legacy code, simple operations |
| **Promises** (`fs.promises.readFile`) | Promise-based | ✅ No (async) | Modern code, clean async/await |

---

## Comparison: Sync vs Callback vs Promises vs Async/Await

### **Example: Reading a File**

#### **1. Synchronous (Blocking)**
```javascript
const fs = require('fs');

console.log('Start');
const data = fs.readFileSync('file.txt', 'utf8'); // ⏸️ BLOCKS HERE
console.log(data);
console.log('End');

// Output:
// Start
// (waits for file read)
// File contents...
// End
```

**Problems:**
- ❌ Blocks entire Node.js event loop
- ❌ Server can't handle other requests while reading
- ❌ Bad for web servers (use only in scripts/initialization)

---

#### **2. Callback (Non-blocking)**
```javascript
const fs = require('fs');

console.log('Start');
fs.readFile('file.txt', 'utf8', (err, data) => { // ✅ Non-blocking
    if (err) console.error(err);
    else console.log(data);
});
console.log('End');

// Output:
// Start
// End
// (then file contents...)
```

**Problems:**
- ❌ Callback hell (nested callbacks)
- ❌ Error handling scattered
- ❌ Hard to read/maintain

---

#### **3. Promises (.then/.catch)**
```javascript
const fs = require('fs').promises;

console.log('Start');
fs.readFile('file.txt', 'utf8')
    .then(data => console.log(data))
    .catch(err => console.error(err))
    .finally(() => console.log('Operation complete'));
console.log('End');

// Output:
// Start
// End
// (then file contents...)
// Operation complete
```

**Benefits:**
- ✅ No callback hell
- ✅ Better error handling
- ✅ Chainable

---

#### **4. Async/Await (Modern & Best)**
```javascript
const fs = require('fs').promises;

async function readFileAsync() {
    try {
        console.log('Start');
        const data = await fs.readFile('file.txt', 'utf8');
        console.log(data);
        console.log('End');
    } catch (err) {
        console.error(err);
    }
}

readFileAsync();

// Output:
// Start
// (then file contents...)
// End
```

**Benefits:**
- ✅ Looks like synchronous code (easy to read)
- ✅ Clean error handling with try/catch
- ✅ Modern JavaScript standard
- ✅ **BEST PRACTICE** for production code

---

## 2. Line-by-Line Code Breakdown

### **fsSync.js - Synchronous Operations**

```javascript
const fileName = "test.txt"
const filePath = path.join(__dirname, fileName)
```
- `__dirname`: Current directory path (e.g., `/home/user/project`)
- `path.join()`: Safely joins paths (handles `/` vs `\` on different OS)
- `filePath`: Full path like `/home/user/project/test.txt`

---

#### **fs.writeFileSync() - Create/Overwrite File**

```javascript
const writeFile = fs.writeFileSync(
    filePath,
    "This is initial data",
    "utf8"
)
```

**What happens:**
```
1. Check if test.txt exists
   ├─ YES → Delete old content, write new content
   └─ NO → Create file, write content

2. Write "This is initial data" to file

3. Return undefined (writeFileSync has no return value)
```

**Parameters:**
- `filePath`: Where to write
- `"This is initial data"`: Content to write
- `"utf8"`: Encoding (converts string to bytes)

**⚠️ Important:**
```javascript
console.log(writeFile); // undefined (writeFileSync doesn't return anything)
```

---

#### **fs.readFileSync() - Read File**

```javascript
const readFile = fs.readFileSync(filePath, "utf8")
console.log(readFile); // "This is initial data"
```

**Without `"utf8"` encoding:**
```javascript
const readFile = fs.readFileSync(filePath); // No encoding
console.log(readFile); // <Buffer 54 68 69 73 20 69 73...>
console.log(readFile.toString()); // "This is initial data"
```

**Key Difference:**
- **With encoding:** Returns string directly
- **Without encoding:** Returns Buffer (binary data)

---

#### **fs.appendFileSync() - Add Content to File**

```javascript
const appendFile = fs.appendFileSync(
    filePath,
    "\nThis is updated data",
    "utf8"
)
```

**What happens:**
```
Before:
"This is initial data"

After append:
"This is initial data
This is updated data"
```

**Use `\n` for new line** (otherwise text gets concatenated without spaces)

---

#### **fs.unlinkSync() - Delete File**

```javascript
const fileDelete = fs.unlinkSync(filePath)
console.log(fileDelete); // undefined
```

**⚠️ Danger:**
- Permanent deletion (no trash/recycle bin)
- No confirmation prompt
- Cannot undo

---

#### **fs.renameSync() - Rename/Move File**

```javascript
const updatedFileName = "updatedTest.txt"
const newFilePath = path.join(__dirname, updatedFileName)

const renameFile = fs.renameSync(filePath, newFilePath)
console.log(renameFile); // undefined
```

**What happens:**
```
Before:
📁 project/
  └─ test.txt

After:
📁 project/
  └─ updatedTest.txt
```

**Can also move files:**
```javascript
fs.renameSync('./test.txt', '../test.txt'); // Move up one directory
```

---

### **fsAsync.js - Callback-Based Operations**

#### **fs.writeFile() - Async Write**

```javascript
fs.writeFile(filePath, "This is the initial data", 'utf8', (err) => {
    if (err) console.error(err)
    else console.log("File has been saved")
})
```

**Callback Pattern:**
```javascript
fs.writeFile(path, data, options, (err) => {
    // This runs AFTER file is written
    if (err) {
        // Handle error
    } else {
        // Success
    }
})
```

**Key Point:** Code after `fs.writeFile()` runs **immediately** (doesn't wait)

---

#### **fs.readFile() - Async Read**

```javascript
fs.readFile(filePath, 'utf8', (err, data) => {
    try {
        const fileData = data
        console.log(fileData);
    } catch (err) {
        console.error(err)
    } finally {
        console.log("Operation completed");
    }
})
```

**⚠️ Common Mistake:**
```javascript
let fileData;
fs.readFile('file.txt', 'utf8', (err, data) => {
    fileData = data; // Sets data inside callback
});
console.log(fileData); // undefined! (callback hasn't run yet)
```

**Fix with Callback:**
```javascript
fs.readFile('file.txt', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(data); // Access data here
    // Do other operations with data
});
```

---

#### **fs.appendFile() - Async Append**

```javascript
fs.appendFile(filePath, "\nThis is the updated data", 'utf8', (err) => {
    if (err) console.error(err)
    else console.log("File has been updated")
})
```

**Callback Hell Example:**
```javascript
// ❌ BAD: Nested callbacks (hard to read)
fs.writeFile('file.txt', 'Initial', (err) => {
    if (err) throw err;
    fs.appendFile('file.txt', '\nMore data', (err) => {
        if (err) throw err;
        fs.readFile('file.txt', 'utf8', (err, data) => {
            if (err) throw err;
            console.log(data);
        });
    });
});
```

---

#### **fs.unlink() - Async Delete**

```javascript
fs.unlink(filePath, (err) => {
    if (err) console.error(err)
    else console.log("File has been deleted")
})
```

---

### **fsPromise.js - Promise-Based Operations**

#### **fs.promises.writeFile() - Promise Write**

```javascript
fs.promises
    .writeFile(filePath, "This is the initial data", 'utf-8')
    .then(() => console.log("File created successfully!"))
    .catch((err) => console.error(err))
```

**Promise Chaining (Multiple Operations):**
```javascript
fs.promises.writeFile('file.txt', 'Initial')
    .then(() => fs.promises.appendFile('file.txt', '\nMore'))
    .then(() => fs.promises.readFile('file.txt', 'utf8'))
    .then(data => console.log(data))
    .catch(err => console.error(err))
    .finally(() => console.log('All done!'));
```

---

#### **fs.promises.readFile() - Promise Read**

```javascript
fs.promises
    .readFile(filePath, 'utf-8')
    .then((data) => console.log(data))
    .catch((err) => console.error(err))
```

**Why `.then()` and `.catch()`?**
- `.then()`: Handles success case
- `.catch()`: Centralized error handling
- `.finally()`: Runs regardless of success/failure

---

### **Async/Await - Modern Approach (YOUR MISSING CODE)**

```javascript
const fs = require('fs').promises;
const path = require('path');

const fileName = "fsAsyncAwait.txt";
const filePath = path.join(__dirname, fileName);

// ✅ BEST PRACTICE: Async/Await
async function fileOperations() {
    try {
        // 1. Write file
        await fs.writeFile(filePath, "This is initial data", 'utf8');
        console.log("File created!");

        // 2. Read file
        const data = await fs.readFile(filePath, 'utf8');
        console.log("File content:", data);

        // 3. Append to file
        await fs.appendFile(filePath, "\nThis is updated data", 'utf8');
        console.log("File updated!");

        // 4. Read again
        const updatedData = await fs.readFile(filePath, 'utf8');
        console.log("Updated content:", updatedData);

        // 5. Rename file
        const newPath = path.join(__dirname, "renamed.txt");
        await fs.rename(filePath, newPath);
        console.log("File renamed!");

        // 6. Delete file
        await fs.unlink(newPath);
        console.log("File deleted!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        console.log("Operation completed!");
    }
}

fileOperations();
```

---

## 3. Visual Flow Diagrams

### **Synchronous vs Asynchronous File Operations**

```
SYNCHRONOUS (fs.readFileSync):
═════════════════════════════════════════════════════════════════

Time ──────────────────────────────────────────────────────────>

T=0:   Start
       │
T=1:   console.log('Before read')
       │
T=2:   const data = fs.readFileSync('file.txt')  ⏸️ BLOCKS
       │
       │ (Waiting 100ms for disk read...)
       │
       │ (Server FROZEN - cannot handle other requests!)
       │
T=102: console.log(data)
       │
T=103: console.log('After read')
       │
T=104: End

Other Request: "Hey server, I need help!"
Server: "🚫 BUSY, wait 100ms..."


═════════════════════════════════════════════════════════════════

ASYNCHRONOUS (fs.promises.readFile):
═════════════════════════════════════════════════════════════════

Time ──────────────────────────────────────────────────────────>

T=0:   Start
       │
T=1:   console.log('Before read')
       │
T=2:   fs.promises.readFile('file.txt') ✅ Non-blocking
       │         │
       │         └──────> (Disk working in background...)
       │
T=3:   console.log('After read')  // Runs immediately!
       │
       │
       │ (Other code continues running)
       │
T=102: [Background] File read complete
       │
       └──> .then(data => console.log(data))

Other Request: "Hey server, I need help!"
Server: "✅ Sure! Here you go..."


═════════════════════════════════════════════════════════════════
```

---

### **Promise Chain vs Async/Await**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMISE CHAIN                                │
└─────────────────────────────────────────────────────────────────┘

fs.promises.writeFile('file.txt', 'Hello')
        │
        ▼
   .then(() => {
        return fs.promises.appendFile('file.txt', ' World');
   })
        │
        ▼
   .then(() => {
        return fs.promises.readFile('file.txt', 'utf8');
   })
        │
        ▼
   .then(data => {
        console.log(data); // "Hello World"
   })
        │
        ▼
   .catch(err => {
        console.error(err);
   })


┌─────────────────────────────────────────────────────────────────┐
│                   ASYNC/AWAIT (Same thing, cleaner)             │
└─────────────────────────────────────────────────────────────────┘

async function main() {
    try {
        await fs.promises.writeFile('file.txt', 'Hello');
        │
        ▼
        await fs.promises.appendFile('file.txt', ' World');
        │
        ▼
        const data = await fs.promises.readFile('file.txt', 'utf8');
        │
        ▼
        console.log(data); // "Hello World"
        
    } catch (err) {
        console.error(err);
    }
}
```

---

### **File Operation Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│              USER REQUESTS: "Create a file"                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         fs.writeFile('test.txt', 'Hello')                       │
│                                                                 │
│   Node.js calls OS (Operating System)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                Operating System (Windows/Mac/Linux)             │
│                                                                 │
│   1. Check if test.txt exists                                  │
│   2. Create file handle                                        │
│   3. Write bytes to disk                                       │
│   4. Close file handle                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Disk (Hard Drive/SSD)                       │
│                                                                 │
│   📁 /home/user/                                               │
│      └─ test.txt (Hello)                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Node.js callback fires                             │
│                                                                 │
│   callback(err = null) → Success!                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Real-World Production Examples

### **Example 1: User Profile Management System**

```javascript
const fs = require('fs').promises;
const path = require('path');

class UserProfileManager {
    constructor() {
        this.usersDir = path.join(__dirname, 'users');
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            await fs.mkdir(this.usersDir, { recursive: true });
            console.log('User storage initialized');
        } catch (err) {
            console.error('Failed to initialize storage:', err);
        }
    }

    async createProfile(userId, profileData) {
        const filePath = path.join(this.usersDir, `${userId}.json`);
        
        try {
            // Check if profile already exists
            await fs.access(filePath);
            throw new Error('Profile already exists');
        } catch (err) {
            if (err.code === 'ENOENT') {
                // File doesn't exist, create it
                const profile = {
                    ...profileData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await fs.writeFile(
                    filePath,
                    JSON.stringify(profile, null, 2),
                    'utf8'
                );
                
                return profile;
            }
            throw err;
        }
    }

    async getProfile(userId) {
        const filePath = path.join(this.usersDir, `${userId}.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error('Profile not found');
            }
            throw err;
        }
    }

    async updateProfile(userId, updates) {
        const filePath = path.join(this.usersDir, `${userId}.json`);
        
        try {
            const currentProfile = await this.getProfile(userId);
            const updatedProfile = {
                ...currentProfile,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            await fs.writeFile(
                filePath,
                JSON.stringify(updatedProfile, null, 2),
                'utf8'
            );
            
            return updatedProfile;
        } catch (err) {
            throw new Error(`Failed to update profile: ${err.message}`);
        }
    }

    async deleteProfile(userId) {
        const filePath = path.join(this.usersDir, `${userId}.json`);
        
        try {
            await fs.unlink(filePath);
            return { success: true, message: 'Profile deleted' };
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error('Profile not found');
            }
            throw err;
        }
    }

    async listAllProfiles() {
        try {
            const files = await fs.readdir(this.usersDir);
            const profiles = [];
            
            for (const file of files) {
                if (path.extname(file) === '.json') {
                    const userId = path.basename(file, '.json');
                    const profile = await this.getProfile(userId);
                    profiles.push(profile);
                }
            }
            
            return profiles;
        } catch (err) {
            throw new Error(`Failed to list profiles: ${err.message}`);
        }
    }
}

// Usage Example
async function main() {
    const manager = new UserProfileManager();
    
    try {
        // Create profile
        const profile = await manager.createProfile('user123', {
            name: 'Alice',
            email: 'alice@example.com',
            age: 28
        });
        console.log('Created:', profile);
        
        // Update profile
        const updated = await manager.updateProfile('user123', {
            age: 29,
            city: 'New York'
        });
        console.log('Updated:', updated);
        
        // Get profile
        const fetched = await manager.getProfile('user123');
        console.log('Fetched:', fetched);
        
        // List all profiles
        const all = await manager.listAllProfiles();
        console.log('All profiles:', all);
        
        // Delete profile
        await manager.deleteProfile('user123');
        console.log('Profile deleted');
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
```

---

### **Example 2: Application Logger**

```javascript
const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor(logDir = 'logs') {
        this.logDir = logDir;
        this.currentLogFile = null;
        this.initialize();
    }

    async initialize() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            this.currentLogFile = this.getLogFileName();
        } catch (err) {
            console.error('Failed to initialize logger:', err);
        }
    }

    getLogFileName() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        return path.join(this.logDir, `app-${dateStr}.log`);
    }

    formatLogEntry(level, message, metadata = {}) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...metadata
        }) + '\n';
    }

    async log(level, message, metadata = {}) {
        const logFile = this.getLogFileName();
        const entry = this.formatLogEntry(level, message, metadata);
        
        try {
            await fs.appendFile(logFile, entry, 'utf8');
        } catch (err) {
            console.error('Failed to write log:', err);
        }
    }

    async info(message, metadata) {
        await this.log('INFO', message, metadata);
    }

    async error(message, metadata) {
        await this.log('ERROR', message, metadata);
    }

    async warn(message, metadata) {
        await this.log('WARN', message, metadata);
    }

    async debug(message, metadata) {
        await this.log('DEBUG', message, metadata);
    }

    async readLogs(date) {
        const dateStr = date || new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `app-${dateStr}.log`);
        
        try {
            const data = await fs.readFile(logFile, 'utf8');
            return data.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        } catch (err) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw err;
        }
    }

    async deleteOldLogs(daysToKeep = 7) {
        try {
            const files = await fs.readdir(this.logDir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    console.log(`Deleted old log: ${file}`);
                }
            }
        } catch (err) {
            console.error('Failed to clean old logs:', err);
        }
    }
}

// Usage
async function main() {
    const logger = new Logger();
    
    // Log different levels
    await logger.info('Application started', { port: 3000 });
    await logger.error('Database connection failed', { error: 'ECONNREFUSED' });
    await logger.warn('High memory usage detected', { usage: '85%' });
    
    // Read today's logs
    const logs = await logger.readLogs();
    console.log('Today\'s logs:', logs);
    
    // Clean old logs
    await logger.deleteOldLogs(7);
}

main();
```

---

### **Example 3: Configuration Manager**

```javascript
const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
    constructor(configPath = 'config.json') {
        this.configPath = configPath;
        this.config = {};
        this.backupPath = configPath + '.backup';
    }

    async load() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(data);
            return this.config;
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Config doesn't exist, create default
                this.config = this.getDefaultConfig();
                await this.save();
                return this.config;
            }
            throw new Error(`Failed to load config: ${err.message}`);
        }
    }

    getDefaultConfig() {
        return {
            server: {
                port: 3000,
                host: 'localhost'
            },
            database: {
                host: 'localhost',
                port: 5432,
                name: 'myapp'
            },
            logging: {
                level: 'info',
                format: 'json'
            }
        };
    }

    async save() {
        try {
            // Create backup before saving
            try {
                await fs.copyFile(this.configPath, this.backupPath);
            } catch (err) {
                // Ignore if original doesn't exist
            }
            
            await fs.writeFile(
                this.configPath,
                JSON.stringify(this.config, null, 2),
                'utf8'
            );
        } catch (err) {
            throw new Error(`Failed to save config: ${err.message}`);
        }
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    async set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        // Navigate to nested object
        for (const k of keys) {
            if (!(k in target)) {
                target[k] = {};
            }
            target = target[k];
        }
        
        target[lastKey] = value;
        await this.save();
    }

    async reset() {
        this.config = this.getDefaultConfig();
        await this.save();
    }

    async restore() {
        try {
            await fs.copyFile(this.backupPath, this.configPath);
            await this.load();
        } catch (err) {
            throw new Error(`Failed to restore backup: ${err.message}`);
        }
    }
}

// Usage
async function main() {
    const config = new ConfigManager('app-config.json');
    
    // Load config
    await config.load();
    
    // Get values
    console.log('Port:', config.get('server.port'));
    
    // Set values
    await config.set('server.port', 4000);
    await config.set('server.env', 'production');
    
    // Reset to defaults
    await config.reset();
    
    // Restore from backup
    await config.restore();
}

main();
```

---

### **Example 4: File Upload Handler (Express)**

```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Save metadata
        const metadata = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date().toISOString()
        };
        
        const metadataPath = path.join(UPLOAD_DIR, `${req.file.filename}.json`);
        await fs.riteFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        res.json({
            success: true,
            file: metadata
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download endpoint
app.get('/download/:filename', async (req, res) => {
    try {
        const filePath = path.join(UPLOAD_DIR, req.params.filename);
        
        // Check if file exists
        await fs.access(filePath);
        
        // Read metadata
        const metadataPath = filePath + '.json';
        const metadataStr = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataStr);
        
        res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
        res.setHeader('Content-Type', metadata.mimetype);
        
        // Stream file to response
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Delete endpoint
app.delete('/delete/:filename', async (req, res) => {
    try {
        const filePath = path.join(UPLOAD_DIR, req.params.filename);
        const metadataPath = filePath + '.json';
        
        // Delete both file and metadata
        await fs.unlink(filePath);
        await fs.unlink(metadataPath);
        
        res.json({ success: true, message: 'File deleted' });
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// List all files
app.get('/files', async (req, res) => {
    try {
        const files = await fs.readdir(UPLOAD_DIR);
        const metadataFiles = files.filter(f => f.endsWith('.json'));
        
        const fileList = [];
        for (const metaFile of metadataFiles) {
            const data = await fs.readFile(path.join(UPLOAD_DIR, metaFile), 'utf8');
            fileList.push(JSON.parse(data));
        }
        
        res.json({ files: fileList });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 5. Best Practices & Common Pitfalls

### **Security Best Practices**

#### ✅ **DO's:**

1. **Always Validate File Paths (Prevent Directory Traversal)**
```javascript
const path = require('path');

// ❌ DANGEROUS: User can access any file
app.get('/read', (req, res) => {
    const filename = req.query.file; // Could be "../../etc/passwd"
    fs.readFile(filename, (err, data) => res.send(data));
});

// ✅ SAFE: Validate and restrict to specific directory
app.get('/read', async (req, res) => {
    const filename = req.query.file;
    const safeDir = path.join(__dirname, 'public');
    const filePath = path.join(safeDir, filename);
    
    // Check if file is within safe directory
    if (!filePath.startsWith(safeDir)) {
        return res.status(403).send('Access denied');
    }
    
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        res.send(data);
    } catch (err) {
        res.status(404).send('File not found');
    }
});
```

2. **Set File Permissions**
```javascript
// Create file with specific permissions (Unix)
await fs.writeFile('secrets.txt', 'sensitive data', {
    mode: 0o600 // Only owner can read/write
});

// Create directory with permissions
await fs.mkdir('private', {
    recursive: true,
    mode: 0o700 // Only owner can access
});
```

3. **Limit File Sizes**
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function readLimitedFile(filePath) {
    const stats = await fs.stat(filePath);
    
    if (stats.size > MAX_FILE_SIZE) {
        throw new Error('File too large');
    }
    
    return fs.readFile(filePath, 'utf8');
}
```

4. **Handle Errors Properly (Don't Expose Internal Paths)**
```javascript
// ❌ BAD: Exposes server path
app.get('/file', (req, res) => {
    fs.readFile('/var/www/secret/file.txt', (err, data) => {
        if (err) {
            res.send(err.message); // "ENOENT: no such file '/var/www/secret/file.txt'"
        }
    });
});

// ✅ GOOD: Generic error message
app.get('/file', async (req, res) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.send(data);
    } catch (err) {
        console.error('File read error:', err); // Log internally
        res.status(404).send('File not found'); // Generic message to client
    }
});
```

---

### **Common Beginner Mistakes**

#### **Mistake #1: Using Sync Methods in Server Code**
```javascript
// ❌ DISASTER: Blocks entire server
app.get('/data', (req, res) => {
    const data = fs.readFileSync('large-file.json'); // Blocks all requests!
    res.json(JSON.parse(data));
});

// ✅ CORRECT: Use async methods
app.get('/data', async (req, res) => {
    try {
        const data = await fs.promises.readFile('large-file.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read file' });
    }
});
```

#### **Mistake #2: Not Checking if File Exists Before Operations**
```javascript
// ❌ WRONG: Might crash if file doesn't exist
const data = await fs.readFile('config.json', 'utf8');

// ✅ CORRECT: Check first or handle error
try {
    await fs.access('config.json'); // Check if exists
    const data = await fs.readFile('config.json', 'utf8');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File does not exist');
        // Create default config
    } else {
        throw err;
    }
}
```

#### **Mistake #3: Forgetting to Close File Descriptors**
```javascript
// ❌ BAD: File descriptor leak
const fd = await fs.open('file.txt', 'r');
const buffer = Buffer.alloc(1024);
await fs.read(fd, buffer, 0, 1024, 0);
// Forgot to close! Memory leak!

// ✅ CORRECT: Always close
const fd = await fs.open('file.txt', 'r');
try {
    const buffer = Buffer.alloc(1024);
    await fs.read(fd, buffer, 0, 1024, 0);
} finally {
    await fs.close(fd); // Always close in finally block
}
```

#### **Mistake #4: Race Conditions (Multiple Operations on Same File)**
```javascript
// ❌ RACE CONDITION
// User 1: Read file
const data1 = await fs.readFile('counter.txt', 'utf8');
const count1 = parseInt(data1);

// User 2: Read file (before User 1 writes)
const data2 = await fs.readFile('counter.txt', 'utf8');
const count2 = parseInt(data2);

// User 1: Write
await fs.writeFile('counter.txt', String(count1 + 1));

// User 2: Write (overwrites User 1's change!)
await fs.writeFile('counter.txt', String(count2 + 1));

// ✅ SOLUTION: Use file locking library
const lockfile = require('proper-lockfile');

async function incrementCounter() {
    const release = await lockfile.lock('counter.txt');
    try {
        const data = await fs.readFile('counter.txt', 'utf8');
        const count = parseInt(data) + 1;
        await fs.writeFile('counter.txt', String(count));
    } finally {
        await release();
    }
}
```

#### **Mistake #5: Not Handling `ENOENT` (File Not Found) Error**
```javascript
// ❌ BAD: Generic error handling
try {
    await fs.unlink('file.txt');
} catch (err) {
    console.error('Error:', err); // What if file doesn't exist?
}

// ✅ GOOD: Handle specific errors
try {
    await fs.unlink('file.txt');
    console.log('File deleted');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File doesn't exist, nothing to delete');
    } else if (err.code === 'EPERM') {
        console.error('Permission denied');
    } else {
        console.error('Unexpected error:', err);
    }
}
```

---

### **Enterprise-Level Approaches**

#### **1. Atomic File Writes (Prevent Corruption)**
```javascript
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function atomicWriteFile(filePath, data) {
    const tempPath = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    
    try {
        // Write to temporary file first
        await fs.writeFile(tempPath, data, 'utf8');
        
        // Atomic rename (OS-level atomic operation)
        await fs.rename(tempPath, filePath);
        
    } catch (err) {
        // Clean up temp file if it exists
        try {
            await fs.unlink(tempPath);
        } catch {}
        throw err;
    }
}

// Usage
await atomicWriteFile('config.json', JSON.stringify(config));
```

#### **2. File Operation Queue (Prevent Race Conditions)**
```javascript
class FileQueue {
    constructor() {
        this.queues = new Map();
    }

    async enqueue(filePath, operation) {
        if (!this.queues.has(filePath)) {
            this.queues.set(filePath, Promise.resolve());
        }
        
        const currentQueue = this.queues.get(filePath);
        
        const newQueue = currentQueue.then(operation).catch(err => {
            console.error(`Operation failed for ${filePath}:`, err);
            throw err;
        });
        
        this.queues.set(filePath, newQueue);
        
        return newQueue;
    }
}

// Usage
const queue = new FileQueue();

// Multiple concurrent writes to same file
await Promise.all([
    queue.enqueue('data.json', async () => {
        const data = await fs.readFile('data.json', 'utf8');
        const json = JSON.parse(data);
        json.count += 1;
        await fs.writeFile('data.json', JSON.stringify(json));
    }),
    queue.enqueue('data.json', async () => {
        const data = await fs.readFile('data.json', 'utf8');
        const json = JSON.parse(data);
        json.count += 1;
        await fs.writeFile('data.json', JSON.stringify(json));
    })
]);
// Operations execute sequentially, no race condition!
```

#### **3. File Watching & Auto-Reload**
```javascript
const fs = require('fs');
const path = require('path');

class ConfigWatcher {
    constructor(configPath, callback) {
        this.configPath = configPath;
        this.callback = callback;
        this.config = null;
        this.watcher = null;
        
        this.start();
    }

    async loadConfig() {
        try {
            const data = await fs.promises.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(data);
            this.callback(this.config);
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    }

    start() {
        // Initial load
        this.loadConfig();
        
        // Watch for changes
        this.watcher = fs.watch(this.configPath, async (eventType) => {
            if (eventType === 'change') {
                console.log('Config file changed, reloading...');
                await this.loadConfig();
            }
        });
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}

// Usage
const watcher = new ConfigWatcher('app-config.json', (config) => {
    console.log('Config updated:', config);
    // Apply new configuration
});

// Clean up on process exit
process.on('SIGINT', () => {
    watcher.stop();
    process.exit();
});
```

---

## 6. Interview Preparation

### **Top 30 Interview Questions & Answers**

---

#### **Q1: What is the `fs` module in Node.js?**

**Answer:**
The `fs` (File System) module provides APIs for interacting with the file system, allowing you to create, read, update, and delete files and directories.

```javascript
const fs = require('fs'); // CommonJS
// OR
import fs from 'fs'; // ES6 modules
```

---

#### **Q2: What's the difference between `fs.readFileSync()` and `fs.readFile()`?**

**Answer:**

| Feature | `fs.readFileSync()` | `fs.readFile()` |
|---------|---------------------|-----------------|
| Blocking | ✅ Yes (synchronous) | ❌ No (asynchronous) |
| Returns | Data directly | Data via callback |
| Error handling | try/catch | Callback parameter |
| Use case | Scripts, initialization | Servers, production |

```javascript
// Sync - Blocks code execution
const data = fs.readFileSync('file.txt', 'utf8');

// Async - Non-blocking
fs.readFile('file.txt', 'utf8', (err, data) => {
    if (err) throw err;
    console.log(data);
});
```

---

#### **Q3: Why should you avoid synchronous file operations in production servers?**

**Answer:**
Synchronous operations **block the entire event loop**, preventing the server from handling other requests until the file operation completes.

```javascript
// 100 concurrent users trying to read a 1MB file:
// Sync: Server handles 1 user at a time (blocking)
// Async: Server handles all 100 simultaneously (non-blocking)
```

**Exception:** It's OK to use sync methods during server startup (before accepting connections).

---

#### **Q4: What does the `'utf8'` encoding parameter do?**

**Answer:**
It tells Node.js to convert binary data (Buffer) to a string using UTF-8 encoding.

```javascript
// Without encoding: Returns Buffer
const buf = fs.readFileSync('file.txt');
console.log(buf); // <Buffer 48 65 6c 6c 6f>

// With encoding: Returns string
const str = fs.readFileSync('file.txt', 'utf8');
console.log(str); // "Hello"
```

---

#### **Q5: How do you check if a file exists before reading it?**

**Answer:**

```javascript
// Method 1: fs.access() (recommended)
try {
    await fs.promises.access('file.txt');
    // File exists
    const data = await fs.promises.readFile('file.txt', 'utf8');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File does not exist');
    }
}

// Method 2: fs.existsSync() (deprecated but works)
if (fs.existsSync('file.txt')) {
    const data = fs.readFileSync('file.txt', 'utf8');
}

// Method 3: Just try to read (handle ENOENT error)
try {
    const data = await fs.promises.readFile('file.txt', 'utf8');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File not found');
    }
}
```

---

#### **Q6: What's the difference between `fs.writeFile()` and `fs.appendFile()`?**

**Answer:**

| Method | Behavior |
|--------|----------|
| `writeFile()` | **Overwrites** entire file content |
| `appendFile()` | **Adds** to end of file |

```javascript
// Initial: "Hello"

await fs.promises.writeFile('file.txt', 'World');
// Result: "World" (overwritten)

await fs.promises.appendFile('file.txt', ' Again');
// Result: "World Again" (appended)
```

---

#### **Q7: How do you rename or move a file?**

**Answer:**

```javascript
// Rename in same directory
await fs.promises.rename('old.txt', 'new.txt');

// Move to different directory
await fs.promises.rename('./old.txt', '../new-location/old.txt');

// Move AND rename
await fs.promises.rename('./file.txt', '../renamed.txt');
```

---

#### **Q8: How do you delete a file?**

**Answer:**

```javascript
// Method 1: fs.unlink()
await fs.promises.unlink('file.txt');

// Method 2: fs.rm() (Node.js 14.14+)
await fs.promises.rm('file.txt');

// Delete with error handling
try {
    await fs.promises.unlink('file.txt');
    console.log('File deleted');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File does not exist');
    } else {
        throw err;
    }
}
```

---

#### **Q9: What's the difference between `fs.unlink()` and `fs.rm()`?**

**Answer:**
- `fs.unlink()`: Deletes files only
- `fs.rm()`: Can delete files AND directories (with `recursive: true`)

```javascript
// Delete file
await fs.promises.unlink('file.txt');

// Delete empty directory
await fs.promises.rmdir('folder');

// Delete directory with contents (Node.js 14.14+)
await fs.promises.rm('folder', { recursive: true, force: true });
```

---

#### **Q10: How do you create a directory?**

**Answer:**

```javascript
// Create single directory
await fs.promises.mkdir('my-folder');

// Create nested directories (like mkdir -p)
await fs.promises.mkdir('path/to/nested/folder', { recursive: true });

// Create with specific permissions (Unix)
await fs.promises.mkdir('private-folder', {
    recursive: true,
    mode: 0o700 // Owner only
});
```

---

#### **Q11: How do you read all files in a directory?**

**Answer:**

```javascript
// Method 1: fs.readdir() - Returns filenames
const files = await fs.promises.readdir('./folder');
console.log(files); // ['file1.txt', 'file2.txt']

// Method 2: fs.readdir() with withFileTypes
const entries = await fs.promises.readdir('./folder', { withFileTypes: true });

for (const entry of entries) {
    if (entry.isFile()) {
        console.log('File:', entry.name);
    } else if (entry.isDirectory()) {
        console.log('Directory:', entry.name);
    }
}
```

---

#### **Q12: How do you get file information (size, creation date, etc.)?**

**Answer:**

```javascript
const stats = await fs.promises.stat('file.txt');

console.log('Size:', stats.size, 'bytes');
console.log('Created:', stats.birthtime);
console.log('Modified:', stats.mtime);
console.log('Is file:', stats.isFile());
console.log('Is directory:', stats.isDirectory());

// Check file permissions
console.log('Readable:', (stats.mode & fs.constants.R_OK) !== 0);
```

---

#### **Q13: How do you copy a file?**

**Answer:**

```javascript
// Method 1: fs.copyFile()
await fs.promises.copyFile('source.txt', 'destination.txt');

// Method 2: Read and write
const data = await fs.promises.readFile('source.txt');
await fs.promises.writeFile('destination.txt', data);

// Method 3: Using streams (for large files)
const readStream = fs.createReadStream('large-source.mp4');
const writeStream = fs.createWriteStream('large-dest.mp4');
readStream.pipe(writeStream);
```

---

#### **Q14: What are file flags in Node.js?**

**Answer:**
Flags control how files are opened.

| Flag | Meaning |
|------|---------|
| `'r'` | Read (default) |
| `'r+'` | Read + Write |
| `'w'` | Write (creates or truncates) |
| `'w+'` | Write + Read |
| `'a'` | Append (creates if not exists) |
| `'a+'` | Append + Read |

```javascript
// Open for reading
await fs.promises.writeFile('file.txt', 'data', { flag: 'r+' });

// Append without overwriting
await fs.promises.writeFile('file.txt', '\nMore data', { flag: 'a' });
```

---

#### **Q15: How do you handle JSON files?**

**Answer:**

```javascript
// Write JSON
const data = { name: 'Alice', age: 30 };
await fs.promises.writeFile(
    'data.json',
    JSON.stringify(data, null, 2), // Pretty print with 2-space indent
    'utf8'
);

// Read JSON
const jsonStr = await fs.promises.readFile('data.json', 'utf8');
const parsedData = JSON.parse(jsonStr);
console.log(parsedData.name); // 'Alice'

// With error handling
try {
    const jsonStr = await fs.promises.readFile('data.json', 'utf8');
    const data = JSON.parse(jsonStr);
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File not found');
    } else if (err instanceof SyntaxError) {
        console.log('Invalid JSON');
    }
}
```

---

#### **Q16: What's the difference between `fs.promises`, `fs` with callbacks, and `fs/promises`?**

**Answer:**

```javascript
// Method 1: fs with callbacks (oldest)
const fs = require('fs');
fs.readFile('file.txt', 'utf8', (err, data) => {});

// Method 2: fs.promises (Promise wrapper)
const fs = require('fs');
fs.promises.readFile('file.txt', 'utf8').then(data => {});

// Method 3: fs/promises (dedicated promise module, Node.js 14+)
const fs = require('fs/promises');
const data = await fs.readFile('file.txt', 'utf8');

// Recommendation: Use Method 3 in modern code
```

---

#### **Q17: How do you watch for file changes?**

**Answer:**

```javascript
// Method 1: fs.watch() (low-level, can fire multiple events)
const watcher = fs.watch('file.txt', (eventType, filename) => {
    console.log(`Event: ${eventType}, File: ${filename}`);
});

// Stop watching
watcher.close();

// Method 2: fs.watchFile() (polling-based, more reliable)
fs.watchFile('file.txt', (curr, prev) => {
    console.log('File modified');
    console.log('Previous size:', prev.size);
    console.log('Current size:', curr.size);
});

// Stop watching
fs.unwatchFile('file.txt');

// Production: Use a library like 'chokidar' for better reliability
```

---

#### **Q18: What are common error codes in fs operations?**

**Answer:**

| Code | Meaning |
|------|---------|
| `ENOENT` | File/directory does not exist |
| `EACCES` | Permission denied |
| `EEXIST` | File already exists |
| `EISDIR` | Expected file, got directory |
| `ENOTDIR` | Expected directory, got file |
| `EMFILE` | Too many open files |

```javascript
try {
    await fs.promises.readFile('file.txt');
} catch (err) {
    switch (err.code) {
        case 'ENOENT':
            console.log('File not found');
            break;
        case 'EACCES':
            console.log('Permission denied');
            break;
        default:
            console.log('Unknown error:', err);
    }
}
```

---

#### **Q19: How do you read a file line by line efficiently?**

**Answer:**

```javascript
const fs = require('fs');
const readline = require('readline');

async function readLineByLine(filePath) {
    const fileStream = fs.createReadStream(filePath);
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    for await (const line of rl) {
        console.log('Line:', line);
        // Process each line
    }
}

await readLineByLine('large-file.txt');
```

---

#### **Q20: How do you prevent directory traversal attacks?**

**Answer:**

```javascript
const path = require('path');

function sanitizeFilePath(userInput, baseDir) {
    // Resolve to absolute path
    const absolutePath = path.resolve(baseDir, userInput);
    
    // Check if resolved path is still within baseDir
    if (!absolutePath.startsWith(baseDir)) {
        throw new Error('Access denied: Path outside base directory');
    }
    
    return absolutePath;
}

// Usage
try {
    const safePath = sanitizeFilePath('../../../etc/passwd', '/app/public');
    // Will throw error
} catch (err) {
    console.error(err.message);
}
```

---

#### **Q21: What's the difference between `fs.truncate()` and `fs.writeFile()`?**

**Answer:**
- `fs.writeFile()`: Replaces entire file content
- `fs.truncate()`: Cuts file to specific size (keeping or removing bytes)

```javascript
// File contains: "Hello World" (11 bytes)

// Truncate to 5 bytes
await fs.promises.truncate('file.txt', 5);
// Result: "Hello" (last 6 bytes removed)

// writeFile replaces everything
await fs.promises.writeFile('file.txt', 'Hi');
// Result: "Hi"
```

---

#### **Q22: How do you handle large file uploads without running out of memory?**

**Answer:**

```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.post('/upload', (req, res) => {
    const writeStream = fs.createWriteStream('uploaded-file.bin');
    
    let uploadedSize = 0;
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    
    req.on('data', (chunk) => {
        uploadedSize += chunk.length;
        
        if (uploadedSize > MAX_SIZE) {
            req.pause();
            writeStream.destroy();
            fs.unlink('uploaded-file.bin', () => {});
            res.status(413).send('File too large');
            return;
        }
        
        writeStream.write(chunk);
    });
    
    req.on('end', () => {
        writeStream.end();
        res.send('Upload complete');
    });
    
    writeStream.on('error', (err) => {
        res.status(500).send('Upload failed');
    });
});
```

---

#### **Q23: How do you implement file rotation (like log rotation)?**

**Answer:**

```javascript
const fs = require('fs').promises;
const path = require('path');

async function rotateFile(filePath, maxSize) {
    try {
        const stats = await fs.stat(filePath);
        
        if (stats.size > maxSize) {
            // Rename current file with timestamp
            const timestamp = Date.now();
            const ext = path.extname(filePath);
            const base = path.basename(filePath, ext);
            const dir = path.dirname(filePath);
            
            const archivedPath = path.join(dir, `${base}.${timestamp}${ext}`);
            await fs.rename(filePath, archivedPath);
            
            // Create new empty file
            await fs.writeFile(filePath, '', 'utf8');
            
            console.log(`Rotated ${filePath} to ${archivedPath}`);
        }
    } catch (err) {
        console.error('Rotation failed:', err);
    }
}

// Usage
await rotateFile('app.log', 10 * 1024 * 1024); // Rotate if > 10MB
```

---

#### **Q24: What are symbolic links and how do you work with them?**

**Answer:**

```javascript
// Create symbolic link (symlink)
await fs.promises.symlink('target-file.txt', 'link-to-file.txt');

// Read link target
const target = await fs.promises.readlink('link-to-file.txt');
console.log('Points to:', target);

// Get stats of link itself (not target)
const stats = await fs.promises.lstat('link-to-file.txt');
console.log('Is symlink:', stats.isSymbolicLink());

// Get stats of target file
const targetStats = await fs.promises.stat('link-to-file.txt');
```

---

#### **Q25: How do you implement atomic file writes?**

**Answer:**
See Enterprise-Level Approaches section above (Atomic File Writes).

**Key concept:** Write to temporary file, then rename (rename is atomic at OS level).

---

#### **Q26: How do you read a file in chunks?**

**Answer:**

```javascript
const fs = require('fs');

async function readInChunks(filePath, chunkSize = 1024) {
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(chunkSize);
    
    try {
        let bytesRead;
        let position = 0;
        
        while (true) {
            const result = await fd.read(buffer, 0, chunkSize, position);
            bytesRead = result.bytesRead;
            
            if (bytesRead === 0) break;
            
            // Process chunk
            console.log('Chunk:', buffer.slice(0, bytesRead).toString());
            
            position += bytesRead;
        }
    } finally {
        await fd.close();
    }
}

await readInChunks('file.txt', 1024); // Read 1KB at a time
```

---

#### **Q27: How do you handle concurrent file writes safely?**

**Answer:**
See Enterprise-Level Approaches section (File Operation Queue).

**Key strategies:**
1. Use a queue to serialize operations on same file
2. Use file locking libraries (`proper-lockfile`)
3. Use atomic operations (write to temp, then rename)

---

#### **Q28: What's the difference between `createReadStream()` and `readFile()`?**

**Answer:**

| Feature | `readFile()` | `createReadStream()` |
|---------|--------------|----------------------|
| Memory | Loads entire file | Loads chunks (64KB) |
| Best for | Small files (<10MB) | Large files (videos, logs) |
| Returns | Promise/callback | EventEmitter (stream) |

```javascript
// readFile: Load all at once
const data = await fs.promises.readFile('small.txt', 'utf8');

// createReadStream: Process in chunks
const stream = fs.createReadStream('large.mp4');
stream.on('data', (chunk) => {
    // Process 64KB chunk
});
```

---

#### **Q29: How do you calculate a file's hash (checksum)?**

**Answer:**

```javascript
const crypto = require('crypto');
const fs = require('fs');

function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (chunk) => {
            hash.update(chunk);
        });
        
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        
        stream.on('error', reject);
    });
}

// Usage
const hash = await calculateFileHash('file.zip');
console.log('SHA-256:', hash);
```

---

#### **Q30: How do you implement a simple file-based database?**

**Answer:**

```javascript
class FileDB {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = {};
    }

    async load() {
        try {
            const content = await fs.promises.readFile(this.filePath, 'utf8');
            this.data = JSON.parse(content);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.data = {};
            } else {
                throw err;
            }
        }
    }

    async save() {
        const temp = `${this.filePath}.tmp`;
        await fs.promises.writeFile(temp, JSON.stringify(this.data, null, 2));
        await fs.promises.rename(temp, this.filePath);
    }

    async set(key, value) {
        this.data[key] = value;
        await this.save();
    }

    get(key) {
        return this.data[key];
    }

    async delete(key) {
        delete this.data[key];
        await this.save();
    }
}

// Usage
const db = new FileDB('data.json');
await db.load();
await db.set('user:1', { name: 'Alice', age: 30 });
console.log(db.get('user:1'));
```

---

## 7. Cheat Sheet / Summary

### **Quick Reference Guide**

---

### **File Operations**

```javascript
const fs = require('fs').promises; // Modern promises API

// CREATE / WRITE (overwrites)
await fs.writeFile('file.txt', 'content', 'utf8');

// READ
const data = await fs.readFile('file.txt', 'utf8');

// APPEND
await fs.appendFile('file.txt', '\nmore content', 'utf8');

// DELETE
await fs.unlink('file.txt');

// RENAME / MOVE
await fs.rename('old.txt', 'new.txt');

// COPY
await fs.copyFile('source.txt', 'dest.txt');

// CHECK IF EXISTS
try {
    await fs.access('file.txt');
    // Exists
} catch {
    // Doesn't exist
}

// GET FILE INFO
const stats = await fs.stat('file.txt');
console.log(stats.size, stats.mtime);
```

---

### **Directory Operations**

```javascript
// CREATE DIRECTORY
await fs.mkdir('folder', { recursive: true });

// READ DIRECTORY
const files = await fs.readdir('folder');

// READ WITH FILE TYPES
const entries = await fs.readdir('folder', { withFileTypes: true });
for (const entry of entries) {
    if (entry.isFile()) console.log('File:', entry.name);
    if (entry.isDirectory()) console.log('Dir:', entry.name);
}

// DELETE DIRECTORY
await fs.rmdir('empty-folder'); // Empty only
await fs.rm('folder', { recursive: true }); // With contents
```

---

### **Three Styles Comparison**

```javascript
// 1. SYNCHRONOUS (blocking - use only in scripts)
const data = fs.readFileSync('file.txt', 'utf8');

// 2. CALLBACK (legacy - async but messy)
fs.readFile('file.txt', 'utf8', (err, data) => {
    if (err) throw err;
    console.log(data);
});

// 3. PROMISES (modern - clean async)
const data = await fs.promises.readFile('file.txt', 'utf8');

// 4. ASYNC/AWAIT (BEST PRACTICE)
async function read() {
    try {
        const data = await fs.promises.readFile('file.txt', 'utf8');
        return data;
    } catch (err) {
        console.error(err);
    }
}
```

---

### **Common Error Handling**

```javascript
try {
    const data = await fs.promises.readFile('file.txt', 'utf8');
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('File not found');
    } else if (err.code === 'EACCES') {
        console.log('Permission denied');
    } else if (err.code === 'EISDIR') {
        console.log('Is a directory, not a file');
    } else {
        console.log('Unknown error:', err);
    }
}
```

---

### **Performance Tips**

```javascript
// ❌ BAD: Blocks server
const data = fs.readFileSync('large.mp4');

// ✅ GOOD: Non-blocking
const data = await fs.promises.readFile('small.json', 'utf8');

// ✅ BEST: Streaming for large files
const stream = fs.createReadStream('large.mp4');
stream.pipe(response);
```

---

### **Security Checklist**

```javascript
// ✅ Validate paths
const safePath = path.join(baseDir, userInput);
if (!safePath.startsWith(baseDir)) throw new Error('Invalid path');

// ✅ Limit file sizes
const stats = await fs.stat(filePath);
if (stats.size > MAX_SIZE) throw new Error('File too large');

// ✅ Set permissions
await fs.writeFile('private.txt', 'secret', { mode: 0o600 });

// ✅ Don't expose internal paths in errors
res.status(404).send('File not found'); // Generic message
```

---
