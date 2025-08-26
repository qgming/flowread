import { AIProviderConfig } from '../utils/settingsStorage';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export class ChatService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * 发送聊天请求
   */
  async chat(options: ChatCompletionOptions): Promise<ChatResponse> {
    const { messages, temperature = 1.0, maxTokens = 2000, stream = false } = options;

    const requestBody = {
      model: this.config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature,
      max_tokens: maxTokens,
      stream
    };

    try {
      const response = await fetch(`${this.config.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, temperature = 1.0, maxTokens = 2000 } = options;

    const requestBody = {
      model: this.config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    try {
      const response = await fetch(`${this.config.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { content: '', isComplete: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                yield { content: delta.content, isComplete: false };
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      yield { content: '', isComplete: true };
    } catch (error) {
      console.error('Chat stream error:', error);
      throw error;
    }
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: ChatMessage[] = [
        { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
      ];

      const response = await this.chat({
        messages: testMessages,
        maxTokens: 10,
      });

      return response.content.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取支持的模型列表（如果API支持）
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.url}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id || model.name).filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('Get models error:', error);
      return [];
    }
  }
}

/**
 * 创建聊天服务实例
 */
export const createChatService = (config: AIProviderConfig): ChatService => {
  return new ChatService(config);
};

/**
 * 格式化错误消息
 */
export const formatChatError = (error: any): string => {
  if (error.message?.includes('401')) {
    return 'API密钥无效，请检查配置';
  }
  if (error.message?.includes('404')) {
    return '模型不存在或API地址错误';
  }
  if (error.message?.includes('429')) {
    return '请求过于频繁，请稍后再试';
  }
  if (error.message?.includes('500')) {
    return '服务器内部错误，请稍后再试';
  }
  return error.message || '网络错误，请检查网络连接';
};
