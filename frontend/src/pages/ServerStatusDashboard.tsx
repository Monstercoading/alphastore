import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  path: string;
  details?: any;
  responseTime?: number;
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
}

const ServerStatusDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
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
      frontend: { ...prev.frontend, status: 'pending' }
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

    setIsRunning(false);
    
    // Calculate overall status
    const allSuccess = 
      serverStatus.backend.status === 'success' &&
      serverStatus.socket.status === 'success' &&
      serverStatus.frontend.status === 'success' &&
      apiResults.every(api => api.status === 'success');

    if (allSuccess) {
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
