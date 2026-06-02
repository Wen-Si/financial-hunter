import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { avatarAPI } from '../services/api';
import { CharacterPair, Scenario, EmotionType } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS, EMOTION_COLORS } from '../services/comicService';
import { getCurrentBadge, getNextBadge, getBadgeProgress, Badge } from '../services/badgeService';
import { getUnlockedQualifications, getNextQualification, isJustUnlocked, Qualification } from '../services/qualificationService';
import DialoguePanel from '../components/DialoguePanel';
import CaseTransition from '../components/CaseTransition';
import CaseSuccess from '../components/CaseSuccess';
import CaseFailure from '../components/CaseFailure';
import {
  DialogueMessage,
  CaseResult,
  ThirdPartyCharacter,
  determineDialogueStructure,
  generateSingleDialogue,
  generateCaseResult,
  shouldIntroduceThirdParty,
  generateThirdPartyDialogue,
} from '../services/dialogueService';
import * as scenarioService from '../services/scenarioService';
import * as localService from '../services/localStorage';

// 游戏阶段
type GamePhase = 'transition' | 'dialogue' | 'success' | 'failure' | 'result';

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
  const [phase, setPhase] = useState<GamePhase>('transition'); // transition | dialogue | result

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
    const allScenarios = scenarioService.scenarios;
    const availableScenarios = allScenarios.filter(
      s => !usedScenariosRef.current.has(s.id)
    );

    if (availableScenarios.length === 0) {
      usedScenariosRef.current.clear();
      if (currentScenario) {
        usedScenariosRef.current.add(currentScenario.id);
      }
    }

    const scenariosToChoose = availableScenarios.length > 0 ? availableScenarios : allScenarios;
    const randomIndex = Math.floor(Math.random() * scenariosToChoose.length);
    const selected = scenariosToChoose[randomIndex];

    if (selected) {
      usedScenariosRef.current.add(selected.id);
    }

    return selected || null;
  };

  // ==========================================
  // 过渡页面完成 → 进入对话
  // ==========================================
  const handleTransitionComplete = useCallback(() => {
    setPhase('dialogue');
    setTimeout(() => startCaseDialogue(), 300);
  }, [characterPair, currentScenario]);

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
      // 步骤1：确定对话轮数和发言顺序
      const structure = await determineDialogueStructure(currentScenario, characterPair);
      setTotalRounds(structure.totalRounds);
      setFirstSpeaker(structure.firstSpeaker);

      // 步骤2：逐轮生成对话（严格交替，可能引入第三方角色）
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
            round += 1;
            continue;
          }
        }

        // 严格交替发言
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

        // 每轮对话结束后停顿3秒（除了最后一轮）
        if (round < structure.totalRounds) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // 步骤3：生成案例结果
      const resultText = await collectStreamText(
        generateCaseResult(characterPair, currentScenario, messages)
      );

      const result = parseCaseResult(resultText);
      setCaseResult(result);
      setPhase('result');

      // 步骤4：应用结果到角色
      applyResult(result);

      // 自动运行模式下，延迟后自动进入下一关
      if (autoRunRef.current && !isGameOver) {
        setTimeout(() => {
          if (autoRunRef.current && !abortRef.current) {
            handleNextCase();
          }
        }, 3000);
      }

    } catch (err) {
      console.error('Dialogue error:', err);
      setError('对话生成出错，请重试');
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
    }
  }, [characterPair, currentScenario, messages, isGameOver]);

  const collectStreamText = async (generator: AsyncGenerator<string>): Promise<string> => {
    let text = '';
    for await (const token of generator) {
      if (abortRef.current) return text;
      text += token;
    }
    return text;
  };

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

  const applyResult = (result: CaseResult) => {
    if (!characterPair) return;
    const pair = { ...characterPair };

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

    localService.updateCharacterPair(pair);
    localService.updateAvatar(pair.male.id, { attributes: maleAttrs, status: maleStatus });
    localService.updateAvatar(pair.female.id, { attributes: femaleAttrs, status: femaleStatus });

    setCharacterPair(pair);
    setCaseCount((prev) => prev + 1);

    // 检查是否通关失败（任一状态值耗尽）
    if (maleStatus.金钱 <= 0 || maleStatus.健康 <= 0 || maleStatus.声望 <= 0 || maleStatus.心情 <= 0 ||
        femaleStatus.金钱 <= 0 || femaleStatus.健康 <= 0 || femaleStatus.声望 <= 0 || femaleStatus.心情 <= 0) {
      setPhase('failure');
      setGameOverReason('任一角色的状态值耗尽了！');
    } else {
      // 通关成功
      setPhase('success');
    }
  };

  // 进入下一个案例 → 显示过渡页面
  const handleNextCase = async () => {
    if (!characterPair) return;

    setCaseResult(null);
    setMessages([]);
    setCurrentRound(0);

    const scenario = selectScenario(characterPair);
    if (scenario) {
      setCurrentScenario(scenario);
      localService.updateAvatar(characterPair.male.id, { currentScenario: scenario.id });
      localService.updateAvatar(characterPair.female.id, { currentScenario: scenario.id });
      // 进入过渡页面
      setPhase('transition');
    } else {
      setError('没有更多可用场景了');
    }
  };

  const toggleAutoRun = () => {
    const newAutoRun = !isAutoRun;
    setIsAutoRun(newAutoRun);
    autoRunRef.current = newAutoRun;

    if (newAutoRun && caseResult && !isGameOver) {
      handleNextCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">📈</div>
          <div className="flex items-center justify-center space-x-1">
            <div className="loading-dot w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
          <p className="text-dark-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 过渡页面
  // ==========================================
  if (phase === 'transition' && currentScenario && characterPair) {
    return (
      <>
        <CaseTransition
          scenario={currentScenario}
          pair={characterPair}
          caseNumber={caseCount + 1}
          onComplete={handleTransitionComplete}
          autoRun={isAutoRun}
        />
        {/* 自动运行按钮 - 右下方 */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleAutoRun}
            className={`px-6 py-3 rounded-full font-medium text-sm shadow-lg transition-all flex items-center space-x-2 ${
              isAutoRun
                ? 'bg-green-500 hover:bg-green-400 text-white'
                : 'bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-600'
            }`}
          >
            {isAutoRun ? (
              <><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span><span>🤖 自动运行中</span></>
            ) : (
              <><span>▶</span><span>自动运行</span></>
            )}
          </button>
        </div>
      </>
    );
  }

  // ==========================================
  // 通关成功页面
  // ==========================================
  if (phase === 'success' && caseResult && characterPair && currentScenario) {
    return (
      <CaseSuccess
        caseNumber={caseCount}
        result={caseResult}
        pair={characterPair}
        scenario={currentScenario}
        messages={messages}
        onNext={handleNextCase}
        onBack={() => navigate('/lobby')}
        autoRun={isAutoRun}
      />
    );
  }

  // ==========================================
  // 通关失败页面
  // ==========================================
  if (phase === 'failure' && characterPair && currentScenario) {
    return (
      <CaseFailure
        caseNumber={caseCount}
        pair={characterPair}
        scenario={currentScenario}
        messages={messages}
        failureReason={gameOverReason}
        onRetry={() => {
          // 重置当前关卡的对话，重新挑战
          setPhase('dialogue');
          setMessages([]);
          setCurrentRound(0);
          startCaseDialogue();
        }}
        onBack={() => navigate('/lobby')}
      />
    );
  }

  // ==========================================
  // 对话/结果页面 - 新布局
  // ==========================================
  return (
    <div className="min-h-screen py-4 px-4 relative" style={{ overflow: 'hidden' }}>
      {/* 背景图片 */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url(/financial-hunter/bg-game.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* 遮罩层 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)' }} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4 financial-card rounded-xl p-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/lobby')} className="text-dark-400 hover:text-yellow-400 transition-colors flex items-center text-sm">
              <span className="mr-1">←</span> 返回
            </button>
            <div className="h-5 w-px bg-dark-600"></div>
            <h1 className="text-lg font-bold text-gold-gradient flex items-center">
              <span className="mr-1">📈</span> 金融猎手
            </h1>
            <span className="text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
              CASE #{caseCount + 1}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* 勋章显示 */}
            <BadgeDisplay completedCases={caseCount} />
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

        {/* 新布局：左上案例 + 左下角色 + 右侧对话 */}
        <div className="grid lg:grid-cols-12 gap-4" style={{ height: 'calc(100vh - 120px)' }}>
          {/* 左侧列 */}
          <div className="lg:col-span-4 flex flex-col space-y-4 overflow-hidden">
            {/* 左上：案例介绍 */}
            {currentScenario && (
              <div className="financial-card rounded-xl p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-white flex items-center">
                    <span className="mr-2 text-yellow-500">📋</span>
                    {currentScenario.title}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded">
                      {currentScenario.category}
                    </span>
                    <span className="text-xs text-yellow-600">
                      {'⭐'.repeat(currentScenario.difficulty)}
                    </span>
                  </div>
                </div>
                <p className="text-dark-300 text-xs leading-relaxed line-clamp-3">
                  {currentScenario.description}
                </p>
                {currentScenario.context && (
                  <div className="mt-2 pt-2 border-t border-dark-700/30">
                    <p className="text-dark-400 text-xs leading-relaxed line-clamp-2">
                      📌 {currentScenario.context}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 左下：角色信息（可滚动） */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {characterPair && (
                <>
                  {/* 男性角色 */}
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      {characterPair.male.avatarUrl ? (
                        <img src={characterPair.male.avatarUrl} alt={characterPair.male.name} className="w-8 h-8 rounded-lg object-cover border-2 border-blue-400/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">{characterPair.male.name.charAt(0)}</div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-xs">{characterPair.male.name}</h3>
                        <p className="text-xs text-dark-500">{characterPair.male.career.当前职位}</p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      <AttributeBar label="品格" value={characterPair.male.attributes.品格} color="purple" icon="⚖️" />
                      <AttributeBar label="情商" value={characterPair.male.attributes.情商} color="pink" icon="💬" />
                      <AttributeBar label="专业知识" value={characterPair.male.attributes.专业知识} color="blue" icon="📚" />
                      <AttributeBar label="人脉" value={characterPair.male.attributes.人脉} color="green" icon="🌐" />
                      <AttributeBar label="抗压" value={characterPair.male.attributes.抗压能力} color="orange" icon="💪" />
                      <AttributeBar label="运气" value={characterPair.male.attributes.运气} color="yellow" icon="🍀" />
                    </div>
                    <div className="pt-2 border-t border-dark-700/30 space-y-1">
                      <StatusBar label="金钱" value={characterPair.male.status.金钱} icon="💰" />
                      <StatusBar label="心情" value={characterPair.male.status.心情} icon="😊" />
                      <StatusBar label="健康" value={characterPair.male.status.健康} icon="❤️" />
                      <StatusBar label="声望" value={characterPair.male.status.声望} icon="⭐" />
                    </div>
                  </div>

                  {/* 女性角色 */}
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      {characterPair.female.avatarUrl ? (
                        <img src={characterPair.female.avatarUrl} alt={characterPair.female.name} className="w-8 h-8 rounded-lg object-cover border-2 border-pink-400/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs">{characterPair.female.name.charAt(0)}</div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-xs">{characterPair.female.name}</h3>
                        <p className="text-xs text-dark-500">{characterPair.female.career.当前职位}</p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      <AttributeBar label="品格" value={characterPair.female.attributes.品格} color="purple" icon="⚖️" />
                      <AttributeBar label="情商" value={characterPair.female.attributes.情商} color="pink" icon="💬" />
                      <AttributeBar label="专业知识" value={characterPair.female.attributes.专业知识} color="blue" icon="📚" />
                      <AttributeBar label="人脉" value={characterPair.female.attributes.人脉} color="green" icon="🌐" />
                      <AttributeBar label="抗压" value={characterPair.female.attributes.抗压能力} color="orange" icon="💪" />
                      <AttributeBar label="运气" value={characterPair.female.attributes.运气} color="yellow" icon="🍀" />
                    </div>
                    <div className="pt-2 border-t border-dark-700/30 space-y-1">
                      <StatusBar label="金钱" value={characterPair.female.status.金钱} icon="💰" />
                      <StatusBar label="心情" value={characterPair.female.status.心情} icon="😊" />
                      <StatusBar label="健康" value={characterPair.female.status.健康} icon="❤️" />
                      <StatusBar label="声望" value={characterPair.female.status.声望} icon="⭐" />
                    </div>
                  </div>

                  {/* 合作关系 */}
                  <div className="glass rounded-xl p-3">
                    <h4 className="text-xs font-medium text-dark-400 mb-1.5">合作关系</h4>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-dark-800/50 rounded-lg p-1.5">
                        <div className="text-base font-bold text-green-400">{characterPair.relationship.harmony}</div>
                        <div className="text-xs text-dark-500">和谐度</div>
                      </div>
                      <div className="bg-dark-800/50 rounded-lg p-1.5">
                        <div className="text-base font-bold text-blue-400">{characterPair.relationship.trust}</div>
                        <div className="text-xs text-dark-500">信任度</div>
                      </div>
                    </div>
                  </div>

                  {/* 职业资质 */}
                  <QualificationDisplay caseCount={caseCount} />
                </>
              )}
            </div>
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

        {/* 自动运行按钮 - 右下方 */}
        <div className="fixed bottom-6 right-6 z-40">
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
              <><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span><span>🤖 自动运行中</span></>
            ) : (
              <><span>▶</span><span>自动运行</span></>
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
                <button onClick={() => { setIsGameOver(false); setCaseCount(0); navigate('/lobby'); }} className="btn-primary">
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

// 6个核心属性条
function AttributeBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colorMap: Record<string, { text: string; bar: string }> = {
    purple: { text: 'text-purple-400', bar: 'bg-purple-500' },
    pink: { text: 'text-pink-400', bar: 'bg-pink-500' },
    blue: { text: 'text-blue-400', bar: 'bg-blue-500' },
    green: { text: 'text-green-400', bar: 'bg-green-500' },
    orange: { text: 'text-orange-400', bar: 'bg-orange-500' },
    yellow: { text: 'text-yellow-400', bar: 'bg-yellow-500' },
  };
  const colors = colorMap[color] || colorMap.blue;
  const percentage = Math.min(100, (value / 100) * 100);

  return (
    <div className="flex items-center space-x-1.5">
      <span className={`text-xs ${colors.text} w-4`}>{icon}</span>
      <span className="text-xs text-dark-400 w-12">{label}</span>
      <div className="flex-1 h-1 bg-dark-800 rounded-full overflow-hidden">
        <div className={`h-full ${colors.bar} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <span className={`text-xs w-6 text-right ${colors.text} font-medium`}>{value}</span>
    </div>
  );
}

// 4个状态属性条
function StatusBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const isLow = value < 30;
  const isHigh = value > 70;

  return (
    <div className="flex items-center space-x-1.5">
      <span className="text-xs text-dark-500 w-4">{icon}</span>
      <span className="text-xs text-dark-400 w-12">{label}</span>
      <div className="flex-1 h-1 bg-dark-800 rounded-full overflow-hidden border border-dark-700/30">
        <div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : isHigh ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (value / 100) * 100)}%` }} />
      </div>
      <span className={`text-xs w-6 text-right font-medium ${isLow ? 'text-red-400' : isHigh ? 'text-green-400' : 'text-yellow-400'}`}>{value}</span>
    </div>
  );
}

// 勋章显示组件
function BadgeDisplay({ completedCases }: { completedCases: number }) {
  const currentBadge = getCurrentBadge(completedCases);
  const nextBadge = getNextBadge(completedCases);
  const progress = getBadgeProgress(completedCases);

  if (!currentBadge && !nextBadge) return null;

  return (
    <div className="flex items-center space-x-2">
      {currentBadge ? (
        <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg ${currentBadge.bgColor} border border-${currentBadge.color.split('-')[1]}-500/30`}>
          <span className="text-base">{currentBadge.icon}</span>
          <span className={`text-xs font-medium ${currentBadge.color}`}>{currentBadge.name}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-dark-800/50 border border-dark-600">
          <span className="text-base">🏅</span>
          <span className="text-xs text-dark-400">未获得勋章</span>
        </div>
      )}
      
      {nextBadge && (
        <div className="hidden sm:flex items-center space-x-1 text-xs text-dark-500">
          <span>→</span>
          <span>{nextBadge.requiredCases - completedCases}关后{nextBadge.name}</span>
        </div>
      )}
    </div>
  );
}

// 职业资质显示组件
function QualificationDisplay({ caseCount }: { caseCount: number }) {
  const unlocked = getUnlockedQualifications(caseCount);
  const next = getNextQualification(caseCount);

  return (
    <div className="glass rounded-xl p-3">
      <h4 className="text-xs font-medium text-dark-400 mb-2">职业资质</h4>
      
      {/* 已解锁资质 */}
      {unlocked.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {unlocked.map((q) => (
            <div
              key={q.id}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${q.bgColor} border border-opacity-30`}
              style={{ borderColor: 'currentColor' }}
            >
              <span className="text-sm">{q.icon}</span>
              <span className={`text-xs font-medium ${q.color}`}>{q.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* 下一个待解锁 */}
      {next && (
        <div className="text-xs text-dark-500">
          <span className="text-dark-400">{next.requiredCases - caseCount}关后解锁: </span>
          <span className="text-dark-300">{next.icon} {next.name}</span>
        </div>
      )}
      
      {/* 全部解锁 */}
      {!next && unlocked.length > 0 && (
        <div className="text-xs text-green-400">🎉 已获得全部资质</div>
      )}
    </div>
  );
}
