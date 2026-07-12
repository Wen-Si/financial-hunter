import React, { useEffect, useRef, useState } from 'react';
import { Scenario, CharacterPair } from '../types';
import { generateCaseIntroduction } from '../services/dialogueService';

interface CaseTransitionProps {
  scenario: Scenario;
  pair: CharacterPair;
  caseNumber: number;
  onComplete: (selectedChoiceId?: string) => void;
  autoRun: boolean;
}

export default function CaseTransition({
  scenario,
  pair,
  caseNumber,
  onComplete,
  autoRun,
}: CaseTransitionProps) {
  const [introText, setIntroText] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const streamingRef = useRef(false);
  const abortRef = useRef(false);

  useEffect(() => {
    streamingRef.current = true;
    abortRef.current = false;

    const streamIntro = async () => {
      let text = '';
      try {
        for await (const token of generateCaseIntroduction(scenario, pair)) {
          if (abortRef.current) return;
          text += token;
          setIntroText(text);
        }
      } catch (err) {
        console.error('Stream error:', err);
      }
      setIsStreaming(false);
      streamingRef.current = false;

      // 自动运行模式下自动选择第一个选项并进入
      if (autoRun && scenario.choices && scenario.choices.length > 0) {
        setSelectedChoiceId(scenario.choices[0].id);
        setTimeout(() => {
          if (!abortRef.current) onComplete(scenario.choices[0].id);
        }, 3000);
      } else if (autoRun) {
        setTimeout(() => {
          if (!abortRef.current) onComplete();
        }, 3000);
      }
    };

    streamIntro();

    return () => {
      abortRef.current = true;
    };
  }, []);

  const handleStart = () => {
    if (!streamingRef.current) {
      onComplete(selectedChoiceId || undefined);
    }
  };

  const canStart = !isStreaming && (!scenario.choices || scenario.choices.length === 0 || selectedChoiceId !== null);

  // 难度等级（金色圆点，替代 emoji 星星）
  const difficultyDots = Array.from({ length: scenario.difficulty });

  // 分类标签颜色
  const categoryColors: Record<string, string> = {
    '投行': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    '基金': 'bg-green-500/20 text-green-400 border-green-500/30',
    '银行': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    '保险': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    '监管': 'bg-red-500/20 text-red-400 border-red-500/30',
    '风控': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    '职场': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ overflow: 'hidden' }}>
      {/* 背景图片 */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url(/financial-hunter/bg-transition.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* 遮罩层 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)' }} />
      
      <div className="max-w-3xl w-full relative z-10">
        {/* 顶部标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50"></div>
            <span className="text-xs text-gold tracking-widest uppercase tabular-nums">Case #{caseNumber}</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50"></div>
          </div>
          <h1 className="text-3xl font-bold font-serif text-gold-gradient mb-3">挑战下一关</h1>
          <div className="flex items-center justify-center space-x-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${categoryColors[scenario.category] || 'bg-dark-800 text-dark-400 border-dark-600'}`}>
              {scenario.category}
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="text-xs text-dark-400">难度</span>
              <span className="flex items-center space-x-1">
                {difficultyDots.map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                ))}
              </span>
            </span>
          </div>
        </div>

        {/* 案例标题 */}
        <div className="financial-card rounded-xl p-6 mb-6 animate-slide-in">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-3">
            <svg className="w-5 h-5 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h8M8 9h2" />
            </svg>
            <span className="font-serif text-gold-gradient">{scenario.title}</span>
          </h2>

          {/* 流式输出的案例详情 */}
          <div className="min-h-[200px]">
            <div className="glass-strong rounded-lg p-5">
              <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">
                {introText}
                {isStreaming && <span className="streaming-cursor" />}
              </p>
            </div>
          </div>
        </div>

        {/* 可选方向 - 玩家需要选择 */}
        {scenario.choices && scenario.choices.length > 0 && (
          <div className="financial-card rounded-xl p-5 mb-8 animate-slide-in">
            <h3 className="text-sm font-medium text-gold/80 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              <span>请选择你的方向</span>
              {!selectedChoiceId && !isStreaming && (
                <span className="text-xs text-dark-400">（点击选择）</span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenario.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => setSelectedChoiceId(choice.id)}
                    disabled={isStreaming}
                    className={`text-left rounded-lg px-4 py-3 text-sm flex items-start space-x-3 transition-all ${
                      isSelected
                        ? 'card-hover border-2 border-gold bg-gold/10 text-gold-light shadow-lg shadow-gold/10'
                        : isStreaming
                          ? 'financial-card opacity-60 cursor-not-allowed text-dark-500'
                          : 'financial-card card-hover cursor-pointer text-dark-300'
                    }`}
                  >
                    <span className={`font-bold mt-0.5 ${isSelected ? 'text-gold-light' : 'text-gold/60'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="leading-relaxed">{choice.text}</span>
                    {isSelected && (
                      <svg className="ml-auto w-4 h-4 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 开始按钮 */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="btn-primary text-lg"
          >
            {isStreaming ? (
              <span className="flex items-center space-x-2">
                <span className="loading-dot w-1.5 h-1.5 bg-navy rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-navy rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-navy rounded-full"></span>
                <span className="ml-2">案例加载中...</span>
              </span>
            ) : !selectedChoiceId && scenario.choices && scenario.choices.length > 0 ? (
              <span>请先选择方向</span>
            ) : (
              <span>开始挑战</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
