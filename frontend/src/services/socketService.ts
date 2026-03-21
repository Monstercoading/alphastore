import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com';

  connect() {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('joinConversation', conversationId);
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
    this.socket?.on(event, callback);
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
