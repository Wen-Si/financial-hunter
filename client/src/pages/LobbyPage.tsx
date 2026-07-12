import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarAPI, authAPI } from '../services/api';
import { CharacterPair } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS, EMOTION_COLORS } from '../services/comicService';
import * as localService from '../services/localStorage';

export default function LobbyPage() {
  const navigate = useNavigate();
  const [characterPair, setCharacterPair] = useState<CharacterPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    // 直接跳转到游戏页面（视频播放已禁用）
    if (characterPair) {
      navigate(`/game/${characterPair.male.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="loading-dot w-3 h-3 bg-gold-light rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gold-light rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gold-light rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-pattern py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold font-serif text-gold-gradient">游戏大厅</h1>
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
              className="text-dark-400 hover:text-gold-light transition-colors text-sm"
            >
              退出
            </button>
          </div>
        </div>

        {characterPair ? (
          <>
            {/* 角色对卡片 */}
            <div className="financial-card rounded-xl p-6 mb-6 animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-serif text-gold-light">我的角色搭档</h2>
                <button
                  onClick={handleDeletePair}
                  className="text-sm text-dark-400 hover:text-gold-light transition-colors"
                >
                  重新创建
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 男性角色 */}
                <div className="bg-navy-light/40 rounded-xl p-4 border border-gold/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-10 h-10 flex-shrink-0 rounded-full bg-navy border border-gold/30 flex items-center justify-center font-serif font-bold text-gold-light">
                      男
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{characterPair.male.name}</h3>
                      <p className="text-dark-400 text-xs truncate">{characterPair.male.career.当前职位}</p>
                    </div>
                    {characterPair.male.avatarUrl && (
                      <img
                        src={characterPair.male.avatarUrl}
                        alt={characterPair.male.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-gold/30"
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
                <div className="bg-navy-light/40 rounded-xl p-4 border border-gold/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-10 h-10 flex-shrink-0 rounded-full bg-navy border border-gold/30 flex items-center justify-center font-serif font-bold text-gold-light">
                      女
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{characterPair.female.name}</h3>
                      <p className="text-dark-400 text-xs truncate">{characterPair.female.career.当前职位}</p>
                    </div>
                    {characterPair.female.avatarUrl && (
                      <img
                        src={characterPair.female.avatarUrl}
                        alt={characterPair.female.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-gold/30"
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
              <div className="mt-6 pt-4 border-t border-gold/10">
                <h3 className="text-sm font-medium text-dark-400 mb-3">合作关系状态</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold-light text-xs font-medium">
                    {EMOTION_LABELS[characterPair.currentEmotion]}
                  </span>
                  <span className="text-dark-300 text-sm">当前情绪</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/10">
                    <div className="text-2xl font-bold text-gold-light tabular-nums">{characterPair.relationship.harmony}</div>
                    <div className="text-xs text-dark-400 mt-1">和谐度</div>
                  </div>
                  <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/10">
                    <div className="text-2xl font-bold text-gold-light tabular-nums">{characterPair.relationship.trust}</div>
                    <div className="text-xs text-dark-400 mt-1">信任度</div>
                  </div>
                  <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/10">
                    <div className="text-2xl font-bold text-gold-light tabular-nums">{characterPair.relationship.joyfulMoments}</div>
                    <div className="text-xs text-dark-400 mt-1">欢乐时刻</div>
                  </div>
                </div>
              </div>

              {/* 开始游戏按钮 */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleStartGame(characterPair.male.id)}
                  className="btn-primary text-lg px-12 py-4"
                >
                  开始冒险
                </button>
              </div>
            </div>

            {/* 状态总览 */}
            <div className="financial-card rounded-xl p-6 animate-slide-in">
              <h2 className="text-lg font-bold font-serif text-gold-light mb-4">状态总览</h2>
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
          <div className="financial-card rounded-xl p-12 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-gold/30 flex items-center justify-center bg-navy">
              <svg className="w-8 h-8 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-serif text-gold-light mb-2">尚未创建角色</h2>
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

    </div>
  );
}

// 属性条组件
function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  // color 参数保留以维持组件接口不变；样式统一使用金色渐变 attribute-bar-fill
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-dark-400 w-16">{label}</span>
      <div className="flex-1 attribute-bar">
        <div
          className="attribute-bar-fill"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs text-gold-light w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

// 状态卡片组件
function StatusCard({ label, value }: { label: string; value: number }) {
  const isLow = value < 30;
  return (
    <div className={`bg-navy-light/30 rounded-lg p-4 border ${isLow ? 'border-gold-dark/40' : 'border-gold/10'}`}>
      <div className={`text-2xl font-bold tabular-nums ${isLow ? 'text-gold-dark' : 'text-gold-light'}`}>
        {value}
      </div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
    </div>
  );
}
