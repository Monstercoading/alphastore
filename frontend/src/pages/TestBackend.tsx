import React, { useState } from 'react';
import { API_URL } from '../config/api';

const TestBackend: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing backend connection...');
    
    try {
      // Test root endpoint first
      const rootResponse = await fetch('https://alphastore-ap.onrender.com/', {
        method: 'GET',
        mode: 'cors',
      });
      
      const rootText = await rootResponse.text();
      
      if (rootResponse.ok) {
        setResult(`✅ Root endpoint working!\nStatus: ${rootResponse.status}\nResponse: ${rootText.substring(0, 100)}`);
      } else {
        setResult(`❌ Root endpoint error\nStatus: ${rootResponse.status}\nResponse: ${rootText.substring(0, 200)}`);
      }
    } catch (error: any) {
      setResult(`❌ Cannot connect:\n${error.message}\n\nPossible causes:\n- Backend not deployed\n- CORS issue\n- Network error`);
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
