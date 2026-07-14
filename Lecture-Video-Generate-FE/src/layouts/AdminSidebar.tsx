import { FC } from "react";
import { Layout, Menu, ConfigProvider } from "antd";
import { TeamOutlined, VideoCameraOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;

const AdminSidebar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = (() => {
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname.startsWith("/admin/videos")) return "videos";
    if (location.pathname.startsWith("/admin/media-videos")) return "media-videos";
    return "users";
  })();

  return (
    <Sider
      width={280}
      theme="light"
      className="w-70 flex-shrink-0 bg-surface-light border-r border-border-light flex flex-col pt-24 fixed inset-y-0 left-0 z-10"
    >
      <div className="flex-grow flex flex-col justify-between p-4">
      <ConfigProvider
        theme={{
        token: {
          colorPrimary: "#7c3aed",
        },
        components: {
          Menu: {
          itemSelectedBg: "rgba(124, 58, 237, 0.12)",
          itemSelectedColor: "#7c3aed",
          itemHoverColor: "#7c3aed",
          itemHoverBg: "rgba(124, 58, 237, 0.08)",
          },
        },
        }}
      >
        <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          if (key === "users") navigate("/admin/users");
          if (key === "videos") navigate("/admin/videos");
          if (key === "media-videos") navigate("/admin/media-videos");
        }}
        className="border-0 bg-transparent"
        items={[
          { key: "users", icon: <TeamOutlined />, label: "Quản lý người dùng" },
          { key: "videos", icon: <VideoCameraOutlined />, label: "Quản lý video thuyết minh" },
          { key: "media-videos", icon: <PlayCircleOutlined />, label: "Quản lý video giảng viên" },
        ]}
        />
      </ConfigProvider>
      </div>
    </Sider>
  );
};

export default AdminSidebar;
