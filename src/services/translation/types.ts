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
