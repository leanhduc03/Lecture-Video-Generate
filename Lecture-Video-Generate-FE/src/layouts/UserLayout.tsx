import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HeaderLayout from './header-layout/HeaderLayout';

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="user-layout">
      <div className="layout-wrapper">
        <HeaderLayout />
        <main className="main-content">
          {children}
        </main>
        <footer className="footer">
          <div className='footer-content'><p>&copy; 2025 LectureStudio.</p></div>
        </footer>
      </div>
    </div>
  );
};

export default UserLayout;
