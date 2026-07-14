import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}

export interface UserUpdateData {
  email?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

/**
 * Lấy danh sách người dùng
 */
export const getUsers = async (skip: number = 0, limit: number = 10): Promise<UserListResponse> => {
  const response = await axios.get(`${API_URL}/users`, {
    params: { skip, limit }
  });
  return response.data;
};

/**
 * Lấy thông tin chi tiết người dùng theo ID
 */
export const getUserById = async (userId: number): Promise<User> => {
  const response = await axios.get(`${API_URL}/users/${userId}`);
  return response.data;
};

/**
 * Cập nhật thông tin người dùng
 */
export const updateUser = async (userId: number, data: UserUpdateData): Promise<User> => {
  const response = await axios.put(`${API_URL}/users/${userId}`, data);
  return response.data;
};

/**
 * Xóa người dùng
 */
export const deleteUser = async (userId: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/users/${userId}`);
  return response.data;
};

/**
 * Thống kê hệ thống
 */
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
}

export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await getUsers(0, 1000); // Lấy tất cả users để thống kê
    const users = response.items;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      inactiveUsers: users.filter(u => !u.is_active).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user').length,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};