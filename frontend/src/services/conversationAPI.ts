import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://alphastore-ap.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Conversation {
  _id: string;
  orderId: {
    _id: string;
    totalAmount: number;
    createdAt: string;
  };
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'open' | 'closed';
  lastMessage: string;
  lastMessageTime: string;
  unreadByCustomer: number;
  unreadByAdmin: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId?: string;
  senderType: 'customer' | 'admin';
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

class ConversationAPI {
  // Get all conversations for admin
  async getAdminConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/conversations/admin');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin conversations:', error);
      throw error;
    }
  }

  // Get conversations for customer
  async getCustomerConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/conversations/customer');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer conversations:', error);
      throw error;
    }
  }

  // Get single conversation with messages
  async getConversation(id: string): Promise<ConversationWithMessages> {
    try {
      const response = await api.get(`/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Create new conversation
  async createConversation(orderId: string): Promise<Conversation> {
    try {
      const response = await api.post('/conversations', { orderId });
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Send text message
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    try {
      const response = await api.post(`/conversations/${conversationId}/message`, { content });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send image message
  async sendImageMessage(conversationId: string, imageFile: File): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/conversations/${conversationId}/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  // Close conversation
  async closeConversation(conversationId: string): Promise<any> {
    try {
      const response = await api.put(`/conversations/${conversationId}/close`);
      return response.data;
    } catch (error) {
      console.error('Error closing conversation:', error);
      throw error;
    }
  }

  // Mark messages as read (for admin)
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await api.put(`/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Connect to SSE for real-time messages
  connectToMessages(callback: (message: any) => void): EventSource {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_BASE_URL}/admin/notifications?token=${token}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_MESSAGE') {
          callback(data);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return eventSource;
  }
}

export const conversationAPI = new ConversationAPI();
