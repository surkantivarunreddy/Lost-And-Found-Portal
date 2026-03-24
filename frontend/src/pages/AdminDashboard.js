import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
 
// ─── All admin actions go through /api/admin/* ───────
const ADMIN_API = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/admin`;
 
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});
 
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
 
  const [tab,     setTab]     = useState('stats');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [flash,   setFlash]   = useState({ msg: '', type: 'success' });
 
  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') navigate('/dashboard');
  }, [user, navigate]);
 
  const showFlash = (msg, type = 'success') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: '', type: 'success' }), 3500);
  };
 
  // ── Data loaders ──────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API}/stats`, { headers: getHeaders() });
      setStats(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
 
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API}/users`, { headers: getHeaders() });
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
 
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API}/items`, { headers: getHeaders() });
      setItems(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
 
  useEffect(() => {
    if (tab === 'stats') loadStats();
    if (tab === 'users') loadUsers();
    if (tab === 'items') loadItems();
  }, [tab, loadStats, loadUsers, loadItems]);
 
  // ── User actions ──────────────────────────────────
  const handlePromoteUser = async (id, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const label   = newRole === 'ADMIN' ? 'promote to Admin' : 'demote to User';
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    try {
      const res = await axios.patch(
        `${ADMIN_API}/users/${id}/role`,
        { role: newRole },
        { headers: getHeaders() }
      );
      // Update in place immediately
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: res.data.role } : u));
      showFlash(`User ${label}d successfully.`);
    } catch (e) { showFlash('Failed to update role.', 'error'); }
  };
 
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This will also delete all their items and messages.`)) return;
    try {
      const response = await axios.delete(`${ADMIN_API}/users/${id}`, { headers: getHeaders() });
 
      if (response.status === 204 || response.status === 200) {
        setUsers(prev => prev.filter(u => u.id !== id));
        showFlash(`User "${name}" deleted successfully.`);
      } else {
        showFlash('Delete may have failed — refreshing list.', 'error');
        loadUsers();
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.response?.data || e.message || 'Unknown error';
      console.error('Delete user error:', e.response?.status, errMsg);
      showFlash(`Failed to delete user: ${errMsg}`, 'error');
      loadUsers();
    }
  };
 
  // ── Item actions ──────────────────────────────────
  const handleItemStatus = async (id, newStatus) => {
    try {
      await axios.patch(
        `${ADMIN_API}/items/${id}/status`,
        { status: newStatus },
        { headers: getHeaders() }
      );
      // Update status in place immediately
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      showFlash(`Item marked as ${newStatus}.`);
      if (tab === 'stats') loadStats();
    } catch (e) { showFlash('Failed to update item.', 'error'); }
  };
 
  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Delete item "${title}"? This cannot be undone.`)) return;
    try {
      // ✅ Use the ADMIN endpoint — bypasses ownership check
      const response = await axios.delete(`${ADMIN_API}/items/${id}`, { headers: getHeaders() });
 
      // Only update UI if server confirmed deletion (204 No Content)
      if (response.status === 204 || response.status === 200) {
        setItems(prev => prev.filter(i => i.id !== id));
        showFlash(`Item "${title}" deleted successfully.`);
      } else {
        showFlash('Delete may have failed — refreshing list.', 'error');
        loadItems();
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.response?.data || e.message || 'Unknown error';
      console.error('Delete item error:', e.response?.status, errMsg);
      showFlash(`Failed to delete: ${errMsg}`, 'error');
      // Re-fetch so UI matches actual DB state
      loadItems();
    }
  };
 
  // ── Badge helpers ─────────────────────────────────
  const statusBadge = (status) => {
    const map = { ACTIVE: 'badge-active', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed' };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };
 
  const typeBadge = (type) => (
    <span className={`badge badge-${type?.toLowerCase()}`}>{type}</span>
  );
 
  return (
    <div className="admin-page container">
 
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>🛡️ Admin Panel</h1>
          <p className="admin-sub">Logged in as <strong>{user?.name}</strong> ({user?.email})</p>
        </div>
      </div>
 
      {/* Flash */}
      {flash.msg && (
        <div className={`admin-flash ${flash.type === 'error' ? 'admin-flash-error' : ''}`}>
          {flash.msg}
        </div>
      )}
 
      {/* Tabs */}
      <div className="admin-tabs">
        {['stats', 'users', 'items'].map(t => (
          <button key={t}
                  className={tab === t ? 'active' : ''}
                  onClick={() => setTab(t)}>
            {{ stats: '📊 Dashboard', users: '👥 Users', items: '📦 Items' }[t]}
          </button>
        ))}
      </div>
 
      {loading && <p className="loading-text">Loading…</p>}
 
      {/* ── Stats ──────────────────────────────────── */}
      {tab === 'stats' && stats && !loading && (
        <div className="admin-stats-grid">
          <StatCard icon="👥" label="Total Users"         value={stats.totalUsers} />
          <StatCard icon="📦" label="Total Items"         value={stats.totalItems} />
          <StatCard icon="💬" label="Total Messages"      value={stats.totalMessages} />
          <StatCard icon="🔴" label="Lost Items"          value={stats.lostItems} />
          <StatCard icon="🟢" label="Found Items"         value={stats.foundItems} />
          <StatCard icon="🔵" label="Active Items"        value={stats.activeItems} />
          <StatCard icon="✅" label="Reunited (Resolved)" value={stats.resolvedItems} highlight />
        </div>
      )}
 
      {/* ── Users ──────────────────────────────────── */}
      {tab === 'users' && !loading && (
        <div className="admin-table-wrap">
          <p className="table-count">{users.length} registered users</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
                <th>Role</th><th>Items</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.role === 'ADMIN' ? 'row-admin' : ''}>
                  <td>{u.id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`role-badge ${u.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.itemCount}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="action-btns">
                      {u.id !== user?.id ? (
                        <>
                          <button
                            className={`btn-sm ${u.role === 'ADMIN' ? 'btn-sm-warn' : 'btn-sm-blue'}`}
                            onClick={() => handlePromoteUser(u.id, u.role)}>
                            {u.role === 'ADMIN' ? '⬇ Demote' : '⬆ Promote'}
                          </button>
                          <button
                            className="btn-sm btn-sm-danger"
                            onClick={() => handleDeleteUser(u.id, u.name)}>
                            🗑 Delete
                          </button>
                        </>
                      ) : (
                        <span className="self-label">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
      {/* ── Items ──────────────────────────────────── */}
      {tab === 'items' && !loading && (
        <div className="admin-table-wrap">
          <p className="table-count">{items.length} total items</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Type</th><th>Status</th>
                <th>Category</th><th>Location</th><th>Reported By</th>
                <th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="9" style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>
                  No items found.
                </td></tr>
              ) : items.map(item => (
                <tr key={item.id} className={item.status === 'RESOLVED' ? 'row-resolved' : ''}>
                  <td>{item.id}</td>
                  <td><strong>{item.title}</strong></td>
                  <td>{typeBadge(item.type)}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td>{item.category || '—'}</td>
                  <td>{item.location || '—'}</td>
                  <td title={item.reportedByEmail}>{item.reportedByName}</td>
                  <td>{item.dateLostFound || '—'}</td>
                  <td>
                    <div className="action-btns">
                      {item.status !== 'RESOLVED' && (
                        <button className="btn-sm btn-sm-green"
                                onClick={() => handleItemStatus(item.id, 'RESOLVED')}>
                          ✅ Resolve
                        </button>
                      )}
                      {item.status === 'ACTIVE' && (
                        <button className="btn-sm btn-sm-warn"
                                onClick={() => handleItemStatus(item.id, 'CLOSED')}>
                          🔒 Close
                        </button>
                      )}
                      {item.status !== 'ACTIVE' && (
                        <button className="btn-sm btn-sm-blue"
                                onClick={() => handleItemStatus(item.id, 'ACTIVE')}>
                          🔄 Reopen
                        </button>
                      )}
                      <button className="btn-sm btn-sm-danger"
                              onClick={() => handleDeleteItem(item.id, item.title)}>
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
    </div>
  );
};
 
const StatCard = ({ icon, label, value, highlight }) => (
  <div className={`admin-stat-card ${highlight ? 'admin-stat-highlight' : ''}`}>
    <span className="admin-stat-icon">{icon}</span>
    <strong className="admin-stat-value">{value}</strong>
    <span className="admin-stat-label">{label}</span>
  </div>
);
 
export default AdminDashboard;