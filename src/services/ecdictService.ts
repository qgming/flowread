import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export interface ECDICTWord {
  word: string;
  phonetic: string;
  definition: string;
  translation: string;
  pos: string;
  collins: string;
  oxford: string;
  tag: string;
  bnc: string;
  frq: string;
  exchange: string;
  detail: string;
  audio: string;
}

class ECDICTService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      // 复制assets中的words.db到应用目录
      const asset = Asset.fromModule(require('../../assets/words.db'));
      await asset.downloadAsync();
      
      const localUri = `${FileSystem.documentDirectory}words.db`;
      
      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        // 复制数据库文件
        await FileSystem.copyAsync({
          from: asset.localUri!,
          to: localUri
        });
      }

      // 打开数据库
      this.db = await SQLite.openDatabaseAsync(localUri);
      this.isInitialized = true;
      console.log('ECDICT database initialized successfully');
    } catch (error) {
      console.error('Error initializing ECDICT database:', error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('ECDICT数据库初始化失败');
    }
  }

  async queryWord(word: string): Promise<ECDICTWord | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.getFirstAsync(
        'SELECT * FROM words WHERE word = ? COLLATE NOCASE',
        [word.trim().toLowerCase()]
      );
      
      if (!result) {
        return null;
      }

      return {
        word: (result as any).word,
        phonetic: (result as any).phonetic || '',
        definition: (result as any).definition || '',
        translation: (result as any).translation || '',
        pos: (result as any).pos || '',
        collins: (result as any).collins || '',
        oxford: (result as any).oxford || '',
        tag: (result as any).tag || '',
        bnc: (result as any).bnc || '',
        frq: (result as any).frq || '',
        exchange: (result as any).exchange || '',
        detail: (result as any).detail || '',
        audio: (result as any).audio || ''
      };
    } catch (error) {
      console.error('查询单词失败:', error);
      return null;
    }
  }

  async searchWords(prefix: string, limit: number = 10): Promise<string[]> {
    await this.ensureInitialized();
    
    try {
      const results = await this.db!.getAllAsync(
        'SELECT word FROM words WHERE word LIKE ? COLLATE NOCASE ORDER BY word LIMIT ?',
        [`${prefix.toLowerCase()}%`, limit]
      );
      
      return (results as any[]).map(row => row.word);
    } catch (error) {
      console.error('搜索单词失败:', error);
      return [];
    }
  }

  async getWordCount(): Promise<number> {
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.getFirstAsync('SELECT COUNT(*) as count FROM words');
      return (result as any).count || 0;
    } catch (error) {
      console.error('获取单词数量失败:', error);
      return 0;
    }
  }
}

export const ecdictService = new ECDICTService();
export default ecdictService;
