import { TranslationService, TranslationRequest, LanguageCode, SUPPORTED_LANGUAGES } from './types';

export class BingTranslationService implements TranslationService {
  private static readonly API_URL = 'https://api-edge.cognitive.microsofttranslator.com/translate';
  private static readonly AUTH_URL = 'https://edge.microsoft.com/translate/auth';

  /**
   * 验证语言代码是否受支持
   */
  isLanguageSupported(langCode: string): boolean {
    return langCode in SUPPORTED_LANGUAGES || langCode === 'auto';
  }

  /**
   * 翻译文本
   */
  async translate(request: TranslationRequest): Promise<string> {
    this.validateRequest(request);

    try {
      const jwtToken = await this.refreshToken();
      const fromLang = request.source_lang === 'auto' ? '' : request.source_lang || '';

      const response = await fetch(
        `${BingTranslationService.API_URL}?from=${fromLang}&to=${request.target_lang}&api-version=3.0&includeSentenceLength=true&textType=html`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + jwtToken,
          },
          body: JSON.stringify([{ Text: request.text }]),
        }
      );

      if (!response.ok) {
        throw new Error(`翻译失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result || !result[0] || !result[0].translations || !result[0].translations[0]) {
        throw new Error('无效的翻译响应格式');
      }

      return result[0].translations[0].text;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`翻译请求失败: ${String(error)}`);
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testText = 'Hello, world!';
      const result = await this.translate({
        text: testText,
        target_lang: 'ZH',
      });
      
      return Boolean(result && result !== testText);
    } catch (error) {
      console.error('Bing翻译连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取或刷新JWT令牌
   */
  private async refreshToken(): Promise<string> {
    try {
      const response = await fetch(BingTranslationService.AUTH_URL);
      if (!response.ok) {
        throw new Error(`获取令牌失败: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`获取Bing翻译令牌失败: ${String(error)}`);
    }
  }

  /**
   * 验证翻译请求参数
   */
  private validateRequest(request: TranslationRequest): void {
    if (!request.text || typeof request.text !== 'string') {
      throw new Error('翻译文本不能为空');
    }

    if (!request.target_lang) {
      throw new Error('目标语言不能为空');
    }

    if (!this.isLanguageSupported(request.target_lang)) {
      throw new Error(`不支持的目标语言: ${request.target_lang}`);
    }

    if (request.source_lang && request.source_lang !== 'auto' && !this.isLanguageSupported(request.source_lang)) {
      throw new Error(`不支持的源语言: ${request.source_lang}`);
    }
  }

  updateConfig(): void {
    // Bing翻译不需要配置，此方法留空
  }
}

export const createBingTranslationService = (): BingTranslationService => {
  return new BingTranslationService();
};
