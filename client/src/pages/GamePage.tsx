import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { avatarAPI } from '../services/api';
import { CharacterPair, Scenario, EmotionType } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS, EMOTION_COLORS } from '../services/comicService';
import DialoguePanel from '../components/DialoguePanel';
import {
  DialogueMessage,
  CaseResult,
  ThirdPartyCharacter,
  generateCaseIntroduction,
  determineDialogueStructure,
  generateSingleDialogue,
  generateCaseResult,
  shouldIntroduceThirdParty,
  generateThirdPartyDialogue,
} from '../services/dialogueService';
import * as scenarioService from '../services/scenarioService';
import * as localService from '../services/localStorage';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 角色对状态
  const [characterPair, setCharacterPair] = useState<CharacterPair | null>(null);

  // 游戏状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [caseCount, setCaseCount] = useState(0);

  // 当前场景
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);

  // 对话状态
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(12);
  const [firstSpeaker, setFirstSpeaker] = useState<'male' | 'female'>('male');
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);

  // 流式文本缓冲
  const streamingRef = useRef(false);
  const abortRef = useRef(false);

  // 自动运行状态
  const [isAutoRun, setIsAutoRun] = useState(false);
  const autoRunRef = useRef(false);

  // 已使用场景记录（确保不重复）
  const usedScenariosRef = useRef<Set<string>>(new Set());

  // 初始化游戏
  useEffect(() => {
    initGame();
    return () => {
      abortRef.current = true;
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

      // 选择第一个场景
      const pair = pairRes.data;
      const scenario = selectScenario(pair);
      if (scenario) {
        setCurrentScenario(scenario);
        localService.updateAvatar(pair.male.id, { currentScenario: scenario.id });
        localService.updateAvatar(pair.female.id, { currentScenario: scenario.id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化失败');
    } finally {
      setLoading(false);
    }
  };

  // 选择场景（确保不重复）
  const selectScenario = (pair: CharacterPair): Scenario | null => {
    const history = localService.getGameHistory(pair.male.id);

    // 获取所有可用场景
    const allScenarios = scenarioService.scenarios;

    // 过滤掉已使用的场景
    const availableScenarios = allScenarios.filter(
      s => !usedScenariosRef.current.has(s.id)
    );

    // 如果所有场景都用过了，重置记录
    if (availableScenarios.length === 0) {
      usedScenariosRef.current.clear();
      // 保留当前场景记录，避免立即重复
      if (currentScenario) {
        usedScenariosRef.current.add(currentScenario.id);
      }
    }

    // 从可用场景中选择
    const scenariosToChoose = availableScenarios.length > 0 ? availableScenarios : allScenarios;

    // 随机选择一个场景
    const randomIndex = Math.floor(Math.random() * scenariosToChoose.length);
    const selected = scenariosToChoose[randomIndex];

    // 记录已使用
    if (selected) {
      usedScenariosRef.current.add(selected.id);
    }

    return selected || null;
  };

  // ==========================================
  // 核心：启动案例对话流程
  // ==========================================
  const startCaseDialogue = useCallback(async () => {
    if (!characterPair || !currentScenario || streamingRef.current) return;

    abortRef.current = false;
    streamingRef.current = true;
    setIsStreaming(true);
    setCaseResult(null);
    setMessages([]);
    setCurrentRound(0);

    try {
      // 步骤1：流式生成案例介绍
      const introMsg: DialogueMessage = { role: 'narrator', content: '' };
      setMessages([introMsg]);

      for await (const token of generateCaseIntroduction(currentScenario, characterPair)) {
        if (abortRef.current) return;
        introMsg.content += token;
        setMessages([{ ...introMsg }]);
      }

      // 步骤2：确定对话轮数和发言顺序
      const structure = await determineDialogueStructure(currentScenario, characterPair);
      setTotalRounds(structure.totalRounds);
      setFirstSpeaker(structure.firstSpeaker);

      // 步骤3：逐轮生成对话（严格交替，可能引入第三方角色）
      let thirdParty: ThirdPartyCharacter | null = null;

      for (let round = 1; round <= structure.totalRounds; round++) {
        if (abortRef.current) return;

        // 检查是否引入第三方角色（AI决定）
        if (!thirdParty) {
          const newThirdParty = await shouldIntroduceThirdParty(
            characterPair,
            currentScenario,
            messages,
            round,
            structure.totalRounds
          );
          if (newThirdParty) {
            thirdParty = newThirdParty;
            // 第三方角色发言1-2轮
            for (let tpRound = 0; tpRound < 2 && round + tpRound <= structure.totalRounds; tpRound++) {
              const tpMsg: DialogueMessage = {
                role: 'thirdParty',
                content: '',
                thirdParty: thirdParty,
              };
              setMessages((prev) => [...prev, tpMsg]);
              setCurrentRound(round + tpRound);

              for await (const token of generateThirdPartyDialogue(
                characterPair,
                currentScenario,
                thirdParty,
                messages,
                round + tpRound,
                structure.totalRounds
              )) {
                if (abortRef.current) return;
                tpMsg.content += token;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...tpMsg };
                  return updated;
                });
              }
            }
            // 跳过已使用的轮数
            round += 1;
            continue;
          }
        }

        // 严格交替发言：奇数轮=firstSpeaker，偶数轮=另一方
        const speaker: 'male' | 'female' =
          round % 2 === 1
            ? structure.firstSpeaker
            : structure.firstSpeaker === 'male'
            ? 'female'
            : 'male';

        const dialogueMsg: DialogueMessage = { role: speaker, content: '' };
        setMessages((prev) => [...prev, dialogueMsg]);
        setCurrentRound(round);

        for await (const token of generateSingleDialogue(
          characterPair,
          currentScenario,
          speaker,
          messages,
          round,
          structure.totalRounds
        )) {
          if (abortRef.current) return;
          dialogueMsg.content += token;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...dialogueMsg };
            return updated;
          });
        }
      }

      // 步骤4：生成案例结果
      const resultText = await collectStreamText(
        generateCaseResult(characterPair, currentScenario, messages)
      );

      // 解析结果
      const result = parseCaseResult(resultText);
      setCaseResult(result);

      // 步骤5：应用结果到角色
      applyResult(result);

      // 自动运行模式下，延迟后自动进入下一关
      if (autoRunRef.current && !isGameOver) {
        setTimeout(() => {
          if (autoRunRef.current && !abortRef.current) {
            handleNextCase();
          }
        }, 3000); // 3秒后自动进入下一关
      }

    } catch (err) {
      console.error('Dialogue error:', err);
      setError('对话生成出错，请重试');
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
    }
  }, [characterPair, currentScenario, messages, isGameOver]);

  // 收集流式文本为完整字符串
  const collectStreamText = async (generator: AsyncGenerator<string>): Promise<string> => {
    let text = '';
    for await (const token of generator) {
      if (abortRef.current) return text;
      text += token;
    }
    return text;
  };

  // 解析案例结果
  const parseCaseResult = (text: string): CaseResult => {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          description: parsed.description || '案例已完成。',
          reasoning: parsed.reasoning || '',
          attributesChange: parsed.attributesChange || {},
          statusChange: parsed.statusChange || {},
          emotion: ['joy', 'conflict', 'sadness', 'tension', 'harmony', 'neutral'].includes(parsed.emotion)
            ? parsed.emotion as EmotionType
            : 'neutral',
        };
      }
    } catch (e) {
      console.warn('Failed to parse case result:', e);
    }
    return {
      description: text.slice(0, 200) || '案例已完成。',
      reasoning: '',
      attributesChange: { 专业知识: 5, 情商: 3 },
      statusChange: { 金钱: 5, 心情: 3 },
      emotion: 'neutral',
    };
  };

  // 应用结果到角色
  const applyResult = (result: CaseResult) => {
    if (!characterPair) return;

    const pair = { ...characterPair };

    // 更新男性角色属性
    const maleAttrs = { ...pair.male.attributes };
    const maleStatus = { ...pair.male.status };
    Object.entries(result.attributesChange).forEach(([key, val]) => {
      const k = key as keyof typeof maleAttrs;
      if (k in maleAttrs) maleAttrs[k] = Math.max(0, Math.min(1000, maleAttrs[k] + (val as number)));
    });
    Object.entries(result.statusChange).forEach(([key, val]) => {
      const k = key as keyof typeof maleStatus;
      if (k in maleStatus) maleStatus[k] = Math.max(0, Math.min(1000, maleStatus[k] + (val as number)));
    });
    pair.male = { ...pair.male, attributes: maleAttrs, status: maleStatus };

    // 更新女性角色属性（70%效果+心情加成）
    const femaleAttrs = { ...pair.female.attributes };
    const femaleStatus = { ...pair.female.status };
    Object.entries(result.attributesChange).forEach(([key, val]) => {
      const k = key as keyof typeof femaleAttrs;
      if (k in femaleAttrs) femaleAttrs[k] = Math.max(0, Math.min(1000, femaleAttrs[k] + Math.floor((val as number) * 0.7)));
    });
    Object.entries(result.statusChange).forEach(([key, val]) => {
      const k = key as keyof typeof femaleStatus;
      if (k in femaleStatus) {
        let v = Math.floor((val as number) * 0.7);
        if ((val as number) > 0 && k === '心情') v = (val as number) + 2;
        femaleStatus[k] = Math.max(0, Math.min(1000, femaleStatus[k] + v));
      }
    });
    pair.female = { ...pair.female, attributes: femaleAttrs, status: femaleStatus };

    // 更新关系
    const emotion = result.emotion;
    switch (emotion) {
      case 'joy':
        pair.relationship.harmony = Math.min(100, pair.relationship.harmony + 5);
        pair.relationship.trust = Math.min(100, pair.relationship.trust + 3);
        pair.relationship.joyfulMoments++;
        pair.currentEmotion = 'joy';
        break;
      case 'conflict':
        pair.relationship.harmony = Math.max(0, pair.relationship.harmony - 10);
        pair.relationship.trust = Math.max(0, pair.relationship.trust - 5);
        pair.relationship.conflicts++;
        pair.currentEmotion = 'conflict';
        break;
      case 'sadness':
        pair.relationship.harmony = Math.max(0, pair.relationship.harmony - 5);
        pair.currentEmotion = 'sadness';
        break;
      default:
        pair.currentEmotion = emotion;
    }

    // 保存
    localService.updateCharacterPair(pair);
    localService.updateAvatar(pair.male.id, { attributes: maleAttrs, status: maleStatus });
    localService.updateAvatar(pair.female.id, { attributes: femaleAttrs, status: femaleStatus });

    setCharacterPair(pair);
    setCaseCount((prev) => prev + 1);

    // 检查游戏结束
    if (maleStatus.金钱 <= 0 || maleStatus.健康 <= 0 || maleStatus.声望 <= 0 || maleStatus.心情 <= 0 ||
        femaleStatus.金钱 <= 0 || femaleStatus.健康 <= 0 || femaleStatus.声望 <= 0 || femaleStatus.心情 <= 0) {
      setIsGameOver(true);
      setGameOverReason('任一角色的状态值耗尽了！');
    }
  };

  // 进入下一个案例
  const handleNextCase = async () => {
    if (!characterPair) return;

    // 清除当前结果，准备下一关
    setCaseResult(null);
    setMessages([]);
    setCurrentRound(0);

    // 选择下一个场景
    const scenario = selectScenario(characterPair);
    if (scenario) {
      setCurrentScenario(scenario);
      localService.updateAvatar(characterPair.male.id, { currentScenario: scenario.id });
      localService.updateAvatar(characterPair.female.id, { currentScenario: scenario.id });

      // 视频播放已禁用，直接开始对话
      setTimeout(() => startCaseDialogue(), 500);
    } else {
      setError('没有更多可用场景了');
    }
  };

  // 切换自动运行模式
  const toggleAutoRun = () => {
    const newAutoRun = !isAutoRun;
    setIsAutoRun(newAutoRun);
    autoRunRef.current = newAutoRun;

    // 如果开启自动运行且当前案例已完成，立即进入下一关
    if (newAutoRun && caseResult && !isGameOver) {
      handleNextCase();
    }
  };

  // 首次加载时自动开始第一个案例的对话
  useEffect(() => {
    if (!loading && characterPair && currentScenario && !isStreaming && messages.length === 0 && !caseResult) {
      startCaseDialogue();
    }
  }, [loading, characterPair, currentScenario]);

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
    <div className="min-h-screen bg-dark-950 py-6 px-4 financial-grid">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 - 金融风格 */}
        <div className="flex items-center justify-between mb-6 financial-card rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/lobby')} className="text-dark-400 hover:text-yellow-400 transition-colors flex items-center">
              <span className="mr-1">←</span> 返回
            </button>
            <div className="h-6 w-px bg-dark-600 mx-2"></div>
            <h1 className="text-xl font-bold text-gold-gradient flex items-center">
              <span className="mr-2">📈</span> 金融猎手
            </h1>
            <span className="text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded flex items-center">
              <span className="mr-1">CASE</span> #{caseCount + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {characterPair && (
              <span className={`text-sm ${EMOTION_COLORS[characterPair.currentEmotion]}`}>
                {EMOTION_ICONS[characterPair.currentEmotion]} {EMOTION_LABELS[characterPair.currentEmotion]}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-red-200">✕</button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* 左侧：角色信息 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 角色对信息 */}
            {characterPair && (
              <>
                {/* 男性角色 */}
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {characterPair.male.avatarUrl ? (
                      <img src={characterPair.male.avatarUrl} alt={characterPair.male.name} className="w-10 h-10 rounded-lg object-cover border-2 border-blue-400/30" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">{characterPair.male.name.charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-sm">{characterPair.male.name}</h3>
                      <p className="text-xs text-dark-400">{characterPair.male.career.当前职位}</p>
                    </div>
                  </div>
                  {/* 6个核心属性 */}
                  <div className="space-y-1.5 mb-3">
                    <AttributeBar label="品格" value={characterPair.male.attributes.品格} color="purple" icon="⚖️" />
                    <AttributeBar label="情商" value={characterPair.male.attributes.情商} color="pink" icon="💬" />
                    <AttributeBar label="专业知识" value={characterPair.male.attributes.专业知识} color="blue" icon="📚" />
                    <AttributeBar label="人脉" value={characterPair.male.attributes.人脉} color="green" icon="🌐" />
                    <AttributeBar label="抗压能力" value={characterPair.male.attributes.抗压能力} color="orange" icon="💪" />
                    <AttributeBar label="运气" value={characterPair.male.attributes.运气} color="yellow" icon="🍀" />
                  </div>
                  {/* 4个状态属性 */}
                  <div className="pt-3 border-t border-dark-700/50 space-y-1.5">
                    <StatusBar label="金钱" value={characterPair.male.status.金钱} icon="💰" />
                    <StatusBar label="心情" value={characterPair.male.status.心情} icon="😊" />
                    <StatusBar label="健康" value={characterPair.male.status.健康} icon="❤️" />
                    <StatusBar label="声望" value={characterPair.male.status.声望} icon="⭐" />
                  </div>
                </div>

                {/* 女性角色 */}
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {characterPair.female.avatarUrl ? (
                      <img src={characterPair.female.avatarUrl} alt={characterPair.female.name} className="w-10 h-10 rounded-lg object-cover border-2 border-pink-400/30" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">{characterPair.female.name.charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-sm">{characterPair.female.name}</h3>
                      <p className="text-xs text-dark-400">{characterPair.female.career.当前职位}</p>
                    </div>
                  </div>
                  {/* 6个核心属性 */}
                  <div className="space-y-1.5 mb-3">
                    <AttributeBar label="品格" value={characterPair.female.attributes.品格} color="purple" icon="⚖️" />
                    <AttributeBar label="情商" value={characterPair.female.attributes.情商} color="pink" icon="💬" />
                    <AttributeBar label="专业知识" value={characterPair.female.attributes.专业知识} color="blue" icon="📚" />
                    <AttributeBar label="人脉" value={characterPair.female.attributes.人脉} color="green" icon="🌐" />
                    <AttributeBar label="抗压能力" value={characterPair.female.attributes.抗压能力} color="orange" icon="💪" />
                    <AttributeBar label="运气" value={characterPair.female.attributes.运气} color="yellow" icon="🍀" />
                  </div>
                  {/* 4个状态属性 */}
                  <div className="pt-3 border-t border-dark-700/50 space-y-1.5">
                    <StatusBar label="金钱" value={characterPair.female.status.金钱} icon="💰" />
                    <StatusBar label="心情" value={characterPair.female.status.心情} icon="😊" />
                    <StatusBar label="健康" value={characterPair.female.status.健康} icon="❤️" />
                    <StatusBar label="声望" value={characterPair.female.status.声望} icon="⭐" />
                  </div>
                </div>

                {/* 合作关系 */}
                <div className="glass rounded-xl p-4">
                  <h4 className="text-xs font-medium text-dark-400 mb-2">合作关系</h4>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-dark-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-400">{characterPair.relationship.harmony}</div>
                      <div className="text-xs text-dark-500">和谐度</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-400">{characterPair.relationship.trust}</div>
                      <div className="text-xs text-dark-500">信任度</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 右侧：对话面板 */}
          <div className="lg:col-span-8">
            {currentScenario && (
              <DialoguePanel
                messages={messages}
                isStreaming={isStreaming}
                currentRound={currentRound}
                totalRounds={totalRounds}
                pair={characterPair}
                caseResult={caseResult}
                onExecuteNext={handleNextCase}
              />
            )}
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={toggleAutoRun}
            disabled={isGameOver}
            className={`px-6 py-3 rounded-full font-medium text-sm shadow-lg transition-all flex items-center space-x-2 ${
              isAutoRun
                ? 'bg-green-500 hover:bg-green-400 text-white'
                : 'bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-600'
            } ${isGameOver ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAutoRun ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>🤖 自动运行中</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>自动运行</span>
              </>
            )}
          </button>
        </div>

        {/* 游戏结束弹窗 */}
        {isGameOver && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="glass rounded-xl p-8 max-w-md text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
              <p className="text-dark-400 mb-2">{gameOverReason}</p>
              <p className="text-dark-500 text-sm mb-6">共完成了 {caseCount} 个案例</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setIsGameOver(false);
                    setCaseCount(0);
                    navigate('/lobby');
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
    </div>
  );
}

// 6个核心属性条（带颜色和图标）
function AttributeBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', bar: 'bg-pink-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  };
  const colors = colorMap[color] || colorMap.blue;
  const percentage = Math.min(100, (value / 100) * 100);

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-xs ${colors.text} w-5`}>{icon}</span>
      <span className="text-xs text-dark-400 w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs w-8 text-right ${colors.text} font-medium`}>{value}</span>
    </div>
  );
}

// 4个状态属性条（金融风格）
function StatusBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const isLow = value < 30;
  const isHigh = value > 70;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-dark-500 w-5">{icon}</span>
      <span className="text-xs text-dark-400 w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden border border-dark-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isLow ? 'bg-red-500' : isHigh ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
        />
      </div>
      <span className={`text-xs w-8 text-right font-medium ${
        isLow ? 'text-red-400' : isHigh ? 'text-green-400' : 'text-yellow-400'
      }`}>
        {value}
      </span>
    </div>
  );
}
