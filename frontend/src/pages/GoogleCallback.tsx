import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGoogleUserInfo } from '../services/googleAuth';
import { showNotification } from '../assets/notifications';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isLoading, redirectWithDelay } = useNavigationWithDelay();
  const { googleLoginSuccess } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        console.log('🔍 GoogleCallback mounted');
        console.log('🔍 Code from URL:', code ? 'exists' : 'null');
        console.log('🔍 Error from URL:', error);

        if (error) {
          console.error('❌ Google OAuth error from URL:', error);
          window.location.href = '/?error=google_rejected';
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received');
          window.location.href = '/?error=no_code';
          return;
        }

        console.log('✅ Received Google auth code, calling backend...');

        // الحصول على بيانات Google الفعلية من Backend
        let response;
        try {
          response = await getGoogleUserInfo(code);
          console.log('✅ Backend response received:', response);
        } catch (apiError: any) {
          console.error('❌ API call failed:', apiError.message);
          throw new Error(`Backend API failed: ${apiError.message}`);
        }
        
        if (!response || !response.user) {
          console.error('❌ Invalid response format:', response);
          throw new Error('Invalid response from server - missing user data');
        }
        
        const { user: googleUserData, token } = response;
        console.log('✅ Extracted user and token');
        
        // Store JWT token in localStorage
        if (token) {
          localStorage.setItem('token', token);
          console.log('✅ JWT token stored');
        }
        
        // Update user in auth context with token
        await googleLoginSuccess({ ...googleUserData, token });
        console.log('✅ Google login completed successfully');
        
        // Redirect to home
        window.location.href = '/';
        
      } catch (error: any) {
        console.error('❌ Final catch - Callback error:', error);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error message:', error?.message || 'No message');
        console.error('❌ Error stack:', error?.stack || 'No stack');
        
        const errorMsg = error?.message || 'Unknown error occurred';
        showNotification(`فشل تسجيل الدخول: ${errorMsg}`, 'error');
        window.location.href = `/?error=callback_failed&details=${encodeURIComponent(errorMsg)}`;
      }
    };

    handleGoogleCallback();
  }, [searchParams, googleLoginSuccess]);

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري تسجيل الدخول...</p>
          <p className="text-gray-400 text-sm mt-2">يرجى الانتظار</p>
        </div>
      </div>
    </>
  );
};

export default GoogleCallback;
