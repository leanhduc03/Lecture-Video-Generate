import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import "./login.scss";
import { MdMovieEdit } from 'react-icons/md';
import { Button, Form, Input } from 'antd';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      await login(values.username, values.password);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-panel">
      <div className="login-panel__header">
        <div className="login-panel__brand">
          <MdMovieEdit className="login-panel__icon" />
          <h1 className="login-panel__logo-text">LectureStudio</h1>
        </div>
        <h2 className="login-panel__title">Đăng nhập tài khoản của bạn</h2>
        <p className="login-panel__subtitle">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register">Đăng ký tài khoản mới</Link>
        </p>
      </div>
      {error && <div className="error-message">{error}</div>}
      <Form className="login-panel__form" onFinish={handleSubmit}>
        <div className="login-panel__fields">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input autoComplete='username' placeholder="Tên đăng nhập"/>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>
        </div>
        <div className="login-panel__submit">
          <Button className="login-submit-btn" type="primary" htmlType="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </div>
        <div className="login-panel__actions">
          <div className="login-panel__forgot">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Login;
