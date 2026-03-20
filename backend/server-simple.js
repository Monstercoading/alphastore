const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection (optional, for user lookup)
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('⚠️ MongoDB not connected:', err.message));
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Google OAuth Config
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://alphastore-vert.vercel.app/auth/google/callback';

// CORS
const corsOptions = {
  origin: '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Test endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    healthy: true,
    mongo_connected: false,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Real Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    console.log('🔄 Exchanging code for tokens...');
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('✅ Tokens received');

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    console.log('✅ User info received:', data.email);

    // Check if user exists in database
    let user = await User.findOne({ email: data.email });
    let isNewUser = false;
    
    if (!user) {
      // Create new user if not exists
      user = new User({
        email: data.email,
        firstName: data.given_name || data.name?.split(' ')[0] || 'User',
        lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        role: 'user'
      });
      await user.save();
      isNewUser = true;
      console.log('✅ New user created:', user.email);
    } else {
      console.log('✅ Existing user logged in:', user.email);
    }

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data
    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: data.picture,
        role: user.role
      },
      token: token,
      isNewUser: isNewUser,
      message: isNewUser ? 'Account created successfully' : 'Login successful'
    });

  } catch (error) {
    console.error('❌ Google OAuth Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Google OAuth configured for: ${REDIRECT_URI}`);
});
