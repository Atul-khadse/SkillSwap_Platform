import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Explore from './pages/Explore.jsx';
import ExchangeRequests from './pages/ExchangeRequests.jsx';
import MatchedPairs from './pages/MatchedPairs.jsx';
import SessionRoom from './pages/SessionRoom.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Context
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/explore" element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            } />
            <Route path="/requests" element={
              <PrivateRoute>
                <ExchangeRequests />
              </PrivateRoute>
            } />
            <Route path="/pairs" element={
              <PrivateRoute>
                <MatchedPairs />
              </PrivateRoute>
            } />
            <Route path="/session/:pairId" element={
              <PrivateRoute>
                <SessionRoom />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;