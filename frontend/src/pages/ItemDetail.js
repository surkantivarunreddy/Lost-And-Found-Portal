import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import './ItemDetail.css';
 
const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
 
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});
 
const ItemDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
 
  // Message modal state
  const [showModal, setShowModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState('');
  const [msgError, setMsgError] = useState('');
 
  // Resolve state
  const [resolving, setResolving] = useState(false);
 
  useEffect(() => {
    itemService.getById(id)
      .then(res => setItem(res.data))
      .catch(() => setError('Item not found.'))
      .finally(() => setLoading(false));
  }, [id]);
 
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API}${url}`;
  };
 
  const formatDate = (d) => {
    if (!d) return 'Unknown';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };
 
  // ── Send in-app message ─────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSending(true);
    setMsgError('');
    try {
      // ✅ Fixed: was '/messages' (missing /api prefix)
      await axios.post(`${API}/api/messages`, {
        receiverId: item.reportedById,
        itemId: item.id,
        content: msgText.trim(),
      }, { headers: getHeaders() });
      setMsgSuccess('Message sent! The reporter will see it in their Dashboard → Messages.');
      setMsgText('');
      setTimeout(() => {
        setShowModal(false);
        setMsgSuccess('');
      }, 3000);
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };
 
  // ── Mark as Resolved (owner only) ──────────────────
  const handleResolve = async () => {
    if (!window.confirm('Mark this item as Resolved / Reunited?')) return;
    setResolving(true);
    try {
      // ✅ Fixed: was '/items/${item.id}' (missing /api prefix)
      await axios.put(`${API}/api/items/${item.id}`,
        { status: 'RESOLVED' },
        { headers: getHeaders() });
      setItem(prev => ({ ...prev, status: 'RESOLVED' }));
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setResolving(false);
    }
  };
 
  if (loading) return <div className="detail-loading">Loading...</div>;
  if (error) return <div className="detail-error">{error}</div>;
  if (!item) return null;
 
  const isOwner = user && user.id === item.reportedById;
  const isResolved = item.status === 'RESOLVED';
  const isLoggedIn = !!user;
 
  return (
    <div className="detail-page container">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
 
      <div className="detail-card">
        {/* Image */}
        {item.imageUrl && (
          <div className="detail-img-wrap">
            <img src={getImageUrl(item.imageUrl)} alt={item.title}
              onError={e => e.target.parentElement.style.display = 'none'} />
            {isResolved && <div className="detail-resolved-banner">✅ Reunited</div>}
          </div>
        )}
 
        <div className="detail-body">
          {/* Badges */}
          <div className="detail-badges">
            <span className={`badge badge-${item.type?.toLowerCase()}`}>{item.type}</span>
            <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
            {item.category && <span className="badge badge-cat">{item.category}</span>}
          </div>
 
          <h1 className="detail-title">{item.title}</h1>
          {item.description && (
            <p className="detail-desc">{item.description}</p>
          )}
 
          {/* Meta grid */}
          <div className="detail-meta-grid">
            {item.location && (
              <div className="detail-meta-item">
                <span className="meta-icon">📍</span>
                <div>
                  <div className="meta-label">Location</div>
                  <div className="meta-value">{item.location}</div>
                </div>
              </div>
            )}
            {item.dateLostFound && (
              <div className="detail-meta-item">
                <span className="meta-icon">📅</span>
                <div>
                  <div className="meta-label">Date {item.type === 'LOST' ? 'Lost' : 'Found'}</div>
                  <div className="meta-value">{formatDate(item.dateLostFound)}</div>
                </div>
              </div>
            )}
            <div className="detail-meta-item">
              <span className="meta-icon">👤</span>
              <div>
                <div className="meta-label">Reported By</div>
                <div className="meta-value">{item.reportedByName}</div>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="meta-icon">🕐</span>
              <div>
                <div className="meta-label">Posted On</div>
                <div className="meta-value">{formatDate(item.createdAt)}</div>
              </div>
            </div>
          </div>
 
          {/* Contact info */}
          {(item.contactEmail || item.contactPhone) && (
            <div className="detail-contact-box">
              <h3>📞 Contact Reporter</h3>
              <div className="contact-btns">
                {item.contactEmail && (
                  <a href={`mailto:${item.contactEmail}?subject=Re: ${item.title} on Lost & Found Portal`}
                    className="contact-btn contact-email">
                    ✉️ {item.contactEmail}
                  </a>
                )}
                {item.contactPhone && (
                  <a href={`tel:${item.contactPhone}`} className="contact-btn contact-phone">
                    📱 {item.contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}
 
          {/* Action buttons */}
          <div className="detail-actions">
            {/* Send in-app message — shown to logged-in non-owners */}
            {isLoggedIn && !isOwner && !isResolved && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                💬 Send Message to Reporter
              </button>
            )}
 
            {/* Not logged in — prompt to log in */}
            {!isLoggedIn && (
              <Link to="/login" className="btn btn-primary">
                🔐 Login to Contact Reporter
              </Link>
            )}
 
            {/* Owner actions */}
            {isOwner && !isResolved && (
              <button
                className="btn btn-resolve"
                onClick={handleResolve}
                disabled={resolving}>
                {resolving ? 'Updating...' : '✅ Mark as Resolved (Item Returned)'}
              </button>
            )}
 
            {isResolved && (
              <div className="resolved-notice">
                🎉 This item has been successfully reunited with its owner!
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* ── Message Modal ─────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💬 Message Reporter</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <p className="modal-sub">
              Sending to <strong>{item.reportedByName}</strong> about <em>"{item.title}"</em>
            </p>
            {msgSuccess ? (
              <div className="msg-success">{msgSuccess}</div>
            ) : (
              <form onSubmit={handleSendMessage}>
                <textarea
                  className="modal-textarea"
                  rows={5}
                  placeholder={
                    item.type === 'LOST'
                      ? `Hi, I think I found your ${item.title}. Here's what I know...`
                      : `Hi, I lost a ${item.title}. I think it might be mine because...`
                  }
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  required
                />
                {msgError && <div className="msg-error">{msgError}</div>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline"
                    onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : '📤 Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
 
export default ItemDetail;