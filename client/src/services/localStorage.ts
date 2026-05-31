import { User, Avatar, AvatarAttributes, Career, Status, GameEvent, Gender, CharacterPair, EmotionType } from '../types';
import { generateAvatar } from './imageService';

// ==========================================
// localStorage keys
// ==========================================
const USERS_KEY = 'fh_users';
const CURRENT_USER_KEY = 'fh_current_user';
const AVATARS_KEY = 'fh_avatars';
const CHARACTER_PAIR_KEY = 'fh_character_pair';
const GAME_HISTORY_KEY = 'fh_game_history';
const RELATIONSHIP_KEY = 'fh_relationship';

// ==========================================
// Helper functions
// ==========================================
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getJSON<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setJSON(key: string, value: any): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ==========================================
// User related
// ==========================================
export function getUsers(): User[] {
  return getJSON<User[]>(USERS_KEY, []);
}

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<{ message: string; token: string; user: User }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();

      // Check if username already exists
      if (users.find((u) => u.username === username)) {
        reject(new Error('用户名已存在'));
        return;
      }

      // Check if email already exists
      if (users.find((u) => u.email === email)) {
        reject(new Error('邮箱已被注册'));
        return;
      }

      const newUser: User = {
        id: generateId(),
        username,
        email,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        hasCreatedCharacters: false, // 默认未创建角色
      };

      users.push(newUser);
      setJSON(USERS_KEY, users);

      // Store password separately (simple btoa encoding)
      localStorage.setItem(`fh_pwd_${newUser.id}`, btoa(password));

      const token = btoa(JSON.stringify({ userId: newUser.id, timestamp: Date.now() }));

      resolve({
        message: '注册成功',
        token,
        user: newUser,
      });
    }, 300);
  });
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ message: string; token: string; user: User }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      const user = users.find((u) => u.username === username);

      if (!user) {
        reject(new Error('用户名或密码错误'));
        return;
      }

      const storedPassword = localStorage.getItem(`fh_pwd_${user.id}`);
      if (!storedPassword || atob(storedPassword) !== password) {
        reject(new Error('用户名或密码错误'));
        return;
      }

      // Update last login
      user.last_login_at = new Date().toISOString();
      setJSON(USERS_KEY, users);

      const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

      resolve({
        message: '登录成功',
        token,
        user,
      });
    }, 300);
  });
}

export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  setJSON(CURRENT_USER_KEY, user);
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem('fh_token');
}

// 检查用户是否已创建角色对
export function hasCharacterPair(userId: string): boolean {
  const user = getUsers().find(u => u.id === userId);
  return user?.hasCreatedCharacters || false;
}

// ==========================================
// Avatar related - 保留单角色接口但标记为deprecated
// ==========================================
interface StoredAvatar extends Avatar {
  userId: string;
}

export function getAllAvatars(): StoredAvatar[] {
  return getJSON<StoredAvatar[]>(AVATARS_KEY, []);
}

export function getAvatars(userId: string): StoredAvatar[] {
  return getAllAvatars().filter((a) => a.userId === userId);
}

export function getAvatar(avatarId: string): StoredAvatar | null {
  const avatars = getAllAvatars();
  return avatars.find((a) => a.id === avatarId) || null;
}

// ==========================================
// Character Pair - 双角色系统
// ==========================================
export function createCharacterPair(
  userId: string,
  maleDescription: string,
  femaleDescription: string,
  maleName: string,
  femaleName: string,
  maleCareer?: Career,
  femaleCareer?: Career
): { message: string; characterPair: CharacterPair } {
  const defaultAttributes: AvatarAttributes = {
    品格: 50,
    情商: 50,
    专业知识: 50,
    人脉: 50,
    抗压能力: 50,
    运气: 50,
  };

  const defaultCareer: Career = {
    当前职位: '金融从业者',
    目标方向: '金融行业高管',
    工作年限: 3,
    所属机构: '某金融机构',
  };

  const defaultStatus: Status = {
    金钱: 50,
    心情: 70,
    健康: 80,
    声望: 30,
  };

  // 随机选择男性头像（6个备选）
  const maleAvatarIndex = Math.floor(Math.random() * 6) + 1;
  const maleAvatarUrl = `/financial-hunter/avatar-male-${maleAvatarIndex}.png`;

  // 随机选择女性头像（6个备选）
  const femaleAvatarIndex = Math.floor(Math.random() * 6) + 1;
  const femaleAvatarUrl = `/financial-hunter/avatar-female-${femaleAvatarIndex}.png`;

  const maleAvatar: Avatar = {
    id: generateId(),
    userId,
    name: maleName || '男主角',
    characterDescription: maleDescription,
    avatarUrl: maleAvatarUrl,
    gender: 'male' as Gender,
    attributes: { ...defaultAttributes },
    career: maleCareer || { ...defaultCareer },
    status: { ...defaultStatus },
    currentScenario: null,
    gameLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const femaleAvatar: Avatar = {
    id: generateId(),
    userId,
    name: femaleName || '女主角',
    characterDescription: femaleDescription,
    avatarUrl: femaleAvatarUrl,
    gender: 'female' as Gender,
    attributes: { ...defaultAttributes },
    career: femaleCareer || { ...defaultCareer },
    status: { ...defaultStatus },
    currentScenario: null,
    gameLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const characterPair: CharacterPair = {
    male: maleAvatar,
    female: femaleAvatar,
    relationship: {
      harmony: 50,
      trust: 50,
      conflicts: 0,
      joyfulMoments: 0,
    },
    currentEmotion: 'neutral' as EmotionType,
  };

  // 保存角色对
  setJSON(CHARACTER_PAIR_KEY, characterPair);

  // 标记用户已创建角色
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].hasCreatedCharacters = true;
    setJSON(USERS_KEY, users);
    // 更新当前用户
    setCurrentUser(users[userIndex]);
  }

  return {
    message: '角色对创建成功',
    characterPair,
  };
}

export function getCharacterPair(): CharacterPair | null {
  return getJSON<CharacterPair | null>(CHARACTER_PAIR_KEY, null);
}

export function updateCharacterPair(pair: CharacterPair): void {
  setJSON(CHARACTER_PAIR_KEY, pair);
}

// ==========================================
// Game history related
// ==========================================
export function getGameHistory(avatarId: string): GameEvent[] {
  const history = getJSON<Record<string, GameEvent[]>>(GAME_HISTORY_KEY, {});
  return history[avatarId] || [];
}

export function saveGameEvent(avatarId: string, event: GameEvent): void {
  const history = getJSON<Record<string, GameEvent[]>>(GAME_HISTORY_KEY, {});
  if (!history[avatarId]) {
    history[avatarId] = [];
  }
  history[avatarId].push(event);
  setJSON(GAME_HISTORY_KEY, history);
}

export function updateAvatar(avatarId: string, data: Partial<Avatar>): void {
  const pair = getCharacterPair();
  if (pair) {
    if (pair.male.id === avatarId) {
      pair.male = { ...pair.male, ...data, updatedAt: new Date().toISOString() };
    } else if (pair.female.id === avatarId) {
      pair.female = { ...pair.female, ...data, updatedAt: new Date().toISOString() };
    }
    updateCharacterPair(pair);
  }
}

export function deleteAvatar(userId: string, avatarId: string): void {
  // 不再支持单角色删除
}

export function deleteCharacterPair(userId: string): void {
  localStorage.removeItem(CHARACTER_PAIR_KEY);
  // 重置用户角色创建标记
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].hasCreatedCharacters = false;
    setJSON(USERS_KEY, users);
  }
}
