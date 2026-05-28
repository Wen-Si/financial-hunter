import { User, Avatar, AvatarAttributes, Career, Status, GameEvent } from '../types';

// ==========================================
// localStorage keys
// ==========================================
const USERS_KEY = 'fh_users';
const CURRENT_USER_KEY = 'fh_current_user';
const AVATARS_KEY = 'fh_avatars';
const GAME_HISTORY_KEY = 'fh_game_history';

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

// ==========================================
// Avatar related
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

export async function createAvatar(
  userId: string,
  name: string,
  characterDescription: string,
  attributes?: AvatarAttributes,
  career?: Career
): Promise<{ message: string; avatar: StoredAvatar }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const defaultAttributes: AvatarAttributes = attributes || {
        品格: 50,
        情商: 50,
        专业知识: 50,
        人脉: 50,
        抗压能力: 50,
        运气: 50,
      };

      const defaultCareer: Career = career || {
        当前职位: '初级分析师',
        目标方向: '金融行业高管',
        工作年限: 1,
        所属机构: '某金融机构',
      };

      const defaultStatus: Status = {
        金钱: 50,
        心情: 70,
        健康: 80,
        声望: 30,
      };

      const newAvatar: StoredAvatar = {
        id: generateId(),
        userId,
        name,
        characterDescription,
        attributes: defaultAttributes,
        career: defaultCareer,
        status: defaultStatus,
        currentScenario: null,
        gameLog: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const avatars = getAllAvatars();
      avatars.push(newAvatar);
      setJSON(AVATARS_KEY, avatars);

      resolve({
        message: '角色创建成功',
        avatar: newAvatar,
      });
    }, 500);
  });
}

export function deleteAvatar(userId: string, avatarId: string): void {
  const avatars = getAllAvatars();
  const filtered = avatars.filter(
    (a) => !(a.id === avatarId && a.userId === userId)
  );
  setJSON(AVATARS_KEY, filtered);

  // Also delete game history
  const history = getJSON<Record<string, GameEvent[]>>(GAME_HISTORY_KEY, {});
  delete history[avatarId];
  setJSON(GAME_HISTORY_KEY, history);
}

export function updateAvatar(avatarId: string, data: Partial<Avatar>): void {
  const avatars = getAllAvatars();
  const index = avatars.findIndex((a) => a.id === avatarId);
  if (index !== -1) {
    avatars[index] = {
      ...avatars[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setJSON(AVATARS_KEY, avatars);
  }
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
