import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus2, ClipboardList, LogOut, CheckCircle, AlertCircle, Bell, ChevronDown,
  Users, CalendarDays, BarChart3, MessageSquare, FileText, Award, Bookmark, Settings,
} from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTest from './pages/CreateTest';
import AddQuestions from './pages/AddQuestions';
import PreviewPublish from './pages/PreviewPublish';
import { Logo } from './components/Logo';

/* ============================================================
   TOAST CONTEXT
   ============================================================ */
interface ToastContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
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
   HEADER USER MENU
   ============================================================ */
const UserMenu: React.FC<{ displayName: string; initials: string; onLogout: () => void }> = ({ displayName, initials, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}>
        <div className="user-avatar">{initials}</div>
        <div className="user-meta">
          <div className="user-name">{displayName}</div>
          <div className="user-role">Admin</div>
        </div>
        <ChevronDown size={15} className="user-chevron" />
      </button>
      {open && (
        <div className="user-dropdown" role="menu">
          <button className="user-dropdown-item" role="menuitem" onClick={onLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   MAIN LAYOUT (Sidebar + Header + Content)
   ============================================================ */
const NAV_ITEMS = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/create-test', end: false, icon: FilePlus2, label: 'Test Creation' },
  { to: '/test-tracking', end: false, icon: ClipboardList, label: 'Test Tracking' },
];

// Decorative section icons shown only in the collapsed rail (question flow).
const RAIL_ICONS = [Users, CalendarDays, BarChart3, MessageSquare, FileText, Award, Bookmark, Settings];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { userId: 'Alex Wando', name: 'Alex Wando' };
  const displayName = user.name || user.userId || 'Alex Wando';
  const initials = displayName.substring(0, 2).toUpperCase();

  // The question-creation flow uses the collapsed icon rail (per Figma).
  const collapsed = /^\/(add-questions|preview-test)\//.test(location.pathname);

  const creationActive = ['/create-test', '/edit-test', '/add-questions', '/preview-test']
    .some(p => location.pathname.startsWith(p));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-logo">
          <Logo height={26} />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) => {
                const active = to === '/create-test' ? creationActive : isActive;
                return `sidebar-link${active ? ' active' : ''}`;
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {collapsed && (
            <div className="sidebar-rail-extra" aria-hidden="true">
              {RAIL_ICONS.map((Icon, i) => (
                <span key={i} className="sidebar-rail-icon"><Icon size={18} /></span>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="header">
          <div className="header-title" />
          <div className="header-user">
            <button className="header-bell" aria-label="Notifications">
              <Bell size={18} />
              <span className="header-bell-dot" />
            </button>
            <UserMenu displayName={displayName} initials={initials} onLogout={handleLogout} />
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-test" element={<CreateTest />} />
          <Route path="/edit-test/:id" element={<CreateTest />} />
          <Route path="/add-questions/:id" element={<AddQuestions />} />
          <Route path="/preview-test/:id" element={<PreviewPublish />} />
          <Route path="/test-tracking" element={<div className="page-container"><div className="card empty-soon">Test Tracking coming soon</div></div>} />
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