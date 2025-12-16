import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function uploadDocument(file: File, recordType: string) {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('recordType', recordType);

  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

export async function verifyDocument(file: File, expectedHash: string) {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('expectedHash', expectedHash);

  const response = await axios.post(`${API_URL}/verify`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}
