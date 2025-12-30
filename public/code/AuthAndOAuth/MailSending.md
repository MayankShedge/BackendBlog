# 📧 Email Service Implementation :

---

## 📋 Table of Contents

### Part 1: Email Service Options
1. Nodemailer (SMTP)
2. SendGrid
3. Resend
4. AWS SES
5. Comparison & Which to Choose

### Part 2: Schema Design
6. User Model Modifications
7. Token Schema for Verification

### Part 3: Implementation
8. Email Service Setup
9. Email Verification Flow
10. Password Reset Flow
11. Other Email Use Cases

### Part 4: Controllers & Routes
12. Registration with Email Verification
13. Verify Email Endpoint
14. Forgot Password
15. Reset Password

### Part 5: Frontend Integration
16. Complete Flow Examples

---

# 📚 PART 1: EMAIL SERVICE OPTIONS

## 🎯 Overview of Options

| Service | Type | Complexity | Cost | Best For |
|---------|------|------------|------|----------|
| **Nodemailer (Gmail SMTP)** | SMTP | Easy | Free (limits) | Development/Small apps |
| **SendGrid** | API | Medium | Free tier (100/day) | Production apps |
| **Resend** | API | Easy | Free tier (100/day) | Modern apps |
| **AWS SES** | API/SMTP | Complex | Very cheap | Large scale |
| **Mailgun** | API | Medium | Free tier (100/day) | Production apps |

---

# 1️⃣ NODEMAILER (SMTP) - Gmail Example

## 🎯 When to Use?

**✅ Good for:**
- Development & testing
- Small applications
- Personal projects
- Quick prototyping

**❌ Not ideal for:**
- Production (Gmail has strict limits)
- High volume emails
- Transactional emails at scale

---

## 📦 Installation

```bash
npm install nodemailer
```

---

## ⚙️ Setup

### Create Email Service (`src/services/email.service.js`)

```javascript
import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',  // or 'hotmail', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,     // your-email@gmail.com
        pass: process.env.EMAIL_PASSWORD  // app-specific password
    }
})

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - YourApp',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to YourApp! 🎉</h2>
                <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                
                <a href="${verificationUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                          color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Verify Email
                </a>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
            </div>
        `
    }
    
    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('✅ Verification email sent:', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ Error sending verification email:', error)
        throw new Error('Failed to send verification email')
    }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password - YourApp',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reset Your Password</h2>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #f44336; 
                          color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Reset Password
                </a>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                </p>
            </div>
        `
    }
    
    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('✅ Password reset email sent:', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ Error sending password reset email:', error)
        throw new Error('Failed to send password reset email')
    }
}

/**
 * Send welcome email (after verification)
 */
export const sendWelcomeEmail = async (email, username) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to YourApp! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome aboard, ${username}! 🚀</h2>
                <p>Your email has been verified successfully. You can now enjoy all the features of YourApp.</p>
                
                <h3>What's next?</h3>
                <ul>
                    <li>Complete your profile</li>
                    <li>Upload your first video</li>
                    <li>Connect with other creators</li>
                </ul>
                
                <a href="${process.env.FRONTEND_URL}/dashboard" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2196F3; 
                          color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Go to Dashboard
                </a>
            </div>
        `
    }
    
    await transporter.sendMail(mailOptions)
}
```

---

## 🔑 Environment Variables (.env)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

---

## 🔐 Gmail App-Specific Password Setup

**Important:** Gmail doesn't allow less secure apps anymore. You need an **App Password**.

**Steps:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Search for "App Passwords"
4. Generate password for "Mail"
5. Copy the 16-character password
6. Use this in `.env` as `EMAIL_PASSWORD`

---

# 2️⃣ SENDGRID - Production Ready

## 🎯 When to Use?

**✅ Perfect for:**
- Production applications
- Transactional emails
- Marketing emails
- Email analytics
- High deliverability needed

---

## 📦 Installation

```bash
npm install @sendgrid/mail
```

---

## ⚙️ Setup

### Create Email Service (`src/services/sendgrid.service.js`)

```javascript
import sgMail from '@sendgrid/mail'

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    const msg = {
        to: email,
        from: process.env.SENDGRID_VERIFIED_SENDER,  // Must be verified in SendGrid
        subject: 'Verify Your Email - YourApp',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to YourApp! 🎉</h2>
                <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                
                <a href="${verificationUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                          color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Verify Email
                </a>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 24 hours.
                </p>
            </div>
        `,
        // Optional: Use SendGrid templates
        // templateId: 'd-1234567890abcdef',
        // dynamicTemplateData: {
        //     verificationUrl: verificationUrl,
        //     username: username
        // }
    }
    
    try {
        await sgMail.send(msg)
        console.log('✅ Verification email sent via SendGrid')
        return { success: true }
    } catch (error) {
        console.error('❌ SendGrid error:', error)
        if (error.response) {
            console.error(error.response.body)
        }
        throw new Error('Failed to send verification email')
    }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const msg = {
        to: email,
        from: process.env.SENDGRID_VERIFIED_SENDER,
        subject: 'Reset Your Password - YourApp',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reset Your Password</h2>
                <p>Click the button below to reset your password:</p>
                
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #f44336; 
                          color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Reset Password
                </a>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link expires in 1 hour.
                </p>
            </div>
        `
    }
    
    await sgMail.send(msg)
}

