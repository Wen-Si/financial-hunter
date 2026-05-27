import axios from 'axios';
import { LoginResponse, User, Avatar, GameActionResponse, GameStartResponse, Scenario } from '../types';

const API_BASE = '/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/financial-hunter/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post<LoginResponse>('/auth/register', { username, email, password }),

  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  getMe: () => api.get<{ user: User }>('/auth/me'),
};

// 角色API
export const avatarAPI = {
  getAll: () => api.get<{ avatars: Avatar[] }>('/avatars'),

  create: (name: string, characterDescription: string) =>
    api.post<{ message: string; avatar: Avatar }>('/avatars', { name, characterDescription }),

  get: (id: string) => api.get<{ avatar: Avatar }>(`/avatars/${id}`),

  delete: (id: string) => api.delete(`/avatars/${id}`),
};

// 游戏API
export const gameAPI = {
  start: (avatarId: string) =>
    api.post<GameStartResponse>(`/game/start/${avatarId}`),

  getCurrent: (avatarId: string) =>
    api.get(`/game/${avatarId}/current`),

  executeAction: (avatarId: string) =>
    api.post<GameActionResponse>(`/game/${avatarId}/action`),

  getHistory: (avatarId: string) =>
    api.get(`/game/${avatarId}/history`),

  getScenarios: () =>
    api.get<{ scenarios: Scenario[] }>('/game/scenarios/all'),
};

export default api;
