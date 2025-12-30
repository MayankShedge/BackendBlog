# 🚀 Stripe Payment Integration: Zero-to-Hero Complete Guide

---

## 1️⃣ The Basics (What & Why?)

### 🤔 What is Stripe?

**Stripe** is a payment processing platform that allows businesses to accept payments online. Think of it as the middleman between your application and credit card companies/banks.

**Simple analogy:** 🏪
- **Your App** = Online store
- **Stripe** = Payment terminal/POS system
- **Customer** = Person paying with credit card
- **Bank** = Processes the actual money transfer

**Why use Stripe?**
- ✅ **PCI Compliance**: You don't store sensitive card data (Stripe does)
- ✅ **Global Support**: 135+ currencies, 40+ countries
- ✅ **Developer Friendly**: Excellent documentation & libraries
- ✅ **Multiple Payment Methods**: Cards, Apple Pay, Google Pay, etc.
- ✅ **Built-in Fraud Detection**: Advanced security features

---

### 🆚 Comparison: Stripe vs PayPal vs Other Payment Gateways

| Feature | Stripe | PayPal | Razorpay (India) | Square |
|---------|--------|--------|------------------|--------|
| **Setup Complexity** | Medium | Easy | Medium | Easy |
| **Transaction Fee** | 2.9% + $0.30 | 2.9% + $0.30 | 2% + ₹0 | 2.6% + $0.10 |
| **Developer Experience** | Excellent | Good | Good | Good |
| **UI Customization** | Full control | Limited (redirects) | Good | Medium |
| **International** | 40+ countries | 200+ countries | India-focused | US-focused |
| **Recurring Billing** | Built-in | Built-in | Built-in | Built-in |
| **Best For** | SaaS, E-commerce | Marketplaces | Indian businesses | Physical stores |

**Key Differences:**

**Stripe:**
```javascript
// You control the UI completely
<form onSubmit={handlePayment}>
  <CardElement /> {/* Stripe component */}
  <button>Pay Now</button>
</form>
// User never leaves your site
```

**PayPal:**
```javascript
// User gets redirected to PayPal
<PayPalButton
  onClick={() => window.location.href = "https://paypal.com/checkout/..."}
/>
// User completes payment on PayPal's site
// Then redirected back to your site
```

**When to choose Stripe:**
- ✅ You want full UI control
- ✅ Building a SaaS product
- ✅ Need subscription/recurring billing
- ✅ Want advanced customization

**When to choose PayPal:**
- ✅ Quick setup needed
- ✅ Customers already have PayPal accounts
- ✅ Selling to international markets
- ✅ Marketplace/peer-to-peer payments

---

### 💳 How Stripe Works (High-Level)

```
Customer enters card → Your frontend captures data → Stripe tokenizes card
                                                            ↓
Your backend creates Payment Intent ← Stripe validates & processes
                    ↓
Customer confirms payment → Stripe charges card → Money deposited to your account
```

**Important:** You **NEVER** handle raw card numbers. Stripe's JavaScript library securely sends card data directly to Stripe's servers.

---

## 2️⃣ Line-by-Line Code Breakdown

### 📦 **Initial Setup**

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

**What's happening:**
- `express`: Web framework for Node.js
- `stripe(...)`: Initialize Stripe SDK with your **secret key**
- `process.env.STRIPE_SECRET_KEY`: Secret key from environment variable (NEVER hardcode!)

**Two types of keys:**
```javascript
// SECRET KEY (Backend only - NEVER expose!)
const stripe = require('stripe')('sk_test_...');

// PUBLISHABLE KEY (Frontend - safe to expose)
const stripePublic = Stripe('pk_test_...');
```

**Intent:** Setting up Stripe with authentication to communicate with their API.

---

### 💰 **Endpoint 1: Create Payment Intent**

```javascript
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', description } = req.body;
```

**What's a Payment Intent?**
Think of it as a "reservation" for a payment. You're telling Stripe: *"Hey, I'm about to charge someone $50. Get ready!"*

**Why not charge immediately?**
- ✅ Allows for 3D Secure authentication
- ✅ Supports delayed capture
- ✅ Better error handling
- ✅ Works with modern payment methods (Apple Pay, etc.)

---

```javascript
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
```

**Validation is critical:**
```javascript
// ❌ Without validation
amount: -50 → Customer gets money! (Fraud)
amount: 0 → Free purchase (Loss of revenue)

// ✅ With validation
amount: -50 → Rejected with 400 error
```

---

```javascript
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert dollars to cents
            currency: currency,
            description: description || 'Payment from our app',
        });
```

**Critical detail: Amount in CENTS**
```javascript
// Stripe requires amounts in smallest currency unit

// USD (cents)
$10.50 → 1050 cents
$0.99 → 99 cents

// JPY (yen - no decimals)
¥1000 → 1000 yen (NOT 100000!)

// EUR (cents)
€25.99 → 2599 cents
```

**Why `Math.round()`?**
```javascript
// Floating point can cause issues
10.50 * 100 = 1050.0000000001 (JavaScript precision issue)
Math.round(10.50 * 100) = 1050 ✅
```

**Real scenario:**
```javascript
// Frontend sends:
POST /create-payment-intent
Body: { 
  "amount": 49.99,
  "currency": "usd",
  "description": "Premium Subscription"
}

// Backend creates:
stripe.paymentIntents.create({
  amount: 4999, // $49.99 in cents
  currency: "usd",
  description: "Premium Subscription"
})
```

---

```javascript
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
```

**What's a Client Secret?**
It's a one-time-use token that the frontend needs to complete the payment.

```javascript
// Response to frontend:
{
  "success": true,
  "clientSecret": "pi_3ABC...def_secret_XYZ123",
  "paymentIntentId": "pi_3ABC...def"
}

// Frontend then uses clientSecret with Stripe.js:
stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
})
```

---

### ✅ **Endpoint 2: Confirm Payment**

