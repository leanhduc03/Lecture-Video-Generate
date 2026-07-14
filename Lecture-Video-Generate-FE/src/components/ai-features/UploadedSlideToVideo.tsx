import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  generateSpeech,
  processFakelip,
  combineSlideImageAndVideo,
  concatVideos,
  uploadVideoToCloudinary
} from '../../services/aiService';
import { saveVideo } from '../../services/videoService';
import {
  uploadPptxAndExtractSlidesImage,
  extractPptxText,
  saveSlideMetadata,
  uploadAudioFile,
  uploadVideoFile,
  SlideMetadata,
  SlideData,
  PresentationMetadata
} from '../../services/slideService';

import { getMyAudios, uploadReferenceAudio, deleteUploadedAudio, UploadedAudio } from '../../services/uploadedAudioService';
import { getMediaVideos, MediaVideo } from '../../services/mediaVideoService';
import '../../styles/uploaded-slide-to-video.scss';
import { useUploadedSlideToVideoStore } from '../../store/uploadedSlideToVideo.store';

const UploadedSlideToVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    metadata, slides, editMode, editedSlideData, savedSlideData,
    userUploadedPptx, isUploadingPptx,
    selectedVideoFile, selectedVideoUrl, videoSourceType,
    voiceMode, audioMode,
    referenceAudioFile, referenceAudioUrl, referenceText, tempReferenceText,
    gender, area, group, emotion,
    isProcessing, processingMessage, finalVideoUrl, error,
    setField, patch, resetAll, updateOriginalContent
  } = useUploadedSlideToVideoStore();
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  const [myAudios, setMyAudios] = useState<UploadedAudio[]>([]);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [showAudioWarning, setShowAudioWarning] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoOptions, setVideoOptions] = useState<MediaVideo[]>([]);
  const [deepfakeVideos, setDeepfakeVideos] = useState<MediaVideo[]>([]);
  const [loadingDeepfakeVideos, setLoadingDeepfakeVideos] = useState(false);

  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Load sample videos from API
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoadingVideos(true);
        setLoadingDeepfakeVideos(true);

        // Load sample videos
        const sampleResponse = await getMediaVideos('sample');
        setVideoOptions(sampleResponse.videos);

        // Load deepfake videos
        const deepfakeResponse = await getMediaVideos('deepfake');
        setDeepfakeVideos(deepfakeResponse.videos);

        // Set default
        if (sampleResponse.videos.length > 0) {
          setField("selectedVideoUrl", sampleResponse.videos[0].video_url);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
        setField("error", 'Không thể tải danh sách video');
      } finally {
        setLoadingVideos(false);
        setLoadingDeepfakeVideos(false);
      }
    };

    loadVideos();
    loadMyAudios();
  }, []);

  const loadMyAudios = async () => {
    try {
      const audios = await getMyAudios();
      setMyAudios(audios);
    } catch (err) {
      console.error('Error loading audios:', err);
    }
  };

  // Preset voice options
  const genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' }
  ];

  const areaOptions = [
    { value: 'northern', label: 'Miền Bắc' },
    { value: 'southern', label: 'Miền Nam' }
  ];

  const groupOptions = [
    { value: 'audiobook', label: 'Thuyết minh, đọc sách' },
    { value: 'interview', label: 'Phỏng vấn' }
  ];

  const emotionOptions = [
    { value: 'neutral', label: 'Trung tính' },
    { value: 'serious', label: 'Nghiêm túc' }
  ];

  const handleUserUploadPptx = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setField("userUploadedPptx", e.target.files[0]);
    }
  };

  const uploadPptx = async () => {
    if (!userUploadedPptx) {
      setField("error", 'Vui lòng chọn file PPTX');
      return;
    }

    setField("isUploadingPptx", true);
    setField("error", null);

    try {
      // 1. Extract images
      console.log('Extracting images...');
      const imageResult = await uploadPptxAndExtractSlidesImage(userUploadedPptx);
      console.log('Image result:', imageResult);

      // 2. Extract text content
      console.log('Extracting text...');
      const textResult = await extractPptxText(userUploadedPptx);
      console.log('Text result:', textResult);

      if (imageResult.success && imageResult.slides) {
        const uploadedSlides: SlideMetadata[] = imageResult.slides.map((img: any, idx: number) => {
          const slideText = textResult.slides_text?.find(s => s.slide_number === idx);

          return {
            slide_number: idx,
            type: idx === 0 ? 'title' : 'content',
            title: slideText?.title || `Slide ${idx + 1}`,
            filepath: img.image_url,
            filename: `slide_${idx}.png`
          };
        });

        console.log('Uploaded slides:', uploadedSlides);

        setField('slides', uploadedSlides);

        const defaultMetadata: PresentationMetadata = {
          title: userUploadedPptx.name.replace('.pptx', ''),
          total_slides: uploadedSlides.length,
          created_at: new Date().toISOString(),
          slides: uploadedSlides,
          slide_data: {
            title: userUploadedPptx.name.replace('.pptx', ''),
            slides: uploadedSlides.map((slide: SlideMetadata, idx: number) => {
              const slideText = textResult.slides_text?.find(s => s.slide_number === idx);
              const finalContent = slideText?.rewritten_content || slideText?.content || '';

              return {
                slide_number: idx,
                title: slide.title || `Slide ${idx + 1}`,
                content: [],
                original_content: finalContent
              };
            })
          }
        };

        console.log('Metadata with content:', defaultMetadata);

        setField('metadata', defaultMetadata);

        // Truyền metadata vào editMode
        enterEditModeWithMetadata(uploadedSlides, defaultMetadata);

        setField('error', null);
      } else {
        throw new Error('Không thể tách slides thành images');
      }
    } catch (err: any) {
      console.error('Upload PPTX error', err);
      setField('error', err?.message || 'Lỗi khi upload PPTX')
    } finally {
      setField('isUploadingPptx', false);
    }
  };

  //Nhận metadata làm parameter
  const enterEditModeWithMetadata = (uploadedSlides: SlideMetadata[], metadataToUse: PresentationMetadata) => {
    const editData: SlideData[] = uploadedSlides.map((slide, idx) => {
      const slideData = metadataToUse.slide_data.slides[idx];

      console.log(`Slide ${idx} content:`, slideData?.original_content);

      return {
        slide_number: idx,
        title: slide.title || `Slide ${idx + 1}`,
        content: slideData?.content || [],
        original_content: slideData?.original_content || ''
      };
    });

    console.log('Final edit data:', editData);

    setField('editedSlideData', editData);
    setField('savedSlideData', [...editData]);
    setField('editMode', true);
  };

  //Function cho nút "Nhập script thuyết trình"
  const enterEditMode = (uploadedSlides: SlideMetadata[]) => {
    if (metadata) {
      enterEditModeWithMetadata(uploadedSlides, metadata);
    }
  };

  const handleSaveMetadata = async () => {
    if (!metadata || !editedSlideData.length) {
      setField("error", "Không có dữ liệu để lưu!");
      return;
    }

    setIsSavingMetadata(true);
    setField("error", null);

    try {
      const updatedMetadata = {
        ...metadata.slide_data,
        slides: editedSlideData
      };

      const result = await saveSlideMetadata(updatedMetadata);

      if (result.success) {
        setField("metadata", metadata ? { ...metadata, slide_data: updatedMetadata } : null);
        setField("savedSlideData", [...editedSlideData]);
        setField("editMode", false);
        setField("error", null);
      } else {
        throw new Error(result.message || 'Lỗi khi lưu metadata');
      }
    } catch (err: any) {
      console.error('Save metadata error', err);
      setField('error', err?.message || 'Lỗi khi lưu metadata');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleCancelEdit = () => {
    setField("editedSlideData", [...savedSlideData]);
    setField("editMode", false);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setField("selectedVideoFile", e.target.files[0]);
      setField("selectedVideoUrl", '');
    }
  };

  const handleVideoPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setField('selectedVideoUrl', e.target.value);
    setField("selectedVideoFile", null);
  };

  const handleReferenceAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setField('error', 'Vui lòng chọn file audio!');
      e.target.value = ''; // Reset input
      return;
    }

    // Kiểm tra phải có reference text
    if (!tempReferenceText.trim()) {
      setField('error', 'Vui lòng nhập Reference Text trước khi upload audio');
      e.target.value = ''; // Reset input
      return;
    }

    // Kiểm tra độ dài audio
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(objectUrl);
          if (audio.duration > 15) {
            setAudioDuration(Math.round(audio.duration));
            setShowAudioWarning(true);
            e.target.value = '';
            reject(new Error('Audio too long'));
          } else {
            resolve();
          }
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          setField('error', "Không thể đọc tệp tin âm thanh");
          e.target.value = '';
          reject(new Error('Cannot read audio'));
        };
      });
    } catch (err) {
      // Dừng lại nếu audio không hợp lệ
      return;
    }

    setField('referenceAudioFile', file);

    // Upload ngay lập tức
    setIsUploadingAudio(true);
    setField('error', null);
    try {
      const uploadedAudio = await uploadReferenceAudio(file, tempReferenceText);
      setField('referenceAudioUrl', uploadedAudio.audio_url);
      setField('referenceText', uploadedAudio.reference_text);
      await loadMyAudios();
      setField('tempReferenceText', '');
      e.target.value = ''; // Reset input để có thể chọn file khác
    } catch (err) {
      setField('error', "Không thể tải lên âm thanh. Vui lòng thử lại!");
      console.error('Upload error:', err);
      e.target.value = ''; // Reset input
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSelectExistingAudio = (audio: UploadedAudio) => {
    setField('referenceAudioUrl', audio.audio_url);
    setField('referenceText', audio.reference_text);
  };

  const handleDeleteAudio = async (audioId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa âm thanh này?')) return;

    try {
      await deleteUploadedAudio(audioId);
      await loadMyAudios();
      if (myAudios.find(aud => aud.id === audioId)?.audio_url === referenceAudioUrl) {
        setField('referenceAudioUrl', '');
        setField('referenceText', '');
      }
    } catch (err) {
      setField('error', 'Không thể xóa âm thanh. Vui lòng thử lại!');
      console.error('Delete error:', err);
    }
  };

  const uploadReferenceAudioIfNeeded = async (): Promise<string> => {
    // Nếu đã có URL (từ upload trước hoặc chọn từ thư viện) thì return luôn
    if (referenceAudioUrl) {
      return referenceAudioUrl;
    }

    // Nếu có file mới chưa upload thì upload
    if (referenceAudioFile) {
      const result = await uploadAudioFile(referenceAudioFile);
      if (result.success && result.audio_url) {
        return result.audio_url;
      } else {
        throw new Error('Không thể tải lên audio');
      }
    }

    throw new Error('Không có audio để sử dụng');
  };

  useEffect(() => {
    const loadSampleVideos = async () => {
      try {
        setLoadingVideos(true);
        const response = await getMediaVideos('sample'); // Chỉ lấy video sample
        setVideoOptions(response.videos);
        if (response.videos.length > 0) {
          setField('selectedVideoUrl', response.videos[0].video_url);
        }
      } catch (error) {
        console.error('Error loading sample videos:', error);
        setField('error', 'Không thể tải danh sách video mẫu');
      } finally {
        setLoadingVideos(false);
      }
    };

    loadSampleVideos();
  }, []);

  const uploadSelectedVideo = async () => {
    let videoUrl = selectedVideoUrl;

    if (selectedVideoFile) {
      const result = await uploadVideoFile(selectedVideoFile);
      if (result.success && result.video_url) {
        videoUrl = result.video_url;
      } else {
        throw new Error('Không thể upload video');
      }
    }

    return videoUrl;
  };

  const processAllSlidesAndCreateVideo = async () => {
    setField('finalVideoUrl', null);
    if (!metadata || slides.length === 0) {
      setField('error', "Chưa có silde để xử lý.");
      return;
    }

    if (!selectedVideoUrl && !selectedVideoFile) {
      setField('error', "Vui lòng chọn video mẫu hoặc tải lên video");
      return;
    }

    if (voiceMode === 'clone' && !referenceAudioUrl) {
      setField("error", "Vui lòng chọn hoặc tải lên tệp tin âm thanh!");
      return;
    }

    if (voiceMode === 'clone' && !referenceText.trim()) {
      setField("error", "Vui lòng nhập văn bản cho âm thanh đã chọn");
      return;
    }

    setField('error', null);
    setField('isProcessing', true);

    const composedSlideUrls: string[] = [];
    const slideDataList = metadata.slide_data.slides;

    try {
      setField('processingMessage', "Đang tải lên tệp tin...");
      const videoUrl = await uploadSelectedVideo();

      // Upload reference audio if in clone mode
      let refAudioUrl = '';
      if (voiceMode === 'clone') {
        refAudioUrl = await uploadReferenceAudioIfNeeded();
      }

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideData = slideDataList.find(sd => sd.slide_number === slide.slide_number);

        setField("processingMessage", `Đang xử lý slide ${i + 1}...`);

        const narrationText = slideData?.original_content || '';

        if (!narrationText) {
          console.warn(`Slide ${slide.slide_number} không có script, bỏ qua`);
          continue;
        }

        // TTS with new VietVoice API
        let ttsPayload: any = { text: narrationText };

        if (voiceMode === 'clone') {
          ttsPayload.reference_audio_url = refAudioUrl;
          ttsPayload.reference_text = referenceText;
        } else {
          ttsPayload.gender = gender;
          ttsPayload.area = area;
          ttsPayload.group = group;
          ttsPayload.emotion = emotion;
        }

        const ttsResp = await generateSpeech(narrationText, ttsPayload);
        if (!ttsResp || !ttsResp.audio_file_url) {
          throw new Error(`Không tạo được audio cho slide ${slide.slide_number}`);
        }
        const audioUrl = ttsResp.audio_file_url;

        // Fakelip
        const fakelipResp = await processFakelip(audioUrl, videoUrl);
        if (!fakelipResp || !fakelipResp.result_url) {
          throw new Error(`Fakelip thất bại cho slide ${slide.slide_number}`);
        }
        if (i < slides.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        const lipVideoUrl = fakelipResp.result_url;

        // Combine
        const slideImageUrl = slide.filepath.replace(/\\/g, '/');
        const combineResp = await combineSlideImageAndVideo(slideImageUrl, lipVideoUrl);
        if (!combineResp || !combineResp.result_url) {
          throw new Error(`Không ghép được slide ${slide.slide_number} và video`);
        }
        composedSlideUrls.push(combineResp.result_url);
      }

      // Concat
      setField('processingMessage', 'Đang ghép các đoạn slide lại thành video hoàn chỉnh...');
      const finalResp = await concatVideos(composedSlideUrls);
      if (finalResp && finalResp.result_url) {
        setField("processingMessage", "Đang tải video lên hệ thống...");
        const cloudinaryUrl = await uploadVideoToCloudinary(finalResp.result_url);
        setField("finalVideoUrl", cloudinaryUrl);
        try {
          if (!user?.username || !user?.id) {
            throw new Error('Không xác định được user');
          }
          await saveVideo(cloudinaryUrl, user.username);
          setField('processingMessage', 'Hoàn tất. Video đã được lưu vào hệ thống.');
        } catch (saveError) {
          console.error('Lỗi khi lưu video:', saveError);
          setField('processingMessage', 'Video đã hoàn thành nhưng không lưu được vào hệ thống.');
        }
      } else {
        throw new Error('Không tạo được video cuối cùng');
      }
    } catch (err: any) {
      console.error('processAllSlidesAndCreateVideo error', err);
      setField('error', err?.message || 'Lỗi khi xử lý các slide')
    } finally {
      setField('isProcessing', false);
    }
  };

  const handleReset = () => { resetAll() };

  const handleDownload = async () => {
    if (!finalVideoUrl) return;

    try {
      setField('error', null);
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'download-loading';
      loadingMessage.textContent = 'Đang chuẩn bị tải xuống...';
      document.querySelector('.result-section')?.appendChild(loadingMessage);

      const response = await fetch(finalVideoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      const fileName = finalVideoUrl.split('/').pop() || 'final-video.mp4';
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

  const handleVideoSourceTypeChange = (type: 'sample' | 'deepfake' | 'custom') => {
    setField('videoSourceType', type);
    setField('selectedVideoFile', null);

    if (type === 'sample' && videoOptions.length > 0) {
      setField('selectedVideoUrl', videoOptions[0].video_url);
    } else if (type === 'deepfake' && deepfakeVideos.length > 0) {
      setField('selectedVideoUrl', deepfakeVideos[0].video_url);
    } else if (type === 'custom') {
      setField('selectedVideoUrl', '');
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
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedVideoUrl, selectedVideoFile]);

  // EDIT MODE - Refactored with className
  if (editMode && editedSlideData.length > 0) {
    return (
      <div className="uploaded-slide-to-video">
        <div className="page-header">
          <h1>Nhập nội dung thuyết trình cho từng slide</h1>
        </div>

        {error && (
          <div className="error-message">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div className="edit-slides-container">
          {editedSlideData.map((slideData, index) => (
            <div key={index} className="slide-edit-card">
              <div className="slide-content">
                {slides[index] && (
                  <div className="slide-image-wrapper">
                    <img
                      src={slides[index].filepath}
                      alt={`Slide ${index + 1}`}
                    />
                    <div className="slide-number">Slide {index + 1}</div>
                  </div>
                )}

                <div className="script-editor">
                  <label>Nội dung thuyết trình cho slide này:</label>
                  <textarea
                    value={slideData.original_content}
                    onChange={(e) => updateOriginalContent(index, e.target.value)}
                    placeholder="Nhập nội dung bạn muốn thuyết trình cho slide này ..."
                    rows={8}
                  />
                  <div className="char-count">
                    {slideData.original_content.length}/1000 ký tự
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="edit-actions">
            <button onClick={handleCancelEdit} className="cancel-btn">
              Hủy
            </button>
            <button
              onClick={handleSaveMetadata}
              disabled={isSavingMetadata}
              className="save-btn"
            >
              {isSavingMetadata ? 'Đang lưu...' : 'Lưu và tiếp tục'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW - Refactored with className
  return (
    <div className="uploaded-slide-to-video">
      {error && (
        <div className="error-message">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Audio Warning Modal */}
      {showAudioWarning && (
        <div className="audio-warning-modal">
          <div className="modal-content">
            <div className="warning-icon">⚠️</div>
            <h3>File audio quá dài</h3>
            <p>File audio phải có độ dài dưới <strong>15 giây</strong></p>
            <p className="duration-text">
              File của bạn có độ dài: <strong>{audioDuration} giây</strong>
            </p>
            <button
              onClick={() => {
                setShowAudioWarning(false);
                setField('error', null);
              }}
              className="close-btn"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!metadata && (
        <div className="upload-section">
          <div className="gradient-border"></div>
          <div className="upload-dropzone">
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleUserUploadPptx}
            />

            {!userUploadedPptx ? (
              // Hiển thị UI upload khi chưa chọn file
              <div className="upload-content">
                <div className="upload-icon-wrapper">
                  <div className="ping-effect"></div>
                  <div className="icon-circle">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                </div>

                <div className="upload-text">
                  <h3>Tải lên Slide PowerPoint</h3>
                  <p>
                    Kéo thả hoặc nhấp để chọn file{' '}
                    <span className="file-format-badge">PPTX</span>
                  </p>
                </div>

                <button className="upload-button">
                  <span className="material-symbols-outlined">folder_open</span>
                  Chọn file từ máy tính
                </button>

                <div className="upload-info">
                  {/* <div className="info-item">
                    <span className="material-symbols-outlined">hard_drive</span>
                    Max 50MB
                  </div>
                  <div className="divider"></div> */}
                  <div className="info-item">
                    <span className="material-symbols-outlined">lock</span>
                    Bảo mật
                  </div>
                </div>
              </div>
            ) : (
              // Hiển thị file đã chọn trong ô lớn
              <div className="file-selected-large">
                <div className="file-icon">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="file-details">
                  <h3>{userUploadedPptx.name}</h3>
                  <p className="file-size">
                    {(userUploadedPptx.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div className="file-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setField("userUploadedPptx", null);
                      }}
                      className="remove-file-btn"
                    >
                      Chọn file khác
                    </button>
                  </div>
                </div>
                <div className="success-badge">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
              </div>
            )}
          </div>

          {userUploadedPptx && (
            <button
              onClick={uploadPptx}
              disabled={isUploadingPptx}
              className="upload-action-btn"
            >
              {isUploadingPptx ? 'Đang xử lý...' : 'Tải lên và tiếp tục'}
            </button>
          )}
        </div>
      )}

      {/* Configuration Section */}
      {metadata && !editMode && (
        <div className={`config-sections ${metadata ? 'active' : ''}`}>
          {/* Success Info */}
          <div className="success-info">
            <div className="info-header">
              <span className="material-symbols-outlined">check_circle</span>
              <strong>Đã upload thành công</strong>
            </div>
            <div className="info-details">
              <div>Tên file: {metadata.title}</div>
              <div>Tổng số slides: {metadata.total_slides}</div>
            </div>
            <button onClick={() => enterEditMode(slides)} className="edit-script-btn">
              <span className="material-symbols-outlined">edit</span>
              Nhập nội dung thuyết trình
            </button>
          </div>

          {/* Video Selection */}
          <div className="section-card">
            <div className="section-header">
              <span className="icon-wrapper">
                <span className="material-symbols-outlined">person_play</span>
              </span>
              <h2>Chọn Video Giảng Viên</h2>
            </div>

            <div className="section-content">
              <div className="video-options">
                <div className="options-list">
                  {/* Sample Video Option */}
                  <div className="video-option">
                    <div className="option-header">
                      <input
                        type="radio"
                        name="videoChoice"
                        id="video-sample"
                        checked={videoSourceType === 'sample'}
                        onChange={() => handleVideoSourceTypeChange('sample')}
                      />
                      <div className="option-content">
                        <label htmlFor="video-sample">Sử dụng video giảng viên mẫu</label>
                        <p>Chọn từ thư viện giảng viên có sẵn của chúng tôi</p>
                        <select
                          value={selectedVideoUrl}
                          onChange={handleVideoPresetChange}
                          disabled={videoSourceType !== 'sample' || loadingVideos}
                        >
                          {loadingVideos ? (
                            <option>Đang tải...</option>
                          ) : videoOptions.length === 0 ? (
                            <option>Không có video mẫu</option>
                          ) : (
                            videoOptions.map(option => (
                              <option key={option.id} value={option.video_url}>
                                {option.name}
                              </option>
                            )))
                          }
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Deepfake Video Option */}
                  <div className="video-option">
                    <div className="option-header">
                      <input
                        type="radio"
                        name="videoChoice"
                        id="video-deepfake"
                        checked={videoSourceType === 'deepfake'}
                        onChange={() => handleVideoSourceTypeChange('deepfake')}
                      />
                      <div className="option-content">
                        <label htmlFor="video-deepfake">Sử dụng video ghép mặt đã tạo</label>
                        <select
                          value={selectedVideoUrl}
                          onChange={(e) => setField('selectedVideoUrl', e.target.value)}
                          disabled={videoSourceType !== 'deepfake' || loadingDeepfakeVideos}
                        >
                          {loadingDeepfakeVideos ? (
                            <option>Đang tải...</option>
                          ) : deepfakeVideos.length === 0 ? (
                            <option>Chưa có video ghép mặt</option>
                          ) : (
                            deepfakeVideos.map(option => (
                              <option key={option.id} value={option.video_url}>
                                {option.name || `Video ${option.id}`}
                              </option>
                            ))
                          )}
                        </select>

                        {/* Chỉ hiện nút "Tạo video mới" khi đã có video */}
                        {videoSourceType === 'deepfake' && deepfakeVideos.length > 0 && (
                          <button
                            onClick={() => navigate('/create-content', { state: { activeTab: 'deepfake' } })}
                            className="create-deepfake-btn"
                          >
                            <span>Tạo video ghép mặt mới</span>
                          </button>
                        )}

                        {/* Hiện notice khi chưa có video */}
                        {videoSourceType === 'deepfake' && deepfakeVideos.length === 0 && (
                          <div className="no-video-notice">
                            <p> Bạn chưa có video ghép mặt nào. Tạo video ghép mặt mới ngay!</p>
                            <button
                              onClick={() => navigate('/create-content', { state: { activeTab: 'deepfake' } })}
                              className="create-deepfake-btn"
                            >
                              <span className="material-symbols-outlined">face_retouching_natural</span>
                              <span>Tạo video ghép mặt ngay</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Upload Option */}
                  <div className="video-option">
                    <div className="option-header">
                      <input
                        type="radio"
                        name="videoChoice"
                        id="video-custom"
                        checked={videoSourceType === 'custom'}
                        onChange={() => handleVideoSourceTypeChange('custom')}
                      />
                      <div className="option-content">
                        <label htmlFor="video-custom">Upload video tùy chỉnh</label>
                        <div className="file-input-wrapper">
                          <label className="file-button" htmlFor="custom-video-input">
                            Chọn tệp
                          </label>
                          <input
                            type="text"
                            className="file-name"
                            value={selectedVideoFile?.name || 'Không có tệp nào được chọn'}
                            readOnly
                            disabled
                          />
                          <input
                            id="custom-video-input"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            disabled={videoSourceType !== 'custom'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Preview */}
                {(selectedVideoUrl || selectedVideoFile) && (
                  <div className="video-preview-panel">
                    <label>Preview:</label>
                    <div className="preview-wrapper">
                      <video
                        ref={videoRef}
                        src={selectedVideoUrl || (selectedVideoFile ? URL.createObjectURL(selectedVideoFile) : '')}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />

                      {!isPlaying && (
                        <div className="play-overlay" onClick={handlePlayPause}>
                          <button>
                            <span className="material-symbols-outlined">play_circle</span>
                          </button>
                        </div>
                      )}

                      <div className="video-controls">
                        <button className="control-button" onClick={handlePlayPause}>
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
          </div>

          {/* Voice Configuration */}
          <div className="section-card">
            <div className="section-header">
              <span className="icon-wrapper">
                <span className="material-symbols-outlined">record_voice_over</span>
              </span>
              <h2>Cấu hình Giọng Nói</h2>
            </div>

            <div className="section-content">
              <div className="voice-mode-selector">
                <div className="mode-option">
                  <input
                    type="radio"
                    name="voiceMode"
                    id="voice-preset"
                    value="preset"
                    checked={voiceMode === 'preset'}
                    onChange={(e) => setField('voiceMode', e.target.value as 'preset' | 'clone')}
                  />
                  <label htmlFor="voice-preset">Sử dụng giọng có sẵn</label>
                </div>
                <div className="mode-option">
                  <input
                    type="radio"
                    name="voiceMode"
                    id="voice-clone"
                    value="clone"
                    checked={voiceMode === 'clone'}
                    onChange={(e) => setField('voiceMode', e.target.value as 'preset' | 'clone')}
                  />
                  <label htmlFor="voice-clone">Giọng nói tải lên</label>
                </div>
              </div>

              {voiceMode === 'preset' && (
                <div className="voice-config-panel">
                  <h3>Cấu hình giọng nói:</h3>
                  <div className="voice-grid">
                    <div className="voice-field">
                      <label>Giới tính:</label>
                      <select value={gender} onChange={(e) => setField('gender', e.target.value)}>
                        {genderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="voice-field">
                      <label>Vùng miền:</label>
                      <select value={area} onChange={(e) => setField('area', e.target.value)}>
                        {areaOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="voice-field">
                      <label>Nhóm giọng:</label>
                      <select value={group} onChange={(e) => setField('group', e.target.value)}>
                        {groupOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="voice-field">
                      <label>Cảm xúc:</label>
                      <select value={emotion} onChange={(e) => setField('emotion', e.target.value)}>
                        {emotionOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {voiceMode === 'clone' && (
                <div className="voice-config-panel voice-clone-panel">
                  <h3>Giả lập giọng từ file mẫu:</h3>

                  {/* Audio Mode Tabs */}
                  <div className="audio-mode-tabs">
                    <button
                      className={audioMode === 'upload' ? 'active' : ''}
                      onClick={() => setField('audioMode', 'upload')}
                    >
                      <span className="material-symbols-outlined">upload_file</span>
                      Tải lên audio mới
                    </button>
                    <button
                      className={audioMode === 'existing' ? 'active' : ''}
                      onClick={() => setField('audioMode', 'existing')}
                    >
                      <span className="material-symbols-outlined">library_music</span>
                      Chọn từ Thư viện ({myAudios.length})
                    </button>
                  </div>

                  {/* Upload New Audio */}
                  {audioMode === 'upload' && (
                    <div className="audio-upload-section">
                      <div className="reference-text-input">
                        <label htmlFor="reference-text">
                          <span className="material-symbols-outlined">text_fields</span>
                          Nội dung của audio mẫu:
                          <span className="required">*</span>
                        </label>
                        <textarea
                          id="reference-text"
                          value={tempReferenceText}
                          onChange={(e) => setField('tempReferenceText', e.target.value)}
                          placeholder="Nhập chính xác nội dung mà người nói đọc trong file audio ..."
                          rows={8}
                        />
                        <div className="char-count">
                          {tempReferenceText.length}/1000 ký tự
                        </div>
                        <div className="info-text">
                          <span className="material-symbols-outlined">info</span>
                          Lưu ý: Đoạn văn trên phải khớp với nội dung trong audio để có kết quả tốt nhất
                        </div>
                      </div>

                      <div className="audio-file-input">
                        <label htmlFor="audio-upload">
                          <span className="material-symbols-outlined">audiotrack</span>
                          Chọn file audio mẫu:
                          <span className="required">*</span>
                        </label>
                        <div className="file-input-wrapper">
                          <input
                            id="audio-upload"
                            type="file"
                            accept="audio/*"
                            onChange={handleReferenceAudioFileChange}
                            disabled={isUploadingAudio || !tempReferenceText.trim()}
                          />
                        </div>
                        {isUploadingAudio && (
                          <div className="upload-progress">
                            <span className="material-symbols-outlined spinning">progress_activity</span>
                            Đang tải lên và xử lý audio...
                          </div>
                        )}
                      </div>

                      {referenceAudioUrl && referenceText && (
                        <div className="audio-success-info">
                          <span className="material-symbols-outlined">check_circle</span>
                          <div className="success-details">
                            <strong>Audio đã sẵn sàng!</strong>
                            <p>Nội dung audio: "{referenceText}"</p>
                            <audio src={referenceAudioUrl} controls />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Select Existing Audio */}
                  {audioMode === 'existing' && (
                    <div className="audio-library-section">
                      {myAudios.length === 0 ? (
                        <div className="empty-library">
                          <span className="material-symbols-outlined">music_off</span>
                          <p>Bạn chưa có audio nào trong thư viện</p>
                          <button
                            onClick={() => setField('audioMode', 'upload')}
                            className="switch-mode-btn"
                          >
                            <span className="material-symbols-outlined">upload</span>
                            Tải lên audio đầu tiên
                          </button>
                        </div>
                      ) : (
                        <div className="audio-grid">
                          {myAudios.map((audio) => (
                            <div
                              key={audio.id}
                              className={`audio-card ${referenceAudioUrl === audio.audio_url ? 'selected' : ''}`}
                            >
                              <div className="audio-card-header">
                                <span className="material-symbols-outlined">audiotrack</span>
                                <span className="audio-id">Audio #{audio.id}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAudio(audio.id);
                                  }}
                                  className="delete-audio-btn"
                                  title="Xóa audio"
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </div>

                              <div className="audio-card-content">
                                <div className="reference-text-display">
                                  <label>Reference Text:</label>
                                  <p>"{audio.reference_text}"</p>
                                </div>

                                <audio src={audio.audio_url} controls />

                                <button
                                  onClick={() => handleSelectExistingAudio(audio)}
                                  className={`select-audio-btn ${referenceAudioUrl === audio.audio_url ? 'selected' : ''
                                    }`}
                                >
                                  {referenceAudioUrl === audio.audio_url ? (
                                    <>
                                      <span className="material-symbols-outlined">check_circle</span>
                                      Đã chọn
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined">radio_button_unchecked</span>
                                      Chọn audio này
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Audio Info */}
                  {referenceAudioUrl && referenceText && (
                    <div className="selected-audio-summary">
                      <div className="summary-header">
                        <span className="material-symbols-outlined">speaker</span>
                        <strong>Giọng đã chọn sẽ được sử dụng</strong>
                      </div>
                      <div className="summary-content">
                        <p className="reference-text-summary">
                          <span className="label">Nội dung audio:</span>
                          "{referenceText}"
                        </p>
                        <button
                          onClick={() => {
                            setField('referenceAudioUrl', '');
                            setField('referenceText', '');
                          }}
                          className="clear-selection-btn"
                        >
                          <span className="material-symbols-outlined">close</span>
                          Hủy chọn
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={processAllSlidesAndCreateVideo}
              disabled={isProcessing || (!selectedVideoUrl && !selectedVideoFile)}
              className="create-video-btn"
            >
              <span className="material-symbols-outlined">movie</span>
              {isProcessing ? 'Đang xử lý...' : 'Tạo Video Thuyết Trình'}
            </button>
            <button onClick={handleReset} className="reset-btn">
              <span className="material-symbols-outlined">refresh</span>
              Reset
            </button>
          </div>

          {processingMessage && (
            <div className="processing-message">
              <span className="material-symbols-outlined">hourglass_empty</span>
              {processingMessage}
            </div>
          )}
        </div>
      )}

      {/* Final Result */}
      {finalVideoUrl && !isProcessing && (
        <div className="result-section">
          <h3>
            <span className="material-symbols-outlined">check_circle</span>
            Video thuyết trình hoàn chỉnh
          </h3>
          <video src={finalVideoUrl} controls />
          <button onClick={handleDownload} className="download-btn">
            <span className="material-symbols-outlined">download</span>
            Tải video xuống
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadedSlideToVideo;