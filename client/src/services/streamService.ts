// ==========================================
// NVIDIA API 流式调用服务
// 集成多个大模型：GLM-5.2 / DeepSeek-V4-Pro / DeepSeek-V4-Flash / Kimi-K2.6 / MiniMax-M3
// 支持多模型自动切换与降级
// ==========================================

const NVIDIA_API_KEY = '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// 单模型请求超时（毫秒），超时后自动降级到下一个模型
const REQUEST_TIMEOUT_MS = 30000;

// 可用模型列表（按优先级排列）
export const NVIDIA_MODELS = {
  DEEPSEEK_V4_PRO: 'deepseek-ai/deepseek-v4-pro',   // DeepSeek-V4 Pro（用户指定，推理能力最强）
  GLM_5_2: 'z-ai/glm-5.2',                           // 主力流式模型（GLM升级版）
  DEEPSEEK_V4: 'deepseek-ai/deepseek-v4-flash',      // DeepSeek-V4 Flash（快速推理）
  KIMI_K2: 'moonshotai/kimi-k2.6',                   // Kimi长文本模型
  MINIMAX_M3: 'minimaxai/minimax-m3',                // MiniMax备用模型
} as const;

// 默认流式模型
const DEFAULT_STREAM_MODEL = NVIDIA_MODELS.GLM_5_2;
// 备选流式模型（主模型失败时按序尝试）
const STREAM_FALLBACK_MODELS = [NVIDIA_MODELS.DEEPSEEK_V4, NVIDIA_MODELS.KIMI_K2, NVIDIA_MODELS.MINIMAX_M3, NVIDIA_MODELS.DEEPSEEK_V4_PRO];
// 默认非流式模型
const DEFAULT_CHAT_MODEL = NVIDIA_MODELS.DEEPSEEK_V4_PRO;
// 备选非流式模型
const CHAT_FALLBACK_MODELS = [NVIDIA_MODELS.KIMI_K2, NVIDIA_MODELS.DEEPSEEK_V4, NVIDIA_MODELS.GLM_5_2, NVIDIA_MODELS.MINIMAX_M3];

// ==========================================
// 流式调用NVIDIA API，逐token返回
// 支持多模型自动降级
// ==========================================
export async function* streamGLM(
  messages: { role: string; content: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    speedFactor?: number;
  } = {}
): AsyncGenerator<string> {
  const {
    temperature = 0.85,
    maxTokens = 2000,
    model = DEFAULT_STREAM_MODEL,
    speedFactor = 0.5,
  } = options;

  const baseDelay = 30;
  const delay = baseDelay / speedFactor;

  // 构建候选模型列表：指定模型 + 备选模型
  const modelsToTry = [model, ...STREAM_FALLBACK_MODELS.filter(m => m !== model)];

  for (const currentModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          top_p: 0.95,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`NVIDIA API [${currentModel}] error:`, response.status, response.statusText);
        continue; // 尝试下一个模型
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.warn(`NVIDIA API [${currentModel}] no response body`);
        continue;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let tokenCount = 0;
      let hasContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                hasContent = true;
                tokenCount++;
                await new Promise(resolve => setTimeout(resolve, delay));
                yield content;
              }
            } catch {
              // 部分行可能不完整，跳过
            }
          }
        }
      }

      // 如果成功获取到内容，直接返回
      if (hasContent) {
        console.log(`streamGLM [${currentModel}] finished, tokens:`, tokenCount);
        return;
      }

      // 没有内容但也没报错，尝试下一个模型
      console.warn(`NVIDIA API [${currentModel}] returned no content, trying fallback...`);
    } catch (err) {
      console.warn(`NVIDIA API [${currentModel}] exception:`, err);
      // 继续尝试下一个模型
    }
  }

  // 所有模型都失败了，抛出异常
  throw new Error('All NVIDIA models failed for streaming');
}

// ==========================================
// 非流式调用NVIDIA API（兼容旧代码接口）
// 支持多模型自动降级
// ==========================================
export async function callGLM(
  messages: { role: string; content: string }[],
  temperature: number = 0.8
): Promise<string | null> {
  const modelsToTry = [DEFAULT_CHAT_MODEL, ...CHAT_FALLBACK_MODELS];

  for (const currentModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature,
          max_tokens: 1500,
          stream: false,
          top_p: 0.95,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`NVIDIA API [${currentModel}] error:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;

      // DeepSeek模型可能有reasoning字段，只取正式回答
      const content = message?.content;
      if (content) {
        return content;
      }

      console.warn(`NVIDIA API [${currentModel}] returned empty content`);
    } catch (err) {
      console.warn(`NVIDIA API [${currentModel}] exception:`, err);
    }
  }

  return null;
}
