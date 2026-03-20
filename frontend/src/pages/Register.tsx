import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../assets/notifications';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import Loading from '../components/Loading';

const Register: React.FC = () => {
  const { state, register, clearError, loginWithGoogle } = useAuth();
  const { navigateWithDelay, isLoading } = useNavigationWithDelay();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // إذا كان المستخدم مسجل دخوله بالفعل، انقله إلى الصفحة الرئيسية
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser) {
      navigateWithDelay('/', 2500);
    }
  }, [navigateWithDelay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      clearError();
      
      // التحقق إذا كان الحساب موجود بالفعل
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === formData.email);
      
      if (existingUser) {
        setError('هذا الحساب مسجل من قبل بالفعل');
        showNotification('هذا الحساب مسجل من قبل بالفعل', 'error');
        return;
      }
      
      await register(formData);
      navigateWithDelay('/', 2500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل إنشاء الحساب');
      showNotification(error.response?.data?.message || 'فشل إنشاء الحساب', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      clearError();
      await loginWithGoogle();
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تسجيل الدخول عبر Google');
      showNotification(error.response?.data?.message || 'فشل تسجيل الدخول عبر Google', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src="/j.png" 
                alt="Alpha Store" 
                className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            إنشاء حساب جديد في Alpha Store
          </h2>
          <p className="text-gray-400">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-red-500 hover:text-red-400 font-medium transition-colors">
              سجل دخول إلى حسابك الحالي
            </Link>
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(error || state.error) && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span>{error || state.error}</span>
                  {error === 'هذا الحساب مسجل من قبل بالفعل' && (
                    <Link
                      to="/"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      الصفحة الرئيسية
                    </Link>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم الأول
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-dark w-full"
                  placeholder="محمد"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم الأخير
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-dark w-full"
                  placeholder="أحمد"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-dark w-full pr-10"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-dark w-full pr-10"
                  placeholder="•••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded"
              />
              <label htmlFor="terms" className="mr-2 block text-sm text-gray-300">
                أوافق على{' '}
                <a href="#" className="text-red-500 hover:text-red-400 transition-colors">
                  الشروط والأحكام
                </a>
                {' '}و{' '}
                <a href="#" className="text-red-500 hover:text-red-400 transition-colors">
                  سياسة الخصوصية
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || state.isLoading}
                className="btn-primary w-full text-lg py-3 flex items-center justify-center"
              >
                {(loading || state.isLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  'إنشاء حساب'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">أو</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading || state.isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                إنشاء حساب عبر Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