```javascript
app.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;

        const confirmed = await stripe.paymentIntents.confirm(
            paymentIntentId,
            { payment_method: paymentMethodId }
        );
```

**When to use this endpoint?**

**Option 1: Frontend confirms (Recommended)**
```javascript
// Frontend (React):
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
// No backend call needed for confirmation!
```

**Option 2: Backend confirms (Alternative)**
```javascript
// Frontend sends payment method to backend:
POST /confirm-payment
Body: { 
  "paymentIntentId": "pi_123",
  "paymentMethodId": "pm_456" 
}

// Backend confirms:
stripe.paymentIntents.confirm(paymentIntentId, { payment_method })
```

**Why Option 1 is better:**
- ✅ Faster (one less round trip)
- ✅ Stripe handles 3D Secure automatically
- ✅ Less backend code

---

### 🔍 **Endpoint 3: Retrieve Payment Status**

```javascript
app.get('/payment-status/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
        );

        res.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100, // Convert back to dollars
            currency: paymentIntent.currency,
        });
```

**Payment Intent Statuses:**

```javascript
// Lifecycle of a Payment Intent:

"requires_payment_method" → Customer hasn't entered card yet
                ↓
"requires_confirmation" → Card entered, needs confirmation
                ↓
"requires_action" → 3D Secure authentication required
                ↓
"processing" → Payment is being processed
                ↓
"succeeded" → ✅ Payment successful!

// Or...
"canceled" → Payment was canceled
"requires_capture" → Payment authorized but not captured yet
```

**Real-world usage:**
```javascript
// After payment, redirect to success page:
window.location.href = `/success?payment_intent=${paymentIntentId}`;

// On success page, verify status:
GET /payment-status/pi_123
Response: { status: "succeeded" } ✅

// Show confirmation to user
```

---

### 🎣 **Endpoint 4: Webhooks (CRITICAL for Production)**

```javascript
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
```

**What are Webhooks?**
Stripe sends **automatic notifications** to your server when events happen (payment succeeded, failed, refunded, etc.)

**Why not just check status in frontend?**
```javascript
// ❌ Frontend approach (Unreliable):
if (paymentSucceeded) {
  // User closes browser → Your backend never knows!
  // User manipulates JavaScript → Fake success!
}

// ✅ Webhook approach (Reliable):
// Stripe tells YOUR SERVER directly
// No user interference possible
```

---

```javascript
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return res.sendStatus(400);
    }
```

**Why verify signature?**
```javascript
// Without verification:
// Attacker sends fake webhook:
POST /webhook
Body: { type: "payment_intent.succeeded", data: { amount: 999999 } }
// Your system thinks payment succeeded → You ship product → Loss!

// With verification:
// Stripe signs webhooks with secret key
// Only genuine Stripe webhooks pass verification ✅
```

---

```javascript
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('✅ Payment succeeded:', paymentIntent.id);
            // TODO: Update your database - mark order as paid
            // TODO: Send confirmation email to customer
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ Payment failed:', failedPayment.id);
            // TODO: Update database - mark order as failed
            // TODO: Send failure notification to customer
            break;
```

**Real production implementation:**
```javascript
case 'payment_intent.succeeded':
    const paymentIntent = event.data.object;
    
    // 1. Find order in database
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    
    // 2. Update order status
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    
    // 3. Send confirmation email
    await sendEmail({
        to: order.customerEmail,
        subject: 'Payment Successful!',
        body: `Your order #${order.id} has been confirmed.`
    });
    
    // 4. Trigger fulfillment (shipping, etc.)
    await fulfillmentService.processOrder(order.id);
    break;
```

---

## 3️⃣ Visual Flow Diagrams

### 📊 **Complete Payment Flow**

```
═══════════════════════════════════════════════════════════════════
                    STRIPE PAYMENT FLOW
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: CUSTOMER INITIATES CHECKOUT                             │
└─────────────────────────────────────────────────────────────────┘

   Customer clicks "Buy Now" ($49.99)
              ↓
   ┌──────────────────────┐
   │   Frontend (React)   │
   │  Sends request to    │
   │      backend         │
   └──────────────────────┘
              ↓
   POST /create-payment-intent
   Body: { amount: 49.99, currency: "usd" }


┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: BACKEND CREATES PAYMENT INTENT                          │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐
   │  Backend (Node.js)   │
   │  Receives request    │
   └──────────────────────┘
              ↓
   stripe.paymentIntents.create({
     amount: 4999,  // $49.99 in cents
     currency: "usd"
   })
              ↓
   ┌──────────────────────┐
   │   Stripe API         │
   │  Creates Payment     │
   │  Intent              │
   └──────────────────────┘
              ↓
   Returns: {
     id: "pi_123abc",
     client_secret: "pi_123abc_secret_xyz"
   }
              ↓
   Backend sends client_secret to Frontend


┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CUSTOMER ENTERS CARD DETAILS                            │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐
   │   Frontend (React)   │
   │  Displays card form  │
   └──────────────────────┘
              ↓
   Customer enters:
   - Card number: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVC: 123
              ↓
   ┌──────────────────────────────────────────┐
   │  Stripe.js (Frontend Library)            │
   │  Securely captures card data             │
   │  NEVER sends to your backend!            │
   └──────────────────────────────────────────┘
              ↓
   Card data sent DIRECTLY to Stripe servers
   (Your backend NEVER sees raw card numbers)


┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: PAYMENT CONFIRMATION                                     │
└─────────────────────────────────────────────────────────────────┘

   Frontend calls:
   stripe.confirmCardPayment(client_secret, {
     payment_method: { card: cardElement }
   })
              ↓
   ┌──────────────────────┐
   │   Stripe API         │
   │  Processes payment   │
   └──────────────────────┘
              ↓
   Stripe charges customer's bank
              ↓
   Returns result to Frontend:
   { 
     paymentIntent: { 
       status: "succeeded" 
     } 
   }


┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: WEBHOOK NOTIFICATION (Background)                       │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐
   │   Stripe             │
   │  Sends webhook       │
   └──────────────────────┘
              ↓
   POST https://yoursite.com/webhook
   Body: {
     type: "payment_intent.succeeded",
     data: { object: { id: "pi_123abc", ... } }
   }
              ↓
   ┌──────────────────────┐
   │  Backend (Node.js)   │
   │  Receives webhook    │
   └──────────────────────┘
              ↓
   Verifies signature
              ↓
   Updates database:
   - Mark order as PAID
   - Update inventory
   - Send confirmation email
              ↓
   Returns 200 OK to Stripe


┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: SHOW SUCCESS TO CUSTOMER                                │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐
   │   Frontend (React)   │
   │  Redirect to success │
   │  page                │
   └──────────────────────┘
              ↓
   Display: "Payment Successful! 🎉"
   Order confirmation sent to email
```

---

### 🔄 **Payment Intent Lifecycle**

```
┌───────────────────────────────────────────────────────────────┐
│                   PAYMENT INTENT STATES                        │
└───────────────────────────────────────────────────────────────┘


   CREATE PAYMENT INTENT
            ↓
   ┌─────────────────────────┐
   │ requires_payment_method │ ← Customer hasn't entered card
   └─────────────────────────┘
            ↓
   Customer enters card details
            ↓
   ┌─────────────────────────┐
   │ requires_confirmation   │ ← Card entered, ready to charge
   └─────────────────────────┘
            ↓
   stripe.confirmCardPayment()
            ↓
   ┌─────────────────────────┐
   │   requires_action       │ ← 3D Secure needed (optional)
   └─────────────────────────┘
            ↓
   Customer completes 3DS
            ↓
   ┌─────────────────────────┐
   │      processing         │ ← Charging card...
   └─────────────────────────┘
            ↓
   ┌──────────┬──────────┐
   ↓          ↓          ↓
┌─────────┐ ┌─────────┐ ┌─────────┐
│succeeded│ │ canceled│ │ failed  │
│   ✅     │ │   ⚠️    │ │   ❌     │
└─────────┘ └─────────┘ └─────────┘
   Money       No        Card
   charged    charge    declined
```

---

### 🔒 **Security Architecture**

```
┌───────────────────────────────────────────────────────────────┐
│              WHY STRIPE IS SECURE                              │
└───────────────────────────────────────────────────────────────┘


   ❌ INSECURE (Never do this):
   
   Customer → Enters card → Your Frontend → Your Backend → Bank
                              (Card data exposed to your servers!)


   ✅ SECURE (Stripe way):
   
   Customer → Enters card → Stripe.js → Stripe Servers → Bank
                              ↓
                    Creates token/payment method
                              ↓
                     Your Frontend receives token
                              ↓
                     Your Backend uses token
                     (Never sees actual card data!)


   BENEFITS:
   ✅ You don't store card numbers (PCI compliance easy)
   ✅ Stripe handles card validation
   ✅ Reduced liability for breaches
   ✅ Stripe encrypts all card data
```

---

### 📡 **Webhook Flow**

```
┌───────────────────────────────────────────────────────────────┐
│                    WEBHOOK MECHANISM                           │
└───────────────────────────────────────────────────────────────┘


┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Customer   │         │   Stripe    │         │ Your Server │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ Makes payment         │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │                       │ Processes payment     │
       │                       │─────────┐             │
       │                       │         │             │
       │                       │<────────┘             │
       │                       │                       │
       │                       │ Sends webhook         │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │                       │ Verifies signature
       │                       │                       │─────────┐
       │                       │                       │         │
       │                       │                       │<────────┘
       │                       │                       │
       │                       │                       │ Updates database
       │                       │                       │─────────┐
       │                       │                       │         │
       │                       │                       │<────────┘
       │                       │                       │
       │                       │ Returns 200 OK        │
       │                       │<──────────────────────│
       │                       │                       │
       │ Receives confirmation │                       │
       │<──────────────────────│                       │
       │                       │                       │


   WEBHOOK EVENTS YOU SHOULD HANDLE:
   
   ✅ payment_intent.succeeded → Update order, send email
   ✅ payment_intent.payment_failed → Notify customer
   ✅ charge.refunded → Process refund in your system
   ✅ customer.subscription.deleted → Cancel subscription
```

---

## 4️⃣ Real-World Production Examples

### 🛒 **Example 1: E-Commerce Checkout**

```javascript
// ============================================
// BACKEND: E-Commerce Payment Integration
// ============================================

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

// Mock database
let orders = [];
let products = [
  { id: 1, name: 'iPhone 15 Pro', price: 999.99, stock: 50 },
  { id: 2, name: 'AirPods Pro', price: 249.99, stock: 100 }
];

// ✅ Create order and payment intent
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, customerEmail, shippingAddress } = req.body;
    
    // 1. Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemTotal
      });
    }
    
    // 2. Create order in database
    const order = {
      id: `ORD-${Date.now()}`,
      items: orderItems,
      totalAmount,
      customerEmail,
      shippingAddress,
      status: 'pending',
      createdAt: new Date()
    };
    
    orders.push(order);
    
    // 3. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      description: `Order ${order.id}`,
      metadata: {
        orderId: order.id,
        customerEmail
      },
      receipt_email: customerEmail, // Stripe sends receipt automatically
    });
    
    // 4. Link payment intent to order
    order.paymentIntentId = paymentIntent.id;
    
    res.json({
      success: true,
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const order = orders.find(o => o.paymentIntentId === paymentIntent.id);
      
      if (order) {
        // Update order status
        order.status = 'paid';
        order.paidAt = new Date();
        
        // Update inventory
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            product.stock -= item.quantity;
          }
        });
        
        // Send confirmation email (pseudo-code)
        console.log(`📧 Sending confirmation email to ${order.customerEmail}`);
        // await sendEmail({ to: order.customerEmail, ... });
        
        console.log(`✅ Order ${order.id} marked as paid`);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      const failedOrder = orders.find(o => o.paymentIntentId === failedPayment.id);
      
      if (failedOrder) {
        failedOrder.status = 'payment_failed';
        console.log(`❌ Payment failed for order ${failedOrder.id}`);
        // await sendEmail({ to: failedOrder.customerEmail, subject: 'Payment Failed' });
      }
      break;
  }
  
  res.json({ received: true });
});

