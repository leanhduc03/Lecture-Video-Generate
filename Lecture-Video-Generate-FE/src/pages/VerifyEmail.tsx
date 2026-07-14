import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { refreshVerification, verifyEmail } from '../services/authService';
import { Card, Form, Input, Button, message } from "antd";
import { CheckCircleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const username = searchParams.get('username') || '';
  const email = searchParams.get('email') || '';
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    if (!username) {
      messageApi.error("Không có tên đăng nhập được cung cấp.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(username, code);
      messageApi.success("Xác thực email thành công!");
      navigate("/login", {
        state: { message: "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ." },
      });
    } catch (err: any) {
      messageApi.error(err.response?.data?.detail || "Mã xác thực không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const reSendCode = async () => {
    if (!email.trim()) {
      messageApi.error("Không tìm thấy email người dùng. Hãy đăng ký mới!");
      return;
    }

    setLoading(true);
    try {
      await refreshVerification(email);
      messageApi.success("Đã gửi lại mã đến email của bạn. Hãy kiểm tra hộp thư!");
    } catch (err: any) {
      messageApi.error(err.response?.data?.detail || "Đã gặp lỗi khi gửi lại mã. Hãy thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="bg-background-light font-sans min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
        <Card
          bordered={false}
          className="w-full max-w-md bg-card-light rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden relative z-10 animate-slide-up border border-gray-100 !p-0"
          styles={{ body: { padding: 0 } }}
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <span className="text-primary text-4xl">LectureStudio</span>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Xác thực email
              </h1>

              {!username ? (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Không có tên đăng nhập được cung cấp. Vui lòng kiểm tra lại liên kết.
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Chúng tôi đã gửi mã xác thực đến email đăng ký của bạn. Vui lòng nhập mã để hoàn tất quá trình đăng ký.
                </p>
              )}
            </div>

            {!username ? (
              <Button
                type="default"
                className="!w-full !h-auto !py-2.5 !px-4 !rounded-lg !shadow-sm !text-sm !font-medium !text-gray-700 !bg-whiteborder !border-gray-200 hover:!bg-gray-50"
                onClick={() => navigate("/login")}
              >
                <span className="material-icons-round text-base mr-2">arrow_back</span>
                Quay lại đăng nhập
              </Button>
            ) : (
              <Form
                layout="vertical"
                onFinish={handleSubmit}
                className="space-y-6"
              >
                <Form.Item
                  label={
                    <span className="block text-sm font-medium text-gray-700">
                      Tên đăng nhập
                    </span>
                  }
                  className="mb-0"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[1]">
                      <UserOutlined className='text-gray-400 text-sm'/>
                    </div>

                    <Input
                      value={username}
                      disabled
                      className="!block !w-full !pl-10 !pr-10 !py-2.5 !bg-gray-50 !border !border-gray-200 !rounded-lg !text-gray-500 !text-sm !shadow-inner !cursor-not-allowed !select-none"
                    />

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <CheckCircleOutlined className='text-green-500 text-sm' />
                    </div>
                  </div>
                </Form.Item>
                <Form.Item
                  name="verification_code"
                  label={
                    <span className="block text-sm font-medium text-gray-700">
                      Mã xác thực
                    </span>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập mã xác thực" },
                  ]}
                  className="mb-0"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[1]">
                      <LockOutlined className='text-gray-400 group-focus-within:text-primary text-sm' />
                    </div>

                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập mã 6 chữ số"
                      className="!block !w-full !pl-10 !pr-3 !py-2.5 !bg-white !border !border-gray-300 !rounded-lg !text-gray-900 placeholder:!text-gray-400 !text-sm !shadow-sm !transition-all !duration-200 focus:!border-primary focus:!ring-2 focus:!ring-primary"
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                </Form.Item>

                <div className="pt-2 space-y-3">
                  <Button
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                    className="!w-full !h-auto !py-2.5 !px-4 !rounded-lg !shadow-md !text-sm !font-medium !text-white !bg-primary hover:!bg-primary-hover !border-transparent focus:!ring-2 focus:!ring-primary focus:!ring-offset-2 !transition-all !duration-200 hover:!-translate-y-0.5"
                  >
                    {loading ? "Đang xử lý..." : "Xác thực"}
                  </Button>

                  <div className="mt-6 text-center">
                    <Link className="text-sm font-medium text-primary" to="/login">
                      <span className="inline-block">←</span> Quay lại đăng nhập
                    </Link>
                </div>
                </div>
              </Form>
            )}
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-center">
            <p className="text-xs text-gray-500 text-center">
              Không nhận được mã?
              <button
                type="button"
                className="text-primary hover:text-primary-hover font-medium ml-1 hover:underline"
                onClick={reSendCode}
              >
                Gửi lại
              </button>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default VerifyEmail;