/**
 * Send bulk emails (e.g., newsletters)
 */
export const sendBulkEmails = async (recipients, subject, htmlContent) => {
    const messages = recipients.map(email => ({
        to: email,
        from: process.env.SENDGRID_VERIFIED_SENDER,
        subject: subject,
        html: htmlContent
    }))
    
    try {
        await sgMail.send(messages)
        console.log(`✅ Sent bulk emails to ${recipients.length} recipients`)
    } catch (error) {
        console.error('❌ Bulk email error:', error)
        throw error
    }
}
```

---

## 🔑 Environment Variables

```env
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_VERIFIED_SENDER=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

---

## 📋 SendGrid Setup Steps

1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your sender email/domain
3. Create API Key (Settings → API Keys)
4. Copy API key to `.env`

---

# 3️⃣ RESEND - Modern & Developer-Friendly

## 🎯 When to Use?

**✅ Perfect for:**
- Modern applications
- Simple integration
- Great DX (Developer Experience)
- React email templates
- Built-in analytics

---

## 📦 Installation

```bash
npm install resend
```

---

## ⚙️ Setup

### Create Email Service (`src/services/resend.service.js`)

```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'YourApp <onboarding@yourdomain.com>',
            to: email,
            subject: 'Verify Your Email',
            html: `
                <h2>Welcome to YourApp!</h2>
                <p>Click the link below to verify your email:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link expires in 24 hours.</p>
            `
        })
        
        if (error) {
            throw new Error(error.message)
        }
        
        console.log('✅ Email sent via Resend:', data.id)
        return { success: true, id: data.id }
    } catch (error) {
        console.error('❌ Resend error:', error)
        throw error
    }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    await resend.emails.send({
        from: 'YourApp <noreply@yourdomain.com>',
        to: email,
        subject: 'Reset Your Password',
        html: `
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
        `
    })
}
```

---

## 🔑 Environment Variables

```env
RESEND_API_KEY=re_your-api-key-here
FRONTEND_URL=http://localhost:3000
```

---

# 📚 PART 2: SCHEMA DESIGN

## 🎯 User Model Modifications

### Updated User Schema (`src/models/user.models.js`)

```javascript
import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true
        },
        coverImage: {
            type: String
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        
        // ========================================
        // EMAIL VERIFICATION FIELDS
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
        // PASSWORD RESET FIELDS
        // ========================================
        passwordResetToken: {
            type: String
        },
        passwordResetExpires: {
            type: Date
        },
        
        refreshToken: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)

// Hash password before saving
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// Compare password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

// Generate access token
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

// Generate refresh token
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

// ========================================
// EMAIL VERIFICATION TOKEN METHODS
// ========================================

/**
 * Generate email verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
    // Generate random token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    
    // Hash and save to database
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex')
    
    // Set expiry (24 hours)
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000
    
    // Return unhashed token (to send in email)
    return verificationToken
}

/**
 * Verify email verification token
 */
userSchema.methods.verifyEmailToken = function(token) {
    // Hash the token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    
    // Check if token matches and hasn't expired
    if (
        this.emailVerificationToken === hashedToken &&
        this.emailVerificationExpires > Date.now()
    ) {
        return true
    }
    
    return false
}

// ========================================
// PASSWORD RESET TOKEN METHODS
// ========================================

/**
 * Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Hash and save to database
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    // Set expiry (1 hour)
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000
    
    // Return unhashed token (to send in email)
    return resetToken
}

/**
 * Verify password reset token
 */
userSchema.methods.verifyResetToken = function(token) {
    // Hash the token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    
    // Check if token matches and hasn't expired
    if (
        this.passwordResetToken === hashedToken &&
        this.passwordResetExpires > Date.now()
    ) {
        return true
    }
    
    return false
}

export const User = mongoose.model("User", userSchema)
```

