import { API_CONFIG } from '../config/api';
import axios from 'axios';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface SlideMetadata {
  slide_number: number;
  type: string;
  title?: string;
  filepath: string;
  filename: string;
}

export interface SlideData {
  slide_number: number;
  title: string;
  content: string[];
  original_content: string;
}

export interface PresentationMetadata {
  title: string;
  total_slides: number;
  created_at: string;
  slides: SlideMetadata[];
  slide_data: {
    title: string;
    slides: SlideData[];
  };
}

/**
 * Generate slides from content
 */
export const generateSlidesFromContent = async (
  content: string,
  numSlides?: number
): Promise<{ success: boolean; data?: any; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/slides/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      num_slides: numSlides || null
    })
  });

  if (!response.ok) {
    throw new Error('Không thể tạo slides');
  }

  const result = await response.json();
  return result;
};

/**
 * Download PPTX file
 */
export const downloadPptxFile = async (filename: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/slides/download/${filename}`);

  if (!response.ok) {
    throw new Error(`Không thể tải file PPTX: ${response.status}`);
  }

  return await response.blob();
};

/**
 * Upload PPTX and extract slides
 */
export const uploadPptxAndExtractSlides = async (
  file: File
): Promise<{ success: boolean; slides?: any[] }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/media/upload-pptx`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Không thể tách slides thành images');
  }

  const result = await response.json();
  return result;
};

export const uploadPptxAndExtractSlidesImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/media/upload-pptx2`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('uploadPptxAndExtractSlidesImage error:', error);
    throw error;
  }
};

/**
 * Fetch slide metadata
 */
export const fetchSlideMetadata = async (
  jsonFilename: string
): Promise<{ success: boolean; data?: any }> => {
  const response = await fetch(`${API_BASE_URL}/slides/metadata/${jsonFilename}`);

  if (!response.ok) {
    throw new Error('Không thể lấy metadata');
  }

  const result = await response.json();
  return result;
};

/**
 * Get list of presentations
 */
export const getPresentationsList = async (): Promise<{
  success: boolean;
  data?: { presentations: any[] };
}> => {
  const response = await fetch(`${API_BASE_URL}/slides/list`);
  const result = await response.json();
  return result;
};

/**
 * Save slide metadata
 */
export const saveSlideMetadata = async (
  metadata: { title: string; slides: SlideData[] }
): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/slides/save-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw new Error('Không thể lưu metadata');
  }

  const result = await response.json();
  return result;
};

/**
 * Upload audio file
 */
export const uploadAudioFile = async (file: File): Promise<{ success: boolean; audio_url?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/upload-audio`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

/**
 * Upload video file
 */
export const uploadVideoFile = async (file: File): Promise<{ success: boolean; video_url?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/upload-video`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

/**
 * Helper to get basename from filepath
 */
export const getBasename = (filepath: string): string => {
  return filepath.split(/[/\\]/).pop() || filepath;
};

/**
 * Combine slide metadata with images
 */
export const combineMetadataWithImages = (
  metadataResult: any,
  slideImages: any[]
): PresentationMetadata => {
  return {
    ...metadataResult,
    slides: slideImages.map((img, idx) => ({
      slide_number: idx,
      type: idx === 0 ? 'title' : 'content',
      title: `Slide ${idx + 1}`,
      filepath: img.image_url,
      filename: `slide_${idx}.png`
    }))
  };
};

export const extractPptxText = async (file: File): Promise<{
  success: boolean;
  slides_text?: Array<{
    slide_number: number;
    title: string;
    content: string;
    rewritten_content?: string;
    all_text: string[];
  }>;
  total_slides?: number;
  message?: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE_URL}/media/extract-pptx-text`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error extracting PPTX text:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Lỗi khi extract text từ PPTX'
    };
  }
};