// ==========================================
// 漫画风格图片生成服务
// 使用多种风格生成漫画分镜
// ==========================================

import { EmotionType, ComicFrame, NarrativeElement } from '../types';

// 漫画风格图片URL池
const MANGA_STYLES = {
  joy: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
  ],
  conflict: [
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
  ],
  sadness: [
    'https://images.unsplash.com/photo-1493723846597-422876ed05f5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&h=400&fit=crop',
  ],
  tension: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  ],
  harmony: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
  ],
  neutral: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
  ],
};

// 悬疑/反转专用图片
const MYSTERY_STYLES = {
  mystery: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=400&fit=crop', // 暗光走廊
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop', // 神秘会议
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', // 神秘人物
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', // 昏暗场景
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&h=400&fit=crop', // 阴影
  ],
  twist: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop', // 惊讶
    'https://images.unsplash.com/photo-1554177255-65812d7e4f5e?w=600&h=400&fit=crop', // 震惊
    'https://images.unsplash.com/photo-1495427513690-6f1d62d2d3b5?w=600&h=400&fit=crop', // 戏剧性
    'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&h=400&fit=crop', // 雨夜
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=400&fit=crop', // 黑暗
  ],
  crisis: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop', // 暴跌
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop', // 危机
    'https://images.unsplash.com/photo-1559526324-4b87a5f36e44?w=600&h=400&fit=crop', // 崩溃
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop', // 混乱
    'https://images.unsplash.com/photo-1528900407868-8e1e0c0f6c5e?w=600&h=400&fit=crop', // 恐慌
  ],
  climax: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop', // 对峙
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop', // 紧张
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop', // 对决
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', // 紧张工作
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', // 关键时刻
  ],
};

// 场景背景图片
const SCENE_BACKGROUNDS = {
  office: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
  ],
  meeting: [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
  ],
  mystery: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop', // 黑暗走廊
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&fit=crop', // 阴影
    'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=800&h=600&fit=crop', // 雨天
  ],
  crisis: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop', // 暴跌
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop', // 金融混乱
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop', // 危机
  ],
};

// 获取叙事元素对应的图片
function getNarrativeImage(narrativeElements?: NarrativeElement[]): string {
  if (!narrativeElements || narrativeElements.length === 0) {
    return getEmotionImage('neutral');
  }

  // 根据叙事元素类型选择图片
  if (narrativeElements.includes('mystery')) {
    const imgs = MYSTERY_STYLES.mystery;
    return imgs[Math.floor(Math.random() * imgs.length)];
  }
  if (narrativeElements.includes('twist')) {
    const imgs = MYSTERY_STYLES.twist;
    return imgs[Math.floor(Math.random() * imgs.length)];
  }
  if (narrativeElements.includes('crisis')) {
    const imgs = MYSTERY_STYLES.crisis;
    return imgs[Math.floor(Math.random() * imgs.length)];
  }
  if (narrativeElements.includes('climax')) {
    const imgs = MYSTERY_STYLES.climax;
    return imgs[Math.floor(Math.random() * imgs.length)];
  }

  return getEmotionImage('neutral');
}

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

// 生成漫画分镜 - 增强版，支持悬疑/反转
export function generateComicFrames(
  scenario: { 
    title: string; 
    description: string; 
    context?: string;
    narrativeElements?: NarrativeElement[];
    mysteryHint?: string;
    foreshadowing?: string;
    possibleTwist?: { description: string; probability: number };
  },
  maleName: string,
  femaleName: string,
  action: string,
  outcome: string,
  emotion: EmotionType = 'neutral',
  hasTwist?: boolean,
  twistDescription?: string
): ComicFrame[] {
  const frames: ComicFrame[] = [];
  
  // 根据叙事元素选择图片
  const narrativeImage = getNarrativeImage(scenario.narrativeElements);
  const emotionImage = getEmotionImage(emotion);
  
  // 帧1: 场景介绍 - 根据叙事元素选择背景
  const bgType = scenario.narrativeElements?.includes('mystery') ? 'mystery' :
                 scenario.narrativeElements?.includes('crisis') ? 'crisis' : 'office';
  frames.push({
    id: `frame-1-${Date.now()}`,
    imageUrl: getSceneBackground(bgType),
    caption: scenario.title,
    emotion: scenario.narrativeElements?.includes('mystery') ? 'tension' : 'neutral',
    speaker: undefined,
  });

  // 帧2: 情况描述 - 使用叙事元素图片
  frames.push({
    id: `frame-2-${Date.now()}`,
    imageUrl: narrativeImage,
    caption: scenario.description.slice(0, 120) + (scenario.description.length > 120 ? '...' : ''),
    emotion: scenario.narrativeElements?.includes('mystery') ? 'tension' : emotion,
    speaker: undefined,
  });

  // 如果有悬疑线索，添加线索帧
  if (scenario.mysteryHint && scenario.narrativeElements?.includes('mystery')) {
    frames.push({
      id: `frame-2b-${Date.now()}`,
      imageUrl: narrativeImage,
      caption: `❓ ${scenario.mysteryHint}`,
      emotion: 'tension',
      speaker: '线索',
    });
  }

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
    caption: outcome.slice(0, 120) + (outcome.length > 120 ? '...' : ''),
    emotion: emotion,
    speaker: undefined,
  });

  // 如果有反转，添加反转揭露帧
  if (hasTwist && twistDescription) {
    frames.push({
      id: `frame-twist-${Date.now()}`,
      imageUrl: getNarrativeImage(['twist']),
      caption: `🔄 ${twistDescription}`,
      emotion: 'conflict',
      speaker: '【剧情反转】',
    });
  }

  // 如果有伏笔，添加伏笔帧
  if (scenario.foreshadowing) {
    frames.push({
      id: `frame-foreshadow-${Date.now()}`,
      imageUrl: narrativeImage,
      caption: `📜 ${scenario.foreshadowing}`,
      emotion: 'neutral',
      speaker: '【伏笔】',
    });
  }

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

// 叙事元素标签
export const NARRATIVE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  mystery: { icon: '🔍', label: '悬疑', color: 'text-purple-400' },
  twist: { icon: '🔄', label: '反转', color: 'text-cyan-400' },
  climax: { icon: '⚡', label: '高潮', color: 'text-orange-400' },
  foreshadowing: { icon: '📜', label: '伏笔', color: 'text-gray-400' },
  crisis: { icon: '🚨', label: '危机', color: 'text-red-400' },
  revelation: { icon: '💡', label: '揭露', color: 'text-yellow-400' },
};
