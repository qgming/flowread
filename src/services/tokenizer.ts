export interface Token {
  text: string;
  type: 'word' | 'punctuation' | 'whitespace';
  start: number;
  end: number;
}

export class TokenizerService {
  private static instance: TokenizerService;
  private tokenCache = new Map<string, Token[]>();

  public static getInstance(): TokenizerService {
    if (!TokenizerService.instance) {
      TokenizerService.instance = new TokenizerService();
    }
    return TokenizerService.instance;
  }

  /**
   * 异步分词，使用 setTimeout 避免阻塞UI
   */
  public async tokenizeAsync(text: string): Promise<Token[]> {
    // 检查缓存
    const cacheKey = text;
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      // 使用 setTimeout 让出控制权，避免阻塞UI
      setTimeout(() => {
        const tokens = this.tokenizeSync(text);
        this.tokenCache.set(cacheKey, tokens);
        resolve(tokens);
      }, 0);
    });
  }

  /**
   * 同步分词，用于需要立即结果的场景
   */
  public tokenizeSync(text: string): Token[] {
    if (!text) return [];

    const result: Token[] = [];
    
    // 精确匹配英文单词、缩写、标点符号和空白
    // 匹配: 单词(包括缩写如don't)、标点符号、空白字符
    const regex = /(\w+(?:'\w+)*|[^\w\s]+|\s+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const isWord = /^\w+(?:'\w+)*$/.test(matchedText);
      const isWhitespace = /^\s+$/.test(matchedText);
      
      result.push({
        text: matchedText,
        type: isWord ? 'word' : isWhitespace ? 'whitespace' : 'punctuation',
        start: match.index,
        end: match.index + matchedText.length
      });
    }
    
    return result;
  }

  /**
   * 并发分词多个段落
   */
  public async tokenizeParagraphsAsync(paragraphs: string[]): Promise<Token[][]> {
    // 使用 Promise.all 并发处理所有段落的分词
    const tokenizationPromises = paragraphs.map(text => this.tokenizeAsync(text));
    return Promise.all(tokenizationPromises);
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * 获取缓存大小
   */
  public getCacheSize(): number {
    return this.tokenCache.size;
  }
}

// 导出单例实例
export const tokenizerService = TokenizerService.getInstance();