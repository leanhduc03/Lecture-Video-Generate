import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateCurrentUser } from '../../services/authService';

const AdminProfile = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Kiểm tra nếu có thay đổi mật khẩu
      if (password) {
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          setLoading(false);
          return;
        }
      }

      const updateData: {email?: string; password?: string} = {};
      
      if (email !== user?.email) {
        updateData.email = email;
      }
      
      if (password) {
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        setError('Không có thông tin nào được thay đổi');
        setLoading(false);
        return;
      }

      await updateCurrentUser(updateData);
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Cập nhật thông tin thất bại. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-profile">
      <h1>Hồ sơ Admin</h1>
      
      {success && <div className="success-message">Cập nhật thông tin thành công!</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="profile-info">
        <h2>Thông tin tài khoản</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Tên đăng nhập:</strong>
            <span>{user?.username}</span>
          </div>
          <div className="info-item">
            <strong>Vai trò:</strong>
            <span>Quản trị viên</span>
          </div>
          <div className="info-item">
            <strong>Ngày tạo:</strong>
            <span>{new Date(user?.created_at || '').toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="info-item">
            <strong>Email hiện tại:</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
      
      <div className="profile-edit">
        <h2>Cập nhật thông tin</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới (để trống nếu không đổi):</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!password}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;