app.listen(5000, () => console.log('E-commerce server running on port 5000'));
```

**Frontend (React):**

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

function CheckoutForm({ orderId, clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer Name',
          email: 'customer@example.com'
        }
      }
    });
    
    if (error) {
      alert('Payment failed: ' + error.message);
    } else if (paymentIntent.status === 'succeeded') {
      alert('Payment successful!');
      window.location.href = `/success?orderId=${orderId}`;
    }
    
    setIsProcessing(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm orderId="ORD-123" clientSecret="pi_123_secret_xyz" />
    </Elements>
  );
}
```

---

### 🔄 **Example 2: Subscription/Recurring Billing**

```javascript
// ============================================
// SUBSCRIPTION-BASED PAYMENTS (SaaS)
// ============================================

app.post('/api/create-subscription', async (req, res) => {
  try {
    const { customerEmail, priceId, paymentMethodId } = req.body;
    
    // 1. Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }
    
    // 2. Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }], // e.g., 'price_monthly_9_99'
      expand: ['latest_invoice.payment_intent'],
    });
    
    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
    
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Cancel subscription
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true // Cancel at end of billing period
    });
    
    res.json({
      success: true,
      message: 'Subscription will be canceled at period end',
      cancelAt: subscription.cancel_at
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Webhook for subscription events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('✅ New subscription created');
      // Grant access to premium features
      break;
      
    case 'customer.subscription.updated':
      console.log('🔄 Subscription updated');
      break;
      
    case 'customer.subscription.deleted':
      console.log('❌ Subscription canceled');
      // Revoke premium access
      break;
      
    case 'invoice.payment_succeeded':
      console.log('💰 Invoice paid');
      // Extend subscription period
      break;
      
    case 'invoice.payment_failed':
      console.log('⚠️ Payment failed');
      // Send payment failure email
      // Retry payment after X days
      break;
  }
  
  res.json({ received: true });
});
```

---

### 💸 **Example 3: Refunds & Disputes**

```javascript
// ============================================
// REFUND MANAGEMENT
// ============================================

// ✅ Full refund
app.post('/api/refund', async (req, res) => {
  try {
    const { paymentIntentId, reason } = req.body;
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer' // or 'duplicate', 'fraudulent'
    });
    
    res.json({
      success: true,
      refundId: refund.id,
      status: refund.status, // 'succeeded', 'pending', 'failed'
      amount: refund.amount / 100
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Partial refund
app.post('/api/partial-refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body; // amount in dollars
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100) // Convert to cents
    });
    
    res.json({
      success: true,
      refundId: refund.id,
      refundedAmount: refund.amount / 100
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Webhook for refund events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // ... verify signature ...
  
  switch (event.type) {
    case 'charge.refunded':
      const refund = event.data.object;
      console.log(`Refund processed: $${refund.amount_refunded / 100}`);
      // Update database: mark order as refunded
      break;
  }
  
  res.json({ received: true });
});
```

---

### 🌐 **Example 4: PayPal Integration (Comparison)**

```javascript
// ============================================
// PAYPAL INTEGRATION (Alternative)
// ============================================

const paypal = require('@paypal/checkout-server-sdk');

// Setup PayPal client
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// ✅ Create PayPal order
app.post('/api/paypal/create-order', async (req, res) => {
  const { amount, currency = 'USD' } = req.body;
  
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2) // PayPal uses strings!
      }
    }]
  });
  
  try {
    const order = await client.execute(request);
    res.json({
      success: true,
      orderID: order.result.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Capture PayPal payment
app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderID } = req.body;
  
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  
  try {
    const capture = await client.execute(request);
    res.json({
      success: true,
      status: capture.result.status,
      captureID: capture.result.purchase_units[0].payments.captures[0].id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**PayPal Frontend (React):**

```javascript
import { PayPalButtons } from "@paypal/react-paypal-js";

function PayPalCheckout({ amount }) {
  return (
    <PayPalButtons
      createOrder={(data, actions) => {
        return fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        })
        .then(res => res.json())
        .then(data => data.orderID);
      }}
      onApprove={(data, actions) => {
        return fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: data.orderID })
        })
        .then(res => res.json())
        .then(details => {
          alert('Payment completed!');
        });
      }}
    />
  );
}
```

---

## 5️⃣ Best Practices & Common Pitfalls

### ✅ **Best Practices**

#### 1. **Always Use HTTPS in Production**

```javascript
// ❌ WRONG - HTTP in production
http://yoursite.com/create-payment-intent

// ✅ CORRECT - HTTPS required
https://yoursite.com/create-payment-intent

// Stripe rejects HTTP requests in production
```

---

#### 2. **Store Payment Intent ID in Your Database**

```javascript
// ✅ CORRECT
const order = {
  id: 'ORD-123',
  items: [...],
  totalAmount: 99.99,
  paymentIntentId: 'pi_123abc', // Store this!
  status: 'pending'
};

// Why? So webhook can find the order:
const order = orders.find(o => o.paymentIntentId === paymentIntent.id);
```

---

#### 3. **Handle Webhooks Idempotently**

```javascript
// ❌ WRONG - Webhook called twice = double email
case 'payment_intent.succeeded':
  sendConfirmationEmail(customer);
  break;

// ✅ CORRECT - Check if already processed
case 'payment_intent.succeeded':
  const order = await Order.findOne({ paymentIntentId: event.data.object.id });
  
  if (order.status !== 'paid') { // Only process once
    order.status = 'paid';
    await order.save();
    sendConfirmationEmail(order.customerEmail);
  }
  break;
