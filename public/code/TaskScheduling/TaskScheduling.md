# 🕐 Task Scheduling (Cron Jobs): Zero-to-Hero Complete Guide

---

## 1️⃣ The Basics (What & Why?)

### 🤔 What is Task Scheduling?

**Task Scheduling** is automating tasks to run at specific times or intervals without manual intervention. Think of it like setting alarms or reminders that execute code automatically.

**Simple analogy:** ⏰
- **Alarm Clock** = Cron job
- **Time you set** = Cron expression (`* * * * *`)
- **Action when alarm rings** = Your task function
- **Daily routine** = Scheduled recurring tasks

**Why use Task Scheduling?**
- ✅ **Automation**: No manual intervention needed
- ✅ **Consistency**: Tasks run reliably at set times
- ✅ **Background Processing**: Don't block user requests
- ✅ **Maintenance**: Clean up old data, generate reports
- ✅ **Monitoring**: Check system health periodically

---

### 🆚 Comparison: node-cron vs Other Scheduling Solutions

| Feature | node-cron | Bull Queue | Agenda | node-schedule | Linux Cron |
|---------|-----------|------------|---------|---------------|------------|
| **Setup** | Very Simple | Complex | Medium | Simple | OS-level |
| **Persistence** | No | Yes (Redis) | Yes (MongoDB) | No | No |
| **Priority** | No | Yes | Yes | No | No |
| **Retry Logic** | Manual | Built-in | Built-in | Manual | Manual |
| **UI Dashboard** | No | Yes | No | No | No |
| **Best For** | Simple crons | Job queues | Complex jobs | Node.js only | System tasks |
| **Dependencies** | None | Redis | MongoDB | None | Linux only |

---

### 📊 **When to Use What?**

**Use node-cron when:**
```javascript
✅ Simple periodic tasks (cleanup, reports)
✅ No need for persistence
✅ Lightweight solution needed
✅ Tasks run on schedule (not on-demand)
```

**Use Bull Queue when:**
```javascript
✅ Job queues needed (email sending, image processing)
✅ Need retry logic and failure handling
✅ Want a dashboard to monitor jobs
✅ Need job prioritization
✅ Multiple workers processing jobs
```

**Use Agenda when:**
```javascript
✅ Need to persist scheduled jobs in database
✅ Complex scheduling requirements
✅ Jobs need to survive server restarts
✅ Already using MongoDB
```

---

### 🔄 **How Cron Jobs Work**

```
Server starts → Cron scheduler initialized → Checks schedule every second
                                                    ↓
                                            Time matches schedule?
                                            /              \
                                          Yes               No
                                           ↓                ↓
                                    Execute task      Continue checking
                                           ↓
                                    Wait for next interval
```

**Important:** Cron jobs run **inside your Node.js process**. If server crashes, scheduled tasks stop.

---

## 2️⃣ Line-by-Line Code Breakdown

### 📦 **server.js - Main Server Setup**

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 5001;
```

**What's happening:**
- Standard Express server setup
- Port from environment variable or defaults to 5001

---

```javascript
// require('./schedular1');
// require('./schedular2');
require('./schedular3');
```

**Critical detail:** Simply requiring the scheduler file **starts the cron job immediately**!

```javascript
// When you do this:
require('./schedular3');

// It's equivalent to:
const schedulerModule = require('./schedular3');
// The cron.schedule() inside schedular3.js executes immediately
// The scheduled task starts running in the background
```

**Why this works:**
- Node.js executes code when you `require()` a file
- `cron.schedule()` registers the task immediately
- No need to call any function to start the scheduler

---

```javascript
const dotenv = require('dotenv');
dotenv.config();
```

**Intent:** Load environment variables from `.env` file (if any database credentials, API keys needed)

---

```javascript
app.use(express.json());
```

**Why here?**
Even though this is a scheduler-focused app, you might add API endpoints later to:
- Manually trigger tasks
- Check task status
- View logs

---

```javascript
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

**Important:** Server keeps running to keep cron jobs alive. If server stops, all scheduled tasks stop.

---

### ⏰ **schedular1.js - Basic Cron Job**

```javascript
const cron = require('node-cron');
```

**node-cron:** Lightweight task scheduler for Node.js based on GNU crontab syntax.

---

```javascript
const task = () => {
    console.log("Running a scheduled task at : ", new Date());
}
```

**Task function:** The actual work to be done when schedule triggers.

---

```javascript
cron.schedule("* * * * *" , task)
```

