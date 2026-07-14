import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext';
import { Dropdown, MenuProps } from 'antd';
import { MdMovieEdit, MdAccountCircle, MdNotifications, MdSettings, MdLogout, MdPerson } from 'react-icons/md';

const HeaderLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const items: MenuProps["items"] = [
        {
            key: "profile",
            label: <Link to="/profile">Hồ sơ</Link>,
            icon: <MdPerson />,
        },
        {
            key: "logout",
            label: "Đăng xuất",
            icon: <MdLogout />,
            onClick: async () => {
                await logout();
                navigate("/login");
            },
        },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
            <div className="px-4 md:px-8 lg:px-12 flex justify-center">
                <div className="flex h-16 w-full max-w-7xl items-center justify-between">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="flex items-center justify-center text-purple-600 h-10 w-10 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <MdMovieEdit className="text-[26px]" />
                        </div>
                        <h2 className="text-slate-900 text-xl font-bold tracking-tight group-hover:text-purple-600 transition-colors">
                            LectureStudio
                        </h2>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link 
                            to="/create-content" 
                            className="text-slate-600 hover:text-purple-600 font-medium transition-colors relative group"
                        >
                            Tạo video
                            <span className="absolute -bottom-[21px] left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link 
                            to="/my-videos" 
                            className="text-slate-600 hover:text-purple-600 font-medium transition-colors relative group"
                        >
                            Video thuyết minh
                            <span className="absolute -bottom-[21px] left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link 
                            to="/my-deepfake-videos" 
                            className="text-slate-600 hover:text-purple-600 font-medium transition-colors relative group"
                        >
                            Video ghép mặt
                            <span className="absolute -bottom-[21px] left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link 
                            to="/my-library" 
                            className="text-slate-600 hover:text-purple-600 font-medium transition-colors relative group"
                        >
                            Thư viện của tôi
                            <span className="absolute -bottom-[21px] left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    </nav>

                    {/* Right Section */}
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

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-slate-900 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default HeaderLayout;