import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Archive, Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { conversationAPI } from '../services/conversationAPI';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { Conversation as APIConversation, Message as APIMessage } from '../services/conversationAPI';

type Message = APIMessage;

interface Conversation {
  _id: string;
  orderId: {
    _id: string;
    totalAmount: number;
    createdAt: string;
    items?: Array<{
      gameName?: string;
      productName?: string;
      name?: string;
    }>;
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
  productName?: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const { state } = useAuth();
  const { markConversationAsRead } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent' | 'delivered' | 'read'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getProductName = (conversation: Conversation) => {
    if (conversation.orderId?.items && conversation.orderId.items.length > 0) {
      const firstItem = conversation.orderId.items[0];
      return firstItem.gameName || firstItem.productName || firstItem.name || 'منتج';
    }
    return conversation.productName || 'الدعم الفني';
  };

  const getOrderInfo = (conversation: Conversation) => {
    if (conversation.orderId) {
      return {
        id: conversation.orderId._id,
        total: conversation.orderId.totalAmount,
        date: conversation.orderId.createdAt
      };
    }
    return null;
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === state.user?.id;
  };

  const formatTime = (dateString: string | undefined | Date) => {
    if (!dateString) return 'الآن';
    
    try {
      let date: Date;
      
      // Handle different date formats
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Check if it's a valid date string
        if (dateString === 'Invalid Date' || !dateString.trim()) {
          return 'الآن';
        }
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date detected:', dateString);
        return 'الآن';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      
      return date.toLocaleDateString('ar-SA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'الآن';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim() && selectedConversation) {
      socketService.emitTyping(selectedConversation, state.user?.role === 'admin' ? 'admin' : 'customer');
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedConversation) {
        socketService.emitStopTyping(selectedConversation, state.user?.role === 'admin' ? 'admin' : 'customer');
      }
    }, 1000);
  };

  const createConversationWithLastOrder = async () => {
    try {
      // Fetch user's orders to find the last one
      const ordersResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com'}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        if (orders.length > 0) {
          const lastOrder = orders[orders.length - 1];
          const productName = lastOrder.items?.[0]?.name || 'منتج';
          
          // Create conversation with product name
          const conversationResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com'}/api/conversations`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: lastOrder._id,
              subject: `محادثة حول طلب: ${productName}`,
              message: 'أود الاستفسار حول طلبي الأخير'
            })
          });
          
          if (conversationResponse.ok) {
            console.log('Created conversation with last order:', productName);
            showSuccessToast(`تم إنشاء محادثة حول: ${productName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error creating conversation with last order:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('Fetching conversations for role:', state.user?.role);
      
      let response;
      if (state.user?.role === 'admin') {
        response = await conversationAPI.getAdminConversations();
      } else {
        // For customers, get conversations where they are participants
        response = await conversationAPI.getCustomerConversations();
        
        // Filter to ensure we only get conversations where current user is involved
        if (Array.isArray(response)) {
          response = response.filter(conv => 
            conv.customerId === state.user?._id
          );
        }
        
        // If no conversations exist, create one with last order
        if (response.length === 0 && state.user?._id) {
          console.log('No conversations found, creating conversation with last order...');
          await createConversationWithLastOrder();
          // Fetch again after creating
          response = await conversationAPI.getCustomerConversations();
          if (Array.isArray(response)) {
            response = response.filter(conv => 
              conv.customerId === state.user?._id
            );
          }
        }
      }
      
      console.log('Conversations response:', response);
      setConversations(response);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        showErrorToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      } else if (error.response?.status === 401) {
        // 🔧 FIXED: Don't auto-logout, check if it's a real auth issue or backend issue
        console.log('401 error - checking if backend is working...');
        
        // Check if this is a backend connectivity issue
        if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
          showErrorToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        } else {
          // Only show auth error, don't auto-logout
          showErrorToast('مشكلة في المصادقة. يرجى المحاولة مرة أخرى.');
          // Don't auto-logout - let the user continue
          // localStorage.removeItem('token');
          // localStorage.removeItem('user');
          // window.location.href = '/login';
        }
      } else if (error.response?.status === 404) {
        showErrorToast('خدمة الدعم الفني غير متاحة حالياً');
      } else {
        showErrorToast('فشل في تحميل المحادثات');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await conversationAPI.getMessages(conversationId);
      setMessages(response);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        showErrorToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      } else if (error.response?.status === 401) {
        // 🔧 FIXED: Don't auto-logout
        console.log('401 error in fetchMessages - backend might be down');
        showErrorToast('مشكلة في تحميل الرسائل. يرجى المحاولة مرة أخرى.');
        // Don't auto-logout
      } else if (error.response?.status === 404) {
        showErrorToast('المحادثة غير موجودة');
      } else {
        showErrorToast('فشل في تحميل الرسائل');
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    // Don't add message manually - rely only on socket receiveMessage
    try {
      const message = await conversationAPI.sendMessage(selectedConversation, messageContent);
      
      // Send via socket - this will trigger receiveMessage event
      socketService.sendMessage({
        conversationId: selectedConversation,
        message,
        senderType: state.user?.role === 'admin' ? 'admin' : 'customer',
        senderId: state.user?._id || 'guest'
      });
      
      // Auto-refresh sidebar when new message is sent
      fetchConversations();
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('فشل إرسال الرسالة');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!selectedConversation) return;

    try {
      setUploading(true);
      const message = await conversationAPI.sendImageMessage(selectedConversation, file);
      
      socketService.sendMessage({
        conversationId: selectedConversation,
        message,
        senderType: state.user?.role === 'admin' ? 'admin' : 'customer',
        senderId: state.user?.id || 'guest'
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending image:', error);
      showErrorToast('فشل إرسال الصورة');
    } finally {
      setUploading(false);
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      await conversationAPI.closeConversation(conversationId);
      showSuccessToast('تم إغلاق المحادثة');
      
      // Refresh conversations list
      await fetchConversations();
      
      // Clear selected conversation
      setSelectedConversation(null);
      setMessages([]);
    } catch (error: any) {
      console.error('Error closing conversation:', error);
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        showErrorToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      } else if (error.response?.status === 401) {
        // 🔧 FIXED: Don't auto-logout
        console.log('401 error in closeConversation - backend might be down');
        showErrorToast('مشكلة في إغلاق المحادثة. يرجى المحاولة مرة أخرى.');
        // Don't auto-logout
      } else if (error.response?.status === 404) {
        showErrorToast('المحادثة غير موجودة');
      } else {
        showErrorToast('فشل إغلاق المحادثة');
      }
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await conversationAPI.deleteConversation(conversationId);
      showSuccessToast('تم حذف المحادثة');
      fetchConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showErrorToast('فشل حذف المحادثة');
    }
  };

  const getMessageStatus = (messageId: string) => {
    return messageStatuses[messageId] || 'sent';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(conv => conv.status === activeTab);

  useEffect(() => {
    // Persistent socket listeners - never disconnect
    const handleNewMessage = (data: any) => {
      console.log('📨 New message received:', data);
      if (data.conversationId === selectedConversation) {
        setMessages(prev => [...prev, data.message || data]);
        scrollToBottom();
      }
      
      // Move conversation to top and update last message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessage: data.message?.content || data.content || 'New message',
              lastMessageTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
        
        // Move updated conversation to top
        return updated.sort((a, b) => {
          if (a._id === data.conversationId) return -1;
          if (b._id === data.conversationId) return 1;
          return new Date(b.lastMessageTime || b.updatedAt).getTime() - new Date(a.lastMessageTime || a.updatedAt).getTime();
        });
      });
    };

    const handleReceiveMessage = (data: any) => {
      console.log('📨 Real-time message received:', data);
      if (data.conversationId === selectedConversation) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }
      
      // Move conversation to top and update last message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessage: data.content || 'New message',
              lastMessageTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
        
        // Move updated conversation to top
        return updated.sort((a, b) => {
          if (a._id === data.conversationId) return -1;
          if (b._id === data.conversationId) return 1;
          return new Date(b.lastMessageTime || b.updatedAt).getTime() - new Date(a.lastMessageTime || a.updatedAt).getTime();
        });
      });
    };

    const handleUserTyping = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    };

    const handleUserStopTyping = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setIsTyping(false);
        setTypingUser('');
      }
    };

    // Set up listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.on('receiveMessage', handleReceiveMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);

    // Cleanup function
    return () => {
      // Don't disconnect - just remove listeners
      socketService.off('newMessage', handleNewMessage);
      socketService.off('receiveMessage', handleReceiveMessage);
      socketService.off('userTyping', handleUserTyping);
      socketService.off('userStopTyping', handleUserStopTyping);
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      // Join room immediately when opening chat
      socketService.emit('joinRoom', selectedConversation);
      socketService.joinConversation(selectedConversation);
      
      return () => {
        socketService.emit('leaveRoom', selectedConversation);
        socketService.leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (isOpen) {
      // 🔧 FIXED: Don't auto-logout on modal open, just try to fetch conversations
      console.log('ChatModal opened - attempting to fetch conversations');
      fetchConversations();
      
      // Check for new conversation ID from localStorage
      const newConversationId = localStorage.getItem('newConversationId');
      if (newConversationId) {
        console.log('Found new conversation ID:', newConversationId);
        setSelectedConversation(newConversationId);
        fetchMessages(newConversationId);
        localStorage.removeItem('newConversationId'); // Clean up
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d24] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-800">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">المحادثات</h2>
              <p className="text-red-100 text-sm">{state.user?.role === 'admin' ? 'لوحة تحكم المحادثات' : 'محادثاتي'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[35%] border-r border-gray-800 flex flex-col bg-[#0a0a0a]">
            <div className="flex bg-[#1a1d24] border-b border-gray-800 m-3 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('open')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'open'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:bg-[#2a2d34]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  المحادثات المفتوحة
                </div>
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'closed'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:bg-[#2a2d34]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Archive className="w-4 h-4" />
                  المحادثات المغلقة
                </div>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span>جاري التحميل...</span>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <MessageCircle className="w-12 h-12 text-gray-600" />
                    <p className="text-sm">
                      {activeTab === 'open' ? 'لا توجد محادثات مفتوحة' : 'لا توجد محادثات مغلقة'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {state.user?.role === 'admin' 
                        ? 'سيظهر هنا العملاء الذين يبدأون محادثات جديدة' 
                        : 'ابدأ محادثة جديدة من خلال صفحة المنتجات'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => {
                      setSelectedConversation(conversation._id);
                      fetchMessages(conversation._id);
                    }}
                    className={`p-4 border-b border-gray-800 cursor-pointer transition-colors ${
                      selectedConversation === conversation._id
                        ? 'bg-[#1a1d24] border-l-4 border-l-red-600'
                        : 'hover:bg-[#2a2d34]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white truncate">
                            {getProductName(conversation)} Support
                          </h4>
                          <span className="text-xs text-gray-400 mr-2">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate mb-1">
                          {conversation.customerName}
                        </p>
                        {state.user?.role === 'admin' && getOrderInfo(conversation) && (
                          <p className="text-xs text-blue-400 truncate mb-1">
                            طلب #{getOrderInfo(conversation)?.id?.slice(-8)} - ${getOrderInfo(conversation)?.total}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unreadByAdmin > 0 && state.user?.role === 'admin' && (
                        <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1 mr-3">
                          {conversation.unreadByAdmin}
                        </span>
                      )}
                      {conversation.unreadByCustomer > 0 && state.user?.role !== 'admin' && (
                        <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1 mr-3">
                          {conversation.unreadByCustomer}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-[#1a1d24] to-[#0a0a0a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-900/30 p-2 rounded-full">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {conversations.find(c => c._id === selectedConversation)?.customerName?.charAt(0) || 'U'}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {(() => {
                            const conversation = conversations.find(c => c._id === selectedConversation);
                            const productName = conversation ? getProductName(conversation) : 'الدعم الفني';
                            return `${productName} Support`;
                          })()}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {conversations.find(c => c._id === selectedConversation)?.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {state.user?.role === 'admin' ? (
                        <button
                          onClick={() => deleteConversation(selectedConversation)}
                          className="p-2 hover:bg-[#2a2d34] rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="حذف التذكرة"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => closeConversation(selectedConversation)}
                          className="p-2 hover:bg-[#2a2d34] rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="إغلاق محادثة الدعم"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#0a0a0a] to-[#1a1d24]">
                  {messages.map((message, index) => {
                    const isMyMessage = message.senderId === state.user?._id;
                    return (
                      <div
                        key={message._id || index}
                        className={`flex mb-4 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'ml-auto' : 'mr-auto'}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isMyMessage
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-sm'
                                : 'bg-gray-600 text-white rounded-bl-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium opacity-75">
                                {isMyMessage 
                                  ? (state.user?.role === 'admin' ? 'أنا - الدعم الفني' : 'أنا')
                                  : (message.senderType === 'admin' ? 'الدعم الفني' : 'العميل')
                                }
                              </span>
                            </div>
                            {message.imageUrl ? (
                              <img
                                src={message.imageUrl}
                                alt="صورة"
                                className="rounded-lg max-w-full h-auto"
                              />
                            ) : (
                              <p className="text-sm">{message.content || ''}</p>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                            isMyMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {isMyMessage && (
                              <span className="text-red-400">
                                {getStatusIcon(getMessageStatus(message._id))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-[#1a1d24] to-[#0a0a0a]">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && sendImage(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2 hover:bg-[#2a2d34] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                      title="إرسال صورة"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-[#0a0a0a] text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">اختر محادثة للبدء</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
