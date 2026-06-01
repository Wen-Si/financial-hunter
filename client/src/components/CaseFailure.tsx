import React from 'react';
import { CharacterPair } from '../types';

interface CaseFailureProps {
  caseNumber: number;
  pair: CharacterPair;
  failureReason: string;
  onRetry: () => void;
  onBack: () => void;
}

export default function CaseFailure({ caseNumber, pair, failureReason, onRetry, onBack }: CaseFailureProps) {
  return (
    <div className="min-h-screen bg-dark-950 py-6 px-4 financial-grid flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* 失败标题 */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">😔</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-red-500 mb-2">
            通关失败
          </h1>
          <p className="text-dark-400">
            第 {caseNumber} 关挑战失败
          </p>
        </div>

        {/* 失败原因卡片 */}
        <div className="glass rounded-2xl p-6 mb-6 border-red-500/20">
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-white mb-2">失败原因</h2>
            <p className="text-red-400 text-lg">{failureReason}</p>
          </div>

          {/* 角色状态 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 男性角色状态 */}
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
                {Object.entries(pair.male.status).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${value <= 0 ? 'text-red-400' : value < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
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
                  <img src={pair.female.avatarUrl} alt={pair.female.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-sm font-bold">
                    {pair.female.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white">{pair.female.name}</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(pair.female.status).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{key}</span>
                    <span className={`font-medium ${value <= 0 ? 'text-red-400' : value < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
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
          <p className="text-dark-400 text-sm">
            别灰心！调整策略，重新挑战这一关吧！
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium transition-colors"
          >
            返回大厅
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-400 hover:from-red-400 hover:to-red-300 text-white font-bold transition-all shadow-lg shadow-red-500/20"
          >
            重新挑战
          </button>
        </div>
      </div>
    </div>
  );
}
