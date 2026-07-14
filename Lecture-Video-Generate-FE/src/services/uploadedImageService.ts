import axios from 'axios';
import { API_CONFIG, buildCloudinaryUrl } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export interface UploadedImage {
  id: number;
  user_id: number;
  name: string;
  image_url: string;
  uploaded_at: string;
}

export const uploadSourceImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/uploaded-images/upload-source-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
};

export const getMyImages = async (): Promise<UploadedImage[]> => {
  const response = await fetch(`${API_URL}/uploaded-images/my-images`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }

  return response.json();
};

export const deleteUploadedImage = async (imageId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/uploaded-images/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete image');
  }
};
