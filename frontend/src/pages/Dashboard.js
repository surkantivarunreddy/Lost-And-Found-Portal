import React, { useEffect, useState, useRef } from 'react';
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
 
const Dashboard = () => {
  const { user } = useAuth();
  const [myItems,       setMyItems]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('items');
  const [unread,        setUnread]        = useState(0);
 
  // Messaging
  const [conversations, setConversations] = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [msgLoading,    setMsgLoading]    = useState(false);
  const [replyText,     setReplyText]     = useState('');
  const [sending,       setSending]       = useState(false);
  const messagesEndRef = useRef(null);
 
  // Load items + unread count on mount
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
 
  // Load conversations when Messages tab is opened
  useEffect(() => {
    if (activeTab === 'messages') loadConversations();
  }, [activeTab]);
 
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API}/api/messages`, { headers: getHeaders() });
      const msgs = res.data || [];
      const convMap = {};
 
      msgs.forEach(msg => {
        const isMine    = msg.senderId === user.id;
        const otherId   = isMine ? msg.receiverId : msg.senderId;
        const otherName = isMine ? msg.receiverName : msg.senderName;
 
        if (!convMap[otherId]) {
          convMap[otherId] = { userId: otherId, name: otherName, lastMsg: '', lastTime: null, unread: 0 };
        }
        if (!convMap[otherId].lastTime || new Date(msg.sentAt) > new Date(convMap[otherId].lastTime)) {
          convMap[otherId].lastMsg  = msg.content;
          convMap[otherId].lastTime = msg.sentAt;
        }
        if (!isMine && !msg.isRead) convMap[otherId].unread++;
      });
 
      const list = Object.values(convMap).sort(
        (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
      );
      setConversations(list);
      if (list.length > 0 && !activeConvo) openConversation(list[0]);
    } catch (e) { console.error(e); }
  };
 
  const openConversation = async (convo) => {
    setActiveConvo(convo);
    setMsgLoading(true);
    setReplyText('');
    try {
      const res = await axios.get(
        `${API}/api/messages/conversation/${convo.userId}`,
        { headers: getHeaders() }
      );
      const msgs = res.data || [];
      setMessages(msgs);
 
      // Mark unread as read
      const unreadMsgs = msgs.filter(m => m.receiverId === user.id && !m.isRead);
      await Promise.all(
        unreadMsgs.map(m =>
          axios.patch(`${API}/api/messages/${m.id}/read`, {}, { headers: getHeaders() })
        )
      );
      if (unreadMsgs.length > 0) {
        setUnread(prev => Math.max(0, prev - unreadMsgs.length));
        setConversations(prev =>
          prev.map(c => c.userId === convo.userId ? { ...c, unread: 0 } : c)
        );
      }
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };
 
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvo) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText('');
    try {
      const res = await axios.post(`${API}/api/messages`,
        { receiverId: activeConvo.userId, content: text },
        { headers: getHeaders() }
      );
      setMessages(prev => [...prev, res.data]);
      setConversations(prev =>
        prev.map(c =>
          c.userId === activeConvo.userId
            ? { ...c, lastMsg: text, lastTime: new Date().toISOString() }
            : c
        )
      );
    } catch (e) {
      alert('Failed to send message.');
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };
 
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemService.delete(id);
      setMyItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { alert('Failed to delete item.'); }
  };
 
  const handleResolve = async (id) => {
    if (!window.confirm('Mark this item as Resolved (reunited with owner)?')) return;
    try {
      await itemService.update(id, { status: 'RESOLVED' });
      setMyItems(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'RESOLVED' } : i
      ));
    } catch (e) { alert('Failed to update item status.'); }
  };
 
  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };
 
  const lostItems     = myItems.filter(i => i.type === 'LOST');
  const foundItems    = myItems.filter(i => i.type === 'FOUND');
  const resolvedItems = myItems.filter(i => i.status === 'RESOLVED');
 
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
        <button className={activeTab === 'items' ? 'active' : ''}
                onClick={() => setActiveTab('items')}>
          My Items ({myItems.length})
        </button>
        <button className={activeTab === 'messages' ? 'active' : ''}
                onClick={() => setActiveTab('messages')}>
          Messages {unread > 0 && <span className="badge-dot">{unread}</span>}
        </button>
      </div>
 
      {/* ── Items Tab ───────────────────────────────── */}
      {activeTab === 'items' && (
        loading ? <p className="loading-text">Loading…</p> :
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
 
      {/* ── Messages Tab ────────────────────────────── */}
      {activeTab === 'messages' && (
        <div className="messages-layout">
 
          {/* Sidebar: conversation list */}
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
                  <div className="convo-avatar">
                    {convo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="convo-info">
                    <div className="convo-name-row">
                      <span className="convo-name">{convo.name}</span>
                      {convo.unread > 0 && (
                        <span className="convo-unread-badge">{convo.unread}</span>
                      )}
                    </div>
                    <div className="convo-preview">
                      {convo.lastMsg?.substring(0, 40)}{convo.lastMsg?.length > 40 ? '…' : ''}
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
                {/* Chat header */}
                <div className="chat-header">
                  <div className="chat-header-avatar">
                    {activeConvo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-header-info">
                    <div className="chat-header-name">{activeConvo.name}</div>
                    <div className="chat-header-sub">Lost &amp; Found Portal</div>
                  </div>
                </div>
 
                {/* Messages */}
                <div className="chat-messages">
                  {msgLoading ? (
                    <p className="loading-text">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <div className="chat-no-msgs">
                      <span>👋</span>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => {
                        const isMine = msg.senderId === user.id;
                        const showDateDivider = i === 0 ||
                          new Date(msg.sentAt).toDateString() !==
                          new Date(messages[i - 1].sentAt).toDateString();
 
                        return (
                          <React.Fragment key={msg.id}>
                            {showDateDivider && (
                              <div className="chat-date-divider">
                                {new Date(msg.sentAt).toLocaleDateString('en-IN', {
                                  weekday: 'long', day: 'numeric', month: 'long'
                                })}
                              </div>
                            )}
                            <div className={`bubble-row ${isMine ? 'row-mine' : 'row-theirs'}`}>
                              {!isMine && (
                                <div className="bubble-avatar">
                                  {activeConvo.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                                {msg.itemTitle && (
                                  <div className="bubble-item-ref">📦 re: {msg.itemTitle}</div>
                                )}
                                <p>{msg.content}</p>
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
 
                {/* Reply input */}
                <form className="chat-input-area" onSubmit={handleSendReply}>
                  <textarea
                    className="chat-textarea"
                    placeholder={`Message ${activeConvo.name}… (Enter to send)`}
                    value={replyText}
                    rows={2}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={sending || !replyText.trim()}>
                    {sending ? '⏳' : '➤'}
                  </button>
                </form>
                <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
              </>
            )}
          </div>
 
        </div>
      )}
    </div>
  );
};
 
export default Dashboard;