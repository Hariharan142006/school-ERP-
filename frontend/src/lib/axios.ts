import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) { config.headers.Authorization = 'Bearer ' + token; }
  }
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (typeof window !== 'undefined' && error.response?.status === 401) {
    localStorage.removeItem('user'); localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/;';
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/login') { window.location.href = '/'; }
  }
  return Promise.reject(error);
});
export default api;
