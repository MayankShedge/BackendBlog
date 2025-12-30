# 🔐 Email Security & Microsoft Azure Email Solutions
---

## 📋 Table of Contents

### Part 1: Email Security Analysis
1. Current Implementation Security Review
2. More Secure Alternatives
3. Magic Links vs Tokens
4. OTP/Short Codes
5. JWT-Based Verification
6. Best Practices Comparison

### Part 2: Microsoft Azure Email Solutions
7. Microsoft Graph API
8. Azure Communication Services
9. Office 365 SMTP
10. Integration with Azure AD
11. Enterprise Implementation

---

# 📚 PART 1: EMAIL SECURITY ANALYSIS

## 🎯 Current Implementation Review

### What We're Doing (Token-Based)

```javascript
// 1. Generate random token
const token = crypto.randomBytes(32).toString('hex')
// "a1b2c3d4e5f6..."

// 2. Hash and store in DB
const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
user.emailVerificationToken = hashedToken

// 3. Send unhashed token in email
const verificationUrl = `${FRONTEND_URL}/verify?token=${token}`

// 4. User clicks link, we hash their token and compare
```

**Security Level:** ⭐⭐⭐⭐ (4/5) - **Good**

**Pros:**
- ✅ Tokens are hashed in database
- ✅ Time-limited expiry
- ✅ Single-use tokens
- ✅ Standard industry practice

**Cons:**
- ⚠️ Token visible in URL (browser history, server logs)
- ⚠️ Long random strings (not user-friendly)
- ⚠️ Requires database storage
- ⚠️ Email interception risk

---

## 🔒 MORE SECURE ALTERNATIVES

Let me show you **better approaches** used by top companies!

---

# 1️⃣ MAGIC LINKS (Most Secure & Modern)

## 🎯 What are Magic Links?

**Used by:** Slack, Notion, Medium, Linear

**How it works:**
- No password at all!
- User enters email
- Receives a link
- Click link → logged in automatically

---

## 🔐 Implementation

### Schema Changes

```javascript
// user.models.js
const userSchema = new Schema({
    email: String,
    // Optional: password field (for traditional login fallback)
    password: String,
    
    // Magic link fields
    magicLinkToken: String,
    magicLinkExpires: Date,
    magicLinkUsed: {
        type: Boolean,
        default: false
    }
})

/**
 * Generate magic link token (more secure than verification token)
 */
userSchema.methods.generateMagicLink = function() {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(64).toString('base64url')  // URL-safe!
    
    // Hash with stronger algorithm
    this.magicLinkToken = crypto
        .createHash('sha512')  // SHA-512 instead of SHA-256
        .update(token)
        .digest('hex')
    
    // Shorter expiry (15 minutes for security)
    this.magicLinkExpires = Date.now() + 15 * 60 * 1000
    this.magicLinkUsed = false
    
    return token
}
```

---

### Controller

```javascript
/**
 * SEND MAGIC LINK (Login/Verification)
 */
const sendMagicLink = asyncHandler(async (req, res) => {
    const { email } = req.body
    
    // Find or create user
    let user = await User.findOne({ email })
    
    if (!user) {
        // Option 1: Create user automatically (passwordless)
        user = await User.create({
            email,
            isEmailVerified: false
        })
    }
    
    // Generate magic link
    const token = user.generateMagicLink()
    await user.save({ validateBeforeSave: false })
    
    // Send email
    const magicUrl = `${process.env.FRONTEND_URL}/auth/magic?token=${token}&email=${email}`
    
    await sendMagicLinkEmail(email, magicUrl)
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Magic link sent to your email")
    )
})

/**
 * VERIFY MAGIC LINK & LOGIN
 */
const verifyMagicLink = asyncHandler(async (req, res) => {
    const { token, email } = req.query
    
    // Hash token
    const hashedToken = crypto.createHash('sha512').update(token).digest('hex')
    
    // Find user
    const user = await User.findOne({
        email,
        magicLinkToken: hashedToken,
        magicLinkExpires: { $gt: Date.now() },
        magicLinkUsed: false  // ← CRITICAL: One-time use only!
    })
    
    if (!user) {
        throw new ApiError(400, "Invalid or expired magic link")
    }
    
    // Mark as used (prevent replay attacks)
    user.magicLinkUsed = true
    user.magicLinkToken = undefined
    user.magicLinkExpires = undefined
    user.isEmailVerified = true
    await user.save({ validateBeforeSave: false })
    
    // Generate auth tokens
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    
    // Set cookies
    const options = { httpOnly: true, secure: true }
    
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user, accessToken }, "Logged in via magic link"))
})
```

---

## 🎯 Why Magic Links are More Secure

| Feature | Traditional Token | Magic Link |
|---------|------------------|------------|
| **Expiry** | 24 hours | 15 minutes |
| **One-time use** | ❌ Can be reused | ✅ Single use |
| **Token length** | 64 chars | 128+ chars |
| **Hash algorithm** | SHA-256 | SHA-512 |
| **Replay attack protection** | ❌ No | ✅ Yes (`magicLinkUsed` flag) |
| **Password needed** | Yes | No |

---

# 2️⃣ OTP / SHORT CODES (User-Friendly)

## 🎯 What are OTPs?

**Used by:** Google, Facebook, Twitter, Banking apps

**How it works:**
- User enters email
- Receives 6-digit code
- Enters code on website
- Verified!

---

## 🔐 Implementation

### Schema

```javascript
const userSchema = new Schema({
    email: String,
    
    // OTP fields
    emailOTP: String,  // Hashed OTP
    emailOTPExpires: Date,
    emailOTPAttempts: {
        type: Number,
        default: 0
    }
})

/**
 * Generate 6-digit OTP
 */
userSchema.methods.generateEmailOTP = function() {
    // Generate random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Hash OTP (never store plain!)
    this.emailOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex')
    
    // Short expiry (10 minutes)
    this.emailOTPExpires = Date.now() + 10 * 60 * 1000
    this.emailOTPAttempts = 0
    
    return otp  // Return unhashed for sending in email
}

/**
 * Verify OTP with rate limiting
 */
userSchema.methods.verifyEmailOTP = function(otp) {
    // Check attempts (prevent brute force)
    if (this.emailOTPAttempts >= 5) {
        throw new Error('Too many attempts. Please request a new OTP.')
    }
    
    // Check expiry
    if (this.emailOTPExpires < Date.now()) {
        throw new Error('OTP expired')
    }
    
    // Hash and compare
    const hashedOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex')
    
    if (this.emailOTP !== hashedOTP) {
        this.emailOTPAttempts += 1
        return false
    }
    
    return true
}
```

---

### Controller

```javascript
/**
 * SEND OTP
 */
const sendEmailOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    
    const user = await User.findOne({ email })
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Generate OTP
    const otp = user.generateEmailOTP()
    await user.save({ validateBeforeSave: false })
    
    // Send email with OTP
    await sendOTPEmail(email, otp)
    
    return res.status(200).json(
        new ApiResponse(200, {}, "OTP sent to your email")
    )
})

/**
 * VERIFY OTP
 */
const verifyEmailOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    
    const user = await User.findOne({ email })
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    try {
        const isValid = user.verifyEmailOTP(otp)
        
        if (!isValid) {
            await user.save({ validateBeforeSave: false })
            throw new ApiError(400, "Invalid OTP")
        }
        
        // Clear OTP
        user.emailOTP = undefined
        user.emailOTPExpires = undefined
        user.emailOTPAttempts = 0
        user.isEmailVerified = true
        await user.save({ validateBeforeSave: false })
        
        return res.status(200).json(
            new ApiResponse(200, {}, "Email verified successfully")
        )
    } catch (error) {
        throw new ApiError(400, error.message)
    }
})
```

---

## 🎨 Email Template for OTP

```javascript
export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Your Verification Code</h2>
                <p>Enter this code to verify your email:</p>
                
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="font-size: 48px; letter-spacing: 10px; margin: 0; color: #333;">
                        ${otp}
                    </h1>
                </div>
                
                <p style="color: #666;">This code expires in 10 minutes.</p>
                <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
            </div>
        `
    }
    
    await transporter.sendMail(mailOptions)
}
```

---

## 🎯 OTP Security Features

**Built-in protections:**
- ✅ Rate limiting (5 attempts max)
- ✅ Short expiry (10 minutes)
- ✅ Hashed in database
- ✅ Auto-clears after verification
- ✅ User-friendly (6 digits)

---

# 3️⃣ JWT-BASED VERIFICATION (Stateless)

## 🎯 How it Works

**No database storage needed!** All info in the token itself.

---

## 🔐 Implementation

```javascript
/**
 * GENERATE VERIFICATION JWT
 */
const generateVerificationJWT = (userId, email) => {
    return jwt.sign(
        {
            userId,
            email,
            purpose: 'email-verification'  // ← Important!
        },
        process.env.EMAIL_VERIFICATION_SECRET,  // Different secret!
        {
            expiresIn: '24h'
        }
    )
}

/**
 * SEND VERIFICATION EMAIL (JWT)
 */
const sendVerificationEmailJWT = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    
    // Generate JWT token
    const token = generateVerificationJWT(user._id, user.email)
    
    // Send email with JWT
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    await sendVerificationEmail(user.email, verificationUrl)
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Verification email sent")
    )
})

/**
 * VERIFY EMAIL (JWT)
 */
const verifyEmailJWT = asyncHandler(async (req, res) => {
    const { token } = req.query
    
    try {
        // Verify JWT
        const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET)
        
        // Check purpose (prevent token reuse for other purposes)
        if (decoded.purpose !== 'email-verification') {
            throw new Error('Invalid token purpose')
        }
        
        // Find and verify user
        const user = await User.findById(decoded.userId)
        
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        
        if (user.email !== decoded.email) {
            throw new ApiError(400, "Email mismatch")
        }
        
        if (user.isEmailVerified) {
            throw new ApiError(400, "Email already verified")
        }
        
        // Verify
        user.isEmailVerified = true
        await user.save({ validateBeforeSave: false })
        
        return res.status(200).json(
            new ApiResponse(200, {}, "Email verified successfully")
        )
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(400, "Verification link expired")
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(400, "Invalid verification link")
        }
        throw error
    }
})
```

---

## 🎯 JWT Verification Pros & Cons

**Pros:**
- ✅ No database storage needed
- ✅ Stateless (scales better)
- ✅ Self-contained (all info in token)
- ✅ Built-in expiry

**Cons:**
- ❌ Cannot revoke before expiry
- ❌ Token can be reused until expiry
- ❌ Larger token size
- ❌ No rate limiting built-in

---

# 📊 SECURITY COMPARISON

## Which Method is Most Secure?

| Method | Security | UX | Scalability | Enterprise-Ready |
|--------|----------|-----|-------------|------------------|
| **Traditional Token** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes |
| **Magic Links** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes |
| **OTP Codes** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Yes |
| **JWT-Based** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Depends |

---

## 🏆 RECOMMENDATION

**For Maximum Security:** Use **Magic Links** with these features:
- ✅ SHA-512 hashing
- ✅ 15-minute expiry
- ✅ One-time use flag
- ✅ 128-character tokens
- ✅ Rate limiting

**For Best UX:** Use **OTP Codes**
- ✅ Easy to type
- ✅ Works without clicking links
- ✅ Familiar to users

**For Enterprises (like Deloitte):** Combine multiple methods:
- 🔐 Magic links for primary flow
- 📱 OTP as fallback
- 🏢 Azure AD for SSO (covered next!)

---

# 📚 PART 2: MICROSOFT AZURE EMAIL SOLUTIONS

Now let's cover **enterprise-grade email** for your Deloitte use case!

---

# 🏢 MICROSOFT ECOSYSTEM OVERVIEW

**What Deloitte (and most enterprises) use:**

```
┌─────────────────────────────────────────┐
│     MICROSOFT ENTERPRISE STACK          │
├─────────────────────────────────────────┤
│                                          │
│  🔐 Azure Active Directory (Azure AD)   │
│      → Single Sign-On (SSO)             │
│      → User management                  │
│      → Access control                   │
│                                          │
│  📧 Microsoft 365 / Exchange Online     │
│      → Company email (@deloitte.com)    │
│      → Shared mailboxes                 │
│      → Email policies                   │
│                                          │
│  ☁️ Azure Cloud Services                │
│      → App hosting                      │
│      → Database                         │
│      → Storage                          │
│                                          │
└─────────────────────────────────────────┘
```

---

# 1️⃣ MICROSOFT GRAPH API (Recommended for Enterprises)

## 🎯 What is Microsoft Graph?

**The unified API** for all Microsoft 365 services:
- Send emails via Outlook/Exchange
- Access user data from Azure AD
- Read calendar, files, teams, etc.
- Use your company email domain

**Perfect for:** Internal enterprise apps

---

## 📦 Installation

```bash
npm install @azure/identity @microsoft/microsoft-graph-client isomorphic-fetch
```

---

## ⚙️ Setup

### Environment Variables

```env
# Azure AD App Registration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Email settings
AZURE_SENDER_EMAIL=noreply@deloitte.com
FRONTEND_URL=https://your-app.deloitte.com
```

---

## 🔐 Email Service with Graph API

### Create Service (`src/services/microsoft-graph.service.js`)

```javascript
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import 'isomorphic-fetch'

/**
 * Initialize Graph Client
 * Note: OAuth setup will be covered in next part
 */
const getGraphClient = () => {
    // Credential using App Registration (Service Principal)
    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    )
    
    // Create Graph client
    const client = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const tokenResponse = await credential.getToken(
                    'https://graph.microsoft.com/.default'
                )
                return tokenResponse.token
            }
        }
    })
    
    return client
}

/**
 * Send verification email via Microsoft Graph
 */
export const sendVerificationEmailGraph = async (recipientEmail, verificationToken) => {
    const client = getGraphClient()
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    const message = {
        subject: 'Verify Your Email - Deloitte App',
        body: {
            contentType: 'HTML',
            content: `
                <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #0078D4;">Welcome to Deloitte App</h2>
                            <p>Please verify your email address by clicking the button below:</p>
                            
                            <a href="${verificationUrl}" 
                               style="display: inline-block; padding: 12px 24px; 
                                      background-color: #0078D4; color: white; 
                                      text-decoration: none; border-radius: 4px; margin: 20px 0;">
                                Verify Email
                            </a>
                            
                            <p style="color: #666; font-size: 14px;">
                                This link expires in 24 hours.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="color: #999; font-size: 12px;">
                                This is an automated message from Deloitte App. Please do not reply.
                            </p>
                        </div>
                    </body>
                </html>
            `
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipientEmail
                }
            }
        ]
    }
    
    try {
        // Send email from service account
        await client
            .api(`/users/${process.env.AZURE_SENDER_EMAIL}/sendMail`)
            .post({
                message: message,
                saveToSentItems: false  // Don't save to sent items
            })
        
        console.log('✅ Verification email sent via Microsoft Graph')
        return { success: true }
    } catch (error) {
        console.error('❌ Graph API error:', error)
        throw new Error('Failed to send email via Microsoft Graph')
    }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmailGraph = async (recipientEmail, resetToken) => {
    const client = getGraphClient()
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const message = {
        subject: 'Reset Your Password - Deloitte App',
        body: {
            contentType: 'HTML',
            content: `
                <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #0078D4;">Password Reset Request</h2>
                            <p>You requested to reset your password. Click the button below to proceed:</p>
                            
                            <a href="${resetUrl}" 
                               style="display: inline-block; padding: 12px 24px; 
                                      background-color: #D83B01; color: white; 
                                      text-decoration: none; border-radius: 4px; margin: 20px 0;">
                                Reset Password
                            </a>
                            
                            <p style="color: #666; font-size: 14px;">
                                This link expires in 1 hour.
                            </p>
                            
                            <p style="color: #999; font-size: 12px;">
                                If you didn't request this, please ignore this email.
                            </p>
                        </div>
                    </body>
                </html>
            `
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipientEmail
                }
            }
        ]
    }
    
    await client
        .api(`/users/${process.env.AZURE_SENDER_EMAIL}/sendMail`)
        .post({ message, saveToSentItems: false })
}

/**
 * Send email with CC and BCC (for admin notifications)
 */
export const sendAdminNotificationGraph = async (subject, htmlContent, recipients) => {
    const client = getGraphClient()
    
    const message = {
        subject: subject,
        body: {
            contentType: 'HTML',
            content: htmlContent
        },
        toRecipients: recipients.to.map(email => ({
            emailAddress: { address: email }
        })),
        ccRecipients: recipients.cc?.map(email => ({
            emailAddress: { address: email }
        })) || [],
        bccRecipients: recipients.bcc?.map(email => ({
            emailAddress: { address: email }
        })) || []
    }
    
    await client
        .api(`/users/${process.env.AZURE_SENDER_EMAIL}/sendMail`)
        .post({ message, saveToSentItems: true })  // Save for audit trail
}

/**
 * Send email with attachments
 */
export const sendEmailWithAttachmentGraph = async (recipientEmail, subject, htmlContent, attachmentPath) => {
    const client = getGraphClient()
    const fs = require('fs')
    
    // Read file
    const fileContent = fs.readFileSync(attachmentPath)
    const base64Content = fileContent.toString('base64')
    
    const message = {
        subject: subject,
        body: {
            contentType: 'HTML',
            content: htmlContent
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipientEmail
                }
            }
        ],
        attachments: [
            {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: path.basename(attachmentPath),
                contentType: 'application/pdf',  // Adjust based on file type
                contentBytes: base64Content
            }
        ]
    }
    
    await client
        .api(`/users/${process.env.AZURE_SENDER_EMAIL}/sendMail`)
        .post({ message, saveToSentItems: false })
}
```

---

## 🔧 Azure AD App Registration (Setup Steps)

**To use Graph API, you need to register your app:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - Name: "YourApp Email Service"
   - Supported account types: "Accounts in this organizational directory only"
5. Click **Register**
6. Copy **Application (client) ID** → `AZURE_CLIENT_ID`
7. Copy **Directory (tenant) ID** → `AZURE_TENANT_ID`
8. Go to **Certificates & secrets**
9. Create **New client secret**
10. Copy secret value → `AZURE_CLIENT_SECRET`
11. Go to **API permissions**
12. Add permissions:
    - **Mail.Send** (Application permission)
    - **User.Read.All** (if you need user info)
13. Click **Grant admin consent**

---

## 📧 Service Account Email

**You need a service account (mailbox) for sending:**

Option 1: **Shared Mailbox**
- Create: Microsoft 365 Admin Center → Shared mailboxes
- Example: `noreply@deloitte.com`
- No license needed!

Option 2: **User Mailbox**
- Regular user account
- Example: `appservices@deloitte.com`
- Requires license

---

# 2️⃣ AZURE COMMUNICATION SERVICES (Modern Alternative)

## 🎯 What is Azure Communication Services?

**Microsoft's modern communication platform:**
- Send emails
- SMS
- Voice/Video
- Chat
- Built for apps (not just Office 365)

**Perfect for:** Customer-facing apps

---

## 📦 Installation

```bash
npm install @azure/communication-email
```

---

## ⚙️ Setup

```javascript
import { EmailClient } from "@azure/communication-email"

// Initialize client
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING
const emailClient = new EmailClient(connectionString)

/**
 * Send email via Azure Communication Services
 */
export const sendEmailACS = async (recipientEmail, subject, htmlContent) => {
    const message = {
        senderAddress: "noreply@yourdomain.com",  // Must be verified domain
        content: {
            subject: subject,
            html: htmlContent
        },
        recipients: {
            to: [
                {
                    address: recipientEmail
                }
            ]
        }
    }
    
    try {
        const poller = await emailClient.beginSend(message)
        const result = await poller.pollUntilDone()
        
        console.log('✅ Email sent via Azure Communication Services')
        return { success: true, messageId: result.id }
    } catch (error) {
        console.error('❌ ACS error:', error)
        throw error
    }
}
```

---

## 🔧 ACS Setup Steps

1. Go to Azure Portal
2. Create **Communication Services** resource
3. Get connection string from **Keys** section
4. Go to **Email** → **Provision domains**
5. Add your domain and verify DNS records
6. Use verified domain in `senderAddress`

---

# 3️⃣ OFFICE 365 SMTP (Traditional Method)

## 🎯 When to Use?

**Use SMTP if:**
- You have existing email infrastructure
- Need simple integration
- Don't want to deal with Graph API
- Legacy systems

---

## ⚙️ Setup with Nodemailer

```javascript
import nodemailer from 'nodemailer'

// Office 365 SMTP configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,  // Use STARTTLS
    auth: {
        user: process.env.OFFICE365_EMAIL,  // your-service@deloitte.com
        pass: process.env.OFFICE365_PASSWORD  // App password
    },
    tls: {
        ciphers: 'SSLv3'
    }
})

/**
 * Send email via Office 365 SMTP
 */
