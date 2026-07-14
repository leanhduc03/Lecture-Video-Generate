export const API_CONFIG = {
  // Base URLs - Đọc từ environment variables
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1',
  
  // Cloudinary - Đọc từ environment variables
  CLOUDINARY_CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
} as const;

// Helper để build URL
export const buildApiUrl = (path: string) => `${API_CONFIG.BASE_URL}${path}`;

export const buildCloudinaryUrl = (type: 'image' | 'video') => 
  `https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY_CLOUD_NAME}/${type}/upload`;