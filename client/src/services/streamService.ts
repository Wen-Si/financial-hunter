// ==========================================
// GLM 流式API调用服务
// 支持 SSE (Server-Sent Events) 流式输出
// ==========================================

const GLM_API_KEY = '7b8a15f57d2941a69fcce60f49f7c6ff.SiMrZjCdyOmdtzLr';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 流式调用GLM API，逐token返回（可控制速度）
export async function* streamGLM(
  messages: { role: string; content: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    speedFactor?: number; // 速度因子：1=正常，0.5=慢速（延迟翻倍）
  } = {}
): AsyncGenerator<string> {
  const {
    temperature = 0.85,
    maxTokens = 2000,
    model = 'glm-4.7-flash',
    speedFactor = 0.5, // 默认降速50%
  } = options;

  const baseDelay = 30; // 基础延迟ms
  const delay = baseDelay / speedFactor; // speedFactor=0.5 → delay=60ms

  const response = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true, // 开启流式输出
    }),
  });

  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 解析SSE格式的数据
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留不完整的行

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            // 添加延迟控制流式速度
            await new Promise(resolve => setTimeout(resolve, delay));
            yield content;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// 非流式调用（兼容旧代码）
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
        model: 'glm-4.7-flash',
        messages,
        temperature,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
