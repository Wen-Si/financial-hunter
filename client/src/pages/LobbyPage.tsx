import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarAPI, authAPI } from '../services/api';
import { CharacterPair } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS, EMOTION_COLORS } from '../services/comicService';
import * as localService from '../services/localStorage';
import VideoPlayer from '../components/VideoPlayer';

export default function LobbyPage() {
  const navigate = useNavigate();
  const [characterPair, setCharacterPair] = useState<CharacterPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showStartVideo, setShowStartVideo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check if logged in
      const meRes = await authAPI.getMe();
      setUser(meRes.data.user);

      // Check if has character pair
      const pairRes = await avatarAPI.getCharacterPair();
      if (pairRes.data) {
        setCharacterPair(pairRes.data);
      }
    } catch (err) {
      // Not logged in, redirect to login
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localService.logout();
    navigate('/');
  };

  const handleDeletePair = async () => {
    if (confirm('确定要删除角色对吗？这将重新开始游戏。')) {
      try {
        await avatarAPI.deleteCharacterPair();
        setCharacterPair(null);
        navigate('/create');
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const handleStartGame = async (avatarId: string) => {
    // 显示开始冒险视频
    setShowStartVideo(true);
  };

  const handleVideoComplete = () => {
    setShowStartVideo(false);
    // 视频播放完成后跳转到游戏页面
    if (characterPair) {
      navigate(`/game/${characterPair.male.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">游戏大厅</h1>
            <p className="text-dark-400 text-sm mt-1">
              欢迎回来，{user?.username || '玩家'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/create')}
              className="btn-secondary"
            >
              角色信息
            </button>
            <button
              onClick={handleLogout}
              className="text-dark-400 hover:text-white transition-colors"
            >
              退出
            </button>
          </div>
        </div>

        {characterPair ? (
          <>
            {/* 角色对卡片 */}
            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">我的角色搭档</h2>
                <button
                  onClick={handleDeletePair}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  重新创建
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 男性角色 */}
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">👨</span>
                    <div>
                      <h3 className="text-white font-semibold">{characterPair.male.name}</h3>
                      <p className="text-dark-400 text-xs">{characterPair.male.career.当前职位}</p>
                    </div>
                    {characterPair.male.avatarUrl && (
                      <img
                        src={characterPair.male.avatarUrl}
                        alt={characterPair.male.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400/30 ml-auto"
                      />
                    )}
                  </div>
                  
                  {/* 属性条 */}
                  <div className="space-y-2">
                    <AttributeBar label="品格" value={characterPair.male.attributes.品格} color="blue" />
                    <AttributeBar label="情商" value={characterPair.male.attributes.情商} color="purple" />
                    <AttributeBar label="专业知识" value={characterPair.male.attributes.专业知识} color="yellow" />
                  </div>
                </div>

                {/* 女性角色 */}
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">👩</span>
                    <div>
                      <h3 className="text-white font-semibold">{characterPair.female.name}</h3>
                      <p className="text-dark-400 text-xs">{characterPair.female.career.当前职位}</p>
                    </div>
                    {characterPair.female.avatarUrl && (
                      <img
                        src={characterPair.female.avatarUrl}
                        alt={characterPair.female.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-pink-400/30 ml-auto"
                      />
                    )}
                  </div>
                  
                  {/* 属性条 */}
                  <div className="space-y-2">
                    <AttributeBar label="品格" value={characterPair.female.attributes.品格} color="blue" />
                    <AttributeBar label="情商" value={characterPair.female.attributes.情商} color="purple" />
                    <AttributeBar label="专业知识" value={characterPair.female.attributes.专业知识} color="yellow" />
                  </div>
                </div>
              </div>

              {/* 合作关系状态 */}
              <div className="mt-6 pt-4 border-t border-dark-700">
                <h3 className="text-sm font-medium text-dark-400 mb-3">合作关系状态</h3>
                <div className="flex items-center space-x-4 mb-3">
                  <span className={`text-2xl ${EMOTION_COLORS[characterPair.currentEmotion]}`}>
                    {EMOTION_ICONS[characterPair.currentEmotion]}
                  </span>
                  <span className="text-white">当前情绪：{EMOTION_LABELS[characterPair.currentEmotion]}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">{characterPair.relationship.harmony}</div>
                    <div className="text-xs text-dark-500">和谐度</div>
                  </div>
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">{characterPair.relationship.trust}</div>
                    <div className="text-xs text-dark-500">信任度</div>
                  </div>
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400">{characterPair.relationship.joyfulMoments}</div>
                    <div className="text-xs text-dark-500">欢乐时刻</div>
                  </div>
                </div>
              </div>

              {/* 开始游戏按钮 */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleStartGame(characterPair.male.id)}
                  className="btn-primary text-lg px-12 py-4"
                >
                  🎮 开始冒险
                </button>
              </div>
            </div>

            {/* 状态总览 */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">状态总览</h2>
              <div className="grid grid-cols-4 gap-4">
                <StatusCard label="金钱" value={characterPair.male.status.金钱} />
                <StatusCard label="心情" value={characterPair.male.status.心情} />
                <StatusCard label="健康" value={characterPair.male.status.健康} />
                <StatusCard label="声望" value={characterPair.male.status.声望} />
              </div>
            </div>
          </>
        ) : (
          /* 未创建角色 */
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">👫</div>
            <h2 className="text-xl font-bold text-white mb-2">尚未创建角色</h2>
            <p className="text-dark-400 mb-6">
              创建一个男女搭档组合，共同开启金融职场的冒险之旅
            </p>
            <button
              onClick={() => navigate('/create')}
              className="btn-primary text-lg px-8"
            >
              创建角色对
            </button>
          </div>
        )}
      </div>

      {/* 开始冒险视频播放器 */}
      {showStartVideo && (
        <VideoPlayer
          videoUrl="/video-start.mp4"
          onComplete={handleVideoComplete}
          autoPlay={true}
          showSkip={true}
        />
      )}
    </div>
  );
}

// 属性条组件
function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-dark-400 w-16">{label}</span>
      <div className="flex-1 attribute-bar">
        <div
          className={`attribute-bar-fill ${colorMap[color]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs text-dark-500 w-8 text-right">{value}</span>
    </div>
  );
}

// 状态卡片组件
function StatusCard({ label, value }: { label: string; value: number }) {
  const isLow = value < 30;
  return (
    <div className={`bg-dark-800/50 rounded-lg p-4 ${isLow ? 'border border-red-500/50' : ''}`}>
      <div className={`text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-dark-500">{label}</div>
    </div>
  );
}