**Cron expression breakdown:**

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7) (Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**

```javascript
// Every minute
"* * * * *"

// Every 5 minutes
"*/5 * * * *"

// Every hour at minute 0 (top of the hour)
"0 * * * *"

// Every day at midnight
"0 0 * * *"

// Every day at 9:30 AM
"30 9 * * *"

// Every Monday at 9 AM
"0 9 * * 1"

// Every 1st of the month at midnight
"0 0 1 * *"

// Every 15 minutes between 9 AM and 5 PM
"*/15 9-17 * * *"

// Weekdays at 6 PM
"0 18 * * 1-5"
```

---

### 📁 **schedular2.js - Archive Paid Invoices**

```javascript
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const invoices = require('./data/invoice.json');
```

**Setup:**
- `fs`: File system operations (read/write files)
- `path`: Handle file paths across different OS
- `invoices`: Load invoice data from JSON file

---

```javascript
const archiveInvoiceTask = () => {
    console.log("Running archive invoices task : " , new Date());
    try {
```

**Best practice:** Always wrap scheduled tasks in try-catch to prevent crashes.

---

```javascript
        const paidInvoices = invoices.filter((item) => {
            return item.status === 'paid';
        });
```

**Logic:** Find all invoices with status = "paid"

**Example data:**
```javascript
// invoice.json
[
  { "id": 1, "amount": 100, "status": "paid", "date": "2024-01-15" },
  { "id": 2, "amount": 200, "status": "pending", "date": "2024-01-20" },
  { "id": 3, "amount": 150, "status": "paid", "date": "2024-01-25" }
]

// paidInvoices after filter:
[
  { "id": 1, "amount": 100, "status": "paid", "date": "2024-01-15" },
  { "id": 3, "amount": 150, "status": "paid", "date": "2024-01-25" }
]
```

---

```javascript
        if (paidInvoices.length > 0) {
            paidInvoices.forEach((item) => {
                invoices.splice(invoices.findIndex((e) => e.status === item.status), 1)
            });
```

**⚠️ BUG ALERT!** This code has a critical bug:

```javascript
// Current code (WRONG):
invoices.findIndex((e) => e.status === item.status)
// This finds the FIRST invoice with status "paid"
// If you have multiple paid invoices, it removes the wrong ones!

// CORRECT version:
invoices.splice(invoices.findIndex((e) => e.id === item.id), 1)
// Match by unique ID, not status
```

**Better approach:**
```javascript
// More efficient: Filter once instead of splicing in loop
const remainingInvoices = invoices.filter((item) => item.status !== 'paid');

// Update invoices array
invoices.length = 0; // Clear array
invoices.push(...remainingInvoices); // Add remaining items
```

---

```javascript
            fs.writeFileSync(
                path.join(__dirname, './' , "data" , "invoice.json"),
                JSON.stringify(invoices),
                "utf-8"
            );
```

**Breaking it down:**

1. `__dirname`: Current directory path (e.g., `/home/user/project`)
2. `path.join()`: Safely combines path parts (works on Windows/Mac/Linux)
3. `JSON.stringify(invoices)`: Convert JavaScript array to JSON string
4. `"utf-8"`: Character encoding

**Result:** Writes updated invoices (without paid ones) back to file.

---

```javascript
            console.log("The paid invoices are: ", paidInvoices)

            fs.writeFileSync(
                path.join(__dirname, './' , "data" , "archive.json"),
                JSON.stringify(paidInvoices),
                "utf-8"
            );
```

**Intent:** Save paid invoices to archive.json for record-keeping.

---

```javascript
cron.schedule("*/30 * * * * *" , archiveInvoiceTask)
```

**Schedule:** `*/30 * * * * *`

**⚠️ Important:** This uses **6 fields** (includes seconds!)

```
*/30 * * * * *
│    │ │ │ │ │
│    │ │ │ │ └─── Day of Week (0-7)
│    │ │ │ └───── Month (1-12)
│    │ │ └─────── Day of Month (1-31)
│    │ └───────── Hour (0-23)
│    └─────────── Minute (0-59)
└──────────────── Second (0-59)
```

**Meaning:** Run every 30 seconds.

**Standard cron (5 fields):**
```javascript
cron.schedule("* * * * *", task); // No seconds field
```

**With seconds (6 fields):**
```javascript
cron.schedule("* * * * * *", task); // Includes seconds
```

---

### 🧹 **schedular3.js - Housekeeping (Delete Old Records)**

```javascript
const cron = require("node-cron");
const fs = require("fs");
const path = require("path")

const archive = require("./data/archive.json")
```

**Setup:** Load archived invoices for cleanup.

---

```javascript
const houseKeeping = () => {
    console.log("Running House Keeping task : " , new Date());
    try{
        archive.map((item,index) => {
```

**⚠️ Issue:** Using `.map()` when you don't need the returned array. Better to use `.forEach()`.

---

```javascript
            const presentDate = new Date().getTime();
            const recordDate = new Date(item.date).getTime();
```

**What's `.getTime()`?**
Converts date to milliseconds since January 1, 1970 (Unix timestamp).

```javascript
// Example:
new Date("2024-01-15").getTime() // 1705276800000
new Date("2025-12-23").getTime() // 1766458800000

// Why? To calculate difference in milliseconds
```

---

```javascript
            console.log("The number of days : ", 
                Math.floor(presentDate - recordDate) / (1000 * 60 * 60 * 24)
            );
```

**Date difference calculation:**

```javascript
// presentDate - recordDate = difference in milliseconds

// Convert to days:
milliseconds / 1000 = seconds
seconds / 60 = minutes
minutes / 60 = hours
hours / 24 = days

// Full formula:
(presentDate - recordDate) / (1000 * 60 * 60 * 24)

// Example:
// If difference is 86,400,000 ms:
86400000 / (1000 * 60 * 60 * 24) = 86400000 / 86400000 = 1 day
```

---

```javascript
            if (Math.floor(presentDate - recordDate) / (1000 * 60 * 60 * 24) > 480) {
                archive.splice(index,1);

                fs.writeFileSync(
                    path.join(__dirname, './' , "data" , "archive.json"),
                    JSON.stringify(archive),
                    "utf-8"
                );
            }
```

**Logic:** If record is older than 480 days (~16 months), delete it.

**⚠️ Critical Bug:** Writing to file **inside the loop** is inefficient and can cause issues!

**Problems:**
1. **Performance**: File written multiple times unnecessarily
2. **Race condition**: If multiple deletions happen, file can get corrupted
3. **Index shifting**: Splicing while iterating causes skipped items

**Correct approach:**
```javascript
// Filter out old records
const recentRecords = archive.filter((item) => {
    const presentDate = new Date().getTime();
    const recordDate = new Date(item.date).getTime();
    const daysDiff = Math.floor((presentDate - recordDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 480; // Keep only records <= 480 days old
});

// Write once after filtering
if (recentRecords.length !== archive.length) {
    fs.writeFileSync(
        path.join(__dirname, './data/archive.json'),
        JSON.stringify(recentRecords, null, 2), // Pretty print with 2-space indent
        'utf-8'
    );
    console.log(`Deleted ${archive.length - recentRecords.length} old records`);
}
```

---

```javascript
cron.schedule("*/30 * * * * *", houseKeeping)
```

**Schedule:** Every 30 seconds (for testing).

**Production schedule:** Should be daily or weekly:
```javascript
cron.schedule("0 0 * * *", houseKeeping); // Daily at midnight
cron.schedule("0 2 * * 0", houseKeeping); // Weekly on Sunday at 2 AM
```

---

## 3️⃣ Visual Flow Diagrams

### 📊 **Cron Job Lifecycle**

```
┌─────────────────────────────────────────────────────────────────┐
│                   CRON JOB LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────┘


   SERVER STARTS
        ↓
   ┌────────────────────┐
   │ require('./scheduler3') │
   │ loads and executes      │
   └────────────────────┘
        ↓
   ┌────────────────────┐
   │ cron.schedule()    │
   │ registers task     │
   └────────────────────┘
        ↓
   ┌────────────────────┐
   │ Scheduler starts   │
   │ checking time      │
   └────────────────────┘
        ↓
   ┌────────────────────────────────┐
   │ Check every second:            │
   │ Does current time match        │
   │ cron expression?               │
   └────────────────────────────────┘
        ↓
   ┌─────┴─────┐
   │           │
   No         Yes
   │           │
   │           ↓
   │      ┌────────────────────┐
   │      │ Execute task       │
   │      │ function           │
   │      └────────────────────┘
   │           ↓
   │      Task completes
   │           ↓
   └───────────┴──────────────────┐
                                  │
                                  ↓
                         Wait for next interval
                                  ↓
                         (Loop continues)
```

---

### 🔄 **Archive Invoice Flow (schedular2.js)**

```
┌─────────────────────────────────────────────────────────────────┐
│              ARCHIVE PAID INVOICES TASK                          │
└─────────────────────────────────────────────────────────────────┘


   CRON TRIGGERS (Every 30 seconds)
        ↓
   ┌────────────────────────────────────────────┐
   │ Load invoice.json                          │
   │ [                                          │
   │   { id: 1, status: "paid", amount: 100 },  │
   │   { id: 2, status: "pending", amount: 200},│
   │   { id: 3, status: "paid", amount: 150 }   │
   │ ]                                          │
   └────────────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────────────┐
   │ Filter: Find all paid invoices             │
   │ paidInvoices = [                           │
   │   { id: 1, status: "paid", amount: 100 },  │
   │   { id: 3, status: "paid", amount: 150 }   │
   │ ]                                          │
   └────────────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────────────┐
   │ Check: Any paid invoices found?            │
   └────────────────────────────────────────────┘
        ↓
   ┌─────┴─────┐
   │           │
   No         Yes
   │           │
   │           ↓
   │      ┌────────────────────────────────────┐
   │      │ Remove paid invoices from          │
   │      │ invoice.json                       │
   │      │ remainingInvoices = [              │
   │      │   { id: 2, status: "pending" }     │
   │      │ ]                                  │
   │      └────────────────────────────────────┘
   │           ↓
   │      ┌────────────────────────────────────┐
   │      │ Write updated invoice.json         │
   │      │ fs.writeFileSync(...)              │
   │      └────────────────────────────────────┘
   │           ↓
   │      ┌────────────────────────────────────┐
   │      │ Write to archive.json              │
   │      │ [                                  │
   │      │   { id: 1, status: "paid", ... },  │
   │      │   { id: 3, status: "paid", ... }   │
   │      │ ]                                  │
   │      └────────────────────────────────────┘
   │           │
   └───────────┴──────────────────────┐
                                      ↓
                         Log: "Archive task ended"
                                      ↓
                         Wait for next trigger
```

---

### 🗑️ **Housekeeping Flow (schedular3.js)**

```
┌─────────────────────────────────────────────────────────────────┐
│              DELETE OLD RECORDS TASK                             │
└─────────────────────────────────────────────────────────────────┘


   CRON TRIGGERS (Every 30 seconds)
        ↓
   ┌────────────────────────────────────────────┐
   │ Load archive.json                          │
   │ [                                          │
   │   { id: 1, date: "2023-01-01", ... },      │
   │   { id: 2, date: "2024-11-01", ... },      │
   │   { id: 3, date: "2024-12-01", ... }       │
   │ ]                                          │
   └────────────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────────────┐
   │ Loop through each record                   │
   └────────────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────────────┐
   │ For each record:                           │
   │                                            │
   │ 1. Get current date:                       │
   │    presentDate = new Date().getTime()      │
   │    = 1734912000000 (ms)                    │
   │                                            │
   │ 2. Get record date:                        │
   │    recordDate = new Date(item.date)        │
   │    = 1672531200000 (ms)                    │
   │                                            │
   │ 3. Calculate difference:                   │
   │    diff = 1734912000000 - 1672531200000    │
   │    = 62380800000 ms                        │
   │                                            │
   │ 4. Convert to days:                        │
   │    days = 62380800000 / (1000*60*60*24)    │
   │    = 722 days                              │
   └────────────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────────────┐
   │ Check: Is record older than 480 days?      │
   └────────────────────────────────────────────┘
        ↓
   ┌─────┴─────┐
   │           │
   No         Yes
   │           │
   Keep       Delete
   record     record
   │           ↓
   │      ┌────────────────────────────────────┐
   │      │ Remove from array                  │
   │      │ archive.splice(index, 1)           │
   │      └────────────────────────────────────┘
   │           ↓
   │      ┌────────────────────────────────────┐
   │      │ Write updated archive.json         │
   │      │ fs.writeFileSync(...)              │
   │      └────────────────────────────────────┘
   │           │
   └───────────┴──────────────────────┐
                                      ↓
                         Log: "House Keeping task ended"
                                      ↓
                         Wait for next trigger
```

---

### ⏱️ **Cron Expression Visualization**

```
┌─────────────────────────────────────────────────────────────────┐
│                CRON EXPRESSION BREAKDOWN                         │
└─────────────────────────────────────────────────────────────────┘


   Standard Format (5 fields):
   
   * * * * *
   │ │ │ │ │
   │ │ │ │ └─── Day of Week (0-7) Sunday=0 or 7
   │ │ │ └───── Month (1-12) Jan=1, Dec=12
   │ │ └─────── Day of Month (1-31)
   │ └───────── Hour (0-23) Midnight=0
   └─────────── Minute (0-59)
   
   
   Extended Format (6 fields - includes seconds):
   
   * * * * * *
   │ │ │ │ │ │
   │ │ │ │ │ └─── Day of Week (0-7)
   │ │ │ │ └───── Month (1-12)
   │ │ │ └─────── Day of Month (1-31)
   │ └─────────── Hour (0-23)
   └───────────── Minute (0-59)
   └─────────────── Second (0-59)


┌─────────────────────────────────────────────────────────────────┐
│                    EXAMPLES                                      │
└─────────────────────────────────────────────────────────────────┘

   "* * * * *"          → Every minute
   
   "*/5 * * * *"        → Every 5 minutes
   
   "0 * * * *"          → Every hour (at minute 0)
   
   "0 0 * * *"          → Every day at midnight
   
   "0 9 * * *"          → Every day at 9 AM
   
   "30 9 * * *"         → Every day at 9:30 AM
   
   "0 9 * * 1"          → Every Monday at 9 AM
   
   "0 0 1 * *"          → 1st day of every month at midnight
   
   "0 0 1 1 *"          → January 1st at midnight (New Year)
   
   "*/15 9-17 * * 1-5"  → Every 15 min, 9AM-5PM, weekdays
   
   "0 0 * * 0"          → Every Sunday at midnight
   
   "*/30 * * * * *"     → Every 30 seconds (6-field format)
```

---

## 4️⃣ Real-World Production Examples

### 📧 **Example 1: Daily Email Report System**

```javascript
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ✅ Send daily sales report
const sendDailySalesReport = async () => {
  console.log('📊 Generating daily sales report...', new Date());
  
  try {
    // 1. Fetch sales data from database
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const sales = await Sale.find({
      createdAt: {
        $gte: yesterday,
        $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // 2. Calculate metrics
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
    
    // 3. Generate HTML report
    const htmlReport = `
      <h2>Daily Sales Report - ${yesterday.toDateString()}</h2>
      <table border="1" cellpadding="10">
        <tr><td><strong>Total Sales</strong></td><td>$${totalSales.toFixed(2)}</td></tr>
        <tr><td><strong>Total Orders</strong></td><td>${totalOrders}</td></tr>
        <tr><td><strong>Avg Order Value</strong></td><td>$${avgOrderValue}</td></tr>
      </table>
      <br>
      <h3>Top Products</h3>
      <ul>
        ${getTopProducts(sales).map(p => `<li>${p.name}: ${p.count} sales</li>`).join('')}
      </ul>
    `;
    
    // 4. Send email to management
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'management@company.com',
      subject: `Daily Sales Report - ${yesterday.toDateString()}`,
      html: htmlReport
    });
    
    console.log('✅ Daily sales report sent successfully');
    
  } catch (error) {
    console.error('❌ Error sending daily report:', error);
    // Send alert to admin
    await sendErrorAlert('Daily Sales Report Failed', error.message);
  }
};

// Schedule: Every day at 8 AM
cron.schedule('0 8 * * *', sendDailySalesReport);

function getTopProducts(sales) {
  const productCount = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      productCount[item.name] = (productCount[item.name] || 0) + 1;
    });
  });
  
  return Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}
```

---

### 🗄️ **Example 2: Database Backup System**

```javascript
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

// ✅ Automated database backup
const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.sql`;
  const backupPath = path.join(__dirname, 'backups', backupFileName);
  
  console.log('💾 Starting database backup...', new Date());
  
  try {
    // 1. Create backup directory if doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 2. Execute mysqldump command
    const dumpCommand = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupPath}`;
    
    await new Promise((resolve, reject) => {
      exec(dumpCommand, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    console.log('✅ Database dumped successfully');
    
    // 3. Upload to S3
    const fileContent = fs.readFileSync(backupPath);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `database-backups/${backupFileName}`,
      Body: fileContent
    };
    
    await s3.upload(params).promise();
    console.log('✅ Backup uploaded to S3');
    
    // 4. Delete local backup file (save disk space)
    fs.unlinkSync(backupPath);
    
    // 5. Clean up old backups (keep last 30 days)
    await cleanupOldBackups(30);
    
    console.log('✅ Database backup completed successfully');
    
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    await sendErrorAlert('Database Backup Failed', error.message);
  }
};

// Clean up old backups from S3
async function cleanupOldBackups(daysToKeep) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: 'database-backups/'
  };
  
  const data = await s3.listObjectsV2(params).promise();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const oldBackups = data.Contents.filter(obj => obj.LastModified < cutoffDate);
  
  for (const backup of oldBackups) {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: backup.Key
    }).promise();
    console.log(`🗑️ Deleted old backup: ${backup.Key}`);
  }
}

// Schedule: Every day at 2 AM (low traffic time)
cron.schedule('0 2 * * *', backupDatabase);

// Also: Weekly full backup on Sunday
cron.schedule('0 3 * * 0', async () => {
  console.log('📦 Creating weekly full backup...');
  await backupDatabase();
  // Additional: Backup to different location for redundancy
});
```

---

### 🧹 **Example 3: Session & Cache Cleanup**

```javascript
const cron = require('node-cron');
const redis = require('redis');
const mongoose = require('mongoose');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// ✅ Clean expired sessions
const cleanupExpiredSessions = async () => {
  console.log('🧹 Cleaning up expired sessions...', new Date());
  
  try {
    // 1. Delete expired sessions from database
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} expired sessions from database`);
    
    // 2. Clear expired Redis cache keys
    const pattern = 'session:*';
    const keys = await new Promise((resolve, reject) => {
      redisClient.keys(pattern, (err, keys) => {
        if (err) reject(err);
        else resolve(keys);
      });
    });
    
    let expiredCount = 0;
    for (const key of keys) {
      const ttl = await new Promise((resolve, reject) => {
        redisClient.ttl(key, (err, ttl) => {
          if (err) reject(err);
          else resolve(ttl);
        });
      });
      
      // TTL = -1 means no expiration, -2 means key doesn't exist
      if (ttl === -2) {
        expiredCount++;
      }
    }
    
    console.log(`✅ Found ${expiredCount} expired Redis keys`);
    
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
  }
};

