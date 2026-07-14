import React, { useState, useEffect } from "react";
import { getAllVideos, deleteVideo } from "../../services/videoService";

interface Video {
  id: number;
  video_url: string;
  username: string;
  created_at: string;
}

interface UserVideos {
  username: string;
  videos: Video[];
  totalVideos: number;
}

const AllVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await getAllVideos();
      setVideos(response.videos || []);
    } catch (err: any) {
      setError("Không thể tải danh sách video");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      setSuccess("Xóa video thành công");
      setDeleteModalOpen(false);
      setVideoToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Không thể xóa video");
    }
  };

  const confirmDelete = (video: Video) => {
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getUserVideos = (): UserVideos[] => {
    const userMap = new Map<string, Video[]>();
    
    videos.forEach((video) => {
      const username = video.username || "Unknown";
      if (!userMap.has(username)) {
        userMap.set(username, []);
      }
      userMap.get(username)?.push(video);
    });

    return Array.from(userMap.entries()).map(([username, videos]) => ({
      username,
      videos: videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      totalVideos: videos.length,
    }));
  };

  const userVideos = getUserVideos();
  const selectedUserVideos = selectedUser
    ? userVideos.find((uv) => uv.username === selectedUser)
    : null;

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600",
      "bg-indigo-100 text-indigo-600",
      "bg-orange-100 text-orange-600",
      "bg-green-100 text-green-600",
      "bg-pink-100 text-pink-600",
    ];
    const index = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Quản lý video
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            {selectedUser
              ? `Danh sách video của ${selectedUser}`
              : "Xem, tải xuống và quản lý video theo người dùng."}
          </p>
        </div>
        <div className="flex gap-3">
          {selectedUser && (
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center px-4 py-2.5 bg-white hover:bg-gray-100 text-purple-600 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">arrow_back</span>
              Quay lại
            </button>
          )}
          <button
            onClick={loadVideos}
            className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">refresh</span>
            Tải lại
          </button>
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
            onClick={() => setError(null)}
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
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Statistics Card */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="absolute right-0 top-0 h-24 w-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {selectedUser ? `Tổng video của ${selectedUser}` : "Tổng số người dùng"}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {selectedUser ? selectedUserVideos?.totalVideos || 0 : userVideos.length}
            </h3>
          </div>
          <div className="p-3 bg-purple/10 text-purple-600 rounded-xl">
            <span className="material-symbols-outlined">
              {selectedUser ? "videocam" : "groups"}
            </span>
          </div>
        </div>
      </div>

      {/* User List View */}
      {!selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userVideos.map((userVideo) => (
            <div
              key={userVideo.username}
              onClick={() => setSelectedUser(userVideo.username)}
              className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-lg ${getAvatarColor(
                    userVideo.username
                  )}`}
                >
                  {getInitials(userVideo.username)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {userVideo.username}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {userVideo.totalVideos} video
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-purple-600 transition-colors">
                  arrow_forward
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>
                  Mới nhất:{" "}
                  {new Date(userVideo.videos[0].created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Videos View */}
      {selectedUser && selectedUserVideos && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center w-20">
                    STT
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider min-w-[250px]">
                    Video Preview
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Thời gian tạo
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedUserVideos.videos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-5xl">video_library</span>
                        <p className="text-slate-500 text-sm">Không có video nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  selectedUserVideos.videos.map((video, index) => {
                    const date = new Date(video.created_at);
                    const dateStr = date.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    const timeStr = date.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    });

                    return (
                      <tr key={video.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center text-slate-500 font-medium text-sm">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-slate-200 shadow-sm border border-slate-200 group">
                            <video
                              src={video.video_url}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => {
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
                                  modal.onclick = () => modal.remove();
                                  modal.innerHTML = `
                                    <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden" onclick="event.stopPropagation()">
                                      <button class="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-colors" onclick="this.closest('.fixed').remove()">
                                        <span class="material-symbols-outlined">close</span>
                                      </button>
                                      <div class="bg-black aspect-video">
                                        <video src="${video.video_url}" controls autoplay class="w-full h-full"></video>
                                      </div>
                                    </div>
                                  `;
                                  document.body.appendChild(modal);
                                }}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 transition-colors"
                              >
                                <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-900">{dateStr}</span>
                            <span className="text-xs text-slate-500">{timeStr}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = video.video_url;
                                link.download = `video_${video.id}_${Date.now()}.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                              title="Tải xuống"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              Tải xuống
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                              title="Xóa video"
                              onClick={() => confirmDelete(video)}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && videoToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Xóa video</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Bạn có chắc chắn muốn xóa video <span className="font-semibold">#{videoToDelete.id}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setVideoToDelete(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(videoToDelete.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllVideos;
