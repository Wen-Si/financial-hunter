import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarAPI } from '../services/api';

export default function CreateAvatarPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 男性角色
  const [maleName, setMaleName] = useState('');
  const [maleDescription, setMaleDescription] = useState('');

  // 女性角色
  const [femaleName, setFemaleName] = useState('');
  const [femaleDescription, setFemaleDescription] = useState('');

  // 快速填充示例
  const fillMaleExample = () => {
    setMaleName('陈浩然');
    setMaleDescription('一位30岁的投行精英，性格沉稳内敛，具备出色的财务分析能力和项目执行能力。在工作中追求完美，对数字敏感，善于在压力下做出理性决策。工作之外热爱长跑，保持着良好的自律习惯。');
  };

  const fillFemaleExample = () => {
    setFemaleName('林雨桐');
    setFemaleDescription('一位28岁的基金分析师，聪明伶俐，善于沟通交流，具备优秀的行业研究能力和敏锐的市场洞察力。性格开朗乐观，擅长团队协作，在人脉经营方面有独到之处。面对挑战时总能保持积极心态。');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!maleName.trim() || !maleDescription.trim() || !femaleName.trim() || !femaleDescription.trim()) {
      setError('请填写完整的男女角色信息');
      return;
    }

    if (maleDescription.length < 20 || femaleDescription.length < 20) {
      setError('角色描述至少需要20个字符');
      return;
    }

    setLoading(true);
    try {
      await avatarAPI.createCharacterPair(
        maleName.trim(),
        femaleName.trim(),
        maleDescription.trim(),
        femaleDescription.trim()
      );
      navigate('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient mb-2">创建角色对</h1>
          <p className="text-dark-400">你需要创建一对搭档，共同经历金融职场的挑战</p>
        </div>

        {/* 说明卡片 */}
        <div className="glass rounded-xl p-6 mb-8 border border-yellow-500/20">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">👫</span>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">双角色合作模式</h3>
              <p className="text-dark-300 text-sm leading-relaxed">
                你将创建一对角色搭档（1男1女），在游戏中他们将紧密合作、相互支持。当然，合作过程中也会有欢乐、冲突和成长的时刻。两个角色都由AI驱动，会根据各自的特点和当前情境做出决策。
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 男性角色 */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">👨</span>
                <h2 className="text-xl font-bold text-white">男性角色</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={maleName}
                    onChange={(e) => setMaleName(e.target.value)}
                    placeholder="例如：陈浩然"
                    className="input-field"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    角色描述
                  </label>
                  <textarea
                    value={maleDescription}
                    onChange={(e) => setMaleDescription(e.target.value)}
                    placeholder="描述这位角色的性格、职业背景、专业技能、优点和缺点..."
                    className="input-field h-40 resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-dark-500 text-right mt-1">
                    {maleDescription.length}/500
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fillMaleExample}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  📝 使用示例描述
                </button>
              </div>
            </div>

            {/* 女性角色 */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">👩</span>
                <h2 className="text-xl font-bold text-white">女性角色</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={femaleName}
                    onChange={(e) => setFemaleName(e.target.value)}
                    placeholder="例如：林雨桐"
                    className="input-field"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    角色描述
                  </label>
                  <textarea
                    value={femaleDescription}
                    onChange={(e) => setFemaleDescription(e.target.value)}
                    placeholder="描述这位角色的性格、职业背景、专业技能、优点和缺点..."
                    className="input-field h-40 resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-dark-500 text-right mt-1">
                    {femaleDescription.length}/500
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fillFemaleExample}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  📝 使用示例描述
                </button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="loading-dot w-2 h-2 bg-dark-950 rounded-full mr-2"></span>
                  <span className="loading-dot w-2 h-2 bg-dark-950 rounded-full mr-2"></span>
                  <span className="loading-dot w-2 h-2 bg-dark-950 rounded-full mr-2"></span>
                  创建中...
                </span>
              ) : (
                '🎮 开始冒险'
              )}
            </button>
          </div>
        </form>

        {/* 提示 */}
        <div className="text-center mt-8 text-dark-500 text-sm">
          <p>💡 提示：仔细思考两个角色的性格互补性，他们将在游戏中互相配合面对各种挑战</p>
        </div>
      </div>
    </div>
  );
}
