import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateCurrentUser } from '../../services/authService';
import { Avatar, Button, Card, Col, Descriptions, Divider, Form, Input, Row, Typography } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  LockTwoTone,
  SaveOutlined,
} from "@ant-design/icons";
import "./profile.scss";

const { Title, Text } = Typography;

const Profile = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const roleLabel = useMemo(
    () => (user?.role === "admin" ? "Quản trị viên" : "Người dùng"),
    [user?.role]
  );

  const [form] = Form.useForm();

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
    <>
    <div className="bg-transparent font-sans text-gray-800 transition-colors duration-200">
      <div className="p-6 min-h-[calc(40vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Hồ sơ {roleLabel}
          </h1>
          <p className="text-gray-500 text-sm">
            Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.
          </p>
        </div>

        {/* Content */}
        <Row gutter={24}>
          {/* Cột trái: Thông tin tài khoản */}
          <Col xs={24} xl={8}>
            <Card
              className="rounded-2xl shadow-sm border border-border-light overflow-hidden bg-surface-light"
              styles={{ body: { paddingTop: 58, paddingBottom: 47, paddingInline: 24 } }}
              cover={
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-24 relative">
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 overflow-hidden ring-2 ring-white shadow-lg">
                      <div className="h-full w-full flex items-center justify-center text-white font-bold text-3xl">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="text-center">
                <Title level={4} className="!mb-1 text-gray-900 pb-57px">
                  {user?.username || "Chưa có tên"}
                </Title>
                <Text className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-sm font-medium">
                  {roleLabel}
                </Text>
              </div>

              <Divider className="!mt-6 !mb-4" />

              <Descriptions
                column={1}
                size="small"
                colon={false}
                labelStyle={{
                  color: "rgb(148 163 184)",
                  fontSize: 12,
                }}
                contentStyle={{
                  color: "rgb(15 23 42)",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                <Descriptions.Item label="Tên đăng nhập">
                  {user?.username}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {user?.created_at || "—"}
                </Descriptions.Item>
              </Descriptions>

              <Divider className="!my-4" />

              <div>
                <Text
                  type="secondary"
                  className="!text-xs text-gray-500"
                >
                  Email hiện tại
                </Text>
                <div className="mt-1 break-all text-sm font-medium text-gray-900">
                  {user?.email}
                </div>
              </div>
            </Card>
          </Col>

          {/* Cột phải: Form cập nhật */}
          <Col xs={24} xl={16} className="max-[1200px]:mt-8 xl:mt-0">
            <Card
              className="rounded-2xl shadow-sm border border-border-light bg-surface-light"
              styles={{ body: { padding: 24 } }}
            >
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 p-2 rounded-lg mr-3">
                  <LockTwoTone twoToneColor="#9333ea" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Cập nhật thông tin
                </h3>
              </div>

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  email: user?.email,
                  newPassword: "",
                  confirmPassword: "",
                }}
              >
                {/* Email */}
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="name@company.com"
                  />
                </Form.Item>
                <Text type="secondary" className="!text-xs">
                  Email này sẽ được sử dụng cho các thông báo quan trọng.
                </Text>

                <Divider />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Mật khẩu mới"
                      name="newPassword"
                      rules={[
                        {
                          min: 6,
                          message: "Mật khẩu phải có ít nhất 6 ký tự",
                        },
                      ]}
                      extra="Để trống nếu không muốn thay đổi mật khẩu."
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-400" />}
                        placeholder="••••••••"
                      />
                    </Form.Item>
                  </Col>

                  {/* Xác nhận mật khẩu */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Xác nhận mật khẩu mới"
                      name="confirmPassword"
                      dependencies={["newPassword"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("newPassword") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Mật khẩu xác nhận không khớp")
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-400" />}
                        placeholder="••••••••"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    value={confirmPassword}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
    </>
  );
};

export default Profile;
