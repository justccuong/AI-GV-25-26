import React from 'react';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function UploadPanel({ onUpload, loading, onClose }) {
  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 w-80 backdrop-blur-sm bg-white/90">
      <div className="flex items-center justify-between mb-3">
      <h3 className="text-gray-700 font-semibold flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-indigo-500" />
        Nguồn dữ liệu
      </h3>
      {onClose && (
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500" aria-label="Đóng">
          <X className="w-4 h-4" />
        </button>
      )}
      </div>
      
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${loading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2 mx-auto" />
                <p className="text-xs text-indigo-600 font-medium">AI đang đọc vở ghi...</p>
              </div>
            ) : (
              <>
                <div className="p-2 bg-indigo-100 rounded-full mb-2">
                    <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Tải ảnh lên</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleChange} 
            accept="image/*" 
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
}