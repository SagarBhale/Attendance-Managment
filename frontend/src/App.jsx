import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { selectCurrentUser, selectIsAuthenticated } from './features/auth/authSlice';
import useSocket from './hooks/useSocket';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import OvertimePage from './pages/OvertimePage';
import ValidatePage from './pages/ValidatePage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

function AppLayout({ theme, onToggleTheme }) {
  const user = useSelector(selectCurrentUser);
  useSocket(); // Real-time notifications hook

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title={`Attendance System — ${user?.role ? user.role.toUpperCase() : ''}`}
          subtitle={`Logged in as ${user?.name} (${user?.email})`}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/team-attendance" element={<AttendancePage />} />
          <Route path="/overtime" element={<OvertimePage />} />
          <Route
            path="/validate"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <ValidatePage />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
