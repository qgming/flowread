import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { loadSettings } from '../utils/settingsStorage';
import { dictionaryService } from './dictionary';

// 简化的TTS接口
interface SimpleTTS {
  speak(text: string, language?: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}

// 音频播放状态接口
interface AVPlaybackStatus {
  isLoaded: boolean;
  didJustFinish?: boolean;
  [key: string]: any;
}

// 使用Expo Speech的实现
class ExpoSpeechService implements SimpleTTS {
  private isAvailable = false;
  private currentSound: Audio.Sound | null = null;

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
      
      // 根据设置选择音频来源
      if (settings.speech.audioSource === 'api') {
        // 使用API音频 - 优先获取音频链接
        console.log('使用API音频模式，优先获取音频链接');
        await this.playWithAPIAudio(text, language);
      } else {
        // 使用系统TTS
        await this.playSystemTTS(text, language);
      }
    } catch (error) {
      console.error('朗读失败:', error);
      throw error;
    }
  }

  private async playWithAPIAudio(text: string, language?: string) {
    try {
      // 1. 优先尝试获取API音频链接
      const audioUrl = await this.getAudioUrlWithFallback(text);
      
      if (audioUrl) {
        // 2. 如果获取到音频链接，播放网络音频
        console.log('获取到音频链接，播放网络音频:', audioUrl);
        await this.playNetworkAudio(audioUrl);
      } else {
        // 3. 如果没有获取到音频链接，回退到系统TTS
        console.log('未获取到音频链接，回退到系统TTS');
        await this.playSystemTTS(text, language);
      }
    } catch (error) {
      console.error('API音频播放失败，回退到系统TTS:', error);
      // 4. 如果播放网络音频失败，回退到系统TTS
      await this.playSystemTTS(text, language);
    }
  }

  private async getAudioUrlWithFallback(text: string): Promise<string | null> {
    try {
      // 从API获取音频URL
      const apiAudioUrl = await dictionaryService.getAudioUrl(text);
      if (apiAudioUrl) {
        return apiAudioUrl;
      }
      
      // 可以在这里添加从数据库获取音频URL的逻辑
      // const dbAudioUrl = await getDatabaseAudioUrl(text);
      // if (dbAudioUrl) {
      //   return dbAudioUrl;
      // }
      
      return null;
    } catch (error) {
      console.error('获取音频URL失败:', error);
      return null;
    }
  }

  async playNetworkAudio(audioUrl: string): Promise<void> {
    try {
      // 停止当前播放
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      // 配置音频
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 创建并加载音频
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      this.currentSound = sound;
      
      // 播放音频
      await sound.playAsync();
      
      // 音频播放完成后的清理
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          this.currentSound = null;
        }
      });
    } catch (error) {
      console.error('播放网络音频失败:', error);
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
      
      // 停止网络音频
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
    } catch (error) {
      console.error('停止朗读失败:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      const isSpeechSpeaking = await Speech.isSpeakingAsync();
      const isNetworkAudioPlaying = this.currentSound !== null;
      return isSpeechSpeaking || isNetworkAudioPlaying;
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

// 朗读设置接口
export interface SpeechSettings {
  rate: number;
  language: string;
  audioSource: 'api' | 'system';
}

// 默认朗读设置
export const defaultSpeechSettings: SpeechSettings = {
  rate: 0.7,
  language: 'en-US',
  audioSource: 'api'
};

// 获取API音频URL的函数
export const getAPIAudioUrl = async (word: string): Promise<string | null> => {
  try {
    return await dictionaryService.getAudioUrl(word);
  } catch (error) {
    console.error('获取API音频URL失败:', error);
    return null;
  }
};

// 播放指定音频URL的函数
export const playAudioUrl = async (audioUrl: string): Promise<void> => {
  try {
    await speechService.playNetworkAudio(audioUrl);
  } catch (error) {
    console.error('播放指定音频URL失败:', error);
    throw error;
  }
};
