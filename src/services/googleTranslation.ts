import { TranslationService, TranslationRequest, LanguageCode } from './translation';

export class GoogleTranslationService implements TranslationService {
  private static readonly API_URL = 'https://translate.googleapis.com/translate_a/single';

  /**
   * 验证语言代码是否受支持
   */
  isLanguageSupported(langCode: string): boolean {
    return langCode in require('./translation').SUPPORTED_LANGUAGES || langCode === 'auto';
  }

  /**
   * 翻译文本
   */
  async translate(request: TranslationRequest): Promise<string> {
    this.validateRequest(request);

    try {
      const params: any = {
        client: 'gtx',
        sl: request.source_lang || 'auto',
        tl: request.target_lang,
        dt: 't',
        strip: 1,
        nonced: 1,
        q: encodeURIComponent(request.text),
      };

      const queryString = Object.keys(params)
        .map((key: string) => key + '=' + params[key])
        .join('&');

      const response = await fetch(`${GoogleTranslationService.API_URL}?${queryString}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`翻译失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result || !Array.isArray(result) || !Array.isArray(result[0])) {
        throw new Error('无效的翻译响应格式');
      }

      let sentence = '';
      result[0].forEach((e: any) => {
        if (Array.isArray(e) && e.length > 0) {
          sentence += e[0];
        }
      });

      if (!sentence.trim()) {
        throw new Error('翻译结果为空');
      }

      return sentence.trim();
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
      console.error('谷歌翻译连接测试失败:', error);
      return false;
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
    // 谷歌翻译不需要配置，此方法留空
  }
}

export const createGoogleTranslationService = (): GoogleTranslationService => {
  return new GoogleTranslationService();
};
