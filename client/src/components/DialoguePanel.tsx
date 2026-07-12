import React, { useEffect, useRef, useState } from 'react';
import { DialogueMessage, CaseResult, ThirdPartyCharacter, ThirdPartyRole } from '../services/dialogueService';
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

// 第三方角色文字标签映射（替代 emoji 图标）
const THIRD_PARTY_LABELS: Record<ThirdPartyRole, string> = {
  boss: '上司',
  colleague: '同僚',
  regulator: '监管',
  peer: '同业',
  competitor: '竞对',
  client: '客户',
  partner: '合作方',
};

// 情绪文字标签（本地映射，不改动 import）
const EMOTION_TEXT: Record<string, string> = {
  joy: '愉悦',
  conflict: '冲突',
  sadness: '悲伤',
  tension: '紧张',
  harmony: '和谐',
  neutral: '平静',
};

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

  const getSpeakerName = (msg: DialogueMessage) => {
    if (msg.role === 'ai_review') return 'AI点评师';
    if (msg.role === 'male') return pair?.male.name || '男角色';
    if (msg.role === 'female') return pair?.female.name || '女角色';
    if (msg.role === 'thirdParty') return msg.thirdParty?.name || '第三方';
    return '旁白';
  };

  const getSpeakerAvatar = (msg: DialogueMessage) => {
    if (msg.role === 'male') return pair?.male.avatarUrl;
    if (msg.role === 'female') return pair?.female.avatarUrl;
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
            <span className="text-lg font-bold text-gold-light tabular-nums">{currentRound}</span>
            <span className="text-dark-500">/</span>
            <span className="text-sm text-dark-400 tabular-nums">{totalRounds}轮</span>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <span className="loading-dot w-1.5 h-1.5 bg-gold-light rounded-full"></span>
            <span className="loading-dot w-1.5 h-1.5 bg-gold-light rounded-full"></span>
            <span className="loading-dot w-1.5 h-1.5 bg-gold-light rounded-full"></span>
            <span className="text-xs text-gold-light ml-1">AI生成中</span>
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div className="h-1 bg-dark-800">
        <div
          className="h-full bg-gradient-to-r from-gold-dark to-gold-light transition-all duration-500"
          style={{ width: `${Math.min(100, (currentRound / totalRounds) * 100)}%` }}
        />
      </div>

      {/* 消息列表 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isNarrator = msg.role === 'narrator';
          const isThirdParty = msg.role === 'thirdParty';
          const isAiReview = msg.role === 'ai_review';
          const speakerName = getSpeakerName(msg);
          const avatarUrl = getSpeakerAvatar(msg);
          const gender = getSpeakerGender(msg.role);
          const showCursor = isStreaming && index === messages.length - 1;

          if (isNarrator) {
            // 旁白样式：glass + 金色左边框
            return (
              <div key={index} className="flex justify-center animate-fade-in">
                <div
                  className="max-w-2xl w-full glass rounded-xl px-5 py-3"
                  style={{ borderLeft: '2px solid rgba(201, 162, 39, 0.6)' }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="font-serif text-xs text-gold mt-0.5 tracking-wider whitespace-nowrap">旁白</span>
                    <p className="text-dark-300 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          }

          // AI点评样式：glass + 金色左边框
          if (isAiReview) {
            return (
              <div key={index} className="flex justify-center animate-fade-in">
                <div
                  className="max-w-2xl w-full glass rounded-xl px-5 py-4"
                  style={{ borderLeft: '2px solid rgba(201, 162, 39, 0.6)' }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <h3 className="font-serif text-sm font-medium text-gold-light">AI点评师总结</h3>
                  </div>
                  <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {showCursor && <span className="streaming-cursor" />}
                  </p>
                </div>
              </div>
            );
          }

          // 第三方角色样式
          if (isThirdParty && msg.thirdParty) {
            const label = THIRD_PARTY_LABELS[msg.thirdParty.role];
            return (
              <div key={index} className="flex justify-center animate-slide-in">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium bg-gold/10 text-gold-light border border-gold/20">
                      {label}
                    </div>
                  </div>

                  {/* 对话气泡 */}
                  <div className="financial-card rounded-2xl px-4 py-2.5 rounded-tl-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-serif text-xs font-medium text-gold-light">{speakerName}</span>
                      <span className="text-xs text-dark-500">{msg.thirdParty.title}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-dark-200">
                      {msg.content}
                      {showCursor && <span className="streaming-cursor" />}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // 男女角色对话样式
          const isMale = gender === 'male';
          return (
            <div
              key={index}
              className={`flex ${isMale ? 'justify-start' : 'justify-end'} animate-slide-in`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${isMale ? '' : 'flex-row-reverse space-x-reverse'}`}>
                {/* 头像 */}
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={speakerName}
                      className="w-9 h-9 rounded-lg object-cover border-2 border-gold/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-gold/10 text-gold-light border border-gold/20">
                      {speakerName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 对话气泡 */}
                <div
                  className={`financial-card rounded-2xl px-4 py-2.5 ${isMale ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
                >
                  <span className="font-serif text-xs text-gold-light block mb-0.5">{speakerName}</span>
                  <p className="text-sm leading-relaxed text-dark-100">
                    {msg.content}
                    {showCursor && <span className="streaming-cursor" />}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* 案例结果 */}
        {caseResult && (
          <div className="flex justify-center mt-4 animate-fade-in">
            <div className="max-w-2xl w-full financial-card rounded-xl p-5">
              <h3 className="font-serif text-sm font-semibold text-gold-light mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
                <span>案例结果</span>
              </h3>
              <p className="text-dark-200 text-sm leading-relaxed mb-3">{caseResult.description}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(caseResult.attributesChange).map(([key, val]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded text-xs tabular-nums bg-gold/10 ${
                      (val as number) > 0 ? 'text-gold-light' : 'text-gold-dark'
                    }`}
                  >
                    {key} {(val as number) > 0 ? `+${val}` : val}
                  </span>
                ))}
                {Object.entries(caseResult.statusChange).map(([key, val]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded text-xs tabular-nums bg-gold/10 ${
                      (val as number) > 0 ? 'text-gold-light' : 'text-gold-dark'
                    }`}
                  >
                    {key} {(val as number) > 0 ? `+${val}` : val}
                  </span>
                ))}
              </div>
              {caseResult.emotion && (
                <div className="mt-3 text-sm text-dark-400">
                  情绪：<span className="text-gold-light font-serif">{EMOTION_TEXT[caseResult.emotion] || caseResult.emotion}</span>
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
            进入下一个案例
          </button>
        </div>
      )}
    </div>
  );
}