---

## 🔐 Import crypto at top

```javascript
import crypto from 'crypto'
```

---

## 🎨 Schema Visualization

```
USER DOCUMENT
├─ username
├─ email
├─ password (hashed)
├─ avatar
├─ isEmailVerified: false → true (after verification)
├─ emailVerificationToken: "hashed-token" → null (after verification)
├─ emailVerificationExpires: Date → null
├─ passwordResetToken: null → "hashed-token" → null
└─ passwordResetExpires: null → Date → null
```

---

# 📚 PART 3: CONTROLLERS & ROUTES

## 🎯 Registration with Email Verification

### Controller (`src/controllers/user.controller.js`)

```javascript
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../service/cloudinary.js"
import { sendVerificationEmail, sendWelcomeEmail } from "../services/email.service.js"

/**
 * REGISTER USER (with email verification)
 */
const registerUser = asyncHandler(async (req, res) => {
    // Step 1: Get user details
    const { fullName, email, username, password } = req.body
    
    // Step 2: Validation
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    
    // Step 3: Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    
    // Step 4: Check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    
    // Step 5: Upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }
    
    // Step 6: Create user (unverified)
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        isEmailVerified: false  // ← Not verified yet!
    })
    
    // Step 7: Generate verification token
    const verificationToken = user.generateEmailVerificationToken()
    await user.save({ validateBeforeSave: false })
    
    // Step 8: Send verification email
    try {
        await sendVerificationEmail(email, verificationToken)
    } catch (error) {
        // If email fails, still create user but log error
        console.error('Failed to send verification email:', error)
        // Optionally: Delete user or mark as needing verification resend
    }
    
    // Step 9: Get user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -passwordResetToken"
    )
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }
    
    // Step 10: Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully. Please check your email to verify your account."
        )
    )
})

export { registerUser }
```

---

## ✅ Verify Email Controller

```javascript
/**
 * VERIFY EMAIL
 */
const verifyEmail = asyncHandler(async (req, res) => {
    // Step 1: Get token from query/params
    const { token } = req.query  // or req.params.token
    
    if (!token) {
        throw new ApiError(400, "Verification token is required")
    }
    
    // Step 2: Hash the token (to compare with DB)
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    
    // Step 3: Find user with this token
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }  // Not expired
    })
    
    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token")
    }
    
    // Step 4: Verify user
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save({ validateBeforeSave: false })
    
    // Step 5: Send welcome email
    try {
        await sendWelcomeEmail(user.email, user.username)
    } catch (error) {
        console.error('Failed to send welcome email:', error)
    }
    
    // Step 6: Send response
    return res.status(200).json(
        new ApiResponse(
            200,
            { isEmailVerified: true },
            "Email verified successfully!"
        )
    )
})

export { verifyEmail }
```

---

## 🔄 Resend Verification Email

```javascript
/**
 * RESEND VERIFICATION EMAIL
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body
    
    if (!email) {
        throw new ApiError(400, "Email is required")
    }
    
    // Find user
    const user = await User.findOne({ email })
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified")
    }
    
    // Generate new token
    const verificationToken = user.generateEmailVerificationToken()
    await user.save({ validateBeforeSave: false })
    
    // Send email
    await sendVerificationEmail(email, verificationToken)
    
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification email sent successfully"
        )
    )
})

export { resendVerificationEmail }
```

---

## 🔑 Forgot Password Controller

