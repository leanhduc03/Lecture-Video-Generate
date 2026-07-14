import axios from 'axios';
import { API_CONFIG, buildApiUrl } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const saveVideo = async (videoUrl: string, username: string): Promise<void> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id; // Lấy user_id từ localStorage

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(buildApiUrl('/videos'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ 
        video_url: videoUrl, 
        username: username,
        user_id: userId  // Thêm user_id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save video');
    }
  } catch (error) {
    console.error('Error saving video:', error);
    throw error;
  }
};

export const getMyVideos = async () => {
  const response = await axios.get(`${API_URL}/videos/my-videos`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getAllVideos = async () => {
  const response = await axios.get(`${API_URL}/videos/all`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const deleteVideo = async (videoId: number) => {
  await axios.delete(`${API_URL}/videos/${videoId}`, {
    headers: getAuthHeaders()
  });
};
