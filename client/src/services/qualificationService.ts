// ==========================================
// 职业资质系统
// ==========================================

export type QualificationType = 
  | '注册分析师' 
  | '注册合规师' 
  | '注册风控师' 
  | '注册会计师' 
  | 'AI工程师';

export interface Qualification {
  id: QualificationType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  requiredCases: number;
  description: string;
}

// 5类职业资质配置（每8关解锁一个）
export const QUALIFICATIONS: Qualification[] = [
  {
    id: '注册分析师',
    name: '注册分析师',
    icon: '📊',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    requiredCases: 8,
    description: '通过8关获得',
  },
  {
    id: '注册合规师',
    name: '注册合规师',
    icon: '⚖️',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    requiredCases: 16,
    description: '通过16关获得',
  },
  {
    id: '注册风控师',
    name: '注册风控师',
    icon: '🛡️',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    requiredCases: 24,
    description: '通过24关获得',
  },
  {
    id: '注册会计师',
    name: '注册会计师',
    icon: '📈',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    requiredCases: 32,
    description: '通过32关获得',
  },
  {
    id: 'AI工程师',
    name: 'AI工程师',
    icon: '🤖',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    requiredCases: 40,
    description: '通过40关获得',
  },
];

// 根据通关数获取已解锁的资质列表
export function getUnlockedQualifications(completedCases: number): Qualification[] {
  return QUALIFICATIONS.filter(q => completedCases >= q.requiredCases);
}

// 获取下一个待解锁的资质
export function getNextQualification(completedCases: number): Qualification | null {
  for (const q of QUALIFICATIONS) {
    if (completedCases < q.requiredCases) {
      return q;
    }
  }
  return null;
}

// 获取最新解锁的资质（用于显示解锁动画）
export function getLatestUnlockedQualification(completedCases: number): Qualification | null {
  const unlocked = getUnlockedQualifications(completedCases);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

// 检查是否刚刚解锁了某个资质
export function isJustUnlocked(completedCases: number): Qualification | null {
  // 检查当前关卡数是否是某个资质的解锁关卡
  const qualification = QUALIFICATIONS.find(q => q.requiredCases === completedCases);
  return qualification || null;
}

// 获取资质解锁进度（0-100%）
export function getQualificationProgress(completedCases: number): number {
  const next = getNextQualification(completedCases);
  if (!next) return 100; // 全部解锁
  
  const prevRequired = QUALIFICATIONS.find(q => q.requiredCases < next.requiredCases)?.requiredCases || 0;
  const progress = ((completedCases - prevRequired) / (next.requiredCases - prevRequired)) * 100;
  
  return Math.min(100, Math.max(0, progress));
}