```

---

#### 4. **Use Metadata for Custom Data**

```javascript
// ✅ Attach custom data to payment
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  metadata: {
    orderId: 'ORD-123',
    customerUserId: 'user_456',
    source: 'mobile_app'
  }
});

// Access in webhook:
console.log(paymentIntent.metadata.orderId); // 'ORD-123'
```

---

#### 5. **Implement Proper Error Handling**

```javascript
// ✅ Handle different error types
try {
  const paymentIntent = await stripe.paymentIntents.create({...});
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined
    res.status(400).json({ error: 'Your card was declined' });
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
    res.status(400).json({ error: 'Invalid payment request' });
  } else {
    // Other errors
    res.status(500).json({ error: 'Payment processing error' });
  }
}
```

---

#### 6. **Test with Stripe Test Cards**

```javascript
// Test cards provided by Stripe:

// ✅ Successful payment
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits

// ❌ Card declined
Card: 4000 0000 0000 0002

// ⚠️ Requires authentication (3D Secure)
Card: 4000 0025 0000 3155

// ❌ Insufficient funds
Card: 4000 0000 0000 9995
```

---

### ⚠️ **Common Pitfalls**

#### 1. **Forgetting to Convert Amount to Cents**

```javascript
// ❌ WRONG - Charges $0.50 instead of $50!
amount: 50 // Stripe interprets as 50 cents

// ✅ CORRECT
amount: 50 * 100 // 5000 cents = $50.00
```

---

#### 2. **Not Verifying Webhook Signatures**

```javascript
// ❌ WRONG - Anyone can fake webhooks!
app.post('/webhook', async (req, res) => {
  const event = req.body; // Accepting blindly!
  // Process payment...
});

// ✅ CORRECT - Verify it's really from Stripe
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send('Invalid signature');
  }
  // Now safe to process...
});
```

---

#### 3. **Using Payment Status from Frontend Only**

```javascript
// ❌ WRONG - Relying only on frontend confirmation
if (paymentSucceeded) {
  // User closes browser → Your system never knows!
  // User manipulates JavaScript → Fake success!
}

// ✅ CORRECT - Use webhooks for source of truth
// Frontend shows immediate feedback
// Webhook updates database (reliable)
```

---

#### 4. **Not Handling 3D Secure**

```javascript
// Some cards require additional authentication

// Frontend must handle this:
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

if (error) {
  // Card declined
  alert(error.message);
} else if (paymentIntent.status === 'requires_action') {
  // 3D Secure required - Stripe.js handles it automatically
  // Just wait for the modal to appear
} else if (paymentIntent.status === 'succeeded') {
  // Payment successful
}
```

---

#### 5. **Exposing Secret Key on Frontend**

```javascript
// ❌ NEVER DO THIS!
// Frontend (React):
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
// Secret key exposed to anyone viewing page source!

// ✅ CORRECT
// Frontend uses publishable key:
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');

// Backend uses secret key:
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

---

#### 6. **Not Using express.raw() for Webhooks**

```javascript
// ❌ WRONG - express.json() breaks signature verification
app.use(express.json()); // This parses body before webhook handler
app.post('/webhook', ...); // Signature verification fails!

// ✅ CORRECT - Use express.raw() only for webhook route
app.post('/webhook', express.raw({type: 'application/json'}), ...);
// Other routes can still use express.json()
```

---

### 🏢 **Enterprise-Level Practices**

#### 1. **Implement Retry Logic for Failed Webhooks**

```javascript
// Stripe retries webhooks automatically, but you should track them

const processedWebhooks = new Set(); // Or use Redis

app.post('/webhook', async (req, res) => {
  const event = /* verify and get event */;
  
  // Check if already processed
  if (processedWebhooks.has(event.id)) {
    return res.json({ received: true });
  }
  
  // Process webhook
  try {
    await handleWebhookEvent(event);
    processedWebhooks.add(event.id);
    res.json({ received: true });
  } catch (error) {
    // Log error but still return 200 to prevent Stripe retries
    console.error('Webhook processing failed:', error);
    res.json({ received: true, error: error.message });
  }
});
```

---

#### 2. **Use Stripe CLI for Local Testing**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:5000/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

#### 3. **Implement Payment Reconciliation**

```javascript
// Daily job to reconcile payments
async function reconcilePayments() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get payments from Stripe
  const payments = await stripe.paymentIntents.list({
    created: { gte: Math.floor(yesterday.getTime() / 1000) }
  });
  
  // Compare with your database
  for (const payment of payments.data) {
    const order = await Order.findOne({ paymentIntentId: payment.id });
    
    if (!order) {
      console.error(`⚠️ Payment ${payment.id} has no corresponding order!`);
    } else if (payment.status === 'succeeded' && order.status !== 'paid') {
      console.error(`⚠️ Payment succeeded but order ${order.id} not marked as paid!`);
      // Fix inconsistency
      order.status = 'paid';
      await order.save();
    }
  }
}

// Run daily
setInterval(reconcilePayments, 24 * 60 * 60 * 1000);
```

---

#### 4. **Monitor Failed Payments**

```javascript
// Track and alert on failed payments
app.post('/webhook', async (req, res) => {
  const event = /* verify */;
  
  if (event.type === 'payment_intent.payment_failed') {
    const payment = event.data.object;
    
    // Log to monitoring service
    logger.error('Payment failed', {
      paymentIntentId: payment.id,
      amount: payment.amount / 100,
      errorCode: payment.last_payment_error?.code,
      errorMessage: payment.last_payment_error?.message
    });
    
    // Alert if many failures
    const failureCount = await getRecentFailureCount();
    if (failureCount > 10) {
      await sendAlertToSlack('High payment failure rate detected!');
    }
  }
  
  res.json({ received: true });
});
```

