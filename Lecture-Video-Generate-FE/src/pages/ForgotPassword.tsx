import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import { MdMovieEdit, MdMarkEmailRead, MdArrowBack } from 'react-icons/md';
import './ForgotPassword.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      // Xử lý các loại lỗi khác nhau
      if (err.response?.status === 503) {
        setError('Hệ thống đang bị giới hạn gửi email. Vui lòng thử lại sau ít phút.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  if (success) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-success">
          <div className="forgot-password-success__icon">
            <MdMarkEmailRead />
          </div>
          <h1 className="forgot-password-success__title">
            Yêu cầu đặt lại mật khẩu đã được gửi!
          </h1>
          <p className="forgot-password-success__message">
            Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi mã xác thực đến email của bạn. Vui lòng kiểm tra hộp thư và nhấn nút bên dưới để tiếp tục.
          </p>
          <div className="forgot-password-success__actions">
            <button 
              className="forgot-password-success__button" 
              onClick={handleResetPassword}
            >
              Tiếp tục đặt lại mật khẩu
            </button>
            <Link className="forgot-password-success__back" to="/login">
              <MdArrowBack />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-panel">
        <div className="forgot-password-panel__header">
          <div className="forgot-password-panel__brand">
            <MdMovieEdit className="forgot-password-panel__icon" />
            <span className="forgot-password-panel__logo-text">LectureStudio</span>
          </div>
          <h1 className="forgot-password-panel__title">Quên mật khẩu?</h1>
          <p className="forgot-password-panel__subtitle">
            Nhập email của bạn để nhận mã đặt lại mật khẩu.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="forgot-password-panel__form" onSubmit={handleSubmit}>
          <div className="forgot-password-panel__field">
            <label htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="lecture@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="forgot-password-panel__submit"
          >
            {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
          </button>
        </form>

        <div className="forgot-password-panel__back">
          <Link to="/login">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
