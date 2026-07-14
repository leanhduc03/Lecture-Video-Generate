import { FC } from "react";
import { Button, Dropdown, MenuProps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { MdMovieEdit, MdAccountCircle, MdNotifications, MdSettings, MdLogout, MdPerson } from 'react-icons/md';

const AdminHeader: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: <Link to="/admin/profile">Hồ sơ</Link>,
      icon: <UserOutlined />,
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: async () => {
        await logout();
        navigate("/login");
      },
    },
  ];

  return (
    <div
      className="h-16 flex items-center justify-between px-8 border-b border-border-light
        bg-surface-light/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center gap-3">
        <Link to="/admin/users" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center text-purple-600 h-10 w-10 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
            <MdMovieEdit className="text-[26px]" />
          </div>
          <h2 className="text-slate-900 text-xl font-bold tracking-tight group-hover:text-purple-600 transition-colors">
            LectureStudio
          </h2>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-sm font-medium">
          <MdAccountCircle className="text-[18px] text-purple-600" />
          <span>Xin chào, <strong className="text-slate-900">{user?.username || 'User'}</strong></span>
        </div>

        {/* User Avatar */}
        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 overflow-hidden ring-2 ring-white shadow-md cursor-pointer hover:ring-purple-600 transition-all">
            <div className="h-full w-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default AdminHeader;