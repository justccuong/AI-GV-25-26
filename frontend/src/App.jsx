// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import MindMapEditor from './pages/MindMapEditor';
import Login from './pages/Login';
import Register from './pages/Register';

// Bảo vệ an ninh: Không có thẻ (Token) thì biến ra ngoài cổng!
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <div className="flex flex-col h-screen font-sans text-gray-800">
      <Header />
      <div className="flex-1 relative overflow-hidden">
        <Routes>
          {/* Mấy trang này ai vào cũng được */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Sân chơi này phải có vé mới được vào */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <MindMapEditor />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/editor/:id" 
            element={
              <PrivateRoute>
                <MindMapEditor />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}