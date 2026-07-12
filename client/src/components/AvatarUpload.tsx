import React, { useState, useRef } from 'react';

interface AvatarUploadProps {
  gender: 'male' | 'female';
  onUpload: (dataUrl: string | null) => void;
  currentAvatar?: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AvatarUpload({ gender, onUpload, currentAvatar }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setError('');

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      setError('图片大小不能超过2MB');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 读取文件为DataURL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onUpload(dataUrl);
    };
    reader.onerror = () => {
      setError('读取文件失败');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    setPreview(null);
    setError('');
    onUpload(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // 统一金融风格：金色边框与配色
  const borderColor = 'border-gold/30';
  const bgColor = 'bg-gold/5';
  const iconColor = 'text-gold-light';

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
          isDragging ? 'border-gold-light bg-gold/10' : borderColor + ' ' + bgColor
        } hover:border-gold-light/60`}
      >
        {preview ? (
          <>
            <img src={preview} alt="预览" className="w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-1">
            <span className={`text-sm font-serif font-bold ${iconColor} mb-0.5`}>
              {gender === 'male' ? '男' : '女'}
            </span>
            <span className="text-[10px] text-dark-400">点击或拖拽</span>
            <span className="text-[8px] text-dark-500">≤2MB</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!preview && (
        <p className="text-[10px] text-dark-500">
          未上传则随机分配
        </p>
      )}
    </div>
  );
}
