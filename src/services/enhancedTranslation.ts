import { TranslationService, TranslationRequest, LanguageCode } from './translation';
import { DeepLXTranslationService } from './translation';
import { ChatService } from './chat';
import { loadSettings } from '../utils/settingsStorage';

export class EnhancedTranslationService implements TranslationService {
  private deeplxService: DeepLXTranslationService;
  private chatService: ChatService | null = null;

  constructor() {
    this.deeplxService = new DeepLXTranslationService({
      url: '',
      apiKey: '',
    });
  }

  async translate(request: TranslationRequest): Promise<string> {
    const settings = await loadSettings();
    const { translationEngine, translationPrompt, targetLanguage } = settings.translation;

    if (translationEngine === 'deeplx') {
      // 使用DeepLX翻译
      this.deeplxService.updateConfig(settings.deeplx);
      return await this.deeplxService.translate(request);
    } else {
      // 使用大模型翻译
      const providerConfig = settings.aiProviders[translationEngine];
      if (!providerConfig || !providerConfig.isEnabled) {
        throw new Error(`${providerConfig?.name || translationEngine} 未启用或未配置`);
      }

      this.chatService = new ChatService(providerConfig);
      
      // 构建提示词
      const prompt = translationPrompt
        .replace('{targetLanguage}', getLanguageName(targetLanguage as LanguageCode))
        .replace('{text}', request.text);

      const response = await this.chatService.chat({
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: 4000,
      });

      return response.content.trim();
    }
  }

  async testConnection(): Promise<boolean> {
    const settings = await loadSettings();
    const { translationEngine } = settings.translation;

    if (translationEngine === 'deeplx') {
      this.deeplxService.updateConfig(settings.deeplx);
      return await this.deeplxService.testConnection();
    } else {
      const providerConfig = settings.aiProviders[translationEngine];
      if (!providerConfig || !providerConfig.isEnabled) {
        return false;
      }

      this.chatService = new ChatService(providerConfig);
      return await this.chatService.testConnection();
    }
  }

  isLanguageSupported(langCode: string): boolean {
    // 支持所有在SUPPORTED_LANGUAGES中的语言
    return langCode in require('./translation').SUPPORTED_LANGUAGES || langCode === 'auto';
  }

  updateConfig(): void {
    // 配置通过loadSettings动态获取，不需要手动更新
  }
}

// 工具函数：获取语言名称
function getLanguageName(langCode: string): string {
  const { SUPPORTED_LANGUAGES } = require('./translation');
  const lang = SUPPORTED_LANGUAGES[langCode as LanguageCode];
  return lang ? lang.name : langCode;
}

// 创建增强翻译服务实例
export const createEnhancedTranslationService = (): EnhancedTranslationService => {
  return new EnhancedTranslationService();
};
