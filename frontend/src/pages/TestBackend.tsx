import React, { useState } from 'react';
import { API_URL } from '../config/api';

const TestBackend: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing backend connection...');
    
    try {
      const response = await fetch(`${API_URL}/auth/test`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Backend is working! Response: ${JSON.stringify(data)}`);
      } else {
        setResult(`❌ Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      setResult(`❌ Cannot connect to backend: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-md w-full p-8">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Test Backend Connection
          </h1>
          
          <button
            onClick={testBackend}
            disabled={loading}
            className="w-full btn-primary mb-4"
          >
            {loading ? 'Testing...' : 'Test Backend'}
          </button>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Make sure backend is running on port 5000</p>
            <p>Open browser console (F12) for more details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBackend;
