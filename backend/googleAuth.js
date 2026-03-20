const express = require('express');
const { google } = require('googleapis');
const { formatGoogleUser } = require('./nameUtils');

const router = express.Router();

// إعدادات Google OAuth من متغيرات البيئة
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// IMPORTANT: This must match the redirect_uri used in frontend Google OAuth flow
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://silver-frangipane-2ddeca.netlify.app/auth/google/callback';

// التحقق من وجود المتغيرات
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
}

// إنشاء OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Endpoint للتعامل مع Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔄 Google OAuth request received');
    console.log('📍 REDIRECT_URI being used:', REDIRECT_URI);
    console.log('🔑 CLIENT_ID exists:', !!CLIENT_ID);
    console.log('🔐 CLIENT_SECRET exists:', !!CLIENT_SECRET);

    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // استبدال الكود بـ tokens
    console.log('🔄 Exchanging code for tokens...');
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('✅ Tokens received successfully');
    } catch (tokenError) {
      console.error('❌ Token exchange failed:');
      console.error('   Error message:', tokenError.message);
      console.error('   Error response:', tokenError.response?.data);
      throw new Error(`Token exchange failed: ${tokenError.message}`);
    }
    
    oauth2Client.setCredentials(tokens);

    // الحصول على معلومات المستخدم
    console.log('🔄 Fetching user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    console.log('✅ User info received:', data.email);

    // معالجة وتنسيق بيانات المستخدم
    const googleUser = formatGoogleUser(data);
    console.log('✅ User formatted:', googleUser.email);

    // إنشاء JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: googleUser._id,
        email: googleUser.email,
        role: googleUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token created');
    
    res.json({
      success: true,
      user: googleUser,
      token: token,
      message: 'Google authentication successful'
    });

  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    console.error('❌ Full error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Google authentication failed',
      error: error.message,
      details: error.response?.data || null
    });
  }
});

module.exports = router;
