import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../assets/notifications';
import { formatDisplayName } from '../utils/nameFormatter';
import { useNavigationWithDelay } from '../hooks/useNavigationWithDelay';
import { userAPI, UpdateUserData } from '../services/userAPI';
import Loading from '../components/Loading';

// Import User type from AuthContext
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

const Profile: React.FC = () => {
  const { state, logout, updateUser } = useAuth();
  const { isLoading, reloadWithDelay } = useNavigationWithDelay();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: state.user?.firstName || '',
    lastName: state.user?.lastName || '',
    email: state.user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // لا السماح بتعديل الإيميل - تجاهل أي تغييرات على حقل الإيميل
    if (e.target.name === 'email') {
      e.preventDefault();
      return;
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (!state.user?._id) {
        throw new Error('User ID not found');
      }

      // Prepare update data - lastName not editable
      const updateData: UpdateUserData = {
        firstName: formData.firstName,
      };

      console.log('Updating user with data:', updateData);
      console.log('Current user state:', state.user);

      // Update user using API
      const updatedUser = await userAPI.updateUser(state.user._id, updateData);
      
      console.log('API returned updated user:', updatedUser);
      
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Update AuthContext state
      updateUser(updatedUser);
      
      console.log('AuthContext state updated with:', updatedUser);
      
      // Debug data consistency
      userAPI.debugUserData(updatedUser._id);
      
      setIsEditing(false);
      setLoading(false);
      showNotification('تم تحديث معلوماتك بنجاح!', 'success');
      
      // تحديث الصفحة بعد حفظ التغييرات مع تأخير و loading
      reloadWithDelay(2500);
    } catch (error: any) {
      setLoading(false);
      showNotification(error.message || 'فشل تحديث المعلومات', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!state.user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      {isLoading && <Loading />}
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            الملف الشخصي
          </h1>
          <p className="text-gray-400">
            إدارة معلومات حسابك
          </p>
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white">
              {formatDisplayName(formData.firstName, formData.lastName)}
            </h2>
            <p className="text-gray-400 text-sm">
              {formData.email}
            </p>
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">الاسم الأول:</span>
                <span className="text-white">{formData.firstName}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">الاسم الأخير:</span>
                <span className="text-white">{formData.lastName}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">البريد الإلكتروني:</span>
                <span className="text-white">{formData.email}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">نوع الحساب:</span>
                <span className="text-white">
                  {state.user.role === 'admin' ? 'مدير' : 'مستخدم'}
                </span>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  تعديل المعلومات
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  تسجيل خروج
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم الأول
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-dark w-full"
                  required
                />
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">الاسم الأخير:</span>
                  <span className="text-white text-sm">{formData.lastName}</span>
                </div>
                <p className="text-gray-500 text-xs mt-2">لا يمكن تعديل الاسم الأخير</p>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="input-dark w-full bg-gray-700 cursor-not-allowed opacity-70"
                />
                <p className="text-gray-500 text-xs mt-2">لا يمكن تعديل البريد الإلكتروني</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;
