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
                {Object.entries(result.attributesChange).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${(val as number) > 0 ? 'text-green-400' : (val as number) < 0 ? 'text-red-400' : 'text-dark-500'}`}>
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
                  <img src={pair.female.avatarUrl} alt={pair.female.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-sm font-bold">
                    {pair.female.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white">{pair.female.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.attributesChange).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${(val as number) > 0 ? 'text-green-400' : (val as number) < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                      {Math.floor((val as number) * 0.7) > 0 ? '+' : ''}{Math.floor((val as number) * 0.7)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 状态变化 */}
          <div className="bg-dark-800/30 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-white mb-3">📊 状态变化</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.statusChange).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">{key}</span>
                  <span className={`font-medium ${(val as number) > 0 ? 'text-green-400' : (val as number) < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                    {(val as number) > 0 ? '+' : ''}{val}
                  </span>
                </div>
              ))}
            </div>
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
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-dark-900 font-bold transition-all shadow-lg shadow-yellow-500/20 text-lg"
          >
            {autoRun ? `继续 (${countdown}s)` : '▶ 继续'}
          </button>
        </div>
      </div>
    </div>
  );
}
