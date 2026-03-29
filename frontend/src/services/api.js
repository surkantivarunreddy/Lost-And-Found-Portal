import axios from 'axios';
 
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
});
 
// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
// Handle 401 globally — clear stale token so user isn't stuck in a broken state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear if it's not a login attempt (avoid wiping on wrong-password)
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login without crashing the app
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
 
export default api;