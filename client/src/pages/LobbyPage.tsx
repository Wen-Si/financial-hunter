import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { avatarAPI } from '../services/api';
import { Avatar, AvatarAttributes, Status } from '../types';

const attributeLabels: Record<keyof AvatarAttributes, string> = {
  品格: '品格',
  情商: '情商',
  专业知识: '专业知识',
  人脉: '人脉',
  抗压能力: '抗压',
  运气: '运气',
};

const attributeColors: Record<keyof AvatarAttributes, string> = {
  品格: 'from-blue-400 to-blue-600',
  情商: 'from-pink-400 to-pink-600',
  专业知识: 'from-cyan-400 to-cyan-600',
  人脉: 'from-purple-400 to-purple-600',
  抗压能力: 'from-orange-400 to-orange-600',
  运气: 'from-green-400 to-green-600',
};

const statusLabels: Record<keyof Status, string> = {
  金钱: '金钱',
  心情: '心情',
  健康: '健康',
  声望: '声望',
};

const statusColors: Record<keyof Status, string> = {
  金钱: 'from-yellow-400 to-amber-500',
  心情: 'from-pink-400 to-rose-500',
  健康: 'from-green-400 to-emerald-500',
  声望: 'from-purple-400 to-violet-500',
};

const statusIcons: Record<keyof Status, string> = {
  金钱: '💰',
  心情: '😊',
  健康: '❤️',
  声望: '⭐',
};

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAvatars = useCallback(async () => {
    try {
      setLoading(true);
      const res = await avatarAPI.getAll();
      setAvatars(res.data.avatars);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '获取角色列表失败';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个角色吗？此操作不可恢复。')) return;

    setDeletingId(id);
    try {
      await avatarAPI.delete(id);
      setAvatars((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '删除失败';
      alert(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartGame = (avatarId: string) => {
    navigate(`/game/${avatarId}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* 标题区域 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 animate-slide-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">游戏大厅</h1>
            <p className="text-dark-400">管理你的角色，选择一个开始游戏</p>
          </div>
          <Link
            to="/create"
            className="mt-4 sm:mt-0 btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>创建新角色</span>
          </Link>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchAvatars} className="btn-secondary text-sm">
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && avatars.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center animate-slide-in">
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">还没有角色</h3>
            <p className="text-dark-400 mb-6">创建你的第一个数字人，开始金融职场冒险</p>
            <Link to="/create" className="btn-primary inline-flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>创建角色</span>
            </Link>
          </div>
        )}

        {/* 角色卡片列表 */}
        {!loading && !error && avatars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map((avatar, index) => (
              <div
                key={avatar.id}
                className="glass rounded-xl overflow-hidden card-hover group animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* 卡片头部 */}
                <div className="p-5 border-b border-dark-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {avatar.avatarUrl ? (
                        <img
                          src={avatar.avatarUrl}
                          alt={avatar.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-400/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-dark-950 font-bold text-lg">
                          {avatar.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{avatar.name}</h3>
                        <p className="text-xs text-dark-400">{avatar.career.当前职位}</p>
                      </div>
                    </div>
                    <span className="text-xs text-dark-500">{formatDate(avatar.createdAt)}</span>
                  </div>
                  {avatar.characterDescription && (
                    <p className="text-sm text-dark-400 mt-3 line-clamp-2 leading-relaxed">
                      {avatar.characterDescription}
                    </p>
                  )}
                </div>

                {/* 属性概览 */}
                <div className="p-5 space-y-3">
                  <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider">属性</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(attributeLabels) as (keyof AvatarAttributes)[]).map((key) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="text-xs text-dark-400 w-14 truncate">{attributeLabels[key]}</span>
                        <div className="flex-1 attribute-bar">
                          <div
                            className={`attribute-bar-fill bg-gradient-to-r ${attributeColors[key]}`}
                            style={{ width: `${Math.min(avatar.attributes[key], 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-300 w-6 text-right">{avatar.attributes[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 状态概览 */}
                <div className="px-5 pb-5">
                  <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">状态</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(statusLabels) as (keyof Status)[]).map((key) => (
                      <div key={key} className="text-center">
                        <div className="text-lg mb-1">{statusIcons[key]}</div>
                        <div className="text-xs text-dark-400">{statusLabels[key]}</div>
                        <div className="text-sm font-semibold text-white">{avatar.status[key]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="px-5 pb-5 flex items-center space-x-3">
                  <button
                    onClick={() => handleStartGame(avatar.id)}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>开始游戏</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(avatar.id, e)}
                    disabled={deletingId === avatar.id}
                    className="px-4 py-2.5 text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-dark-600 hover:border-red-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {deletingId === avatar.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;