---

## 6️⃣ Interview Preparation

### 🎯 **Top 15 Stripe/Payment Integration Interview Questions**

---

#### **Q1: Explain the difference between Stripe's secret key and publishable key.**

**Answer:**

| Aspect | Secret Key | Publishable Key |
|--------|------------|-----------------|
| **Prefix** | `sk_test_` or `sk_live_` | `pk_test_` or `pk_live_` |
| **Used On** | Backend/server | Frontend/client |
| **Permissions** | Full API access | Limited operations |
| **Security** | Must be kept secret | Safe to expose publicly |
| **Example Use** | Creating Payment Intents | Initializing Stripe.js |

**Example:**
```javascript
// Backend (Node.js)
const stripe = require('stripe')('sk_test_ABC123'); // Secret key
await stripe.paymentIntents.create({...}); // Full API access

// Frontend (React)
<script src="https://js.stripe.com/v3/"></script>
const stripe = Stripe('pk_test_XYZ789'); // Publishable key
// Can only tokenize cards, cannot create charges
```

**Why this separation?**
- ✅ Limits damage if frontend code is compromised
- ✅ Prevents attackers from creating refunds or accessing customer data
- ✅ Follow least privilege principle

---

#### **Q2: What is a Payment Intent and why is it used?**

**Answer:**
A **Payment Intent** is an object that represents your intent to charge a customer. It tracks the lifecycle of a payment from creation through completion.

**Why use Payment Intent instead of direct charges?**
- ✅ Supports 3D Secure authentication
- ✅ Handles complex payment flows
- ✅ Allows payment method reuse
- ✅ Supports delayed capture (authorize now, charge later)
- ✅ Better error handling

**Lifecycle:**
```javascript
// 1. Create intent (backend)
const intent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd'
});

// 2. Confirm payment (frontend)
await stripe.confirmCardPayment(intent.client_secret, {
  payment_method: { card: cardElement }
});

// 3. Check status
console.log(intent.status); // 'succeeded'
```

---

#### **Q3: Why must amounts be in cents/smallest currency unit?**

**Answer:****Reason:** To avoid floating-point precision issues and ensure accurate calculations.

**Problem with decimals:**
```javascript
// JavaScript floating-point issue
0.1 + 0.2 = 0.30000000000000004 ❌

// With cents (integers)
10 + 20 = 30 ✅
```

**Implementation:**
```javascript
// ✅ Send to Stripe
const amount = 49.99;
stripe.paymentIntents.create({
  amount: Math.round(amount * 100) // 4999 cents
});

// ✅ Display to user
const stripeAmount = 4999;
const dollars = (stripeAmount / 100).toFixed(2); // "49.99"
```

**Currency exceptions:**
```javascript
// Most currencies: multiply by 100
USD: $10.50 → 1050 cents
EUR: €25.99 → 2599 cents

// Zero-decimal currencies: no multiplication!
JPY: ¥1000 → 1000 (already smallest unit)
KRW: ₩5000 → 5000
```

---

#### **Q4: What are webhooks and why are they critical?**

**Answer:**
**Webhooks** are server-to-server notifications that Stripe sends when events occur.

**Why critical?**
```javascript
// ❌ Without webhooks (Unreliable)
Frontend: "Payment succeeded!"
User closes browser → Backend never knows → Order not fulfilled

// ✅ With webhooks (Reliable)
Stripe sends webhook directly to your server
Backend updates database → Order fulfilled
Works even if user closes browser
```

**Important events:**
```javascript
// Must handle:
'payment_intent.succeeded' → Mark order as paid
'payment_intent.payment_failed' → Notify customer
'charge.refunded' → Update inventory
'customer.subscription.deleted' → Revoke access
```

**Security:**
```javascript
// Always verify webhook signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  webhookSecret
);
// Without verification, anyone can send fake webhooks!
```

---

#### **Q5: How do you handle failed payments?**

**Answer:**

**1. Immediate failure handling (Frontend):**
```javascript
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

if (error) {
  // Card declined, insufficient funds, etc.
  showErrorMessage(error.message);
  logFailure(error.code); // 'card_declined', 'insufficient_funds'
}
```

**2. Webhook handling (Backend):**
```javascript
case 'payment_intent.payment_failed':
  const failedPayment = event.data.object;
  
  // 1. Update order status
  await Order.updateOne(
    { paymentIntentId: failedPayment.id },
    { status: 'payment_failed', failureReason: failedPayment.last_payment_error.message }
  );
  
  // 2. Send notification
  await sendEmail({
    to: customer.email,
    subject: 'Payment Failed',
    body: 'Your payment was declined. Please try another payment method.'
  });
  
  // 3. Log for analytics
  logger.error('Payment failed', {
    paymentIntentId: failedPayment.id,
    errorCode: failedPayment.last_payment_error.code
  });
  break;
```

**3. Retry logic for subscriptions:**
```javascript
// Stripe automatically retries failed subscription payments
// Configure retry schedule in Dashboard:
// Day 1, 3, 5, 7 → then cancel

// Handle final failure:
case 'invoice.payment_failed':
  if (invoice.attempt_count >= 4) {
    // Final retry failed
    await cancelSubscription(invoice.subscription);
    await notifyCustomer('Subscription canceled due to payment failure');
  }
  break;
```

---

#### **Q6: What's the difference between test mode and live mode?**

**Answer:**

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| **Keys** | `sk_test_...` / `pk_test_...` | `sk_live_...` / `pk_live_...` |
| **Real Money** | No | Yes |
| **Real Cards** | No (use test cards) | Yes |
| **Dashboard** | Separate test data | Real transactions |
| **Use Case** | Development & testing | Production |

**Test cards:**
```javascript
// Success
4242 4242 4242 4242

// Decline
4000 0000 0000 0002

// 3D Secure required
4000 0025 0000 3155

// All test cards:
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Switching modes:**
```javascript
// Use environment variables
const stripeKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY;

