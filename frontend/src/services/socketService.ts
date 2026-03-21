import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com';

  connect() {
    if (!this.socket) {
      console.log('🔌 Connecting to Socket.io server:', this.serverUrl);
      
      // Connect to same origin to avoid CORS issues
      const connectUrl = window.location.origin.includes('vercel.app') 
        ? this.serverUrl 
        : 'http://localhost:5000';
        
      this.socket = io(connectUrl, {
        path: '/socket.io/',
        transports: ['polling', 'websocket'], // Try polling first
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server:', this.socket?.id);
        console.log('🔗 Socket connection established successfully');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🚫 Socket connection error:', error);
        console.error('🚫 Error details:', {
          message: error.message,
          type: (error as any).type,
          context: (error as any).context,
          code: (error as any).code
        });
      });
    } else {
      console.log('🔄 Socket already connected:', this.socket.id);
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔴 Disconnecting from Socket.io server...');
      this.socket.disconnect();
      console.log('👋 Disconnected from server');
      this.socket = null;
    }
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  joinConversation(conversationId: string) {
    console.log('🏠 Joining conversation room:', conversationId);
    if (this.socket) {
      this.socket.emit('joinConversation', conversationId);
      console.log('✅ Sent joinConversation event');
    } else {
      console.error('❌ Cannot join conversation - socket not connected');
    }
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leaveConversation', conversationId);
  }

  sendMessage(data: {
    conversationId: string;
    message: any;
    senderType: 'customer' | 'admin';
    senderId: string;
  }) {
    this.socket?.emit('sendMessage', data);
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('newMessage', callback);
  }

  onNewConversationMessage(callback: (data: any) => void) {
    this.socket?.on('newConversationMessage', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('userTyping', callback);
  }

  onUserStopTyping(callback: (data: any) => void) {
    this.socket?.on('userStopTyping', callback);
  }

  // Generic event listener for custom events
  on(event: string, callback: (data: any) => void) {
    console.log('👂 Setting up listener for event:', event);
    if (this.socket) {
      this.socket.on(event, (data) => {
        console.log(`📨 Received event: ${event}`, data);
        callback(data);
      });
    } else {
      console.error('❌ Cannot set up listener - socket not connected');
    }
  }

  emitTyping(conversationId: string, user: any) {
    this.socket?.emit('typing', { conversationId, user });
  }

  emitStopTyping(conversationId: string, user: any) {
    this.socket?.emit('stopTyping', { conversationId, user });
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
export { SocketService };
