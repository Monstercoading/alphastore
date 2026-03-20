# MongoDB Migration Guide

## التحويل من JSON Files إلى MongoDB

الآن لديك خياران لتشغيل السيرفر:

### 1. وضع JSON Files (الحالي)
```bash
npm start          # يستخدم server.js
npm run dev        # تطوير مع server.js
```

### 2. وضع MongoDB (الجديد)
```bash
npm run start:mongo    # يستخدم server-mongodb.js
npm run dev:mongo      # تطوير مع server-mongodb.js
```

## إعداد MongoDB

### 1. تثبيت MongoDB
```bash
# Windows
# قم بتنزيل MongoDB Community Server من الموقع الرسمي

# Linux/macOS
sudo apt-get install mongodb
# أو
brew install mongodb-community
```

### 2. تشغيل MongoDB
```bash
# Windows
mongod --dbpath "C:\data\db"

# Linux/macOS
sudo systemctl start mongod
# أو
brew services start mongodb-community
```

### 3. إعداد البيئة
```bash
# انسخ ملف الإعدادات
cp .env.example .env

# عدل رابط الاتصال حسب الحاجة
MONGO_URI=mongodb://localhost:27017/gaming-accounts
```

## المميزات

### JSON Files Mode
- ✅ لا يتطلب تثبيت MongoDB
- ✅ خفيف وسريع
- ✅ مثالي للاختبار والبيئات الصغيرة

### MongoDB Mode
- ✅ قاعدة بيانات احترافية
- ✅ أداء أفضل مع البيانات الكبيرة
- ✅ دعم الاستعلامات المعقدة
- ✅ أمان أفضل للبيانات

## الملفات

```
backend/
├── server.js           # JSON Files Version
├── server-mongodb.js   # MongoDB Version  
├── package.json        # Dual mode scripts
├── .env.example       # Environment template
└── .env              # Environment variables
```

## الـ Schemas في MongoDB

### Products Collection
```javascript
{
  title: String,
  description: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  platform: String,
  region: String,
  images: [String],
  availability: String, // 'available', 'sold', 'reserved'
  isNew: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  user: {
    email: String,
    firstName: String,
    lastName: String
  },
  games: [{
    game: {
      _id: String,
      title: String,
      platform: String,
      price: Number
    },
    price: Number
  }],
  totalAmount: Number,
  status: String, // 'pending', 'sent', 'completed', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String, // 'user', 'admin'
  createdAt: Date
}
```

## التحويل التلقائي

يمكنك تشغيل السيرفر بأي وضع حسب الحاجة:

```bash
# للإنتاج مع JSON
NODE_ENV=production npm start

# للإنتاج مع MongoDB
MONGO_URI=mongodb://your-server:27017/gaming-accounts npm run start:mongo
```

## النسخ الاحتياطي

### JSON Files
```bash
# نسخ مجلد data/
cp -r data/ backup/data-$(date +%Y%m%d)/
```

### MongoDB
```bash
# نسخ قاعدة البيانات
mongodump --db gaming-accounts --out backup/$(date +%Y%m%d)/

# استعادة النسخة
mongorestore --db gaming-accounts backup/20240319/gaming-accounts/
```

## جاهز للتشغيل! 🚀

اختر الوضع المناسب لك:
- **JSON Files**: للاختبار والبيئات الصغيرة
- **MongoDB**: للإنتاج والبيئات الكبيرة
