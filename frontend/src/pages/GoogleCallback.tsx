import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getGoogleUserInfo } from '../services/googleAuth';
import { showErrorToast, showToastWithAction } from '../utils/toast';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading } = useNavigationWithDelay();
  const { googleLoginSuccess } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        // Get flow type from localStorage (set before redirecting to Google)
        const flow = localStorage.getItem('google_oauth_flow') as 'signup' | 'login' || 'login';
        localStorage.removeItem('google_oauth_flow'); // Clean up
        
        console.log('🔍 GoogleCallback mounted');
        console.log('🔍 Code from URL:', code ? 'exists' : 'null');
        console.log('🔍 Error from URL:', error);
        console.log('🔍 Flow type:', flow);

        if (error) {
          console.error('❌ Google OAuth error from URL:', error);
          showErrorToast('تم إلغاء تسجيل الدخول عبر Google');
          window.location.href = '/?error=google_rejected';
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received');
          showErrorToast('لم يتم استلام رمز التصريح من Google');
          window.location.href = '/?error=no_code';
          return;
        }

        console.log('✅ Received Google auth code, calling backend...');

        // الحصول على بيانات Google الفعلية من Backend مع نوع العملية
        let response;
        try {
          response = await getGoogleUserInfo(code, flow);
          console.log('✅ Backend response received:', response);
        } catch (apiError: any) {
          console.error('❌ API call failed:', apiError);
          
          // Check if it's a 400 error for existing user during signup
          if (apiError.status === 400 && apiError.data?.redirectToLogin) {
            showToastWithAction(
              'هذا الحساب موجود بالفعل، يرجى استخدامه لتسجيل الدخول',
              'تسجيل الدخول',
              () => navigate('/login')
            );
            // Redirect to login after showing toast
            setTimeout(() => {
              window.location.href = '/login?error=account_exists';
            }, 2000);
            return;
          }
          
          // Check if it's a 400 error for non-existing user during login
          if (apiError.status === 400 && apiError.data?.redirectToSignup) {
            showToastWithAction(
              'هذا الحساب غير موجود، يرجى إنشاء حساب جديد',
              'إنشاء حساب',
              () => navigate('/signup')
            );
            setTimeout(() => {
              window.location.href = '/signup?error=account_not_found';
            }, 2000);
            return;
          }
          
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
        showErrorToast(`فشل تسجيل الدخول: ${errorMsg}`);
        window.location.href = `/?error=callback_failed&details=${encodeURIComponent(errorMsg)}`;
      }
    };

    handleGoogleCallback();
  }, [searchParams, googleLoginSuccess, navigate]);

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
