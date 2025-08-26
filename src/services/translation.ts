import { DeepLXConfig } from '../utils/settingsStorage';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  BG: { name: 'Bulgarian', nativeName: 'Български' },
  ZH: { name: 'Chinese', nativeName: '中文' },
  CS: { name: 'Czech', nativeName: 'Česky' },
  DA: { name: 'Danish', nativeName: 'Dansk' },
  NL: { name: 'Dutch', nativeName: 'Nederlands' },
  EN: { name: 'English', nativeName: 'English' },
  ET: { name: 'Estonian', nativeName: 'Eesti' },
  FI: { name: 'Finnish', nativeName: 'Suomi' },
  FR: { name: 'French', nativeName: 'Français' },
  DE: { name: 'German', nativeName: 'Deutsch' },
  EL: { name: 'Greek', nativeName: 'Ελληνικά' },
  HU: { name: 'Hungarian', nativeName: 'Magyar' },
  IT: { name: 'Italian', nativeName: 'Italiano' },
  JA: { name: 'Japanese', nativeName: '日本語' },
  LV: { name: 'Latvian', nativeName: 'Latviešu' },
  LT: { name: 'Lithuanian', nativeName: 'Lietuvių' },
  PL: { name: 'Polish', nativeName: 'Polski' },
  PT: { name: 'Portuguese', nativeName: 'Português' },
  RO: { name: 'Romanian', nativeName: 'Română' },
  RU: { name: 'Russian', nativeName: 'Русский' },
  SK: { name: 'Slovak', nativeName: 'Slovenčina' },
  SL: { name: 'Slovenian', nativeName: 'Slovenščina' },
  ES: { name: 'Spanish', nativeName: 'Español' },
  SV: { name: 'Swedish', nativeName: 'Svenska' },
  UK: { name: 'Ukrainian', nativeName: 'Українська Мова' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface TranslationRequest {
  text: string;
  source_lang?: LanguageCode | 'auto';
  target_lang: LanguageCode;
}

export interface TranslationResponse {
  data: string;
  code?: number;
  message?: string;
}

export interface TranslationService {
  translate: (request: TranslationRequest) => Promise<string>;
  testConnection: () => Promise<boolean>;
  isLanguageSupported: (langCode: string) => boolean;
}

export class DeepLXTranslationService implements TranslationService {
  private config: DeepLXConfig;

  constructor(config: DeepLXConfig) {
    this.config = config;
  }

  /**
   * 验证语言代码是否受支持
   */
  isLanguageSupported(langCode: string): boolean {
    return langCode in SUPPORTED_LANGUAGES || langCode === 'auto';
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

  async translate(request: TranslationRequest): Promise<string> {
    // 验证请求参数
    this.validateRequest(request);

    if (!this.config.url || !this.config.url.trim()) {
      throw new Error('DeepLX服务地址未配置');
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          text: request.text.trim(),
          source_lang: request.source_lang || 'auto',
          target_lang: request.target_lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const result: TranslationResponse = await response.json();
      
      if (result.code && result.code !== 200) {
        throw new Error(result.message || `翻译失败 (错误码: ${result.code})`);
      }

      if (!result.data || typeof result.data !== 'string') {
        throw new Error('无效的翻译响应格式');
      }

      const translatedText = result.data.trim();
      if (!translatedText) {
        throw new Error('翻译结果为空');
      }

      return translatedText;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`翻译请求失败: ${String(error)}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testText = 'Hello, world!';
      const result = await this.translate({
        text: testText,
        target_lang: 'ZH',
      });
      
      // 明确转换为boolean类型，修复类型错误
      const isSuccess = Boolean(result && result !== testText);
      return isSuccess;
    } catch (error) {
      console.error('DeepLX连接测试失败:', error);
      return false;
    }
  }

  updateConfig(config: DeepLXConfig): void {
    this.config = config;
  }
}

export const createDeepLXService = (config: DeepLXConfig): DeepLXTranslationService => {
  return new DeepLXTranslationService(config);
};

// 工具函数：获取语言名称
export const getLanguageName = (langCode: string): string => {
  const lang = SUPPORTED_LANGUAGES[langCode as LanguageCode];
  return lang ? lang.name : langCode;
};

// 工具函数：获取语言的本地名称
export const getLanguageNativeName = (langCode: string): string => {
  const lang = SUPPORTED_LANGUAGES[langCode as LanguageCode];
  return lang ? lang.nativeName : langCode;
};

// 工具函数：获取所有支持的语言列表
export const getSupportedLanguagesList = (): Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
}> => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code: code as LanguageCode,
    name: info.name,
    nativeName: info.nativeName,
  }));
};
