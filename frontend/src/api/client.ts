import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('proofhire_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (e) {
      // Ignore JSON parse error
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401, token expired or invalid
    if (error.response?.status === 401) {
      // Don't auto-redirect if we are checking /me or logging in
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      const isLoginOrRegister = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (isAuthCheck && !isLoginOrRegister) {
        localStorage.removeItem('proofhire_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
