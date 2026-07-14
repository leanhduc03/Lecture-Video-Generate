import React, { useState, useEffect } from 'react';
import { getMediaVideos, deleteMediaVideo, MediaVideo } from '../../services/mediaVideoService';
import '../../styles/my-deepfake-videos.scss';

const MyDeepfakeVideos = () => {
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<MediaVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const VIDEOS_PER_PAGE = 4;

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await getMediaVideos('deepfake');
      setVideos(response.videos);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải danh sách video');
      console.error(err);
    } finally {
      setLoading(false);
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
      await deleteMediaVideo(deleteVideoId);
      loadVideos();
      setIsDeleteModalOpen(false);
      setDeleteVideoId(null);
    } catch (err) {
      alert('Không thể xóa video');
    }
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

  const openVideoModal = (video: MediaVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleDownload = async (videoUrl: string, videoName: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${videoName}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi khi tải video:', error);
      alert('Không thể tải video. Vui lòng thử lại.');
    }
  };

  const filteredVideos = videos.filter(video => {
    // Search filter
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (startDate || endDate) {
      const videoDate = new Date(video.created_at);
      videoDate.setHours(0, 0, 0, 0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && videoDate >= start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && videoDate <= end;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = filteredVideos.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isDeleteModalOpen]);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const applyFilter = () => {
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectingStart(true);
    setIsFilterOpen(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format date without timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    if (selectingStart || !startDate) {
      setStartDate(dateString);
      setEndDate('');
      setSelectingStart(false);
    } else {
      if (new Date(dateString) < new Date(startDate)) {
        // If selected date is before start date, swap them
        setEndDate(startDate);
        setStartDate(dateString);
      } else {
        setEndDate(dateString);
      }
      setSelectingStart(true);
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate) return false;
    
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end) {
      return checkDate >= start && checkDate <= end;
    }
    return false;
  };

  const isDateSelected = (day: number) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format date without timezone conversion
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(checkDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return dateString === startDate || dateString === endDate;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="my-videos-container">
        <div className="loading-wrapper">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-videos-container">
        <div className="error-box">
          <span className="material-icons-round error-icon">error</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="my-videos-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Video ghép mặt đã tạo</h1>
          <p className="video-count">
            <span className="material-icons-round">analytics</span>
            Tổng số: <span className="count-number">{videos.length} video</span>
          </p>
        </div>
        <div className="header-actions">
          <div className="filter-wrapper">
            <button className="filter-button" onClick={toggleFilter}>
              <span className="material-icons-round">filter_list</span>
              <span>Lọc</span>
              {(startDate || endDate) && <span className="filter-badge"></span>}
            </button>
            
            {isFilterOpen && (
              <div className="filter-dropdown">
                <div className="filter-header">
                  <h3>Chọn khoảng thời gian</h3>
                  <button className="close-filter" onClick={() => setIsFilterOpen(false)}>
                    <span className="material-icons-round">close</span>
                  </button>
                </div>
                
                <div className="filter-content">
                  <div className="calendar-wrapper">
                    <div className="calendar-header">
                      <button className="calendar-nav" onClick={prevMonth}>
                        <span className="material-icons-round">chevron_left</span>
                      </button>
                      <span className="calendar-title">
                        Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                      </span>
                      <button className="calendar-nav" onClick={nextMonth}>
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>

                    <div className="calendar-grid">
                      <div className="calendar-weekdays">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                          <div key={day} className="weekday">{day}</div>
                        ))}
                      </div>

                      <div className="calendar-days">
                        {(() => {
                          const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                          const days = [];
                          
                          // Empty cells before first day
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                          }
                          
                          // Days of month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const inRange = isDateInRange(day);
                            const selected = isDateSelected(day);
                            days.push(
                              <button
                                key={day}
                                className={`calendar-day ${selected ? 'selected' : ''} ${inRange ? 'in-range' : ''}`}
                                onClick={() => handleDateClick(day)}
                              >
                                {day}
                              </button>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="filter-actions">
                  <button className="btn-clear" onClick={clearFilter}>
                    Xóa bộ lọc
                  </button>
                  <button className="btn-apply" onClick={applyFilter}>
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons-round empty-icon">video_library</span>
          <p className="empty-title">
            {searchTerm ? 'Không tìm thấy video nào' : 'Bạn chưa tạo video deepfake nào'}
          </p>
          <p className="empty-subtitle">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy bắt đầu tạo video deepfake đầu tiên của bạn!'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-container">
            <table className="videos-table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th className="col-preview">Video Preview</th>
                  <th className="col-name">Tên video</th>
                  <th className="col-date">Thời gian tạo</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentVideos.map((video, index) => {
                  const { dateStr, timeStr } = formatDate(video.created_at);
                  const displayIndex = startIndex + index + 1;
                  return (
                    <tr key={video.id} className="table-row">
                      <td className="cell-stt">{displayIndex}</td>
                      <td className="cell-preview">
                        <div className="video-preview-wrapper">
                          <video 
                            src={video.video_url} 
                            className="video-element"
                            preload="metadata"
                          />
                          <div className="video-overlay" onClick={() => openVideoModal(video)}>
                            <button className="play-button">
                              <span className="material-icons-round">play_arrow</span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="cell-name">
                        <div className="video-name">
                          <span className="name-text">{video.name}</span>
                        </div>
                      </td>
                      <td className="cell-date">
                        <div className="date-info">
                          <span className="date-str">{dateStr}</span>
                          <span className="time-str">{timeStr}</span>
                        </div>
                      </td>
                      <td className="cell-actions">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDownload(video.video_url, video.name)}
                            className="btn-download"
                          >
                            <span className="material-icons-round">download</span>
                            Tải xuống
                          </button>
                          <button
                            onClick={() => openDeleteModal(video.id)}
                            className="btn-delete"
                          >
                            <span className="material-icons-round">delete</span>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="footer-info">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVideos.length)} trên {filteredVideos.length} video
            </span>
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}

              <button 
                className="pagination-btn" 
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <div className="video-modal" onClick={closeVideoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeVideoModal}>
              <span className="material-icons-round">close</span>
            </button>
            <div className="modal-video-wrapper">
              <video 
                src={selectedVideo.video_url} 
                controls
                autoPlay
                className="modal-video"
              />
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
              <h3>Xóa video </h3>
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
    </main>
  );
};

export default MyDeepfakeVideos;