import axios from 'axios';

// Tạo một instance "chính chủ" cho dự án
const axiosClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Địa chỉ Backend Python
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Đợi tối đa 30s, lâu quá thì báo lỗi
});

// Cấu hình riêng cho việc Upload file (cần header multipart)
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