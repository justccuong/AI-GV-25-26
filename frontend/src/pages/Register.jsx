// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/axiosClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await registerUser(email, password);
      
      // Đăng ký xong thì server cũng nhả luôn token, giấu vào túi đi thẳng vào nhà!
      localStorage.setItem('access_token', data.access_token);
      
      alert('Đăng ký thành công xuất sắc! ✨');
      navigate('/');
    } catch (error) {
      alert('Lỗi rồi đồ ngốc! Email này chắc có đứa xài rồi!');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleRegister} className="p-8 bg-white rounded-2xl shadow-lg w-96 border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Đăng Ký Nào</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" 
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
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" 
            placeholder="Nghĩ pass cho khó vào"
            required 
          />
        </div>
        
        <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-200 transform hover:scale-[1.02]">
          Tạo Tài Khoản
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Có nick rồi à? <span className="text-green-500 cursor-pointer font-semibold hover:underline" onClick={() => navigate('/login')}>Đăng nhập đi!</span>
        </p>
      </form>
    </div>
  );
}