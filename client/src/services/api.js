import axios from 'axios';

// Dynamically resolve API URL based on current browser hostname (e.g. 192.168.102.99 or localhost)
const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Bearer JWT Token automatically
api.interceptors.request.use(config => {
  // If request explicitly passed an empty Authorization header (fresh login), remove header completely
  if (config.headers && config.headers['Authorization'] === '') {
    delete config.headers['Authorization'];
    return config;
  }

  const token = localStorage.getItem('sakshya_jwt_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
