import React, { useEffect, useState } from 'react';
import './Loading.css';

const Loading: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-logo">
          <img 
            src="/j.png" 
            alt="Alpha Store" 
            className="loading-image"
          />
        </div>
        
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        
        <h1 className="loading-title mixed-text">جاري التحميل{dots}</h1>
        <p className="loading-subtitle mixed-text">يرجى الانتظار لحظات...</p>
        
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="loading-bg-animation">
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
      </div>
    </div>
  );
};

export default Loading;
