const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const users = require('../data/users');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // البحث عن المستخدم في البيانات التجريبية
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // في البيانات التجريبية، نقبل أي كلمة مرور للمستخدم الموجود
    // في التطبيق الحقيقي، يجب استخدام bcrypt.compare
    const isPasswordValid = true; // مؤقتاً للبيانات التجريبية

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تسجيل الدخول'
    });
  }
});

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // التحقق إذا كان المستخدم موجود بالفعل
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'هذا البريد الإلكتروني مسجل بالفعل'
      });
    }

    // إنشاء مستخدم جديد (في البيانات التجريبية)
    const newUser = {
      _id: Date.now().toString(),
      email,
      firstName,
      lastName,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // إضافة المستخدم للقائمة (في التطبيق الحقيقي، يتم حفظه في قاعدة البيانات)
    users.push(newUser);

    // إنشاء token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الحساب'
    });
  }
});

// التحقق من token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم توفير token'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u._id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({
      success: false,
      message: 'Token غير صالح'
    });
  }
});

module.exports = router;
