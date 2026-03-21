import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import Navbar from './components/Navbar';
import Notifications from './components/Notifications';
import Loading from './components/Loading';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GameDetail from './pages/GameDetail';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CompleteOrder from './pages/CompleteOrder';
import Favorites from './pages/Favorites';
import Terms from './pages/Terms';
import GoogleCallback from './pages/GoogleCallback';
import TestBackend from './pages/TestBackend';
import ServerStatusDashboard from './pages/ServerStatusDashboard';
import Conversation from './pages/Conversation';

function App() {
  return (
    <Router>
      <NavigationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NavigationProvider>
    </Router>
  );
}

function AppContent() {
  const { isNavigationLoading } = useAuth();
  
  return (
    <>
      {isNavigationLoading && <Loading />}
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/complete-order/:orderId" element={<CompleteOrder />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/conversation/:id" element={<Conversation />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/test-backend" element={<TestBackend />} />
          <Route path="/server-status" element={<ServerStatusDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Notifications />
        <Toaster position="top-center" />
      </div>
    </>
  );
}

export default App;
