import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationAPI, ConversationWithMessages, Message } from '../services/conversationAPI';
import { socketService } from '../services/socketService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

const Conversation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useAuth();
  const navigate = useNavigate();
  const [conversationData, setConversationData] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === state.user?.id;
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!state.isAuthenticated) {
      showErrorToast('يجب تسجيل الدخول للوصول إلى المحادثة');
      navigate('/login');
      return;
    }

    if (id) {
      loadConversation();
      // Connect to Socket.io
      socketService.connect();
      socketService.joinConversation(id);
      
      // Listen for new messages
      socketService.onNewMessage((data) => {
        console.log('New message received:', data);
        if (data.conversationId === id) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => msg._id === data.message._id);
            if (!exists) {
              return [...prev, data.message];
            }
            return prev;
          });
          scrollToBottom();
        }
      });

      // Listen for receiveMessage event (backend emits this)
      socketService.on('receiveMessage', (data) => {
        console.log('Receive message event:', data);
        if (data.conversationId === id) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => msg._id === data.message._id);
            if (!exists) {
              return [...prev, data.message];
            }
            return prev;
          });
          scrollToBottom();
        }
      });

      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        if (data.conversationId === id) {
          setTypingUser(data.user?.firstName || 'شخص ما');
        }
      });

      socketService.onUserStopTyping(() => {
        setTypingUser(null);
      });

      // Listen for conversation closed
      socketService.on('conversationClosed', (data) => {
        if (data.conversationId === id) {
          showSuccessToast('تم إغلاق المحادثة');
          navigate(state.user?.role === 'admin' ? '/admin' : '/cart');
        }
      });

      // Listen for messages read
      socketService.on('messagesRead', (data) => {
        if (data.conversationId === id) {
          setMessages(prev => prev.map(msg => ({ ...msg, isRead: true, read: true })));
        }
      });

      return () => {
        socketService.leaveConversation(id);
        socketService.off('newMessage');
        socketService.off('userTyping');
        socketService.off('userStopTyping');
      };
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await conversationAPI.getConversation(id);
      
      // Check if user has access to this conversation
      if (state.user?.role === 'admin') {
        // Admin can access all conversations
        setConversationData(data);
        setMessages(data.messages);
        await markMessagesAsRead(id);
      } else {
        // Check if this conversation belongs to the current user
        const customerEmail = data.conversation.customerId?.email || data.conversation.customerEmail;
        const customerName = data.conversation.customerId?.firstName || data.conversation.customerName;
        
        if (customerEmail === state.user?.email || 
            (customerName && `${data.conversation.customerId?.firstName} ${data.conversation.customerId?.lastName}` === `${state.user?.firstName} ${state.user?.lastName}`)) {
          setConversationData(data);
          setMessages(data.messages);
        } else {
          showErrorToast('غير مصرح لك بالوصول إلى هذه المحادثة');
          navigate('/cart');
          return;
        }
      }
      
      scrollToBottom();
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      
      // Handle specific authorization errors
      if (error.response?.status === 403) {
        showErrorToast('غير مصرح لك بالوصول إلى هذه المحادثة');
      } else if (error.response?.status === 404) {
        showErrorToast('المحادثة غير موجودة');
      } else {
        showErrorToast('فشل تحميل المحادثة');
      }
      
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      // Only admin can mark messages as read
      if (state.user?.role !== 'admin') {
        return;
      }
      await conversationAPI.markAsRead(conversationId);
      console.log('Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    // Check if user is authenticated
    if (!state.isAuthenticated) {
      showErrorToast('يجب تسجيل الدخول لإرسال الرسائل');
      return;
    }

    const senderType: 'admin' | 'customer' = state.user?.role === 'admin' ? 'admin' : 'customer';
    const messageContent = newMessage.trim();
    
    setNewMessage('');
    setSending(true);
    
    try {
      const message = await conversationAPI.sendMessage(id, messageContent);
      
      // Don't add message to UI here - Socket.io will handle real-time update
      // This prevents duplicate messages
      scrollToBottom();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle authorization errors
      if (error.response?.status === 403) {
        showErrorToast('غير مصرح لك بإرسال رسائل في هذه المحادثة');
      } else {
        showErrorToast('فشل إرسال الرسالة');
      }
      
      // Restore message content on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!id) return;

    // Check if user is authenticated
    if (!state.isAuthenticated) {
      showErrorToast('يجب تسجيل الدخول لإرسال الصور');
      return;
    }

    try {
      setUploading(true);
      const message = await conversationAPI.sendImageMessage(id, file);
      
      // Send via Socket.io for real-time update
      socketService.sendMessage({
        conversationId: id,
        message,
        senderType: state.user?.role === 'admin' ? 'admin' : 'customer',
        senderId: state.user?.id || 'guest'
      });
      
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      showSuccessToast('تم إرسال الصورة');
    } catch (error) {
      console.error('Error sending image:', error);
      showErrorToast('فشل إرسال الصورة');
    } finally {
      setUploading(false);
    }
  };

  const closeConversation = async () => {
    if (!id) return;
    
    try {
      await conversationAPI.closeConversation(id);
      setShowCloseConfirm(false);
      showSuccessToast('تم إغلاق المحادثة');
      navigate(state.user?.role === 'admin' ? '/admin' : '/cart');
    } catch (error) {
      console.error('Error closing conversation:', error);
      showErrorToast('فشل إغلاق المحادثة');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.emitTyping(id!, state.user);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emitStopTyping(id!, state.user);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-xl">المحادثة غير موجودة</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(state.user?.role === 'admin' ? '/admin' : '/cart')}
              className="text-red-100 hover:text-white"
            >
              ← رجوع
            </button>
            <div>
              <h2 className="text-white font-semibold">
                {state.user?.role === 'admin' 
                  ? (() => {
                      // Get customer name properly
                      let customerName = 'زائر';
                      const customerId = conversationData.conversation.customerId as any;
                      if (customerId) {
                        if (typeof customerId === 'object' && customerId !== null) {
                          customerName = `${customerId.firstName || ''} ${customerId.lastName || ''}`.trim() || 'زائر';
                        } else if (typeof customerId === 'string') {
                          customerName = customerId;
                        }
                      } else if (conversationData.conversation.customerName) {
                        customerName = conversationData.conversation.customerName;
                      }
                      return customerName;
                    })()
                  : 'خدمة العملاء'
                }
              </h2>
              {state.user?.role === 'admin' && (
                <p className="text-red-100 text-sm">
                  {(() => {
                    const customerId = conversationData.conversation.customerId as any;
                    let email = customerId?.email || 
                             conversationData.conversation.customerEmail || 
                             'unknown@example.com';
                    return email;
                  })()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg"
          >
            إغلاق المحادثة
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full bg-gradient-to-b from-[#0a0a0a] to-[#1a1d24]">
        {messages.map((message, index) => {
          const isMyMessage = isCurrentUser(message.senderId || '');
          return (
            <div
              key={message._id || index}
              className={`flex mb-4 ${
                isMyMessage ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${
                isMyMessage ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {/* Avatar/Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                  isMyMessage ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  {isMyMessage ? (
                    // Headphone icon for admin - simplified design
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1a9 9 0 00-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2a7 7 0 017-7 7 7 0 017 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 00-9-9z"/>
                    </svg>
                  ) : (
                    // Person icon for user
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                
                {/* Message bubble */}
                <div className={`px-4 py-3 rounded-2xl ${
                  isMyMessage 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' 
                    : 'bg-[#1a1d24] text-gray-200 border border-gray-700'
                }`}>
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
                  <p className={`text-xs mt-1 ${
                    isMyMessage ? 'text-red-100' : 'text-gray-400'
                  }`}>
                    {message.createdAt 
                      ? new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'الآن'
                    }
                    {isMyMessage && message.read && (
                      <span className="mr-1">✓✓</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start mb-4">
            <div className="flex items-end gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                </svg>
              </div>
              <div className="bg-[#1a1d24] text-gray-200 px-4 py-2 rounded-2xl border border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gradient-to-r from-[#1a1d24] to-[#0a0a0a] border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-[#1a1d24] border border-gray-700 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
              disabled={sending || uploading}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && sendImage(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="bg-[#1a1d24] hover:bg-[#2a2d34] text-gray-400 px-4 py-3 rounded-full disabled:opacity-50 transition-colors"
            >
              📷
            </button>
            <button
              onClick={sendMessage}
              disabled={sending || uploading || !newMessage.trim()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-full disabled:opacity-50 transition-all hover:scale-105 shadow-lg"
            >
              {sending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] p-6 rounded-lg max-w-sm mx-4 border border-gray-800">
            <h3 className="text-white text-lg font-semibold mb-4">تأكيد إغلاق المحادثة</h3>
            <p className="text-gray-400 mb-6">هل أنت متأكد من أنك تريد إغلاق هذه المحادثة؟ لا يمكن إرسال رسائل جديدة بعد الإغلاق.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={closeConversation}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                تأكيد الإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversation;
