import * as Speech from 'expo-speech';
import { loadSettings } from '../utils/settingsStorage';

// 简化的TTS接口
interface SimpleTTS {
  speak(text: string, language?: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}

// 使用Expo Speech的实现
class ExpoSpeechService implements SimpleTTS {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      // 检查Speech是否可用
      this.isAvailable = true; 
    } catch (error) {
      console.error('检查TTS可用性失败:', error);
      this.isAvailable = false;
    }
  }

  async speak(text: string, language?: string) {
    try {
      if (!this.isAvailable) {
        console.warn('TTS不可用');
        return;
      }

      const settings = await loadSettings();
      
      // 只使用系统TTS，不再支持API音频
      await this.playSystemTTS(text, language);
      
    } catch (error) {
      console.error('朗读失败:', error);
      throw error;
    }
  }

  private async playSystemTTS(text: string, language?: string) {
    const settings = await loadSettings();
    
    const lang = language || settings.speech.language;
    const rate = settings.speech.rate;
    
    Speech.speak(text, {
      language: lang,
      rate: rate,
    });
  }

  async stop() {
    try {
      // 停止系统TTS
      Speech.stop();
    } catch (error) {
      console.error('停止朗读失败:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      return false;
    }
  }
}

// 创建单例实例
export const speechService = new ExpoSpeechService();

// 简化的朗读函数
export const speakWord = async (text: string, language?: string) => {
  try {
    await speechService.speak(text, language);
  } catch (error) {
    console.error('朗读单词失败:', error);
    throw error;
  }
};

// 停止朗读
export const stopSpeaking = async () => {
  try {
    await speechService.stop();
  } catch (error) {
    console.error('停止朗读失败:', error);
  }
};

// 检测TTS是否可用
export const isTTSAvailable = async (): Promise<boolean> => {
  try {
    return true; // 在Expo环境中假设可用
  } catch (error) {
    return false;
  }
};

// 朗读设置接口（移除audioSource字段）
export interface SpeechSettings {
  autoSpeak: boolean;
  rate: number;
  language: string;
}

// 默认朗读设置（移除audioSource）
export const defaultSpeechSettings: SpeechSettings = {
  autoSpeak: false,
  rate: 0.7,
  language: 'en-US',
};
