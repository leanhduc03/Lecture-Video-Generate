import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getMyImages, deleteUploadedImage, UploadedImage, uploadSourceImage } from '../../services/uploadedImageService';
import { MdDelete, MdFileUpload, MdImage, MdClose, MdCloudUpload } from 'react-icons/md';
import './ImageLibrary.scss';

interface ImageLibraryProps {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ searchQuery = '', startDate = '', endDate = '' }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
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

  const loadImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyImages();
      setImages(data);
    } catch (err) {
      setError('Không thể tải danh sách ảnh');
      console.error('Error loading images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await uploadSourceImage(file);
      await loadImages();
    } catch (err) {
      setError('Không thể upload ảnh. Vui lòng thử lại.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const openDeleteModal = (imageId: number) => {
    setDeleteImageId(imageId);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteImageId(null);
  };

  const confirmDelete = async () => {
    if (deleteImageId === null) return;

    try {
      setError(null);
      await deleteUploadedImage(deleteImageId);
      await loadImages();
      if (selectedImage?.id === deleteImageId) {
        setSelectedImage(null);
        setShowPreview(false);
      }
      setIsDeleteModalOpen(false);
      setDeleteImageId(null);
    } catch (err) {
      setError('Không thể xóa ảnh. Vui lòng thử lại.');
      console.error('Delete error:', err);
    }
  };

  const handleImageClick = (image: UploadedImage) => {
    setSelectedImage(image);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filter and search logic
  const filteredImages = useMemo(() => {
    let filtered = [...images];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(image =>
        image.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(image => {
        const uploadDate = new Date(image.uploaded_at);
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
  }, [images, searchQuery, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="library-loading">
        <div className="spinner"></div>
        <p>Đang tải thư viện ảnh...</p>
      </div>
    );
  }

  return (
    <div className="image-library">
      <div className="library-header">
        {/* <div className="header-content">
          <MdImage className="header-icon" />
          <div>
            <h2>Thư viện ảnh</h2>
            <p>Quản lý các ảnh đã upload ({filteredImages.length} ảnh)</p>
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

      {images.length === 0 ? (
        <div className="empty-state">
          <MdImage className="empty-icon" />
          <h3>Chưa có ảnh nào</h3>
          <p>Upload ảnh đầu tiên của bạn để bắt đầu</p>
          <label className="upload-btn-primary">
            <MdFileUpload />
            <span>Tải ảnh lên</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
              hidden
            />
          </label>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="empty-state">
          <MdImage className="empty-icon" />
          <h3>Không tìm thấy kết quả</h3>
          <p>Không có ảnh nào phù hợp với bộ lọc của bạn</p>
        </div>
      ) : (
        <div className="images-grid">
          {/* Upload Card */}
          <div className="upload-card" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon-wrapper">
              <MdCloudUpload />
            </div>
            <h3>Tải ảnh lên</h3>
            <p>Kéo thả hoặc click để chọn file<br />(JPG, PNG)</p>
            <button className="upload-btn-card" type="button">
              Chọn file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
              hidden
            />
          </div>

          {/* Image Cards */}
          {filteredImages.map((image) => {
            const dateInfo = formatDate(image.uploaded_at);
            return (
              <div key={image.id} className="image-card">
                <div className="image-wrapper" onClick={() => handleImageClick(image)}>
                  <img src={image.image_url} alt={image.name} />
                  <div className="file-size">
                    {formatFileSize(1200000)} {/* Replace with actual file size if available */}
                  </div>
                </div>
                
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(image.id);
                  }}
                  title="Xóa"
                >
                  <MdDelete />
                </button>
                
                <div className="image-info">
                  <div className="info-header">
                    <h3 className="image-name" title={image.name}>
                      {image.name.length > 25 ? image.name.substring(0, 25) + '...' : image.name}
                    </h3>
                  </div>
                  <div className="image-date">
                    <span className="status-dot"></span>
                    <span>{dateInfo.date}</span>
                    <span className="separator">•</span>
                    <span>{dateInfo.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedImage && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPreview(false)}>
              <MdClose />
            </button>
            
            <img src={selectedImage.image_url} alt={selectedImage.name} />
            
            <div className="preview-info">
              <h3>{selectedImage.name}</h3>
              <p>Tải lên: {formatDate(selectedImage.uploaded_at).date} {formatDate(selectedImage.uploaded_at).time}</p>
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
              <h3>Xóa ảnh</h3>
            </div>
            <div className="delete-modal-body">
              <p>Bạn có chắc chắn muốn xóa ảnh này không?</p>
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

export default ImageLibrary;