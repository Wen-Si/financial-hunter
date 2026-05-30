import React, { useEffect, useRef, useState } from 'react';
import { DialogueMessage, CaseResult } from '../services/dialogueService';
import { CharacterPair } from '../types';
import { EMOTION_ICONS } from '../services/comicService';

interface DialoguePanelProps {
  messages: DialogueMessage[];
  isStreaming: boolean;
  currentRound: number;
  totalRounds: number;
  pair: CharacterPair | null;
  caseResult: CaseResult | null;
  onExecuteNext: () => void;
  autoScroll?: boolean;
}

export default function DialoguePanel({
  messages,
  isStreaming,
  currentRound,
  totalRounds,
  pair,
  caseResult,
  onExecuteNext,
  autoScroll = true,
}: DialoguePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const getSpeakerName = (role: string) => {
    if (role === 'male') return pair?.male.name || '他';
    if (role === 'female') return pair?.female.name || '她';
    return '旁白';
  };

  const getSpeakerAvatar = (role: string) => {
    if (role === 'male') return pair?.male.avatarUrl;
    if (role === 'female') return pair?.female.avatarUrl;
    return null;
  };

  const getSpeakerGender = (role: string) => {
    if (role === 'male') return 'male';
    if (role === 'female') return 'female';
    return null;
  };

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
      {/* 头部：进度信息 */}
      <div className="px-5 py-3 border-b border-dark-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-dark-400">对话进度</span>
          <div className="flex items-center space-x-1">
            <span className="text-lg font-bold text-yellow-400">{currentRound}</span>
            <span className="text-dark-500">/</span>
            <span className="text-sm text-dark-400">{totalRounds}轮</span>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            <span className="loading-dot w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            <span className="text-xs text-yellow-400 ml-1">AI生成中</span>
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div className="h-1 bg-dark-800">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
          style={{ width: `${Math.min(100, (currentRound / totalRounds) * 100)}%` }}
        />
      </div>

      {/* 消息列表 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isNarrator = msg.role === 'narrator';
          const speakerName = getSpeakerName(msg.role);
          const avatarUrl = getSpeakerAvatar(msg.role);
          const gender = getSpeakerGender(msg.role);

          if (isNarrator) {
            // 旁白样式
            return (
              <div key={index} className="flex justify-center">
                <div className="max-w-2xl w-full bg-dark-800/30 border border-dark-700/30 rounded-xl px-5 py-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-500 text-sm mt-0.5">📖</span>
                    <p className="text-dark-300 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          }

          // 角色对话样式
          const isMale = gender === 'male';
          return (
            <div
              key={index}
              className={`flex ${isMale ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${isMale ? '' : 'flex-row-reverse space-x-reverse'}`}>
                {/* 头像 */}
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={speakerName}
                      className={`w-9 h-9 rounded-lg object-cover border-2 ${
                        isMale ? 'border-blue-400/40' : 'border-pink-400/40'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isMale
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      }`}
                    >
                      {speakerName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 对话气泡 */}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    isMale
                      ? 'bg-dark-800/80 border border-dark-700/50 rounded-tl-sm'
                      : 'bg-yellow-500/10 border border-yellow-500/20 rounded-tr-sm'
                  }`}
                >
                  <p className={`text-sm leading-relaxed ${isMale ? 'text-dark-200' : 'text-dark-100'}`}>
                    {msg.content}
                    {/* 流式光标 */}
                    {isStreaming && index === messages.length - 1 && (
                      <span className="inline-block w-0.5 h-4 bg-yellow-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* 案例结果 */}
        {caseResult && (
          <div className="flex justify-center mt-4">
            <div className="max-w-2xl w-full bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center">
                <span className="mr-2">⚡</span>
                案例结果
              </h3>
              <p className="text-dark-200 text-sm leading-relaxed mb-3">{caseResult.description}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(caseResult.attributesChange).map(([key, val]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded text-xs ${
                      (val as number) > 0
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {key} {(val as number) > 0 ? `+${val}` : val}
                  </span>
                ))}
                {Object.entries(caseResult.statusChange).map(([key, val]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded text-xs ${
                      (val as number) > 0
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {key} {(val as number) > 0 ? `+${val}` : val}
                  </span>
                ))}
              </div>
              {caseResult.emotion && (
                <div className="mt-2 text-sm text-dark-400">
                  情绪：{EMOTION_ICONS[caseResult.emotion]} {caseResult.emotion}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部操作栏 */}
      {caseResult && (
        <div className="px-5 py-3 border-t border-dark-700/50 flex justify-center">
          <button onClick={onExecuteNext} className="btn-primary">
            ▶ 进入下一个案例
          </button>
        </div>
      )}
    </div>
  );
}
