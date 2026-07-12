import React, { useEffect, useState } from 'react';
import { CharacterPair } from '../types';

interface CaseFailureProps {
  caseNumber: number;
  pair: CharacterPair;
  failureReason: string;
  onRetry: () => void;
  onBack: () => void;
  autoRun?: boolean;
}

export default function CaseFailure({ caseNumber, pair, failureReason, onRetry, onBack, autoRun }: CaseFailureProps) {
  const [countdown, setCountdown] = useState(autoRun ? 5 : 0);

  // 自动运行倒计时
  useEffect(() => {
    if (!autoRun || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRun, countdown, onRetry]);

  return (
    <div className="min-h-screen bg-dark-950 py-6 px-4 financial-grid flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* 失败标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-red-500/5">
            <span className="font-serif text-4xl text-red-400">败</span>
          </div>
          <h1 className="text-4xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-red-500 mb-2">
            通关失败
          </h1>
          <p className="text-dark-400 tabular-nums">
            第 {caseNumber} 关挑战失败
          </p>
        </div>

        {/* 失败原因卡片 */}
        <div
          className="financial-card rounded-2xl p-6 mb-6 animate-slide-in"
          style={{ borderLeft: '2px solid rgba(220, 38, 38, 0.5)' }}
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-white font-serif mb-2">失败原因</h2>
            <p className="text-red-400 text-lg leading-relaxed">{failureReason}</p>
          </div>

          {/* 角色状态 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 男性角色状态 */}
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
                {Object.entries(pair.male.status).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium tabular-nums ${value <= 0 ? 'text-red-400' : value < 30 ? 'text-gold-light' : 'text-gold'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 女性角色状态 */}
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
                {Object.entries(pair.female.status).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium tabular-nums ${value <= 0 ? 'text-red-400' : value < 30 ? 'text-gold-light' : 'text-gold'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 鼓励文字 */}
        <div className="text-center mb-6">
          <p className="text-dark-400 text-sm font-serif">
            别灰心，调整策略，重新挑战这一关
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            返回大厅
          </button>
          <button
            onClick={onRetry}
            className="btn-primary text-lg"
          >
            {autoRun ? `继续 (${countdown}s)` : '继续'}
          </button>
        </div>
      </div>
    </div>
  );
}
