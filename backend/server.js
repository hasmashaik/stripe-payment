const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/razorpay_payments')
.then(() => console.log('✅ MongoDB connected to "razorpay_payments" database'))
.catch(err => console.error('❌ MongoDB error:', err));

// Payment Schema
const paymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: String,
  amount: { type: Number, required: true },
  productName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  status: { type: String, default: 'created' }, // created, paid, failed
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. Create Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, productName, customerName, customerEmail, customerPhone } = req.body;
    
    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    // Save to REAL database
    const payment = new Payment({
      razorpayOrderId: order.id,
      amount: amount,
      productName: productName,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      status: 'created'
    });
    
    await payment.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: amount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Verify Payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Get payment details from Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      
      // Update in REAL database
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          razorpayPaymentId: razorpay_payment_id,
          status: 'paid',
          paymentMethod: paymentDetails.method,
          updatedAt: Date.now()
        }
      );
      
      res.json({ 
        success: true, 
        message: 'Payment verified and saved to database',
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get All Payments from Database
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Backend running',
    database: 'razorpay_payments',
    gateway: 'Razorpay'
  });
});

app.listen(5000, () => {
  console.log('\n💰 RAZORPAY PAYMENT BACKEND');
  console.log('============================');
  console.log('✅ Server: http://localhost:5000');
  console.log('🗄️  Database: razorpay_payments');
  console.log('💳 Test Card: 4111 1111 1111 1111');
  console.log('============================\n');
});