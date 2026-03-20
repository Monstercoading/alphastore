# Alpha Store - متجر حسابات الألعاب

متجر إلكتروني لشراء وبيع حسابات الألعاب مع واجهة حديثة ولوحة تحكم كاملة.

## ✨ المميزات

- 🔐 **نظام مصادقة آمن** - تسجيل المستخدمين وتسجيل الدخول مع JWT
- 🎮 **عرض حسابات الألعاب** - تصفح جميع الحسابات المتاحة
- 🔍 **بحث وتصفية** - فلترة حسب المنصة والمنطقة
- 📸 **رفع الصور** - إمكانية إضافة صور متعددة للحسابات
- 🛒 **نظام طلبات** - طلب وشراء حسابات الألعاب
- 👑 **لوحة تحكم المدير** - إدارة كاملة للحسابات والطلبات والمستخدمين
- 📱 **تصميم متجاوب** - يعمل على جميع الأجهزة
- 🌐 **واجهة عربية بالكامل** - كل النصوص والعناوين باللغة العربية

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
- **React 18** مع TypeScript
- **Tailwind CSS** للتصميم
- **React Router** للتوجيه بين الصفحات
- **Axios** للاتصال بالـ API
- **React Context** لإدارة الحالة
- **HTML5** و **CSS3**

### الواجهة الخلفية (Backend)
- **Node.js** مع Express.js
- **MongoDB** مع Mongoose
- **JWT** للمصادقة
- **Multer** لرفع الملفات
- **bcryptjs** لتشفير كلمات المرور
- **CORS** للسماح بالاتصال المتقاطع

## 📦 المتطلبات

- Node.js 16 أو أحدث
- npm أو yarn
- MongoDB 4.4 أو أحدث

## 🚀 التثبيت والتشغيل

1. **تثبيت المتطلبات:**
   ```bash
   npm install
   ```

2. **إعداد متغيرات البيئة:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   عدّل ملف `.env` مع معلومات قاعدة البيانات و JWT secret.

3. **تشغيل المشروع:**
   ```bash
   # من المجلد الرئيسي
   npm run dev
   
   # أو تشغيل الواجهة الخلفية والواجهة الأمامية بشكل منفصل
   npm run server  # للواجهة الخلفية على المنفذ 5000
   npm run client  # للواجهة الأمامية على المنفذ 3000
   ```

4. **فتح المتصفح:**
   - الواجهة الأمامية: http://localhost:3000
   - الواجهة الخلفية: http://localhost:5000

## 📁 هيكل المشروع

```
gaming-accounts-marketplace/
├── backend/                    # الواجهة الخلفية
│   ├── models/                # نماذج Mongoose
│   │   ├── User.js
│   │   ├── Game.js
│   │   └── Order.js
│   ├── routes/                # مسارات API
│   │   ├── auth.js
│   │   ├── games.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── middleware/             # الوسائط
│   │   └── auth.js
│   ├── .env                  # متغيرات البيئة
│   └── server.js              # ملف السيرفر الرئيسي
├── frontend/                   # الواجهة الأمامية
│   ├── public/
│   ├── src/
│   │   ├── components/        # المكونات القابلة لإعادة الاستخدام
│   │   │   ├── Navbar.tsx
│   │   │   └── ImageUpload.tsx
│   │   ├── pages/             # صفحات التطبيق
│   │   │   ├── Home.tsx
│   │   │   ├── GameDetail.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── services/          # خدمات API
│   │   │   └── api.ts
│   │   ├── App.tsx           # المكون الرئيسي
│   │   └── index.tsx         # نقطة الدخول
│   ├── package.json
│   └── tailwind.config.js
├── package.json               # ملف الحزمة الرئيسي
└── README.md                # هذا الملف
```

## 🔗 نقاط النهاية (API Endpoints)

### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول

### الألعاب
- `GET /api/games` - جلب كل الألعاب (مع فلترة)
- `GET /api/games/:id` - جلب لعبة محددة
- `POST /api/games` - إضافة لعبة جديدة (محمي)
- `PUT /api/games/:id` - تحديث لعبة (محمي)
- `DELETE /api/games/:id` - حذف لعبة (محمي)

### الطلبات
- `POST /api/orders` - إنشاء طلب جديد (محمي)
- `GET /api/orders` - جلب طلبات المستخدم (محمي)

### المدير
- `GET /api/admin/games` - جلب كل الألعاب
- `GET /api/admin/orders` - جلب كل الطلبات
- `GET /api/admin/users` - جلب كل المستخدمين
- `PUT /api/admin/orders/:id/status` - تحديث حالة الطلب

### رفع الملفات
- `POST /api/upload/image` - رفع صورة واحدة
- `POST /api/upload/images` - رفع صور متعددة

## 🗄️ نماذج قاعدة البيانات

### المستخدم (User)
```javascript
{
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String, // 'user' | 'admin'
  createdAt: Date
}
```

### اللعبة (Game)
```javascript
{
  title: String,
  description: String,
  price: Number,
  platform: String,
  region: String,
  images: [String],
  availability: String, // 'available' | 'sold' | 'reserved'
  accountDetails: {
    username: String,
    email: String,
    additionalInfo: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### الطلب (Order)
```javascript
{
  user: ObjectId,
  games: [{
    game: ObjectId,
    price: Number
  }],
  totalAmount: Number,
  status: String, // 'pending' | 'completed' | 'cancelled'
  createdAt: Date
}
```

## 🎯 الاستخدام

### للمستخدمين:
1. إنشاء حساب جديد
2. تصفح حسابات الألعاب المتاحة
3. استخدام الفلاتر للبحث عن ألعاب محددة
4. عرض تفاصيل الحساب والصور
5. طلب وشراء الحسابات
6. عرض طلبات السابقة

### للمديرين:
1. تسجيل الدخول بحساب مدير
2. إدارة حسابات الألعاب (إضافة، تعديل، حذف)
3. إدارة الطلبات (عرض، تحديث الحالة)
4. إدارة المستخدمين
5. رفع الصور للحسابات

## 🔧 التخصيص

### تغيير المنافذ:
- الواجهة الخلفية: عدّل `PORT` في `backend/.env`
- الواجهة الأمامية: عدّل البرنامج النصي في `package.json`

### تغيير قاعدة البيانات:
- عدّل `MONGODB_URI` في `backend/.env`

## 🚧 التحسينات المستقبلية

- [ ] نظام تقييم وتقييمات
- [ ] محفظة أمنية للدفع
- [ ] نظام إشعارات
- [ ] دعم لغات متعددة
- [ ] تحسينات الأداء
- [ ] نظام رسائل مباشرة
- [ ] تحليلات وإحصائيات

## 📄 الترخيص

هذا المشروع مفتوح المصدر تحت ترخيص MIT.

## 🤝 المساهمة

المساهمات مرحب بها! يرجى فتح issue أو pull request.

## 📞 الدعم

لأي أسئلة أو استفسارات، يرجى التواصل عبر:
- البريد الإلكتروني: support@alphastore.com
- الموقع: www.alphastore.com
