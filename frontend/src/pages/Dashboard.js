import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ── SVG Icon components ───────────────────────────────────────────────────────

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Main Dashboard component ──────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();

  const [myItems, setMyItems]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [unread, setUnread]       = useState(0);

  // Messaging
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo]     = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [replyText, setReplyText]         = useState('');
  const [sending, setSending]             = useState(false);

  // Media
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [locationText, setLocationText]   = useState('');
  const [locLoading, setLocLoading]       = useState(false);

  // Selection / delete mode
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [selectMode, setSelectMode]       = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const messagesEndRef  = useRef(null);
  const fileInputRef    = useRef(null);
  const longPressTimers = useRef({});   // map of msgId → timer

  // ── Load items + unread on mount ───────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      itemService.getMyItems(),
      axios.get(`${API}/api/messages/unread-count`, { headers: getHeaders() }),
    ]).then(([itemsRes, unreadRes]) => {
      setMyItems(itemsRes.data || []);
      setUnread(unreadRes.data.count || 0);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Exit select mode when switching conversation
  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [activeConvo]);

  // Auto-scroll
  useEffect(() => {
    if (!selectMode) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectMode]);

  // ── Conversations ──────────────────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      const res  = await axios.get(`${API}/api/messages`, { headers: getHeaders() });
      const msgs = res.data || [];
      const map  = {};
      msgs.forEach(msg => {
        const isMine    = msg.senderId === user.id;
        const otherId   = isMine ? msg.receiverId : msg.senderId;
        const otherName = isMine ? msg.receiverName : msg.senderName;
        if (!map[otherId]) {
          map[otherId] = { userId: otherId, name: otherName, lastMsg: '', lastTime: null, unread: 0 };
        }
        if (!map[otherId].lastTime || new Date(msg.sentAt) > new Date(map[otherId].lastTime)) {
          map[otherId].lastMsg  = msg.imageUrl ? '📷 Image' : (msg.locationText ? '📍 Location' : msg.content);
          map[otherId].lastTime = msg.sentAt;
        }
        if (!isMine && !msg.isRead) map[otherId].unread++;
      });
      const list = Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setConversations(list);
      if (list.length > 0 && !activeConvo) openConversation(list[0]);
    } catch (e) { console.error(e); }
  };

  const openConversation = async (convo) => {
    setActiveConvo(convo);
    setMsgLoading(true);
    setReplyText('');
    clearMedia();
    try {
      const res  = await axios.get(`${API}/api/messages/conversation/${convo.userId}`, { headers: getHeaders() });
      const msgs = res.data || [];
      setMessages(msgs);
      const unreadMsgs = msgs.filter(m => m.receiverId === user.id && !m.isRead);
      await Promise.all(unreadMsgs.map(m =>
        axios.patch(`${API}/api/messages/${m.id}/read`, {}, { headers: getHeaders() })
      ));
      if (unreadMsgs.length > 0) {
        setUnread(prev => Math.max(0, prev - unreadMsgs.length));
        setConversations(prev => prev.map(c => c.userId === convo.userId ? { ...c, unread: 0 } : c));
      }
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };

  // ── Media helpers ──────────────────────────────────────────────────────────
  const clearMedia = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setLocationText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationText(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
        setLocLoading(false);
      },
      () => { alert('Could not get location. Please allow location access.'); setLocLoading(false); }
    );
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendReply = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const hasText     = replyText.trim().length > 0;
    const hasImage    = !!selectedImage;
    const hasLocation = !!locationText;
    if (!hasText && !hasImage && !hasLocation) return;
    if (!activeConvo) return;

    setSending(true);
    const text    = replyText.trim();
    const locSnap = locationText;
    const imgFile = selectedImage;
    setReplyText('');
    clearMedia();

    try {
      let res;
      if (hasImage) {
        const fd = new FormData();
        fd.append('receiverId', activeConvo.userId);
        if (text)    fd.append('content', text);
        if (locSnap) fd.append('locationText', locSnap);
        fd.append('image', imgFile);
        res = await axios.post(`${API}/api/messages/with-media`, fd, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      } else {
        res = await axios.post(`${API}/api/messages`,
          { receiverId: activeConvo.userId, content: text || null, locationText: locSnap || null },
          { headers: getHeaders() }
        );
      }
      setMessages(prev => [...prev, res.data]);
      const preview = hasImage ? '📷 Image' : (hasLocation ? '📍 Location' : text);
      setConversations(prev => prev.map(c =>
        c.userId === activeConvo.userId
          ? { ...c, lastMsg: preview, lastTime: new Date().toISOString() }
          : c
      ));
    } catch {
      alert('Failed to send message.');
      setReplyText(text);
    } finally { setSending(false); }
  };

  // ── Long-press handlers ────────────────────────────────────────────────────
  const handlePressStart = useCallback((msgId, isMine) => {
    if (!isMine) return; // can only delete own messages
    longPressTimers.current[msgId] = setTimeout(() => {
      setSelectMode(true);
      setSelectedIds(new Set([msgId]));
    }, 500);
  }, []);

  const handlePressEnd = useCallback((msgId) => {
    clearTimeout(longPressTimers.current[msgId]);
    delete longPressTimers.current[msgId];
  }, []);

  // ── Tap to toggle selection ────────────────────────────────────────────────
  const handleBubbleClick = useCallback((msgId, isMine) => {
    if (!selectMode || !isMine) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  }, [selectMode]);

  // ── Delete selected messages ───────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await axios.delete(`${API}/api/messages/bulk`, {
        headers: getHeaders(),
        data: { ids: [...selectedIds] },
      });
      setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch {
      alert('Failed to delete messages.');
    } finally { setDeleting(false); }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ── Item actions ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemService.delete(id);
      setMyItems(prev => prev.filter(i => i.id !== id));
    } catch { alert('Failed to delete item.'); }
  };

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this item as Resolved?')) return;
    try {
      await itemService.update(id, { status: 'RESOLVED' });
      setMyItems(prev => prev.map(i => i.id === id ? { ...i, status: 'RESOLVED' } : i));
    } catch { alert('Failed to update item status.'); }
  };

  // ── Formatting ─────────────────────────────────────────────────────────────
  const formatTime = (t) => {
    if (!t) return '';
    const d       = new Date(t);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const lostItems     = myItems.filter(i => i.type === 'LOST');
  const foundItems    = myItems.filter(i => i.type === 'FOUND');
  const resolvedItems = myItems.filter(i => i.status === 'RESOLVED');
  const canSend       = !sending && (replyText.trim() || selectedImage || locationText);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard container">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>👋 Welcome, {user?.name}!</h1>
          <p className="dash-email">{user?.email}</p>
        </div>
        <div className="dash-actions">
          <Link to="/report-lost"  className="btn btn-outline">+ Report Lost</Link>
          <Link to="/report-found" className="btn btn-primary">+ Report Found</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat"><strong>{myItems.length}</strong><span>Total Reports</span></div>
        <div className="dash-stat"><strong>{lostItems.length}</strong><span>Lost Items</span></div>
        <div className="dash-stat"><strong>{foundItems.length}</strong><span>Found Items</span></div>
        <div className="dash-stat dash-stat-green">
          <strong>{resolvedItems.length}</strong><span>✅ Reunited</span>
        </div>
        <div className="dash-stat"><strong>{unread}</strong><span>Unread Messages</span></div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>
          My Items ({myItems.length})
        </button>
        <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>
          Messages {unread > 0 && <span className="badge-dot">{unread}</span>}
        </button>
      </div>

      {/* ── Items Tab ────────────────────────────────────────── */}
      {activeTab === 'items' && (
        loading ? <p className="loading-text">Loading...</p> :
        myItems.length === 0 ? (
          <div className="dash-empty">
            <p>You haven't reported any items yet.</p>
            <Link to="/report-lost" className="btn btn-primary">Report your first item</Link>
          </div>
        ) : (
          <div className="grid-3">
            {myItems.map(item => (
              <ItemCard key={item.id} item={item}
                onDelete={handleDelete}
                onResolve={item.status !== 'RESOLVED' ? handleResolve : null} />
            ))}
          </div>
        )
      )}

      {/* ── Messages Tab ─────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div className="messages-layout">

          {/* Sidebar */}
          <div className="convo-list">
            <div className="convo-list-header">💬 Conversations</div>
            {conversations.length === 0 ? (
              <div className="convo-empty">
                <p>No conversations yet.</p>
                <p>Browse items and click <strong>"Send Message"</strong> to start chatting.</p>
              </div>
            ) : (
              conversations.map(convo => (
                <div key={convo.userId}
                  className={`convo-item ${activeConvo?.userId === convo.userId ? 'convo-active' : ''}`}
                  onClick={() => openConversation(convo)}>
                  <div className="convo-avatar">{convo.name.charAt(0).toUpperCase()}</div>
                  <div className="convo-info">
                    <div className="convo-name-row">
                      <span className="convo-name">{convo.name}</span>
                      {convo.unread > 0 && <span className="convo-unread-badge">{convo.unread}</span>}
                    </div>
                    <div className="convo-preview">
                      {convo.lastMsg?.substring(0, 40)}{convo.lastMsg?.length > 40 ? '...' : ''}
                    </div>
                  </div>
                  <div className="convo-time">{formatTime(convo.lastTime)}</div>
                </div>
              ))
            )}
          </div>

          {/* Chat window */}
          <div className="chat-window">
            {!activeConvo ? (
              <div className="chat-placeholder">
                <span>💬</span>
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat header — switches to selection toolbar in select mode */}
                {selectMode ? (
                  <div className="chat-select-toolbar">
                    <button className="toolbar-cancel-btn" onClick={exitSelectMode}>
                      <IconClose /> Cancel
                    </button>
                    <span className="toolbar-count">
                      {selectedIds.size} selected
                    </span>
                    <button
                      className="toolbar-delete-btn"
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.size === 0 || deleting}
                    >
                      <IconTrash />
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ) : (
                  <div className="chat-header">
                    <div className="chat-header-avatar">
                      {activeConvo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-header-info">
                      <div className="chat-header-name">{activeConvo.name}</div>
                      <div className="chat-header-sub">
                        Lost &amp; Found Portal · Hold a message to select
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="chat-messages">
                  {msgLoading ? (
                    <p className="loading-text">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <div className="chat-no-msgs">
                      <span>💬</span>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => {
                        const isMine = msg.senderId === user.id;
                        const isSelected = selectedIds.has(msg.id);
                        const showDate = i === 0 ||
                          new Date(msg.sentAt).toDateString() !== new Date(messages[i - 1].sentAt).toDateString();

                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="chat-date-divider">
                                {new Date(msg.sentAt).toLocaleDateString('en-IN', {
                                  weekday: 'long', day: 'numeric', month: 'long'
                                })}
                              </div>
                            )}
                            <div
                              className={`bubble-row ${isMine ? 'row-mine' : 'row-theirs'} ${isSelected ? 'row-selected' : ''}`}
                              onMouseDown={() => handlePressStart(msg.id, isMine)}
                              onMouseUp={() => handlePressEnd(msg.id)}
                              onMouseLeave={() => handlePressEnd(msg.id)}
                              onTouchStart={() => handlePressStart(msg.id, isMine)}
                              onTouchEnd={() => handlePressEnd(msg.id)}
                              onClick={() => handleBubbleClick(msg.id, isMine)}
                            >
                              {/* Selection checkbox (own messages in select mode) */}
                              {selectMode && isMine && (
                                <div className={`msg-checkbox ${isSelected ? 'msg-checkbox-checked' : ''}`}>
                                  {isSelected && <IconCheck />}
                                </div>
                              )}

                              {!isMine && (
                                <div className="bubble-avatar">
                                  {activeConvo.name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                                {msg.itemTitle && (
                                  <div className="bubble-item-ref">📦 re: {msg.itemTitle}</div>
                                )}

                                {/* Text */}
                                {msg.content && <p>{msg.content}</p>}

                                {/* Image attachment */}
                                {msg.imageUrl && (
                                  <a href={msg.imageUrl} target="_blank" rel="noreferrer"
                                    onClick={e => selectMode && e.preventDefault()}>
                                    <div className="bubble-img-wrap">
                                      <img src={msg.imageUrl} alt="attachment" className="bubble-image" />
                                      <div className="bubble-img-badge">
                                        <IconImage /> Photo
                                      </div>
                                    </div>
                                  </a>
                                )}

                                {/* Location */}
                                {msg.locationText && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${msg.locationText}`}
                                    target="_blank" rel="noreferrer"
                                    className="bubble-location"
                                    onClick={e => selectMode && e.preventDefault()}
                                  >
                                    <span className="bubble-location-icon"><IconMapPin /></span>
                                    <span>View Location on Map</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                      width="12" height="12" style={{ marginLeft: 'auto', opacity: 0.6 }}>
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                      <polyline points="15 3 21 3 21 9"/>
                                      <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                  </a>
                                )}

                                <div className="bubble-meta">
                                  <span className="bubble-time">
                                    {new Date(msg.sentAt).toLocaleTimeString('en-IN', {
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                  {isMine && (
                                    <span className={`bubble-ticks ${msg.isRead ? 'read' : ''}`}>
                                      {msg.isRead ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input area — hidden in select mode */}
                {!selectMode && (
                  <div className="chat-input-area">
                    {/* Previews */}
                    {(imagePreview || locationText) && (
                      <div className="chat-previews">
                        {imagePreview && (
                          <div className="preview-chip preview-image">
                            <img src={imagePreview} alt="preview" />
                            <button className="preview-remove" onClick={() => {
                              setSelectedImage(null); setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}><IconClose /></button>
                          </div>
                        )}
                        {locationText && (
                          <div className="preview-chip preview-location">
                            <IconMapPin />
                            <span>Location ready</span>
                            <button className="preview-remove" onClick={() => setLocationText('')}>
                              <IconClose />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input row */}
                    <div className="chat-input-row">
                      <input ref={fileInputRef} type="file" accept="image/*"
                        style={{ display: 'none' }} onChange={handleImageSelect} />

                      <div className="chat-action-btns">
                        <button type="button" className="chat-icon-btn" title="Attach photo"
                          onClick={() => fileInputRef.current.click()}>
                          <IconCamera />
                        </button>
                        <button type="button"
                          className={`chat-icon-btn ${locLoading ? 'loading' : ''}`}
                          title="Share location"
                          onClick={handleShareLocation}
                          disabled={locLoading || !!locationText}>
                          <IconLocation />
                        </button>
                      </div>

                      <textarea
                        className="chat-textarea"
                        placeholder={`Message ${activeConvo.name}…`}
                        value={replyText}
                        rows={1}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                      />

                      <button type="button" className="chat-send-btn"
                        onClick={handleSendReply} disabled={!canSend}>
                        {sending
                          ? <span className="send-spinner" />
                          : <IconSend />}
                      </button>
                    </div>

                    <div className="chat-hint">
                      Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line ·
                      Hold a message to select &amp; delete
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
