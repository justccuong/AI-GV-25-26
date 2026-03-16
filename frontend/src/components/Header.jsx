// frontend/src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  // Kiểm tra xem trong túi có token không để quyết định hiện nút
  const isLoggedIn = !!localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // Vứt thẻ đi
    navigate('/login'); // Đá ra chuồng gà
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        {/* Chỗ này giữ nguyên logo EduMind của Hoàng tử */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">E</div>
        <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">EduMind<span className="text-blue-600">.AI</span></h1>
      </div>

      <div>
        {isLoggedIn ? (
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-700 px-4 py-2 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
          >
            Đăng Xuất
          </button>
        ) : (
           <span className="text-sm text-gray-500 font-medium">Chưa đăng nhập</span>
        )}
      </div>
    </header>
  );
}