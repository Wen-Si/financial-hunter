import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from './services/api';
import { User } from './types';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateAvatarPage from './pages/CreateAvatarPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

// 导航栏组件
const NavBar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive(path)
        ? 'text-yellow-400 bg-yellow-500/10'
        : 'text-dark-300 hover:text-white hover:bg-dark-700'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-dark-950 font-bold text-sm">
              FH
            </div>
            <span className="text-xl font-bold text-gold-gradient tracking-wide">
              金融猎手
            </span>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/lobby" className={navLinkClass('/lobby')}>
                  游戏大厅
                </Link>
                <Link to="/create" className={navLinkClass('/create')}>
                  创建角色
                </Link>
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-dark-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-dark-950 font-bold text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-dark-200 hidden sm:block">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClass('/login')}>
                  登录
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-yellow-500 to-amber-600 text-dark-950 hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/25">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// 主应用组件
const App: React.FC = () => {
  return (
    <BrowserRouter basename="/financial-hunter">
      <div className="min-h-screen bg-dark-950 bg-pattern">
        <NavBar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create" element={<CreateAvatarPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/:id" element={<GamePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
