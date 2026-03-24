import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import { itemService } from '../services/itemService';
import api from '../services/api';
import './Home.css';
 
const Home = () => {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({
    totalItems: 0,
    lostItems:  0,
    foundItems: 0,
    resolvedItems: 0,
  });
 
  useEffect(() => {
    itemService.getAll({ page: 0, size: 6, sortBy: 'createdAt', sortDir: 'desc' })
      .then(res => setRecentItems(res.data.content || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/stats')
      .then(res => setStats({
        totalItems:    res.data.totalItems    || 0,
        lostItems:     res.data.lostItems     || 0,
        foundItems:    res.data.foundItems    || 0,
        resolvedItems: res.data.resolvedItems || 0,
      }))
      .catch(console.error);

  }, []);
 
  return (
    <div className="home">
 
      {/* ── Hero ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <h1>🔍 Lost Something?<br />Found Something?</h1>
          <p>
            Our community portal helps reunite people with their lost belongings.
            Report a lost item or let others know what you've found.
          </p>
          <div className="hero-actions">
            <Link to="/report-lost"  className="hero-btn hero-btn-primary">📋 Report Lost Item</Link>
            <Link to="/report-found" className="hero-btn hero-btn-secondary">✅ Report Found Item</Link>
            <Link to="/search"       className="hero-btn hero-btn-white">🔎 Search Items</Link>
          </div>
        </div>
      </section>
 
      {/* ── Live Stats ───────────────────────────── */}
      <section className="stats container">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <strong className="stat-number">{stats.totalItems}</strong>
          <span className="stat-label">Items Reported</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔴</span>
          <strong className="stat-number">{stats.lostItems}</strong>
          <span className="stat-label">Lost Items</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🟢</span>
          <strong className="stat-number">{stats.foundItems}</strong>
          <span className="stat-label">Found Items</span>
        </div>
        <div className="stat-card stat-card-highlight">
          <span className="stat-icon">🤝</span>
          <strong className="stat-number">{stats.resolvedItems}</strong>
          <span className="stat-label">Successfully Reunited</span>
        </div>
      </section>
 
      {/* ── How It Works ─────────────────────────── */}
      <section className="how-it-works container">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Report</h3>
            <p>Post a lost or found item with a description and photo.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Search</h3>
            <p>Browse reports and search by keyword, category or location.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Connect</h3>
            <p>Contact the reporter directly via email or phone to reunite.</p>
          </div>
        </div>
      </section>
 
      {/* ── Recent Reports ───────────────────────── */}
      <section className="recent container">
        <div className="section-header">
          <h2>Recent Reports</h2>
          <Link to="/search" className="btn btn-outline">View All →</Link>
        </div>
 
        {loading ? (
          <p className="loading-text">Loading items…</p>
        ) : recentItems.length === 0 ? (
          <div className="empty-state">
            <span>😕</span>
            <p>No items reported yet. Be the first!</p>
            <Link to="/report-lost" className="btn btn-primary">Report a Lost Item</Link>
          </div>
        ) : (
          <div className="grid-3">
            {recentItems.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
 
    </div>
  );
};
 
export default Home;
