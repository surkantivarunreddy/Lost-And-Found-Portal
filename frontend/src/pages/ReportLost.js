import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ReportForm.css';

const CATEGORIES = ['Electronics', 'Wallet/Purse', 'Keys', 'Bag/Backpack',
                    'Clothing', 'Jewelry', 'Documents', 'Pet', 'Other'];

const ItemForm = ({ type }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    location: '', dateLostFound: '',
    contactEmail: '', contactPhone: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const isLost = type === 'LOST';

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile   = e => setImageFile(e.target.files[0] || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Read token directly from localStorage — guaranteed to get it
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to submit a report.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title',         form.title);
      formData.append('description',   form.description);
      formData.append('type',          type);
      formData.append('category',      form.category);
      formData.append('location',      form.location);
      formData.append('dateLostFound', form.dateLostFound);
      formData.append('contactEmail',  form.contactEmail);
      formData.append('contactPhone',  form.contactPhone);
      if (imageFile) formData.append('image', imageFile);

      // Use axios directly with explicit Authorization header
	  const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

	  await axios.post(`${API}/api/items`, formData, {
	    headers: {
	      Authorization: `Bearer ${token}`,
	    },
	  });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page container">
      <h1 className="page-title">
        {isLost ? '📋 Report Lost Item' : '✅ Report Found Item'}
      </h1>
      <p className="report-sub">
        {isLost
          ? 'Describe the item you lost and where you last had it.'
          : 'Describe the item you found so the owner can identify it.'}
      </p>

      {error && <div className="auth-error" style={{maxWidth:600,marginBottom:'1rem'}}>{error}</div>}

      <form className="report-form card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Title *</label>
          <input name="title" value={form.title} onChange={handleChange}
                 placeholder="e.g. Blue backpack with laptop inside" required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
                    rows={4} placeholder="Detailed description: color, brand, distinguishing features…" />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date {isLost ? 'Lost' : 'Found'}</label>
            <input type="date" name="dateLostFound" value={form.dateLostFound} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange}
                 placeholder="e.g. Anurag university / D Block " />
        </div>

        <div className="form-group">
          <label>Item Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handleFile} />
        </div>

        <p className="form-section-title">Contact Details</p>
        <div className="grid-2">
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange}
                   placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange}
                   placeholder="+91 9999999999" />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : `Submit ${isLost ? 'Lost' : 'Found'} Report`}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ReportLost  = () => <ItemForm type="LOST"  />;
export const ReportFound = () => <ItemForm type="FOUND" />;