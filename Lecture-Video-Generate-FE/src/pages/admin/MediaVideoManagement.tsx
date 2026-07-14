import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import {
  getMediaVideos,
  createMediaVideo,
  updateMediaVideo,
  deleteMediaVideo,
  uploadMediaVideoFile,
  MediaVideo,
} from '../../services/mediaVideoService';
import {
  message,
} from 'antd';
// import '../../styles/media-video-management.scss';

const MediaVideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MediaVideo | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<MediaVideo | null>(null);

  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setError(null);
      if (videos.length === 0) setLoading(true);
      setTableLoading(true);
      const response = await getMediaVideos('sample');
      setVideos(response.videos || []);
    } catch (err: any) {
      setError('Không thể tải danh sách video');
      console.error(err);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      setError('Chỉ chấp nhận file video!');
      return;
    }

    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      setError('Video phải nhỏ hơn 100MB!');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let videoUrl = editingVideo?.video_url || '';

      if (videoFile && !editingVideo) {
        setUploading(true);

        try {
          const uploadResponse = await uploadMediaVideoFile(videoFile);
          videoUrl = uploadResponse.video_url;
        } catch (uploadErr: any) {
          setUploading(false);
          setError(uploadErr.response?.data?.detail || 'Upload video thất bại');
          return;
        }
      }

      const videoData = {
        name: formData.name,
        video_url: videoUrl,
        video_type: 'sample'
      };

      if (editingVideo) {
        await updateMediaVideo(editingVideo.id, videoData);
        setSuccess('Cập nhật video thành công');
      } else {
        await createMediaVideo(videoData);
        setSuccess('Thêm video mới thành công');
      }
      
      await loadVideos();
      handleCancel();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video: MediaVideo) => {
    setEditingVideo(video);
    setFormData({ name: video.name });
    setPreviewUrl(video.video_url);
    setShowForm(true);
  };

  const confirmDelete = (video: MediaVideo) => {
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    try {
      await deleteMediaVideo(videoToDelete.id);
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      setSuccess('Xóa video thành công');
      setDeleteModalOpen(false);
      setVideoToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể xóa video');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
    setVideoFile(null);
    setPreviewUrl('');
    setUploading(false);
    setFormData({ name: '' });
  };

  const handleAddNew = () => {
    setFormData({ name: '' });
    setEditingVideo(null);
    setVideoFile(null);
    setPreviewUrl('');
    setShowForm(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
    return { dateStr, timeStr };
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        {contextHolder}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="media-video-management">
      {contextHolder}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Quản lý Video Giảng Viên Mẫu
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Quản lý các video giảng viên mẫu để ghép video trong hệ thống.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Thêm Video Mới
          </button>
          <button
            onClick={loadVideos}
            className="flex items-center px-4 py-2.5 bg-white hover:bg-gray-100 text-slate-700 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg border border-slate-300"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">refresh</span>
            Tải lại
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start justify-between mb-6">
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
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start justify-between mb-6">
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
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300 mb-8">
        <div className="absolute right-0 top-0 h-24 w-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm text-slate-500 mb-1 font-medium">Tổng số video giảng viên mẫu</p>
            <p className="text-3xl font-bold text-slate-900">{videos.length}</p>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <span className="material-symbols-outlined text-[32px]">video_library</span>
          </div>
        </div>
      </div>

      {/* Video Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center w-20">
                  STT
                </th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Tên Video
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
              {tableLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                      <p className="text-slate-500 text-sm">Đang tải...</p>
                    </div>
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-5xl">video_library</span>
                      <p className="text-slate-500 text-sm">Chưa có video giảng viên mẫu nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                videos.map((video, index) => {
                  const { dateStr, timeStr } = formatDate(video.created_at);
                  
                  return (
                    <tr key={video.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-500 font-medium text-sm">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{video.name}</span>
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
                            onClick={() => handleEdit(video)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Sửa
                          </button>
                          <button
                            onClick={() => confirmDelete(video)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingVideo ? 'Cập Nhật Video Giảng Viên' : 'Thêm Video Giảng Viên Mới'}
              </h3>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên Video <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Video Giảng Viên 1"
                  disabled={uploading}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>

              {!editingVideo && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Video <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50/50 transition-all">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={uploading}
                      className="hidden"
                      id="video-upload"
                      required
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-5xl">
                        upload_file
                      </span>
                      <span className="text-sm text-slate-600">
                        {videoFile ? videoFile.name : 'Click để chọn video'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Hỗ trợ: MP4, AVI, MOV (tối đa 100MB)
                      </span>
                    </label>
                    {uploading && (
                      <div className="mt-4 text-purple-600 text-sm font-medium">
                        Đang upload video...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {editingVideo ? 'Video hiện tại' : 'Preview'}
                  </label>
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-80"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!editingVideo && !videoFile) || !formData.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Đang xử lý...' : (editingVideo ? 'Cập Nhật' : 'Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && videoToDelete && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Bạn có chắc muốn xóa video "{videoToDelete.name}"?
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setVideoToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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

export default MediaVideoManagement;