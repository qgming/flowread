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
   * 非流式聊天请求
   */
  async chat(options: ChatCompletionOptions): Promise<ChatResponse> {
    const { messages, temperature = 1.0, maxTokens = 2000 } = options;

    try {
      const requestBody = {
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: false,
      };

      const response = await fetch(`${this.config.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const choice = data.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('Invalid response format: no content found');
      }

      return {
        content: choice.message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('Chat API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(options: Omit<ChatCompletionOptions, 'stream'>): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, temperature = 1.0, maxTokens = 2000 } = options;

    try {
      const requestBody = {
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      };

      const response = await fetch(`${this.config.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        // 处理空响应体的情况，可能是某些API的特殊情况
        console.warn('Response body is null, attempting to handle gracefully');
        yield { content: '', isComplete: true };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            yield { content: '', isComplete: true };
            break;
          }

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
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  yield { content, isComplete: false };
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
                // 继续处理下一条数据，不中断流
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      throw this.handleError(error);
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
   * 统一错误处理
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('401') || message.includes('invalid api key') || message.includes('unauthorized')) {
        return new Error('API密钥无效，请检查配置');
      }
      if (message.includes('404') || message.includes('model not found') || message.includes('not found')) {
        return new Error('模型不存在或API地址错误');
      }
      if (message.includes('429') || message.includes('rate limit')) {
        return new Error('请求过于频繁，请稍后再试');
      }
      if (message.includes('500') || message.includes('internal server error')) {
        return new Error('服务器内部错误，请稍后再试');
      }
      if (message.includes('network') || message.includes('fetch') || message.includes('failed')) {
        return new Error('网络连接失败，请检查网络设置');
      }
      
      return error;
    }
    
    return new Error('未知错误，请稍后重试');
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
  if (error instanceof Error) {
    return error.message;
  }
  return '网络错误，请检查网络连接';
};