```javascript
/**
 * FORGOT PASSWORD (Send reset email)
 */
const forgotPassword = asyncHandler(async (req, res) => {
    // Step 1: Get email
    const { email } = req.body
    
    if (!email) {
        throw new ApiError(400, "Email is required")
    }
    
    // Step 2: Find user
    const user = await User.findOne({ email })
    
    if (!user) {
        // Security: Don't reveal if email exists
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "If an account with that email exists, a password reset link has been sent."
            )
        )
    }
    
    // Step 3: Generate reset token
    const resetToken = user.generatePasswordResetToken()
    await user.save({ validateBeforeSave: false })
    
    // Step 4: Send email
    try {
        await sendPasswordResetEmail(email, resetToken)
    } catch (error) {
        // If email fails, clear token
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        
        throw new ApiError(500, "Failed to send password reset email")
    }
    
    // Step 5: Send response
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset link sent to your email"
        )
    )
})

export { forgotPassword }
```

---

## 🔐 Reset Password Controller

```javascript
/**
 * RESET PASSWORD (With token)
 */
const resetPassword = asyncHandler(async (req, res) => {
    // Step 1: Get token and new password
    const { token } = req.query  // or req.params.token
    const { newPassword } = req.body
    
    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required")
    }
    
    // Step 2: Validate password
    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters")
    }
    
    // Step 3: Hash token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    
    // Step 4: Find user with valid token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })
    
    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token")
    }
    
    // Step 5: Update password
    user.password = newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()  // Pre-save hook will hash password
    
    // Step 6: Clear all refresh tokens (logout all devices)
    user.refreshToken = undefined
    await user.save({ validateBeforeSave: false })
    
    // Step 7: Send response
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset successful. Please login with your new password."
        )
    )
})

export { resetPassword }
```

---

## 🛡️ Middleware: Check Email Verified

```javascript
// src/middlewares/emailVerified.middleware.js

import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const checkEmailVerified = asyncHandler(async (req, res, next) => {
    // req.user set by verifyJWT middleware
    
    if (!req.user.isEmailVerified) {
        throw new ApiError(
            403,
            "Please verify your email before accessing this resource"
        )
    }
    
    next()
})
```

---

## 🛣️ Routes (`src/routes/user.routes.js`)

```javascript
import { Router } from "express"
import {
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword
} from "../controllers/user.controller.js"
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/Auth.middleware.js"
import { checkEmailVerified } from "../middlewares/emailVerified.middleware.js"

const router = Router()

// ========================================
// PUBLIC ROUTES
// ========================================

// Registration
router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    registerUser
)

// Email verification
router.route("/verify-email").get(verifyEmail)

// Resend verification email
router.route("/resend-verification").post(resendVerificationEmail)

// Login
router.route("/login").post(loginUser)

// Forgot password
router.route("/forgot-password").post(forgotPassword)

// Reset password
router.route("/reset-password").post(resetPassword)

// ========================================
// PROTECTED ROUTES (Require Login)
// ========================================

router.route("/logout").post(verifyJWT, logoutUser)

// ========================================
// PROTECTED ROUTES (Require Email Verification)
// ========================================

// These routes need both login AND verified email
router.route("/upload-video").post(
    verifyJWT,
    checkEmailVerified,  // ← Email must be verified!
    uploadVideo
)

router.route("/create-playlist").post(
    verifyJWT,
    checkEmailVerified,
    createPlaylist
)

export default router
```

---

# 📚 PART 4: COMPLETE FLOWS

## 🎯 Email Verification Flow

```
USER REGISTERS
        ↓
Backend creates user (isEmailVerified: false)
        ↓
Generate verification token
        ↓
Hash token & save to DB
        ↓
Send unhashed token in email
        ↓
User receives email
        ↓
Clicks link: /verify-email?token=abc123xyz
        ↓
Backend receives token
        ↓
Hash received token
        ↓
Compare with DB hashed token
        ↓
Token valid & not expired?
    ├─ YES → Set isEmailVerified = true
    │        Clear token from DB
    │        Send welcome email
    │        Return success
    │
    └─ NO → Return "Invalid or expired token"
```

---

## 🔄 Password Reset Flow

