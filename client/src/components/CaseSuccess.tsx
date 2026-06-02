import React, { useEffect, useState, useRef } from 'react';
import { CaseResult, DialogueMessage, generateSuccessReview } from '../services/dialogueService';
import { CharacterPair, Scenario } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS } from '../services/comicService';
import { getCurrentBadge, getNextBadge, getBadgeProgress } from '../services/badgeService';

interface CaseSuccessProps {
  caseNumber: number;
  result: CaseResult;
  pair: CharacterPair;
  scenario: Scenario;
  messages: DialogueMessage[];
  onNext: () => void;
  onBack: () => void;
  autoRun?: boolean;
}

export default function CaseSuccess({ caseNumber, result, pair, scenario, messages, onNext, onBack, autoRun }: CaseSuccessProps) {
  const [countdown, setCountdown] = useState(autoRun ? 3 : 0);
  const [review, setReview] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const abortRef = useRef(false);
  const currentBadge = getCurrentBadge(caseNumber);
  const nextBadge = getNextBadge(caseNumber);
  const progress = getBadgeProgress(caseNumber);

  // AI生成总结点评
  useEffect(() => {
    abortRef.current = false;
    setIsStreaming(true);

    const streamReview = async () => {
      try {
        for await (const token of generateSuccessReview(pair, scenario, messages, result)) {
          if (abortRef.current) return;
          setReview(prev => prev + token);
        }
      } catch (err) {
        console.error('Review stream error:', err);
      }
      setIsStreaming(false);
    };

    streamReview();

    return () => {
      abortRef.current = true;
    };
  }, [pair, scenario, messages, result]);

  // 自动运行倒计时
  useEffect(() => {
    if (!autoRun || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRun, countdown, onNext]);

  return (
    <div className="min-h-screen bg-dark-950 py-6 px-4 financial-grid flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* 成功标题 */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-2">
            恭喜顺利通关！
          </h1>
          <p className="text-dark-400">
            第 {caseNumber} 关挑战成功
          </p>
        </div>

        {/* 结果卡片 */}
        <div className="glass rounded-2xl p-6 mb-6">
          {/* 情绪结果 */}
          <div className="flex items-center justify-center space-x-3 mb-6 pb-6 border-b border-dark-700/50">
            <span className="text-4xl">{EMOTION_ICONS[result.emotion]}</span>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{EMOTION_LABELS[result.emotion]}</p>
              <p className="text-sm text-dark-400">本次挑战的情绪基调</p>
            </div>
          </div>

          {/* 属性变化 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 男性角色变化 */}
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                {pair.male.avatarUrl ? (
                  <img src={pair.male.avatarUrl} alt={pair.male.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                    {pair.male.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white">{pair.male.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.attributeChanges.male).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 女性角色变化 */}
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                {pair.female.avatarUrl ? (
                  <img src={pair.female.avatarUrl} alt={pair.female.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-sm font-bold">
                    {pair.female.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white">{pair.female.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.attributeChanges.female).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 关系变化 */}
          <div className="bg-dark-800/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">🤝 关系变化</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-400">和谐度</span>
                <span className={`font-medium ${result.relationshipChanges.harmony > 0 ? 'text-green-400' : result.relationshipChanges.harmony < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                  {result.relationshipChanges.harmony > 0 ? '+' : ''}{result.relationshipChanges.harmony}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-400">信任度</span>
                <span className={`font-medium ${result.relationshipChanges.trust > 0 ? 'text-green-400' : result.relationshipChanges.trust < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                  {result.relationshipChanges.trust > 0 ? '+' : ''}{result.relationshipChanges.trust}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI点评 */}
        <div className="glass rounded-xl p-4 mb-6 border-yellow-500/20">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="text-sm font-medium text-yellow-400">AI点评师总结</h3>
            {isStreaming && (
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            )}
          </div>
          <div className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap">
            {review || '正在生成点评...'}
          </div>
        </div>

        {/* 勋章进度 */}
        {nextBadge && (
          <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">勋章进度</span>
              <span className="text-xs text-dark-500">
                {caseNumber}/{nextBadge.requiredCases} → {nextBadge.name}
              </span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium transition-colors"
          >
            返回大厅
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-dark-900 font-bold transition-all shadow-lg shadow-yellow-500/20"
          >
            {autoRun ? `下一关 (${countdown}s)` : '下一关'}
          </button>
        </div>
      </div>
    </div>
  );
}
