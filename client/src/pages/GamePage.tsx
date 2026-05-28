import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, avatarAPI } from '../services/api';
import { getSceneImage, getEmotionImage, getResultImage } from '../services/imageService';
import {
  Avatar,
  AvatarAttributes,
  Status,
  Scenario,
  GameActionResponse,
  GameStartResponse,
  GameEvent,
} from '../types';

// 属性配置
const attributeConfig: { key: keyof AvatarAttributes; label: string; color: string; icon: string }[] = [
  { key: '品格', label: '品格', color: 'from-blue-400 to-blue-600', icon: '🛡️' },
  { key: '情商', label: '情商', color: 'from-pink-400 to-pink-600', icon: '💬' },
  { key: '专业知识', label: '专业知识', color: 'from-cyan-400 to-cyan-600', icon: '📚' },
  { key: '人脉', label: '人脉', color: 'from-purple-400 to-purple-600', icon: '🤝' },
  { key: '抗压能力', label: '抗压能力', color: 'from-orange-400 to-orange-600', icon: '💪' },
  { key: '运气', label: '运气', color: 'from-green-400 to-green-600', icon: '🍀' },
];

const statusConfig: { key: keyof Status; label: string; color: string; icon: string }[] = [
  { key: '金钱', label: '金钱', color: 'from-yellow-400 to-amber-500', icon: '💰' },
  { key: '心情', label: '心情', color: 'from-pink-400 to-rose-500', icon: '😊' },
  { key: '健康', label: '健康', color: 'from-green-400 to-emerald-500', icon: '❤️' },
  { key: '声望', label: '声望', color: 'from-purple-400 to-violet-500', icon: '⭐' },
];

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logEndRef = useRef<HTMLDivElement>(null);

  // 游戏状态
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [gameLog, setGameLog] = useState<GameEvent[]>([]);
  const [lastAction, setLastAction] = useState<GameActionResponse | null>(null);

  // UI状态
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoRun, setIsAutoRun] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [stepCount, setStepCount] = useState(0);
  
  // 图片状态
  const [sceneImage, setSceneImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');

  const autoRunRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化游戏
  const initGame = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');

      // 获取角色信息
      const avatarRes = await avatarAPI.get(id);
      const avatarData = avatarRes.data.avatar;
      setAvatar(avatarData);

      // 检查是否有游戏日志
      if (avatarData.gameLog && avatarData.gameLog.length > 0) {
        setGameLog(avatarData.gameLog);
        setStepCount(avatarData.gameLog.length);

        // 检查游戏是否已结束
        const status = avatarData.status;
        if (status.健康 <= 0 || status.心情 <= 0 || status.声望 <= 0) {
          setIsGameOver(true);
          if (status.健康 <= 0) setGameOverReason('你的健康状况恶化到了极点，不得不退出金融行业。');
          else if (status.心情 <= 0) setGameOverReason('长期的精神压力让你彻底崩溃，你决定离开这个残酷的职场。');
          else if (status.声望 <= 0) setGameOverReason('声望扫地，你已无法在金融行业立足。');
        }
      }

      // 开始新游戏或获取当前状态
      const startRes = await gameAPI.start(id);
      const startData: GameStartResponse = startRes.data;
      setCurrentScenario(startData.scenario);

      // 更新角色数据
      setAvatar((prev) =>
        prev
          ? {
              ...prev,
              attributes: startData.avatar.attributes,
              career: startData.avatar.career,
              status: startData.avatar.status,
            }
          : null
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '初始化游戏失败';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    initGame();
    return () => {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current);
      }
    };
  }, [initGame]);

  // 自动滚动日志
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog, lastAction]);

  // 自动运行逻辑
  useEffect(() => {
    if (isAutoRun && !isGameOver && !actionLoading && !loading) {
      autoRunRef.current = setInterval(() => {
        executeAction();
      }, 5000);
    }
    return () => {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current);
        autoRunRef.current = null;
      }
    };
  }, [isAutoRun, isGameOver, actionLoading, loading, stepCount]);

  // 执行行动
  const executeAction = useCallback(async () => {
    if (!id || isGameOver || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await gameAPI.executeAction(id);
      const data: GameActionResponse = res.data;

      setLastAction(data);
      setCurrentScenario(data.nextScenario);
      setGameLog((prev) => [...prev, data.gameEvent]);
      setStepCount((prev) => prev + 1);
      
      // 更新图片
      if (data.nextScenario) {
        setSceneImage(getSceneImage(data.nextScenario.category));
      }
      // 根据结果描述的情绪选择图片
      setResultImage(getEmotionImage(data.outcome.description));

      // 更新角色属性和状态
      setAvatar((prev) =>
        prev
          ? {
              ...prev,
              attributes: data.newAttributes,
              status: data.newStatus,
            }
          : null
      );

      // 检查游戏结束
      if (data.isGameOver) {
        setIsGameOver(true);
        const status = data.newStatus;
        if (status.健康 <= 0) setGameOverReason('你的健康状况恶化到了极点，不得不退出金融行业。');
        else if (status.心情 <= 0) setGameOverReason('长期的精神压力让你彻底崩溃，你决定离开这个残酷的职场。');
        else if (status.声望 <= 0) setGameOverReason('声望扫地，你已无法在金融行业立足。');
        setIsAutoRun(false);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '执行行动失败';
      setError(errorMsg);
      setIsAutoRun(false);
    } finally {
      setActionLoading(false);
    }
  }, [id, isGameOver, actionLoading]);

  const toggleAutoRun = () => {
    setIsAutoRun((prev) => !prev);
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 渲染属性变化
  const renderChange = (change: Partial<AvatarAttributes> | Partial<Status> | undefined, key: string) => {
    if (!change || !(key in change)) return null;
    const val = (change as Record<string, number>)[key];
    if (val === undefined || val === 0) return null;
    return (
      <span className={`text-xs font-bold ml-1 ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {val > 0 ? `+${val}` : val}
      </span>
    );
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-3 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 loading-dot" />
          </div>
          <p className="text-dark-400">正在初始化游戏世界...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error && !avatar) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 text-center max-w-md">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex items-center justify-center space-x-3">
            <button onClick={initGame} className="btn-secondary text-sm">
              重试
            </button>
            <button onClick={() => navigate('/lobby')} className="btn-secondary text-sm">
              返回大厅
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-4 px-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-indigo-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 游戏结束弹窗 */}
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-slide-in border border-red-500/20">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
              <p className="text-dark-400 mb-2">{gameOverReason}</p>
              <p className="text-dark-500 text-sm mb-6">
                你在金融世界中生存了 <span className="text-yellow-400 font-bold">{stepCount}</span> 步
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => {
                    setIsGameOver(false);
                    setGameOverReason('');
                    setGameLog([]);
                    setLastAction(null);
                    setStepCount(0);
                    initGame();
                  }}
                  className="btn-primary text-sm"
                >
                  重新开始
                </button>
                <button
                  onClick={() => navigate('/lobby')}
                  className="btn-secondary text-sm"
                >
                  返回大厅
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 主游戏区域 - 左右布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左侧：数字人信息面板 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 角色信息卡片 */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center space-x-3 mb-4">
                {avatar?.avatarUrl ? (
                  <img
                    src={avatar.avatarUrl}
                    alt={avatar?.name || '角色'}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-400/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-dark-950 font-bold text-lg">
                    {avatar?.name.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{avatar?.name || '未知角色'}</h2>
                  <p className="text-xs text-dark-400">{avatar?.career.当前职位} | {avatar?.career.所属机构}</p>
                </div>
              </div>

              {avatar?.characterDescription && (
                <p className="text-sm text-dark-400 leading-relaxed line-clamp-3">
                  {avatar.characterDescription}
                </p>
              )}

              {/* 职业信息 */}
              <div className="mt-4 pt-4 border-t border-dark-700/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-dark-500 text-xs">目标方向</span>
                    <p className="text-dark-200">{avatar?.career.目标方向 || '-'}</p>
                  </div>
                  <div>
                    <span className="text-dark-500 text-xs">工作年限</span>
                    <p className="text-dark-200">{avatar?.career.工作年限 || 0} 年</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 属性面板 */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                核心属性
              </h3>
              <div className="space-y-3">
                {attributeConfig.map((attr) => (
                  <div key={attr.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-dark-300 flex items-center">
                        <span className="mr-1.5">{attr.icon}</span>
                        {attr.label}
                        {lastAction && renderChange(lastAction.outcome.attributesChange, attr.key)}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {avatar?.attributes[attr.key] ?? 0}
                      </span>
                    </div>
                    <div className="attribute-bar">
                      <div
                        className={`attribute-bar-fill bg-gradient-to-r ${attr.color}`}
                        style={{ width: `${Math.min(avatar?.attributes[attr.key] ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 状态面板 */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                当前状态
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {statusConfig.map((st) => {
                  const value = avatar?.status[st.key] ?? 0;
                  const isLow = value <= 20;
                  return (
                    <div
                      key={st.key}
                      className={`rounded-lg p-3 border transition-all duration-300 ${
                        isLow
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-dark-800/50 border-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{st.icon}</span>
                        {lastAction && renderChange(lastAction.outcome.statusChange, st.key)}
                      </div>
                      <div className={`text-xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {value}
                      </div>
                      <div className="text-xs text-dark-500">{st.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧：游戏事件面板 */}
          <div className="lg:col-span-8 space-y-4">
            {/* 当前场景 */}
            {currentScenario && (
              <div className="glass rounded-xl overflow-hidden animate-slide-in">
                {/* 场景图片 */}
                <div className="relative h-48 bg-dark-800">
                  <img
                    src={sceneImage || getSceneImage(currentScenario.category)}
                    alt={currentScenario.title}
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {currentScenario.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-dark-700/80 text-dark-300">
                        难度 {currentScenario.difficulty}/5
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-dark-700/80 text-dark-300">
                        第 {stepCount + 1} 步
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{currentScenario.title}</h2>
                  </div>
                </div>
                
                {/* 场景内容 */}
                <div className="p-6">
                  <p className="text-dark-300 leading-relaxed mb-4">{currentScenario.description}</p>

                  {currentScenario.context && (
                    <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700/50">
                      <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">背景信息</h4>
                      <p className="text-sm text-dark-300 leading-relaxed">{currentScenario.context}</p>
                    </div>
                  )}

                  {/* 可选选项 */}
                  {currentScenario.choices && currentScenario.choices.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">可选方案</h4>
                      <div className="space-y-2">
                        {currentScenario.choices.map((choice) => (
                          <div
                            key={choice.id}
                            className="flex items-center space-x-2 text-sm text-dark-300 bg-dark-800/30 rounded-lg px-3 py-2 border border-dark-700/30"
                          >
                            <span className="w-5 h-5 rounded-full bg-dark-700 flex items-center justify-center text-xs text-dark-400 flex-shrink-0">
                              {choice.id}
                            </span>
                            <span>{choice.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI决策与结果展示 */}
            {lastAction && (
              <div className="space-y-4 animate-slide-in">
                {/* AI决策过程 */}
                <div className="glass rounded-xl p-6 border-l-4 border-l-yellow-500">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI决策
                  </h3>

                  <div className="space-y-3">
                    {/* 选择的行动 */}
                    <div>
                      <span className="text-xs text-dark-500 uppercase tracking-wider">选择的行动</span>
                      <p className="text-dark-200 mt-1">{lastAction.action.action}</p>
                    </div>

                    {/* AI理由 */}
                    <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700/50">
                      <span className="text-xs text-dark-500 uppercase tracking-wider">决策理由</span>
                      <p className="text-dark-300 mt-1 text-sm leading-relaxed italic">
                        "{lastAction.action.reasoning}"
                      </p>
                    </div>

                    {/* 选择的选项 */}
                    {lastAction.action.selectedChoice && (
                      <div>
                        <span className="text-xs text-dark-500 uppercase tracking-wider">选择方案</span>
                        <p className="text-yellow-400 mt-1 text-sm">
                          {lastAction.action.selectedChoice.text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 行动结果 */}
                <div className="glass rounded-xl overflow-hidden border-l-4 border-l-emerald-500">
                  {/* 结果图片 */}
                  {resultImage && (
                    <div className="relative h-32 bg-dark-800">
                      <img
                        src={resultImage}
                        alt="行动结果"
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      行动结果
                    </h3>
                    <p className="text-dark-200 leading-relaxed">{lastAction.outcome.description}</p>

                    {/* 属性变化汇总 */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(lastAction.outcome.attributesChange).map(([key, val]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            val > 0
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {key} {val > 0 ? `+${val}` : val}
                        </span>
                      ))}
                      {Object.entries(lastAction.outcome.statusChange).map(([key, val]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            val > 0
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {key} {val > 0 ? `+${val}` : val}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 游戏日志 */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                游戏日志
                <span className="ml-auto text-xs text-dark-500 font-normal">共 {gameLog.length} 条记录</span>
              </h3>

              <div className="game-log space-y-3">
                {gameLog.length === 0 ? (
                  <p className="text-dark-500 text-sm text-center py-8">游戏尚未开始，点击下方按钮开始你的职场冒险</p>
                ) : (
                  gameLog.map((event, index) => (
                    <div
                      key={event.id || index}
                      className="relative pl-6 pb-3 border-l-2 border-dark-700 last:border-transparent last:pb-0"
                    >
                      {/* 时间线节点 */}
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-yellow-500" />

                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-dark-500">{formatTime(event.timestamp)}</span>
                        <span className="text-xs text-yellow-400/70">{event.scenarioTitle}</span>
                      </div>
                      <p className="text-sm text-dark-300">{event.result}</p>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="mt-4 glass rounded-xl p-4 sticky bottom-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={executeAction}
                disabled={actionLoading || isGameOver}
                className="btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>AI思考中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>执行下一步</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleAutoRun}
                disabled={isGameOver}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
                  isAutoRun
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    : 'bg-dark-700 border-dark-600 text-dark-300 hover:bg-dark-600 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAutoRun ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>暂停自动</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>自动运行</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-dark-400">
                步数: <span className="text-yellow-400 font-bold">{stepCount}</span>
              </span>
              <button
                onClick={() => navigate('/lobby')}
                className="btn-secondary py-2.5 text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>返回大厅</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
