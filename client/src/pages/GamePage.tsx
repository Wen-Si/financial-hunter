import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, avatarAPI } from '../services/api';
import { CharacterPair, Scenario, ComicFrame, EmotionType } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS, EMOTION_COLORS } from '../services/comicService';
import VideoPlayer from '../components/VideoPlayer';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 角色对状态
  const [characterPair, setCharacterPair] = useState<CharacterPair | null>(null);

  // 游戏状态
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoRun, setIsAutoRun] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [stepCount, setStepCount] = useState(0);

  // 场景状态
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [comicFrames, setComicFrames] = useState<ComicFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // 行动结果
  const [lastAction, setLastAction] = useState<any>(null);

  // 自动运行定时器
  const autoRunTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // 视频播放状态
  const [showLevelVideo, setShowLevelVideo] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<Scenario | null>(null);

  // 初始化游戏
  useEffect(() => {
    initGame();
    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    };
  }, []);

  const initGame = async () => {
    try {
      setLoading(true);
      const pairRes = await avatarAPI.getCharacterPair();
      if (!pairRes.data) {
        navigate('/lobby');
        return;
      }
      setCharacterPair(pairRes.data);

      // 开始游戏
      const startRes = await gameAPI.startWithPair();
      const data = startRes.data;

      setCurrentScenario(data.scenario);
      setComicFrames(data.comicFrames || []);
      setStepCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '游戏初始化失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行行动
  const executeAction = useCallback(async () => {
    if (isGameOver || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await gameAPI.executeActionWithPair();
      const data = res.data;

      setLastAction(data);
      setStepCount((prev) => prev + 1);

      // 如果有下一关，先播放视频再显示场景
      if (data.nextScenario) {
        setPendingScenario(data.nextScenario);
        setShowLevelVideo(true);
      } else {
        setCurrentScenario(data.nextScenario);
      }

      setComicFrames(data.comicFrames || []);
      setCurrentFrameIndex(0);

      // 更新角色对
      const pairRes = await avatarAPI.getCharacterPair();
      if (pairRes.data) {
        setCharacterPair(pairRes.data);
      }

      // 检查游戏结束
      if (data.isGameOver) {
        setIsGameOver(true);
        setGameOverReason('任一角色的状态值耗尽了！');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '行动执行失败');
    } finally {
      setActionLoading(false);
    }
  }, [isGameOver, actionLoading]);

  // 自动运行
  const toggleAutoRun = () => {
    if (isAutoRun) {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
      setIsAutoRun(false);
    } else {
      setIsAutoRun(true);
      autoRunTimerRef.current = setInterval(() => {
        executeAction();
      }, 5000);
    }
  };

  // 下一帧漫画
  const nextFrame = () => {
    if (currentFrameIndex < comicFrames.length - 1) {
      setCurrentFrameIndex((prev) => prev + 1);
    }
  };

  // 上一帧漫画
  const prevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
          <div className="loading-dot w-3 h-3 bg-yellow-400 rounded-full mx-1"></div>
          <p className="text-dark-400 mt-4">正在加载游戏...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/lobby')} className="btn-secondary">
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  const currentFrame = comicFrames[currentFrameIndex];

  return (
    <div className="min-h-screen bg-dark-950 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/lobby')}
            className="text-dark-400 hover:text-white transition-colors"
          >
            ← 返回大厅
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-dark-400 text-sm">
              第 {stepCount + 1} 步
            </span>
            <span className={`text-2xl ${characterPair ? EMOTION_COLORS[characterPair.currentEmotion] : ''}`}>
              {characterPair ? EMOTION_ICONS[characterPair.currentEmotion] : '😐'}
            </span>
            <span className="text-dark-300">
              {characterPair ? EMOTION_LABELS[characterPair.currentEmotion] : '平静'}
            </span>
          </div>
        </div>

        {/* 漫画展示区 */}
        <div className="mb-6">
          {currentFrame && (
            <div className="glass rounded-xl overflow-hidden">
              {/* 漫画图片 */}
              <div className="relative aspect-video bg-dark-900">
                <img
                  src={currentFrame.imageUrl}
                  alt="场景"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop';
                  }}
                />
                
                {/* 对话气泡 */}
                {currentFrame.speaker && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-white text-dark-900 rounded-lg px-4 py-2 shadow-lg max-w-xs">
                      <p className="font-bold text-sm">{currentFrame.speaker}</p>
                    </div>
                  </div>
                )}
                
                {/* 情绪标签 */}
                {currentFrame.emotion && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-dark-950/80 ${EMOTION_COLORS[currentFrame.emotion]}`}>
                      {EMOTION_ICONS[currentFrame.emotion]} {EMOTION_LABELS[currentFrame.emotion]}
                    </span>
                  </div>
                )}
                
                {/* 分镜指示器 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {comicFrames.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentFrameIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentFrameIndex ? 'bg-yellow-400 w-4' : 'bg-dark-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* 漫画说明文字 */}
              <div className="p-4 bg-dark-900/50">
                <p className="text-dark-200 text-center text-sm leading-relaxed">
                  {currentFrame.caption}
                </p>
                
                {/* 漫画导航 */}
                <div className="flex justify-center space-x-4 mt-3">
                  <button
                    onClick={prevFrame}
                    disabled={currentFrameIndex === 0}
                    className="px-4 py-1 bg-dark-700 text-dark-300 rounded disabled:opacity-50"
                  >
                    ← 上一页
                  </button>
                  <span className="text-dark-500 text-sm">
                    {currentFrameIndex + 1} / {comicFrames.length}
                  </span>
                  <button
                    onClick={nextFrame}
                    disabled={currentFrameIndex === comicFrames.length - 1}
                    className="px-4 py-1 bg-dark-700 text-dark-300 rounded disabled:opacity-50"
                  >
                    下一页 →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：角色信息 */}
          <div className="space-y-4">
            {/* 男性角色 */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">👨</span>
                <div>
                  <h3 className="text-white font-semibold">{characterPair?.male.name}</h3>
                  <p className="text-dark-400 text-xs">{characterPair?.male.career.当前职位}</p>
                </div>
                {characterPair?.male.avatarUrl && (
                  <img
                    src={characterPair.male.avatarUrl}
                    alt={characterPair.male.name}
                    className="w-10 h-10 rounded-lg object-cover ml-auto"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <AttributeMini label="心情" value={characterPair?.male.status.心情 || 0} />
                <AttributeMini label="健康" value={characterPair?.male.status.健康 || 0} />
                <AttributeMini label="金钱" value={characterPair?.male.status.金钱 || 0} />
                <AttributeMini label="声望" value={characterPair?.male.status.声望 || 0} />
              </div>
            </div>

            {/* 女性角色 */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">👩</span>
                <div>
                  <h3 className="text-white font-semibold">{characterPair?.female.name}</h3>
                  <p className="text-dark-400 text-xs">{characterPair?.female.career.当前职位}</p>
                </div>
                {characterPair?.female.avatarUrl && (
                  <img
                    src={characterPair.female.avatarUrl}
                    alt={characterPair.female.name}
                    className="w-10 h-10 rounded-lg object-cover ml-auto"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <AttributeMini label="心情" value={characterPair?.female.status.心情 || 0} />
                <AttributeMini label="健康" value={characterPair?.female.status.健康 || 0} />
                <AttributeMini label="金钱" value={characterPair?.female.status.金钱 || 0} />
                <AttributeMini label="声望" value={characterPair?.female.status.声望 || 0} />
              </div>
            </div>

            {/* 合作关系 */}
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-medium text-dark-400 mb-2">合作关系</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-400">和谐度</span>
                  <span className="text-white">{characterPair?.relationship.harmony || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">信任度</span>
                  <span className="text-white">{characterPair?.relationship.trust || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">冲突次数</span>
                  <span className="text-white">{characterPair?.relationship.conflicts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">欢乐时刻</span>
                  <span className="text-white">{characterPair?.relationship.joyfulMoments || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 中间：场景信息 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 场景卡片 */}
            {currentScenario && (
              <div className="glass rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs">
                    {currentScenario.category}
                  </span>
                  <span className="px-2 py-1 bg-dark-700 text-dark-300 rounded text-xs">
                    难度 {currentScenario.difficulty}/5
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{currentScenario.title}</h2>
                <p className="text-dark-300 text-sm leading-relaxed">{currentScenario.description}</p>
                {currentScenario.context && (
                  <div className="mt-3 p-3 bg-dark-800/50 rounded-lg">
                    <p className="text-dark-400 text-xs">{currentScenario.context}</p>
                  </div>
                )}
              </div>
            )}

            {/* 行动结果 */}
            {lastAction && (
              <div className="glass rounded-xl p-5 border-l-4 border-l-emerald-500">
                <h4 className="text-emerald-400 font-medium mb-2 flex items-center">
                  {EMOTION_ICONS[lastAction.outcome.emotion || 'neutral']} 行动结果
                </h4>
                <p className="text-dark-200 text-sm leading-relaxed mb-3">
                  {lastAction.outcome.description}
                </p>
                
                {/* AI决策 */}
                <div className="bg-dark-800/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-dark-400 mb-1">AI决策理由</p>
                  <p className="text-sm text-dark-300">{lastAction.action.reasoning}</p>
                </div>
                
                {/* 属性变化 */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lastAction.outcome.attributesChange || {}).map(([key, val]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded text-xs ${
                        (val as number) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {key} {Number(val) > 0 ? `+${val}` : val}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={executeAction}
                disabled={actionLoading || isGameOver}
                className="btn-primary disabled:opacity-50"
              >
                {actionLoading ? 'AI思考中...' : '执行下一步'}
              </button>
              <button
                onClick={toggleAutoRun}
                disabled={actionLoading || isGameOver}
                className={`${isAutoRun ? 'btn-danger' : 'btn-secondary'} disabled:opacity-50`}
              >
                {isAutoRun ? '停止自动' : '自动运行(5秒)'}
              </button>
            </div>
          </div>
        </div>

        {/* 游戏结束弹窗 */}
        {isGameOver && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="glass rounded-xl p-8 max-w-md text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
              <p className="text-dark-300 mb-2">{gameOverReason}</p>
              <p className="text-dark-400 text-sm mb-6">
                你们坚持了 {stepCount} 步，获得了 {characterPair?.relationship.joyfulMoments || 0} 次欢乐时刻
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setIsGameOver(false);
                    setStepCount(0);
                    initGame();
                  }}
                  className="btn-primary"
                >
                  重新开始
                </button>
                <button onClick={() => navigate('/lobby')} className="btn-secondary">
                  返回大厅
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 关卡视频播放器 */}
      {showLevelVideo && (
        <VideoPlayer
          videoUrl={`/video-level-${Math.floor(Math.random() * 3) + 1}.mp4`}
          onComplete={() => {
            setShowLevelVideo(false);
            if (pendingScenario) {
              setCurrentScenario(pendingScenario);
              setPendingScenario(null);
            }
          }}
          onSkip={() => {
            setShowLevelVideo(false);
            if (pendingScenario) {
              setCurrentScenario(pendingScenario);
              setPendingScenario(null);
            }
          }}
          autoPlay={true}
          showSkip={true}
        />
      )}
    </div>
  );
}

// 迷你属性条
function AttributeMini({ label, value }: { label: string; value: number }) {
  const isLow = value < 30;
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-dark-500 w-8">{label}</span>
      <div className="flex-1 attribute-bar">
        <div
          className={`attribute-bar-fill ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className={`text-xs w-6 text-right ${isLow ? 'text-red-400' : 'text-dark-400'}`}>
        {value}
      </span>
    </div>
  );
}
