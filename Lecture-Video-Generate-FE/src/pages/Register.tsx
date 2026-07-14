import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, message } from 'antd';
import { MdMovieEdit } from 'react-icons/md';
import { register } from '../services/authService';
import "./register.scss";

const Register = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (values: { 
    username: string; 
    email: string; 
    password: string; 
    confirmPassword: string 
  }) => {
    setError('');
    
    // Kiểm tra mật khẩu trùng khớp
    if (values.password !== values.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    try {
      await register(values.username, values.email, values.password);
      message.success('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Đăng ký thất bại. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-panel">
      <div className="register-panel__header">
        <div className="register-panel__brand">
          <MdMovieEdit className="register-panel__icon" />
          <h1 className="register-panel__logo-text">LectureStudio</h1>
        </div>
        <h2 className="register-panel__title">Tạo tài khoản mới</h2>
        <p className="register-panel__subtitle">
          Đã có tài khoản?{" "}
          <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <Form className="register-panel__form" onFinish={handleSubmit}>
        <div className="register-panel__fields">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập" },
              { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự" }
            ]}
          >
            <Input 
              autoComplete="username" 
              placeholder="Tên đăng nhập"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: 'email', message: "Email không hợp lệ" }
            ]}
          >
            <Input 
              type="email"
              autoComplete="email" 
              placeholder="Địa chỉ email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
            ]}
          >
            <Input.Password
              placeholder="Mật khẩu"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" }
            ]}
          >
            <Input.Password
              placeholder="Xác nhận mật khẩu"
              autoComplete="new-password"
            />
          </Form.Item>
        </div>

        <div className="register-panel__submit">
          <Button type="primary" htmlType="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
          </Button>
        </div>

        <div className="register-panel__actions">
          <div className="register-panel__forgot">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Register;