import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface ImportMetaEnv {
  VITE_BACKEND_URL?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['X-Request-Id'] = uuidv4();
  return config;
});

export default api;