export const sendEmailO365SMTP = async (recipientEmail, subject, htmlContent) => {
    const mailOptions = {
        from: `"Deloitte App" <${process.env.OFFICE365_EMAIL}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
    }
    
    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('✅ Email sent via Office 365 SMTP:', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ SMTP error:', error)
        throw error
    }
}
```

---

## 🔐 Office 365 SMTP Authentication

**For service accounts, you need:**

1. **Basic Auth** (being deprecated):
   - Username: `service@deloitte.com`
   - Password: Account password

2. **App Password** (recommended):
   - Enable MFA on service account
   - Generate app-specific password
   - Use app password instead of account password

3. **OAuth 2.0** (most secure):
   - Will cover in next part!

---

# 📊 MICROSOFT EMAIL SOLUTIONS COMPARISON

| Solution | Best For | Complexity | Features | Cost |
|----------|----------|------------|----------|------|
| **Graph API** | Internal enterprise apps | Medium | Full M365 integration | Included in M365 |
| **Azure Communication Services** | Customer-facing apps | Easy | Modern, scalable | Pay-per-use |
| **Office 365 SMTP** | Legacy/simple apps | Easy | Basic email | Included in M365 |

---

# 🏢 ENTERPRISE IMPLEMENTATION EXAMPLE

## Complete Controller with Microsoft Graph

```javascript
// src/controllers/user.controller.js
import { sendVerificationEmailGraph, sendPasswordResetEmailGraph } from '../services/microsoft-graph.service.js'

/**
 * REGISTER USER (Enterprise version)
 */
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    
    // Validation
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    
    // Check if user exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }
    
    // Handle avatar upload (same as before)
    const avatarLocalPath = req.files?.avatar[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }
    
    // Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase(),
        isEmailVerified: false
    })
    
    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken()
    await user.save({ validateBeforeSave: false })
    
    // Send email via Microsoft Graph
    try {
        await sendVerificationEmailGraph(email, verificationToken)
    } catch (error) {
        console.error('Failed to send verification email:', error)
        // Still allow registration to complete
    }
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken"
    )
    
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered. Verification email sent to your corporate email."
        )
    )
})

/**
 * FORGOT PASSWORD (Enterprise version)
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    
    const user = await User.findOne({ email })
    
    if (!user) {
        // Don't reveal if email exists (security)
        return res.status(200).json(
            new ApiResponse(200, {}, "If account exists, reset link has been sent")
        )
    }
    
    // Generate reset token
    const resetToken = user.generatePasswordResetToken()
    await user.save({ validateBeforeSave: false })
    
    // Send via Microsoft Graph
    try {
        await sendPasswordResetEmailGraph(email, resetToken)
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        
        throw new ApiError(500, "Failed to send password reset email")
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset link sent to your email")
    )
})

export { registerUser, forgotPassword }
```
---
 # OAuth with multiple types (Google/Github etc)
 # 🔐 OAuth 2.0 & Social Login - ULTRA DETAILED COMPLETE GUIDE
---

## 📋 MASSIVE Table of Contents

### Part 1: OAuth 2.0 Fundamentals (Deep Dive)
1. What is OAuth 2.0? (Complete Explanation)
2. Why OAuth? (Real-world Problems it Solves)
3. OAuth vs Authentication vs Authorization
4. OAuth Flow Types (All 4 Grant Types)
5. OAuth Terminology (Every Term Explained)
6. How OAuth Actually Works (Step-by-Step)
7. Security Concerns & Solutions

### Part 2: OAuth Architecture
8. Database Schema Design
9. Project Structure
10. Environment Setup
11. Dependencies & Installation

### Part 3: Google OAuth Implementation
12. Google Cloud Console Setup (Every Click)
13. Passport.js Setup & Configuration
14. Google Strategy Implementation
15. Complete Controller Code
16. Routes Configuration
17. Frontend Integration
18. Token Management
19. Error Handling
20. Testing in Postman

### Part 4: GitHub OAuth Implementation
21. GitHub OAuth App Setup
22. GitHub Strategy Configuration
23. Complete Implementation
24. Handling GitHub-Specific Data

### Part 5: Microsoft/Azure AD OAuth
25. Azure AD App Registration (Detailed)
26. Microsoft Strategy Setup
27. Corporate Account Integration
28. Handling Azure AD Tokens

### Part 6: Facebook OAuth
29. Facebook App Setup
30. Facebook Strategy Implementation
31. Profile Data Handling

### Part 7: Multiple Provider Management
32. Unified User Model
33. Account Linking
34. Multiple OAuth Accounts
35. Provider Switching

### Part 8: Advanced Features
36. Refresh Token Management
37. Token Revocation
38. Account Unlinking
39. Profile Syncing
40. Session Management

### Part 9: Security & Best Practices
41. Common OAuth Vulnerabilities
42. CSRF Protection
43. State Parameter Usage
44. PKCE Implementation
45. Security Checklist

### Part 10: Production Deployment
46. Environment Configuration
47. Error Logging
48. Monitoring
49. Rate Limiting
50. Cheat Sheets & Quick Reference

---

# 📚 PART 1: OAuth 2.0 FUNDAMENTALS

## 🎯 What is OAuth 2.0? (Complete Explanation)

**OAuth 2.0 = Open Authorization 2.0**

Let me explain this with a **real-world analogy** first, then we'll dive deep into technical details.

---

## 🏨 The Hotel Key Card Analogy

**Scenario:** You're staying at a hotel and want hotel staff to clean your room.

**Without OAuth (Bad Way):**
```
You give the cleaner your room key
    ↓
Cleaner has FULL ACCESS to your room
    ↓
Can take valuables
Can copy key
Can come anytime
Can never be tracked
```

**With OAuth (Smart Way):**
```
Hotel issues a TEMPORARY KEY CARD to cleaner
    ↓
Limited access (only cleaning, specific time)
    ↓
Cannot access safe
Cannot be duplicated
Expires after cleaning
All access is logged
You can revoke anytime
```

---

## 💻 Translating to Web Applications

**Without OAuth (Traditional Login - Bad for Third-party Apps):**
```
User gives Twitter their Facebook password
    ↓
Twitter has FULL ACCESS to Facebook account
    ↓
Can read all messages
Can post anything
Can delete account
Password stored by Twitter
If Twitter hacked = Facebook compromised
```

**With OAuth (Modern Way):**
```
User clicks "Login with Facebook"
    ↓
Facebook asks: "Allow Twitter to access your profile?"
    ↓
User approves
    ↓
Facebook gives Twitter a TOKEN (not password!)
    ↓
Token has LIMITED permissions
    ↓
Read profile only (no posting)
Expires after 60 days
Can be revoked by user anytime
Twitter never sees password
```

---

## 🎯 OAuth 2.0 Definition (Technical)

**OAuth 2.0 is a protocol that allows:**
1. **Third-party applications** (like your website)
2. **To access user resources** (like profile, emails)
3. **From a service provider** (like Google, Facebook)
4. **Without sharing passwords**
5. **With limited, revocable permissions**

---

## 🤔 Why Was OAuth Created?

### The Problems Before OAuth:

**Problem 1: Password Sharing**
```javascript
// Old way (2005):
// User wants to import contacts from Gmail to Facebook

Facebook: "Enter your Gmail password"
User: "john@gmail.com / MySecretPass123"

// Now Facebook has your Gmail password! 😱
// Problems:
// - Facebook can read all your emails
// - If Facebook is hacked, Gmail is compromised
// - Can't revoke access without changing password
// - No way to limit what Facebook can do
```

**Problem 2: No Permission Control**
```javascript
// Old way:
// App needs to read your profile

App gets: EVERYTHING
- Can read messages
- Can post on your behalf
- Can delete your account
- Can access payment methods
- No way to limit this!
```

**Problem 3: No Revocation**
```javascript
// Old way:
// Want to remove app access?

Only option: Change your password!
// But this breaks access for ALL apps
// You'd have to re-authenticate everywhere
```

---

### How OAuth Solved These Problems:

**Solution 1: No Password Sharing**
```javascript
// OAuth way:
// User never shares password with third-party

User clicks "Login with Google"
    ↓
Redirected to Google's login page
    ↓
User enters password ONLY on Google.com
    ↓
Google issues a token
    ↓
Your app gets token (not password!)
```

**Solution 2: Granular Permissions (Scopes)**
```javascript
// OAuth way:
// Request only what you need

const scopes = [
    'profile',      // Read basic profile
    'email'         // Read email address
]
// NOT requesting:
// - 'gmail.modify' (can't read/send emails)
// - 'drive.file' (can't access files)
// - 'calendar' (can't see calendar)
```

**Solution 3: Easy Revocation**
```javascript
// OAuth way:
// User can revoke access anytime

Google Account → Security → Third-party apps
→ "YourApp" → Remove Access
// Done! App can't access anything anymore
// User's password unchanged
// Other apps unaffected
```

---

## 🆚 OAuth vs Authentication vs Authorization

Let me clear this up because it's confusing!

### Authentication (Who are you?)

**Authentication** = Proving identity

```javascript
// Traditional Login (Authentication)
POST /login
Body: {
    email: "john@example.com",
    password: "MySecretPass123"
}

Server checks: "Is this really John?"
    ↓
Password matches? → Authenticated!
    ↓
Server now knows: "This is John"
```

**Visual:**
```
🚪 Authentication = Proving you are who you say you are

Like showing your ID at airport:
"I am John Doe" → Show passport → Verified!
```

---

### Authorization (What can you do?)

**Authorization** = Granting permissions

```javascript
// After Authentication (Authorization)
Server checks: "What is John allowed to do?"
    ↓
John's role: "Editor"
    ↓
Permissions:
- ✅ Can create posts
- ✅ Can edit posts
- ❌ Cannot delete users
- ❌ Cannot access admin panel
```

**Visual:**
```
🔑 Authorization = What you're allowed to do

Like hotel key card access:
You're identified as "Guest in Room 205"
Your card opens: Room 205 ✅
Your card doesn't open: Other rooms ❌
```

---

### OAuth (Delegation)

**OAuth** = Letting someone else access on your behalf

```javascript
// OAuth (Delegation of Authorization)
User to Google: "Let MyApp access my profile"
    ↓
Google to MyApp: "Here's a token"
    ↓
MyApp can now:
- ✅ Read profile (delegated)
- ✅ Read email (delegated)
- ❌ Change password (not delegated)
- ❌ Delete account (not delegated)

// User authorized MyApp to act on their behalf
// But with LIMITED permissions
```

**Visual:**
```
🔓 OAuth = Giving limited access to act on your behalf

Like valet parking:
You: "Park my car" → Give valet a special key
Valet key can:
- ✅ Start engine
- ✅ Drive to parking
- ❌ Cannot open trunk
- ❌ Cannot access glove box

You authorized valet to use your car
But with LIMITED capabilities
```

---

### Side-by-Side Comparison

| Concept | Question | Example |
|---------|----------|---------|
| **Authentication** | Who are you? | Login with email/password |
| **Authorization** | What can you do? | User role: Admin, Editor, Viewer |
| **OAuth** | Who can act on your behalf? | "Login with Google" |

---

## 📊 Real-World OAuth Example (Step-by-Step)

Let's see OAuth in action with **"Sign in with Google"**:

### Scenario: You visit a new app "PhotoPro"

**Step 1: You click "Sign in with Google"**
```
PhotoPro website:
┌─────────────────────────────┐
│  Welcome to PhotoPro!       │
│                             │
│  [Sign in with Google]  🔵  │
│  [Sign in with Facebook] 🔵 │
│  [Sign in with Email] ✉️     │
└─────────────────────────────┘
```

---

**Step 2: Redirect to Google**
```javascript
// PhotoPro redirects you to:
https://accounts.google.com/o/oauth2/v2/auth?
    client_id=photopro-app-id
    &redirect_uri=https://photopro.com/auth/google/callback
    &response_type=code
    &scope=profile email
    &state=random-security-token
```

**You see Google's login page:**
```
┌─────────────────────────────┐
│         Google              │
│                             │
│  Sign in to continue        │
│                             │
│  Email: [john@gmail.com]    │
│  Password: [••••••••]       │
│                             │
│  [Sign In]                  │
└─────────────────────────────┘
```

---

**Step 3: Login to Google**
```
You enter YOUR Google password
    ↓
Google verifies: "Yes, this is John"
    ↓
You're authenticated with Google ✅
```

**Important:** PhotoPro **NEVER** sees your password!

---

**Step 4: Google Asks for Permission**
```
┌─────────────────────────────────────┐
│  PhotoPro wants to access:          │
│                                     │
│  ✓ Your name and profile picture   │
│  ✓ Your email address               │
│                                     │
│  PhotoPro will not be able to:     │
│  • Read your emails                │
│  • Access your Google Drive        │
│  • Send emails on your behalf      │
│                                     │
│  [Cancel]  [Allow] ←── You click   │
└─────────────────────────────────────┘
```

---

**Step 5: Google Issues Authorization Code**
```javascript
// After you click "Allow"
// Google redirects back to PhotoPro with a CODE:

https://photopro.com/auth/google/callback?
    code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
    &state=random-security-token
```

**This CODE is temporary (expires in 10 minutes)**

---

**Step 6: PhotoPro Exchanges Code for Tokens**
```javascript
// PhotoPro's server makes a request to Google:
POST https://oauth2.googleapis.com/token
Content-Type: application/json

{
    "client_id": "photopro-app-id",
    "client_secret": "photopro-secret-key",
    "code": "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7",
    "redirect_uri": "https://photopro.com/auth/google/callback",
    "grant_type": "authorization_code"
}

// Google responds with tokens:
{
    "access_token": "ya29.a0AfH6SMB...",
    "refresh_token": "1//0gOy4xK...",
    "expires_in": 3600,  // 1 hour
    "token_type": "Bearer"
}
```

---

**Step 7: PhotoPro Fetches Your Profile**
```javascript
// PhotoPro uses the access_token to get your info:
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer ya29.a0AfH6SMB...

// Google responds:
{
    "id": "108123456789",
    "email": "john@gmail.com",
    "verified_email": true,
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "picture": "https://lh3.googleusercontent.com/a/..."
}
```

---

**Step 8: PhotoPro Creates Your Account**
```javascript
// PhotoPro creates/updates user in their database:
{
    "email": "john@gmail.com",
    "name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/a/...",
    "googleId": "108123456789",
    "provider": "google",
    "accessToken": "ya29.a0AfH6SMB...",  // Encrypted!
    "refreshToken": "1//0gOy4xK..."      // Encrypted!
}
```

---

**Step 9: You're Logged In!**
```
PhotoPro dashboard:
┌─────────────────────────────────┐
│  Welcome, John Doe! 👋          │
│  [Profile pic]                  │
│                                 │
│  Your Photos:                   │
│  [Upload New Photo]             │
└─────────────────────────────────┘
```

---

### 🎨 Complete Visual Flow

```
YOU                    PHOTOPRO              GOOGLE
 │                         │                    │
 │  Click "Sign in"       │                    │
 │─────────────────────>  │                    │
 │                        │                    │
 │                        │  Redirect to login │
 │  ────────────────────────────────────────>  │
 │                        │                    │
 │  Enter password        │                    │
 │  ───────────────────────────────────────>   │
 │                        │                    │
 │                        │  "Allow access?"   │
 │  <──────────────────────────────────────    │
 │                        │                    │
 │  Click "Allow"         │                    │
 │  ───────────────────────────────────────>   │
 │                        │                    │
 │  Redirect with CODE    │                    │
 │  <──────────────────   │                    │
 │                        │                    │
 │                        │  Exchange CODE     │
 │                        │  ──────────────>   │
 │                        │                    │
 │                        │  <── ACCESS TOKEN  │
 │                        │                    │
 │                        │  Get user profile  │
 │                        │  ──────────────>   │
 │                        │                    │
 │                        │  <── Profile data  │
 │                        │                    │
 │  You're logged in!     │                    │
 │  <─────────────────    │                    │
 │                        │                    │
```

---

## 🔑 OAuth 2.0 Grant Types (4 Types)

OAuth 2.0 has **4 different flows** for different scenarios. Let me explain each!

---

### 1️⃣ Authorization Code Grant (Most Common & Secure)

**Used for:** Web applications with backend server

**Flow:**
```
User → Frontend → OAuth Provider → Backend → Database
```

**When to use:**
- ✅ Web applications
- ✅ Mobile apps (with PKCE)
- ✅ Most secure
- ✅ Can store secrets safely

**Example:** "Login with Google" on a website

**Detailed Flow:**
```
1. User clicks "Login with Google"
2. Frontend redirects to Google
3. User logs in & approves
4. Google redirects to YOUR backend with CODE
5. YOUR backend exchanges CODE for ACCESS TOKEN
6. YOUR backend stores token securely
7. YOUR backend creates session
8. User is logged in
```

**Security:**
- ✅ Client secret never exposed to browser
- ✅ Tokens handled by backend only
- ✅ Most secure for web apps

---

### 2️⃣ Implicit Grant (Deprecated - Don't Use!)

**Used for:** Single-page apps (historical)

**Flow:**
```
User → Frontend → OAuth Provider → Frontend directly
```

**⚠️ DEPRECATED - DO NOT USE!**

**Why it existed:**
- For SPAs without backend
- Tokens returned directly in URL
- No code exchange step

**Why it's deprecated:**
- ❌ Tokens exposed in browser
- ❌ Tokens in URL (history, logs)
- ❌ No refresh tokens
- ❌ Less secure

**Better alternative:** Use Authorization Code + PKCE

---

### 3️⃣ Resource Owner Password Credentials (ROPC)

**Used for:** Trusted first-party applications only

**Flow:**
```
App directly sends username/password to OAuth provider
```

**When to use:**
- ✅ Your own mobile app for your own API
- ✅ Migration from legacy systems
- ❌ Never for third-party apps

**Example:**
```javascript
// Mobile app sends to YOUR backend:
POST /oauth/token
{
    "grant_type": "password",
    "username": "john@example.com",
    "password": "MyPassword123",
    "client_id": "your-app-id",
    "client_secret": "your-secret"
}

// Response:
{
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
}
```

**Security concerns:**
- ⚠️ App handles user password
- ⚠️ Only for trusted apps
- ⚠️ Against OAuth's no-password-sharing principle

---

### 4️⃣ Client Credentials Grant

**Used for:** Server-to-server authentication

**Flow:**
```
Your Server → OAuth Provider → Access
```

**When to use:**
- ✅ API-to-API communication
- ✅ Background jobs
- ✅ No user involved
- ✅ Machine-to-machine

**Example:**
```javascript
// Your backend authenticating with Google API:
POST https://oauth2.googleapis.com/token
{
    "grant_type": "client_credentials",
    "client_id": "your-service-account-id",
    "client_secret": "your-service-secret"
}

// Response:
{
    "access_token": "...",
    "expires_in": 3600,
    "token_type": "Bearer"
}

// Now use this to access APIs:
GET https://www.googleapis.com/admin/directory/v1/users
Authorization: Bearer [access_token]
```

**Use cases:**
- Sending emails via SendGrid
- Uploading to cloud storage
- Accessing admin APIs
- Scheduled tasks

---

## 📚 OAuth Terminology (Every Term Explained)

Let me explain **every OAuth term** you'll encounter:

### 🎭 The Players (Roles)

**1. Resource Owner (YOU - The User)**
```
The person who owns the data
Example: You own your Google account, photos, emails
```

**2. Client (Your Application)**
```
The app requesting access
Example: PhotoPro website wanting your Google profile
```

**3. Authorization Server (OAuth Provider)**
```
Handles login & issues tokens
Example: Google's OAuth servers
```

**4. Resource Server (API Server)**
```
Stores the protected data
Example: Google's API servers with your profile data
```

---

### Visual Representation:

```
┌─────────────────────────────────────────────────────┐
│                   RESOURCE OWNER                     │
│                   (You - John Doe)                   │
│                                                      │
│  Owns: Google Account, Photos, Emails              │
└───────────────────┬──────────────────────────────────┘
                    │
          "I authorize PhotoPro to
           access my Google profile"
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│                      CLIENT                          │
│                   (PhotoPro App)                     │
│                                                      │
│  Wants: Your name, email, profile picture          │
└───────────────────┬──────────────────────────────────┘
                    │
          "Can I access John's profile?"
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│              AUTHORIZATION SERVER                    │
│              (accounts.google.com)                   │
│                                                      │
│  • Handles login                                    │
│  • Shows consent screen                             │
│  • Issues tokens                                    │
└───────────────────┬──────────────────────────────────┘
                    │
          "Here's an access token for
           John's profile data"
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│               RESOURCE SERVER                        │
│            (googleapis.com/userinfo)                 │
│                                                      │
│  Stores: John's actual profile data                 │
│  Returns: Name, email, picture                      │
└─────────────────────────────────────────────────────┘
```

---

### 🔑 The Tokens

**1. Authorization Code**
```javascript
// Temporary code (10 minutes)
code: "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7"

// Used once to exchange for tokens
// Then immediately discarded
```

**2. Access Token**
```javascript
// Short-lived token (1 hour typical)
access_token: "ya29.a0AfH6SMBxyz..."

// Used to access protected resources
// Sent with every API request
// Expires quickly for security
```

**3. Refresh Token**
```javascript
// Long-lived token (weeks/months)
refresh_token: "1//0gOy4xKxyz..."

// Used to get NEW access tokens
// Doesn't expire (until revoked)
// Stored securely in database
```

**4. ID Token** (OpenID Connect only)
```javascript
// JWT containing user info
id_token: "eyJhbGciOiJSUzI1NiIsImtpZCI..."

// Contains: name, email, picture
// Signed by OAuth provider
// Can be decoded without API call
```

---

### Token Lifecycle:

```
AUTHORIZATION CODE (10 minutes)
    ↓
Exchange for tokens
    ↓
┌─────────────────────────────────┐
│  ACCESS TOKEN (1 hour)          │
│  Used for API calls             │
└────────────┬────────────────────┘
             │
        Expires after 1 hour
             │
             ↓
┌─────────────────────────────────┐
│  REFRESH TOKEN (30 days)        │
│  Get new access token           │
└────────────┬────────────────────┘
             │
        Use to get new access token
             │
             ↓
┌─────────────────────────────────┐
│  NEW ACCESS TOKEN (1 hour)      │
│  Continue using API             │
└─────────────────────────────────┘

Repeat until:
- User revokes access
- Refresh token expires
- User logs out
```

---

### 🎫 Other Important Terms

**1. Client ID**
```javascript
// Public identifier for your app
client_id: "123456789-abc.apps.googleusercontent.com"

// Safe to expose in frontend
// Identifies YOUR app to Google
```

**2. Client Secret**
```javascript
// Private password for your app
client_secret: "GOCSPX-abc123xyz..."

// ⚠️ NEVER expose in frontend!
// Only use in backend
// Like a password for your app
```

**3. Redirect URI (Callback URL)**
```javascript
// Where OAuth provider sends user after login
redirect_uri: "https://yourapp.com/auth/google/callback"

// Must be pre-registered with OAuth provider
// Security: Prevents token theft
```

**4. Scope**
```javascript
// Permissions your app requests
scope: "profile email https://www.googleapis.com/auth/drive.readonly"

// Specific permissions:
// - "profile" = basic profile info
// - "email" = email address
// - "drive.readonly" = read Google Drive files
```

**5. State**
```javascript
// Random string for CSRF protection
state: "random-string-abc123xyz"

// Your app generates this
// OAuth provider returns it unchanged
// You verify it matches
// Prevents cross-site request forgery
```

**6. Grant Type**
```javascript
// Which OAuth flow you're using
grant_type: "authorization_code"

// Options:
// - "authorization_code" (most common)
// - "refresh_token" (getting new access token)
// - "client_credentials" (server-to-server)
// - "password" (deprecated, don't use)
```

---

## 🔒 Security Deep Dive

Let me explain the security features built into OAuth:

### 1️⃣ State Parameter (CSRF Protection)

**The Attack Without State:**
```
1. Attacker creates malicious link:
   https://photopro.com/auth/google/callback?code=ATTACKER_CODE

2. Tricks you into clicking it

3. PhotoPro exchanges code for tokens

4. Now PhotoPro links YOUR account to ATTACKER's Google account!

5. Attacker can access your PhotoPro account 😱
```

**Protection With State:**
```javascript
// Step 1: Your app generates random state
const state = crypto.randomBytes(32).toString('hex')
// "a1b2c3d4e5f6..."

// Step 2: Store in session
req.session.oauthState = state

// Step 3: Send to OAuth provider
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
    client_id=...
    &redirect_uri=...
    &state=${state}`  // ← Include state

// Step 4: OAuth provider returns it unchanged
// Callback: /auth/google/callback?code=...&state=a1b2c3d4e5f6...

// Step 5: Verify it matches
if (req.query.state !== req.session.oauthState) {
    throw new Error('Invalid state - possible CSRF attack!')
}

// ✅ Safe! State matches, proceed with OAuth flow
```

---

### 2️⃣ Redirect URI Validation

**The Attack Without Validation:**
```
Attacker registers app with redirect:
redirect_uri: https://evil.com/steal-tokens

Tricks user to authorize

Google sends code to https://evil.com
Attacker steals code and tokens! 😱
```

**Protection:**
```
Google Console → OAuth Settings:
Authorized redirect URIs:
✅ https://yourapp.com/auth/google/callback
✅ https://yourapp.com/auth/github/callback
❌ Any other URI is REJECTED

// If attacker tries different URI:
Error: redirect_uri_mismatch
```

---

### 3️⃣ PKCE (Proof Key for Code Exchange)

**For mobile/SPA apps (no client secret)**

**Without PKCE:**
```
Mobile app can't store client_secret securely
Anyone can decompile app and extract it
Attacker can impersonate your app 😱
```

**With PKCE:**
```javascript
// Step 1: App generates random string
const codeVerifier = crypto.randomBytes(32).toString('base64url')
// "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

// Step 2: Hash it (SHA-256)
const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
// "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

// Step 3: Send challenge in authorization request
https://accounts.google.com/o/oauth2/v2/auth?
    ...
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256

// Step 4: When exchanging code, send verifier
POST /token
{
    "code": "...",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}

// Step 5: Google verifies:
hash(code_verifier) === code_challenge
// If match → issue tokens
// If not → reject (attacker doesn't have verifier!)
```

---

### 4️⃣ Token Storage Security

**❌ Bad (Insecure):**
```javascript
// Storing in localStorage (XSS vulnerable!)
localStorage.setItem('access_token', token)

// Storing in cookies without httpOnly
document.cookie = `token=${token}`

// Storing in plain text in database
user.accessToken = token  // Readable if DB compromised!
```

**✅ Good (Secure):**
```javascript
// Backend only (never in frontend)
// Encrypted in database
const encryptedToken = encrypt(token, process.env.ENCRYPTION_KEY)
user.accessToken = encryptedToken

// Or in httpOnly, secure cookies
res.cookie('access_token', token, {
    httpOnly: true,   // JS can't access
    secure: true,     // HTTPS only
    sameSite: 'strict'  // CSRF protection
})
```

---
# 📚 PART 2: OAuth Architecture & Database Design

Let me show you **exactly** how to structure your project for OAuth!

---

## 📋 Part 2 Contents
1. Database Schema Design (Complete)
2. Project Structure (Every File)
3. Dependencies Installation (What & Why)
4. Environment Variables (All Options)
5. Database Models (Detailed)
6. Utility Functions (Reusable Code)

---

# 1️⃣ DATABASE SCHEMA DESIGN

## 🎯 Design Considerations

Before we write code, let's understand **what data we need to store** and **why**.

### Questions We Need to Answer:

**Q1: How do we identify a user?**
```
Traditional login: email + password
OAuth login: provider + providerId
Problem: Same email, different providers?
```

**Q2: Can users link multiple OAuth accounts?**
```
Example:
- User registers with Google (john@gmail.com)
- Later wants to also login with GitHub
- Should it be the SAME account or DIFFERENT?
```

**Q3: What if user has both traditional AND OAuth login?**
```
User signs up with email/password
Later clicks "Login with Google" using SAME email
Should we:
a) Create duplicate account? ❌
b) Link to existing account? ✅
c) Ask user to choose? 🤔
```

**Q4: What OAuth data do we need to store?**
```
For each provider:
- Provider name (google, github, etc.)
- Provider's user ID
- Access token (for API calls)
- Refresh token (to renew access)
- Token expiry time
- Profile data (name, email, picture)
```

---

## 🏗️ Schema Design Options

Let me show you **3 different approaches** and when to use each!

---

### ❌ Approach 1: Simple (Not Recommended for Multiple Providers)

**Single User Model with provider fields:**

```javascript
const userSchema = new Schema({
    email: String,
    password: String,  // Null for OAuth users
    
    // OAuth fields
    googleId: String,
    githubId: String,
    facebookId: String,
    microsoftId: String,
    
    googleAccessToken: String,
    githubAccessToken: String,
    // ... more tokens
    
    provider: String  // 'local', 'google', 'github'
})
```

**Problems:**
- ❌ Schema gets messy with many providers
- ❌ Can't support user with MULTIPLE Google accounts
- ❌ Hard to add new providers later
- ❌ Duplicate data for users with multiple providers

**When to use:**
- ✅ Only supporting 1-2 OAuth providers
- ✅ Users never link multiple accounts
- ✅ Simple apps only

---

### ✅ Approach 2: Separate OAuth Model (Recommended!)

**Two models: User + OAuthAccount**

```javascript
// User model (core identity)
const userSchema = new Schema({
    email: String,
    password: String,  // Optional (null for OAuth-only users)
    fullName: String,
    avatar: String,
    // ... other user fields
})

