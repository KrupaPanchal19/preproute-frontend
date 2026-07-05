import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';

/* Preptoute Logo */
const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#4F6EF7"/>
      <path d="M8 10h10a4 4 0 0 1 0 8H8V10z" fill="white"/>
      <path d="M8 22h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
    <span style={{ fontSize: 20, fontWeight: 700, color: '#4F6EF7', letterSpacing: '-0.3px' }}>Preptoute</span>
  </div>
);

/* Desk illustration SVG (from Figma-style) */
const DeskIllustration: React.FC = () => (
  <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280 }}>
    {/* Background circle */}
    <circle cx="140" cy="110" r="100" fill="#EEF2FF" opacity="0.6"/>
    {/* Desk */}
    <rect x="50" y="148" width="180" height="10" rx="5" fill="#C7D2FE"/>
    <rect x="70" y="158" width="8" height="40" rx="4" fill="#A5B4FC"/>
    <rect x="202" y="158" width="8" height="40" rx="4" fill="#A5B4FC"/>
    {/* Monitor */}
    <rect x="90" y="90" width="100" height="65" rx="6" fill="#E0E7FF"/>
    <rect x="94" y="94" width="92" height="57" rx="4" fill="#4F6EF7" opacity="0.15"/>
    <rect x="130" y="155" width="20" height="8" rx="2" fill="#C7D2FE"/>
    <rect x="120" y="163" width="40" height="4" rx="2" fill="#C7D2FE"/>
    {/* Robot / Character */}
    <rect x="116" y="98" width="48" height="44" rx="8" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
    {/* Eyes */}
    <circle cx="130" cy="116" r="5" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="1.5"/>
    <circle cx="150" cy="116" r="5" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="1.5"/>
    <circle cx="131" cy="117" r="2" fill="#4F6EF7"/>
    <circle cx="151" cy="117" r="2" fill="#4F6EF7"/>
    {/* Mouth */}
    <path d="M130 128 Q140 134 150 128" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Antenna */}
    <line x1="140" y1="98" x2="140" y2="88" stroke="#A5B4FC" strokeWidth="1.5"/>
    <circle cx="140" cy="85" r="4" fill="#818CF8"/>
    {/* Small decorations */}
    <circle cx="75" cy="95" r="4" fill="#E0E7FF"/>
    <circle cx="72" cy="95" r="2" fill="#A5B4FC"/>
    <circle cx="205" cy="85" r="3" fill="#C7D2FE"/>
    <circle cx="210" cy="90" r="2" fill="#A5B4FC"/>
    {/* X marks */}
    <text x="62" y="120" fontSize="12" fill="#A5B4FC" fontWeight="bold">×</text>
    <text x="212" y="115" fontSize="12" fill="#A5B4FC" fontWeight="bold">×</text>
    {/* Plus */}
    <text x="58" y="145" fontSize="14" fill="#C7D2FE" fontWeight="bold">+</text>
    {/* Small circle */}
    <circle cx="215" cy="135" r="3" fill="#E0E7FF"/>
  </svg>
);

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ userId?: string; password?: string }>({});

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!userId.trim()) errs.userId = 'User ID is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.login(userId, password);
      const isOk = res.success === true || res.status === 'success';
      if (isOk && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.showSuccess('Login successful!');
        navigate('/');
      }
    } catch (err: any) {
      toast.showError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 0,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: 860,
        minHeight: 500,
      }}>
        {/* Left: Illustration */}
        <div style={{
          background: '#F0F4FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          flexDirection: 'column',
          gap: 20,
        }}>
          <DeskIllustration />
        </div>

        {/* Right: Form */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Logo />

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D23', marginTop: 24, marginBottom: 4 }}>
            Login
          </h1>
          <p style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 28 }}>
            Use your Preproute provided Login credentials
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            {/* User ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                className="form-input"
                placeholder="Enter User ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                autoComplete="username"
              />
              {errors.userId && <span className="error-text">{errors.userId}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="#" style={{ fontSize: 12.5, color: '#4F6EF7' }}>Forgot password?</a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, marginTop: 4, borderRadius: 6 }}
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          {/* Credentials hint */}
          <div style={{ marginTop: 24, padding: '10px 12px', background: '#F5F6FA', borderRadius: 6, borderLeft: '3px solid #4F6EF7' }}>
            <p style={{ fontSize: 11.5, color: '#6B7280', margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: '#374151' }}>Staging:</strong> vedant-admin / vedant123<br />
              <strong style={{ color: '#374151' }}>Local:</strong> admin / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
