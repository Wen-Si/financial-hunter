// ==========================================
// 职业勋章系统
// ==========================================

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Badge {
  id: BadgeTier;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  requiredCases: number;
  description: string;
}

// 5大段位配置
export const BADGES: Badge[] = [
  {
    id: 'bronze',
    name: '青铜猎手',
    icon: '🥉',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/20',
    requiredCases: 5,
    description: '顺利通过5关',
  },
  {
    id: 'silver',
    name: '白银猎手',
    icon: '🥈',
    color: 'text-slate-300',
    bgColor: 'bg-slate-400/20',
    requiredCases: 13,
    description: '顺利通过13关',
  },
  {
    id: 'gold',
    name: '黄金猎手',
    icon: '🥇',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    requiredCases: 30,
    description: '顺利通过30关',
  },
  {
    id: 'platinum',
    name: '铂金猎手',
    icon: '💎',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/20',
    requiredCases: 50,
    description: '顺利通过50关',
  },
  {
    id: 'diamond',
    name: '钻石猎手',
    icon: '👑',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    requiredCases: 80,
    description: '顺利通过80关',
  },
];

// 根据通关数获取当前勋章
export function getCurrentBadge(completedCases: number): Badge | null {
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (completedCases >= BADGES[i].requiredCases) {
      return BADGES[i];
    }
  }
  return null;
}

// 获取下一个目标勋章
export function getNextBadge(completedCases: number): Badge | null {
  for (const badge of BADGES) {
    if (completedCases < badge.requiredCases) {
      return badge;
    }
  }
  return null;
}

// 获取进度百分比
export function getBadgeProgress(completedCases: number): number {
  const current = getCurrentBadge(completedCases);
  const next = getNextBadge(completedCases);
  
  if (!next) return 100; // 已满级
  
  const currentRequired = current?.requiredCases || 0;
  const nextRequired = next.requiredCases;
  const progress = ((completedCases - currentRequired) / (nextRequired - currentRequired)) * 100;
  
  return Math.min(100, Math.max(0, progress));
}

// 获取所有已解锁的勋章
export function getUnlockedBadges(completedCases: number): Badge[] {
  return BADGES.filter(badge => completedCases >= badge.requiredCases);
}
