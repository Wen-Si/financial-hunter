import React, { useEffect, useState } from 'react';
import { CaseResult } from '../services/dialogueService';
import { CharacterPair } from '../types';
import { EMOTION_ICONS, EMOTION_LABELS } from '../services/comicService';
import { getCurrentBadge, getNextBadge, getBadgeProgress } from '../services/badgeService';

interface CaseSuccessProps {
  caseNumber: number;
  result: CaseResult;
  pair: CharacterPair;
  onNext: () => void;
  onBack: () => void;
  autoRun?: boolean;
}

export default function CaseSuccess({ caseNumber, result, pair, onNext, onBack, autoRun }: CaseSuccessProps) {
  const [countdown, setCountdown] = useState(autoRun ? 5 : 0);
  const currentBadge = getCurrentBadge(caseNumber);
  const nextBadge = getNextBadge(caseNumber);
  const progress = getBadgeProgress(caseNumber);

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
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-4 flex justify-center">
            <svg className="w-20 h-20 text-gold animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.5 11.5L17 22l-5-3-5 3 1.5-10.5" />
              <path d="M9.5 8l1.8 1.8L14.5 6.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold font-serif text-gold-gradient mb-2">
            恭喜顺利通关！
          </h1>
          <p className="text-dark-400 tabular-nums">
            第 {caseNumber} 关挑战成功
          </p>
        </div>

        {/* 结果卡片 */}
        <div className="financial-card rounded-2xl p-6 mb-6 animate-slide-in">
          {/* 情绪结果 */}
          <div className="flex items-center justify-center space-x-3 mb-6 pb-6 border-b border-dark-700/50">
            <svg className="w-10 h-10 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
            </svg>
            <div className="text-center">
              <p className="text-lg font-semibold text-white font-serif">{EMOTION_LABELS[result.emotion]}</p>
              <p className="text-sm text-dark-400">本次挑战的情绪基调</p>
            </div>
          </div>

          {/* 属性变化 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 男性角色变化 */}
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                {pair.male.avatarUrl ? (
                  <img src={pair.male.avatarUrl} alt={pair.male.name} className="w-8 h-8 rounded-lg object-cover border border-gold/20" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold-light text-sm font-bold border border-gold/20">
                    {pair.male.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white font-serif">{pair.male.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.attributesChange).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium tabular-nums ${(val as number) > 0 ? 'text-gold-light' : (val as number) < 0 ? 'text-gold-dark' : 'text-dark-500'}`}>
                      {(val as number) > 0 ? '+' : ''}{val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 女性角色变化 */}
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                {pair.female.avatarUrl ? (
                  <img src={pair.female.avatarUrl} alt={pair.female.name} className="w-8 h-8 rounded-lg object-cover border border-gold/20" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold-light text-sm font-bold border border-gold/20">
                    {pair.female.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white font-serif">{pair.female.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.attributesChange).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium tabular-nums ${Math.floor((val as number) * 0.7) > 0 ? 'text-gold-light' : Math.floor((val as number) * 0.7) < 0 ? 'text-gold-dark' : 'text-dark-500'}`}>
                      {Math.floor((val as number) * 0.7) > 0 ? '+' : ''}{Math.floor((val as number) * 0.7)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 状态变化 */}
          <div className="bg-dark-800/30 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
              <span>状态变化</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.statusChange).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">{key}</span>
                  <span className={`font-medium tabular-nums ${(val as number) > 0 ? 'text-gold-light' : (val as number) < 0 ? 'text-gold-dark' : 'text-dark-500'}`}>
                    {(val as number) > 0 ? '+' : ''}{val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 勋章进度 */}
        {nextBadge && (
          <div className="glass rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">勋章进度</span>
              <span className="text-xs text-dark-500 tabular-nums">
                {caseNumber}/{nextBadge.requiredCases} → {nextBadge.name}
              </span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-dark to-gold-light rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            返回大厅
          </button>
          <button
            onClick={onNext}
            className="btn-primary text-lg"
          >
            {autoRun ? `继续 (${countdown}s)` : '继续'}
          </button>
        </div>
      </div>
    </div>
  );
}
