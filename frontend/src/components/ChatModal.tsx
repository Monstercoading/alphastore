import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Archive, Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { conversationAPI } from '../services/conversationAPI';
import { socketService } from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface Message {
  _id: string;
  content: string;
  senderId: string;
  senderType: 'admin' | 'customer';
  createdAt: string | Date;
  read: boolean;
  imageUrl?: string;
}

interface Conversation {
  _id: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  status: 'open' | 'closed';
  lastMessage: string;
  lastMessageTime: string;
  unreadByAdmin: number;
  unreadByCustomer: number;
  items: any[];
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

  const getProductName = (conversation: any) => {
    if (conversation.items && conversation.items.length > 0) {
      const firstItem = conversation.items[0];
      return firstItem.gameName || firstItem.productName || firstItem.name || 'منتج';
    }
    return 'الدعم الفني';
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === state.user?.id;
  };

  const formatTime = (dateString: string | undefined | Date) => {
    if (!dateString) return 'الآن';
    
    try {
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
          const dateMatch = dateString.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
          if (dateMatch) {
            date = new Date(dateMatch[0]);
          }
        }
      } else {
        date = new Date();
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date detected:', dateString);
        return 'الآن';
      }
      
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
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

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = state.user?.role === 'admin' 
        ? await conversationAPI.getAdminConversations()
        : await conversationAPI.getCustomerConversations();
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showErrorToast('فشل في تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await conversationAPI.getMessages(conversationId);
      setMessages(response);
      
      if (state.user?.role === 'admin') {
        await conversationAPI.markAsRead(conversationId);
        markConversationAsRead(conversationId);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      showErrorToast('فشل في تحميل الرسائل');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    const tempId = Date.now().toString();
    setNewMessage('');
    setSending(true);
    
    setMessageStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const message = await conversationAPI.sendMessage(selectedConversation, messageContent);
      
      setMessageStatuses(prev => ({ ...prev, [tempId]: 'sent', [message._id]: 'delivered' }));
      
      socketService.sendMessage({
        conversationId: selectedConversation,
        message,
        senderType: state.user?.role === 'admin' ? 'admin' : 'customer',
        senderId: state.user?.id || 'guest'
      });
      
      setTimeout(() => {
        setMessageStatuses(prev => ({ ...prev, [message._id]: 'delivered' }));
      }, 500);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('فشل إرسال الرسالة');
      setNewMessage(messageContent);
      setMessageStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[tempId];
        return newStatuses;
      });
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
      
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation && state.user?.role !== 'admin') {
        setTimeout(async () => {
          try {
            await conversationAPI.createConversation(conversation.orderId?._id || conversationId);
            fetchConversations();
          } catch (error) {
            console.error('Error creating new conversation:', error);
          }
        }, 2000);
      }
      
      fetchConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      showErrorToast('فشل إغلاق المحادثة');
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
    socketService.onNewMessage((data) => {
      if (data.conversationId === selectedConversation) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
      fetchConversations();
    });

    socketService.onUserTyping((data) => {
      if (data.conversationId === selectedConversation) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    });

    socketService.onUserStopTyping((data) => {
      if (data.conversationId === selectedConversation) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });

    socketService.onMessagesRead((data) => {
      if (data.conversationId === selectedConversation) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
      fetchConversations();
    });

    socketService.onConversationClosed((data) => {
      fetchConversations();
      if (data.conversationId === selectedConversation) {
        setSelectedConversation(null);
        setMessages([]);
      }
    });

    return () => {
      socketService.offNewMessage();
      socketService.offUserTyping();
      socketService.offUserStopTyping();
      socketService.offMessagesRead();
      socketService.offConversationClosed();
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      socketService.joinConversation(selectedConversation);
      return () => {
        socketService.leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
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
                    {activeTab === 'open' ? 'لا توجد محادثات مفتوحة' : 'لا توجد محادثات مغلقة'}
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
                    const isMyMessage = isCurrentUser(message.senderId || '');
                    return (
                      <div
                        key={message._id || index}
                        className={`flex mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-1' : ''}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isMyMessage
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-sm'
                                : 'bg-[#1a1d24] text-gray-200 rounded-bl-sm border border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium opacity-75">
                                {message.senderType === 'admin' ? 'أدمن' : 'عميل'}
                              </span>
                            </div>
                            {message.imageUrl ? (
                              <img
                                src={message.imageUrl}
                                alt="صورة"
                                className="rounded-lg max-w-full h-auto"
                              />
                            ) : (
                              <p className="text-sm">{message.content}</p>
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