// OAuthAccount model (provider connections)
const oauthAccountSchema = new Schema({
    userId: { type: ObjectId, ref: 'User' },  // Link to User
    
    provider: String,        // 'google', 'github', 'facebook'
    providerId: String,      // User's ID on that provider
    
    accessToken: String,     // Encrypted!
    refreshToken: String,    // Encrypted!
    tokenExpiry: Date,
    
    profileData: {           // Store provider-specific data
        email: String,
        name: String,
        picture: String
    }
})
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Easy to add new providers
- ✅ User can link multiple accounts
- ✅ Flexible and scalable
- ✅ Can have local + OAuth together

**When to use:**
- ✅ Supporting multiple OAuth providers
- ✅ Users can link multiple accounts
- ✅ Production applications
- ✅ **This is what we'll implement!**

---

### 🏢 Approach 3: Enterprise (For Complex Systems)

**Three models: User + Identity + OAuthToken**

```javascript
// User (core profile)
const userSchema = new Schema({
    email: String,
    fullName: String,
    avatar: String,
    // No auth-related fields here!
})

// Identity (authentication methods)
const identitySchema = new Schema({
    userId: ObjectId,
    type: String,  // 'local', 'oauth', 'saml', 'ldap'
    provider: String,  // 'google', 'github', 'azure-ad'
    providerId: String,
    password: String,  // Only for type='local'
})

// OAuthToken (separate token storage)
const oauthTokenSchema = new Schema({
    identityId: ObjectId,
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    scopes: [String]
})
```

**When to use:**
- ✅ Enterprise applications
- ✅ Multiple authentication methods (OAuth, SAML, LDAP)
- ✅ Complex permission systems
- ✅ Audit logging requirements
- ⚠️ Overkill for most apps

---

## 📝 Our Complete Schema (Approach 2)

Let me show you the **complete schema** with **every field explained**!

### User Model (`src/models/user.models.js`)

```javascript
import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"

const userSchema = new Schema(
    {
        // ========================================
        // BASIC USER INFORMATION
        // ========================================
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters']
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            validate: {
                validator: function(v) {
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v)
                },
                message: 'Please enter a valid email'
            }
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, 'Full name must be at least 2 characters']
        },
        avatar: {
            type: String,
            default: 'https://via.placeholder.com/150'  // Default avatar
        },
        coverImage: {
            type: String
        },
        
        // ========================================
        // TRADITIONAL LOGIN (Optional for OAuth users)
        // ========================================
        password: {
            type: String,
            // Not required! OAuth users might not have password
            validate: {
                validator: function(v) {
                    // If password is set, must be at least 8 characters
                    if (v && v.length > 0) {
                        return v.length >= 8
                    }
                    return true
                },
                message: 'Password must be at least 8 characters'
            }
        },
        
        // ========================================
        // EMAIL VERIFICATION
        // ========================================
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String
        },
        emailVerificationExpires: {
            type: Date
        },
        
        // ========================================
        // PASSWORD RESET
        // ========================================
        passwordResetToken: {
            type: String
        },
        passwordResetExpires: {
            type: Date
        },
        
        // ========================================
        // AUTHENTICATION
        // ========================================
        refreshToken: {
            type: String
        },
        
        // ========================================
        // OAUTH FLAGS
        // ========================================
        hasPassword: {
            type: Boolean,
            default: false
            // True = user can login with password
            // False = OAuth-only user
        },
        
        // ========================================
        // USER DATA
        // ========================================
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        
        // ========================================
        // ACCOUNT STATUS
        // ========================================
        isActive: {
            type: Boolean,
            default: true
        },
        accountLockedUntil: {
            type: Date
        },
        loginAttempts: {
            type: Number,
            default: 0
        },
        
        // ========================================
        // METADATA
        // ========================================
        lastLogin: {
            type: Date
        },
        lastLoginIP: {
            type: String
        }
    },
    {
        timestamps: true  // Adds createdAt and updatedAt
    }
)

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================
userSchema.index({ email: 1, username: 1 })
userSchema.index({ isEmailVerified: 1 })

// ========================================
// PRE-SAVE HOOKS
// ========================================

/**
 * Hash password before saving (only if modified)
 */
userSchema.pre("save", async function (next) {
    // Only hash if password is set and modified
    if(!this.isModified("password") || !this.password) return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    this.hasPassword = true  // Mark that user has password
    next()
})

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Compare password for login
 */
userSchema.methods.isPasswordCorrect = async function(password){
    if (!this.password) {
        throw new Error('User has no password set (OAuth-only account)')
    }
    return await bcrypt.compare(password, this.password)
}

/**
 * Generate access token
 */
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

/**
 * Generate refresh token
 */
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

/**
 * Generate email verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex')
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex')
    
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000  // 24 hours
    
    return verificationToken
}

/**
 * Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000  // 1 hour
    
    return resetToken
}

/**
 * Check if user can login with password
 */
userSchema.methods.canLoginWithPassword = function() {
    return this.hasPassword && this.password
}

/**
 * Update last login info
 */
userSchema.methods.updateLastLogin = function(ip) {
    this.lastLogin = new Date()
    this.lastLoginIP = ip
    this.loginAttempts = 0  // Reset failed attempts
    return this.save({ validateBeforeSave: false })
}

export const User = mongoose.model("User", userSchema)
```

---

### OAuth Account Model (`src/models/oauthAccount.models.js`)

```javascript
import mongoose, { Schema } from "mongoose"
import crypto from "crypto"

const oauthAccountSchema = new Schema(
    {
        // ========================================
        // USER REFERENCE
        // ========================================
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        
        // ========================================
        // PROVIDER INFORMATION
        // ========================================
        provider: {
            type: String,
            required: true,
            enum: ['google', 'github', 'facebook', 'microsoft', 'linkedin', 'twitter'],
            lowercase: true
        },
        providerId: {
            type: String,
            required: true
            // User's ID on the provider (e.g., Google user ID)
        },
        
        // ========================================
        // TOKENS (Encrypted!)
        // ========================================
        accessToken: {
            type: String,
            required: true
            // ⚠️ MUST be encrypted before storing!
        },
        refreshToken: {
            type: String
            // Some providers don't give refresh tokens
            // ⚠️ MUST be encrypted before storing!
        },
        tokenExpiry: {
            type: Date
            // When access token expires
        },
        
        // ========================================
        // SCOPES (Permissions granted)
        // ========================================
        scopes: [{
            type: String
        }],
        // Example: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly']
        
        // ========================================
        // PROFILE DATA (From provider)
        // ========================================
        profile: {
            email: {
                type: String,
                lowercase: true
            },
            name: String,
            firstName: String,
            lastName: String,
            displayName: String,
            picture: String,
            username: String,  // Provider's username (if available)
            
            // Provider-specific fields
            bio: String,
            location: String,
            website: String,
            
            // Raw profile data (for debugging/future use)
            raw: Schema.Types.Mixed
        },
        
        // ========================================
        // ACCOUNT STATUS
        // ========================================
        isActive: {
            type: Boolean,
            default: true
        },
        isPrimary: {
            type: Boolean,
            default: false
            // If user has multiple OAuth accounts, one can be primary
        },
        
        // ========================================
        // METADATA
        // ========================================
        lastUsed: {
            type: Date,
            default: Date.now
        },
        timesUsed: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
)

// ========================================
// INDEXES
// ========================================
// Compound index: One provider account per user
oauthAccountSchema.index({ userId: 1, provider: 1 }, { unique: false })

// Compound index: Provider ID must be unique per provider
oauthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true })

// Index for quick provider lookups
oauthAccountSchema.index({ provider: 1 })

// ========================================
// PRE-SAVE HOOKS
// ========================================

/**
 * Encrypt tokens before saving
 */
oauthAccountSchema.pre('save', function(next) {
    // Only encrypt if tokens are modified
    if (this.isModified('accessToken') && this.accessToken) {
        this.accessToken = encryptToken(this.accessToken)
    }
    
    if (this.isModified('refreshToken') && this.refreshToken) {
        this.refreshToken = encryptToken(this.refreshToken)
    }
    
    next()
})

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Get decrypted access token
 */
oauthAccountSchema.methods.getAccessToken = function() {
    return decryptToken(this.accessToken)
}

/**
 * Get decrypted refresh token
 */
oauthAccountSchema.methods.getRefreshToken = function() {
    if (!this.refreshToken) return null
    return decryptToken(this.refreshToken)
}

/**
 * Check if access token is expired
 */
oauthAccountSchema.methods.isTokenExpired = function() {
    if (!this.tokenExpiry) return false
    return Date.now() > this.tokenExpiry.getTime()
}

/**
 * Update tokens (automatically encrypts)
 */
oauthAccountSchema.methods.updateTokens = async function(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken  // Will be encrypted by pre-save hook
    
    if (refreshToken) {
        this.refreshToken = refreshToken  // Will be encrypted by pre-save hook
    }
    
    if (expiresIn) {
        // expiresIn is in seconds
        this.tokenExpiry = new Date(Date.now() + expiresIn * 1000)
    }
    
    this.lastUsed = new Date()
    this.timesUsed += 1
    
    await this.save()
}

/**
 * Mark as used (update lastUsed)
 */
oauthAccountSchema.methods.markAsUsed = async function() {
    this.lastUsed = new Date()
    this.timesUsed += 1
    await this.save()
}

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find OAuth account by provider and provider ID
 */
oauthAccountSchema.statics.findByProvider = async function(provider, providerId) {
    return await this.findOne({ provider, providerId }).populate('userId')
}

/**
 * Find all OAuth accounts for a user
 */
oauthAccountSchema.statics.findByUserId = async function(userId) {
    return await this.find({ userId, isActive: true })
}

/**
 * Check if user has linked a provider
 */
oauthAccountSchema.statics.hasProvider = async function(userId, provider) {
    const account = await this.findOne({ userId, provider, isActive: true })
    return !!account
}

// ========================================
// ENCRYPTION UTILITIES (defined at module level)
// ========================================

/**
 * Encrypt token using AES-256-GCM
 */
function encryptToken(token) {
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')  // 32 bytes
    const iv = crypto.randomBytes(16)  // Initialization vector
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt token
 */
function decryptToken(encryptedToken) {
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    
    const parts = encryptedToken.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
}

export const OAuthAccount = mongoose.model("OAuthAccount", oauthAccountSchema)
```

---

## 🎨 Database Relationships Visualization

```
┌─────────────────────────────────────────┐
│              USER                        │
│  _id: ObjectId("user123")               │
│  email: "john@example.com"              │
│  username: "johndoe"                    │
│  password: "hashed..." (optional)       │
│  hasPassword: true                      │
└───────────────────┬─────────────────────┘
                    │
                    │ userId (reference)
                    │
        ┌───────────┴──────────────┬──────────────┬─────────────┐
        │                          │              │             │
        ↓                          ↓              ↓             ↓
┌────────────────┐      ┌────────────────┐  ┌──────────────┐ ┌──────────────┐
│ OAUTH ACCOUNT  │      │ OAUTH ACCOUNT  │  │OAUTH ACCOUNT │ │OAUTH ACCOUNT │
│ provider:google│      │provider:github │  │provider:fb   │ │provider:ms   │
│ providerId:123 │      │providerId:456  │  │providerId:789│ │providerId:012│
│ accessToken:...│      │accessToken:... │  │accessToken:..│ │accessToken:..│
│ refreshToken:..│      │refreshToken:...│  │refreshToken:.│ │refreshToken:.│
└────────────────┘      └────────────────┘  └──────────────┘ └──────────────┘

One user can have:
- Password login (traditional) ✅
- Multiple OAuth accounts linked ✅
- Or OAuth-only (no password) ✅
```

---

## 📊 Example Data in Database

### User Document:
```javascript
{
    _id: ObjectId("65a8f1234567890abcdef"),
    username: "johndoe",
    email: "john@example.com",
    fullName: "John Doe",
    avatar: "https://lh3.googleusercontent.com/a/...",
    password: null,  // ← No password! OAuth-only user
    hasPassword: false,
    isEmailVerified: true,  // Auto-verified from Google
    isActive: true,
    lastLogin: "2024-01-20T10:30:00.000Z",
    lastLoginIP: "192.168.1.1",
    createdAt: "2024-01-15T08:00:00.000Z",
    updatedAt: "2024-01-20T10:30:00.000Z"
}
```