const stripe = require('stripe')(stripeKey);
```

---

#### **Q7: How do you implement refunds?**

**Answer:**

**Full refund:**
```javascript
app.post('/api/refund', async (req, res) => {
  const { paymentIntentId, reason } = req.body;
  
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer' // or 'duplicate', 'fraudulent'
  });
  
  // Update database
  await Order.updateOne(
    { paymentIntentId },
    { 
      status: 'refunded',
      refundId: refund.id,
      refundedAt: new Date()
    }
  );
  
  res.json({ success: true, refundId: refund.id });
});
```

**Partial refund:**
```javascript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: 1000 // Refund $10 of $50 charge
});
```

**Webhook handling:**
```javascript
case 'charge.refunded':
  const charge = event.data.object;
  console.log(`Refunded: $${charge.amount_refunded / 100}`);
  
  // If partial refund
  if (charge.amount_refunded < charge.amount) {
    // Handle partial refund
  } else {
    // Full refund - restore inventory
  }
  break;
```

---

#### **Q8: How do you secure payment endpoints?**

**Answer:**

**1. Use HTTPS**
```javascript
// Production must use HTTPS
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect('https://' + req.headers.host + req.url);
}
```

**2. Validate input**
```javascript
app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;
  
  // Validate amount
  if (!amount || amount <= 0 || amount > 999999) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  // Validate currency
  const validCurrencies = ['usd', 'eur', 'gbp'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  
  // Proceed...
});
```

**3. Implement authentication**
```javascript
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/create-payment-intent', requireAuth, async (req, res) => {
  // Only authenticated users can create payments
});
```

**4. Rate limiting**
```javascript
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // Max 5 payment attempts
});

app.post('/create-payment-intent', paymentLimiter, async (req, res) => {
  // Prevents brute force attacks
});
```

**5. Verify webhook signatures**
```javascript
// Already covered in Q4
```

---

#### **Q9: What's the difference between Stripe.js and the Stripe SDK?**

**Answer:**

| Feature | Stripe.js | Stripe Node.js SDK |
|---------|-----------|---------------------|
| **Used On** | Frontend (Browser) | Backend (Server) |
| **Language** | JavaScript | Node.js |
| **Purpose** | Tokenize cards securely | Create charges, refunds, etc. |
| **Key Type** | Publishable key | Secret key |
| **PCI Compliance** | Handles it for you | N/A (doesn't touch cards) |

**Stripe.js (Frontend):**
```javascript
// Load library
<script src="https://js.stripe.com/v3/"></script>

// Initialize
const stripe = Stripe('pk_test_...');

// Create card element
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Confirm payment
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

**Stripe SDK (Backend):**
```javascript
// Install
npm install stripe

// Initialize
const stripe = require('stripe')('sk_test_...');

// Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd'
});

// Create refund
const refund = await stripe.refunds.create({
  payment_intent: paymentIntent.id
});
```

---

#### **Q10: How do you handle subscriptions?**

**Answer:**

**Creating a subscription:**
```javascript
// 1. Create customer (or retrieve existing)
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  payment_method: paymentMethodId,
  invoice_settings: {
    default_payment_method: paymentMethodId
  }
});

// 2. Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [
    { price: 'price_monthly_9_99' } // Created in Stripe Dashboard
  ],
  expand: ['latest_invoice.payment_intent']
});

// 3. Return client secret for confirmation
res.json({
  subscriptionId: subscription.id,
  clientSecret: subscription.latest_invoice.payment_intent.client_secret
});
```

**Handling subscription events:**
```javascript
case 'customer.subscription.created':
  // Grant access to premium features
  await User.updateOne({ customerId }, { isPremium: true });
  break;

case 'customer.subscription.updated':
  // Handle plan changes
  break;

case 'customer.subscription.deleted':
  // Revoke premium access
  await User.updateOne({ customerId }, { isPremium: false });
  break;

case 'invoice.payment_succeeded':
  // Subscription renewed successfully
  await extendSubscription(customerId);
  break;

case 'invoice.payment_failed':
  // Payment failed - Stripe will retry
  if (invoice.attempt_count >= 3) {
    await notifyCustomer('Update your payment method');
  }
  break;
```

---

#### **Q11: How do you test webhooks locally?**

**Answer:**

**Method 1: Stripe CLI (Recommended)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:5000/webhook

# Get webhook signing secret
# Copy the signing secret and add to .env

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

**Method 2: ngrok**
```bash
# Install ngrok
brew install ngrok

# Start your local server
node server.js

# Expose to internet
ngrok http 5000

# Use ngrok URL in Stripe Dashboard
# https://abc123.ngrok.io/webhook
```

**Method 3: Mock webhooks**
```javascript
// For unit tests
const mockWebhook = {
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_123',
      amount: 5000,
      status: 'succeeded'
    }
  }
};

// Test your webhook handler
await handleWebhook(mockWebhook);
```

---

#### **Q12: What are the common Stripe error codes?**

**Answer:**

```javascript
// Card errors
'card_declined' → Generic decline
'insufficient_funds' → Not enough money
'lost_card' → Card reported lost
'stolen_card' → Card reported stolen
'expired_card' → Card expired
'incorrect_cvc' → Wrong CVC/CVV
'processing_error' → Try again
'incorrect_number' → Invalid card number

// API errors
'invalid_request_error' → Bad parameters
'api_error' → Stripe server issue
'authentication_error' → Invalid API key
'rate_limit_error' → Too many requests

// Handling:
try {
  const payment = await stripe.paymentIntents.create({...});
} catch (error) {
  switch (error.code) {
    case 'card_declined':
      return res.status(400).json({ error: 'Your card was declined' });
    case 'insufficient_funds':
      return res.status(400).json({ error: 'Insufficient funds' });
    case 'expired_card':
      return res.status(400).json({ error: 'Your card has expired' });
    default:
      return res.status(500).json({ error: 'Payment processing error' });
  }
}
```

