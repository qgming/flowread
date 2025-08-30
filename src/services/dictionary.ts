export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
  license?: {
    name: string;
    url: string;
  };
}

export interface DictionaryDefinition {
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  license: {
    name: string;
    url: string;
  };
  sourceUrls: string[];
}

export interface WordDetails {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  audioUrl?: string;
  sourceUrls: string[];
}

class DictionaryService {
  private baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';

  async getWordDetails(word: string): Promise<WordDetails | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(word.toLowerCase())}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`单词 "${word}" 未找到`);
          return null;
        }
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data: DictionaryResponse[] = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const firstEntry = data[0];
      
      // 获取最佳音频URL（优先选择有音频的）
      const audioUrl = this.getBestAudioUrl(firstEntry.phonetics);
      
      return {
        word: firstEntry.word,
        phonetic: firstEntry.phonetic,
        phonetics: firstEntry.phonetics,
        meanings: firstEntry.meanings,
        audioUrl,
        sourceUrls: firstEntry.sourceUrls
      };
    } catch (error) {
      console.error('获取单词详情失败:', error);
      return null;
    }
  }

  private getBestAudioUrl(phonetics: DictionaryPhonetic[]): string | undefined {
    // 优先选择有音频的phonetic
    const audioPhonetic = phonetics.find(p => p.audio && p.audio.trim() !== '');
    return audioPhonetic?.audio;
  }

  async getAudioUrl(word: string): Promise<string | null> {
    try {
      const details = await this.getWordDetails(word);
      return details?.audioUrl || null;
    } catch (error) {
      console.error('获取音频URL失败:', error);
      return null;
    }
  }
}

export const dictionaryService = new DictionaryService();
export default dictionaryService;
