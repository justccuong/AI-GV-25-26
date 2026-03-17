import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import MindMapEditor from './pages/MindMapEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

const AUTH_ROUTES = new Set(['/login', '/register']);

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');

  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.has(location.pathname);

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      {!isAuthRoute && <Header />}

      <div className={isAuthRoute ? 'h-full' : 'h-[calc(100vh-5rem)]'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route
            path="/workspace"
            element={
              <PrivateRoute>
                <MindMapEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/diagrams"
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
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </div>
    </div>
  );
}
