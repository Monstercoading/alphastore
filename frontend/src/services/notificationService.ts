import { conversationAPI } from './conversationAPI';

export interface Notification {
  id: string;
  type: 'conversation' | 'order' | 'discount' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  entityId?: string; // conversation ID, order ID, etc.
  actionUrl?: string;
}

export interface NotificationStats {
  total: number;
  conversations: number;
  orders: number;
  discounts: number;
  system: number;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Get all notifications for current user
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get notification counts
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const notifications = await this.getNotifications();
      
      const stats: NotificationStats = {
        total: notifications.filter(n => !n.read).length,
        conversations: notifications.filter(n => n.type === 'conversation' && !n.read).length,
        orders: notifications.filter(n => n.type === 'order' && !n.read).length,
        discounts: notifications.filter(n => n.type === 'discount' && !n.read).length,
        system: notifications.filter(n => n.type === 'system' && !n.read).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        total: 0,
        conversations: 0,
        orders: 0,
        discounts: 0,
        system: 0
      };
    }
  }

  // Mark specific notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications of specific type as read
  async markTypeAsRead(type: Notification['type']): Promise<void> {
    try {
      await fetch('/api/notifications/mark-type-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Mark conversation notifications as read when accessing conversation
  async markConversationNotificationsAsRead(conversationId: string): Promise<void> {
    try {
      // Mark messages as read in conversation
      await conversationAPI.markAsRead(conversationId);
      
      // Mark conversation notifications as read
      await this.markTypeAsRead('conversation');
    } catch (error) {
      console.error('Error marking conversation notifications as read:', error);
    }
  }

  // Create new notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
