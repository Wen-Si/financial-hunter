// ==========================================
// NVIDIA API 流式调用服务
// 集成多个大模型：MiniMax-M3 / DeepSeek-V4-Flash / GLM-5.2 / DeepSeek-V4-Pro
// 支持多模型自动切换与降级
// ==========================================
// 更新日志：
//   - 根据实测结果调整模型优先级（MiniMax-M3最稳定）
//   - 修复DeepSeek模型流式reasoning_content字段不解析的问题
//   - 移除Kimi-K2.6（账号404无法访问）
//   - 非流式超时增加到45秒，流式保持30秒
//   - 流式超时改为仅限制首token到达时间，内容开始后取消超时
// ==========================================

const NVIDIA_API_KEY = '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// 非流式请求超时（毫秒）- DeepSeek-V4-Pro等推理模型需要更长时间
const CHAT_TIMEOUT_MS = 45000;
// 流式请求首token超时（毫秒）- 超过此时间未收到任何数据则降级
const STREAM_TIMEOUT_MS = 30000;

// 可用模型列表（根据实测结果排序）
export const NVIDIA_MODELS = {
  MINIMAX_M3: 'minimaxai/minimax-m3',                // 最稳定，流式和非流式均可用
  DEEPSEEK_V4: 'deepseek-ai/deepseek-v4-flash',      // 快速推理模型，偶有限流
  GLM_5_2: 'z-ai/glm-5.2',                           // GLM升级版，非流式可用但较慢
  DEEPSEEK_V4_PRO: 'deepseek-ai/deepseek-v4-pro',    // 推理能力最强但响应慢
} as const;

// 默认流式模型（MiniMax-M3实测流式最稳定）
const DEFAULT_STREAM_MODEL = NVIDIA_MODELS.MINIMAX_M3;
// 备选流式模型（主模型失败时按序尝试）
const STREAM_FALLBACK_MODELS = [NVIDIA_MODELS.DEEPSEEK_V4, NVIDIA_MODELS.GLM_5_2, NVIDIA_MODELS.DEEPSEEK_V4_PRO];
// 默认非流式模型（DeepSeek-V4-Flash速度快）
const DEFAULT_CHAT_MODEL = NVIDIA_MODELS.DEEPSEEK_V4;
// 备选非流式模型
const CHAT_FALLBACK_MODELS = [NVIDIA_MODELS.MINIMAX_M3, NVIDIA_MODELS.GLM_5_2, NVIDIA_MODELS.DEEPSEEK_V4_PRO];

// 判断是否为DeepSeek模型（需要特殊处理reasoning_content）
function isDeepSeekModel(model: string): boolean {
  return model.startsWith('deepseek-ai/');
}

// ==========================================
// 流式调用NVIDIA API，逐token返回
// 支持多模型自动降级
// 关键修复：正确处理DeepSeek模型的reasoning_content字段
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
    const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

    try {
      const requestBody: Record<string, unknown> = {
        model: currentModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        top_p: 0.95,
      };

      // DeepSeek模型：关闭thinking模式以避免只输出reasoning_content
      if (isDeepSeekModel(currentModel)) {
        requestBody.chat_template_kwargs = { thinking: false };
      }

      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
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
      let hasReasoning = false;

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
              const delta = json.choices?.[0]?.delta;
              if (!delta) continue;

              // 优先读取content字段（正式回答）
              const content = delta.content;
              if (content) {
                hasContent = true;
                tokenCount++;
                await new Promise(resolve => setTimeout(resolve, delay));
                yield content;
              }

              // 跟踪是否有reasoning_content（DeepSeek推理过程）
              if (delta.reasoning_content) {
                hasReasoning = true;
              }
            } catch {
              // 部分行可能不完整，跳过
            }
          }
        }
      }

      // 如果成功获取到content内容，直接返回
      if (hasContent) {
        console.log(`streamGLM [${currentModel}] finished, tokens:`, tokenCount);
        return;
      }

      // DeepSeek模型可能只输出了reasoning_content没有content
      // （thinking模式未完全关闭或token限制导致推理未完成）
      if (hasReasoning) {
        console.warn(`NVIDIA API [${currentModel}] only produced reasoning_content, no content. Trying fallback...`);
      } else {
        console.warn(`NVIDIA API [${currentModel}] returned no content, trying fallback...`);
      }
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
// 关键修复：正确处理DeepSeek模型的reasoning_content字段
// ==========================================
export async function callGLM(
  messages: { role: string; content: string }[],
  temperature: number = 0.8
): Promise<string | null> {
  const modelsToTry = [DEFAULT_CHAT_MODEL, ...CHAT_FALLBACK_MODELS];

  for (const currentModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const requestBody: Record<string, unknown> = {
        model: currentModel,
        messages,
        temperature,
        max_tokens: 1500,
        stream: false,
        top_p: 0.95,
      };

      // DeepSeek模型：关闭thinking模式
      if (isDeepSeekModel(currentModel)) {
        requestBody.chat_template_kwargs = { thinking: false };
      }

      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`NVIDIA API [${currentModel}] error:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;

      // 只取content字段（正式回答）
      // 不使用reasoning_content：那是DeepSeek的内部推理过程，不包含结构化JSON
      const content = message?.content;
      if (content) {
        return content;
      }

      // 如果只有reasoning_content没有content，说明thinking模式未成功关闭
      // 跳过此模型，尝试下一个模型
      if (message?.reasoning_content) {
        console.warn(`NVIDIA API [${currentModel}] only has reasoning_content (thinking mode not disabled), skipping...`);
        continue;
      }

      console.warn(`NVIDIA API [${currentModel}] returned empty content`);
    } catch (err) {
      console.warn(`NVIDIA API [${currentModel}] exception:`, err);
    }
  }

  return null;
}