// ✅ Clean up temporary files
const cleanupTempFiles = async () => {
  console.log('🗑️ Cleaning up temporary files...', new Date());
  
  const tempDir = path.join(__dirname, 'temp');
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  try {
    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = Date.now() - stats.mtimeMs;
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} temporary files`);
    
  } catch (error) {
    console.error('❌ Temp file cleanup failed:', error);
  }
};

// ✅ Clear application cache
const clearApplicationCache = async () => {
  console.log('♻️ Clearing application cache...', new Date());
  
  try {
    // Clear specific cache patterns
    const patterns = ['cache:products:*', 'cache:users:*', 'cache:api:*'];
    
    for (const pattern of patterns) {
      const keys = await new Promise((resolve, reject) => {
        redisClient.keys(pattern, (err, keys) => {
          if (err) reject(err);
          else resolve(keys);
        });
      });
      
      if (keys.length > 0) {
        await new Promise((resolve, reject) => {
          redisClient.del(keys, (err, reply) => {
            if (err) reject(err);
            else resolve(reply);
          });
        });
        
        console.log(`✅ Cleared ${keys.length} ${pattern} cache entries`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cache clearing failed:', error);
  }
};

// Schedule different cleanup tasks
cron.schedule('0 */6 * * *', cleanupExpiredSessions); // Every 6 hours
cron.schedule('0 3 * * *', cleanupTempFiles); // Daily at 3 AM
cron.schedule('0 4 * * 0', clearApplicationCache); // Weekly on Sunday at 4 AM
```

---

### 📊 **Example 4: System Health Monitoring**

```javascript
const cron = require('node-cron');
const os = require('os');
const diskusage = require('diskusage');
const axios = require('axios');

// ✅ Monitor system health
const checkSystemHealth = async () => {
  console.log('🏥 Checking system health...', new Date());
  
  try {
    // 1. CPU usage
    const cpuUsage = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;
    const cpuPercentage = (cpuUsage / cpuCount * 100).toFixed(2);
    
    // 2. Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem * 100).toFixed(2);
    
    // 3. Disk usage
    const diskInfo = await diskusage.check('/');
    const diskPercentage = ((diskInfo.total - diskInfo.available) / diskInfo.total * 100).toFixed(2);
    
    // 4. Check if application is responding
    const appHealthy = await checkApplicationHealth();
    
    // 5. Prepare health report
    const healthReport = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuPercentage + '%',
        cores: cpuCount,
        status: cpuPercentage > 80 ? '⚠️ HIGH' : '✅ OK'
      },
      memory: {
        total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        percentage: memPercentage + '%',
        status: memPercentage > 85 ? '⚠️ HIGH' : '✅ OK'
      },
      disk: {
        total: (diskInfo.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        available: (diskInfo.available / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        percentage: diskPercentage + '%',
        status: diskPercentage > 90 ? '🚨 CRITICAL' : diskPercentage > 75 ? '⚠️ WARNING' : '✅ OK'
      },
      application: {
        status: appHealthy ? '✅ RUNNING' : '❌ DOWN'
      }
    };
    
    // 6. Check for alerts
    const alerts = [];
    if (cpuPercentage > 80) alerts.push('High CPU usage detected');
    if (memPercentage > 85) alerts.push('High memory usage detected');
    if (diskPercentage > 90) alerts.push('Critical disk space');
    if (!appHealthy) alerts.push('Application not responding');
    
    // 7. Send alerts if any
    if (alerts.length > 0) {
      await sendAlertToSlack({
        text: `🚨 System Health Alert`,
        attachments: [{
          color: 'danger',
          fields: alerts.map(alert => ({
            title: alert,
            value: JSON.stringify(healthReport, null, 2),
            short: false
          }))
        }]
      });
    }
    
    // 8. Log health metrics to database
    await HealthMetric.create(healthReport);
    
    console.log('✅ System health check completed', healthReport);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    await sendErrorAlert('System Health Check Failed', error.message);
  }
};

async function checkApplicationHealth() {
  try {
    const response = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function sendAlertToSlack(message) {
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, message);
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

// Schedule: Every 5 minutes
cron.schedule('*/5 * * * *', checkSystemHealth);
```

---

### 🔄 **Example 5: Data Synchronization**

```javascript
const cron = require('node-cron');
const axios = require('axios');

// ✅ Sync data from external API
const syncExternalData = async () => {
  console.log('🔄 Syncing data from external API...', new Date());
  
  try {
    // 1. Fetch data from external API
    const response = await axios.get('https://api.example.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      timeout: 30000
    });
    
    const externalProducts = response.data;
    console.log(`📦 Fetched ${externalProducts.length} products from external API`);
    
    // 2. Compare with local database
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const externalProduct of externalProducts) {
      try {
        const localProduct = await Product.findOne({
          externalId: externalProduct.id
        });
        
        if (!localProduct) {
          // New product - create
          await Product.create({
            externalId: externalProduct.id,
            name: externalProduct.name,
            price: externalProduct.price,
            stock: externalProduct.stock,
            lastSyncedAt: new Date()
          });
          newCount++;
        } else {
          // Existing product - check if update needed
          if (
            localProduct.price !== externalProduct.price ||
            localProduct.stock !== externalProduct.stock ||
            localProduct.name !== externalProduct.name
          ) {
            await Product.updateOne(
              { _id: localProduct._id },
              {
                name: externalProduct.name,
                price: externalProduct.price,
                stock: externalProduct.stock,
                lastSyncedAt: new Date()
              }
            );
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error syncing product ${externalProduct.id}:`, error);
        errorCount++;
      }
    }
    
    // 3. Mark products as inactive if not in external source
    const externalIds = externalProducts.map(p => p.id);
    await Product.updateMany(
      {
        externalId: { $nin: externalIds },
        isActive: true
      },
      {
        isActive: false,
        lastSyncedAt: new Date()
      }
    );
    
    // 4. Log sync results
    const syncResult = {
      timestamp: new Date(),
      newProducts: newCount,
      updatedProducts: updatedCount,
      errors: errorCount,
      totalProcessed: externalProducts.length
    };
    
    await SyncLog.create(syncResult);
    
    console.log('✅ Data sync completed:', syncResult);
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    await sendErrorAlert('External Data Sync Failed', error.message);
  }
};

// Schedule: Every hour
cron.schedule('0 * * * *', syncExternalData);
```

---

## 5️⃣ Best Practices & Common Pitfalls

### ✅ **Best Practices**

#### 1. **Always Use Try-Catch Blocks**

```javascript
// ❌ WRONG - Crashes can stop all cron jobs
cron.schedule('* * * * *', () => {
  const data = JSON.parse(fs.readFileSync('data.json')); // Can throw error!
  processData(data);
});

// ✅ CORRECT - Errors are caught and logged
cron.schedule('* * * * *', async () => {
  try {
    const data = JSON.parse(fs.readFileSync('data.json'));
    await processData(data);
  } catch (error) {
    console.error('Task failed:', error);
    // Send alert to monitoring system
    await sendErrorAlert(error);
  }
});
```

---

#### 2. **Use Appropriate Schedules (Not Too Frequent)**

```javascript
// ❌ WRONG - Every second is overkill
cron.schedule('* * * * * *', expensiveTask); // Runs 86,400 times/day!

// ✅ CORRECT - Match frequency to actual need
cron.schedule('*/5 * * * *', normalTask); // Every 5 minutes
cron.schedule('0 2 * * *', heavyTask); // Daily at 2 AM
```

---

#### 3. **Prevent Overlapping Executions**

```javascript
// ❌ WRONG - Can cause duplicate operations
cron.schedule('*/5 * * * *', async () => {
  await longRunningTask(); // Takes 10 minutes
  // If task takes longer than 5 min, next execution starts before this finishes!
});

// ✅ CORRECT - Use a flag to prevent overlap
let isTaskRunning = false;

cron.schedule('*/5 * * * *', async () => {
  if (isTaskRunning) {
    console.log('Task still running, skipping this execution');
    return;
  }
  
  isTaskRunning = true;
  try {
    await longRunningTask();
  } finally {
    isTaskRunning = false;
  }
});
```

---

#### 4. **Log Task Execution**

```javascript
// ✅ CORRECT - Always log start, end, and results
cron.schedule('0 2 * * *', async () => {
  const startTime = new Date();
  console.log(`📋 Starting backup task at ${startTime.toISOString()}`);
  
  try {
    const result = await backupDatabase();
    const duration = (new Date() - startTime) / 1000;
    
    console.log(`✅ Backup completed in ${duration}s`, result);
    
    // Log to database for monitoring
    await TaskLog.create({
      taskName: 'database_backup',
      status: 'success',
      duration,
      result,
      timestamp: startTime
    });
    
  } catch (error) {
    const duration = (new Date() - startTime) / 1000;
    console.error(`❌ Backup failed after ${duration}s:`, error);
    
    await TaskLog.create({
      taskName: 'database_backup',
      status: 'failed',
      duration,
      error: error.message,
      timestamp: startTime
    });
  }
});
```

---

#### 5. **Use Environment-Specific Schedules**

```javascript
// ✅ CORRECT - Different schedules for different environments
const schedule = process.env.NODE_ENV === 'production'
  ? '0 2 * * *'  // Production: Once daily at 2 AM
  : '*/5 * * * *'; // Development: Every 5 minutes for testing

cron.schedule(schedule, myTask);
```

---

#### 6. **Handle Timezone Properly**

```javascript
// ✅ Specify timezone explicitly
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York' // 9 AM Eastern Time
});

// Without timezone, uses server's local timezone
// Can cause issues if server is in different timezone!
```

---

#### 7. **Implement Graceful Shutdown**

```javascript
// ✅ Stop cron jobs gracefully on server shutdown
const task = cron.schedule('* * * * *', myFunction);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping cron jobs...');
  task.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping cron jobs...');
  task.stop();
  process.exit(0);
});
```

---

### ⚠️ **Common Pitfalls**

#### 1. **Modifying Array While Iterating**

```javascript
// ❌ WRONG - Causes skipped items
archive.map((item, index) => {
  if (isOld(item)) {
    archive.splice(index, 1); // Modifying array while looping!
  }
});

// ✅ CORRECT - Filter creates new array
const recentRecords = archive.filter(item => !isOld(item));
archive.length = 0;
archive.push(...recentRecords);
```

---

#### 2. **Writing to File Inside Loop**

```javascript
// ❌ WRONG - File written multiple times
items.forEach(item => {
  if (shouldDelete(item)) {
    items.splice(items.indexOf(item), 1);
    fs.writeFileSync('data.json', JSON.stringify(items)); // ⚠️ Written every iteration!
  }
});

// ✅ CORRECT - Write once after all deletions
const updatedItems = items.filter(item => !shouldDelete(item));
if (updatedItems.length !== items.length) {
  fs.writeFileSync('data.json', JSON.stringify(updatedItems, null, 2));
}
```

---

#### 3. **Not Handling File Read Errors**

```javascript
// ❌ WRONG - Will crash if file doesn't exist
const data = require('./data/archive.json'); // Crashes if file missing!

// ✅ CORRECT - Check file existence first
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'archive.json');
let data = [];

