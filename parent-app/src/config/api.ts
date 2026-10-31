import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Development uses local backend on machine LAN IP (192.168.0.3) or USB reverse, production uses Cloud URL
export const BASE_URL = __DEV__ 
  ? 'https://backend-jet-one-36.vercel.app' 
  : 'https://backend-jet-one-36.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('parent_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
