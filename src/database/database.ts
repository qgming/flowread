import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'flowread.db';

export interface FavoriteWord {
  id: number;
  word: string;
  translation: string;
  definition: string;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  translations?: { [key: string]: string };
  translation_language?: string;
  translation_updated_at?: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          tags TEXT,
          translations TEXT,
          translation_language TEXT,
          translation_updated_at DATETIME
        );
      `);
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorite_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL,
          translation TEXT NOT NULL,
          definition TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(word) ON CONFLICT REPLACE
        );
      `);
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
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
      throw new Error('数据库初始化失败');
    }
  }

  // Article methods
  async getAllArticles(): Promise<Article[]> {
    await this.ensureInitialized();
    
    const result = await this.db!.getAllAsync('SELECT * FROM articles ORDER BY created_at DESC');
    return (result as any[]).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      translations: row.translations ? JSON.parse(row.translations) : undefined,
      translation_language: row.translation_language || undefined,
      translation_updated_at: row.translation_updated_at || undefined
    }));
  }

  async getArticleById(id: number): Promise<Article | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.getFirstAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!result) return null;
    
    return {
      id: (result as any).id,
      title: (result as any).title,
      content: (result as any).content,
      created_at: (result as any).created_at,
      updated_at: (result as any).updated_at,
      tags: (result as any).tags ? JSON.parse((result as any).tags) : [],
      translations: (result as any).translations ? JSON.parse((result as any).translations) : undefined,
      translation_language: (result as any).translation_language || undefined,
      translation_updated_at: (result as any).translation_updated_at || undefined
    };
  }

  async insertArticle(title: string, content: string, tags: string[] = []): Promise<number> {
    await this.ensureInitialized();
    
    const result = await this.db!.runAsync(
      'INSERT INTO articles (title, content, tags) VALUES (?, ?, ?)',
      [title, content, JSON.stringify(tags)]
    );
    
    return result.lastInsertRowId;
  }

  async deleteArticle(id: number): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync('DELETE FROM articles WHERE id = ?', [id]);
  }

  async updateArticle(id: number, title: string, content: string, tags: string[]): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'UPDATE articles SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, JSON.stringify(tags), id]
    );
  }

  async updateArticleTranslations(
    id: number, 
    translations: { [key: string]: string }, 
    language: string
  ): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'UPDATE articles SET translations = ?, translation_language = ?, translation_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(translations), language, id]
    );
  }

  async clearTranslations(id: number): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'UPDATE articles SET translations = NULL, translation_language = NULL, translation_updated_at = NULL WHERE id = ?',
      [id]
    );
  }

  // Favorite words methods
  async addFavoriteWord(word: string, translation: string, definition: string): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'INSERT INTO favorite_words (word, translation, definition) VALUES (?, ?, ?)',
      [word, translation, definition]
    );
  }

  async removeFavoriteWord(word: string): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'DELETE FROM favorite_words WHERE word = ?',
      [word]
    );
  }

  async getFavoriteWords(): Promise<FavoriteWord[]> {
    await this.ensureInitialized();
    
    const result = await this.db!.getAllAsync('SELECT * FROM favorite_words ORDER BY created_at DESC');
    return (result as any[]).map(row => ({
      id: row.id,
      word: row.word,
      translation: row.translation,
      definition: row.definition,
      created_at: row.created_at
    }));
  }

  async isWordFavorite(word: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const result = await this.db!.getFirstAsync(
      'SELECT 1 FROM favorite_words WHERE word = ?',
      [word]
    );
    return !!result;
  }

  // 获取单词的翻译和定义
  async getWordData(word: string): Promise<{ translation: string; definition: string } | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.getFirstAsync(
      'SELECT translation, definition FROM favorite_words WHERE word = ?',
      [word]
    );
    
    if (!result) return null;
    
    return {
      translation: (result as any).translation,
      definition: (result as any).definition
    };
  }

  // 更新单词的翻译和定义
  async updateWordData(word: string, translation: string, definition: string): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      'INSERT OR REPLACE INTO favorite_words (word, translation, definition) VALUES (?, ?, ?)',
      [word, translation, definition]
    );
  }
}

export default new Database();
