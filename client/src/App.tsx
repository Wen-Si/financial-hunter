import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from './services/api';
import * as localService from './services/localStorage';
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
    localService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `relative px-3 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
      isActive(path)
        ? 'text-gold-light'
        : 'text-dark-300 hover:text-gold-light'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <svg
              className="w-7 h-7 text-gold transition-transform duration-300 group-hover:scale-105"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <span className="font-serif text-xl font-bold text-gold-gradient tracking-wider">
              金融猎手
            </span>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/lobby" className={navLinkClass('/lobby')}>
                  <span className="font-serif">游戏大厅</span>
                  {isActive('/lobby') && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-px w-8 bg-gradient-to-r from-transparent via-gold-light to-transparent" />
                  )}
                </Link>
                <Link to="/create" className={navLinkClass('/create')}>
                  <span className="font-serif">创建角色</span>
                  {isActive('/create') && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-px w-8 bg-gradient-to-r from-transparent via-gold-light to-transparent" />
                  )}
                </Link>
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gold/15">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold-light font-serif font-bold text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-dark-200 hidden sm:block font-serif">
                      {user.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-dark-400 hover:text-red-400 transition-all duration-300"
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClass('/login')}>
                  <span className="font-serif">登录</span>
                  {isActive('/login') && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-px w-8 bg-gradient-to-r from-transparent via-gold-light to-transparent" />
                  )}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm ml-2"
                >
                  <span className="font-serif tracking-wide">注册</span>
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
    <HashRouter>
      <div className="min-h-screen bg-navy bg-pattern">
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
    </HashRouter>
  );
};

export default App;
