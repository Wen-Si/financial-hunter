import React, { useEffect, useRef, useState } from 'react';
import { Scenario, CharacterPair } from '../types';
import { generateCaseIntroduction } from '../services/dialogueService';

interface CaseTransitionProps {
  scenario: Scenario;
  pair: CharacterPair;
  caseNumber: number;
  onComplete: () => void;
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

      // 自动运行模式下自动进入
      if (autoRun) {
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
      onComplete();
    }
  };

  // 难度星星
  const difficultyStars = '⭐'.repeat(scenario.difficulty);

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/financial-hunter/bg-transition.jpg)' }}
      />
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-dark-950/70" />
      
      <div className="max-w-3xl w-full relative z-10">
        {/* 顶部标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500/50"></div>
            <span className="text-xs text-yellow-600 tracking-widest uppercase">Case #{caseNumber}</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500/50"></div>
          </div>
          <h1 className="text-3xl font-bold text-gold-gradient mb-3">挑战下一关</h1>
          <div className="flex items-center justify-center space-x-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${categoryColors[scenario.category] || 'bg-dark-800 text-dark-400 border-dark-600'}`}>
              {scenario.category}
            </span>
            <span className="text-xs text-yellow-500">{difficultyStars}</span>
          </div>
        </div>

        {/* 案例标题 */}
        <div className="financial-card rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-3 text-yellow-500">📋</span>
            {scenario.title}
          </h2>

          {/* 流式输出的案例详情 */}
          <div className="min-h-[200px]">
            <div className="bg-dark-800/50 rounded-lg p-5 border border-dark-700/30">
              <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">
                {introText}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-yellow-400 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 案例背景信息（静态） */}
        {scenario.context && (
          <div className="financial-card rounded-xl p-5 mb-6">
            <h3 className="text-sm font-medium text-yellow-500/80 mb-3 flex items-center">
              <span className="mr-2">📌</span> 背景信息
            </h3>
            <p className="text-dark-300 text-sm leading-relaxed">{scenario.context}</p>
          </div>
        )}

        {/* 选项预览 */}
        {scenario.choices && scenario.choices.length > 0 && (
          <div className="financial-card rounded-xl p-5 mb-8">
            <h3 className="text-sm font-medium text-yellow-500/80 mb-3 flex items-center">
              <span className="mr-2">🎯</span> 可选方向
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scenario.choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="bg-dark-800/30 border border-dark-700/30 rounded-lg px-4 py-2.5 text-sm text-dark-300 flex items-center space-x-2"
                >
                  <span className="text-yellow-500 font-bold">{String.fromCharCode(65 + index)}</span>
                  <span>{choice.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 开始按钮 */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={isStreaming}
            className={`px-8 py-3 rounded-xl font-medium text-sm transition-all ${
              isStreaming
                ? 'bg-dark-800 text-dark-500 cursor-not-allowed border border-dark-700'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-dark-950 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/20'
            }`}
          >
            {isStreaming ? (
              <span className="flex items-center space-x-2">
                <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="ml-2">案例加载中...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>⚔️</span>
                <span>开始挑战</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
