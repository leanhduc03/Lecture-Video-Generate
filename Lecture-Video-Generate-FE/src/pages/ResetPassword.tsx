import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { MdMovieEdit, MdCheckCircle, MdArrowBack } from 'react-icons/md';
import './ResetPassword.scss';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(email, code, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-success">
          <div className="reset-success__icon">
            <MdCheckCircle />
          </div>
          <h2 className="reset-success__title">Đặt lại mật khẩu thành công!</h2>
          <p className="reset-success__message">
            Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
          <button 
            className="reset-success__button"
            onClick={() => navigate('/login')}
          >
            Đi đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-panel">
        <div className="reset-password-panel__header">
          <div className="reset-password-panel__brand">
            <MdMovieEdit className="reset-password-panel__icon" />
            <span className="reset-password-panel__logo-text">LectureStudio</span>
          </div>
          <h1 className="reset-password-panel__title">Đặt lại mật khẩu</h1>
          <p className="reset-password-panel__subtitle">
            Nhập mã xác thực và mật khẩu mới của bạn.
          </p>
        </div>

        {!email && (
          <div className="error-message">
            Không có email được cung cấp. Vui lòng thử lại.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {email && (
          <form className="reset-password-panel__form" onSubmit={handleSubmit}>
            <div className="reset-password-panel__field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                required
              />
            </div>

            <div className="reset-password-panel__field">
              <label htmlFor="code">Mã xác thực</label>
              <input
                type="text"
                id="code"
                placeholder="Nhập mã xác thực"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="reset-password-panel__field">
              <label htmlFor="password">Mật khẩu mới</label>
              <input
                type="password"
                id="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="reset-password-panel__field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="reset-password-panel__submit"
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="reset-password-panel__links">
          <Link to="/login">
            <MdArrowBack />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
