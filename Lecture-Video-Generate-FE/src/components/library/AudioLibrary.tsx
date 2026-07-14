import React, { useState, useEffect, useMemo } from 'react';
import { getMyAudios, deleteUploadedAudio, uploadReferenceAudio, updateReferenceText, UploadedAudio } from '../../services/uploadedAudioService';
import { MdDelete, MdFileUpload, MdAudiotrack, MdClose, MdEdit, MdSave, MdCloudUpload } from 'react-icons/md';
import './AudioLibrary.scss';

interface AudioLibraryProps {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

const AudioLibrary: React.FC<AudioLibraryProps> = ({ searchQuery = '', startDate = '', endDate = '' }) => {
  const [audios, setAudios] = useState<UploadedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<UploadedAudio | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadReferenceText, setUploadReferenceText] = useState('');
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deleteAudioId, setDeleteAudioId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadAudios();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPreview || isDeleteModalOpen || showUploadModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreview, isDeleteModalOpen, showUploadModal]);

  const loadAudios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyAudios();
      setAudios(data);
    } catch (err) {
      setError('Không thể tải danh sách audio');
      console.error('Error loading audios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadReferenceText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Vui lòng chọn file audio');
      return;
    }

    setUploadFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!uploadFile) {
      setError('Vui lòng chọn file audio');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await uploadReferenceAudio(uploadFile, uploadReferenceText);
      await loadAudios();
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadReferenceText('');
    } catch (err) {
      setError('Không thể upload audio. Vui lòng thử lại.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const openDeleteModal = (audioId: number) => {
    setDeleteAudioId(audioId);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteAudioId(null);
  };

  const confirmDelete = async () => {
    if (deleteAudioId === null) return;

    try {
      setError(null);
      await deleteUploadedAudio(deleteAudioId);
      await loadAudios();
      if (selectedAudio?.id === deleteAudioId) {
        setSelectedAudio(null);
        setShowPreview(false);
      }
      setIsDeleteModalOpen(false);
      setDeleteAudioId(null);
    } catch (err) {
      setError('Không thể xóa audio. Vui lòng thử lại.');
      console.error('Delete error:', err);
    }
  };

  const handleAudioClick = (audio: UploadedAudio) => {
    setSelectedAudio(audio);
    setShowPreview(true);
  };

  const handleEditText = (audio: UploadedAudio) => {
    setEditingTextId(audio.id);
    setEditingText(audio.reference_text);
  };

  const handleSaveText = async (audioId: number) => {
    try {
      setError(null);
      await updateReferenceText(audioId, editingText);
      await loadAudios();
      setEditingTextId(null);
      setEditingText('');
    } catch (err) {
      setError('Không thể cập nhật reference text. Vui lòng thử lại.');
      console.error('Update error:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingTextId(null);
    setEditingText('');
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
  const filteredAudios = useMemo(() => {
    let filtered = [...audios];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(audio =>
        audio.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(audio => {
        const uploadDate = new Date(audio.uploaded_at);
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
  }, [audios, searchQuery, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="library-loading">
        <div className="spinner"></div>
        <p>Đang tải thư viện audio...</p>
      </div>
    );
  }

  return (
    <div className="audio-library">
      <div className="library-header">
        {/* <div className="header-content">
          <MdAudiotrack className="header-icon" />
          <div>
            <h2>Thư viện giọng nói</h2>
            <p>Quản lý các file audio đã upload ({filteredAudios.length} audio)</p>
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

      {audios.length === 0 ? (
        <div className="empty-state">
          <MdAudiotrack className="empty-icon" />
          <h3>Chưa có audio nào</h3>
          <p>Upload audio đầu tiên của bạn để bắt đầu</p>
          <button className="upload-btn-primary" onClick={handleUploadClick}>
            <MdFileUpload />
            <span>Tải audio lên</span>
          </button>
        </div>
      ) : filteredAudios.length === 0 ? (
        <div className="empty-state">
          <MdAudiotrack className="empty-icon" />
          <h3>Không tìm thấy kết quả</h3>
          <p>Không có audio nào phù hợp với bộ lọc của bạn</p>
        </div>
      ) : (
        <div className="audios-grid">
          {/* Upload Card */}
          <div className="upload-card" onClick={handleUploadClick}>
            <div className="upload-icon-wrapper">
              <MdCloudUpload />
            </div>
            <h3>Tải audio lên</h3>
            <p>Kéo thả hoặc click để chọn file<br />(MP3, WAV)</p>
            <button className="upload-btn-card" type="button">
              Chọn file
            </button>
          </div>

          {/* Audio Cards */}
          {filteredAudios.map((audio) => {const dateInfo = formatDate(audio.uploaded_at);
            return (            <div key={audio.id} className="audio-card">
              <div className="audio-icon-wrapper" onClick={() => handleAudioClick(audio)}>
                <MdAudiotrack className="audio-icon" />
              </div>
              
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(audio.id);
                }}
                title="Xóa"
              >
                <MdDelete />
              </button>
              
              <div className="audio-info">
                <div className="info-header">
                  <h4 className="audio-name" title={audio.name}>
                    {audio.name.length > 25 ? audio.name.substring(0, 25) + '...' : audio.name}
                  </h4>
                </div>
                <div className="audio-date">
                  <span className="status-dot"></span>
                  <span>{dateInfo.date}</span>
                  <span className="separator">•</span>
                  <span>{dateInfo.time}</span>
                </div>
                
                {editingTextId === audio.id ? (
                  <div className="reference-text-editor">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Nhập nội dung tương ứng với audio..."
                      rows={3}
                    />
                    <div className="editor-actions">
                      <button className="btn-save" onClick={() => handleSaveText(audio.id)}>
                        <MdSave /> Lưu
                      </button>
                      <button className="btn-cancel" onClick={handleCancelEdit}>
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="reference-text-display">
                    <p className="reference-text">
                      {audio.reference_text || 'Chưa có reference text'}
                    </p>
                    <button 
                      className="btn-edit-text" 
                      onClick={() => handleEditText(audio)}
                      title="Chỉnh sửa reference text"
                    >
                      <MdEdit />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowUploadModal(false)}>
              <MdClose />
            </button>
            
            <h3>Upload Audio Reference</h3>
            
            <div className="upload-form">
              <div className="form-group">
                <label>Chọn file audio:</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                />
                {uploadFile && (
                  <div className="file-selected">
                    ✓ Đã chọn: {uploadFile.name}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Reference Text (nội dung của audio):</label>
                <textarea
                  value={uploadReferenceText}
                  onChange={(e) => setUploadReferenceText(e.target.value)}
                  placeholder="Nhập nội dung tương ứng với audio để cải thiện chất lượng clone giọng..."
                  rows={5}
                />
                <small>Reference text giúp mô hình hiểu rõ hơn về giọng nói trong file audio</small>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Hủy
                </button>
                <button 
                  className="btn-upload" 
                  onClick={handleConfirmUpload}
                  disabled={!uploadFile || isUploading}
                >
                  {isUploading ? 'Đang tải lên...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedAudio && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPreview(false)}>
              <MdClose />
            </button>
            
            <div className="audio-preview">
              <MdAudiotrack className="preview-icon" />
              <audio src={selectedAudio.audio_url} controls autoPlay />
            </div>
            
            <div className="preview-info">
              <h3>{selectedAudio.name}</h3>
              <p>Tải lên: {formatDate(selectedAudio.uploaded_at).date} {formatDate(selectedAudio.uploaded_at).time}</p>
              
              <div className="reference-text-section">
                <h4>Reference Text:</h4>
                <p>{selectedAudio.reference_text || 'Chưa có reference text'}</p>
              </div>
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
                <h4>Xóa audio</h4>
            </div>
            <div className="delete-modal-body">
              <p>Bạn có chắc chắn muốn xóa audio này không?</p>
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

export default AudioLibrary;