# إعداد Google OAuth لتسجيل الدخول

## الخطوات المطلوبة:

### 1. إنشاء مشروع في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل "Google Identity Services API"
4. اذهب إلى "Credentials" (بيانات الاعتماد)

### 2. إنشاء OAuth 2.0 Client ID

1. انقر على "Create Credentials" > "OAuth 2.0 Client IDs"
2. اختر "Web application"
3. أضف الـ URIs التالية في "Authorized redirect URIs":
   - `http://localhost:3000/auth/google/callback`
   - `http://localhost:3000`
4. انسخ الـ Client ID

### 3. تحديث الكود

في ملف `frontend/src/config/googleAuth.ts`:
```typescript
export const GOOGLE_AUTH_CONFIG = {
  CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE', // ضع الـ Client ID هنا
  REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  SCOPE: 'openid profile email',
  RESPONSE_TYPE: 'code',
};
```

### 4. إعداد الـ Backend

في الـ Backend، ستحتاج إلى:
1. تثبيت `google-auth-library`
2. إضافة route للتعامل مع Google OAuth callback
3. التحقق من الـ token مع Google
4. إنشاء أو تحديث المستخدم في قاعدة البيانات

### 5. اختبار التدفق

1. اذهب إلى صفحة تسجيل الدخول
2. انقر على "تسجيل الدخول عبر Google"
3. سيتم توجيهك إلى Google
4. بعد الموافقة، ستعود إلى التطبيق مع تسجيل الدخول تلقائياً

## المميزات:

✅ تسجيل دخول آمن عبر Google  
✅ لا حاجة لتذكر كلمة مرور  
✅ التكامل مع النظام الحالي  
✅ دعم المستخدمين الجدد والحاليين  
✅ حفظ الجلسة تلقائياً  

## ملاحظات:

- تأكد من أن الـ Client ID صحيح
- يجب أن يكون الـ redirect URI مطابقاً تماماً
- في الإنتاج، استخدم HTTPS بدلاً من HTTP
- يمكنك تخصيص الـ scopes حسب احتياجاتك
