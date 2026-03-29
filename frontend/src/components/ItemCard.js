import React from 'react';
import { Link } from 'react-router-dom';
import './ItemCard.css';
 
// ✅ Fix: Read API base URL once so images like "/uploads/abc.jpg"
//    become "https://your-backend.onrender.com/uploads/abc.jpg"
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
 
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path like /uploads/uuid_filename.jpg → prepend backend origin
  return `${API_BASE}${url}`;
};
 
const ItemCard = ({ item, onDelete, onResolve }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };
 
  const isResolved = item.status === 'RESOLVED';
  const imgUrl = getImageUrl(item.imageUrl);
 
  return (
    <div className={`item-card ${isResolved ? 'item-card-resolved' : ''}`}>
      {/* ✅ Fix: use computed imgUrl with full backend origin, not raw item.imageUrl */}
      {imgUrl && (
        <div className="item-img">
          <img
            src={imgUrl}
            alt={item.title}
            onError={e => e.target.style.display = 'none'}
          />
        </div>
      )}
 
      {isResolved && (
        <div className="resolved-banner">✅ Reunited</div>
      )}
 
      <div className="item-body">
        <div className="item-badges">
          <span className={`badge badge-${item.type?.toLowerCase()}`}>{item.type}</span>
          <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
        </div>
 
        <h3 className="item-title">{item.title}</h3>
 
        {item.description && (
          <p className="item-desc">
            {item.description.substring(0, 120)}
            {item.description.length > 120 ? '...' : ''}
          </p>
        )}
 
        <div className="item-meta">
          {item.category && <span>🏷️ {item.category}</span>}
          {item.location && <span>📍 {item.location}</span>}
          <span>📅 {formatDate(item.dateLostFound)}</span>
        </div>
 
        <div className="item-footer">
          <span className="item-reporter">By {item.reportedByName}</span>
          <div className="item-actions">
            <Link
              to={`/items/${item.id}`}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
            >
              View Details
            </Link>
 
            {/* Mark as Resolved — only shown on Dashboard for ACTIVE items */}
            {onResolve && !isResolved && (
              <button
                className="btn btn-resolve"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                onClick={() => onResolve(item.id)}
                title="Mark as Reunited / Resolved"
              >
                ✅ Resolved
              </button>
            )}
 
            {onDelete && (
              <button
                className="btn btn-danger"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                onClick={() => onDelete(item.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default ItemCard;