import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarAPI } from '../services/api';

const exampleDescriptions = [
  {
    title: '投行精英',
    desc: '名校金融硕士毕业，性格沉稳内敛，做事严谨细致。拥有CFA和CPA双证书，擅长财务分析和风险评估。在顶级投行工作3年，目标是成为并购交易部门的负责人。为人正直，但在职场政治中有时显得不够圆滑。',
  },
  {
    title: '创业者',
    desc: '计算机和金融双学位，性格外向开朗，善于沟通和说服他人。大学期间就开始创业，虽然失败过两次但从未放弃。对金融科技充满热情，擅长发现市场机会。抗压能力极强，但专业知识还有待提升。',
  },
  {
    title: '风控专家',
    desc: '统计学博士，性格谨慎保守，做事有条理。在银行风控部门工作5年，对合规和风险管理有深刻理解。人脉广泛，在监管机构也有不少熟人。但有时过于保守，可能错过一些机会。',
  },
];

const CreateAvatarPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyExample = (desc: string) => {
    setCharacterDescription(desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入角色名称');
      return;
    }

    if (!characterDescription.trim()) {
      setError('请输入角色描述');
      return;
    }

    if (characterDescription.trim().length < 20) {
      setError('角色描述至少需要20个字符，请详细描述你的角色');
      return;
    }

    setLoading(true);
    try {
      await avatarAPI.create(name.trim(), characterDescription.trim());
      navigate('/lobby');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '创建角色失败，请稍后重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* 标题 */}
        <div className="text-center mb-10 animate-slide-in">
          <h1 className="text-4xl font-bold text-gold-gradient mb-3">创建你的数字人</h1>
          <p className="text-dark-400 text-lg">
            用自然语言描述你想要扮演的角色，AI将为你生成独特的金融职场人格
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* 角色名称 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">
                角色名称 <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给你的角色起个名字"
                className="input-field"
                disabled={loading}
                maxLength={20}
              />
              <p className="text-xs text-dark-500 mt-1">最多20个字符</p>
            </div>

            {/* 角色描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-dark-300 mb-2">
                角色描述 <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                placeholder="请详细描述你的角色，包括但不限于：&#10;- 品格和性格特点&#10;- 专业技能和资质&#10;- 职业发展方向和目标&#10;- 优势和劣势&#10;- 人际关系特点"
                className="input-field min-h-[200px] resize-y"
                disabled={loading}
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-dark-500">至少20个字符，越详细越好</p>
                <p className="text-xs text-dark-500">{characterDescription.length}/1000</p>
              </div>
            </div>

            {/* 创建按钮 */}
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
                  <span>AI正在生成角色...</span>
                </>
              ) : (
                <span>创建角色</span>
              )}
            </button>
          </form>
        </div>

        {/* 示例提示 */}
        <div className="mt-8 animate-slide-in">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            示例角色描述
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleDescriptions.map((example, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 card-hover cursor-pointer group"
                onClick={() => handleApplyExample(example.desc)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-yellow-400">{example.title}</h4>
                  <span className="text-xs text-dark-500 group-hover:text-yellow-400 transition-colors">
                    点击使用
                  </span>
                </div>
                <p className="text-xs text-dark-400 leading-relaxed line-clamp-4">
                  {example.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAvatarPage;