```
USER FORGETS PASSWORD
        ↓
Enters email on /forgot-password page
        ↓
Frontend: POST /api/v1/users/forgot-password
        ↓
Backend finds user by email
        ↓
Generate reset token
        ↓
Hash & save to DB (expires in 1 hour)
        ↓
Send reset link in email
        ↓
User receives email
        ↓
Clicks link: /reset-password?token=xyz789abc
        ↓
Frontend shows password reset form
        ↓
User enters new password
        ↓
Frontend: POST /api/v1/users/reset-password?token=xyz789abc
Body: { newPassword: "NewPass@123" }
        ↓
Backend hashes token & finds user
        ↓
Token valid & not expired?
    ├─ YES → Update password (hashed by pre-save hook)
    │        Clear reset token from DB
    │        Logout all devices (clear refreshToken)
    │        Return success
    │
    └─ NO → Return "Invalid or expired token"
```

---

# 📚 PART 5: FRONTEND INTEGRATION

## 🎯 Registration Page

```javascript
// React example
import { useState } from 'react'

function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: ''
    })
    const [avatar, setAvatar] = useState(null)
    const [message, setMessage] = useState('')
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const data = new FormData()
        data.append('fullName', formData.fullName)
        data.append('email', formData.email)
        data.append('username', formData.username)
        data.append('password', formData.password)
        data.append('avatar', avatar)
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/users/register', {
                method: 'POST',
                body: data
            })
            
            const result = await response.json()
            
            if (result.success) {
                setMessage('Registration successful! Please check your email to verify your account.')
            } else {
                setMessage(result.message)
            }
        } catch (error) {
            setMessage('Registration failed')
        }
    }
    
    return (
        <div>
            <h2>Register</h2>
            {message && <p>{message}</p>}
            
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
                
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                
                <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
                
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                />
                
                <button type="submit">Register</button>
            </form>
        </div>
    )
}
```

---

## ✅ Email Verification Page

```javascript
// React example
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('verifying')  // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...')
    const navigate = useNavigate()
    
    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token')
            
            if (!token) {
                setStatus('error')
                setMessage('Invalid verification link')
                return
            }
            
            try {
                const response = await fetch(
                    `http://localhost:8000/api/v1/users/verify-email?token=${token}`
                )
                
                const result = await response.json()
                
                if (result.success) {
                    setStatus('success')
                    setMessage('Email verified successfully! Redirecting to login...')
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage(result.message || 'Verification failed')
                }
            } catch (error) {
                setStatus('error')
                setMessage('Verification failed. Please try again.')
            }
        }
        
        verifyEmail()
    }, [searchParams, navigate])
    
    return (
        <div>
            {status === 'verifying' && <p>⏳ {message}</p>}
            {status === 'success' && <p>✅ {message}</p>}
            {status === 'error' && (
                <div>
                    <p>❌ {message}</p>
                    <button onClick={() => navigate('/resend-verification')}>
                        Resend Verification Email
                    </button>
                </div>
            )}
        </div>
    )
}
```

---

## 🔑 Forgot Password Page

```javascript
function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })
            
            const result = await response.json()
            setMessage(result.message)
        } catch (error) {
            setMessage('Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div>
            <h2>Forgot Password</h2>
            {message && <p>{message}</p>}
            
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
        </div>
    )
}
```

---

## 🔐 Reset Password Page

```javascript
function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }
        
        const token = searchParams.get('token')
        
        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/users/reset-password?token=${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newPassword: password })
                }
            )
            
            const result = await response.json()
            
            if (result.success) {
                setMessage('Password reset successful! Redirecting to login...')
                setTimeout(() => navigate('/login'), 3000)
            } else {
                setMessage(result.message)
            }
        } catch (error) {
            setMessage('Password reset failed')
        }
    }
    
    return (
        <div>
            <h2>Reset Password</h2>
            {message && <p>{message}</p>}
            
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                />
                
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                
                <button type="submit">Reset Password</button>
            </form>
        </div>
    )
}
```

---

# 🎓 BEST PRACTICES & SECURITY

## 🔐 Security Considerations

### 1. Token Security
```javascript
// ✅ GOOD: Hash tokens before storing
const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
user.emailVerificationToken = hashedToken

