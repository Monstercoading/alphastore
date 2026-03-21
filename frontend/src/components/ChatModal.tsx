import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image, Archive, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { conversationAPI, ConversationWithMessages, Message } from '../services/conversationAPI';
import { socketService } from '../services/socketService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationItem {
  _id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'active' | 'archived';
  unreadCount: number;
  productTitle?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const { state } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isCurrentUser = (senderType: string) => {
    return senderType === (state.user?.role === 'admin' ? 'admin' : 'customer');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = state.user?.role === 'admin' 
        ? await conversationAPI.getAdminConversations()
        : await conversationAPI.getCustomerConversations();
      const conversationItems: ConversationItem[] = response.map((conv: any) => ({
        _id: conv._id,
        customerName: conv.customerId?.firstName + ' ' + conv.customerId?.lastName || 'عميل',
        customerEmail: conv.customerId?.email || 'unknown@example.com',
        lastMessage: conv.lastMessage?.content || 'لا توجد رسائل',
        lastMessageTime: conv.lastMessage?.createdAt || conv.createdAt,
        status: conv.status === 'closed' ? 'archived' : 'active',
        unreadCount: conv.unreadCount || 0,
        productTitle: conv.productId?.title
      }));
      setConversations(conversationItems);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showErrorToast('فشل تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const conversationData = await conversationAPI.getConversation(conversationId);
      setMessages(conversationData.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      showErrorToast('فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await conversationAPI.sendMessage(selectedConversation, messageContent);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('فشل إرسال الرسالة');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      await conversationAPI.closeConversation(conversationId);
      showSuccessToast('تم أرشفة المحادثة');
      fetchConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      showErrorToast('فشل أرشفة المحادثة');
    }
  };

  const sendImage = async (file: File) => {
    if (!selectedConversation) return;

    try {
      setUploading(true);
      await conversationAPI.sendImageMessage(selectedConversation, file);
      showSuccessToast('تم إرسال الصورة');
    } catch (error) {
      console.error('Error sending image:', error);
      showErrorToast('فشل إرسال الصورة');
    } finally {
      setUploading(false);
    }
  };

  // Socket.io event listeners
  useEffect(() => {
    if (!isOpen) return;

    socketService.connect();

    const handleNewMessage = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }
      fetchConversations();
    };

    const handleTyping = (data: any) => {
      // Handle typing indicator
    };

    socketService.on('newConversationMessage', handleNewMessage);
    socketService.on('userTyping', handleTyping);

    return () => {
      socketService.off('newConversationMessage', handleNewMessage);
      socketService.off('userTyping', handleTyping);
    };
  }, [isOpen, selectedConversation]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredConversations = conversations.filter(conv => conv.status === activeTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">المحادثات</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Conversations List */}
          <div className="w-[30%] border-r border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  المحادثات النشطة
                </div>
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'archived'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Archive className="w-4 h-4" />
                  الأرشيف
                </div>
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {activeTab === 'active' ? 'لا توجد محادثات نشطة' : 'لا توجد محادثات مؤرشفة'}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation._id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedConversation === conversation._id
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.customerName}
                          </h3>
                          <span className="text-xs text-gray-500 mr-2">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                        {conversation.productTitle && (
                          <p className="text-xs text-blue-600 truncate mt-1">
                            {conversation.productTitle}
                          </p>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Messages */}
          <div className="w-[70%] flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {conversations.find(c => c._id === selectedConversation)?.customerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {conversations.find(c => c._id === selectedConversation)?.customerEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => archiveConversation(selectedConversation)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                      title="أرشفة المحادثة"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.map((message, index) => (
                    <div
                      key={message._id || index}
                      className={`flex mb-4 ${isCurrentUser(message.senderType) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser(message.senderType) ? 'order-1' : ''}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser(message.senderType)
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                          isCurrentUser(message.senderType) ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isCurrentUser(message.senderType) && (
                            <span className="text-blue-600">
                              {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
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
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-50"
                      title="إرسال صورة"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || uploading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || uploading || !newMessage.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>اختر محادثة لبدء الدردشة</p>
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
