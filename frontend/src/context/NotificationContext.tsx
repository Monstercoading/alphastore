import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { notificationService, Notification, NotificationStats } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  stats: NotificationStats;
  loading: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markTypeAsRead: (type: Notification['type']) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_STATS'; payload: NotificationStats }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_TYPE_AS_READ'; payload: Notification['type'] }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'MARK_TYPE_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.type === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  stats: {
    total: 0,
    conversations: 0,
    orders: 0,
    discounts: 0,
    system: 0
  },
  loading: false
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const fetchNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const notifications = await notificationService.getNotifications();
      const stats = await notificationService.getNotificationStats();
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
      fetchNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markTypeAsRead = async (type: Notification['type']) => {
    try {
      await notificationService.markTypeAsRead(type);
      dispatch({ type: 'MARK_TYPE_AS_READ', payload: type });
      fetchNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
      fetchNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await notificationService.markConversationNotificationsAsRead(conversationId);
      dispatch({ type: 'MARK_TYPE_AS_READ', payload: 'conversation' });
      fetchNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error marking conversation notifications as read:', error);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      await notificationService.createNotification(notification);
      fetchNotifications(); // Refresh notifications and stats
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
      fetchNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const value: NotificationContextType = {
    ...state,
    fetchNotifications,
    markAsRead,
    markTypeAsRead,
    markAllAsRead,
    markConversationAsRead,
    createNotification,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
