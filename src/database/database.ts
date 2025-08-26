import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'flowread.db';

export interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          tags TEXT
        );
      `);
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async getAllArticles(): Promise<Article[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync('SELECT * FROM articles ORDER BY created_at DESC');
    return (result as any[]).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  }

  async insertArticle(title: string, content: string, tags: string[] = []): Promise<number> {
    if (!this.db) await this.init();
    
    const result = await this.db!.runAsync(
      'INSERT INTO articles (title, content, tags) VALUES (?, ?, ?)',
      [title, content, JSON.stringify(tags)]
    );
    
    return result.lastInsertRowId;
  }

  async deleteArticle(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM articles WHERE id = ?', [id]);
  }

  async updateArticle(id: number, title: string, content: string, tags: string[]): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'UPDATE articles SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, JSON.stringify(tags), id]
    );
  }
}

export default new Database();
