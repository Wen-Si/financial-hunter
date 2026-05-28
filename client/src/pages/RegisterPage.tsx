import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register(username.trim(), email.trim(), password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/lobby');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '注册失败，请稍后重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient mb-2">创建账号</h1>
          <p className="text-dark-400">加入金融猎手，开启你的职场冒险</p>
        </div>

        {/* 注册表单卡片 */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* 邮箱 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
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
                placeholder="请输入密码（至少6位）"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* 注册按钮 */}
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
                  <span>注册中...</span>
                </>
              ) : (
                <span>注册</span>
              )}
            </button>
          </form>

          {/* 分割线 */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-dark-700" />
            <span className="px-4 text-xs text-dark-500">或</span>
            <div className="flex-1 border-t border-dark-700" />
          </div>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-dark-400 text-sm">
              已有账号？{' '}
              <Link
                to="/login"
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-300"
              >
                去登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
