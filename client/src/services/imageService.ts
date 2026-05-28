// ==========================================
// 头像生成服务
// 使用 DiceBear API 生成随机卡通头像
// ==========================================

export function generateAvatar(seed: string): string {
  // 使用 DiceBear 的像素风格头像
  const style = ['pixel-art', 'identicon', 'bottts', 'avataaars', 'micah', 'open-peeps', 'thumbs'][Math.floor(Math.random() * 7)];
  const seedEncoded = encodeURIComponent(seed + Date.now());
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seedEncoded}&backgroundColor=1e293b`;
}

// ==========================================
// 情境图片服务
// 根据游戏场景类型返回匹配的插画URL
// ==========================================

// 内置情境图片URL（使用Unsplash的金融职场相关图片）
const SCENE_IMAGES: Record<string, string[]> = {
  // 投行场景
  ib: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop', // 摩天大楼
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop', // 商务人士
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop', // 办公室工作
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', // 数据分析
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', // 金融图表
  ],
  // 基金场景
  fund: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop', // 股票K线
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop', // 基金图表
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop', // 投资理财
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop', // 金融会议
  ],
  // 银行场景
  bank: [
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&h=400&fit=crop', // 银行建筑
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', // 银行柜台
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop', // 金融科技
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop', // 数字化银行
  ],
  // 保险场景
  ins: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop', // 保险文档
    'https://images.unsplash.com/photo-1585435465945-bef5a93f8849?w=800&h=400&fit=crop', // 医疗保险
    'https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?w=800&h=400&fit=crop', // 人寿保险
  ],
  // 监管场景
  reg: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop', // 法律文件
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop', // 法院建筑
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=400&fit=crop', // 合规办公
  ],
  // 风控场景
  risk: [
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop', // 风险评估
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&h=400&fit=crop', // 警示标志
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop', // 风险图表
  ],
  // 职场场景
  career: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop', // 职场会议
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop', // 团队协作
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop', // 职场女性
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=400&fit=crop', // 商务男士
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop', // 办公室团队
  ],
  // 情绪场景
  emotion: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop', // 自信
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop', // 紧张会议
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop', // 庆祝成功
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop', // 专注工作
  ],
};

// 默认图片
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
];

// 根据场景类型获取随机图片
export function getSceneImage(category: string): string {
  const categoryLower = category.toLowerCase();
  
  // 尝试精确匹配
  if (SCENE_IMAGES[categoryLower]) {
    const images = SCENE_IMAGES[categoryLower];
    return images[Math.floor(Math.random() * images.length)];
  }
  
  // 尝试模糊匹配
  if (categoryLower.includes('投行') || categoryLower.includes('ib')) {
    return SCENE_IMAGES.ib[Math.floor(Math.random() * SCENE_IMAGES.ib.length)];
  }
  if (categoryLower.includes('基金') || categoryLower.includes('fund')) {
    return SCENE_IMAGES.fund[Math.floor(Math.random() * SCENE_IMAGES.fund.length)];
  }
  if (categoryLower.includes('银行') || categoryLower.includes('bank')) {
    return SCENE_IMAGES.bank[Math.floor(Math.random() * SCENE_IMAGES.bank.length)];
  }
  if (categoryLower.includes('保险') || categoryLower.includes('ins')) {
    return SCENE_IMAGES.ins[Math.floor(Math.random() * SCENE_IMAGES.ins.length)];
  }
  if (categoryLower.includes('监管') || categoryLower.includes('reg')) {
    return SCENE_IMAGES.reg[Math.floor(Math.random() * SCENE_IMAGES.reg.length)];
  }
  if (categoryLower.includes('风控') || categoryLower.includes('risk')) {
    return SCENE_IMAGES.risk[Math.floor(Math.random() * SCENE_IMAGES.risk.length)];
  }
  if (categoryLower.includes('职场') || categoryLower.includes('career')) {
    return SCENE_IMAGES.career[Math.floor(Math.random() * SCENE_IMAGES.career.length)];
  }
  
  // 默认图片
  return DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
}

// 获取动作/情绪相关的图片
export function getEmotionImage(emotion: string): string {
  const emotionLower = emotion.toLowerCase();
  
  if (emotionLower.includes('紧张') || emotionLower.includes('焦虑') || emotionLower.includes('压力')) {
    return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop';
  }
  if (emotionLower.includes('开心') || emotionLower.includes('成功') || emotionLower.includes('庆祝')) {
    return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop';
  }
  if (emotionLower.includes('愤怒') || emotionLower.includes('不满')) {
    return 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop';
  }
  if (emotionLower.includes('悲伤') || emotionLower.includes('失落')) {
    return 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=800&h=400&fit=crop';
  }
  if (emotionLower.includes('专注') || emotionLower.includes('思考')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop';
  }
  if (emotionLower.includes('自信') || emotionLower.includes('坚定')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop';
  }
  
  return SCENE_IMAGES.emotion[Math.floor(Math.random() * SCENE_IMAGES.emotion.length)];
}

// 获取对话场景图片
export function getDialogueImage(): string {
  return SCENE_IMAGES.career[Math.floor(Math.random() * SCENE_IMAGES.career.length)];
}

// 根据结果类型获取图片
export function getResultImage(isPositive: boolean): string {
  if (isPositive) {
    return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop'; // 庆祝
  }
  return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop'; // 紧张
}
