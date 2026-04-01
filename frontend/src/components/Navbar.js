import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🔍 Lost &amp; Found Portal
        </Link>

        <div className="nav-links">
          <Link to="/search">Search Items</Link>

          {user ? (
            <>
              <Link to="/report-lost"  className="btn btn-outline" style={{padding:'0.4rem 1rem'}}>
                Report Lost
              </Link>
              <Link to="/report-found" className="btn btn-primary" style={{padding:'0.4rem 1rem'}}>
                Report Found
              </Link>
              <Link to="/dashboard">Dashboard</Link>

              {/* Only show Admin link to admin users */}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="nav-admin-link">🛡️ Admin</Link>
              )}

              <button className="nav-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{padding:'0.4rem 1rem'}}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
