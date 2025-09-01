import { ecdictService, ECDICTWord } from './ecdictService';

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface WordDetails {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  audioUrl?: string;
  translation?: string;
  collins?: string;
  oxford?: string;
  tags?: string[];
  bnc?: string;
  frq?: string;
  exchange?: string;
  sourceUrls: string[];
}

class DictionaryService {
  async getWordDetails(word: string): Promise<WordDetails | null> {
    try {
      const ecdictWord = await ecdictService.queryWord(word);
      
      if (!ecdictWord) {
        return null;
      }

      // 转换ECDICT数据格式到应用格式
      const meanings: DictionaryMeaning[] = [];
      
      // 处理词性(pos)和定义(definition)
      if (ecdictWord.definition || ecdictWord.pos) {
        const definitions: DictionaryDefinition[] = [];
        
        if (ecdictWord.definition) {
          // 分割多行定义，正确处理换行符
          const defLines = ecdictWord.definition
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
          
          defLines.forEach(line => {
            definitions.push({
              definition: line
            });
          });
        }

        // 处理词性
        const partsOfSpeech = ecdictWord.pos
          .split('/')
          .map(pos => pos.trim())
          .filter(pos => pos.length > 0);
        
        if (partsOfSpeech.length > 0) {
          partsOfSpeech.forEach(pos => {
            meanings.push({
              partOfSpeech: pos,
              definitions: definitions
            });
          });
        } else if (definitions.length > 0) {
          // 如果没有词性但有定义，添加一个默认词性
          meanings.push({
            partOfSpeech: '释义',
            definitions: definitions
          });
        }
      }

      // 处理详细释义中的换行符
      if (ecdictWord.detail) {
        const detailLines = ecdictWord.detail
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        if (detailLines.length > 0) {
          // 将详细释义添加到现有释义中
          const detailDefinitions = detailLines.map(line => ({
            definition: line
          }));
          
          if (meanings.length > 0) {
            meanings[0].definitions.push(...detailDefinitions);
          } else {
            meanings.push({
              partOfSpeech: '详细释义',
              definitions: detailDefinitions
            });
          }
        }
      }

      // 处理音标
      const phonetics: DictionaryPhonetic[] = [];
      if (ecdictWord.phonetic) {
        phonetics.push({
          text: ecdictWord.phonetic
        });
      }

      // 处理标签
      const tags: string[] = [];
      if (ecdictWord.tag) {
        tags.push(...ecdictWord.tag.split(' ').filter(tag => tag.trim()));
      }

      // 处理翻译中的换行符
      let processedTranslation = ecdictWord.translation || '';
      if (processedTranslation) {
        // 标准化换行符
        processedTranslation = processedTranslation.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      }

      return {
        word: ecdictWord.word,
        phonetic: ecdictWord.phonetic || undefined,
        phonetics,
        meanings,
        audioUrl: ecdictWord.audio || undefined,
        translation: processedTranslation || undefined,
        collins: ecdictWord.collins || undefined,
        oxford: ecdictWord.oxford || undefined,
        tags: tags.length > 0 ? tags : undefined,
        bnc: ecdictWord.bnc || undefined,
        frq: ecdictWord.frq || undefined,
        exchange: ecdictWord.exchange || undefined,
        sourceUrls: []
      };
    } catch (error) {
      console.error('获取单词详情失败:', error);
      return null;
    }
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

  async searchWords(prefix: string, limit: number = 10): Promise<string[]> {
    return await ecdictService.searchWords(prefix, limit);
  }

  async getWordCount(): Promise<number> {
    return await ecdictService.getWordCount();
  }
}

export const dictionaryService = new DictionaryService();
export default dictionaryService;
