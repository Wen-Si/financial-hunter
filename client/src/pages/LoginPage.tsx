import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(username.trim(), password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/lobby');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* 金融网格背景 */}
      <div className="absolute inset-0 financial-grid pointer-events-none" />
      {/* 背景纹理 */}
      <div className="absolute inset-0 bg-pattern pointer-events-none" />
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-navy-mid/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in">
        {/* Logo 标识 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-gold-light to-gold-dark shadow-lg border border-gold/30 animate-glow">
            <span className="font-serif text-2xl font-bold text-navy">FH</span>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient mb-3 font-serif tracking-wide">
            欢迎回来
          </h1>
          <div className="flex items-center justify-center">
            <div className="gold-divider w-24" />
          </div>
          <p className="text-dark-400 mt-3">登录你的金融猎手账号</p>
        </div>

        {/* 登录表单卡片 */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dark-300 mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>登录中...</span>
                </>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>

          {/* 分割线 */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 gold-divider" />
            <span className="px-4 text-xs text-dark-500 font-serif">或</span>
            <div className="flex-1 gold-divider" />
          </div>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-dark-400 text-sm">
              没有账号？{' '}
              <Link
                to="/register"
                className="text-gold-light hover:text-gold font-medium transition-colors duration-300"
              >
                去注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
