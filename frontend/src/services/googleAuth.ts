// خدمة Google OAuth الحقيقية
// تحصل على بيانات المستخدم الفعلية من Google عبر Backend

import { API_URL } from '../config/api';

export const getGoogleUserInfo = async (code: string) => {
  try {
    console.log('📤 Sending code to backend:', code.substring(0, 20) + '...');
    console.log('📤 API_URL:', `${API_URL}/auth/google`);
    
    // إرسال الكود للـ Backend
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('📥 Backend response status:', response.status);
    console.log('📥 Backend response OK:', response.ok);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        console.error('❌ Backend error text:', text);
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend response data:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Google authentication failed');
    }
    
    return { user: data.user, token: data.token };
  } catch (error: any) {
    console.error('❌ Google Auth Error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Please check if server is running.`);
    }
    
    throw error;
  }
};
