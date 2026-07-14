import { API_CONFIG } from '../config/api';
const API_URL = API_CONFIG.BASE_URL;
export interface UploadedAudio {
  id: number;
  user_id: number;
  name: string;
  audio_url: string;
  reference_text: string;
  uploaded_at: string;
}

export const uploadReferenceAudio = async (
  file: File, 
  referenceText: string
): Promise<UploadedAudio> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('reference_text', referenceText);

  const response = await fetch(`${API_URL}/uploaded-audios/upload-reference-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload error:', errorText);
    throw new Error(`Failed to upload audio: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const getMyAudios = async (): Promise<UploadedAudio[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/uploaded-audios/my-audios`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fetch audios error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Failed to fetch audios: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Response is not JSON:', text);
    throw new Error('Server returned non-JSON response');
  }

  return response.json();
};

export const updateReferenceText = async (
  audioId: number, 
  referenceText: string
): Promise<UploadedAudio> => {
  const response = await fetch(`${API_URL}/uploaded-audios/audios/${audioId}/reference-text`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reference_text: referenceText })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update error:', errorText);
    throw new Error(`Failed to update reference text: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const deleteUploadedAudio = async (audioId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/uploaded-audios/audios/${audioId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete error:', errorText);
    throw new Error(`Failed to delete audio: ${response.status} ${response.statusText}`);
  }
};