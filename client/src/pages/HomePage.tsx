import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: 'AI驱动决策',
    description: '基于大语言模型的智能决策系统，每个选择都经过深思熟虑，模拟真实职场中的判断与取舍。',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: '动态属性系统',
    description: '品格、情商、专业知识、人脉、抗压能力、运气六大属性，随你的每一个决策实时变化。',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: '真实金融场景',
    description: '涵盖投行、基金、保险、风控等多个金融领域，体验从实习生到行业大佬的完整职业旅程。',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: '个性化数字人',
    description: '用自然语言描述你的角色，AI将为你生成独特的金融职场人格，开启专属的职场冒险。',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleStart = () => {
    if (token) {
      navigate('/lobby');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景图片 */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url(/financial-hunter/bg-login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* 遮罩层 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)' }} />
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/3 rounded-full blur-3xl" />
      </div>

      {/* Hero区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        {/* 装饰标签 */}
        <div className="mb-8 animate-slide-in">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-pulse" />
            全新AI模拟体验
          </span>
        </div>

        {/* 主标题 */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-gold-gradient mb-6 text-center animate-slide-in tracking-tight">
          金融猎手
        </h1>

        {/* 副标题 */}
        <p className="text-xl sm:text-2xl text-dark-300 mb-4 text-center animate-slide-in max-w-2xl">
          AI驱动的金融职场生存游戏
        </p>
        <p className="text-base text-dark-400 mb-12 text-center animate-slide-in max-w-xl">
          创建你的数字人，在充满挑战的金融世界中做出抉择，体验从职场新人到行业精英的蜕变之路
        </p>

        {/* CTA按钮 */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-in">
          <button
            onClick={handleStart}
            className="btn-primary text-lg px-10 py-4 rounded-xl shadow-2xl shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 group"
          >
            <span className="flex items-center space-x-2">
              <span>开始游戏</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          <Link
            to="/register"
            className="btn-secondary text-lg px-10 py-4 rounded-xl"
          >
            免费注册
          </Link>
        </div>

        {/* 统计数据 */}
        <div className="flex items-center gap-8 sm:gap-12 mt-16 animate-slide-in">
          <div className="text-center">
            <div className="text-2xl font-bold text-gold-gradient">1000+</div>
            <div className="text-xs text-dark-400 mt-1">金融场景</div>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gold-gradient">6</div>
            <div className="text-xs text-dark-400 mt-1">核心属性</div>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gold-gradient">AI</div>
            <div className="text-xs text-dark-400 mt-1">智能决策</div>
          </div>
        </div>
      </div>

      {/* 特色卡片区域 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">游戏特色</h2>
          <p className="text-dark-400">沉浸式体验金融职场的每一个关键时刻</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass rounded-xl p-6 card-hover group cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-4 group-hover:bg-yellow-500/20 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-dark-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 底部 */}
      <footer className="relative z-10 border-t border-dark-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-dark-500 text-sm">
          <p>金融猎手 - AI驱动的金融职场生存游戏</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
