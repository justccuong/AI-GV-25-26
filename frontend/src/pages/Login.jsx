// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/axiosClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Tránh việc load lại nguyên trang khi bấm Submit
    try {
      const data = await loginUser(email, password);
      
      // Lấy được token rồi thì giấu ngay vào túi (localStorage)
      localStorage.setItem('access_token', data.access_token);
      
      alert('Đăng nhập thành công rồi nha! ✨');
      // Đá thẳng về trang chủ (chỗ vẽ Mindmap ấy)
      navigate('/');
    } catch (error) {
      alert('Sai email hoặc mật khẩu rồi đồ ngốc!');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-2xl shadow-lg w-96 border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Đăng Nhập</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" 
            placeholder="hoangtu@gmail.com"
            required 
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Mật khẩu</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" 
            placeholder="********"
            required 
          />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02]">
          Vào trong thôi!
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản à? <span className="text-blue-500 cursor-pointer font-semibold hover:underline" onClick={() => navigate('/register')}>Đăng ký lẹ đi!</span>
        </p>
      </form>
    </div>
  );
}