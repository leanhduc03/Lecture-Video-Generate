import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, getCurrentUser } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra nếu đã đăng nhập
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await loginApi(username, password);
      localStorage.setItem('token', response.access_token);
      
      // Sau khi đăng nhập, lấy thông tin người dùng
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('username', username);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Chuyển hướng dựa vào vai trò
      if (userData.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Đăng nhập thất bại', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isAdmin,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
