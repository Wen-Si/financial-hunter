import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 模拟行情数据
const tickerData = [
  { symbol: '上证指数', value: '3,245.67', change: '+0.82%', up: true },
  { symbol: '恒生指数', value: '17,892.34', change: '-0.45%', up: false },
  { symbol: '标普500', value: '4,567.89', change: '+1.23%', up: true },
  { symbol: '纳斯达克', value: '15,234.56', change: '+0.67%', up: true },
  { symbol: 'BTC/USD', value: '42,567.00', change: '+2.34%', up: true },
  { symbol: '黄金现货', value: '2,034.50', change: '+0.12%', up: true },
  { symbol: '沪深300', value: '3,876.21', change: '-0.23%', up: false },
  { symbol: '道琼斯', value: '37,892.45', change: '+0.56%', up: true },
  { symbol: '日经225', value: '33,456.78', change: '-0.89%', up: false },
  { symbol: '原油期货', value: '78.45', change: '+1.45%', up: true },
];

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: 'AI驱动决策',
    description: '基于大语言模型的智能决策系统，每个选择都经过深思熟虑，模拟真实职场中的判断与取舍。',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: '动态属性系统',
    description: '品格、情商、专业知识、人脉、抗压能力、运气六大属性，随你的每一个决策实时变化。',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: '真实金融场景',
    description: '涵盖投行、基金、保险、风控等多个金融领域，体验从实习生到行业大佬的完整职业旅程。',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
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
    <div className="min-h-screen relative overflow-hidden bg-navy financial-grid">
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-navy-mid/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/3 rounded-full blur-[160px]" />
      </div>

      {/* 行情滚动条 */}
      <div className="relative z-10 border-b border-gold/10 bg-navy-light/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-4 py-2 border-r border-gold/10 bg-navy-mid/50">
            <span className="text-xs font-medium text-gold-light tracking-widest font-serif">
              实时行情
            </span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center ticker-scroll whitespace-nowrap">
              {[...tickerData, ...tickerData].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 px-6 py-2">
                  <span className="text-xs text-dark-300 font-medium">{item.symbol}</span>
                  <span className="text-xs text-dark-100 tabular-nums font-medium">{item.value}</span>
                  <span
                    className={`text-xs tabular-nums font-medium ${
                      item.up ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {item.up ? '▲' : '▼'} {item.change}
                  </span>
                  <span className="text-gold/20">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero区域 - 全屏沉浸式 */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] px-4 py-20">
        {/* 装饰标签 */}
        <div className="mb-10 animate-fade-in">
          <span className="inline-flex items-center px-5 py-1.5 text-xs tracking-widest text-gold-light border border-gold/25 bg-gold/5">
            <span className="w-1.5 h-1.5 bg-gold mr-2.5 animate-pulse" />
            AI 模拟职场体验
          </span>
        </div>

        {/* 主标题 */}
        <h1 className="font-serif text-7xl sm:text-8xl md:text-9xl font-black text-gold-gradient mb-8 text-center animate-slide-in tracking-wider">
          金融猎手
        </h1>

        {/* 金色分割线 */}
        <div className="gold-divider w-32 mb-8 animate-fade-in" />

        {/* 副标题 */}
        <p className="font-serif text-2xl sm:text-3xl text-dark-100 mb-5 text-center animate-slide-in tracking-wide">
          AI驱动的金融职场生存游戏
        </p>
        <p className="text-base text-dark-400 mb-14 text-center animate-slide-in max-w-2xl leading-relaxed">
          创建你的数字人，在充满挑战的金融世界中做出抉择，
          <br className="hidden sm:block" />
          体验从职场新人到行业精英的蜕变之路
        </p>

        {/* CTA按钮 */}
        <div className="flex flex-col sm:flex-row items-center gap-5 animate-slide-in">
          <button
            onClick={handleStart}
            className="btn-primary text-base px-12 py-4 tracking-widest group"
          >
            <span className="flex items-center space-x-3">
              <span className="font-serif">开始游戏</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          <Link to="/register" className="btn-secondary text-base px-12 py-4 tracking-widest">
            <span className="font-serif">免费注册</span>
          </Link>
        </div>

        {/* 统计数据 - 金融终端风格 */}
        <div className="flex items-stretch mt-20 animate-fade-in financial-card rounded-sm">
          <div className="px-10 py-6 text-center border-r border-gold/10">
            <div className="font-serif text-3xl font-bold text-gold-gradient tabular-nums">1,000+</div>
            <div className="text-xs text-dark-400 mt-2 tracking-widest">金融场景</div>
          </div>
          <div className="px-10 py-6 text-center border-r border-gold/10">
            <div className="font-serif text-3xl font-bold text-gold-gradient tabular-nums">06</div>
            <div className="text-xs text-dark-400 mt-2 tracking-widest">核心属性</div>
          </div>
          <div className="px-10 py-6 text-center">
            <div className="font-serif text-3xl font-bold text-gold-gradient">AI</div>
            <div className="text-xs text-dark-400 mt-2 tracking-widest">智能决策</div>
          </div>
        </div>
      </section>

      {/* 特色卡片区域 */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-16">
          <div className="gold-divider w-16 mx-auto mb-6" />
          <h2 className="font-serif text-4xl font-bold text-gold-gradient mb-4 tracking-wide">
            游戏特色
          </h2>
          <p className="text-dark-400 text-sm tracking-wide">
            沉浸式体验金融职场的每一个关键时刻
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="financial-card card-hover rounded-lg p-7 group cursor-default animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 flex items-center justify-center text-gold mb-5 border border-gold/20 bg-gold/5 group-hover:border-gold/40 group-hover:bg-gold/10 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="font-serif text-lg font-bold text-gold-light mb-3 tracking-wide">
                {feature.title}
              </h3>
              <div className="gold-divider w-8 mb-3 opacity-50" />
              <p className="text-sm text-dark-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 底部 */}
      <footer className="relative z-10 border-t border-gold/10 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="gold-divider w-24 mx-auto mb-6 opacity-40" />
          <p className="font-serif text-dark-500 text-sm tracking-wide">
            金融猎手 · AI驱动的金融职场生存游戏
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
