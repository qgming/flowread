import { AIProviderConfig } from '../utils/settingsStorage';
import EventSource from 'react-native-sse';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
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
    const { messages, temperature = 1.0, maxTokens = 2000, signal } = options;

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
        signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // 如果无法解析错误响应，使用默认消息
        }
        throw new Error(errorMessage);
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
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求已取消');
      }
      console.error('Chat API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 流式聊天请求 - 使用 react-native-sse 实现
   */
  async *chatStream(options: Omit<ChatCompletionOptions, 'stream'>): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, temperature = 1.0, maxTokens = 2000, signal } = options;

    try {
      // 检查配置
      if (!this.config.url || !this.config.apiKey) {
        throw new Error('AI服务配置不完整，请检查API地址和密钥');
      }

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

      // 构建完整的URL和headers
      const url = `${this.config.url}/chat/completions`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'text/event-stream',
      };

      return yield* this.createEventSourceStream(url, requestBody, headers, signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求已取消');
      }
      console.error('Chat stream error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 使用 EventSource 创建流式连接
   */
  private async *createEventSourceStream(
    url: string,
    requestBody: any,
    headers: Record<string, string>,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // 如果信号已经中止，立即返回
    if (signal?.aborted) {
      return;
    }

    const eventSource = new EventSource(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      pollingInterval: 0,
    });

    let isAborted = false;
    let content = '';

    // 监听取消信号
    if (signal) {
      const abortHandler = () => {
        isAborted = true;
        eventSource.close();
      };
      
      signal.addEventListener('abort', abortHandler);
      
      // 如果信号已经被中止
      if (signal.aborted) {
        eventSource.close();
        return;
      }
    }

    try {
      // 等待连接建立
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('连接超时'));
        }, 10000);

        const handleOpen = () => {
          clearTimeout(timeout);
          eventSource.removeEventListener('open', handleOpen);
          eventSource.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (event: any) => {
          clearTimeout(timeout);
          eventSource.removeEventListener('open', handleOpen);
          eventSource.removeEventListener('error', handleError);
          const errorMessage = event?.message || '连接失败';
          reject(new Error('连接失败: ' + errorMessage));
        };

        eventSource.addEventListener('open', handleOpen);
        eventSource.addEventListener('error', handleError);
      });

      // 检查是否已中止
      if (isAborted || signal?.aborted) {
        return;
      }

      // 使用队列处理消息
      const messageQueue: any[] = [];
      let resolveMessage: ((value: any) => void) | null = null;

      const messageHandler = (event: any) => {
        if (isAborted || signal?.aborted) return;
        
        if (resolveMessage) {
          resolveMessage(event);
          resolveMessage = null;
        } else {
          messageQueue.push(event);
        }
      };

      const errorHandler = (error: any) => {
        if (isAborted || signal?.aborted) return;
        
        if (resolveMessage) {
          resolveMessage(null);
          resolveMessage = null;
        } else {
          messageQueue.push(null);
        }
      };

      eventSource.addEventListener('message', messageHandler);
      eventSource.addEventListener('error', errorHandler);

      try {
        while (!isAborted && !signal?.aborted) {
          let event: any;
          
          if (messageQueue.length > 0) {
            event = messageQueue.shift();
          } else {
            event = await new Promise<any>((resolve) => {
              resolveMessage = resolve;
            });
          }

          if (isAborted || signal?.aborted) {
            break;
          }

          if (!event) {
            // 连接已关闭或出错
            break;
          }

          const data = event.data;

          if (data === '[DONE]') {
            yield { content: '', isComplete: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0];
            
            if (choice?.delta?.content) {
              content += choice.delta.content;
              yield { content: choice.delta.content, isComplete: false };
            }
            
            if (parsed.error) {
              throw new Error(`API错误: ${parsed.error.message || JSON.stringify(parsed.error)}`);
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理下一条
            console.warn('Failed to parse SSE data:', parseError);
          }
        }
      } finally {
        eventSource.removeEventListener('message', messageHandler);
        eventSource.removeEventListener('error', errorHandler);
      }

      // 确保发送完成信号
      if (!isAborted && !signal?.aborted) {
        yield { content: '', isComplete: true };
      }
    } finally {
      eventSource.close();
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
      if (message.includes('network') || message.includes('fetch') || message.includes('failed') || message.includes('sse')) {
        return new Error('网络连接失败，请检查网络设置');
      }
      if (message.includes('timeout')) {
        return new Error('请求超时，请检查网络连接或稍后重试');
      }
      if (message.includes('abort')) {
        return new Error('请求已取消');
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
