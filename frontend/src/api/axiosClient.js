import axios from 'axios';

// Dùng biến môi trường, nếu không có thì fallback về localhost (port 8000 của FastAPI)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Tăng lên 60s, cho AI có thêm thời gian "suy nghĩ" 🧠
});

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post('/analyze-note', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default axiosClient;