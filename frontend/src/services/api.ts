import axios from 'axios';
import { SplitRequest, ParsedData, PersonSplitResult } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const apiService = {
  async uploadAndParse(file: File): Promise<ParsedData> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data as ParsedData;
  },

  async calculateSplit(splitRequest: SplitRequest): Promise<Blob> {
    const response = await api.post('/split/pdf', splitRequest, {
      responseType: 'blob',
    });
    
    return response.data as Blob;
  }
};

export default apiService;