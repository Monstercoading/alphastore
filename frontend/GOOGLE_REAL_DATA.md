# كيفية الحصول على بيانات Google الحقيقية

## المشكلة الحالية
نحن نستخدم بيانات وهمية ثابتة:
- الإيميل: `arabcraftsmp@gmail.com`
- الاسم: `Arab Crafts`

## الحل الحقيقي (يتطلب Backend)

### 1. في Backend، أنشئ endpoint لـ Google OAuth:

```javascript
// في backend/routes/auth.js
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/auth/google/callback'
    );
    
    // استبدال الكود بـ tokens
    const { tokens } = await client.getToken(code);
    
    // الحصول على معلومات المستخدم
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const googleUser = {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
    
    res.json({
      user: googleUser,
      token: 'your-jwt-token'
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Google auth failed' });
  }
});
```

### 2. في Frontend، استبدل المحاكاة بـ API call:

```javascript
// في GoogleCallback.tsx
const response = await fetch('http://localhost:5000/api/auth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ code }),
});

const data = await response.json();
const googleUser = data.user;
```

## الحل المؤقت (للتجربة فقط)

يمكنك تعديل الإيميل والاسم يدوياً في GoogleCallback.tsx:

```javascript
const googleUserData = {
  email: 'your-real-email@gmail.com', // غير هذا لإيميلك
  firstName: 'YourFirstName',        // غير هذا لاسمك
  lastName: 'YourLastName',         // غير هذا لاسم عائلتك
};
```

## ملاحظات هامة

- الحل الحقيقي يتطلب Backend يعمل مع Google OAuth API
- الآن نستخدم محاكاة للتطوير السريع
- في الإنتاج، يجب استخدام الـ API الحقيقي