// ❌ BAD: Store plain tokens
user.emailVerificationToken = token  // If DB is compromised, tokens are exposed!
```

### 2. Token Expiry
```javascript
// Always set expiry
emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
passwordResetExpires: Date.now() + 60 * 60 * 1000  // 1 hour
```

### 3. Don't Reveal User Existence
```javascript
// ✅ GOOD: Generic message
if (!user) {
    return res.json({ message: "If account exists, email sent" })
}

// ❌ BAD: Reveals if email exists
if (!user) {
    throw new ApiError(404, "User not found")  // Attackers can enumerate emails!
}
```

### 4. Rate Limiting
```javascript
// Install: npm install express-rate-limit

import rateLimit from 'express-rate-limit'

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 3,  // 3 emails per window
    message: 'Too many email requests, please try again later'
})

// Apply to email routes
router.post('/forgot-password', emailLimiter, forgotPassword)
router.post('/resend-verification', emailLimiter, resendVerificationEmail)
```

### 5. Clear Tokens After Use
```javascript
// After successful verification/reset
user.emailVerificationToken = undefined
user.emailVerificationExpires = undefined
await user.save({ validateBeforeSave: false })
```

---

## 📊 Service Comparison Summary

| Feature | Nodemailer (Gmail) | SendGrid | Resend |
|---------|-------------------|----------|--------|
| **Free Tier** | 500/day | 100/day | 100/day |
| **Reliability** | Medium | High | High |
| **Deliverability** | Medium | High | High |
| **Analytics** | No | Yes | Yes |
| **Templates** | Manual HTML | Yes | React Email |
| **Setup Complexity** | Easy | Medium | Easy |
| **Best For** | Development | Production | Modern apps |

---

## 🎯 Recommendation

**For Development:**
- Use **Nodemailer with Gmail** (quick setup)

**For Production:**
- Use **SendGrid** (reliable, proven)
- OR **Resend** (modern, great DX)

---
# With SQL :

```js
export const verifyEmailsTokensTable = mysqlTable("is_email_valid", {
    id: int().autoincrement().notNull(),
    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id , {onDelete: "cascade"}), // Jab user logout ya delete ho jaega token also gayab
    token: varchar({length: 8}).notNull(),
    expiresAt: timestamp("expires_at")
        .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`)    
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const userTable = mysqlTable("users",{
    id: int().autoincrement().primaryKey(),
    name: varchar({length: 255}).notNull(),
    email: varchar({length: 255}).notNull().unique(),
    password: varchar({length: 255}).notNull(),
    isEmailValid: Boolean("is_email-valid").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
})
```
---

# 1️⃣ Big Picture (Mongo vs SQL – pehle ye clear)

### Mongo (jo tu jaanta hai)

* Collection = table jaisa
* Document = row jaisa
* Schema optional
* Relations manual (ObjectId store karke)

### SQL (yaha MySQL + Drizzle)

* **Table = fixed structure**
* **Row = ek record**
* **Schema mandatory**
* **Relations built-in (foreign keys)**

Drizzle ORM yaha **Mongo ke Mongoose jaisa role** play kar raha hai, bas SQL ke upar.

---

# 2️⃣ `users` table – line by line samajhte hai

```js
export const userTable = mysqlTable("users", {
```

👉 SQL table ka naam **users**
👉 Mongo equivalent: `db.users`

---

```js
id: int().autoincrement().primaryKey(),
```

* `int()` → integer column
* `autoincrement()` → auto generate (1, 2, 3…)
* `primaryKey()` → unique identifier

📌 Mongo equivalent:

```js
_id: ObjectId()
```

---

```js
name: varchar({ length: 255 }).notNull(),
```

* `varchar(255)` → string (max 255 chars)
* `notNull()` → required field

📌 Mongo equivalent:

```js
name: { type: String, required: true }
```

---

```js
email: varchar({ length: 255 }).notNull().unique(),
```

* `unique()` → duplicate email allowed nahi
* Database level protection

📌 Mongo equivalent:

```js
email: { type: String, unique: true }
```

---

```js
password: varchar({ length: 255 }).notNull(),
```

* Hashed password store hota hai
* Length 255 enough for bcrypt hashes

---

```js
isEmailValid: Boolean("is_email-valid").default(false).notNull(),
```

* SQL column name: `is_email-valid`
* JS variable name: `isEmailValid`
* Default value: `false`

📌 Use case:

* Email verification complete hua ya nahi

📌 Mongo equivalent:

```js
isEmailValid: { type: Boolean, default: false }
```

---

```js
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
```

* `createdAt` → record kab bana
* `updatedAt` → last update kab hua
* SQL engine automatically update karega

📌 Mongo equivalent:

```js
timestamps: true
```

---

# 3️⃣ Email verification tokens table (important part)

```js
export const verifyEmailsTokensTable = mysqlTable("is_email_valid", {
```

👉 Separate table just for **email verification tokens**

📌 Mongo me tu usually karta:

```js
emailVerificationToken: String
emailVerificationExpiry: Date
```

📌 SQL me **clean separation**:

* User table clean
* Token table separate

---

```js
id: int().autoincrement().notNull(),
```

Token ka unique id

---

```js
userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
```

🔥 **MOST IMPORTANT SQL CONCEPT**

### Ye kya kar raha hai?

* `user_id` → foreign key
* Ye reference karta hai `users.id`
* `onDelete: "cascade"`

👉 Matlab:

```
Agar user delete hua
→ uske saare email tokens automatically delete
```

📌 Mongo equivalent:

```js
userId: ObjectId("users")
```

(but cascade Mongo me automatic nahi hota)

---

```js
token: varchar({ length: 8 }).notNull(),
```

* 8-character OTP / token
* Example: `839201`

---

```js
expiresAt: timestamp("expires_at")
    .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`)
    .notNull(),
