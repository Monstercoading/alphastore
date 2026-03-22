import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';
import { SocketService } from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { conversationAPI } from '../services/conversationAPI';
import { socketService } from '../services/socketService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  path: string;
  details?: any;
  responseTime?: number;
}

interface SocketLog {
  timestamp: string;
  event: string;
  data?: any;
  type: 'connect' | 'disconnect' | 'message' | 'error' | 'typing' | 'join' | 'leave';
}

interface ServerStatus {
  backend: {
    url: string;
    status: 'pending' | 'success' | 'error';
    responseTime?: number;
    error?: string;
    message?: string;
  };
  socket: {
    url: string;
    status: 'pending' | 'success' | 'error';
    connected: boolean;
    error?: string;
    message?: string;
  };
  apis: TestResult[];
  frontend: {
    url: string;
    status: 'pending' | 'success' | 'error';
    error?: string;
    message?: string;
  };
  conversations: {
    auth: TestResult;
    customerConversations: TestResult;
    adminConversations: TestResult;
    createConversation: TestResult;
    sendMessage: TestResult;
    tokenValidation: TestResult;
  };
}

const ServerStatusDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [socketLogs, setSocketLogs] = useState<SocketLog[]>([]);
  const [isMonitoringSocket, setIsMonitoringSocket] = useState(false);
  const [socketService] = useState(() => new SocketService());
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    backend: {
      url: 'https://alphastore-6rvv.onrender.com',
      status: 'pending'
    },
    socket: {
      url: 'https://alphastore-6rvv.onrender.com',
      status: 'pending',
      connected: false
    },
    apis: [],
    frontend: {
      url: window.location.origin,
      status: 'pending'
    },
    conversations: {
      auth: { name: 'Authentication Check', status: 'pending', message: 'Checking...', path: '/auth/verify' },
      customerConversations: { name: 'Customer Conversations', status: 'pending', message: 'Checking...', path: '/conversations/customer' },
      adminConversations: { name: 'Admin Conversations', status: 'pending', message: 'Checking...', path: '/conversations/admin' },
      createConversation: { name: 'Create Conversation', status: 'pending', message: 'Checking...', path: '/conversations' },
      sendMessage: { name: 'Send Message', status: 'pending', message: 'Checking...', path: '/conversations/:id/messages' },
      tokenValidation: { name: 'Token Validation', status: 'pending', message: 'Checking...', path: 'N/A' }
    }
  });

  const apiEndpoints = [
    { name: 'Root Endpoint', path: '/' },
    { name: 'Products API', path: '/api/products' },
    { name: 'Orders API', path: '/api/orders' },
    { name: 'Auth API', path: '/api/auth/login' },
    { name: 'Conversations API', path: '/api/conversations' },
    { name: 'Users API', path: '/api/users' },
    { name: 'Discount Codes API', path: '/api/discount-codes/test' },
    { name: 'Games API', path: '/api/games' },
    { name: 'Notifications API', path: '/api/admin/notifications' }
  ];

  const addSocketLog = (event: string, data?: any, type: SocketLog['type'] = 'message') => {
    const newLog: SocketLog = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      data,
      type
    };
    setSocketLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const startSocketMonitoring = () => {
    if (isMonitoringSocket) return;
    
    setIsMonitoringSocket(true);
    addSocketLog('Starting Socket.io monitoring...', null, 'connect');
    addSocketLog(`Connecting to backend: ${serverStatus.backend.url}`, null, 'connect');
    
    // Connect to socket
    socketService.connect();
    
    // Monitor connection events
    socketService.on('connect', () => {
      addSocketLog('Connected to Socket.io server', { socketId: socketService.getSocketId() }, 'connect');
    });
    
    socketService.on('disconnect', () => {
      addSocketLog('Disconnected from Socket.io server', null, 'disconnect');
    });
    
    socketService.on('connect_error', (error) => {
      addSocketLog('Socket.io connection error', {
        message: error.message,
        type: (error as any).type,
        context: (error as any).context,
        code: (error as any).code
      }, 'error');
      
      // Test if backend is accessible for Socket.io
      testSocketIOAvailability();
    });
    
    // Monitor message events
    socketService.on('newMessage', (data) => {
      addSocketLog('Received newMessage', data, 'message');
    });
    
    socketService.on('receiveMessage', (data) => {
      addSocketLog('Received receiveMessage', data, 'message');
    });
    
    socketService.on('newConversationMessage', (data) => {
      addSocketLog('Received newConversationMessage', data, 'message');
    });
    
    socketService.on('conversationClosed', (data) => {
      addSocketLog('Received conversationClosed', data, 'message');
    });
    
    socketService.on('userTyping', (data) => {
      addSocketLog('Received userTyping', data, 'typing');
    });
    
    socketService.on('userStopTyping', (data) => {
      addSocketLog('Received userStopTyping', data, 'typing');
    });
    
    // Join a test conversation room
    setTimeout(() => {
      const testConversationId = 'test-conversation-monitoring';
      socketService.joinConversation(testConversationId);
      addSocketLog('Joined test conversation room', { conversationId: testConversationId }, 'join');
    }, 1000);
  };

  const stopSocketMonitoring = () => {
    if (!isMonitoringSocket) return;
    
    socketService.leaveConversation('test-conversation-monitoring');
    socketService.disconnect();
    setIsMonitoringSocket(false);
    addSocketLog('Stopped Socket.io monitoring', null, 'disconnect');
  };

  const clearLogs = () => {
    setSocketLogs([]);
  };

  const testSocketIOAvailability = async () => {
    addSocketLog('Testing Socket.io availability...', null, 'connect');
    
    try {
      // Test 1: Check if backend is reachable
      const response = await fetch(`${serverStatus.backend.url}/socket.io/`, {
        method: 'GET',
        mode: 'cors'
      });
      
      addSocketLog('Backend Socket.io endpoint test', {
        status: response.status,
        statusText: response.statusText,
        url: `${serverStatus.backend.url}/socket.io/`
      }, 'connect');
      
      // Test 2: Try to connect with different transport methods
      addSocketLog('Testing WebSocket transport...', null, 'connect');
      
    } catch (error: any) {
      addSocketLog('Socket.io availability test failed', {
        error: error.message,
        stack: error.stack
      }, 'error');
      
      // Suggest possible solutions
      addSocketLog('Possible solutions:', {
        '1': 'Check if backend is running',
        '2': 'Verify CORS configuration on backend',
        '3': 'Check if Socket.io is properly initialized on backend',
        '4': 'Verify backend URL is correct'
      }, 'error');
    }
  };

  const testBackendConnection = async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${serverStatus.backend.url}/`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      const text = await response.text();

      if (response.ok) {
        setServerStatus(prev => ({
          ...prev,
          backend: {
            ...prev.backend,
            status: 'success',
            responseTime,
            message: `Backend is running (${responseTime}ms)`
          }
        }));
      } else {
        setServerStatus(prev => ({
          ...prev,
          backend: {
            ...prev.backend,
            status: 'error',
            responseTime,
            error: `HTTP ${response.status}: ${text.substring(0, 100)}`
          }
        }));
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      setServerStatus(prev => ({
        ...prev,
        backend: {
          ...prev.backend,
          status: 'error',
          responseTime,
          error: error.message || 'Connection failed'
        }
      }));
    }
  };

  const testSocketConnection = async (): Promise<void> => {
    try {
      // Dynamic import to avoid SSR issues
      const { io } = await import('socket.io-client');
      
      const socket = io(serverStatus.socket.url, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        setServerStatus(prev => ({
          ...prev,
          socket: {
            ...prev.socket,
            status: 'error',
            connected: false,
            error: 'Connection timeout (5s)'
          }
        }));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        setServerStatus(prev => ({
          ...prev,
          socket: {
            ...prev.socket,
            status: 'success',
            connected: true,
            message: `Connected successfully (Socket ID: ${socket.id})`
          }
        }));
        socket.disconnect();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        setServerStatus(prev => ({
          ...prev,
          socket: {
            ...prev.socket,
            status: 'error',
            connected: false,
            error: error.message
          }
        }));
        socket.disconnect();
      });

    } catch (error: any) {
      setServerStatus(prev => ({
        ...prev,
        socket: {
          ...prev.socket,
          status: 'error',
          connected: false,
          error: error.message || 'Socket.io library error'
        }
      }));
    }
  };

  const testAPIEndpoint = async (endpoint: { name: string; path: string }): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${serverStatus.backend.url}${endpoint.path}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            name: endpoint.name,
            status: 'success',
            message: `Success (${responseTime}ms)`,
            path: endpoint.path,
            responseTime,
            details: data
          };
        } catch {
          const text = await response.text();
          return {
            name: endpoint.name,
            status: 'success',
            message: `Success (${responseTime}ms) - Non-JSON response`,
            path: endpoint.path,
            responseTime,
            details: text.substring(0, 200)
          };
        }
      } else {
        const text = await response.text();
        return {
          name: endpoint.name,
          status: 'error',
          message: `HTTP ${response.status} (${responseTime}ms)`,
          path: endpoint.path,
          responseTime,
          details: text.substring(0, 200)
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        name: endpoint.name,
        status: 'error',
        message: `Connection failed (${responseTime}ms)`,
        path: endpoint.path,
        responseTime,
        details: error.message
      };
    }
  };

  const testConversationSystem = async () => {
    console.log('🔍 Starting comprehensive conversation system test...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Conversation system test timeout')), 15000);
    });
    
    try {
      await Promise.race([
        runConversationTests(),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.error('Conversation system test failed or timed out:', error);
      
      // Set all conversation tests to error state
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          auth: { name: 'Authentication Check', status: 'error', message: 'Test timeout or failed', path: '/auth/verify' },
          customerConversations: { name: 'Customer Conversations', status: 'error', message: 'Test timeout or failed', path: '/conversations/customer' },
          adminConversations: { name: 'Admin Conversations', status: 'error', message: 'Test timeout or failed', path: '/conversations/admin' },
          createConversation: { name: 'Create Conversation', status: 'error', message: 'Test timeout or failed', path: '/conversations' },
          sendMessage: { name: 'Send Message', status: 'error', message: 'Test timeout or failed', path: '/conversations/:id/messages' },
          tokenValidation: { name: 'Token Validation', status: 'error', message: 'Test timeout or failed', path: 'N/A' }
        }
      }));
    }
    
    console.log('✅ Conversation system test completed');
  };

  const runConversationTests = async () => {
    console.log('🔍 Starting conversation tests...');
    
    // 1. Test Authentication Status (no API call)
    console.log('1️⃣ Testing authentication status...');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const tokenType = token.includes('admin-signature') ? 'Admin' : token.includes('mock-jwt-token') ? 'Mock' : 'Unknown';
      console.log('✅ Authentication data found:', { tokenType, tokenLength: token.length });
      
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          auth: {
            name: 'Authentication Check',
            status: 'success',
            message: 'Token exists locally',
            path: '/auth/verify',
            details: {
              hasToken: !!token,
              tokenLength: token.length,
              tokenType,
              userEmail: user ? JSON.parse(user).email : 'N/A',
              userRole: user ? JSON.parse(user).role : 'N/A'
            }
          }
        }
      }));
    } else {
      console.log('❌ No authentication data found');
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          auth: {
            name: 'Authentication Check',
            status: 'error',
            message: 'No authentication data found',
            path: '/auth/verify',
            details: { hasToken: !!token, hasUser: !!user }
          }
        }
      }));
      return; // Exit early if no auth data
    }

    // 2. Test Token Validation (with detailed logging)
    console.log('2️⃣ Testing token validation...');
    try {
      console.log('📡 Making API call to /auth/verify...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await api.get('/auth/verify', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('✅ Token validation successful:', response.status);
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          tokenValidation: {
            name: 'Token Validation',
            status: 'success',
            message: 'Token is valid on server',
            path: 'N/A',
            details: { 
              serverValidation: true,
              responseStatus: response.status,
              userData: response.data 
            }
          }
        }
      }));
    } catch (error: any) {
      console.log('❌ Token validation failed:', error.message);
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          tokenValidation: {
            name: 'Token Validation',
            status: 'error',
            message: 'Token validation failed on server',
            path: 'N/A',
            details: {
              errorStatus: error.response?.status,
              errorMessage: error.message,
              isAuthError: error.response?.status === 401,
              isTokenExpired: error.message?.includes('expired'),
              isTokenInvalid: error.message?.includes('invalid') || error.message?.includes('JsonWebTokenError'),
              tokenType: token?.includes('admin-signature') ? 'Admin' : token?.includes('mock-jwt-token') ? 'Mock' : 'Unknown'
            }
          }
        }
      }));
    }

    // 3. Test Customer Conversations (simplified)
    console.log('3️⃣ Testing customer conversations...');
    try {
      console.log('📡 Making API call to /conversations/customer...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await conversationAPI.getCustomerConversations();
      clearTimeout(timeoutId);
      
      console.log('✅ Customer conversations successful:', Array.isArray(response) ? response.length : 'non-array');
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          customerConversations: {
            name: 'Customer Conversations',
            status: 'success',
            message: `Retrieved ${Array.isArray(response) ? response.length : 0} conversations`,
            path: '/conversations/customer',
            details: {
              conversationsCount: Array.isArray(response) ? response.length : 'N/A',
              sampleData: Array.isArray(response) ? response.slice(0, 2) : response,
              isArray: Array.isArray(response)
            }
          }
        }
      }));
    } catch (error: any) {
      console.log('❌ Customer conversations failed:', error.message);
      setServerStatus(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          customerConversations: {
            name: 'Customer Conversations',
            status: 'error',
            message: 'Failed to fetch customer conversations',
            path: '/conversations/customer',
            details: {
              status: error.response?.status,
              statusText: error.response?.statusText,
              message: error.message,
              isAuthError: error.response?.status === 401,
              isNotFound: error.response?.status === 404,
              isNetworkError: error.code === 'ECONNREFUSED'
            }
          }
        }
      }));
    }

    // 4. Set remaining tests to pending/skipped for now
    console.log('4️⃣ Skipping remaining tests for debugging...');
    setServerStatus(prev => ({
      ...prev,
      conversations: {
        ...prev.conversations,
        adminConversations: {
          name: 'Admin Conversations',
          status: 'pending',
          message: 'Skipped for debugging',
          path: '/conversations/admin',
          details: { note: 'Test skipped to prevent hanging' }
        },
        createConversation: {
          name: 'Create Conversation',
          status: 'pending',
          message: 'Skipped for debugging',
          path: '/conversations',
          details: { note: 'Test skipped to prevent hanging' }
        },
        sendMessage: {
          name: 'Send Message',
          status: 'pending',
          message: 'Skipped for debugging',
          path: '/conversations/:id/messages',
          details: { note: 'Test skipped to prevent hanging' }
        }
      }
    }));
    
    console.log('✅ Conversation tests completed');
  };

  const testFrontend = async (): Promise<void> => {
    try {
      const response = await fetch(`${serverStatus.frontend.url}/`, {
        method: 'GET'
      });

      if (response.ok) {
        setServerStatus(prev => ({
          ...prev,
          frontend: {
            ...prev.frontend,
            status: 'success',
            message: 'Frontend is accessible'
          }
        }));
      } else {
        setServerStatus(prev => ({
          ...prev,
          frontend: {
            ...prev.frontend,
            status: 'error',
            error: `HTTP ${response.status}`
          }
        }));
      }
    } catch (error: any) {
      setServerStatus(prev => ({
        ...prev,
        frontend: {
          ...prev.frontend,
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    showInfoToast('بدء فحص شامل للموقع...');

    // Reset status
    setServerStatus(prev => ({
      ...prev,
      backend: { ...prev.backend, status: 'pending' },
      socket: { ...prev.socket, status: 'pending', connected: false },
      apis: [],
      frontend: { ...prev.frontend, status: 'pending' },
      conversations: {
        auth: { name: 'Authentication Check', status: 'pending', message: 'Checking...', path: '/auth/verify' },
        customerConversations: { name: 'Customer Conversations', status: 'pending', message: 'Checking...', path: '/conversations/customer' },
        adminConversations: { name: 'Admin Conversations', status: 'pending', message: 'Checking...', path: '/conversations/admin' },
        createConversation: { name: 'Create Conversation', status: 'pending', message: 'Checking...', path: '/conversations' },
        sendMessage: { name: 'Send Message', status: 'pending', message: 'Checking...', path: '/conversations/:id/messages' },
        tokenValidation: { name: 'Token Validation', status: 'pending', message: 'Checking...', path: 'N/A' }
      }
    }));

    // Run tests in parallel
    await Promise.all([
      testBackendConnection(),
      testSocketConnection(),
      testFrontend()
    ]);

    // Test APIs sequentially to avoid overwhelming the server
    const apiResults: TestResult[] = [];
    for (const endpoint of apiEndpoints) {
      const result = await testAPIEndpoint(endpoint);
      apiResults.push(result);
      setServerStatus(prev => ({ ...prev, apis: [...apiResults] }));
    }

    // Test conversation system
    await testConversationSystem();

    setIsRunning(false);
    
    // Calculate overall status
    const allSuccess = 
      serverStatus.backend.status === 'success' &&
      serverStatus.socket.status === 'success' &&
      serverStatus.frontend.status === 'success' &&
      apiResults.every(api => api.status === 'success');

    const conversationSuccess = Object.values(serverStatus.conversations).every(conv => conv.status === 'success');

    if (allSuccess && conversationSuccess) {
      showSuccessToast('✅ جميع الاختبارات نجحت! النظام يعمل بشكل كامل');
    } else {
      showErrorToast('❌ هناك بعض المشاكل. راجع النتائج أدناه');
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🔍 Server Status Dashboard</h1>
              <p className="text-gray-600 mt-2">فحص شامل لحالة جميع خدمات AlphaStore</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRunning ? '🔄 جاري الفحص...' : '🔊 إعادة الفحص'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                🏠 الرئيسية
              </button>
            </div>
          </div>
        </div>

        {/* Main Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Backend Status */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${getStatusColor(serverStatus.backend.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">🖥️ Backend Server</h2>
              <span className="text-2xl">{getStatusIcon(serverStatus.backend.status)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{serverStatus.backend.url}</p>
            {serverStatus.backend.status === 'success' && (
              <p className="text-sm font-medium">{serverStatus.backend.message}</p>
            )}
            {serverStatus.backend.status === 'error' && (
              <p className="text-sm text-red-600">{serverStatus.backend.error}</p>
            )}
            {serverStatus.backend.responseTime && (
              <p className="text-xs text-gray-500 mt-2">Response Time: {serverStatus.backend.responseTime}ms</p>
            )}
          </div>

          {/* Socket.io Status */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${getStatusColor(serverStatus.socket.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">🔌 Socket.io</h2>
              <span className="text-2xl">{getStatusIcon(serverStatus.socket.status)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{serverStatus.socket.url}</p>
            {serverStatus.socket.status === 'success' && (
              <p className="text-sm font-medium">{serverStatus.socket.message}</p>
            )}
            {serverStatus.socket.status === 'error' && (
              <p className="text-sm text-red-600">{serverStatus.socket.error}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Status: {serverStatus.socket.connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>

          {/* Frontend Status */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${getStatusColor(serverStatus.frontend.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">🌐 Frontend</h2>
              <span className="text-2xl">{getStatusIcon(serverStatus.frontend.status)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{serverStatus.frontend.url}</p>
            {serverStatus.frontend.status === 'success' && (
              <p className="text-sm font-medium">{serverStatus.frontend.message}</p>
            )}
            {serverStatus.frontend.status === 'error' && (
              <p className="text-sm text-red-600">{serverStatus.frontend.error}</p>
            )}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📡 API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serverStatus.apis.map((api, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(api.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{api.name}</h3>
                  <span>{getStatusIcon(api.status)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{api.path}</p>
                <p className="text-sm">{api.message}</p>
                {api.responseTime && (
                  <p className="text-xs text-gray-500 mt-1">⏱️ {api.responseTime}ms</p>
                )}
                {api.status === 'error' && api.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-red-600">Show Details</summary>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{api.details}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversation System Testing */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">💬 Conversation System Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(serverStatus.conversations).map((conv, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(conv.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{conv.name}</h3>
                  <span>{getStatusIcon(conv.status)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{conv.path}</p>
                <p className="text-sm">{conv.message}</p>
                {conv.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-blue-600">Show Details</summary>
                    <pre className="text-xs mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {JSON.stringify(conv.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Conversation System Analysis</h4>
            <div className="text-sm text-blue-700">
              <p><strong>Authentication:</strong> {serverStatus.conversations.auth.status === 'success' ? '✅ Token exists locally' : '❌ No auth data'}</p>
              <p><strong>Token Validation:</strong> {serverStatus.conversations.tokenValidation.status === 'success' ? '✅ Server accepts token' : '❌ Server rejects token'}</p>
              <p><strong>Customer API:</strong> {serverStatus.conversations.customerConversations.status === 'success' ? '✅ Can fetch conversations' : '❌ Cannot fetch conversations'}</p>
              <p><strong>Admin API:</strong> {serverStatus.conversations.adminConversations.status === 'success' ? '✅ Admin access working' : '❌ Admin access failed'}</p>
              <p><strong>Create Conversation:</strong> {serverStatus.conversations.createConversation.status === 'success' ? '✅ Can create conversations' : '❌ Cannot create conversations'}</p>
              <p><strong>Send Message:</strong> {serverStatus.conversations.sendMessage.status === 'success' ? '✅ Can send messages' : '❌ Cannot send messages'}</p>
            </div>
          </div>
        </div>

        {/* Socket.io Real-time Monitoring */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🔌 Socket.io Real-time Monitoring</h2>
            <div className="flex gap-3">
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🗑️ Clear Logs
              </button>
              <button
                onClick={isMonitoringSocket ? stopSocketMonitoring : startSocketMonitoring}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isMonitoringSocket
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isMonitoringSocket ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Monitor real-time Socket.io events to debug message delivery issues.
              {isMonitoringSocket && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🔴 Monitoring Active
                </span>
              )}
            </p>
          </div>

          {/* Socket Logs */}
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
            {socketLogs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No socket events logged yet.</p>
                <p className="text-sm mt-2">Click "Start Monitoring" to begin.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {socketLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm font-mono p-2 rounded ${
                      log.type === 'error' ? 'bg-red-900 text-red-200' :
                      log.type === 'connect' ? 'bg-green-900 text-green-200' :
                      log.type === 'disconnect' ? 'bg-yellow-900 text-yellow-200' :
                      log.type === 'message' ? 'bg-blue-900 text-blue-200' :
                      log.type === 'typing' ? 'bg-purple-900 text-purple-200' :
                      'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <span className="text-gray-400">[{log.timestamp}]</span>
                    <span className="ml-2">{log.event}</span>
                    {log.data && (
                      <pre className="mt-1 text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📊 Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {serverStatus.apis.filter(api => api.status === 'success').length}
              </p>
              <p className="text-sm text-gray-600">APIs Working</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {serverStatus.apis.filter(api => api.status === 'error').length}
              </p>
              <p className="text-sm text-gray-600">APIs Failed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {serverStatus.apis.length}
              </p>
              <p className="text-sm text-gray-600">Total APIs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {serverStatus.apis.length > 0 
                  ? Math.round((serverStatus.apis.filter(api => api.status === 'success').length / serverStatus.apis.length) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusDashboard;
