import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getUsers,
  updateUser,
  deleteUser,
  User,
  UserUpdateData,
} from "../../services/adminService";
import { createPortal } from "react-dom";


const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
    is_active: false,
    password: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);


  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  const fetchUsers = async () => {
    if (users.length === 0) setLoading(true);
    setTableLoading(true);
    setError("");
    try {
      const response = await getUsers((page - 1) * limit, limit);
      setUsers(response.items);
      setTotalUsers(response.total);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Không thể tải danh sách người dùng"
      );
      console.error(err);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: "",
    });
    setEditMode(true);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setTotalUsers((prev) => prev - 1);
      setSuccess("Xóa người dùng thành công");
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Không thể xóa người dùng");
      console.error(err);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError("");
    setSuccess("");

    try {
      const updateData: UserUpdateData = {};
      if (formData.email !== selectedUser.email)
        updateData.email = formData.email;
      if (formData.role !== selectedUser.role)
        updateData.role = formData.role;
      if (formData.is_active !== selectedUser.is_active)
        updateData.is_active = formData.is_active;
      if (formData.password) updateData.password = formData.password;

      if (Object.keys(updateData).length === 0) {
        setError("Không có thông tin nào được thay đổi");
        return;
      }

      const updatedUser = await updateUser(selectedUser.id, updateData);

      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? updatedUser : user))
      );

      setSuccess("Cập nhật thông tin người dùng thành công");
      setEditMode(false);
      setSelectedUser(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Không thể cập nhật thông tin người dùng"
      );
      console.error(err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600",
      "bg-indigo-100 text-indigo-600",
      "bg-orange-100 text-orange-600",
      "bg-green-100 text-green-600",
    ];
    return colors[id % colors.length];
  };

  const getLastActiveText = (user: User) => {
    if (!user.created_at) return "Chưa đăng nhập";
    const now = new Date();
    const created = new Date(user.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return "Vừa xong";
    if (diffHours < 1) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "1 ngày trước";
    return `${diffDays} ngày trước`;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(totalUsers / limit);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Theo dõi và quản lý tài khoản người dùng trong hệ thống.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start justify-between">
          <div className="flex items-start">
            <span className="material-symbols-outlined mr-2">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start justify-between">
          <div className="flex items-start">
            <span className="material-symbols-outlined mr-2">check_circle</span>
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess("")}
            className="text-green-600 hover:text-green-800"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 h-24 w-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng người dùng
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {totalUsers}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <span className="material-symbols-outlined">groups</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 h-24 w-24 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Đang hoạt động
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {activeCount}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
              <span className="material-symbols-outlined">person_check</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Ngưng hoạt động
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {inactiveCount}
              </h3>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-600 rounded-xl">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-0 focus:border-slate-300 transition-all w-full sm:w-64"
                placeholder="Tìm kiếm theo tên, email..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 hidden sm:inline">
                Trạng thái:
              </span>
              <select
                className="py-2 pl-3 pr-8 text-sm border border-slate-300 rounded-lg bg-white focus:ring-0 focus:ring-primary focus:border-slate-300 focus:outline-none text-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Người dùng
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Vai trò
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Ngày tham gia
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Lần cuối
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${getAvatarColor(
                              user.id
                            )}`}
                          >
                            {getInitials(user.username)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.username}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${user.role === "admin" ? "bg-purple-500" : "bg-blue-500"
                              }`}
                          ></span>
                          {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.is_active
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-orange-50 text-orange-700 border-orange-100"
                            }`}
                        >
                          {user.is_active ? "Hoạt động" : "Ngưng hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-[16px] mr-1.5 text-slate-400">
                            calendar_today
                          </span>
                          {new Date(user.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {getLastActiveText(user)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isCurrent && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1.5 text-slate-600 hover:text-purple-500 hover:bg-purple-500/10 rounded transition-colors"
                              title="Chỉnh sửa"
                              onClick={() => handleEdit(user)}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>

                            <button
                              className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="Xóa"
                              onClick={() => confirmDelete(user)}
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
          <p className="text-sm text-slate-500">
            Hiển thị{" "}
            <span className="font-medium text-slate-900">
              {(page - 1) * limit + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium text-slate-900">
              {Math.min(page * limit, totalUsers)}
            </span>{" "}
            trong <span className="font-medium text-slate-900">{totalUsers}</span>{" "}
            kết quả
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 3) {
                pageNum = i + 1;
              } else if (page === 1) {
                pageNum = i + 1;
              } else if (page === totalPages) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = page - 1 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                    ? "bg-purple-500 text-white shadow-sm hover:bg-purple-600"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editMode && selectedUser &&
        createPortal(
          <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => { setEditMode(false); setSelectedUser(null); setError(""); }}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 ease-out animate-modal-in">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa người dùng</h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Tên đăng nhập:</label>
                  <input type="text" value={selectedUser.username} disabled className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Email:</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-slate-700">Tài khoản đang hoạt động</span>
                  <button type="button" onClick={() => handleSwitchChange(!formData.is_active)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-purple-500/40 ${formData.is_active ? "bg-purple-500" : "bg-slate-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Mật khẩu mới (để trống nếu không đổi):</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => { setEditMode(false); setSelectedUser(null); setError(""); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md">Lưu thay đổi</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      }



      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && createPortal(
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-200 ease-out scale-95 opacity-0 animate-modal-in">
            <div className="p-6">
              {/* header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <span className="material-symbols-outlined text-[28px]">
                    warning
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Xóa người dùng
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <p className="text-slate-600 mb-6">
                Bạn có chắc chắn muốn xóa người dùng{" "}
                <span className="font-semibold">{userToDelete.username}</span>?
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(userToDelete.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default UserManagement;