### OAuth Account Documents:
```javascript
// Google OAuth account
{
    _id: ObjectId("oauth1"),
    userId: ObjectId("65a8f1234567890abcdef"),
    provider: "google",
    providerId: "108123456789",
    accessToken: "a1b2c3d4:e5f6g7h8:encrypted...",  // Encrypted!
    refreshToken: "x1y2z3a4:b5c6d7e8:encrypted...",  // Encrypted!
    tokenExpiry: "2024-01-20T11:30:00.000Z",
    scopes: ["profile", "email"],
    profile: {
        email: "john@gmail.com",
        name: "John Doe",
        picture: "https://lh3.googleusercontent.com/a/..."
    },
    isPrimary: true,
    lastUsed: "2024-01-20T10:30:00.000Z",
    timesUsed: 15,
    createdAt: "2024-01-15T08:00:00.000Z"
}

// GitHub OAuth account (linked later)
{
    _id: ObjectId("oauth2"),
    userId: ObjectId("65a8f1234567890abcdef"),  // Same user!
    provider: "github",
    providerId: "12345678",
    accessToken: "p9q8r7s6:t5u4v3w2:encrypted...",
    refreshToken: null,  // GitHub doesn't give refresh tokens
    tokenExpiry: null,  // GitHub tokens don't expire
    scopes: ["read:user", "user:email"],
    profile: {
        email: "john@users.noreply.github.com",
        name: "John Doe",
        username: "johndoe",
        picture: "https://avatars.githubusercontent.com/u/12345678"
    },
    isPrimary: false,
    lastUsed: "2024-01-18T14:20:00.000Z",
    timesUsed: 3,
    createdAt: "2024-01-18T14:15:00.000Z"
}
```

---

# 2️⃣ PROJECT STRUCTURE

## 🏗️ Complete Folder Structure

Here's **exactly** how to organize your files:

```
project-root/
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   ├── passport.js              # Passport configuration
│   │   └── oauth-strategies/        # OAuth strategies
│   │       ├── google.strategy.js
│   │       ├── github.strategy.js
│   │       ├── facebook.strategy.js
│   │       └── microsoft.strategy.js
│   │
│   ├── models/
│   │   ├── user.models.js           # User schema
│   │   ├── oauthAccount.models.js   # OAuth account schema
│   │   └── video.models.js          # Other models
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├── local.auth.controller.js      # Traditional login
│   │   │   ├── oauth.auth.controller.js      # OAuth handlers
│   │   │   └── account.controller.js         # Account management
│   │   └── user.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # Authentication routes
│   │   └── user.routes.js           # User routes
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── passport.middleware.js   # Passport session
│   │   └── multer.middleware.js
│   │
│   ├── services/
│   │   ├── oauth.service.js         # OAuth utilities
│   │   ├── token.service.js         # Token management
│   │   └── email.service.js
│   │
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── encryption.js            # Token encryption utilities
│   │
│   ├── app.js                       # Express app setup
│   └── index.js                     # Server entry point
│
├── .env                             # Environment variables
├── .env.example                     # Template
├── package.json
└── README.md
```

---

## 📝 Why This Structure?

**config/** - Configuration files
```
Keeps all configuration in one place
Easy to manage different OAuth providers
Separated from business logic
```

**models/** - Database schemas
```
One file per collection
Clear data structure
Easy to maintain
```

**controllers/auth/** - Auth-specific controllers
```
Separated from user controllers
Different concerns:
- local.auth: email/password login
- oauth.auth: OAuth callbacks
- account: linking/unlinking providers
```

**services/** - Reusable business logic
```
Don't repeat yourself!
Used by multiple controllers
Pure functions, easy to test
```

**utils/** - Helper functions
```
Generic utilities
Used across the app
No business logic here
```

---

# 3️⃣ DEPENDENCIES INSTALLATION

## 📦 Required Packages

Let me explain **every package** and **why you need it**:

```bash
npm install passport passport-google-oauth20 passport-github2 passport-facebook passport-microsoft express-session
```

---

### Core Packages:

**1. passport** (v0.7.0)
```javascript
// What: Authentication middleware
// Why: Industry standard for OAuth
// Used for: Managing authentication strategies
```

**Why Passport?**
- ✅ Supports 500+ authentication strategies
- ✅ Flexible and modular
- ✅ Well-maintained
- ✅ Large community
- ✅ Easy to add/remove providers

---

**2. passport-google-oauth20** (v2.0.0)
```javascript
// What: Google OAuth 2.0 strategy
// Why: Login with Google
// Provides: Google authentication
```

**What it does:**
```
Handles Google OAuth flow:
1. Redirects user to Google
2. Receives callback from Google
3. Validates tokens
4. Returns user profile
```

---

**3. passport-github2** (v0.1.12)
```javascript
// What: GitHub OAuth 2.0 strategy
// Why: Login with GitHub
// Provides: GitHub authentication
```

**Note:** Use `passport-github2`, not `passport-github` (older version)

---

**4. passport-facebook** (v3.0.0)
```javascript
// What: Facebook OAuth 2.0 strategy
// Why: Login with Facebook
// Provides: Facebook authentication
```

---

**5. passport-microsoft** (v1.0.0)
```javascript
// What: Microsoft/Azure AD OAuth strategy
// Why: Login with Microsoft account
// Provides: Microsoft authentication
```

**Useful for:**
- Corporate accounts (@company.com)
- Office 365 integration
- Azure AD SSO

---

**6. express-session** (v1.18.0)
```javascript
// What: Session management
// Why: Store OAuth state during flow
// Used for: Temporary data during authentication
```

**What it stores:**
```
During OAuth flow:
- State parameter (CSRF protection)
- Return URL (where to redirect after login)
- Temporary data

After login:
- User ID
- Session token
```

---

### Complete Installation:

```bash
# Core dependencies (if not already installed)
npm install express mongoose dotenv cors cookie-parser

# OAuth dependencies
npm install passport passport-google-oauth20 passport-github2 passport-facebook passport-microsoft

# Session management
npm install express-session connect-mongo

# Utilities
npm install bcrypt jsonwebtoken

# Development
npm install --save-dev nodemon
```

---

## 📄 package.json

Your complete `package.json`:

```json
{
  "name": "oauth-authentication-app",
  "version": "1.0.0",
  "description": "Full-featured OAuth authentication system",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["oauth", "authentication", "passport", "google", "github"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-github2": "^0.1.12",
    "passport-facebook": "^3.0.0",
    "passport-microsoft": "^1.0.0",
    
    "express-session": "^1.18.0",
    "connect-mongo": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

# 4️⃣ ENVIRONMENT VARIABLES

## 🔑 Complete .env File

Here's **every environment variable** you'll need:

```env
# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=development
PORT=8000
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# ========================================
# DATABASE
# ========================================
MONGODB_URI=mongodb://localhost:27017/oauth-app
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oauth-app

# ========================================
# JWT SECRETS
# ========================================
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-min-32-characters
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-characters
REFRESH_TOKEN_EXPIRY=10d

# ========================================
# SESSION SECRET
# ========================================
SESSION_SECRET=your-session-secret-key-min-32-characters

# ========================================
# ENCRYPTION KEY (for OAuth tokens)
# ========================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-string-for-aes-256-encryption-key

# ========================================
# GOOGLE OAUTH
# ========================================
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# ========================================
# GITHUB OAUTH
# ========================================
GITHUB_CLIENT_ID=Iv1.abcdef1234567890
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback

# ========================================
# FACEBOOK OAUTH
# ========================================
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_CALLBACK_URL=http://localhost:8000/api/v1/auth/facebook/callback

# ========================================
# MICROSOFT OAUTH
# ========================================
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
MICROSOFT_CALLBACK_URL=http://localhost:8000/api/v1/auth/microsoft/callback
MICROSOFT_TENANT_ID=common
# Use 'common' for personal Microsoft accounts
# Use your tenant ID for Azure AD only

# ========================================
# EMAIL CONFIGURATION (Optional)
# ========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

---

## 📝 .env.example Template

Create `.env.example` (commit to Git):

```env
# Copy this file to .env and fill in your values
# DO NOT commit .env to Git!

# Server
NODE_ENV=development
PORT=8000
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/oauth-app

# JWT (Generate random strings)
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=10d

# Session
SESSION_SECRET=

# Encryption (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=

# Google OAuth (Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# GitHub OAuth (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback

# Facebook OAuth (Get from https://developers.facebook.com)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:8000/api/v1/auth/facebook/callback

# Microsoft OAuth (Get from https://portal.azure.com)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=http://localhost:8000/api/v1/auth/microsoft/callback
MICROSOFT_TENANT_ID=common
```

---

## 🔐 Generating Secrets

**For JWT secrets and session secret:**
```bash
# In terminal (Node.js):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6==
```

**For encryption key (must be 32 bytes for AES-256):**
```bash
# In terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example (64 hex characters):
# a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

---

## ⚠️ Security Notes

**1. Never commit .env to Git:**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

**2. Use different secrets for each environment:**
```
Development:  secret-dev-12345
Staging:      secret-staging-67890
Production:   secret-prod-abcdef
```

**3. Rotate secrets regularly:**
```
Every 90 days: Change all secrets
After breach: Immediately rotate
```

**4. Use environment-specific callback URLs:**
```
Development:  http://localhost:8000/auth/google/callback
Staging:      https://staging.yourapp.com/auth/google/callback
Production:   https://yourapp.com/auth/google/callback
```

---

# 5️⃣ UTILITY FUNCTIONS

## 🛠️ Encryption Utilities

Create `src/utils/encryption.js`:

```javascript
import crypto from 'crypto'

/**
 * Encrypt sensitive data (tokens, secrets)
 * Uses AES-256-GCM (most secure)
 */
export const encrypt = (text) => {
    if (!text) return null
    
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get authentication tag (for integrity)
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedText) => {
    if (!encryptedText) return null
    
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    
    // Split encrypted string
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    // Create decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
}

/**
 * Generate secure random string
 */
export const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate state parameter for OAuth (CSRF protection)
 */
export const generateOAuthState = () => {
    return crypto.randomBytes(32).toString('base64url')
}

/**
 * Hash data (one-way, for comparison)
 */
export const hash = (data) => {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
}

/**
 * Verify hashed data
 */
export const verifyHash = (data, hashedData) => {
    const dataHash = hash(data)
    return dataHash === hashedData
}
```

---

## 📝 OAuth Service Utilities

Create `src/services/oauth.service.js`:

```javascript
import { User } from '../models/user.models.js'
import { OAuthAccount } from '../models/oauthAccount.models.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Find or create user from OAuth profile
 */
export const findOrCreateOAuthUser = async (provider, profile) => {
    try {
        // Step 1: Check if OAuth account exists
        const existingOAuthAccount = await OAuthAccount.findByProvider(
            provider,
            profile.id
        )
        
        if (existingOAuthAccount) {
            // Found existing OAuth account
            return await User.findById(existingOAuthAccount.userId)
        }
        
        // Step 2: Check if user exists with same email
        let user = null
        if (profile.emails && profile.emails.length > 0) {
            const email = profile.emails[0].value
            user = await User.findOne({ email })
        }
        
        // Step 3: Create new user if doesn't exist
        if (!user) {
            user = await User.create({
                email: profile.emails?.[0]?.value || `${profile.id}@${provider}.oauth`,
                username: generateUsername(profile),
                fullName: profile.displayName || profile.name?.givenName || 'User',
                avatar: profile.photos?.[0]?.value || '',
                isEmailVerified: true,  // Trust OAuth provider
                hasPassword: false  // OAuth-only user
            })
        }
        
        // Step 4: Create OAuth account link
        await OAuthAccount.create({
            userId: user._id,
            provider: provider,
            providerId: profile.id,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
            tokenExpiry: profile.tokenExpiry,
            scopes: profile.scopes || [],
            profile: {
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                picture: profile.photos?.[0]?.value,
                raw: profile._json
            },
            isPrimary: true
        })
        
        return user
    } catch (error) {
        console.error('Error in findOrCreateOAuthUser:', error)
        throw new ApiError(500, 'Failed to process OAuth login')
    }
}

/**
 * Link OAuth account to existing user
 */
export const linkOAuthAccount = async (userId, provider, profile) => {
    try {
        // Check if already linked
        const existing = await OAuthAccount.findOne({
            userId,
            provider
        })
        
        if (existing) {
            throw new ApiError(409, `${provider} account already linked`)
        }
        
        // Check if this OAuth account is used by another user
        const usedByOther = await OAuthAccount.findOne({
            provider,
            providerId: profile.id
        })
        
        if (usedByOther && usedByOther.userId.toString() !== userId.toString()) {
            throw new ApiError(409, `This ${provider} account is already linked to another user`)
        }
        
        // Create link
        const oauthAccount = await OAuthAccount.create({
            userId,
            provider,
            providerId: profile.id,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
            tokenExpiry: profile.tokenExpiry,
            scopes: profile.scopes || [],
            profile: {
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                picture: profile.photos?.[0]?.value,
                raw: profile._json
            }
        })
        
        return oauthAccount
    } catch (error) {
        if (error instanceof ApiError) throw error
        console.error('Error in linkOAuthAccount:', error)
        throw new ApiError(500, 'Failed to link OAuth account')
    }
}

/**
 * Unlink OAuth account
 */
export const unlinkOAuthAccount = async (userId, provider) => {
    try {
        const oauthAccount = await OAuthAccount.findOne({
            userId,
            provider
        })
        
        if (!oauthAccount) {
            throw new ApiError(404, `${provider} account not linked`)
        }
        
        // Check if user has password or other OAuth accounts
        const user = await User.findById(userId)
        const otherAccounts = await OAuthAccount.countDocuments({
            userId,
            provider: { $ne: provider }
        })
        
        if (!user.hasPassword && otherAccounts === 0) {
            throw new ApiError(400, 'Cannot unlink last authentication method. Set a password first.')
        }
        
        // Delete OAuth account
        await OAuthAccount.deleteOne({ _id: oauthAccount._id })
        
        return true
    } catch (error) {
        if (error instanceof ApiError) throw error
        console.error('Error in unlinkOAuthAccount:', error)
        throw new ApiError(500, 'Failed to unlink OAuth account')
    }
}

/**
 * Generate unique username from profile
 */
function generateUsername(profile) {
    let username = ''
    
    // Try different sources
    if (profile.username) {
        username = profile.username
    } else if (profile.displayName) {
        username = profile.displayName.toLowerCase().replace(/\s+/g, '')
    } else if (profile.emails && profile.emails.length > 0) {
        username = profile.emails[0].value.split('@')[0]
    } else {
        username = `user${Date.now()}`
    }
    
    // Clean username (remove special characters)
    username = username.replace(/[^a-z0-9_]/g, '')
    
    // Add random suffix if too short
    if (username.length < 3) {
        username += Math.random().toString(36).substring(2, 7)
    }
    
    return username
}

/**
 * Get all linked OAuth accounts for user
 */
export const getUserOAuthAccounts = async (userId) => {
    return await OAuthAccount.find({
        userId,
        isActive: true
    }).select('-accessToken -refreshToken')  // Don't expose tokens
}

/**
 * Refresh OAuth token if expired
 */
