const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock payment endpoint - NO STRIPE NEEDED
app.post('/api/pay', (req, res) => {
  console.log('💳 Mock payment request:', req.body);
  
  const { amount, product } = req.body;
  
  // Generate fake client secret
  const mockClientSecret = `pi_mock_${Date.now()}_secret_mock_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`✅ Mock payment created for ${product}: $${amount}`);
  console.log('🔐 Mock client secret:', mockClientSecret);
  
  // Always succeed in mock mode
  res.json({
    success: true,
    clientSecret: mockClientSecret,
    paymentId: `pi_mock_${Date.now()}`,
    isMock: true,
    message: 'Mock payment - no real charge'
  });
});

app.get('/', (req, res) => {
  res.json({
    status: '✅ Mock server running',
    mode: 'TEST/DEV',
    endpoints: {
      pay: 'POST /api/pay',
      note: 'This is a mock server for testing'
    }
  });
});

app.listen(5000, () => {
  console.log('\n🎭 MOCK STRIPE SERVER');
  console.log('🔗 http://localhost:5000');
  console.log('💳 Endpoint: POST /api/pay');
  console.log('📝 Note: This is a mock - no real payments');
  console.log('✅ Always returns success for testing\n');
});