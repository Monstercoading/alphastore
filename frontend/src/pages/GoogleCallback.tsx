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

        if (error) {
          console.error('Google OAuth error:', error);
          window.location.href = '/?error=google_auth_failed';
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          window.location.href = '/?error=no_code_received';
          return;
        }

        console.log('Received Google auth code:', code);

        // الحصول على بيانات Google الفعلية من Backend
        const response = await getGoogleUserInfo(code);
        console.log('Google auth response:', response);
        
        const { user: googleUserData, token } = response;
        
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
        console.error('❌ Callback error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        showNotification('فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.', 'error');
        window.location.href = `/?error=callback_failed&details=${encodeURIComponent(error.message)}`;
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
