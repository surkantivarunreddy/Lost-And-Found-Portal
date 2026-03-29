import React, { useState, useEffect, useCallback } from 'react';
import ItemCard from '../components/ItemCard';
import { itemService } from '../services/itemService';
import './SearchItems.css';  // ✅ Fix: was './SearchItem.css' (missing the 's')
 
const CATEGORIES = ['', 'Electronics', 'Wallet/Purse', 'Keys', 'Bag/Backpack',
  'Clothing', 'Jewelry', 'Documents', 'Pet', 'Other'];
 
const SearchItems = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '', type: '', category: '', location: '',
  });
 
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Fix: always pass page and size; only include non-empty filter params
      const params = { page, size: 9 };
      if (filters.keyword)  params.keyword  = filters.keyword;
      if (filters.type)     params.type     = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
 
      const res = await itemService.search(params);
      setItems(res.data.content || []);
      setTotal(res.data.totalElements || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);
 
  useEffect(() => { fetchItems(); }, [fetchItems]);
 
  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(0);
  };
 
  return (
    <div className="search-page container">
      <h1 className="page-title">🔎 Search Items</h1>
 
      {/* Filters */}
      <div className="search-filters card">
        <input
          name="keyword"
          value={filters.keyword}
          onChange={handleFilterChange}
          placeholder="Search by keyword..."
          className="search-input"
        />
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
        </select>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <input
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
          placeholder="Filter by location..."
        />
      </div>
 
      {/* Results */}
      <p className="results-count">{total} result{total !== 1 ? 's' : ''} found</p>
 
      {loading ? (
        <p className="loading-text">Searching...</p>
      ) : items.length === 0 ? (
        <div className="no-results">
          <span>🔍</span>
          <p>No items match your search. Try different keywords.</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
 
      {/* Pagination */}
      {total > 9 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Previous
          </button>
          <span>Page {page + 1} of {Math.ceil(total / 9)}</span>
          <button className="btn btn-outline" disabled={(page + 1) * 9 >= total}
            onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
 
export default SearchItems;