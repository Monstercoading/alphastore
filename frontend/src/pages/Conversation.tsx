import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationAPI, ConversationWithMessages, Message } from '../services/conversationAPI';
import { playMessageSound } from '../utils/notificationSound';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (id) {
      loadConversation();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up SSE for real-time messages
    if (id && conversationData) {
      eventSourceRef.current = conversationAPI.connectToMessages((data) => {
        if (data.conversationId === id) {
          playMessageSound();
          loadMessages(); // Reload messages to get the latest
        }
      });
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [id, conversationData]);

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

  const loadMessages = async () => {
    if (!id) return;
    
    try {
      const data = await conversationAPI.getConversation(id);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      setSending(true);
      const message = await conversationAPI.sendMessage(id, newMessage.trim());
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      sendImage(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-white">جاري التحميل...</div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-white">المحادثة غير موجودة</div>
      </div>
    );
  }

  const { conversation } = conversationData;
  const isAdmin = state.user?.role === 'admin';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <div className="bg-[#1a1d24] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isAdmin ? '/admin/messages' : '/cart')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isAdmin ? conversation.customerName : 'الدعم الفني'}
              </h2>
              <p className="text-sm text-gray-400">
                {isAdmin ? conversation.customerEmail : `طلب #${conversation.orderId._id}`}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => conversationAPI.closeConversation(conversation._id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              إغلاق المحادثة
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {messages.map((message) => {
          const isFromMe = 
            (isAdmin && message.senderType === 'admin') ||
            (!isAdmin && message.senderType === 'customer');

          return (
            <div
              key={message._id}
              className={`flex ${isFromMe ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  isFromMe
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {message.imageUrl ? (
                  <div>
                    <img
                      src={message.imageUrl}
                      alt="صورة"
                      className="rounded-lg mb-2 max-w-full"
                      style={{ maxHeight: '300px' }}
                    />
                    {message.content && <p>{message.content}</p>}
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#1a1d24] border-t border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-[#0a0a0a] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            disabled={sending || uploading}
          />
          <button
            onClick={sendMessage}
            disabled={sending || uploading || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {sending ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </div>
        {uploading && (
          <p className="text-sm text-gray-400 mt-2">جاري رفع الصورة...</p>
        )}
      </div>
    </div>
  );
};

export default Conversation;