if (fs.existsSync(dataPath)) {
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (error) {
    console.error('Error reading data file:', error);
    data = [];
  }
} else {
  console.warn('Data file not found, starting with empty array');
  // Optionally create the file
  fs.writeFileSync(dataPath, JSON.stringify([]), 'utf-8');
}
```

---

#### 4. **Incorrect Date Calculations**

```javascript
// ❌ WRONG - Integer division can be imprecise
const days = (presentDate - recordDate) / (1000 * 60 * 60 * 24);
// If days = 480.9, it's NOT > 480, but should be deleted!

// ✅ CORRECT - Use Math.floor for whole days
const days = Math.floor((presentDate - recordDate) / (1000 * 60 * 60 * 24));

// Better: Use date-fns library
const { differenceInDays } = require('date-fns');
const days = differenceInDays(new Date(), new Date(item.date));
```

---

#### 5. **Not Validating JSON Before Parsing**

```javascript
// ❌ WRONG - Can crash if JSON is malformed
const data = JSON.parse(fs.readFileSync('data.json'));

// ✅ CORRECT - Validate and handle parse errors
let data = [];
try {
  const fileContent = fs.readFileSync('data.json', 'utf-8');
  if (fileContent.trim()) { // Check if file is not empty
    data = JSON.parse(fileContent);
  }
} catch (error) {
  console.error('Failed to parse JSON:', error);
  // Backup corrupted file
  fs.copyFileSync('data.json', `data.json.backup-${Date.now()}`);
  data = []; // Start fresh
}
```

---

#### 6. **Using Synchronous Operations in Cron Jobs**

```javascript
// ❌ WRONG - Blocks event loop
cron.schedule('* * * * *', () => {
  const data = fs.readFileSync('large-file.json'); // Blocks!
  processData(data);
  fs.writeFileSync('output.json', result); // Blocks again!
});

// ✅ CORRECT - Use async operations
cron.schedule('* * * * *', async () => {
  try {
    const data = await fs.promises.readFile('large-file.json', 'utf-8');
    const result = await processData(data);
    await fs.promises.writeFile('output.json', result);
  } catch (error) {
    console.error('Task failed:', error);
  }
});
```

---

#### 7. **Hardcoding Paths**

```javascript
// ❌ WRONG - Breaks on different OS or deployments
fs.writeFileSync('./data/archive.json', data);
// Might work locally but fail in production!

// ✅ CORRECT - Use path.join with __dirname
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'archive.json');
fs.writeFileSync(dataPath, data);
```

---

### 🏢 **Enterprise-Level Practices**

#### 1. **Use Job Queues for Critical Tasks**

```javascript
// For production, use Bull instead of simple cron for critical tasks
const Queue = require('bull');
const backupQueue = new Queue('database-backup', {
  redis: { host: 'localhost', port: 6379 }
});

// Add job to queue
backupQueue.add({
  type: 'daily-backup',
  timestamp: new Date()
}, {
  repeat: { cron: '0 2 * * *' },
  attempts: 3, // Retry 3 times on failure
  backoff: { type: 'exponential', delay: 60000 } // Wait 1 min, then 2 min, then 4 min
});

// Process jobs
backupQueue.process(async (job) => {
  console.log('Processing backup job:', job.data);
  await performBackup();
});

// Handle failures
backupQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  sendAlertToSlack(`Backup job failed: ${err.message}`);
});
```

---

#### 2. **Implement Health Checks**

```javascript
// Add health check endpoint to monitor cron jobs
const lastRunTimes = {};

function trackTaskExecution(taskName) {
  lastRunTimes[taskName] = new Date();
}

app.get('/health/cron', (req, res) => {
  const now = new Date();
  const checks = {};
  
  // Check if tasks ran recently
  Object.entries(lastRunTimes).forEach(([task, lastRun]) => {
    const minutesSinceLastRun = (now - lastRun) / 1000 / 60;
    checks[task] = {
      lastRun: lastRun.toISOString(),
      minutesAgo: minutesSinceLastRun.toFixed(2),
      status: minutesSinceLastRun < 120 ? 'healthy' : 'warning'
    };
  });
  
  res.json({
    status: 'ok',
    tasks: checks
  });
});

// Use in cron jobs
cron.schedule('*/5 * * * *', () => {
  trackTaskExecution('data-sync');
  performDataSync();
});
```

---

#### 3. **Centralized Cron Job Management**

```javascript
// Create a cron manager
class CronManager {
  constructor() {
    this.jobs = new Map();
  }
  
  register(name, schedule, task, options = {}) {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already registered`);
    }
    
    const job = cron.schedule(schedule, async () => {
      const startTime = Date.now();
      console.log(`[${name}] Starting at ${new Date().toISOString()}`);
      
      try {
        await task();
        const duration = Date.now() - startTime;
        console.log(`[${name}] Completed in ${duration}ms`);
        
        // Log to database
        await JobLog.create({
          jobName: name,
          status: 'success',
          duration,
          timestamp: new Date()
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${name}] Failed after ${duration}ms:`, error);
        
        await JobLog.create({
          jobName: name,
          status: 'failed',
          duration,
          error: error.message,
          timestamp: new Date()
        });
        
        if (options.alertOnFailure) {
          await sendAlert(name, error);
        }
      }
    }, options);
    
    this.jobs.set(name, { schedule, job, task });
    console.log(`✅ Registered cron job: ${name} (${schedule})`);
  }
  
  stop(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.job.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    }
  }
  
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.job.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    });
  }
  
  list() {
    return Array.from(this.jobs.entries()).map(([name, { schedule }]) => ({
      name,
      schedule
    }));
  }
}

// Usage
const cronManager = new CronManager();

cronManager.register(
  'archive-invoices',
  '0 2 * * *',
  archiveInvoiceTask,
  { alertOnFailure: true }
);

cronManager.register(
  'cleanup-temp-files',
  '0 3 * * *',
  cleanupTempFiles
);

// List all jobs
app.get('/cron/jobs', (req, res) => {
  res.json(cronManager.list());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  cronManager.stopAll();
  process.exit(0);
});
```

---

#### 4. **Monitor Cron Job Performance**

```javascript
const { performance } = require('perf_hooks');

class CronMonitor {
  constructor() {
    this.metrics = {};
  }
  
  async track(jobName, task) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await task();
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const duration = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      // Update metrics
      if (!this.metrics[jobName]) {
        this.metrics[jobName] = {
          runs: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
          failures: 0
        };
      }
      
      const metrics = this.metrics[jobName];
      metrics.runs++;
      metrics.totalDuration += duration;
      metrics.avgDuration = metrics.totalDuration / metrics.runs;
      metrics.maxDuration = Math.max(metrics.maxDuration, duration);
      metrics.minDuration = Math.min(metrics.minDuration, duration);
      metrics.lastRun = new Date();
      metrics.lastDuration = duration;
      metrics.lastMemoryUsed = memoryUsed;
      
