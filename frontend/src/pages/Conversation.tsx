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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isCurrentUser = (senderType: string) => {
    if (state.user?.role === 'admin') {
      return senderType === 'admin';
    } else {
      return senderType === 'customer';
    }
  };

  useEffect(() => {
    if (id) {
      loadConversation();
      // Connect to Socket.io
      socketService.connect();
      socketService.joinConversation(id);
      
      // Listen for new messages
      socketService.onNewMessage((data) => {
        if (data.conversationId === id) {
          setMessages(prev => [...prev, data.message]);
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
      setConversationData(data);
      setMessages(data.messages);
      
      // Mark messages as read for admin
      if (state.isAuthenticated && state.user?.role === 'admin') {
        await markMessagesAsRead(id);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      showErrorToast('فشل تحميل المحادثة');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await conversationAPI.markAsRead(conversationId);
      console.log('Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      setSending(true);
      const message = await conversationAPI.sendMessage(id, newMessage.trim());
      
      // Send via Socket.io for real-time update
      socketService.sendMessage({
        conversationId: id,
        message,
        senderType: state.user?.role === 'admin' ? 'admin' : 'customer',
        senderId: state.user?.id || 'guest'
      });
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!id) return;

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">المحادثة غير موجودة</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(state.user?.role === 'admin' ? '/admin' : '/cart')}
              className="text-gray-400 hover:text-white"
            >
              ← رجوع
            </button>
            <div>
              <h2 className="text-white font-semibold">
                {state.user?.role === 'admin' 
                  ? conversationData.conversation.customerName || 'زائر'
                  : 'خدمة العملاء'
                }
              </h2>
              {state.user?.role === 'admin' && (
                <p className="text-gray-400 text-sm">{conversationData.conversation.customerEmail}</p>
              )}
            </div>
          </div>
          <button
            onClick={closeConversation}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            إغلاق المحادثة
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${isCurrentUser(message.senderType) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isCurrentUser(message.senderType)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {message.imageUrl ? (
                <img
                  src={message.imageUrl}
                  alt="صورة"
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <p>{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${
                isCurrentUser(message.senderType) ? 'text-blue-200' : 'text-gray-400'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg">
              <p className="text-sm italic">{typingUser} يكتب...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
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
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              📷
            </button>
            <button
              onClick={sendMessage}
              disabled={sending || uploading || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {sending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
