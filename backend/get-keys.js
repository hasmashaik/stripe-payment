// Simple script to test if we can use Stripe
const Stripe = require('stripe');

// Try different test keys
const testKeys = [
  '',  // Original (expired)
  '',  // Alternative 1
  '',  // Alternative 2 (dummy - will fail)
];

console.log('🔑 Testing Stripe keys...\n');

for (let i = 0; i < testKeys.length; i++) {
  const key = testKeys[i];
  console.log(`Testing key ${i + 1}: ${key.substring(0, 20)}...`);
  
  try {
    const stripe = new Stripe(key);
    // Test a simple API call
    await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      payment_method_types: ['card'],
    });
    
    console.log(`✅ KEY ${i + 1} WORKS! Use this: ${key}\n`);
    break;
  } catch (error) {
    console.log(`❌ Key ${i + 1} failed: ${error.message}\n`);
  }
}