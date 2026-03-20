// خدمة Google OAuth الحقيقية
// تحصل على بيانات المستخدم الفعلية من Google عبر Backend

import { API_URL } from '../config/api';

export const getGoogleUserInfo = async (code: string) => {
  try {
    console.log('Sending code to backend:', code);
    
    // إرسال الكود للـ Backend لاستبداله بـ token والحصول على بيانات المستخدم
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Google authentication failed');
    }
    
    return data.user;
  } catch (error) {
    console.error('Google Auth Error:', error);
    
    // إذا كان الخطأ متعلق بالشبكة، نعطي رسالة أوضح
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
    }
    
    throw error;
  }
};