```

🔥 SQL power yaha dikhti hai

* Token automatically expire:

```
createdAt + 1 day
```

📌 Mongo me ye manually calculate karna padta

---

```js
createdAt: timestamp("created_at").defaultNow().notNull(),
```

Token kab bana

---

# 4️⃣ Relation ka visual (easy way)

```
users table
┌──────┬─────────────┐
│ id   │ email       │
├──────┼─────────────┤
│ 1    │ a@gmail.com │
│ 2    │ b@gmail.com │
└──────┴─────────────┘

is_email_valid table
┌──────┬─────────┬────────┐
│ id   │ user_id │ token  │
├──────┼─────────┼────────┤
│ 1    │ 1       │ 839201 │
│ 2    │ 2       │ 123456 │
└──────┴─────────┴────────┘
```

---

# 5️⃣ Packages required (Drizzle + MySQL)

Install ye sab:

```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

📌 Explanation:

* `drizzle-orm` → ORM (mongoose alternative)
* `mysql2` → MySQL driver
* `drizzle-kit` → migrations + schema sync

---

# 6️⃣ Drizzle config file (`drizzle.config.ts`)

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb",
  },
} satisfies Config;
```

---

# 7️⃣ Migration flow (VERY IMPORTANT)

### Step 1️⃣ Generate migration

```bash
npx drizzle-kit generate
```

👉 Ye kya karta?

* Schema compare karta hai
* SQL migration file generate karta hai

---

### Step 2️⃣ Run migration

```bash
npx drizzle-kit migrate
```

👉 Ye kya karta?

* Generated SQL ko database me run karta hai
* Tables create / update ho jaate hai

---

# 8️⃣ Mongo vs SQL mental shift (one liner)

| Mongo           | SQL                  |
| --------------- | -------------------- |
| Flexible schema | Strict schema        |
| ObjectId refs   | Foreign keys         |
| Manual cascade  | Automatic cascade    |
| Schema optional | Schema mandatory     |
| Mongoose hooks  | DB-level constraints |

---

# 9️⃣ When SQL shines more than Mongo

✔ Financial data
✔ Auth systems
✔ Transactions
✔ Relational data
✔ Strong consistency

Mongo best:
✔ Logs
✔ Analytics
✔ Rapid prototyping

---
## emailController.js
```js
import { eq } from 'drizzle-orm';
import { db } from '../db/database.js'; // You'll need to set up your database connection
import { userTable, verifyEmailsTokensTable } from './schema.js';
import { sendVerificationEmail, generateVerificationToken } from './Nodemailer.js';

/**
 * Send verification email to user during login
 */