      console.log(`📊 [${jobName}] Duration: ${duration.toFixed(2)}ms, Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      
      return result;
    } catch (error) {
      this.metrics[jobName].failures++;
      throw error;
    }
  }
  
  getMetrics(jobName) {
    return this.metrics[jobName] || null;
  }
  
  getAllMetrics() {
    return this.metrics;
  }
}

const monitor = new CronMonitor();

cron.schedule('*/5 * * * *', async () => {
  await monitor.track('data-sync', async () => {
    await syncData();
  });
});

// Metrics endpoint
app.get('/metrics/cron', (req, res) => {
  res.json(monitor.getAllMetrics());
});
```

---

## 6️⃣ Interview Preparation

### 🎯 **Top 15 Task Scheduling Interview Questions**

---

#### **Q1: What is a cron job and how does it work?**

**Answer:**
A **cron job** is a scheduled task that runs automatically at specified intervals or times. In Node.js, we use libraries like `node-cron` to implement them.

**How it works:**
```javascript
// 1. Define the task
const task = () => {
  console.log('Running task');
};

// 2. Schedule it with cron expression
cron.schedule('0 9 * * *', task); // Every day at 9 AM

// 3. Scheduler checks time every second
// 4. When time matches, task executes
// 5. Process repeats
```

**Key points:**
- Runs inside Node.js process (not OS-level)
- Uses cron expressions for scheduling
- Non-blocking (asynchronous)
- Stops if server crashes

---

#### **Q2: Explain the cron expression syntax.**

**Answer:**

**Standard format (5 fields):**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of Week (0-7, Sun=0 or 7)
│ │ │ └─── Month (1-12)
│ │ └───── Day of Month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Special characters:**
```javascript
* = any value (every)
*/5 = every 5 units
1-5 = range (1 through 5)
1,3,5 = list (1 and 3 and 5)
```

**Examples:**
```javascript
"* * * * *"        // Every minute
"0 * * * *"        // Every hour
"0 9 * * *"        // Every day at 9 AM
"*/15 * * * *"     // Every 15 minutes
"0 9 * * 1-5"      // Weekdays at 9 AM
"0 0 1 * *"        // 1st of month at midnight
```

---

#### **Q3: What's the difference between node-cron and node-schedule?**

**Answer:**

| Feature | node-cron | node-schedule |
|---------|-----------|---------------|
| **Syntax** | Cron expressions | Date objects or cron |
| **Timezone** | Supported | Supported |
| **One-time jobs** | No | Yes |
| **API** | Simple | More flexible |
| **Use case** | Recurring tasks | Both recurring & one-time |

**node-cron:**
```javascript
const cron = require('node-cron');
cron.schedule('0 9 * * *', () => {
  console.log('Daily at 9 AM');
});
```

**node-schedule:**
```javascript
const schedule = require('node-schedule');

// Recurring
schedule.scheduleJob('0 9 * * *', () => {
  console.log('Daily at 9 AM');
});

// One-time
const date = new Date(2025, 11, 25, 9, 0, 0);
schedule.scheduleJob(date, () => {
  console.log('Runs once on Dec 25, 2025 at 9 AM');
});
```

---

#### **Q4: How do you prevent overlapping cron job executions?**

**Answer:**

**Problem:**
```javascript
// Task takes 10 minutes
// Scheduled every 5 minutes
// Second execution starts before first finishes!
```

**Solution 1: Use a flag**
```javascript
let isRunning = false;

cron.schedule('*/5 * * * *', async () => {
  if (isRunning) {
    console.log('Task still running, skipping');
    return;
  }
  
  isRunning = true;
  try {
    await longRunningTask();
  } finally {
    isRunning = false;
  }
});
```

**Solution 2: Use a lock (Redis)**
```javascript
const redis = require('redis');
const client = redis.createClient();

cron.schedule('*/5 * * * *', async () => {
  const lockKey = 'task:backup:lock';
  const lock = await client.set(lockKey, '1', 'NX', 'EX', 600); // 10 min expiry
  
  if (!lock) {
    console.log('Lock exists, skipping');
    return;
  }
  
  try {
    await performBackup();
  } finally {
    await client.del(lockKey);
  }
});
```

---

#### **Q5: How do you handle timezone issues in cron jobs?**

**Answer:**

**Problem:**
```javascript
// Server in UTC, but you want 9 AM EST
cron.schedule('0 9 * * *', task);
// This runs at 9 AM UTC, not 9 AM EST!
```

**Solution:**
```javascript
// Option 1: Specify timezone
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York' // 9 AM Eastern
});

// Option 2: Convert to UTC manually
// 9 AM EST = 2 PM UTC (during standard time)
cron.schedule('0 14 * * *', task); // Runs at 2 PM UTC = 9 AM EST

// Option 3: Use moment-timezone
const moment = require('moment-timezone');
const estTime = moment.tz('2025-12-23 09:00', 'America/New_York');
const utcTime = estTime.utc();
// Schedule at UTC equivalent time
```

---

#### **Q6: What happens to cron jobs when the server restarts?**

**Answer:**

**With node-cron:**
```javascript
// ❌ Cron jobs are NOT persistent
// When server restarts, all scheduled tasks are lost
// They restart when server starts again

// If task was supposed to run during downtime, it's MISSED
```

**Solution: Use persistent job queue (Bull)**
```javascript
const Queue = require('bull');

const backupQueue = new Queue('backups', {
  redis: { host: 'localhost', port: 6379 }
});

// Jobs are stored in Redis
backupQueue.add({}, {
  repeat: { cron: '0 2 * * *' }
});

// After restart, jobs resume from Redis
// Missed jobs can be configured to run immediately
```

---

#### **Q7: How do you test cron jobs in development?**

**Answer:**

**Method 1: Short intervals**
```javascript
const schedule = process.env.NODE_ENV === 'production'
  ? '0 2 * * *'  // Production: Daily at 2 AM
  : '*/30 * * * * *'; // Development: Every 30 seconds

cron.schedule(schedule, myTask);
```

**Method 2: Manual trigger**
```javascript
const myTask = async () => {
  console.log('Running task');
  await performTask();
};

// Schedule
cron.schedule('0 2 * * *', myTask);

// Also expose as API endpoint for testing
app.post('/test/run-task', async (req, res) => {
  await myTask();
  res.json({ message: 'Task executed' });
});
```

**Method 3: Mock the scheduler**
```javascript
// In tests
jest.mock('node-cron', () => ({
  schedule: jest.fn((expression, callback) => {
    // Store callback for manual triggering
    global.cronCallbacks = global.cronCallbacks || {};
    global.cronCallbacks[expression] = callback;
    return { stop: jest.fn() };
  })
}));

// Trigger manually in test
test('should archive invoices', async () => {
  require('./scheduler'); // Loads and registers cron
  await global.cronCallbacks['0 2 * * *'](); // Run task
  // Assert results
});
```

---

#### **Q8: How do you monitor cron job execution?**

**Answer:**

**1. Logging:**
```javascript
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Backup started at', new Date());
  
  try {
    await performBackup();
    console.log('✅ Backup completed');
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
});
```

**2. Database tracking:**
```javascript
cron.schedule('0 2 * * *', async () => {
  const startTime = new Date();
  
  try {
    await performBackup();
    
    await JobLog.create({
      jobName: 'daily-backup',
      status: 'success',
      duration: Date.now() - startTime,
      timestamp: startTime
    });
  } catch (error) {
    await JobLog.create({
      jobName: 'daily-backup',
      status: 'failed',
      error: error.message,
      timestamp: startTime
    });
  }
});
```

**3. External monitoring (Healthchecks.io, Cronitor):**
```javascript
const axios = require('axios');

cron.schedule('0 2 * * *', async () => {
  try {
    await performBackup();
    // Ping success URL
    await axios.get('https://hc-ping.com/your-uuid');
  } catch (error) {
    // Ping failure URL
    await axios.get('https://hc-ping.com/your-uuid/fail');
  }
});
```

---

#### **Q9: What are the best practices for file operations in cron jobs?**

**Answer:**

**1. Use async operations:**
```javascript
// ❌ Blocking
const data = fs.readFileSync('data.json');
fs.writeFileSync('output.json', result);

// ✅ Non-blocking
const data = await fs.promises.readFile('data.json', 'utf-8');
await fs.promises.writeFile('output.json', result);
```

**2. Check file existence:**
```javascript
if (fs.existsSync(filePath)) {
  const data = await fs.promises.readFile(filePath);
}
```

**3. Use absolute paths:**
```javascript
const path = require('path');
const filePath = path.join(__dirname, 'data', 'archive.json');
```

**4. Handle parse errors:**
```javascript
try {
  const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
} catch (error) {
  console.error('Failed to parse JSON:', error);
  // Backup corrupted file
  await fs.promises.copyFile(filePath, `${filePath}.backup`);
}
```

**5. Atomic writes:**
```javascript
// Write to temp file first, then rename
const tempFile = `${filePath}.tmp`;
await fs.promises.writeFile(tempFile, data);
await fs.promises.rename(tempFile, filePath);
// Prevents partial writes if process crashes
```

---

#### **Q10: How do you implement retry logic for failed tasks?**

**Answer:**

**Simple retry:**
```javascript
async function taskWithRetry(task, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error; // All retries exhausted
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

cron.schedule('0 2 * * *', async () => {
  await taskWithRetry(performBackup);
});
```

**With Bull queue:**
```javascript
const queue = new Queue('tasks');

queue.add({ type: 'backup' }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

queue.process(async (job) => {
  await performBackup();
});
```

---

#### **Q11: How do you handle long-running tasks in cron jobs?**

**Answer:**

**Problem:**
```javascript
// Task takes 2 hours
// But cron schedule is every hour
// Leads to multiple concurrent executions
```

**Solutions:**

**1. Use a job queue:**
```javascript
// Cron just adds jobs to queue
cron.schedule('0 * * * *', async () => {
  await queue.add({ type: 'long-task' });
});

// Worker processes queue (one at a time)
queue.process(async (job) => {
  await longRunningTask();
});
```

**2. Skip if already running:**
```javascript
let isRunning = false;

cron.schedule('0 * * * *', async () => {
  if (isRunning) return;
  
  isRunning = true;
  try {
    await longRunningTask();
  } finally {
    isRunning = false;
  }
});
```

**3. Run in child process:**
```javascript
const { fork } = require('child_process');

cron.schedule('0 * * * *', () => {
  const child = fork('./long-task.js');
  
  child.on('exit', (code) => {
    console.log(`Task completed with code ${code}`);
  });
});
```

---

#### **Q12: How do you calculate date differences correctly?**

**Answer:**

**Common mistake:**
```javascript
// ❌ Integer division issues
const days = (Date.now() - recordDate) / (1000 * 60 * 60 * 24);
// days = 480.9 → NOT > 480, but should be 481 days old!
```

**Correct approaches:**

**1. Use Math.floor:**
```javascript
const days = Math.floor((Date.now() - recordDate) / (1000 * 60 * 60 * 24));
```

**2. Use date-fns:**
```javascript
const { differenceInDays } = require('date-fns');
const days = differenceInDays(new Date(), new Date(recordDate));
```

**3. Use moment:**
```javascript
const moment = require('moment');
const days = moment().diff(moment(recordDate), 'days');
```

**4. For months (tricky):**
```javascript
// ❌ WRONG - Months have different lengths
const months = days / 30; // Not accurate!

// ✅ CORRECT
const { differenceInMonths } = require('date-fns');
const months = differenceInMonths(new Date(), new Date(recordDate));
```

---

#### **Q13: What's the difference between cron jobs and webhooks?**

**Answer:**

| Aspect | Cron Jobs | Webhooks |
|--------|-----------|----------|
| **Trigger** | Time-based | Event-based |
| **Initiated by** | Your server | External service |
| **Schedule** | Predictable | Unpredictable |
| **Use case** | Periodic tasks | Real-time notifications |
| **Example** | Daily backup | Payment confirmation |

**Cron job:**
```javascript
// YOUR server initiates
cron.schedule('0 2 * * *', async () => {
  await backupDatabase();
});
```

**Webhook:**
```javascript
// EXTERNAL service initiates
app.post('/webhook/payment', (req, res) => {
  // Stripe sends notification when payment succeeds
  const event = req.body;
  await handlePaymentSuccess(event);
  res.json({ received: true });
});
```

**Combined usage:**
```javascript
// Cron checks for stale webhooks
cron.schedule('0 */6 * * *', async () => {
  // Find payments that succeeded but webhook never arrived
  const stalePayments = await Payment.find({
    status: 'succeeded_on_stripe',
    webhookReceived: false,
    createdAt: { $lt: Date.now() - 24 * 60 * 60 * 1000 }
  });
  
  // Process them manually
  for (const payment of stalePayments) {
    await processPayment(payment);
  }
});
```

---

#### **Q14: How do you gracefully shut down cron jobs?**

**Answer:**

**Problem:**
```javascript
// Server receives SIGTERM (e.g., during deployment)
// Cron job is running
// Process exits immediately → Task interrupted!
```

**Solution:**
```javascript
const activeTasks = new Set();
let isShuttingDown = false;

function createTask(name, fn) {
  return async () => {
    if (isShuttingDown) {
      console.log(`Skipping ${name} - shutting down`);
      return;
    }
    
    activeTasks.add(name);
    try {
      await fn();
    } finally {
      activeTasks.delete(name);
    }
  };
}

const backupTask = createTask('backup', performBackup);
cron.schedule('0 2 * * *', backupTask);

// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, gracefully shutting down...');
  isShuttingDown = true;
  
  // Stop accepting new tasks (already handled by isShuttingDown flag)
  
  // Wait for active tasks to complete (max 30 seconds)
  const shutdownTimeout = setTimeout(() => {
    console.log('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
  
  // Wait for all tasks to finish
  while (activeTasks.size > 0) {
    console.log(`Waiting for ${activeTasks.size} tasks to complete...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  clearTimeout(shutdownTimeout);
  console.log('All tasks completed, exiting');
  process.exit(0);
});
```

---

#### **Q15: How do you debug cron jobs that aren't running?**

**Answer:**

**Common issues and solutions:**

**1. Cron expression is wrong:**
```javascript
// ❌ This never matches any time
cron.schedule('0 0 31 2 *', task); // Feb 31st doesn't exist!

// Test expression:
const cron = require('node-cron');
console.log(cron.validate('0 0 31 2 *')); // false

// Use online validators: crontab.guru
```

**2. Task crashes silently:**
```javascript
// ❌ No error handling
cron.schedule('* * * * *', () => {
  doSomething(); // If this throws, cron stops!
});

// ✅ Wrap in try-catch
cron.schedule('* * * * *', async () => {
  try {
    await doSomething();
    console.log('✅ Task completed');
  } catch (error) {
    console.error('❌ Task failed:', error);
  }
});
```

**3. File wasn't required:**
```javascript
// server.js
// require('./scheduler'); // ← Commented out!
// Cron never starts because file wasn't loaded
```

**4. Timezone mismatch:**
```javascript
// Check server timezone
console.log(new Date().toString());
// "Wed Dec 23 2025 14:30:00 GMT+0000 (UTC)"

// Specify timezone explicitly
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York'
});
```

**5. Process manager restarts:**
```javascript
// With PM2, cron might be running multiple times
// Each PM2 instance runs its own cron!

// Solution: Use PM2 ecosystem file
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    instances: 4, // 4 instances
    cron_restart: '0 2 * * *' // Restart at 2 AM
  }, {
    name: 'scheduler',
    instances: 1, // Only 1 instance for cron jobs!
    script: './scheduler.js'
  }]
};
```

---

## 7️⃣ Cheat Sheet / Summary

### 🔥 **Quick Reference Guide**

---

### **Basic Setup**

```javascript
// Install
npm install node-cron

// Import
const cron = require('node-cron');

// Schedule task
cron.schedule('0 9 * * *', () => {
  console.log('Running task at 9 AM');
});

// With options
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York'
});

// Stop task
const task = cron.schedule('* * * * *', myFunction);
task.stop();

// Start again
task.start();
```

---

### **Cron Expression Cheat Sheet**

```javascript
// Format: minute hour day month day-of-week

