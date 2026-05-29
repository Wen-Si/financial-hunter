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
// 叙事元素类型
export type NarrativeElement = 
  | 'mystery'      // 悬疑：存在未知、线索、暗示
  | 'twist'        // 反转：结果出乎意料
  | 'climax'       // 高潮：紧张对峙、关键抉择
  | 'foreshadowing' // 伏笔：预示未来事件
  | 'crisis'       // 危机：突发状况
  | 'revelation';  // 揭露：真相揭晓

export interface Choice {
  id: string;
  text: string;
  requiresBoth?: boolean; // 是否需要双方同意
  isTrap?: boolean;       // 是否是陷阱选项（看似正确实则危险）
  isHidden?: boolean;     // 是否是隐藏选项（需要特定条件）
}

export interface Outcome {
  description: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  emotion?: EmotionType; // 结果带来的情绪
  // 反转相关
  hasTwist?: boolean;           // 是否包含反转
  twistDescription?: string;     // 反转内容（事后揭晓）
  isBetrayal?: boolean;         // 是否是背叛事件
  isSurprise?: boolean;         // 是否是惊喜事件
  // 揭露相关
  revealedTruth?: string;        // 揭露的真相
  hiddenClue?: string;          // 隐藏的线索
  // 后续影响
  futureImpact?: string;        // 对未来的暗示
}

export interface Scenario {
  id: string;
  category: string;
  difficulty: number;
  title: string;
  description: string;
  context: string;
  choices: Choice[];
  // 悬疑/叙事元素
  narrativeElements?: NarrativeElement[];  // 包含的叙事元素
  mysteryHint?: string;                    // 悬疑线索/暗示
  foreshadowing?: string;                 // 伏笔内容
  // 反转相关
  possibleTwist?: {                       // 可能发生的反转
    condition: string;                     // 触发条件
    description: string;                  // 反转描述
    probability: number;                  // 发生概率 0-1
  };
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
