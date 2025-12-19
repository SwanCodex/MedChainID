import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function uploadDocument(file: File, recordType: string) {
  try {
    console.log('📤 API: Uploading document to:', API_URL);
    console.log('   File:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    console.log('   Record Type:', recordType);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('recordType', recordType);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ API: Upload successful:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Upload failed');
    }

    // Backend returns: { success, docHash, ipfsCid, riskAnalysis, metadata }
    return {
      documentHash: response.data.docHash,
      ipfsCID: response.data.ipfsCid,
      riskAnalysis: response.data.riskAnalysis,
      metadata: response.data.metadata
    };
  } catch (error: any) {
    console.error('❌ API: Upload failed:', error);
    
    if (error.response?.status === 413) {
      throw new Error('File too large. Maximum size is 10MB');
    }
    if (error.response?.data?.error) {
      throw new Error('Backend error: ' + error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error('Backend error: ' + error.response.data.message);
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Cannot connect to backend at ' + API_URL + '. Is it running?');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. File might be too large or ML service is slow');
    }
    throw new Error(error.message || 'Upload failed. Check console for details');
  }
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

  return response.data;
}
