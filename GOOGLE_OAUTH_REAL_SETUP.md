# دليل إعداد Google OAuth الحقيقي

## الخطوة 1: الحصول على Client Secret

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. ابحث عن OAuth Client ID الخاص بك
3. انقر على أيقونة التنزيل (Download JSON) أو انسخ الـ Client Secret

## الخطوة 2: إعداد Backend

### تثبيت المكتبات المطلوبة:
```bash
cd backend
npm install express googleapis cors
```

### إنشاء ملف server.js:
```javascript
const express = require('express');
const cors = require('cors');
const googleAuthRoutes = require('./googleAuth');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', googleAuthRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### تحديث googleAuth.js:
- استبدل `YOUR_CLIENT_SECRET_HERE` بالـ Client Secret الفعلي

## الخطوة 3: تشغيل Backend

```bash
cd backend
node server.js
```

## الخطوة 4: تحديث Frontend

استبدل دالة `getGoogleUserInfoFrontend` بـ:

```javascript
export const getGoogleUserInfo = async (code: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
};
```

## الخطوة 5: اختبار النظام

1. شغل Backend على port 5000
2. شغل Frontend على port 3000
3. اذهب إلى `/login`
4. انقر على "تسجيل الدخول عبر Google"
5. ستحصل على بيانات Google الفعلية

## ملاحظات هامة

- يجب أن يكون Backend يعمل أثناء الاختبار
- Client Secret يجب أن يكون سرياً ولا يوضع في Frontend
- في الإنتاج، استخدم HTTPS بدلاً من HTTP
- يمكنك حفظ بيانات المستخدم في قاعدة بيانات حقيقية

## المشاكل الشائعة

1. **"invalid_client"**: تأكد من Client ID و Client Secret صحيحين
2. **"redirect_uri_mismatch"**: تأكد من أن الـ Redirect URI مطابق تماماً
3. **CORS errors**: تأكد من أن Backend يسمح بـ requests من Frontend