"* * * * *"          // Every minute
"*/5 * * * *"        // Every 5 minutes
"0 * * * *"          // Every hour
"0 0 * * *"          // Every day at midnight
"0 9 * * *"          // Every day at 9 AM
"0 9 * * 1-5"        // Weekdays at 9 AM
"0 0 1 * *"          // 1st of every month
"0 0 * * 0"          // Every Sunday
"*/15 9-17 * * *"    // Every 15 min, 9 AM-5 PM
"0 2 * * 0"          // Every Sunday at 2 AM

// With seconds (6 fields)
"*/30 * * * * *"     // Every 30 seconds
"0 0 9 * * *"        // Every day at 9:00:00 AM
```

---

### **Common Patterns**

**Daily backup:**
```javascript
cron.schedule('0 2 * * *', async () => {
  await backupDatabase();
});
```

**Hourly cleanup:**
```javascript
cron.schedule('0 * * * *', async () => {
  await cleanupTempFiles();
});
```

**Archive old records (weekly):**
```javascript
cron.schedule('0 3 * * 0', async () => {
  await archiveOldRecords();
});
```

**Send reports (weekdays):**
```javascript
cron.schedule('0 9 * * 1-5', async () => {
  await sendDailyReport();
});
```

---

### **File Operations**

```javascript
const fs = require('fs').promises;
const path = require('path');

// Read JSON file
const filePath = path.join(__dirname, 'data', 'archive.json');
const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

// Write JSON file
await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

// Check if file exists
if (fs.existsSync(filePath)) {
  // File exists
}

// Backup file
await fs.copyFile(filePath, `${filePath}.backup`);
```

---

### **Date Calculations**

```javascript
// Get current timestamp
const now = Date.now(); // or new Date().getTime()

// Calculate days difference
const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

// Using date-fns (recommended)
const { differenceInDays } = require('date-fns');
const days = differenceInDays(new Date(), new Date(recordDate));

// Get yesterday
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// Get start of day
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
```

---

### **Error Handling**

```javascript
cron.schedule('0 2 * * *', async () => {
  try {
    await performTask();
    console.log('✅ Task completed');
  } catch (error) {
    console.error('❌ Task failed:', error);
    // Send alert
    await sendErrorAlert(error);
  }
});
```

---

### **Prevent Overlapping Executions**

```javascript
let isRunning = false;

cron.schedule('*/5 * * * *', async () => {
  if (isRunning) {
    console.log('Task still running, skipping');
    return;
  }
  
  isRunning = true;
  try {
    await longRunningTask();
  } finally {
    isRunning = false;
  }
});
```

---

### **Environment-Specific Schedules**

```javascript
const schedule = process.env.NODE_ENV === 'production'
  ? '0 2 * * *'     // Production: Daily at 2 AM
  : '*/30 * * * * *'; // Dev: Every 30 seconds

cron.schedule(schedule, myTask);
```

---

### **Graceful Shutdown**

```javascript
const tasks = [];

// Register tasks
tasks.push(cron.schedule('0 2 * * *', task1));
tasks.push(cron.schedule('0 3 * * *', task2));

// Stop all on shutdown
process.on('SIGTERM', () => {
  tasks.forEach(task => task.stop());
  process.exit(0);
});
```

---

### **Testing**

```javascript
// Extract task function
const myTask = async () => {
  // Task logic here
};

// Schedule it
cron.schedule('0 2 * * *', myTask);

// Also expose for testing
app.post('/test/task', async (req, res) => {
  await myTask();
  res.json({ message: 'Task executed' });
});
```

---

### **Common Bugs to Avoid**

```javascript
// ❌ Modifying array while iterating
items.forEach((item, index) => {
  items.splice(index, 1); // WRONG!
});

// ✅ Filter instead
const remaining = items.filter(item => shouldKeep(item));

// ❌ Writing file in loop
items.forEach(item => {
  processItem(item);
  fs.writeFileSync('data.json', JSON.stringify(items)); // WRONG!
});

// ✅ Write once after loop
items.forEach(item => processItem(item));
fs.writeFileSync('data.json', JSON.stringify(items));

// ❌ Using sync operations
const data = fs.readFileSync('file.json'); // Blocks!

// ✅ Use async
const data = await fs.promises.readFile('file.json', 'utf-8');
```

---
```javascript
// ✅ CORRECT - Write once after all changes
const itemsToKeep = items.filter(item => !shouldDelete(item));

if (itemsToKeep.length !== items.length) {
  fs.writeFileSync('data.json', JSON.stringify(itemsToKeep, null, 2));
  console.log(`Deleted ${items.length - itemsToKeep.length} items`);
}
```

---

#### 3. **Not Handling Async Operations Properly**

```javascript
// ❌ WRONG - Async function but not awaited
cron.schedule('* * * * *', () => {
  fetchDataFromAPI(); // Returns a promise, but not awaited!
  console.log('Task completed'); // Logs before data is actually fetched
});

// ✅ CORRECT - Use async/await
cron.schedule('* * * * *', async () => {
  try {
    const data = await fetchDataFromAPI();
    console.log('Data fetched:', data);
  } catch (error) {
    console.error('Fetch failed:', error);
  }
});
```

---

#### 4. **Forgetting to Check if File Exists**

```javascript
// ❌ WRONG - Crashes if file doesn't exist
const data = require('./data/archive.json');
data.forEach(item => processItem(item));

// ✅ CORRECT - Check file existence first
const filePath = path.join(__dirname, 'data', 'archive.json');

if (!fs.existsSync(filePath)) {
  console.log('Archive file does not exist, creating empty file');
  fs.writeFileSync(filePath, '[]', 'utf-8');
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
data.forEach(item => processItem(item));
```

---

#### 5. **Using Incorrect Date Calculations**

```javascript
// ❌ WRONG - Incorrect date calculation
const daysDiff = (new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24);
// Can give fractional days: 480.7 days
// Causes issues when comparing > 480

// ✅ CORRECT - Use Math.floor for whole days
const daysDiff = Math.floor((new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24));

// Even better - create helper function
function getDaysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.floor(Math.abs((date1 - date2) / oneDay));
}

const daysDiff = getDaysBetween(new Date(), new Date(item.date));
```

---

#### 6. **Not Handling Empty Arrays**

```javascript
// ❌ WRONG - Crashes if array is empty
const latestRecord = records[records.length - 1]; // undefined if empty!
const avgAmount = records.reduce((sum, r) => sum + r.amount, 0) / records.length; // NaN if empty!

// ✅ CORRECT - Check length first
if (records.length === 0) {
  console.log('No records to process');
  return;
}

const latestRecord = records[records.length - 1];
const avgAmount = records.reduce((sum, r) => sum + r.amount, 0) / records.length;
```

---

#### 7. **Memory Leaks with Cron Jobs**

```javascript
// ❌ WRONG - Creates new connection every time
cron.schedule('* * * * *', async () => {
  const db = await mongoose.connect(DB_URL); // New connection every minute!
  const users = await User.find();
  // Connection never closed - memory leak!
});

// ✅ CORRECT - Reuse existing connection
// Connect once when server starts
mongoose.connect(DB_URL);

cron.schedule('* * * * *', async () => {
  const users = await User.find(); // Uses existing connection
  processUsers(users);
});
```

---

#### 8. **Not Validating Data Before Processing**

```javascript
// ❌ WRONG - Assumes data structure is always correct
const invoices = require('./data/invoice.json');
invoices.forEach(invoice => {
  const total = invoice.items.reduce((sum, item) => sum + item.price, 0); // Crashes if items is undefined!
});

// ✅ CORRECT - Validate data structure
const invoices = require('./data/invoice.json');

if (!Array.isArray(invoices)) {
  console.error('Invalid data format: invoices is not an array');
  return;
}

invoices.forEach(invoice => {
  if (!invoice.items || !Array.isArray(invoice.items)) {
    console.warn(`Invoice ${invoice.id} has invalid items`);
    return;
  }
  
  const total = invoice.items.reduce((sum, item) => {
    return sum + (item.price || 0);
  }, 0);
});
```

---

### 🏢 **Enterprise-Level Practices**

#### 1. **Distributed Locking (Prevent Multiple Servers Running Same Task)**

```javascript
const Redis = require('ioredis');
const redis = new Redis();

// ✅ Use Redis lock to ensure only one instance runs the task
async function runWithLock(taskName, task, timeout = 60000) {
  const lockKey = `lock:${taskName}`;
  const lockValue = `${process.pid}-${Date.now()}`;
  
  // Try to acquire lock
  const acquired = await redis.set(
    lockKey, 
    lockValue, 
    'PX', timeout, // Expires after timeout
    'NX' // Only set if not exists
  );
  
  if (!acquired) {
    console.log(`Task ${taskName} is already running on another instance`);
    return;
  }
  
  try {
    await task();
  } finally {
    // Release lock (only if we still own it)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, lockKey, lockValue);
  }
}

// Usage
cron.schedule('0 2 * * *', async () => {
  await runWithLock('daily-backup', async () => {
    await backupDatabase();
  });
});
```

---

#### 2. **Task Queue Integration**

```javascript
const Queue = require('bull');
const cron = require('node-cron');

