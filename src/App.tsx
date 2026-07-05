import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, BarChart2, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTest from './pages/CreateTest';
import AddQuestions from './pages/AddQuestions';
import PreviewPublish from './pages/PreviewPublish';

/* ============================================================
   TOAST CONTEXT
   ============================================================ */
interface ToastContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be within ToastProvider');
  return ctx;
};

interface ToastItem { id: string; type: 'success' | 'error'; message: string; }

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  return (
    <ToastContext.Provider value={{ showSuccess: m => add('success', m), showError: m => add('error', m) }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success'
              ? <CheckCircle size={16} color="#10B981" />
              : <AlertCircle size={16} color="#EF4444" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ============================================================
   ROUTE GUARD
   ============================================================ */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/* ============================================================
   PREPROUTE LOGO SVG
   ============================================================ */
const PreprouteLogo: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#4F6EF7"/>
    <path d="M8 10h10a4 4 0 0 1 0 8H8V10z" fill="white"/>
    <path d="M8 22h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ============================================================
   MAIN LAYOUT (Sidebar + Header + Content)
   ============================================================ */
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { userId: 'Admin', name: 'Admin' };
  const displayName = user.name || user.userId || 'Admin';
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <PreprouteLogo size={26} />
          <span className="sidebar-logo-text">Preptoute</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/create-test" className={({ isActive }) => `sidebar-link${isActive || window.location.pathname.startsWith('/edit-test') || window.location.pathname.startsWith('/add-questions') || window.location.pathname.startsWith('/preview-test') ? ' active' : ''}`}>
            <FilePlus2 size={17} />
            <span>Test Creation</span>
          </NavLink>
          <NavLink to="/test-tracking" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <BarChart2 size={17} />
            <span>Test Tracking</span>
          </NavLink>
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' }}>
              {initials}
            </div>
            <div>
              <div className="user-name" style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
              <div className="user-role">Admin</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full" style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="header">
          <div className="header-title">
            {/* breadcrumbs rendered per-page */}
          </div>
          <div className="header-user">
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={16} />
            </button>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' }}>
              {initials}
            </div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role">Admin</div>
            </div>
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-test" element={<CreateTest />} />
          <Route path="/edit-test/:id" element={<CreateTest />} />
          <Route path="/add-questions/:id" element={<AddQuestions />} />
          <Route path="/preview-test/:id" element={<PreviewPublish />} />
          <Route path="/test-tracking" element={<div className="page-container"><div className="card" style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Test Tracking coming soon</div></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

/* ============================================================
   APP ROOT
   ============================================================ */
function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
