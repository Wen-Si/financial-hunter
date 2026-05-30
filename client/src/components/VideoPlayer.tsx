import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
  onSkip?: () => void;
  autoPlay?: boolean;
  showSkip?: boolean;
}

export default function VideoPlayer({
  videoUrl,
  onComplete,
  onSkip,
  autoPlay = true,
  showSkip = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onComplete();
    };

    const handleTimeUpdate = () => {
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
        // 3秒后可以跳过
        if (video.currentTime > 3 && !canSkip) {
          setCanSkip(true);
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // 自动播放
    if (autoPlay) {
      video.play().catch(() => {
        // 自动播放被阻止，显示播放按钮
        console.log('Auto-play prevented');
      });
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [autoPlay, onComplete, canSkip]);

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* 视频容器 */}
      <div className="relative w-full max-w-5xl mx-4">
        {/* 视频元素 */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-lg shadow-2xl"
          playsInline
          onClick={togglePlay}
        />

        {/* 播放/暂停遮罩 */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer rounded-lg"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-yellow-500/90 flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors">
              <svg className="w-10 h-10 text-dark-950 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* 进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-800 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 跳过按钮 */}
        {showSkip && (
          <button
            onClick={handleSkip}
            className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              canSkip
                ? 'bg-dark-800/80 text-white hover:bg-dark-700 border border-dark-600'
                : 'bg-dark-900/50 text-dark-500 cursor-not-allowed'
            }`}
            disabled={!canSkip}
          >
            {canSkip ? '跳过' : `${Math.ceil(3 - (progress / 100) * 3)}s`}
          </button>
        )}

        {/* 点击提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm">
          点击视频可{isPlaying ? '暂停' : '播放'}
        </div>
      </div>
    </div>
  );
}
