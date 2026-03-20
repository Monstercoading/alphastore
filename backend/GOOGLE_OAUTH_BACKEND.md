# إعداد Google OAuth في Backend

## تثبيت المكتبات المطلوبة

```bash
npm install google-auth-library
```

## إضافة Route في backend/routes/auth.js

```javascript
const { OAuth2Client } = require('google-auth-library');

// إضافة هذه المتغيرات في الأعلى
const GOOGLE_CLIENT_ID = 'your-client-id-here';
const GOOGLE_CLIENT_SECRET = 'your-client-secret-here';
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// إضافة هذا الـ route
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    
    // استبدال الكود بـ tokens
    const { tokens } = await oAuth2Client.getToken(code);
    
    // الحصول على معلومات المستخدم
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const googleUser = {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
    
    // البحث عن المستخدم أو إنشاؤه
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      user = new User({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        role: 'user',
      });
      await user.save();
    }
    
    // إنشاء JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'فشل تسجيل الدخول عبر Google' });
  }
});
```

## إضافة الـ Route في backend/server.js

```javascript
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

## متغيرات البيئة في .env

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
JWT_SECRET=your-jwt-secret-here
```

## اختبار الـ Backend

1. أعد تشغيل الـ Backend
2. استخدم Postman لاختبار:
   - POST to `http://localhost:5000/api/auth/google`
   - Body: `{ "code": "authorization-code-from-google" }`
