import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { stats } = useNotifications();
  const { state } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to notifications page or open notifications modal
    if (state.user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/cart');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-400 hover:text-white transition-colors"
      title="الإشعارات"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      {stats.total > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {stats.total > 99 ? '99+' : stats.total}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
