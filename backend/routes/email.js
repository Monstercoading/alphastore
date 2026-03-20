const express = require('express');
const router = express.Router();
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Initialize MailerSend with API key from environment
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Send order completion email with account details
router.post('/send-order-email', async (req, res) => {
  try {
    const { 
      toEmail, 
      toName, 
      orderId, 
      games, 
      totalAmount, 
      accountDetails 
    } = req.body;

    if (!toEmail || !accountDetails) {
      return res.status(400).json({ 
        error: 'Missing required fields: toEmail and accountDetails' 
      });
    }

    // Format games list for email
    const gamesList = games.map(item => 
      `<li><strong>${item.game.title}</strong> - $${item.price}</li>`
    ).join('');

    // Create email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
    .title { font-size: 20px; color: #1f2937; margin-bottom: 20px; }
    .account-box { background-color: #f9fafb; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .account-title { color: #dc2626; font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #4b5563; }
    .detail-value { color: #1f2937; text-align: left; direction: ltr; }
    .games-list { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .total { font-size: 18px; font-weight: bold; color: #dc2626; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Alpha Store 🎮</div>
      <div class="title">تم تفعيل طلبك بنجاح!</div>
    </div>
    
    <p>مرحباً <strong>${toName}</strong>,</p>
    <p>تم إكمال طلبك رقم <strong>#${orderId.slice(-6)}</strong> وهنا بيانات حسابك:</p>
    
    <div class="account-box">
      <div class="account-title">🔐 بيانات الحساب</div>
      <div class="detail-row">
        <span class="detail-label">اسم المستخدم:</span>
        <span class="detail-value">${accountDetails.username || 'غير متوفر'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">البريد الإلكتروني:</span>
        <span class="detail-value">${accountDetails.email || 'غير متوفر'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">كلمة المرور:</span>
        <span class="detail-value">${accountDetails.password || 'غير متوفر'}</span>
      </div>
      ${accountDetails.additionalInfo ? `
      <div class="detail-row">
        <span class="detail-label">معلومات إضافية:</span>
        <span class="detail-value">${accountDetails.additionalInfo}</span>
      </div>
      ` : ''}
    </div>
    
    <div class="games-list">
      <h3 style="margin-top: 0; color: #1f2937;">المنتجات المشتراة:</h3>
      <ul style="padding-right: 20px;">
        ${gamesList}
      </ul>
    </div>
    
    <div class="total">
      المجموع: $${totalAmount}
    </div>
    
    <div class="warning">
      <strong>⚠️ تنبيه مهم:</strong><br>
      يرجى تغيير كلمة المرور فور استلام الحساب للأمان.<br>
      ننصح بتفعيل المصادقة الثنائية (2FA) إذا كانت متوفرة.
    </div>
    
    <div class="footer">
      <p>شكراً لثقتك بـ <strong>Alpha Store</strong> 🎮</p>
      <p>للدعم الفني: تواصل معنا عبر الموقع</p>
      <p style="font-size: 12px; color: #9ca3af;">© 2025 Alpha Store. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create plain text version
    const textContent = `
مرحباً ${toName},

تم تفعيل طلبك بنجاح!

بيانات الحساب:
- اسم المستخدم: ${accountDetails.username || 'غير متوفر'}
- البريد الإلكتروني: ${accountDetails.email || 'غير متوفر'}
- كلمة المرور: ${accountDetails.password || 'غير متوفر'}
${accountDetails.additionalInfo ? `- معلومات إضافية: ${accountDetails.additionalInfo}` : ''}

المنتجات المشتراة:
${games.map(item => `- ${item.game.title} ($${item.price})`).join('\n')}

المجموع: $${totalAmount}

⚠️ يرجى تغيير كلمة المرور فور استلام الحساب للأمان.

شكراً لك!
Alpha Store 🎮
    `;

    // Configure sender and recipient
    // IMPORTANT: This email must be verified in MailerSend dashboard
    const sentFrom = new Sender('noreply@trial-k68oxl5o2o4lj905.mlsender.net', 'Alpha Store');
    const recipients = [new Recipient(toEmail, toName)];

    console.log('📧 Sending email to:', toEmail);
    console.log('📧 From:', 'noreply@trial-k68oxl5o2o4lj905.mlsender.net');
    console.log('📧 Subject:', `✅ تم تفعيل طلبك #${orderId.slice(-6)} - Alpha Store`);

    // Create email params
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(`✅ تم تفعيل طلبك #${orderId.slice(-6)} - Alpha Store`)
      .setHtml(htmlContent)
      .setText(textContent);

    // Send email
    const response = await mailerSend.email.send(emailParams);
    console.log('✅ Email sent successfully:', response);

    res.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message,
      hint: 'تأكد من تفعيل/التحقق من الدومين في MailerSend Dashboard'
    });
  }
});

module.exports = router;
