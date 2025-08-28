import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIProviderConfig {
  name: string;
  description: string;
  url: string;
  apiKey: string;
  model: string;
  isEnabled: boolean;
  temperature: number;
}

export interface DeepLXConfig {
  url: string;
  apiKey: string;
}

export interface AnalysisSettings {
  wordAnalysisProvider: keyof Settings['aiProviders'];
  articleAnalysisProvider: keyof Settings['aiProviders'];
}

export interface TranslationSettings {
  targetLanguage: string;
  translationEngine: 'deeplx' | 'deepseek' | 'siliconflow' | 'zhipu';
  translationPrompt: string;
}

export interface Settings {
  isDarkMode: boolean;
  aiProviders: {
    deepseek: AIProviderConfig;
    siliconflow: AIProviderConfig;
    zhipu: AIProviderConfig;
  };
  deeplx: DeepLXConfig;
  translation: TranslationSettings;
  analysis: AnalysisSettings;
}

const SETTINGS_KEY = 'app_settings';

export const defaultAIProviders = {
  deepseek: {
    name: 'DeepSeek',
    description: 'DeepSeek 提供的高性能AI模型，支持多种语言和任务',
    url: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    isEnabled: false,
    temperature: 1.0,
  },
  siliconflow: {
    name: '硅基流动',
    description: '硅基流动提供的多样化AI模型，包括Qwen系列等开源模型',
    url: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    model: 'Qwen/Qwen3-8B',
    isEnabled: false,
    temperature: 1.0,
  },
  zhipu: {
    name: '智谱AI',
    description: '智谱AI提供的GLM系列模型，专注于中文场景优化',
    url: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    model: 'glm-4.5-flash',
    isEnabled: false,
    temperature: 1.0,
  },
};

export const defaultDeepLXConfig: DeepLXConfig = {
  url: 'https://dplx.xi-xu.me/translate',
  apiKey: '',
};

export const defaultTranslationSettings: TranslationSettings = {
  targetLanguage: 'ZH',
  translationEngine: 'deeplx',
  translationPrompt: '请将以下文本翻译成{targetLanguage}，保持原意准确，语言自然流畅：\n\n{text}',
};

export const defaultAnalysisSettings: AnalysisSettings = {
  wordAnalysisProvider: 'deepseek',
  articleAnalysisProvider: 'deepseek',
};

export const defaultSettings: Settings = {
  isDarkMode: false,
  aiProviders: defaultAIProviders,
  deeplx: defaultDeepLXConfig,
  translation: defaultTranslationSettings,
  analysis: defaultAnalysisSettings,
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      const parsed = JSON.parse(settingsJson);
      return {
        ...defaultSettings,
        ...parsed,
        aiProviders: {
          ...defaultAIProviders,
          ...(parsed.aiProviders || {}),
        },
        deeplx: {
          ...defaultDeepLXConfig,
          ...(parsed.deeplx || {}),
        },
        translation: {
          ...defaultTranslationSettings,
          ...(parsed.translation || {}),
        },
        analysis: {
          ...defaultAnalysisSettings,
          ...(parsed.analysis || {}),
        },
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error('加载设置失败:', error);
    return defaultSettings;
  }
};

export const updateAIProvider = async (
  provider: keyof Settings['aiProviders'],
  config: Partial<AIProviderConfig>
): Promise<void> => {
  try {
    const currentSettings = await loadSettings();
    const newSettings = {
      ...currentSettings,
      aiProviders: {
        ...currentSettings.aiProviders,
        [provider]: {
          ...currentSettings.aiProviders[provider],
          ...config,
        },
      },
    };
    await saveSettings(newSettings);
  } catch (error) {
    console.error('更新AI提供商设置失败:', error);
  }
};

export const updateSetting = async <K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> => {
  try {
    const currentSettings = await loadSettings();
    const newSettings = { ...currentSettings, [key]: value };
    await saveSettings(newSettings);
  } catch (error) {
    console.error('更新设置失败:', error);
  }
};