export const sendEmailVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const existingUser = user[0];

        // Check if email is already verified
        if (existingUser.isEmailValid) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate verification token
        const token = generateVerificationToken();

        // Delete any existing tokens for this user
        await db
            .delete(verifyEmailsTokensTable)
            .where(eq(verifyEmailsTokensTable.userId, existingUser.id));

        // Insert new verification token
        await db.insert(verifyEmailsTokensTable).values({
            userId: existingUser.id,
            token: token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        // Send verification email
        await sendVerificationEmail(existingUser.email, existingUser.name, token);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully. Please check your email.'
        });

    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email'
        });
    }
};

/**
 * Verify email using token
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Find the token in database
        const tokenRecord = await db
            .select()
            .from(verifyEmailsTokensTable)
            .where(eq(verifyEmailsTokensTable.token, token))
            .limit(1);

        if (tokenRecord.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        const tokenData = tokenRecord[0];

        // Check if token is expired
        if (new Date() > tokenData.expiresAt) {
            // Delete expired token
            await db
                .delete(verifyEmailsTokensTable)
                .where(eq(verifyEmailsTokensTable.id, tokenData.id));

            return res.status(400).json({
                success: false,
                message: 'Verification token has expired'
            });
        }

        // Update user email verification status
        await db
            .update(userTable)
            .set({ isEmailValid: true })
            .where(eq(userTable.id, tokenData.userId));

        // Delete the used token
        await db
            .delete(verifyEmailsTokensTable)
            .where(eq(verifyEmailsTokensTable.id, tokenData.id));

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email'
        });
    }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists and email is not verified
        const user = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const existingUser = user[0];

        if (existingUser.isEmailValid) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check if there's already a valid token
        const existingToken = await db
            .select()
            .from(verifyEmailsTokensTable)
            .where(eq(verifyEmailsTokensTable.userId, existingUser.id))
            .limit(1);

        let token;
        if (existingToken.length > 0 && new Date() < existingToken[0].expiresAt) {
            // Use existing valid token
            token = existingToken[0].token;
        } else {
            // Generate new token
            token = generateVerificationToken();

            // Delete any existing tokens
            await db
                .delete(verifyEmailsTokensTable)
                .where(eq(verifyEmailsTokensTable.userId, existingUser.id));

            // Insert new token
            await db.insert(verifyEmailsTokensTable).values({
                userId: existingUser.id,
                token: token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        }

        // Send verification email
        await sendVerificationEmail(existingUser.email, existingUser.name, token);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email'
        });
    }
};
```

`nodeMailer.js`
```js
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Isme 2 methods important hai createTransporter and createTransporter ka sendMail method

// Create transporter - will help to decide konsa SMTP server use karna hai uska data hai yaha pass karte hai
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

/**
 * Generate a random verification token
 */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} username - User's name
 * @param {string} token - Verification token
 */
export const sendVerificationEmail = async (email, username, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Authentication Required',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Welcome ${username}! 🎉</h2>

                <p style="color: #555; line-height: 1.6;">
                    Thank you for logging in. To complete your authentication, please verify your email address by clicking the button below:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 15px 30px; background-color: #4CAF50;
                              color: white; text-decoration: none; border-radius: 5px; font-weight: bold;
                              box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        Verify My Email
                    </a>
                </div>

                <p style="color: #777; font-size: 14px;">
                    Or copy and paste this link in your browser:
                </p>
                <p style="color: #007bff; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                    ${verificationUrl}
                </p>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>Security Notice:</strong> This link will expire in 24 hours for your security.
                        If you didn't request this verification, please ignore this email.
                    </p>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you're having trouble clicking the button, copy and paste the URL above into your browser.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send email verification reminder
 */
export const sendVerificationReminder = async (email, username, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reminder: Please Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Hi ${username},</h2>

                <p style="color: #555; line-height: 1.6;">
                    We noticed you haven't verified your email address yet. Please verify your email to complete your authentication.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 12px 24px; background-color: #2196F3;
                              color: white; text-decoration: none; border-radius: 4px;">
                        Verify Email Now
                    </a>
                </div>

                <p style="color: #999; font-size: 12px;">
                    This link will expire in 24 hours.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Verification reminder sent');
    } catch (error) {
        console.error('❌ Error sending reminder:', error);
    }
};

export { generateVerificationToken };
```

`db.js`
```js
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Create connection
const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database_name',
});

// Create drizzle instance
export const db = drizzle(connection);
```