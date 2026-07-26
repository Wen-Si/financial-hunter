// ==========================================
// GLM-4.5-Flash 流式调用服务
// 智谱AI GLM-4.5-Flash 单模型
// ==========================================

const GLM_API_KEY = '7b8a15f57d2941a69fcce60f49f7c6ff.SiMrZjCdyOmdtzLr';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_MODEL = 'glm-4.5-flash';

// ==========================================
// 流式调用GLM API，逐token返回
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
    speedFactor = 0.5,
  } = options;

  const baseDelay = 30;
  const delay = baseDelay / speedFactor;

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GLM_API_KEY}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        top_p: 0.95,
        thinking: { type: 'disabled' },
      }),
    });

    if (!response.ok) {
      console.warn('GLM API stream error:', response.status, response.statusText);
      throw new Error(`GLM API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('GLM API: no response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let tokenCount = 0;

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

    console.log(`streamGLM finished, tokens: ${tokenCount}`);
  } catch (err) {
    console.warn('GLM API stream exception:', err);
    throw err;
  }
}

// ==========================================
// 非流式调用GLM API
// ==========================================
export async function callGLM(
  messages: { role: string; content: string }[],
  temperature: number = 0.8
): Promise<string | null> {
  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages,
        temperature,
        max_tokens: 1500,
        thinking: { type: 'disabled' },
      }),
    });

    if (!response.ok) {
      console.warn('GLM API call failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    return message?.content || null;
  } catch (err) {
    console.warn('GLM API call error:', err);
    return null;
  }
}
