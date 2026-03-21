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
let mongoConnected = false;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    mongoConnected = true;
  })
  .catch(err => {
    console.log('⚠️ MongoDB not connected:', err.message);
    mongoConnected = false;
  });
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
    mongo_connected: mongoConnected,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Register endpoint with duplicate check
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        message: 'جميع الحقول مطلوبة',
        error: 'All fields are required'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'صيغة البريد الإلكتروني غير صحيحة',
        error: 'Invalid email format'
      });
    }
    
    // Check if user exists - Return 409 Conflict
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists',
        message: 'هذا الحساب مسجل لدينا بالفعل، يرجى تسجيل الدخول',
        redirectToLogin: true 
      });
    }
    
    // Create new user
    const newUser = new User({
      email,
      password: password || '',
      firstName,
      lastName,
      role: 'user'
    });
    
    await newUser.save();
    
    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        name: newUser.firstName + ' ' + newUser.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const userWithoutPassword = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role
    };
    
    res.status(201).json({ 
      success: true,
      message: 'تم إنشاء الحساب بنجاح!',
      user: userWithoutPassword, 
      token: token
    });
  } catch (err) {
    console.error('❌ Register Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register user', 
      message: err.message 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب',
        error: 'Email is required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        error: 'Invalid credentials'
      });
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
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح!',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token: token
    });
  } catch (err) {
    console.error('❌ Login Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: err.message
    });
  }
});

// Real Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔍 Received Google OAuth request');
    console.log('🔍 Code present:', !!code);
    console.log('🔍 CLIENT_ID:', CLIENT_ID ? 'Set' : 'Not set');
    console.log('🔍 CLIENT_SECRET:', CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('🔍 REDIRECT_URI:', REDIRECT_URI);
    
    if (!code) {
      console.error('❌ No authorization code provided');
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
    let user = null;
    let isNewUser = false;
    
    if (mongoConnected) {
      user = await User.findOne({ email: data.email });
      
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
    } else {
      // Fallback to mock data if MongoDB not connected
      user = {
        _id: data.id,
        email: data.email,
        firstName: data.given_name || data.name?.split(' ')[0] || 'User',
        lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        role: 'user'
      };
      isNewUser = true;
      console.log('⚠️ MongoDB not connected, using mock user data');
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
    console.error('❌ Google OAuth Error Details:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Google OAuth configured for: ${REDIRECT_URI}`);
});
