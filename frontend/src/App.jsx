import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import DiagramsDashboard from './pages/DiagramsDashboard';
import MindMapEditor from './pages/MindMapEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

const AUTH_ROUTES = new Set(['/login', '/register']);

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');

  return token ? children : <Navigate to="/login" replace />;
}

function RouteFrame({ children }) {
  return <div className="flex h-full min-h-0 min-w-0 flex-col">{children}</div>;
}

export default function App() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.has(location.pathname);
  const showHeader = !isAuthRoute && !!localStorage.getItem('access_token');

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      {showHeader ? <Header /> : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route
            path="/login"
            element={
              <RouteFrame>
                <Login />
              </RouteFrame>
            }
          />
          <Route
            path="/register"
            element={
              <RouteFrame>
                <Register />
              </RouteFrame>
            }
          />

          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route
            path="/workspace"
            element={
              <PrivateRoute>
                <RouteFrame>
                  <MindMapEditor />
                </RouteFrame>
              </PrivateRoute>
            }
          />
          <Route
            path="/diagrams"
            element={
              <PrivateRoute>
                <RouteFrame>
                  <DiagramsDashboard />
                </RouteFrame>
              </PrivateRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <PrivateRoute>
                <RouteFrame>
                  <MindMapEditor />
                </RouteFrame>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <RouteFrame>
                  <Settings />
                </RouteFrame>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </div>
    </div>
  );
}