export const refreshOAuthToken = async (oauthAccountId) => {
    // This will be provider-specific
    // Implementation depends on provider's refresh token flow
    // TODO: Implement per provider
}
```
---
# 📚 PART 3: Google OAuth Implementation (Complete)
---

## 📋 Part 3 Contents
1. Google Cloud Console Setup (Step-by-Step)
2. Passport.js Configuration (Core Setup)
3. Google Strategy Implementation
4. OAuth Controllers (Complete Code)
5. Routes Configuration
6. Frontend Integration (React Examples)
7. Token Management
8. Error Handling
9. Testing in Postman
10. Common Mistakes & Solutions
11. Production Checklist

---

# 1️⃣ GOOGLE CLOUD CONSOLE SETUP

## 🎯 Step-by-Step Guide (Every Click Shown!)

Let me walk you through **exactly** how to set up Google OAuth.

---

### Step 1: Create Google Cloud Project

**1.1 Go to Google Cloud Console**
```
URL: https://console.cloud.google.com
```

**1.2 Create New Project**
```
Click: "Select a project" (top left)
    ↓
Click: "New Project"
    ↓
Fill in:
    Project Name: "YourApp OAuth"
    Organization: (leave as is)
    Location: (leave as is)
    ↓
Click: "Create"
    ↓
Wait 10-30 seconds for project creation
```

**Visual:**
```
┌─────────────────────────────────────┐
│  New Project                        │
├─────────────────────────────────────┤
│  Project name *                     │
│  [YourApp OAuth            ]        │
│                                     │
│  Organization                       │
│  [No organization          ▼]       │
│                                     │
│  Location                           │
│  [No organization          ▼]       │
│                                     │
│              [Cancel]  [CREATE]     │
└─────────────────────────────────────┘
```

---

### Step 2: Enable Google+ API

**2.1 Open APIs & Services**
```
Left sidebar → "APIs & Services" → "Library"
```

**2.2 Search for Google+ API**
```
Search bar: "google+ api"
    ↓
Click: "Google+ API"
    ↓
Click: "ENABLE"
```

**⚠️ Important:** Without enabling this API, OAuth won't work!

---

### Step 3: Configure OAuth Consent Screen

**3.1 Navigate to Consent Screen**
```
Left sidebar → "APIs & Services" → "OAuth consent screen"
```

**3.2 Choose User Type**
```
Options:
    ◉ Internal (Only for Google Workspace users)
    ◉ External (Anyone with Google account) ← Choose this
    
Click: "CREATE"
```

---

**3.3 Fill OAuth Consent Screen (Page 1)**

```
App information:

    App name *
    [YourApp                              ]
    
    User support email *
    [your-email@gmail.com            ▼]
    
    App logo (optional)
    [Choose File]  (Square PNG, <1MB)
    
    
