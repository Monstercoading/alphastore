# دليل إعداد Google OAuth لتطبيق Alpha Store

## الخطوة 1: إنشاء مشروع في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. سجل دخول بحسابك
3. انقر على "Select a project" > "NEW PROJECT"
4. أسمي المشروع: "Alpha Store"
5. انقر "CREATE"

## الخطوة 2: تفعيل Google Identity Services API

1. من القائمة اليسرى، اذهب إلى "APIs & Services" > "Library"
2. ابحث عن "Google Identity Services API"
3. انقر عليه ثم اضغط "ENABLE"

## الخطوة 3: إنشاء OAuth 2.0 Client ID

1. اذهب إلى "APIs & Services" > "Credentials"
2. انقر "+ CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"
3. إذا طلب تكوين شاشة الموافقة (OAuth consent screen):
   - اختر "External"
   - اضغط "CREATE"
   - **App name**: Alpha Store
   - **User support email**: arabcraftsmp@gmail.com
   - **Developer contact information**: arabcraftsmp@gmail.com
   - اضغط "SAVE AND CONTINUE"
   - في "Scopes"، اضغط "SAVE AND CONTINUE"
   - في "Test users"، اضغط "+ ADD USERS"
   - أضف: arabcraftsmp@gmail.com
   - اضغط "SAVE AND CONTINUE" ثم "BACK TO DASHBOARD"

4. الآن أنشئ الـ Client ID:
   - **Application type**: Web application
   - **Name**: Alpha Store Web Client
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/google/callback
     ```
   - اضغط "CREATE"

## الخطوة 4: الحصول على Client ID

1. بعد إنشاء الـ Client ID، ستحصل على:
   - **Client ID**: (انسخ هذا الرقم الطويل)
   - **Client Secret**: (انسخ هذا أيضاً)

## الخطوة 5: تحديث الكود

في ملف `frontend/src/context/AuthContext.tsx`، استبدل:

```typescript
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=YOUR_GOOGLE_CLIENT_ID&` +
  `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/google/callback')}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('openid profile email')}&` +
  `access_type=offline&` +
  `prompt=consent`;
```

باستبدال `YOUR_GOOGLE_CLIENT_ID` بالـ Client ID الفعلي:

```typescript
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=123456789-abcdefghijklmnop.apps.googleusercontent.com&` +
  `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/google/callback')}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('openid profile email')}&` +
  `access_type=offline&` +
  `prompt=consent`;
```

## الخطوة 6: إعداد الـ Backend (مهم جداً)

في الـ Backend، ستحتاج إلى إضافة route للتعامل مع callback:

```javascript
// في backend/routes/auth.js
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    
    // استبدل هذه القيم بالقيم الفعلية
    const CLIENT_ID = 'your-client-id';
    const CLIENT_SECRET = 'your-client-secret';
    const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
    
    // استبدل الكود بـ token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    // احصل على معلومات المستخدم
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    
    // أنشئ أو حدّث المستخدم في قاعدة البيانات
    // وأرجع JWT token
    
    res.json({
      token: 'your-jwt-token',
      user: userData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Google auth failed' });
  }
});
```

## الخطوة 7: الاختبار

1. أعد تشغيل تطبيق الـ Frontend: `npm start`
2. اذهب إلى صفحة تسجيل الدخول
3. انقر على "تسجيل الدخول عبر Google"
4. يجب أن يعمل الآن!

## ملاحظات هامة:

- تأكد من أن `http://localhost:3000/auth/google/callback` مضاف في Authorized redirect URIs
- تأكد من أن `arabcraftsmp@gmail.com` مضاف في Test users
- في الإنتاج، استخدم `https` بدلاً من `http`
- احتفظ بـ Client Secret آمناً ولا تضعه في الكود الأمامي

## إذا واجهت مشاكل:

1. تحقق من أن Client ID صحيح
2. تحقق من أن redirect URI مطابق تماماً
3. تأكد من أن المستخدم مضاف في Test users
4. تحقق من أن Google Identity Services API مفعّل
