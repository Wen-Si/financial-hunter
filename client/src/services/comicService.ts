// ==========================================
// 漫画风格图片生成服务
// 使用多种风格生成漫画分镜
// ==========================================

import { EmotionType, ComicFrame } from '../types';

// 漫画风格图片URL池
const MANGA_STYLES = {
  joy: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', // 庆祝
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', // 欢乐场景
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', // 团队欢乐
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop', // 办公场景
  ],
  conflict: [
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop', // 紧张
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=400&fit=crop', // 冲突
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop', // 对峙
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop', // 会议争执
  ],
  sadness: [
    'https://images.unsplash.com/photo-1493723846597-422876ed05f5?w=600&h=400&fit=crop', // 沉思
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', // 失落
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop', // 孤独
    'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&h=400&fit=crop', // 雨天
  ],
  tension: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', // 紧张工作
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop', // 压力
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop', // 风险
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', // 金融压力
  ],
  harmony: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', // 合作
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', // 团队
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop', // 和谐
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop', // 协作
  ],
  neutral: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', // 城市
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', // 办公
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', // 人物
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop', // 工作
  ],
};

// 场景背景图片
const SCENE_BACKGROUNDS = {
  office: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', // 办公室
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', // 现代办公
  ],
  meeting: [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop', // 会议室
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop', // 会议
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop', // 城市
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop', // 街道
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop', // 咖啡厅
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop', // 休息区
  ],
};

// 获取情绪对应的图片
export function getEmotionImage(emotion: EmotionType): string {
  const images = MANGA_STYLES[emotion] || MANGA_STYLES.neutral;
  return images[Math.floor(Math.random() * images.length)];
}

// 获取场景背景
export function getSceneBackground(sceneType: keyof typeof SCENE_BACKGROUNDS = 'office'): string {
  const backgrounds = SCENE_BACKGROUNDS[sceneType] || SCENE_BACKGROUNDS.office;
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

// 生成漫画分镜
export function generateComicFrames(
  scenario: { title: string; description: string; context?: string },
  maleName: string,
  femaleName: string,
  action: string,
  outcome: string,
  emotion: EmotionType = 'neutral'
): ComicFrame[] {
  const frames: ComicFrame[] = [];
  const emotionImage = getEmotionImage(emotion);
  
  // 帧1: 场景介绍
  frames.push({
    id: `frame-1-${Date.now()}`,
    imageUrl: getSceneBackground('office'),
    caption: scenario.title,
    emotion: 'neutral',
    speaker: undefined,
  });

  // 帧2: 情况描述
  frames.push({
    id: `frame-2-${Date.now()}`,
    imageUrl: getSceneBackground('meeting'),
    caption: scenario.description.slice(0, 100) + (scenario.description.length > 100 ? '...' : ''),
    emotion: emotion,
    speaker: undefined,
  });

  // 帧3: 角色行动
  frames.push({
    id: `frame-3-${Date.now()}`,
    imageUrl: emotionImage,
    caption: action,
    emotion: emotion,
    speaker: maleName + ' & ' + femaleName,
  });

  // 帧4: 结果
  frames.push({
    id: `frame-4-${Date.now()}`,
    imageUrl: emotionImage,
    caption: outcome.slice(0, 100) + (outcome.length > 100 ? '...' : ''),
    emotion: emotion,
    speaker: undefined,
  });

  return frames;
}

// 获取漫画风格的对话框气泡样式
export function getSpeechBubbleStyle(emotion: EmotionType): string {
  const styles: Record<EmotionType, string> = {
    joy: 'bg-yellow-100 border-yellow-400 text-dark-900',
    conflict: 'bg-red-100 border-red-400 text-dark-900',
    sadness: 'bg-blue-100 border-blue-400 text-dark-900',
    tension: 'bg-orange-100 border-orange-400 text-dark-900',
    harmony: 'bg-green-100 border-green-400 text-dark-900',
    neutral: 'bg-gray-100 border-gray-400 text-dark-900',
  };
  return styles[emotion] || styles.neutral;
}

// 情绪图标
export const EMOTION_ICONS: Record<EmotionType, string> = {
  joy: '😊',
  conflict: '😠',
  sadness: '😢',
  tension: '😰',
  harmony: '🤝',
  neutral: '😐',
};

// 情绪标签
export const EMOTION_LABELS: Record<EmotionType, string> = {
  joy: '欢乐',
  conflict: '冲突',
  sadness: '悲伤',
  tension: '紧张',
  harmony: '和谐',
  neutral: '平静',
};

// 情绪颜色
export const EMOTION_COLORS: Record<EmotionType, string> = {
  joy: 'text-yellow-400',
  conflict: 'text-red-400',
  sadness: 'text-blue-400',
  tension: 'text-orange-400',
  harmony: 'text-green-400',
  neutral: 'text-gray-400',
};
