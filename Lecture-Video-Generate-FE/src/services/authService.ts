import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

// Thêm interceptor để tự động thêm token vào header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi 401 (Unauthorized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password
  });
  return response.data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    username,
    email,
    password
  });
  return response.data;
};

export const verifyEmail = async (username: string, code: string) => {
  const response = await axios.post(`${API_URL}/auth/verify-email`, {
    username,
    code
  });
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await axios.post(`${API_URL}/auth/request-password-reset`, {
    email
  });
  return response.data;
};

export const resetPassword = async (email: string, code: string, new_password: string) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, {
    email,
    code,
    new_password
  });
  return response.data;
};

export const refreshVerification = async (email: string) => {
  const response = await axios.post(`${API_URL}/auth/refresh-verification`, {
    email
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${API_URL}/users/me`);
  return response.data;
};

export const updateCurrentUser = async (userData: {email?: string, password?: string}) => {
  const response = await axios.put(`${API_URL}/users/me`, userData);
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem("token");
};