// Create queue
const emailQueue = new Queue('email-processing', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

// ✅ Cron schedules jobs, queue processes them
cron.schedule('0 9 * * *', async () => {
  console.log('Adding daily email tasks to queue');
  
  const users = await User.find({ subscribed: true });
  
  for (const user of users) {
    await emailQueue.add('daily-digest', {
      userId: user.id,
      email: user.email
    }, {
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
  
  console.log(`Added ${users.length} email jobs to queue`);
});

// Process queue
emailQueue.process('daily-digest', async (job) => {
  const { userId, email } = job.data;
  await sendDailyDigest(userId, email);
});
```

---

#### 3. **Monitoring & Alerting**

```javascript
const cron = require('node-cron');
const Sentry = require('@sentry/node');

// Initialize monitoring
Sentry.init({ dsn: process.env.SENTRY_DSN });

// ✅ Wrap tasks with monitoring
function monitoredTask(taskName, taskFunction) {
  return async () => {
    const transaction = Sentry.startTransaction({
      op: 'cron',
      name: taskName
    });
    
    const startTime = Date.now();
    
    try {
      await taskFunction();
      
      // Log success metrics
      const duration = Date.now() - startTime;
      console.log(`✅ ${taskName} completed in ${duration}ms`);
      
      // Send to monitoring service
      await sendMetric('cron.success', {
        task: taskName,
        duration
      });
      
    } catch (error) {
      // Log error
      console.error(`❌ ${taskName} failed:`, error);
      
      // Send to Sentry
      Sentry.captureException(error, {
        tags: {
          task: taskName
        }
      });
      
      // Send alert
      await sendAlert({
        title: `Cron Task Failed: ${taskName}`,
        message: error.message,
        severity: 'high'
      });
      
    } finally {
      transaction.finish();
    }
  };
}

// Usage
cron.schedule('0 2 * * *', monitoredTask('database-backup', backupDatabase));
cron.schedule('0 */6 * * *', monitoredTask('cleanup-sessions', cleanupSessions));
```

---

#### 4. **Configuration-Based Scheduling**

```javascript
// config/cron-jobs.json
{
  "jobs": [
    {
      "name": "database-backup",
      "schedule": "0 2 * * *",
      "enabled": true,
      "timeout": 3600000,
      "retries": 2
    },
    {
      "name": "send-reports",
      "schedule": "0 9 * * 1",
      "enabled": true,
      "timeout": 1800000,
      "retries": 1
    },
    {
      "name": "cleanup-temp",
      "schedule": "0 0 * * *",
      "enabled": false,
      "timeout": 600000,
      "retries": 0
    }
  ]
}
```

```javascript
// cron-manager.js
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Task registry
const tasks = {
  'database-backup': backupDatabase,
  'send-reports': sendReports,
  'cleanup-temp': cleanupTempFiles
};

// ✅ Load and initialize cron jobs from config
function initializeCronJobs() {
  const configPath = path.join(__dirname, 'config', 'cron-jobs.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const scheduledJobs = [];
  
  for (const job of config.jobs) {
    if (!job.enabled) {
      console.log(`⏭️ Skipping disabled job: ${job.name}`);
      continue;
    }
    
    const taskFunction = tasks[job.name];
    if (!taskFunction) {
      console.error(`❌ Task not found: ${job.name}`);
      continue;
    }
    
    // Wrap with timeout and retry logic
    const wrappedTask = createTaskWrapper(taskFunction, job);
    
    // Schedule the job
    const task = cron.schedule(job.schedule, wrappedTask);
    scheduledJobs.push({ name: job.name, task });
    
    console.log(`✅ Scheduled job: ${job.name} with schedule: ${job.schedule}`);
  }
  
  return scheduledJobs;
}

function createTaskWrapper(taskFunction, config) {
  return async () => {
    let attempt = 0;
    let lastError;
    
    while (attempt <= config.retries) {
      try {
        // Run with timeout
        await Promise.race([
          taskFunction(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Task timeout')), config.timeout)
          )
        ]);
        
        console.log(`✅ Task ${config.name} completed successfully`);
        return;
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt <= config.retries) {
          console.log(`⚠️ Task ${config.name} failed (attempt ${attempt}/${config.retries}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
        }
      }
    }
    
    // All retries failed
    console.error(`❌ Task ${config.name} failed after ${config.retries} retries:`, lastError);
    await sendAlert(`Task ${config.name} failed`, lastError.message);
  };
}

module.exports = { initializeCronJobs };
```

---

## 6️⃣ Interview Preparation

### 🎯 **Top 15 Task Scheduling Interview Questions**

---

#### **Q1: What is a cron job and how does it work?**

**Answer:**
A **cron job** is a scheduled task that runs automatically at specified times or intervals.

**How it works:**
1. Cron scheduler checks the current time every second (or minute)
2. Compares current time with scheduled times
3. If match found, executes the associated task
4. Waits for next interval and repeats

**Node-cron implementation:**
```javascript
const cron = require('node-cron');

// Cron scheduler
cron.schedule('0 9 * * *', () => {
  console.log('Running task at 9 AM every day');
});

// Behind the scenes:
// - Checks system time continuously
// - When hour=9 and minute=0, executes function
// - Continues checking for next match
```

**Real-world analogy:**
Think of it like an alarm clock that can have multiple alarms set for different times and can repeat daily, weekly, etc.

---

#### **Q2: Explain the cron expression syntax.**

**Answer:**

**Standard format (5 fields):**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, Sun=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Special characters:**
- `*` = Every unit (every minute, every hour, etc.)
- `*/n` = Every n units (*/5 = every 5 minutes)
- `n-m` = Range (1-5 = Monday to Friday)
- `n,m` = List (1,3,5 = Monday, Wednesday, Friday)

**Examples:**
```javascript
"* * * * *"      → Every minute
"0 * * * *"      → Every hour (at minute 0)
"0 0 * * *"      → Every day at midnight
"0 9 * * *"      → Every day at 9 AM
"*/15 * * * *"   → Every 15 minutes
"0 9 * * 1"      → Every Monday at 9 AM
"0 0 1 * *"      → 1st of every month at midnight
"0 9-17 * * *"   → Every hour from 9 AM to 5 PM
"0 9 * * 1-5"    → Weekdays at 9 AM
```

---

#### **Q3: What's the difference between setTimeout and cron jobs?**

**Answer:**

| Feature | setTimeout | Cron Job |
|---------|------------|----------|
| **Execution** | One-time | Recurring |
| **Schedule** | Delay in ms | Time-based pattern |
| **Precision** | Milliseconds | Minutes/seconds |
| **Use Case** | Delayed action | Scheduled tasks |
| **Persistence** | Lost on restart | Reconfigures on restart |

**Examples:**
```javascript
// setTimeout - Run once after delay
setTimeout(() => {
  console.log('Runs once after 5 seconds');
}, 5000);

// Cron - Run repeatedly on schedule
cron.schedule('*/5 * * * *', () => {
  console.log('Runs every 5 minutes forever');
});

// setInterval - Run repeatedly with fixed interval
setInterval(() => {
  console.log('Runs every 5 seconds');
}, 5000);
// Problem: If task takes 10s, they overlap!

// Cron advantage: Won't start next execution until you explicitly allow it
```

---

#### **Q4: How do you prevent overlapping executions in cron jobs?**

**Answer:**

**Method 1: Simple flag**
```javascript
let isRunning = false;

cron.schedule('*/5 * * * *', async () => {
  if (isRunning) {
    console.log('Previous execution still running, skipping');
    return;
  }
  
  isRunning = true;
  try {
    await longTask();
  } finally {
    isRunning = false;
  }
});
```

**Method 2: Distributed lock (multiple servers)**
```javascript
const redis = require('redis').createClient();

cron.schedule('*/5 * * * *', async () => {
  const lockKey = 'lock:my-task';
  const locked = await redis.set(lockKey, '1', 'EX', 300, 'NX');
  
  if (!locked) {
    console.log('Task is running on another server');
    return;
  }
  
  try {
    await longTask();
  } finally {
    await redis.del(lockKey);
  }
});
```

**Method 3: Queue-based approach**
```javascript
const Queue = require('bull');
const queue = new Queue('tasks');

// Cron adds job to queue
cron.schedule('*/5 * * * *', async () => {
  await queue.add('my-task', {}, {
    jobId: 'unique-task-id', // Same ID = won't duplicate
    removeOnComplete: true
  });
});

// Worker processes queue (one at a time)
queue.process('my-task', async (job) => {
  await longTask();
});
```

---

#### **Q5: How do you handle errors in cron jobs?**

**Answer:**

**1. Try-catch wrapper**
```javascript
cron.schedule('0 2 * * *', async () => {
  try {
    await criticalTask();
  } catch (error) {
    console.error('Task failed:', error);
    
    // Send alert
    await sendAlertEmail({
      subject: 'Cron Job Failed',
      body: error.message
    });
    
    // Log to monitoring service
    Sentry.captureException(error);
  }
});
```

**2. Retry logic**
```javascript
async function taskWithRetry(task, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await task();
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last attempt
      await new Promise(r => setTimeout(r, 5000)); // Wait 5s
    }
  }
}

cron.schedule('0 2 * * *', async () => {
  try {
    await taskWithRetry(backupDatabase);
  } catch (error) {
    await sendCriticalAlert(error);
  }
});
```

**3. Dead letter queue**
```javascript
// If task fails, save to database for manual review
catch (error) {
  await FailedTask.create({
    taskName: 'backup',
    error: error.message,
    timestamp: new Date(),
    retryable: true
  });
}
```

---

#### **Q6: How do you test cron jobs?**

**Answer:**

**Method 1: Direct function call (Unit test)**
```javascript
// Extract task logic to separate function
async function backupTask() {
  // Actual backup logic
  return await performBackup();
}

// Schedule it
cron.schedule('0 2 * * *', backupTask);

// Test the function directly
test('backupTask should create backup file', async () => {
  const result = await backupTask();
  expect(result.success).toBe(true);
  expect(fs.existsSync('./backup.sql')).toBe(true);
});
```

**Method 2: Mock time (Integration test)**
```javascript
const MockDate = require('mockdate');

test('cron should run at scheduled time', (done) => {
  let executed = false;
  
  const task = cron.schedule('0 0 * * *', () => {
    executed = true;
  });
  
  // Set time to midnight
  MockDate.set('2024-01-01 00:00:00');
  
  setTimeout(() => {
    expect(executed).toBe(true);
    task.stop();
    MockDate.reset();
    done();
  }, 1000);
});
```

**Method 3: Manual trigger for testing**
```javascript
// Add API endpoint to manually trigger cron
app.post('/admin/trigger-backup', authenticateAdmin, async (req, res) => {
  try {
    await backupTask();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

#### **Q7: What happens to cron jobs when the server restarts?**

**Answer:**

**node-cron behavior:**
- ❌ Does **NOT** persist across restarts
- ❌ Missed executions are **NOT** caught up
- ✅ Re-registers when `require()` runs on restart

**Example scenario:**
```javascript
// Scheduled to run daily at 2 AM
cron.schedule('0 2 * * *', backupDatabase);

// Server crashes at 1 AM
// Backup at 2 AM is missed ❌

// Server restarts at 3 AM
// Missed backup is NOT executed
// Next backup will be tomorrow at 2 AM ✅
```

**Solutions:**

**1. Check last execution on startup**
```javascript
async function checkMissedTasks() {
  const lastBackup = await getLastBackupTime();
  const now = new Date();
  const hoursSinceBackup = (now - lastBackup) / (1000 * 60 * 60);
  
  if (hoursSinceBackup > 24) {
    console.log('Backup was missed, running now');
    await backupDatabase();
  }
}

// Run on startup
checkMissedTasks();
```

**2. Use persistent scheduler (Agenda)**
```javascript
const Agenda = require('agenda');
const agenda = new Agenda({ db: { address: mongoConnectionString }});

agenda.define('daily-backup', async job => {
  await backupDatabase();
});

agenda.every('0 2 * * *', 'daily-backup');
// Persists in MongoDB, survives restarts ✅
```

---

#### **Q8: How do you schedule tasks across multiple servers?**

**Answer:**

**Problem:**
If you have 3 servers running the same code, each will execute the cron job independently!

```
Server 1 → Executes backup at 2 AM
Server 2 → Executes backup at 2 AM (duplicate!)
Server 3 → Executes backup at 2 AM (duplicate!)
```

**Solution 1: Leader election**
```javascript
const redis = require('redis').createClient();

async function isLeader() {
  const leader = await redis.get('cron:leader');
  const myId = process.env.SERVER_ID;
  
  if (!leader) {
    await redis.set('cron:leader', myId, 'EX', 300);
    return true;
  }
  
  return leader === myId;
}

cron.schedule('0 2 * * *', async () => {
  if (await isLeader()) {
    await backupDatabase();
  } else {
    console.log('Not leader, skipping');
  }
});
```

**Solution 2: Distributed lock**
```javascript
// Using Redlock algorithm
const Redlock = require('redlock');
const redlock = new Redlock([redisClient]);

cron.schedule('0 2 * * *', async () => {
  let lock;
  try {
    lock = await redlock.lock('backup-task', 60000);
    await backupDatabase();
  } catch (error) {
    console.log('Another server is running the task');
  } finally {
    if (lock) await lock.unlock();
  }
});
```

**Solution 3: Single dedicated cron server**
```javascript
// Only run cron jobs on one designated server
if (process.env.IS_CRON_SERVER === 'true') {
  require('./schedulers');
}
```

---

#### **Q9: How do you monitor and log cron job executions?**

**Answer:**

**1. Database logging**
```javascript
const CronLog = mongoose.model('CronLog', {
  taskName: String,
  status: String, // 'success', 'failed'
  startTime: Date,
  endTime: Date,
  duration: Number,
  error: String,
  result: Object
});

cron.schedule('0 2 * * *', async () => {
  const startTime = new Date();
  const log = {
    taskName: 'database-backup',
    startTime,
    status: 'running'
  };
  
  try {
    const result = await backupDatabase();
    
    await CronLog.create({
      ...log,
      status: 'success',
      endTime: new Date(),
      duration: Date.now() - startTime,
      result
    });
    
  } catch (error) {
    await CronLog.create({
      ...log,
      status: 'failed',
      endTime: new Date(),
      duration: Date.now() - startTime,
      error: error.message
    });
  }
});
```

**2. Metrics tracking**
```javascript
const client = require('prom-client');

const cronDuration = new client.Histogram({
  name: 'cron_task_duration_seconds',
  help: 'Duration of cron tasks',
  labelNames: ['task_name', 'status']
});

cron.schedule('0 2 * * *', async () => {
  const end = cronDuration.startTimer({ task_name: 'backup' });
  
  try {
    await backupDatabase();
    end({ status: 'success' });
  } catch (error) {
    end({ status: 'failed' });
  }
});
```

---

#### **Q10: What's the difference between node-cron and native OS cron?**

**Answer:**

| Feature | node-cron | OS Cron (crontab) |
|---------|-----------|-------------------|
| **Platform** | Cross-platform | Linux/Unix only |
| **Language** | JavaScript | Shell commands |
| **Process** | Runs inside Node.js | Separate process |
| **Dependencies** | Can access Node modules | System binaries only |
| **Restart behavior** | Re-registers on app restart | Independent of app |
| **Logging** | Easy (console.log) | Requires setup |
| **Configuration** | Code-based | System file |

**OS Cron example:**
```bash
# crontab -e
0 2 * * * /usr/bin/node /path/to/backup-script.js
```

**node-cron example:**
```javascript
cron.schedule('0 2 * * *', () => {
  // Runs inside your Node app
  // Can access database, modules, etc.
});
```

**When to use OS cron:**
- ✅ Task needs to run even if Node app is down
- ✅ System-level tasks (disk cleanup, updates)
- ✅ Running non-Node scripts

**When to use node-cron:**
- ✅ Need access to app's database/models
- ✅ Cross-platform deployment
- ✅ Dynamic scheduling based on app state

---

#### **Q11: How do you handle timezones in cron jobs?**

**Answer:**

**Problem:**
```javascript
// Server in UTC, you want task at 9 AM New York time
cron.schedule('0 9 * * *', task);
// Runs at 9 AM UTC, not 9 AM New York! ❌
```

**Solution 1: Specify timezone**
```javascript
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York'
});
// Runs at 9 AM Eastern Time ✅
```

**Solution 2: Convert to UTC**
```javascript
// 9 AM New York = 2 PM UTC (during standard time)
cron.schedule('0 14 * * *', task);
// But this breaks during daylight saving time! ❌
```

**Solution 3: Check timezone in task**
```javascript
cron.schedule('* * * * *', () => {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York'
  });
  const hour = new Date(now).getHours();
  
  if (hour === 9) {
    runTask();
  }
});
```

**Best practice:** Always use timezone option!

---

#### **Q12: How do you implement retry logic for failed cron tasks?**

**Answer:**

**Approach 1: Immediate retries**
```javascript
async function executeWithRetry(task, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // All retries exhausted
      }
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

cron.schedule('0 2 * * *', async () => {
  try {
    await executeWithRetry(backupDatabase, 3);
  } catch (error) {
    await sendCriticalAlert(error);
  }
});
```

**Approach 2: Scheduled retries**
```javascript
const FailedTask = mongoose.model('FailedTask', {
  taskName: String,
  error: String,
  failedAt: Date,
  retryCount: Number,
  nextRetry: Date
});

// Main task
cron.schedule('0 2 * * *', async () => {
  try {
    await backupDatabase();
  } catch (error) {
    await FailedTask.create({
      taskName: 'backup',
      error: error.message,
      failedAt: new Date(),
      retryCount: 0,
      nextRetry: new Date(Date.now() + 60 * 60 * 1000) // Retry in 1 hour
    });
  }
});

// Retry failed tasks
cron.schedule('*/15 * * * *', async () => {
  const failedTasks = await FailedTask.find({
    nextRetry: { $lte: new Date() },
    retryCount: { $lt: 3 }
  });
  
  for (const task of failedTasks) {
    try {
      await executeTask(task.taskName);
      await FailedTask.deleteOne({ _id: task._id });
    } catch (error) {
      task.retryCount++;
      task.nextRetry = new Date(Date.now() + (task.retryCount * 60 * 60 * 1000));
      await task.save();
    }
  }
});
```

---

#### **Q13: What are the performance implications of running many cron jobs?**

**Answer:**

**Potential issues:**
1. **Memory usage**: Each cron instance consumes memory
2. **CPU overhead**: Checking schedules constantly
3. **Blocking**: Long-running tasks block event loop
4. **Concurrency**: Multiple tasks running simultaneously

**Optimization strategies:**

**1. Combine related tasks**
```javascript
// ❌ BAD: Multiple crons for similar tasks
cron.schedule('0 2 * * *', cleanupUsers);
cron.schedule('0 2 * * *', cleanupSessions);
cron.schedule('0 2 * * *', cleanupLogs);

// ✅ GOOD: Single cron for all cleanup
cron.schedule('0 2 * * *', async () => {
  await Promise.all([
    cleanupUsers(),
    cleanupSessions(),
    cleanupLogs()
  ]);
});
```

**2. Use worker threads for CPU-intensive tasks**
```javascript
const { Worker } = require('worker_threads');

cron.schedule('0 2 * * *', () => {
  const worker = new Worker('./backup-worker.js');
  worker.on('message', (result) => {
    console.log('Backup completed:', result);
  });
});
```

**3. Offload to queue**
```javascript
// Cron just schedules, queue processes
const queue = new Bull('tasks');

cron.schedule('0 2 * * *', async () => {
  await queue.add('backup', { type: 'full' });
});

// Heavy processing in separate worker
queue.process('backup', async (job) => {
  await performHeavyBackup(job.data);
});
```

---

#### **Q14: How do you handle daylight saving time changes?**

**Answer:**

**Problem:**
```javascript
// Schedule task at 2 AM
cron.schedule('0 2 * * *', task);

// During DST transition:
// - Spring forward: 2 AM doesn't exist (skips to 3 AM)
// - Fall back: 2 AM happens twice
```

**Solution 1: Use UTC time**
```javascript
// Always use UTC to avoid DST issues
cron.schedule('0 7 * * *', task); // 2 AM EST = 7 AM UTC
// UTC never changes, no DST!
```

**Solution 2: Specify timezone explicitly**
```javascript
cron.schedule('0 2 * * *', task, {
  timezone: 'America/New_York'
});
// node-cron handles DST transitions automatically
```

**Solution 3: Avoid DST transition hours**
```javascript
// Schedule at 3 AM instead of 2 AM
cron.schedule('0 3 * * *', task);
// 3 AM always exists in all timezones
```

---

#### **Q15: How would you implement a "run once" scheduled task?**

**Answer:**

**Scenario:** Task should run once at a specific future date/time, then never again.

**Method 1: Simple flag**
```javascript
let hasRun = false;

cron.schedule('0 9 1 1 *', () => { // Jan 1 at 9 AM
  if (hasRun) return;
  
  executeTask();
  hasRun = true;
});
```

**Method 2: Stop task after execution**
```javascript
const task = cron.schedule('0 9 1 1 *', () => {
  executeTask();
  task.stop(); // Prevent future executions
});
```

**Method 3: Database check**
```javascript
cron.schedule('0 9 1 1 *', async () => {
  const executed = await TaskLog.findOne({
    taskName: 'new-year-task',
    status: 'completed'
  });
  
  if (executed) return;
  
  await executeTask();
  
  await TaskLog.create({
    taskName: 'new-year-task',
    status: 'completed',
    executedAt: new Date()
  });
});
```

**Method 4: Use setTimeout instead**
```javascript
// Better for one-time tasks
const targetDate = new Date('2025-01-01T09:00:00');
const delay = targetDate - new Date();

if (delay > 0) {
  setTimeout(executeTask, delay);
}
```

---

## 7️⃣ Cheat Sheet / Summary

### 🔥 **Quick Reference Guide**

---

### **Basic Setup**

```javascript
// Install
npm install node-cron

// Import
const cron = require('node-cron');

// Schedule task
cron.schedule('* * * * *', () => {
  console.log('Running task');
});

// With timezone
cron.schedule('0 9 * * *', task, {
  timezone: 'America/New_York'
});
```

---

### **Cron Expression Cheat Sheet**

```javascript
// Every minute
"* * * * *"

// Every 5 minutes
"*/5 * * * *"

// Every hour
"0 * * * *"

// Every day at midnight
"0 0 * * *"

// Every day at 9 AM
"0 9 * * *"

// Weekdays at 9 AM
"0 9 * * 1-5"

// Every Monday at 9 AM
"0 9 * * 1"

// 1st of every month
"0 0 1 * *"

// Every 15 minutes between 9 AM and 5 PM
"*/15 9-17 * * *"

// With seconds (6 fields)
"*/30 * * * * *" // Every 30 seconds
```

---

### **Common Patterns**

```javascript
// Stop a scheduled task
const task = cron.schedule('* * * * *', myFunction);
task.stop();

// Start a stopped task
task.start();

// Destroy a task
task.destroy();

// Prevent overlapping
let isRunning = false;
cron.schedule('* * * * *', async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await myTask();
  } finally {
    isRunning = false;
  }
});

// With error handling
cron.schedule('* * * * *', async () => {
  try {
    await myTask();
  } catch (error) {
    console.error('Task failed:', error);
    await sendAlert(error);
  }
});
```

---

### **File Operations Template**

```javascript
const fs = require('fs');
const path = require('path');

// Read JSON file safely
function readJSONFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Write JSON file
function writeJSONFile(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2), // Pretty print
    'utf-8'
  );
}

// Usage in cron
cron.schedule('0 2 * * *', () => {
  const data = readJSONFile('./data/records.json');
  const filtered = data.filter(record => !isOld(record));
  writeJSONFile('./data/records.json', filtered);
});
```

---

### **Date Calculations**

```javascript
// Get days between dates
function getDaysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs((date1 - date2) / oneDay));
}

