import React, { useEffect } from 'react';
import { deepfakeVideoWithUrls, checkDeepfakeStatus } from '../../services/aiService';
import { getMyImages, uploadSourceImage } from '../../services/uploadedImageService';
import { getMediaVideos, uploadMediaVideoFile, createMediaVideo, saveDeepfakeVideo } from '../../services/mediaVideoService';
import '../../styles/deepfake.scss';
import { useDeepfakeVideoStore } from '../../store/deepfakeVideo.store';

const DeepfakeVideo = () => {
  const {
    sourceMode, selectedImageUrl, myImages, isUploadingSource,
    targetMode, targetFile, selectedVideoUrl, myVideos, isUploadingTarget,
    resultVideo, isLoading, error, jobId, processingProgress, isSavingVideo, savedSuccess,
    isPlaying, currentTime, duration,
    setField, patch
  } = useDeepfakeVideoStore();

  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadMyImages();
    loadMyVideos();
  }, []);

  const loadMyImages = async () => {
    try {
      const images = await getMyImages();
      setField('myImages', images);
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const loadMyVideos = async () => {
    try {
      const response = await getMediaVideos('uploaded');
      setField('myVideos', response.videos);
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  };

  const handleSourceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      patch({ sourceFile: file, isUploadingSource: true, error: null });
      try {
        const uploadedImage = await uploadSourceImage(file);
        setField('selectedImageUrl', uploadedImage.image_url);
        await loadMyImages();
      } catch (err) {
        setField('error', 'Không thể tải lên ảnh. Vui lòng thử lại.');
        console.error('Upload error:', err);
      } finally {
        setField('isUploadingSource', false);
      }
    }
  };

  const handleTargetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      patch({ targetFile: file, isUploadingTarget: true, error: null });
      try {
        const uploadResponse = await uploadMediaVideoFile(file);
        
        const videoData = {
          name: file.name,
          video_url: uploadResponse.video_url,
          video_type: 'uploaded' as const
        };
        
        const savedVideo = await createMediaVideo(videoData);
        setField('selectedVideoUrl', savedVideo.video_url);
        await loadMyVideos();
      } catch (err) {
        setField('error', 'Không thể tải lên video. Vui lòng thử lại.');
        console.error('Upload error:', err);
      } finally {
        setField('isUploadingTarget', false);
      }
    }
  };

  const handleSelectExistingImage = (imageUrl: string) => {
    setField('selectedImageUrl', imageUrl);
  };

  const handleSelectExistingVideo = (videoUrl: string) => {
    setField('selectedVideoUrl', videoUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageUrl || !selectedVideoUrl) {
      setField('error', 'Vui lòng chọn ảnh nguồn và video đích');
      return;
    }

    patch({ isLoading: true, error: null, resultVideo: null, savedSuccess: false, processingProgress: 'Đang xử lý...' });

    try {
      const jobId = await deepfakeVideoWithUrls(selectedImageUrl, selectedVideoUrl);
      patch({ jobId: jobId, processingProgress: 'Đang chuẩn bị...' });
    } catch (err) {
      setField('error', 'Có lỗi xảy ra khi xử lý video. Vui lòng thử lại sau.');
      console.error('Deepfake error:', err);
    } finally {
      setField('isLoading', false);
    }
  };

  useEffect(() => {
    const autoSaveVideo = async () => {
      if (resultVideo && !savedSuccess && !isSavingVideo) {
        setField('isSavingVideo', true);
        try {
          await saveDeepfakeVideo(resultVideo);
          setField('savedSuccess', true);
        } catch (err) {
          console.error('Error auto-saving video:', err);
          setField('error', 'Không thể lưu video tự động. Vui lòng tải xuống thủ công.');
        } finally {
          setField('isSavingVideo', false);
        }
      }
    };

    autoSaveVideo();
  }, [resultVideo, savedSuccess, isSavingVideo]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (jobId && !resultVideo) {
      let progressCounter = 0;
      const progressMessages = [
        'Đang phân tích khuôn mặt trong ảnh nguồn...',
        'Đang nhận diện khuôn mặt trong video...',
        'Đang thực hiện deepfake...',
        'Đang hoàn thiện video...',
        'Đang chuẩn bị kết quả...'
      ];

      intervalId = setInterval(async () => {
        try {
          const result = await checkDeepfakeStatus(jobId);

          if (result.status === 'processing') {
            if (progressCounter < progressMessages.length) {
              setField('processingProgress', progressMessages[progressCounter]);
              progressCounter++;
            }
          } else if (result.status === 'completed' && result.result_url) {
            setField('resultVideo', result.result_url);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, resultVideo]);

  const handleDownload = async () => {
    if (!resultVideo) return;

    try {
      setField('error', null);
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'download-loading';
      loadingMessage.textContent = 'Đang chuẩn bị tải xuống...';
      document.querySelector('.result-section')?.appendChild(loadingMessage);

      const response = await fetch(resultVideo);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      const fileName = resultVideo.split('/').pop() || 'deepfake-video.mp4';
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.querySelector('.download-loading')?.remove();
      }, 100);
    } catch (err) {
      console.error('Lỗi khi tải file:', err);
      setField('error', 'Không thể tải xuống video. Vui lòng thử lại sau.');
      document.querySelector('.download-loading')?.remove();
    }
  };

  // Video player handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setField('isPlaying', !isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setField('currentTime', videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setField('duration', videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
      videoRef.current.currentTime = clickPosition * duration;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Reset video khi đổi source
  React.useEffect(() => {
    patch({ isPlaying: false, currentTime: 0, duration: 0 });
  }, [selectedVideoUrl, targetFile]);

  return (
    <div className="deepfake-video">
      {error && (
        <div className="error-message">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="deepfake-content">
          <div className="selection-grid">
            {/* Source Image Section */}
            <div className="selection-column">
              <div className="column-header">
                <div className="header-title">
                  <span className="step-number">1</span>
                  <h3>Ảnh nguồn (khuôn mặt)</h3>
                </div>
                <span className="file-types">JPG, PNG</span>
              </div>

              <div className="selection-modes">
                <button
                  type="button"
                  className={`mode-btn ${sourceMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setField('sourceMode', 'upload')}
                >
                  <span className="material-symbols-outlined">upload</span>
                  Tải ảnh lên
                </button>
                <button
                  type="button"
                  className={`mode-btn ${sourceMode === 'existing' ? 'active' : ''}`}
                  onClick={() => setField('sourceMode', 'existing')}
                >
                  <span className="material-symbols-outlined">collections</span>
                  Chọn từ thư viện
                </button>
              </div>

              {sourceMode === 'upload' ? (
                <div className="upload-zone">
                  <input
                    type="file"
                    id="source-image"
                    accept="image/*"
                    onChange={handleSourceChange}
                    disabled={isUploadingSource}
                  />
                  <label htmlFor="source-image" className="upload-label">
                    {isUploadingSource ? (
                      <>
                        <span className="material-symbols-outlined spinning">progress_activity</span>
                        <span>Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                        <p>Click để chọn ảnh</p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="media-grid">
                  {myImages.length === 0 ? (
                    <div className="empty-state">
                      <span className="material-symbols-outlined">image</span>
                      <p>Chưa có ảnh nào</p>
                      <button
                        type="button"
                        onClick={() => setField('sourceMode', 'upload')}
                        className="switch-mode-btn"
                      >
                        Upload ảnh đầu tiên
                      </button>
                    </div>
                  ) : (
                    myImages.map((image) => (
                      <div
                        key={image.id}
                        className={`media-item ${selectedImageUrl === image.image_url ? 'selected' : ''}`}
                        onClick={() => handleSelectExistingImage(image.image_url)}
                      >
                        <img src={image.image_url} alt={image.name} />
                        {selectedImageUrl === image.image_url && (
                          <div className="selected-badge">
                            <span className="material-symbols-outlined">check_circle</span>
                            Đã chọn
                          </div>
                        )}
                        <div className="media-name">{image.name}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Target Video Section */}
            <div className="selection-column">
              <div className="column-header">
                <div className="header-title">
                  <span className="step-number">2</span>
                  <h3>Video đích (cần thay mặt)</h3>
                </div>
                <span className="file-types">MP4, MOV</span>
              </div>

              <div className="selection-modes">
                <button
                  type="button"
                  className={`mode-btn ${targetMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setField('targetMode', 'upload')}
                >
                  <span className="material-symbols-outlined">movie</span>
                  Tải video lên
                </button>
                <button
                  type="button"
                  className={`mode-btn ${targetMode === 'existing' ? 'active' : ''}`}
                  onClick={() => setField('targetMode', 'existing')}
                >
                  <span className="material-symbols-outlined">video_library</span>
                  Video có sẵn
                </button>
              </div>

              {targetMode === 'upload' ? (
                <div className="upload-zone">
                  <input
                    type="file"
                    id="target-video"
                    accept="video/*"
                    onChange={handleTargetChange}
                    disabled={isUploadingTarget}
                  />
                  <label htmlFor="target-video" className="upload-label">
                    {isUploadingTarget ? (
                      <>
                        <span className="material-symbols-outlined spinning">progress_activity</span>
                        <span>Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">videocam</span>
                        <p>Click để chọn video</p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="media-grid">
                  {myVideos.length === 0 ? (
                    <div className="empty-state">
                      <span className="material-symbols-outlined">video_library</span>
                      <p>Chưa có video nào</p>
                      <button
                        type="button"
                        onClick={() => setField('targetMode', 'upload')}
                        className="switch-mode-btn"
                      >
                        Upload video đầu tiên
                      </button>
                    </div>
                  ) : (
                    myVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`media-item video-item ${selectedVideoUrl === video.video_url ? 'selected' : ''}`}
                        onClick={() => handleSelectExistingVideo(video.video_url)}
                      >
                        <video src={video.video_url} />
                        <div className="video-play-icon">
                          <span className="material-symbols-outlined">play_circle</span>
                        </div>
                        {selectedVideoUrl === video.video_url && (
                          <div className="selected-badge">
                            <span className="material-symbols-outlined">check_circle</span>
                            Đã chọn
                          </div>
                        )}
                        <div className="media-name">{video.name}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {(selectedImageUrl || selectedVideoUrl) && (
            <div className="preview-section">
              <h3>
                <span className="material-symbols-outlined">visibility</span>
                Xem trước nội dung đã chọn
              </h3>
              <div className="preview-grid">
                {selectedImageUrl && (
                  <div className="preview-item">
                    <div className="preview-label">
                      <span className="material-symbols-outlined">image</span>
                      Ảnh nguồn
                    </div>
                    <div className="preview-content">
                      <img src={selectedImageUrl} alt="Selected Source" />
                    </div>
                  </div>
                )}
                {selectedVideoUrl && (
                  <div className="preview-item">
                    <div className="preview-label">
                      <span className="material-symbols-outlined">videocam</span>
                      Video đích
                    </div>
                    <div className="preview-content video-preview">
                      <video
                        ref={videoRef}
                        src={selectedVideoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setField('isPlaying', false)}
                      />
                      {!isPlaying && (
                        <div className="play-overlay" onClick={handlePlayPause}>
                          <button type="button">
                            <span className="material-symbols-outlined">play_circle</span>
                          </button>
                        </div>
                      )}
                      <div className="video-controls">
                        <button type="button" className="control-button" onClick={handlePlayPause}>
                          <span className="material-symbols-outlined">
                            {isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                        <div className="progress-bar" onClick={handleProgressClick}>
                          <div
                            className="progress"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="time-display">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="action-section">
            <button
              type="submit"
              className="create-deepfake-btn"
              disabled={isLoading || !selectedImageUrl || !selectedVideoUrl}
            >
              <span className="material-symbols-outlined">auto_fix_high</span>
              {isLoading ? 'Đang xử lý...' : 'Tạo video ghép mặt'}
            </button>
            <button
              type="button"
              onClick={() => {
                patch({
                  selectedImageUrl: null,
                  selectedVideoUrl: null,
                  sourceFile: null,
                  targetFile: null,
                  error: null
                });
              }}
              className="reset-btn"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reset
            </button>
            <p className="processing-note">Dự kiến mất khoảng 2-5 phút cho mỗi phút video</p>
          </div>
        </div>
      </form>

      {jobId && !resultVideo && (
        <div className="processing-status">
          <div className="status-icon">
            <span className="material-symbols-outlined spinning">progress_activity</span>
          </div>
          <h3>{processingProgress}</h3>
          <p className="status-note">
            Quá trình này có thể mất vài phút tùy thuộc vào độ dài của video
          </p>
        </div>
      )}

      {resultVideo && (
        <div className="result-section">
          <div className="result-header">
            <span className="material-symbols-outlined">check_circle</span>
            <h3>Video ghép mặt hoàn chỉnh</h3>
          </div>

          {isSavingVideo && (
            <div className="saving-message">
              <span className="material-symbols-outlined spinning">progress_activity</span>
              Đang lưu video vào thư viện...
            </div>
          )}

          {savedSuccess && !isSavingVideo && (
            <div className="success-message">
              <span className="material-symbols-outlined">check_circle</span>
              Đã lưu video vào thư viện của bạn!
            </div>
          )}

          <div className="result-video">
            <video src={resultVideo} controls />
          </div>

          <div className="result-actions">
            <button onClick={handleDownload} className="download-btn">
              <span className="material-symbols-outlined">download</span>
              Tải video xuống
            </button>
            <button
              onClick={() => {
                patch({ jobId: null, resultVideo: null, savedSuccess: false, sourceFile: null,
                  selectedImageUrl: null, targetFile: null, selectedVideoUrl: null
                });
              }}
              className="new-deepfake-btn"
            >
              <span className="material-symbols-outlined">add</span>
              Tạo video ghép mặt mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepfakeVideo;