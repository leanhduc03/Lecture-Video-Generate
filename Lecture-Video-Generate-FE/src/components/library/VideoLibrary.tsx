import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMediaVideos, deleteMediaVideo, uploadMediaVideoFile, createMediaVideo, MediaVideo } from '../../services/mediaVideoService';
import { MdDelete, MdFileUpload, MdVideoLibrary, MdClose, MdCloudUpload } from 'react-icons/md';
import './VideoLibrary.scss';

interface VideoLibraryProps {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ searchQuery = '', startDate = '', endDate = '' }) => {
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<MediaVideo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPreview || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreview, isDeleteModalOpen]);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMediaVideos('uploaded');
      setVideos(response.videos);
    } catch (err) {
      setError('Không thể tải danh sách video');
      console.error('Error loading videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Vui lòng chọn file video');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const uploadResponse = await uploadMediaVideoFile(file);
      
      const videoData = {
        name: file.name,
        video_url: uploadResponse.video_url,
        video_type: 'uploaded' as const
      };
      
      await createMediaVideo(videoData);
      await loadVideos();
    } catch (err) {
      setError('Không thể upload video. Vui lòng thử lại.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const openDeleteModal = (videoId: number) => {
    setDeleteVideoId(videoId);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteVideoId(null);
  };

  const confirmDelete = async () => {
    if (deleteVideoId === null) return;

    try {
      setError(null);
      await deleteMediaVideo(deleteVideoId);
      await loadVideos();
      if (selectedVideo?.id === deleteVideoId) {
        setSelectedVideo(null);
        setShowPreview(false);
      }
      setIsDeleteModalOpen(false);
      setDeleteVideoId(null);
    } catch (err) {
      setError('Không thể xóa video. Vui lòng thử lại.');
      console.error('Delete error:', err);
    }
  };

  const handleVideoClick = (video: MediaVideo) => {
    setSelectedVideo(video);
    setShowPreview(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  // Filter and search logic
  const filteredVideos = useMemo(() => {
    let filtered = [...videos];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(video =>
        video.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(video => {
        const uploadDate = new Date(video.created_at);
        uploadDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (uploadDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (uploadDate > end) return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [videos, searchQuery, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="library-loading">
        <div className="spinner"></div>
        <p>Đang tải thư viện video...</p>
      </div>
    );
  }

  return (
    <div className="video-library">
      <div className="library-header">
        {/* <div className="header-content">
          <MdVideoLibrary className="header-icon" />
          <div>
            <h2>Thư viện video</h2>
            <p>Quản lý các video đã upload ({filteredVideos.length} video)</p>
          </div>
        </div> */}
        
        {isUploading && (
          <div className="upload-btn uploading">
            <div className="spinner"></div>
            <span>Đang tải lên...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="empty-state">
          <MdVideoLibrary className="empty-icon" />
          <h3>Chưa có video nào</h3>
          <p>Upload video đầu tiên của bạn để bắt đầu</p>
          <label className="upload-btn-primary">
            <MdFileUpload />
            <span>Tải video lên</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={isUploading}
              hidden
            />
          </label>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="empty-state">
          <MdVideoLibrary className="empty-icon" />
          <h3>Không tìm thấy kết quả</h3>
          <p>Không có video nào phù hợp với bộ lọc của bạn</p>
        </div>
      ) : (
        <div className="videos-grid">
          {/* Upload Card */}
          <div className="upload-card" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon-wrapper">
              <MdCloudUpload />
            </div>
            <h3>Tải video lên</h3>
            <p>Kéo thả hoặc click để chọn file<br />(MP4, MOV)</p>
            <button className="upload-btn-card" type="button">
              Chọn file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={isUploading}
              hidden
            />
          </div>

          {/* Video Cards */}
          {filteredVideos.map((video) => (
            <div key={video.id} className="video-card">
              <div className="video-wrapper" onClick={() => handleVideoClick(video)}>
                <video src={video.video_url} />
              </div>
              
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(video.id);
                }}
                title="Xóa"
              >
                <MdDelete />
              </button>
              
              <div className="video-info">
                <div className="info-header">
                  <h4 className="video-name" title={video.name}>
                    {video.name.length > 25 ? video.name.substring(0, 25) + '...' : video.name}
                  </h4>
                </div>
                <div className="video-date">
                  <span className="status-dot"></span>
                  <span>{formatDate(video.created_at).date}</span>
                  <span className="separator">•</span>
                  <span>{formatDate(video.created_at).time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedVideo && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPreview(false)}>
              <MdClose />
            </button>
            
            <video src={selectedVideo.video_url} controls autoPlay />
            
            <div className="preview-info">
              <h3>{selectedVideo.name}</h3>
              <p>Tải lên: {formatDate(selectedVideo.created_at).date} {formatDate(selectedVideo.created_at).time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="video-modal delete-modal" onClick={cancelDelete}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <span className="material-icons-round delete-icon">warning</span>
              <h3>Xóa video</h3>
            </div>
            <div className="delete-modal-body">
              <p>Bạn có chắc chắn muốn xóa video này không?</p>
              <p className="warning-text">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={cancelDelete}>
                <span className="material-icons-round">close</span>
                Hủy
              </button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>
                <span className="material-icons-round">delete</span>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;