// Check if date is older than N days
function isOlderThan(date, days) {
  const daysDiff = getDaysBetween(new Date(), new Date(date));
  return daysDiff > days;
}

// Usage
const records = data.filter(item => !isOlderThan(item.date, 480));
```

---

### **Production Template**

```javascript
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Task with full error handling
async function myScheduledTask() {
  const startTime = new Date();
  console.log(`📋 Starting task at ${startTime.toISOString()}`);
  
  try {
    // Your task logic here
    const result = await doSomething();
    
    const duration = (new Date() - startTime) / 1000;
    console.log(`✅ Task completed in ${duration}s`, result);
    
    return result;
    
  } catch (error) {
    const duration = (new Date() - startTime) / 1000;
    console.error(`❌ Task failed after ${duration}s:`, error);
    
    // Send alert
    await sendAlert({
      title: 'Task Failed',
      message: error.message
    });
    
    throw error;
  }
}

// Schedule with overlap prevention
let isRunning = false;

cron.schedule('0 2 * * *', async () => {
  if (isRunning) {
    console.log('⏭️ Task still running, skipping');
    return;
  }
  
  isRunning = true;
  try {
    await myScheduledTask();
  } finally {
    isRunning = false;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Stopping cron jobs...');
  process.exit(0);
});
```

---

### **Key Takeaways**

✅ **Always use try-catch** in cron tasks  
✅ **Prevent overlapping** executions with flags  
✅ **Log everything** - start, end, errors  
✅ **Use appropriate schedules** - not too frequent  
✅ **Filter first, write once** - don't modify arrays while iterating  
✅ **Specify timezones** explicitly  
✅ **Test task functions** separately from schedule  
✅ **Monitor and alert** on failures  
✅ **Use distributed locks** for multi-server setups  
✅ **Gracefully shutdown** cron jobs on process termination  

---