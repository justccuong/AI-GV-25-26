import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      fallbackMessage
    );
  }

  return fallbackMessage;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post('/analyze-note', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function loginUser(email, password) {
  const response = await axiosClient.post('/login', { email, password });
  return response.data;
}

export async function registerUser(email, password) {
  const response = await axiosClient.post('/register', { email, password });
  return response.data;
}

export async function getMindMaps() {
  const response = await axiosClient.get('/mindmaps');
  return response.data;
}

export async function getMindMap(id) {
  const response = await axiosClient.get(`/mindmaps/${id}`);
  return response.data;
}

export async function createMindMap(payload) {
  const response = await axiosClient.post('/mindmaps', payload);
  return response.data;
}

export async function updateMindMap(id, payload) {
  const response = await axiosClient.put(`/mindmaps/${id}`, payload);
  return response.data;
}

export async function renameMindMap(id, title) {
  const response = await axiosClient.patch(`/mindmaps/${id}/title`, { title });
  return response.data;
}

export async function deleteMindMap(id) {
  const response = await axiosClient.delete(`/mindmaps/${id}`);
  return response.data;
}

export async function generateAssistantMindMap(payload) {
  const response = await axiosClient.post('/assistant/mindmap', payload);
  return response.data;
}

export default axiosClient;
