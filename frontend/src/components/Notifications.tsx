import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../assets/notifications';

// إعادة تصدير showNotification للاستخدام السهل
export { showNotification };

// مكون الإشعارات
const Notifications: React.FC = () => {
  const { error } = useAuth();
  
  useEffect(() => {
    // مراقبة الأخطاء فقط
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);
  
  return null;
};

export default Notifications;