App domain (optional but recommended):

    Application home page
    [https://yourapp.com                  ]
    
    Application privacy policy link
    [https://yourapp.com/privacy          ]
    
    Application terms of service link
    [https://yourapp.com/terms            ]
    

Authorized domains (optional):

    [yourapp.com                          ] [Add domain]
    
    
Developer contact information:

    Email addresses *
    [your-email@gmail.com                 ]
    [dev-team@yourapp.com                 ]
    
    
Click: "SAVE AND CONTINUE"
```

---

**3.4 Scopes (Page 2)**

```
Click: "ADD OR REMOVE SCOPES"

Select these scopes:

    ☑ .../auth/userinfo.email
       See your primary Google Account email address
       
    ☑ .../auth/userinfo.profile  
       See your personal info, including any personal info you've made publicly available
       
    ☑ openid
       Associate you with your personal info on Google
       

Click: "UPDATE"
Click: "SAVE AND CONTINUE"
```

**What each scope means:**

| Scope | What it gives you | Example data |
|-------|-------------------|--------------|
| `userinfo.email` | User's email address | `john@gmail.com` |
| `userinfo.profile` | Name, profile picture | `"John Doe"`, avatar URL |
| `openid` | Unique user ID | `"108123456789"` |

---

**3.5 Test Users (Page 3)**

**For development only:**
```
Click: "ADD USERS"

Enter email addresses:
    [your-email@gmail.com                 ]
    [tester1@gmail.com                    ]
    [tester2@gmail.com                    ]
    
Click: "ADD"
Click: "SAVE AND CONTINUE"
```

**⚠️ Note:** 
- While app is in "Testing" mode, only these users can login
- To allow anyone, you must publish the app (requires verification)

---

**3.6 Summary (Page 4)**
```
Review all settings
    ↓
Click: "BACK TO DASHBOARD"
```

---

### Step 4: Create OAuth Credentials

**4.1 Navigate to Credentials**
```
Left sidebar → "APIs & Services" → "Credentials"
```

**4.2 Create OAuth Client ID**
```
Click: "CREATE CREDENTIALS" (top)
    ↓
Select: "OAuth client ID"
```

---

**4.3 Configure OAuth Client**

```
Application type:
    ◉ Web application  ← Select this
    

Name:
    [YourApp Web Client                   ]
    

Authorized JavaScript origins:

    Click: "ADD URI"
    
    For development:
    [http://localhost:3000                ] [Add]
    [http://localhost:8000                ] [Add]
    
    For production:
    [https://yourapp.com                  ] [Add]
    [https://www.yourapp.com              ] [Add]
    

Authorized redirect URIs:

    Click: "ADD URI"
    
    For development:
    [http://localhost:8000/api/v1/auth/google/callback] [Add]
    
    For production:
    [https://yourapp.com/api/v1/auth/google/callback] [Add]
    

Click: "CREATE"
```

---

**4.4 Save Your Credentials**

You'll see a popup:

```
┌─────────────────────────────────────────┐
│  OAuth client created                   │
├─────────────────────────────────────────┤
│  Your Client ID                         │
│  123456789-abc...googleusercontent.com  │
│  [Copy] 📋                              │
│                                         │
│  Your Client Secret                     │
│  GOCSPX-abcd...xyz                      │
│  [Copy] 📋                              │
│                                         │
│              [OK]                       │
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANT:** Copy both values immediately!

---

**4.5 Add to .env file**

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

---

### Step 5: Verify Setup

**Check these URLs are correct:**

```
Authorized JavaScript origins:
✓ http://localhost:3000        (Frontend URL)
✓ http://localhost:8000        (Backend URL)

Authorized redirect URIs:
✓ http://localhost:8000/api/v1/auth/google/callback
                        ↑
                This MUST match your route exactly!
```

**Common mistakes:**
```
❌ http://localhost:8000/auth/google/callback  (missing /api/v1)
❌ http://localhost:8000/api/v1/auth/google   (missing /callback)
❌ https://localhost:8000/...                  (http vs https)
❌ http://localhost:3000/...                   (wrong port)
```

---

## 📊 Visual Flow of What We Set Up

```
┌─────────────────────────────────────────────────────┐
│           GOOGLE CLOUD PROJECT                       │
│  "YourApp OAuth"                                    │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴──────────────┐
         │                          │
         ↓                          ↓
┌──────────────────┐      ┌──────────────────┐
│  OAuth Consent   │      │  OAuth Client    │
│  Screen          │      │  Credentials     │
├──────────────────┤      ├──────────────────┤
│ • App name       │      │ • Client ID      │
│ • App logo       │      │ • Client Secret  │
│ • Scopes:        │      │ • Redirect URIs  │
│   - email        │      │ • JS origins     │
│   - profile      │      └──────────────────┘
│   - openid       │               │
│ • Test users     │               │
└──────────────────┘               │
                                   │
                    Used by your backend
                           ↓
              ┌────────────────────────┐
              │   YOUR EXPRESS APP     │
              │   (Passport.js)        │
              └────────────────────────┘
```

---

# 2️⃣ PASSPORT.JS CONFIGURATION

## 🎯 Core Passport Setup

Now let's configure Passport in our Express app!

---

## 📝 Session Configuration

Create `src/config/session.js`:

```javascript
import session from 'express-session'
import MongoStore from 'connect-mongo'

/**
 * Session configuration for OAuth flow
 * 
 * Why we need sessions:
 * - Store OAuth state (CSRF protection)
 * - Store temporary data during authentication
 * - Store return URL (where to redirect after login)
 */
export const sessionConfig = session({
    // ========================================
    // SECRET KEY
    // ========================================
    secret: process.env.SESSION_SECRET,
    // Used to sign session ID cookie
    // MUST be secret and random!
    
    // ========================================
    // SESSION STORE (MongoDB)
    // ========================================
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        // Store sessions in MongoDB
        // Why? So sessions persist across server restarts
        
        touchAfter: 24 * 3600,
        // Lazy session update (don't update on every request)
        // Only update once in 24 hours unless session data changed
        
        crypto: {
            secret: process.env.SESSION_SECRET
        }
        // Encrypt session data in database
    }),
    
    // ========================================
    // COOKIE CONFIGURATION
    // ========================================
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
        httpOnly: true,
        // Cannot be accessed by JavaScript (XSS protection)
        
        secure: process.env.NODE_ENV === 'production',
        // Only send over HTTPS in production
        // Set to false in development (http://localhost)
        
        sameSite: 'lax'
        // CSRF protection
        // 'lax' allows cookies on safe HTTP methods
    },
    
    // ========================================
    // SESSION BEHAVIOR
    // ========================================
    resave: false,
    // Don't save session if unmodified
    // Reduces database writes
    
    saveUninitialized: false,
    // Don't create session until something stored
    // Reduces storage
    
    // ========================================
    // SESSION NAME
    // ========================================
    name: 'oauth.sid'
    // Custom session cookie name
    // Default is 'connect.sid'
    // Changing makes it less obvious
})
```

---

## 📝 Passport Initialization

Create `src/config/passport.js`:

```javascript
import passport from 'passport'
import { User } from '../models/user.models.js'

/**
 * Initialize Passport
 * 
 * What Passport does:
 * 1. Manages authentication strategies (Google, GitHub, etc.)
 * 2. Serializes user to session
 * 3. Deserializes user from session
 */

// ========================================
// SERIALIZE USER (Store in session)
// ========================================

/**
 * Called after successful authentication
 * Stores minimal user data in session (just ID)
 * 
 * Why just ID? To keep session size small
 */
passport.serializeUser((user, done) => {
    // Store only user ID in session
    done(null, user._id.toString())
})

// Flow:
// User logs in → serializeUser called → Store user._id in session


// ========================================
// DESERIALIZE USER (Retrieve from session)
// ========================================

/**
 * Called on every request (if user is logged in)
 * Fetches full user data from database using ID from session
 * 
 * Why? Session only has ID, we need full user object
 */
passport.deserializeUser(async (id, done) => {
    try {
        // Fetch full user from database
        const user = await User.findById(id).select('-password -refreshToken')
        
        if (!user) {
            return done(null, false)  // User not found
        }
        
        done(null, user)  // Attach to req.user
    } catch (error) {
        done(error, null)
    }
})

// Flow:
// Request received → deserializeUser called → Fetch user from DB → req.user populated


// ========================================
// EXAMPLE REQUEST FLOW
// ========================================

/*
    REQUEST 1 (Login):
    ------------------
    User logs in with Google
        ↓
    Google OAuth flow completes
        ↓
    serializeUser(user, done)
        ↓
    Store user._id in session
        ↓
    Session cookie sent to browser
    
    
    REQUEST 2 (Later):
    ------------------
    User makes another request
        ↓
    Browser sends session cookie
        ↓
    deserializeUser(id, done)
        ↓
    Fetch user from database using id
        ↓
    req.user = user object
        ↓
    Controller can access req.user
*/

export default passport
```

---

## 🔍 Understanding Serialize vs Deserialize

**Visual Explanation:**

```
SERIALIZE (After login)
-----------------------
User object (full data):
{
    _id: "65a8f1234567890abcdef",
    email: "john@gmail.com",
    username: "johndoe",
    fullName: "John Doe",
    avatar: "...",
    // ... 50 more fields
}
        ↓
    serializeUser
        ↓
Session stores:
{
    userId: "65a8f1234567890abcdef"  ← Just ID! Tiny!
}


DESERIALIZE (Every request)
---------------------------
Session cookie:
{
    userId: "65a8f1234567890abcdef"
}
        ↓
    deserializeUser
        ↓
Database query:
User.findById("65a8f1234567890abcdef")
        ↓
Full user object:
{
    _id: "65a8f1234567890abcdef",
    email: "john@gmail.com",
    username: "johndoe",
    fullName: "John Doe",
    avatar: "...",
    // ... all fields
}
        ↓
    req.user = full user object
```

**Why this approach?**

```
✅ Small session size (just ID)
✅ Up-to-date user data (fetch from DB each time)
✅ Easy to invalidate (delete user = automatic logout)
✅ Secure (sensitive data not in session)
```

---

# 3️⃣ GOOGLE STRATEGY IMPLEMENTATION

## 🎯 Complete Google Strategy

Create `src/config/oauth-strategies/google.strategy.js`:

```javascript
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import passport from 'passport'
import { findOrCreateOAuthUser } from '../../services/oauth.service.js'

/**
 * Google OAuth 2.0 Strategy
 * 
 * This handles the complete Google authentication flow:
 * 1. User clicks "Login with Google"
 * 2. Redirect to Google
 * 3. User approves
 * 4. Google redirects back with code
 * 5. Exchange code for tokens
 * 6. Fetch user profile
 * 7. Find or create user in our database
 */

passport.use(
    new GoogleStrategy(
        {
            // ========================================
            // GOOGLE APP CREDENTIALS
            // ========================================
            clientID: process.env.GOOGLE_CLIENT_ID,
            // Your app's Client ID from Google Console
            // Example: "123456789-abc.apps.googleusercontent.com"
            
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Your app's Client Secret from Google Console
            // Example: "GOCSPX-abcdefghijk"
            // ⚠️ Keep this secret! Never expose in frontend
            
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            // Where Google redirects after authentication
            // MUST match the URL you configured in Google Console
            // Example: "http://localhost:8000/api/v1/auth/google/callback"
            
            // ========================================
            // ADDITIONAL OPTIONS
            // ========================================
            scope: ['profile', 'email'],
            // What data we're requesting from Google
            // - 'profile': name, picture, user ID
            // - 'email': email address
            
            passReqToCallback: true
            // Pass Express request object to verify callback
            // Useful for accessing session, etc.
        },
        
        /**
         * Verify Callback
         * 
         * Called after Google authentication succeeds
         * This is where we create/update user in our database
         * 
         * @param {Object} req - Express request object
         * @param {String} accessToken - Token to access Google APIs
         * @param {String} refreshToken - Token to get new access tokens
         * @param {Object} profile - User's Google profile data
         * @param {Function} done - Callback to call when finished
         */
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                console.log('=== Google OAuth Callback ===')
                console.log('Access Token:', accessToken ? 'Present' : 'Missing')
                console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing')
                console.log('Profile ID:', profile.id)
                console.log('Profile Email:', profile.emails?.[0]?.value)
                console.log('Profile Name:', profile.displayName)
                
                // ========================================
                // PROFILE DATA STRUCTURE
                // ========================================
                /*
                    profile object from Google:
                    {
                        id: "108123456789",
                        displayName: "John Doe",
                        name: {
                            givenName: "John",
                            familyName: "Doe"
                        },
                        emails: [
                            {
                                value: "john@gmail.com",
                                verified: true
                            }
                        ],
                        photos: [
                            {
                                value: "https://lh3.googleusercontent.com/a/..."
                            }
                        ],
                        provider: "google",
                        _raw: "...",  // Raw JSON from Google
                        _json: {
                            sub: "108123456789",
                            name: "John Doe",
                            given_name: "John",
                            family_name: "Doe",
                            picture: "https://...",
                            email: "john@gmail.com",
                            email_verified: true,
                            locale: "en"
                        }
                    }
                */
                
                // ========================================
                // ATTACH TOKENS TO PROFILE
                // ========================================
                // Passport doesn't include tokens in profile by default
                // We need them for making API calls and refreshing
                profile.accessToken = accessToken
                profile.refreshToken = refreshToken
                
                // Calculate token expiry (Google tokens expire in 1 hour)
                profile.tokenExpiry = new Date(Date.now() + 3600 * 1000)
                
                // Extract scopes if available
                profile.scopes = ['profile', 'email']
                
                // ========================================
                // FIND OR CREATE USER
                // ========================================
                const user = await findOrCreateOAuthUser('google', profile)
                
                // ========================================
                // SUCCESS
                // ========================================
                // Call done() to complete authentication
                // Passport will call serializeUser next
                return done(null, user)
                
            } catch (error) {
                console.error('❌ Google OAuth Error:', error)
                
                // ========================================
                // ERROR HANDLING
                // ========================================
                // Call done() with error
                // Passport will handle the error
                return done(error, null)
            }
        }
    )
)

/**
 * Export configured strategy
 */
export default passport
```

---

## 🔍 Understanding the Callback Parameters

Let me explain **every parameter** in detail:

### Parameter 1: `req` (Express Request)

```javascript
async (req, accessToken, refreshToken, profile, done) => {
    // req = Express request object
    
    console.log(req.session)      // Access session data
    console.log(req.query)        // Access query parameters
    console.log(req.user)         // Access current user (if any)
    
    // Useful for:
    // - Checking if user is already logged in
    // - Storing return URL in session
    // - Accessing state parameter
}
```

**Example usage:**
```javascript
// Check if linking to existing account
if (req.user) {
    // User is already logged in
    // This is an account linking request
    await linkOAuthAccount(req.user._id, 'google', profile)
} else {
    // New login
    user = await findOrCreateOAuthUser('google', profile)
}
```

---

### Parameter 2: `accessToken` (String)

```javascript
accessToken: "ya29.a0AfH6SMBxyz..."
```

**What it is:**
- Token to access Google APIs on user's behalf
- Valid for 1 hour
- Can be used to fetch user data, access Gmail, Drive, etc.

**Example usage:**
```javascript
// Fetch user's Google Drive files
const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
})
```

**⚠️ Important:**
- **MUST be encrypted before storing in database**
- Expires quickly (1 hour)
- Don't expose in frontend

---

### Parameter 3: `refreshToken` (String or null)

```javascript
refreshToken: "1//0gOy4xKxyz..."  // or null
```

**What it is:**
- Token to get NEW access tokens
- Valid for weeks/months (until revoked)
- Doesn't expire automatically

**When you get it:**
```javascript
// First time user authorizes:
refreshToken: "1//0gOy4xKxyz..."  ✓

// Subsequent logins:
refreshToken: null  ← Google doesn't give it again!
```

**Why null sometimes?**
- Google only gives refresh token on **first authorization**
- If user already authorized, Google assumes you stored it
- To get it again: User must revoke access and re-authorize

**Force refresh token every time:**
```javascript
// In strategy config:
{
    accessType: 'offline',      // Request offline access
    prompt: 'consent'           // Force consent screen every time
}
```

---

### Parameter 4: `profile` (Object)

**Complete structure:**
```javascript
{
    id: "108123456789",                    // Google user ID (unique!)
    displayName: "John Doe",               // Full name
    name: {
        givenName: "John",                 // First name
        familyName: "Doe"                  // Last name
    },
    emails: [
        {
            value: "john@gmail.com",       // Email address
            verified: true                 // Email verified by Google
        }
    ],
    photos: [
        {
            value: "https://lh3.googleusercontent.com/a/..." // Profile picture
        }
    ],
    provider: "google",                    // Always "google"
    _raw: "{ ... }",                       // Raw JSON string
    _json: {                               // Parsed JSON
        sub: "108123456789",               // Same as id
        name: "John Doe",
        given_name: "John",
        family_name: "Doe",
        picture: "https://...",
        email: "john@gmail.com",
        email_verified: true,
        locale: "en",                      // User's language
        hd: "company.com"                  // Hosted domain (for G Suite)
    }
}
```

**Accessing profile data:**
```javascript
// Email (might be array, get first)
const email = profile.emails?.[0]?.value || `${profile.id}@google.oauth`

// Name
const fullName = profile.displayName || 
                 profile.name?.givenName || 
                 'User'

// Avatar
const avatar = profile.photos?.[0]?.value || ''

// Unique ID (use this as providerId)
const providerId = profile.id
```

---

### Parameter 5: `done` (Callback Function)

```javascript
done(error, user, info)
```

**Signature:**
```javascript
/**
 * @param {Error|null} error - Error object if something went wrong
 * @param {Object|false} user - User object if success, false if auth failed
 * @param {Object} info - Optional additional information
 */
done(error, user, info)
```

**Usage examples:**

**Success:**
```javascript
const user = await findOrCreateOAuthUser('google', profile)
return done(null, user)  // Success! Passport will call serializeUser
```

**Authentication failure (user didn't approve):**
```javascript
return done(null, false, { message: 'User denied access' })
```

**Error:**
```javascript
try {
    // ... something goes wrong
} catch (error) {
    return done(error, null)  // Passport will handle error
}
```

**⚠️ Important:**
- **ALWAYS call `done()`** or request will hang!
- First parameter: error or null
- Second parameter: user object or false
- **Must use `return done()`** to stop execution

---

## 🔄 Complete OAuth Flow (What Happens Internally)

Let me show you **exactly** what happens step by step:

```
USER ACTION: Clicks "Login with Google"
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 1: Frontend redirects to backend             │
└────────────────────────────────────────────────────┘
        ↓
Frontend: GET /api/v1/auth/google
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 2: Passport initiates OAuth                  │
└────────────────────────────────────────────────────┘
        ↓
Passport constructs Google authorization URL:
https://accounts.google.com/o/oauth2/v2/auth?
    client_id=123456789-abc.apps.googleusercontent.com
    &redirect_uri=http://localhost:8000/api/v1/auth/google/callback
    &response_type=code
    &scope=profile email
    &state=random-csrf-token
        ↓
Passport redirects user to this URL
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 3: User sees Google login page               │
└────────────────────────────────────────────────────┘
        ↓
User enters Google credentials
User clicks "Allow" on consent screen
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 4: Google redirects back with code           │
└────────────────────────────────────────────────────┘
        ↓
Google: Redirect to callback URL:
http://localhost:8000/api/v1/auth/google/callback?
    code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
    &state=random-csrf-token
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 5: Passport exchanges code for tokens        │
└────────────────────────────────────────────────────┘
        ↓
Passport makes request to Google:
POST https://oauth2.googleapis.com/token
Body: {
    client_id: "...",
    client_secret: "...",
    code: "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7",
    redirect_uri: "...",
    grant_type: "authorization_code"
}
        ↓
Google responds:
{
    access_token: "ya29.a0AfH6SMB...",
    refresh_token: "1//0gOy4xK...",
    expires_in: 3600,
    token_type: "Bearer",
    id_token: "eyJhbGciOiJSUzI1NiIs..."
}
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 6: Passport fetches user profile             │
└────────────────────────────────────────────────────┘
        ↓
Passport makes request:
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer ya29.a0AfH6SMB...
        ↓
Google responds with profile:
{
    id: "108123456789",
    email: "john@gmail.com",
    name: "John Doe",
    picture: "https://...",
    ...
}
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 7: Verify callback is called                 │
└────────────────────────────────────────────────────┘
        ↓
Your verify function executes:
async (req, accessToken, refreshToken, profile, done) => {
    // Your code here
    const user = await findOrCreateOAuthUser('google', profile)
    return done(null, user)
}
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 8: Passport serializes user                  │
└────────────────────────────────────────────────────┘
        ↓
serializeUser called:
passport.serializeUser((user, done) => {
    done(null, user._id.toString())
})
        ↓
User ID stored in session
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 9: Redirect to frontend                      │
└────────────────────────────────────────────────────┘
        ↓
Your callback controller redirects:
res.redirect('http://localhost:3000/dashboard?login=success')
        ↓
┌────────────────────────────────────────────────────┐
│ STEP 10: User is logged in!                       │
└────────────────────────────────────────────────────┘
        ↓
Frontend shows dashboard
User can now make authenticated requests
```
---
# 📚 PART 4: Controllers, Routes & Complete Integration
---

## 📋 Part 4 Contents
1. OAuth Controllers (Complete)
2. Routes Configuration
3. Middleware Setup
4. Frontend Integration (React)
5. Token Management
6. Error Handling
7. Testing in Postman
8. Common Mistakes & Solutions
9. Production Checklist
10. Complete Cheat Sheet

---

# 1️⃣ OAUTH CONTROLLERS

## 🎯 Complete Controller Implementation

Create `src/controllers/auth/oauth.auth.controller.js`:

```javascript
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import passport from 'passport'

// ========================================
// GOOGLE OAUTH - INITIATE
// ========================================

/**
 * Initiate Google OAuth flow
 * 
 * Route: GET /api/v1/auth/google
 * 
 * What happens:
 * 1. User clicks "Login with Google" on frontend
 * 2. Frontend redirects to this route
 * 3. Passport redirects to Google login
 * 4. User logs in on Google's page
 * 5. Google redirects back to callback
 */
export const googleAuth = asyncHandler(async (req, res, next) => {
    // ========================================
    // STORE RETURN URL (Optional but useful!)
    // ========================================
    // If frontend sends where to return after login
    if (req.query.returnTo) {
        req.session.returnTo = req.query.returnTo
    }
    
    // ========================================
    // INITIATE OAUTH
    // ========================================
    // Passport will:
    // 1. Generate state parameter (CSRF protection)
    // 2. Store it in session
    // 3. Redirect to Google with all params
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        // What data we want from Google
        
        accessType: 'offline',
        // Request refresh token
        // 'offline' = give refresh token
        // 'online' = don't give refresh token
        
        prompt: 'consent'
        // Force consent screen every time
        // Ensures we get refresh token
        // Options:
        // - 'consent': Always show consent
        // - 'select_account': Let user choose account
        // - 'none': Skip if already authorized
    })(req, res, next)
})

/**
 * Understanding authenticate() parameters
 * 
 * passport.authenticate('google', options)(req, res, next)
 *                        ↓         ↓         ↓
 *                    Strategy   Config   Express middleware
 * 
 * Why (req, res, next)?
 * - authenticate() returns a middleware function
 * - We need to call it with Express params
 * - This is a higher-order function pattern
 */

// ========================================
// GOOGLE OAUTH - CALLBACK
// ========================================

/**
 * Handle Google OAuth callback
 * 
 * Route: GET /api/v1/auth/google/callback
 * 
 * What happens:
 * 1. Google redirects here with code
 * 2. Passport exchanges code for tokens
 * 3. Passport fetches user profile
 * 4. Our verify callback creates/updates user
 * 5. User is logged in
 * 6. We redirect to frontend
 */
export const googleAuthCallback = asyncHandler(async (req, res, next) => {
    // ========================================
    // AUTHENTICATE WITH PASSPORT
    // ========================================
    passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/google/failure',
        // Where to redirect if authentication fails
        
        session: true
        // Save user in session (default: true)
        // Set to false for stateless JWT-only auth
    })(req, res, async () => {
        // ========================================
        // SUCCESS! User is authenticated
        // ========================================
        
        try {
            // At this point:
            // - req.user is populated (by Passport)
            // - Session contains user ID
            // - User is logged in
            
            console.log('✅ Google OAuth Success!')
            console.log('User:', req.user.email)
            
            // ========================================
            // GENERATE JWT TOKENS (Optional)
            // ========================================
            // If you want JWT + session hybrid approach
            const accessToken = req.user.generateAccessToken()
            const refreshToken = req.user.generateRefreshToken()
            
            // Save refresh token to user
            req.user.refreshToken = refreshToken
            await req.user.save({ validateBeforeSave: false })
            
            // ========================================
            // SET COOKIES (Optional)
            // ========================================
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000  // 24 hours
            }
            
            res.cookie('accessToken', accessToken, cookieOptions)
            res.cookie('refreshToken', refreshToken, cookieOptions)
            
            // ========================================
            // REDIRECT TO FRONTEND
            // ========================================
            const returnTo = req.session.returnTo || process.env.FRONTEND_URL + '/dashboard'
            delete req.session.returnTo  // Clean up
            
            // Include tokens in URL (alternative to cookies)
            const redirectUrl = `${returnTo}?login=success&accessToken=${accessToken}`
            
            res.redirect(redirectUrl)
            
        } catch (error) {
            console.error('❌ Error in Google callback:', error)
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`)
        }
    })
})

/**
 * Callback function flow:
 * 
 * passport.authenticate('google', options)(req, res, callback)
 *                                                      ↓
 *                                          This callback runs ONLY if auth succeeds
 *                                          
 * If auth fails → redirects to failureRedirect
 * If auth succeeds → callback runs
 */

// ========================================
// GOOGLE OAUTH - FAILURE
// ========================================

/**
 * Handle OAuth failure
 * 
 * Route: GET /api/v1/auth/google/failure
 * 
 * When this is called:
 * - User denied access
 * - OAuth error occurred
 * - Invalid callback
 */
export const googleAuthFailure = asyncHandler(async (req, res) => {
    console.log('❌ Google OAuth Failed')
    
    // Get error details from session if available
    const errorMessage = req.session.messages ? 
        req.session.messages[req.session.messages.length - 1] : 
        'Authentication failed'
    
    // Clear error messages
    req.session.messages = []
    
    // Redirect to frontend with error
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`)
})

// ========================================
// LOGOUT
// ========================================

/**
 * Logout user
 * 
 * Route: POST /api/v1/auth/logout
 * 
 * Clears:
 * - Session
 * - Cookies
 * - Refresh token from database
 */
export const logout = asyncHandler(async (req, res) => {
    // ========================================
    // CLEAR REFRESH TOKEN FROM DB
    // ========================================
    if (req.user) {
        req.user.refreshToken = undefined
        await req.user.save({ validateBeforeSave: false })
    }
    
    // ========================================
    // DESTROY SESSION
    // ========================================
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err)
        }
    })
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err)
        }
    })
    
    // ========================================
    // CLEAR COOKIES
    // ========================================
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
    
    res.clearCookie('accessToken', cookieOptions)
    res.clearCookie('refreshToken', cookieOptions)
    res.clearCookie('oauth.sid', cookieOptions)  // Session cookie
    
    // ========================================
    // SEND RESPONSE
    // ========================================
    return res.status(200).json(
        new ApiResponse(200, {}, "Logged out successfully")
    )
})

// ========================================
// GET CURRENT USER
// ========================================

/**
 * Get currently logged-in user
 * 
 * Route: GET /api/v1/auth/me
 * 
 * Works with both:
 * - Session authentication (Passport)
 * - JWT authentication (custom middleware)
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is set by either:
    // 1. Passport session (deserializeUser)
    // 2. JWT middleware (verifyJWT)
    
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated')
    }
    
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    )
})

// ========================================
// LINK OAUTH ACCOUNT
// ========================================

/**
 * Link Google account to existing user
 * 
 * Route: GET /api/v1/auth/google/link
 * 
 * Use case:
 * - User already has account with email/password
 * - Now wants to add Google login
 */
export const linkGoogleAccount = asyncHandler(async (req, res, next) => {
    // Check if user is already logged in
    if (!req.user) {
        throw new ApiError(401, 'Must be logged in to link account')
    }
    
    // Store that this is a linking request
    req.session.isLinking = true
    req.session.linkUserId = req.user._id.toString()
    
    // Initiate OAuth flow
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent'
    })(req, res, next)
})

/**
 * Handle link callback
 * 
 * Route: GET /api/v1/auth/google/link/callback
 */
export const linkGoogleAccountCallback = asyncHandler(async (req, res, next) => {
    passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/google/link/failure'
    })(req, res, async () => {
        try {
            // Check if this was a linking request
            if (!req.session.isLinking || !req.session.linkUserId) {
                throw new Error('Invalid linking request')
            }
            
            // Link the account using our service
            const { linkOAuthAccount } = await import('../../services/oauth.service.js')
            
            await linkOAuthAccount(
                req.session.linkUserId,
                'google',
                {
                    id: req.user.googleId || req.authInfo.profile.id,
                    ...req.authInfo.profile
                }
            )
            
            // Clean up session
            delete req.session.isLinking
            delete req.session.linkUserId
            
            // Redirect to success
            res.redirect(`${process.env.FRONTEND_URL}/settings?linked=google`)
            
        } catch (error) {
            console.error('❌ Error linking Google account:', error)
            res.redirect(`${process.env.FRONTEND_URL}/settings?error=link_failed`)
        }
    })
})

// ========================================
// UNLINK OAUTH ACCOUNT
// ========================================

/**
 * Unlink Google account
 * 
 * Route: POST /api/v1/auth/google/unlink
 */
export const unlinkGoogleAccount = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated')
    }
    
    const { unlinkOAuthAccount } = await import('../../services/oauth.service.js')
    
    await unlinkOAuthAccount(req.user._id, 'google')
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Google account unlinked successfully")
    )
})

// ========================================
// GET LINKED ACCOUNTS
// ========================================

/**
 * Get all linked OAuth accounts
 * 
 * Route: GET /api/v1/auth/linked-accounts
 */
export const getLinkedAccounts = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated')
    }
    
    const { getUserOAuthAccounts } = await import('../../services/oauth.service.js')
    
    const accounts = await getUserOAuthAccounts(req.user._id)
    
    return res.status(200).json(
        new ApiResponse(200, accounts, "Linked accounts fetched successfully")
    )
})
```

---

## 🎨 Visual Flow of Controllers

```
USER JOURNEY
────────────

1. INITIATE LOGIN
   Frontend → GET /auth/google → googleAuth() → Redirect to Google


2. GOOGLE LOGIN
   User logs in on Google → Google redirects back


3. CALLBACK
   Google → GET /auth/google/callback → googleAuthCallback()
       ↓
   Success:
       - Create/update user
       - Generate tokens
       - Set cookies
       - Redirect to frontend/dashboard
       ↓
   Failure:
       - Redirect to /auth/google/failure
       ↓
       googleAuthFailure() → Redirect to frontend/login?error=...


4. AUTHENTICATED REQUESTS
   Frontend → GET /auth/me → getCurrentUser() → Return user data


5. LOGOUT
   Frontend → POST /auth/logout → logout()
       - Clear session
       - Clear cookies
       - Clear refresh token from DB
```

---

# 2️⃣ ROUTES CONFIGURATION

## 🛣️ Complete Routes Setup

Create `src/routes/auth.routes.js`:

```javascript
import { Router } from 'express'
import {
    googleAuth,
    googleAuthCallback,
    googleAuthFailure,
    logout,
    getCurrentUser,
    linkGoogleAccount,
    linkGoogleAccountCallback,
    unlinkGoogleAccount,
    getLinkedAccounts
} from '../controllers/auth/oauth.auth.controller.js'

// Import traditional auth if you have it
import {
    registerUser,
    loginUser
} from '../controllers/auth/local.auth.controller.js'

// Import middleware
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// ========================================
// TRADITIONAL AUTHENTICATION
// ========================================

/**
 * Register with email/password
 * POST /api/v1/auth/register
 */
router.post('/register', registerUser)

/**
 * Login with email/password
 * POST /api/v1/auth/login
 */
router.post('/login', loginUser)

// ========================================
// GOOGLE OAUTH AUTHENTICATION
// ========================================

/**
 * Initiate Google OAuth
 * GET /api/v1/auth/google
 * 
 * Query params (optional):
 * - returnTo: Where to redirect after login
 * 
 * Example:
 * /api/v1/auth/google?returnTo=/dashboard
 */
router.get('/google', googleAuth)

/**
 * Google OAuth callback
 * GET /api/v1/auth/google/callback
 * 
 * This is called by Google after user logs in
 * URL configured in Google Console
 */
router.get('/google/callback', googleAuthCallback)

/**
 * Google OAuth failure
 * GET /api/v1/auth/google/failure
 * 
 * Redirected here if OAuth fails
 */
router.get('/google/failure', googleAuthFailure)

// ========================================
// ACCOUNT LINKING (Protected)
// ========================================

/**
 * Link Google account to current user
 * GET /api/v1/auth/google/link
 * 
 * Requires: User must be logged in
 */
router.get('/google/link', verifyJWT, linkGoogleAccount)

/**
 * Google link callback
 * GET /api/v1/auth/google/link/callback
 */
router.get('/google/link/callback', verifyJWT, linkGoogleAccountCallback)

/**
 * Unlink Google account
 * POST /api/v1/auth/google/unlink
 * 
 * Requires: User must be logged in
 */
router.post('/google/unlink', verifyJWT, unlinkGoogleAccount)

/**
 * Get all linked OAuth accounts
 * GET /api/v1/auth/linked-accounts
 * 
 * Requires: User must be logged in
 */
router.get('/linked-accounts', verifyJWT, getLinkedAccounts)

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * Get current user
 * GET /api/v1/auth/me
 * 
 * Works with both session and JWT auth
 */
router.get('/me', getCurrentUser)

/**
 * Logout
 * POST /api/v1/auth/logout
 * 
 * Clears session and cookies
 */
router.post('/logout', logout)

// ========================================
// EXPORT ROUTER
// ========================================

export default router
```

---

## 📝 Mounting Routes in app.js

Update `src/app.js`:

```javascript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'

// Import session config
import { sessionConfig } from './config/session.js'

// Import Passport config
import './config/passport.js'

// Import OAuth strategies
import './config/oauth-strategies/google.strategy.js'

const app = express()

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true  // ← IMPORTANT for OAuth!
}))

// Body parsers
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// Static files
app.use(express.static("public"))

// Cookie parser (must be before session!)
app.use(cookieParser())

// ========================================
// SESSION MIDDLEWARE (for OAuth)
// ========================================
app.use(sessionConfig)

// ========================================
// PASSPORT INITIALIZATION (after session!)
// ========================================
app.use(passport.initialize())
app.use(passport.session())

/**
 * Order matters!
 * 
 * ✅ Correct order:
 * 1. cookieParser
 * 2. session
 * 3. passport.initialize
 * 4. passport.session
 * 
 * ❌ Wrong order will break OAuth!
 */

// ========================================
// ROUTES
// ========================================

import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", userRouter)

// ========================================
// HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    })
})

// ========================================
// 404 HANDLER
// ========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

// ========================================
// ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
    console.error('Error:', err)
    
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: err.errors || []
    })
})

export { app }
```

---

## 🔑 Middleware for Dual Authentication

Create `src/middlewares/auth.middleware.js` (enhanced version):

```javascript
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models.js"

/**
 * Verify JWT or Session
 * 
 * This middleware supports BOTH:
 * 1. JWT authentication (for API clients)
 * 2. Session authentication (for OAuth)
 * 
 * Checks in order:
 * 1. JWT token in cookies/headers
 * 2. Passport session
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // ========================================
        // OPTION 1: JWT TOKEN
        // ========================================
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "")
        
        if (token) {
            // Verify JWT
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            
            // Fetch user
            const user = await User.findById(decodedToken._id).select("-password -refreshToken")
            
            if (!user) {
                throw new ApiError(401, "Invalid access token")
            }
            
            // Attach to request
            req.user = user
            return next()
        }
        
        // ========================================
        // OPTION 2: SESSION (Passport)
        // ========================================
        if (req.isAuthenticated && req.isAuthenticated()) {
            // User is authenticated via Passport session
            // req.user already populated by deserializeUser
            return next()
        }
        
        // ========================================
        // NO AUTHENTICATION
        // ========================================
        throw new ApiError(401, "Unauthorized request")
        
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Access token expired")
        }
        
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid access token")
        }
        
        throw new ApiError(401, error?.message || "Unauthorized")
    }
})

/**
 * Optional: Require only JWT (not session)
 */
export const verifyJWTOnly = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || 
                 req.header("Authorization")?.replace("Bearer ", "")
    
    if (!token) {
        throw new ApiError(401, "Access token required")
    }
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
    if (!user) {
        throw new ApiError(401, "Invalid access token")
    }
    
    req.user = user
    next()
})

/**
 * Optional: Require only session (not JWT)
 */
export const requireSession = asyncHandler(async (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        throw new ApiError(401, "Please login with OAuth provider")
    }
    
    next()
})
```

---

# 3️⃣ FRONTEND INTEGRATION

## 🎯 React Integration Examples

Let me show you **complete frontend code** for all scenarios!

---

## 📝 Login Page Component

Create `src/pages/LoginPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    
    const navigate = useNavigate()
    const location = useLocation()
    
    // ========================================
    // HANDLE OAUTH CALLBACK
    // ========================================
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        
        // Check for login success
        if (params.get('login') === 'success') {
            const accessToken = params.get('accessToken')
            
            if (accessToken) {
                // Store token (if you want to use it)
                localStorage.setItem('accessToken', accessToken)
            }
            
            // Redirect to dashboard
            navigate('/dashboard')
        }
        
        // Check for errors
        if (params.get('error')) {
            setError(decodeURIComponent(params.get('error')))
        }
    }, [location, navigate])
    
    // ========================================
    // TRADITIONAL LOGIN
    // ========================================
    const handleTraditionalLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // Send cookies
                body: JSON.stringify({ email, password })
            })
            
            const data = await response.json()
            
            if (data.success) {
                // Store tokens if needed
                if (data.data.accessToken) {
                    localStorage.setItem('accessToken', data.data.accessToken)
                }
                
                navigate('/dashboard')
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError('Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    // ========================================
    // GOOGLE OAUTH LOGIN
    // ========================================
    const handleGoogleLogin = () => {
        // Get current location to return after login
        const returnTo = location.state?.from?.pathname || '/dashboard'
        
        // Redirect to backend OAuth route
        window.location.href = `http://localhost:8000/api/v1/auth/google?returnTo=${returnTo}`
    }
    
    /**
     * Why window.location.href instead of fetch?
     * 
     * OAuth requires full page redirect to Google
     * We can't use fetch() because:
     * - Need to redirect user to Google's login page
     * - Google needs to redirect back to our callback
     * - Can't do this in background with fetch
     */
    
    return (
        <div className="login-container">
            <h1>Login</h1>
            
            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}
            
            {/* ============================= */}
            {/* TRADITIONAL LOGIN FORM        */}
            {/* ============================= */}
            <form onSubmit={handleTraditionalLogin}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            
            <div className="divider">
                <span>OR</span>
            </div>
            
            {/* ============================= */}
            {/* OAUTH LOGIN BUTTONS           */}
            {/* ============================= */}
            <button 
                onClick={handleGoogleLogin}
                className="btn-google"
            >
                <img src="/google-icon.svg" alt="Google" />
                Continue with Google
            </button>
            
            {/* Add more providers */}
            <button 
                onClick={() => window.location.href = 'http://localhost:8000/api/v1/auth/github'}
                className="btn-github"
            >
                <img src="/github-icon.svg" alt="GitHub" />
                Continue with GitHub
            </button>
        </div>
    )
}

export default LoginPage
```

---

## 📝 Account Settings Component (Link/Unlink)

Create `src/pages/AccountSettings.jsx`:

```jsx
import { useState, useEffect } from 'react'

function AccountSettings() {
    const [linkedAccounts, setLinkedAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    
    // ========================================
    // FETCH LINKED ACCOUNTS
    // ========================================
    useEffect(() => {
        fetchLinkedAccounts()
        
        // Check for link success/error in URL
        const params = new URLSearchParams(window.location.search)
        if (params.get('linked')) {
            setMessage(`${params.get('linked')} account linked successfully!`)
        }
        if (params.get('error')) {
            setMessage(`Error: ${params.get('error')}`)
        }
    }, [])
    
    const fetchLinkedAccounts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/linked-accounts', {
                credentials: 'include'  // Send cookies
            })
            
            const data = await response.json()
            
            if (data.success) {
                setLinkedAccounts(data.data)
            }
        } catch (err) {
            console.error('Error fetching linked accounts:', err)
        } finally {
            setLoading(false)
        }
    }
    
    // ========================================
    // LINK ACCOUNT
    // ========================================
    const handleLinkGoogle = () => {
        // Redirect to link endpoint
        window.location.href = 'http://localhost:8000/api/v1/auth/google/link'
    }
    
    // ========================================
    // UNLINK ACCOUNT
    // ========================================
    const handleUnlinkGoogle = async () => {
        if (!confirm('Are you sure you want to unlink your Google account?')) {
            return
        }
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/google/unlink', {
                method: 'POST',
                credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setMessage('Google account unlinked successfully')
                fetchLinkedAccounts()  // Refresh list
            } else {
                setMessage(`Error: ${data.message}`)
            }
        } catch (err) {
            setMessage('Failed to unlink account')
        }
    }
    
    // Check if Google is linked
    const isGoogleLinked = linkedAccounts.some(acc => acc.provider === 'google')
    
    if (loading) {
        return <div>Loading...</div>
    }
    
    return (
        <div className="settings-container">
            <h1>Account Settings</h1>
            
            {message && (
                <div className="alert">
                    {message}
                </div>
            )}
            
            {/* ============================= */}
            {/* LINKED ACCOUNTS SECTION       */}
            {/* ============================= */}
            <div className="section">
                <h2>Linked Accounts</h2>
                
                <div className="linked-account">
                    <div className="account-info">
                        <img src="/google-icon.svg" alt="Google" />
                        <div>
                            <h3>Google</h3>
                            {isGoogleLinked ? (
                                <p className="status-linked">✓ Linked</p>
                            ) : (
                                <p className="status-not-linked">Not linked</p>
                            )}
                        </div>
                    </div>
                    
                    {isGoogleLinked ? (
                        <button 
                            onClick={handleUnlinkGoogle}
                            className="btn-unlink"
                        >
                            Unlink
                        </button>
                    ) : (
                        <button 
                            onClick={handleLinkGoogle}
                            className="btn-link"
                        >
                            Link Account
                        </button>
                    )}
                </div>
                
                {/* Show linked account details */}
                {isGoogleLinked && (
                    <div className="account-details">
                        {linkedAccounts
                            .filter(acc => acc.provider === 'google')
                            .map(acc => (
                                <div key={acc._id}>
                                    <p>Email: {acc.profile.email}</p>
                                    <p>Linked: {new Date(acc.createdAt).toLocaleDateString()}</p>
                                    <p>Last used: {new Date(acc.lastUsed).toLocaleDateString()}</p>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

export default AccountSettings
```

---

## 📝 Protected Route Component

Create `src/components/ProtectedRoute.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null)  // null = checking
    const location = useLocation()
    
    useEffect(() => {
        checkAuth()
    }, [])
    
    const checkAuth = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/me', {
                credentials: 'include'  // Send cookies/session
            })
            
            if (response.ok) {
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
        } catch (err) {
            setIsAuthenticated(false)
        }
    }
    
    // Still checking
    if (isAuthenticated === null) {
        return <div>Loading...</div>
    }
    
    // Not authenticated
    if (isAuthenticated === false) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }
    
    // Authenticated
    return children
}

export default ProtectedRoute
```

---

## 📝 App Router Setup

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AccountSettings from './pages/AccountSettings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/settings" 
                    element={
                        <ProtectedRoute>
                            <AccountSettings />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
```
---
