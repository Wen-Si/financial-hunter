// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  last_login_at?: string;
  hasCreatedCharacters?: boolean; // 是否已创建角色对
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// 数字人相关类型
export type Gender = 'male' | 'female';

export type EmotionType = 'joy' | 'conflict' | 'sadness' | 'neutral' | 'tension' | 'harmony';

export interface AvatarAttributes {
  品格: number;
  情商: number;
  专业知识: number;
  人脉: number;
  抗压能力: number;
  运气: number;
}

export interface Career {
  当前职位: string;
  目标方向: string;
  工作年限: number;
  所属机构: string;
}

export interface Status {
  金钱: number;
  心情: number;
  健康: number;
  声望: number;
}

export interface GameEvent {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  action: string;
  result: string;
  timestamp: string;
  emotion?: EmotionType; // 行动时的情绪
}

export interface Avatar {
  id: string;
  userId: string;
  name: string;
  characterDescription: string;
  avatarUrl?: string;
  gender: Gender;
  attributes: AvatarAttributes;
  career: Career;
  status: Status;
  currentScenario: string | null;
  gameLog: GameEvent[];
  createdAt: string;
  updatedAt: string;
}

// 双角色组合
export interface CharacterPair {
  male: Avatar;
  female: Avatar;
  relationship: {
    harmony: number;      // 和谐度
    trust: number;       // 信任度
    conflicts: number;   // 冲突次数
    joyfulMoments: number; // 欢乐时刻
  };
  currentEmotion: EmotionType; // 当前整体情绪
}

// 场景相关类型
export interface Choice {
  id: string;
  text: string;
  requiresBoth?: boolean; // 是否需要双方同意
}

export interface Outcome {
  description: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  emotion?: EmotionType; // 结果带来的情绪
}

export interface Scenario {
  id: string;
  category: string;
  difficulty: number;
  title: string;
  description: string;
  context: string;
  choices: Choice[];
}

// 漫画帧
export interface ComicFrame {
  id: string;
  imageUrl: string;
  caption: string;
  emotion?: EmotionType;
  speaker?: string;
}

// 游戏相关类型
export interface GameActionResponse {
  action: {
    action: string;
    reasoning: string;
    selectedChoice?: Choice;
  };
  outcome: {
    description: string;
    attributesChange: Partial<AvatarAttributes>;
    statusChange: Partial<Status>;
    emotion?: EmotionType;
  };
  newAttributes: AvatarAttributes;
  newStatus: Status;
  nextScenario: Scenario | null;
  gameEvent: GameEvent;
  isGameOver: boolean;
  comicFrames?: ComicFrame[]; // 漫画分镜
}

export interface GameStartResponse {
  message: string;
  scenario: Scenario;
  characterPair: CharacterPair;
  comicFrames: ComicFrame[];
}
