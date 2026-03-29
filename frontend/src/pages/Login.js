import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import './Auth.css';
 
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
 
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(form);
      const { token, ...userData } = res.data;
      login(userData, token);
      navigate('/dashboard');
    } catch (err) {
      // ✅ Fixed: Robust error extraction — prevents crash on non-JSON or network errors
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        (err.response?.status === 401 ? 'Invalid email or password.' : null) ||
        (err.response?.status === 403 ? 'Access denied.' : null) ||
        err.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
 
        {error && <div className="auth-error">{error}</div>}
 
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
 
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
 
export default Login;