---

#### **Q13: How do you handle currency conversion?**

**Answer:**

**Option 1: Charge in customer's currency**
```javascript
// Detect customer location
const customerCountry = req.headers['cf-ipcountry']; // Cloudflare
const currency = getCurrencyForCountry(customerCountry);

const paymentIntent = await stripe.paymentIntents.create({
  amount: convertAmount(100, 'usd', currency), // Convert $100 to target currency
  currency: currency // 'eur', 'gbp', etc.
});
```

**Option 2: Let Stripe handle conversion**
```javascript
// Create presentment currency (what customer sees)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100 USD
  currency: 'usd',
  payment_method_options: {
    card: {
      request_three_d_secure: 'any'
    }
  }
});

// Stripe converts automatically based on card currency
```

**Option 3: Use third-party API for rates**
```javascript
const exchangeRate = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
const rate = exchangeRate.rates['EUR'];
const amountInEUR = 100 * rate; // Convert $100 to EUR
```

---

#### **Q14: What's the difference between one-time payments and subscriptions?**

**Answer:**

| Aspect | One-Time Payment | Subscription |
|--------|------------------|--------------|
| **Frequency** | Single charge | Recurring |
| **Stripe Object** | PaymentIntent | Subscription + Invoice |
| **Use Case** | E-commerce | SaaS, memberships |
| **Retry Logic** | Manual | Automatic |
| **Cancellation** | N/A | Can cancel anytime |

**One-time payment:**
```javascript
// Single charge for product
const payment = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd'
});
```

**Subscription:**
```javascript
// Recurring billing
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_9_99' }],
  // Charges automatically every month
});
```

**Hybrid approach (Usage-based billing):**
```javascript
// Base subscription + usage charges
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [
    { price: 'price_base_10' }, // $10/month base
    { price: 'price_per_api_call_0_01' } // $0.01 per API call
  ]
});

// Report usage
await stripe.subscriptionItems.createUsageRecord(
  'si_ABC123',
  { quantity: 1000 } // 1000 API calls this month
);
```

---

#### **Q15: How do you migrate from test to production?**

**Answer:**

**1. Get production keys**
```javascript
// Stripe Dashboard → Developers → API Keys
// Copy live keys (sk_live_... and pk_live_...)
```

**2. Update environment variables**
```bash
# .env.production
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

**3. Update webhook endpoints**
```bash
# In Stripe Dashboard:
# Developers → Webhooks → Add endpoint
# URL: https://yourproductiondomain.com/webhook
# Events: payment_intent.succeeded, payment_intent.payment_failed, etc.
```

**4. Configure production settings**
```javascript
// Dynamic key selection
const stripeKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY;

const stripe = require('stripe')(stripeKey);
```

**5. Test in production**
```javascript
// Make a real $0.50 test charge
// Then immediately refund it
const payment = await stripe.paymentIntents.create({
  amount: 50, // $0.50
  currency: 'usd'
});

// Verify webhook received
// Then refund
await stripe.refunds.create({ payment_intent: payment.id });
```

**6. Monitor in production**
```javascript
// Set up monitoring
// - Failed payment alerts
// - Webhook delivery failures
// - High refund rates
```

---

## 7️⃣ Cheat Sheet / Summary

### 🔥 **Quick Reference Guide**

---

### **Basic Setup**

```javascript
// Install
npm install stripe

// Backend setup
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Frontend setup
<script src="https://js.stripe.com/v3/"></script>
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
```

---

### **Create Payment Intent**

```javascript
// Backend
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Dollars to cents
    currency: 'usd'
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

---

### **Confirm Payment (Frontend)**

```javascript
// React with Stripe Elements
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripe = useStripe();
const elements = useElements();

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement)
    }
  });
  
  if (error) {
    console.error(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!');
  }
};
```

---

### **Webhook Handler**

```javascript
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update database, send email
      break;
    case 'payment_intent.payment_failed':
      // Handle failure
      break;
  }
  
  res.json({ received: true });
});
```

---

### **Common Operations**

```javascript
// Get payment status
const paymentIntent = await stripe.paymentIntents.retrieve('pi_123');
console.log(paymentIntent.status); // 'succeeded', 'processing', 'requires_action'

// Create refund
const refund = await stripe.refunds.create({
  payment_intent: 'pi_123',
  amount: 1000 // Optional - full refund if omitted
});

// Create customer
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe'
});

// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_123' }]
});
```

---

### **Test Cards**

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995

All test cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits
```

---

### **Currency Conversion**

```javascript
// Always use smallest unit
USD: $10.50 → 1050 cents (multiply by 100)
EUR: €25.99 → 2599 cents (multiply by 100)
JPY: ¥1000 → 1000 yen (NO multiplication!)
```

---

### **Payment Intent Statuses**

```
requires_payment_method → Card not entered yet
requires_confirmation → Ready to charge
requires_action → 3D Secure needed
processing → Being processed
succeeded → Payment complete ✅
canceled → Payment canceled
requires_capture → Authorized but not captured
```

---

### **Environment Variables**

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### **Error Handling**

```javascript
try {
  const payment = await stripe.paymentIntents.create({...});
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  } else {
    // Other error
  }
}
```

---

### **Security Checklist**

```
✅ Use HTTPS in production
✅ Verify webhook signatures
✅ Use environment variables for keys
✅ Never expose secret key
✅ Validate all inputs
✅ Implement rate limiting
✅ Handle errors properly
✅ Test with Stripe CLI
```

---

### **Production Checklist**

```
✅ Switch to live API keys
✅ Update webhook endpoints
✅ Test real payment ($0.50)
✅ Set up monitoring/alerts
✅ Configure retry logic
✅ Implement reconciliation
✅ Add logging
✅ Handle all webhook events
```

---

### **Stripe CLI Commands**

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/webhook

# Trigger events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

---
