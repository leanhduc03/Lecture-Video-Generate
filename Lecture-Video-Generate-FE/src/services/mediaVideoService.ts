import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_URL = `${API_CONFIG.BASE_URL}/media-videos`;

export interface MediaVideo {
  id: number;
  user_id: number;
  name: string;
  video_url: string;
  video_type: string; //   Thêm dòng này nếu chưa có
  created_at: string;
  updated_at?: string;
}

export interface MediaVideoListResponse {
  videos: MediaVideo[];
  total: number;
}

export interface MediaVideoCreate {
  name: string;
  video_url: string;
  video_type: string; //   Thêm dòng này nếu chưa có
}

export interface MediaVideoUpdate {
  name?: string;
  video_url?: string;
  video_type?: string; //   Thêm dòng này nếu chưa có
}

export interface UploadVideoResponse {
  success: boolean;
  video_url: string;
  public_id?: string;
  duration?: number;
  format?: string;
}

/**
 * Upload video file lên Cloudinary
 */
export const uploadMediaVideoFile = async (file: File): Promise<UploadVideoResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/upload-video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });
  
  return response.data;
};

/**
 * Lấy danh sách media videos
 * @param videoType - 'sample' hoặc undefined (lấy tất cả)
 */
export const getMediaVideos = async (videoType?: string): Promise<MediaVideoListResponse> => {
  const params = videoType ? { video_type: videoType } : {};
  const response = await axios.get(API_URL, {
    params,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Lấy thông tin chi tiết media video
 */
export const getMediaVideoById = async (videoId: number): Promise<MediaVideo> => {
  const response = await axios.get(`${API_URL}/${videoId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Tạo media video mới
 */
export const createMediaVideo = async (data: MediaVideoCreate): Promise<MediaVideo> => {
  const response = await axios.post(API_URL, data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Cập nhật media video
 */
export const updateMediaVideo = async (videoId: number, data: MediaVideoUpdate): Promise<MediaVideo> => {
  const response = await axios.put(`${API_URL}/${videoId}`, data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Xóa media video
 */
export const deleteMediaVideo = async (videoId: number): Promise<void> => {
  await axios.delete(`${API_URL}/${videoId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
};

/**
 * Lưu video deepfake vào database
 */
export const saveDeepfakeVideo = async (videoUrl: string): Promise<MediaVideo> => {
  const response = await axios.post(
    `${API_URL}/save-deepfake`,
    { video_url: videoUrl },
    {
      params: { video_url: videoUrl },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return response.data;
};