import React from 'react';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function UploadPanel({ onUpload, loading, onClose }) {
  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length) {
      onUpload(files);
    }
  };

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-xl backdrop-blur-sm sm:left-4 sm:w-80 sm:translate-x-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-700">
          <ImageIcon className="h-4 w-4 text-indigo-500" />
          Nguồn dữ liệu
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Đóng bảng tải ảnh"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex w-full items-center justify-center">
        <label
          className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${
            loading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center pb-6 pt-5">
            {loading ? (
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium text-indigo-600">AI đang đọc toàn bộ tập ảnh ghi chú...</p>
              </div>
            ) : (
              <>
                <div className="mb-2 rounded-full bg-indigo-100 p-2">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Tải nhiều ảnh ghi chú</p>
                <p className="mt-1 text-xs text-gray-400">Chọn một hoặc nhiều ảnh JPG, PNG để AI gộp thành một mindmap</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleChange}
            accept="image/*"
            multiple
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
}
