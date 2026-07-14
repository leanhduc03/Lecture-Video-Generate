import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MdLock, MdHome } from 'react-icons/md';
import './Unauthorized.scss';

const Unauthorized = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-panel">
        <div className="unauthorized-panel__icon-wrapper">
          <div className="unauthorized-panel__icon-bg">
            <MdLock />
          </div>
          <h1 className="unauthorized-panel__error-code">403</h1>
        </div>
        
        <h2 className="unauthorized-panel__title">
          Truy cập bị từ chối
        </h2>
        
        <p className="unauthorized-panel__message">
          Rất tiếc, bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một lỗi.
        </p>
        
        <div className="unauthorized-panel__actions">
          {isAuthenticated ? (
            <Link 
              to={isAdmin ? "/admin/users" : "/dashboard"} 
              className="unauthorized-panel__button"
            >
              <MdHome />
              Về trang chủ
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="unauthorized-panel__button"
            >
              <MdHome />
              Đăng nhập
            </Link>
          )}
        </div>
        
        <footer className="unauthorized-panel__footer">
          <p>© 2025 LectureStudio.</p>
        </footer>
      </div>
    </div>
  );
};

export default Unauthorized;
