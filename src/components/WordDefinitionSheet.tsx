import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import database from '../database/database';
import Markdown from 'react-native-markdown-display';
import { loadSettings } from '../utils/settingsStorage';
import { DeepLXTranslationService } from '../services/translation';
import { ChatService } from '../services/chat';
import { getFromCache, saveToCache } from '../services/wordCache';

const { height: screenHeight } = Dimensions.get('window');

interface WordDefinitionSheetProps {
  visible: boolean;
  onClose: () => void;
  word: string;
  context: string;
}

export default function WordDefinitionSheet({ visible, onClose, word, context }: WordDefinitionSheetProps) {
  const [translation, setTranslation] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 用于请求管理的引用
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const requestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const translationRef = useRef<string>('');

  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // 当组件可见且单词变化时获取数据
  useEffect(() => {
    if (visible && word.trim()) {
      // 先尝试从缓存获取
      getFromCache(word).then(cached => {
        if (cached && isMountedRef.current) {
          setTranslation(cached.translation);
          setDefinition(cached.definition);
          setError(null);
        } else {
          // 没有缓存再调用API
          fetchWordData();
        }
      }).catch(() => {
        fetchWordData();
      });
    } else if (!visible) {
      cleanup();
      if (isMountedRef.current) {
        setTranslation('');
        setDefinition('');
        setError(null);
      }
    }
  }, [visible, word, context, cleanup]);

  // 获取单词数据
  const fetchWordData = useCallback(async () => {
    if (!word.trim() || !isMountedRef.current) return;
    
    // 不再重复检查缓存，因为外层已经检查过

    // 强制取消之前的请求
    cleanup();
    
    // 重置状态
    if (isMountedRef.current) {
      setTranslation('');
      setDefinition('');
      setError(null);
    }
    
    // 递增请求ID，确保旧请求被忽略
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 并行获取翻译和定义
    await Promise.all([
      fetchTranslation(currentRequestId, signal),
      fetchDefinitionContent(currentRequestId, signal)
    ]);
  }, [word, context, cleanup]);

  // 获取翻译
  const fetchTranslation = async (requestId: number, signal: AbortSignal) => {
    if (!isMountedRef.current || requestId !== requestIdRef.current) return;
    
    setLoadingTranslation(true);
    try {
      const settings = await loadSettings();
      const translationService = new DeepLXTranslationService(settings.deeplx);
      const deeplTranslation = await translationService.translate({
        text: word,
        target_lang: 'ZH',
      });
      
      if (isMountedRef.current && requestId === requestIdRef.current && !signal.aborted) {
        setTranslation(deeplTranslation);
        translationRef.current = deeplTranslation;
      }
    } catch (err) {
      if (isMountedRef.current && requestId === requestIdRef.current && !signal.aborted) {
        console.error('翻译获取失败:', err);
        setTranslation('翻译失败，请检查网络连接');
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoadingTranslation(false);
      }
    }
  };

  // 获取单词定义
  const fetchDefinitionContent = async (requestId: number, signal: AbortSignal) => {
    if (!isMountedRef.current || requestId !== requestIdRef.current) return;
    
    setLoadingDefinition(true);
    setDefinition('');
    setError(null);
    
    try {
      const settings = await loadSettings();
      const provider = settings.aiProviders[settings.analysis.wordAnalysisProvider];
      
      if (!provider?.isEnabled || !provider.apiKey) {
        if (isMountedRef.current && requestId === requestIdRef.current && !signal.aborted) {
          setError('AI解析服务未配置，请在设置中配置AI提供商');
          setLoadingDefinition(false);
        }
        return;
      }

      if (!provider.url || !provider.model) {
        if (isMountedRef.current && requestId === requestIdRef.current && !signal.aborted) {
          setError('AI服务配置不完整，请检查API地址和模型名称');
          setLoadingDefinition(false);
        }
        return;
      }

      const chatService = new ChatService(provider);
      
      const prompt = `你是一名全国知名英语老师，面向高中生教学，知识渊博，风趣幽默，深受学生喜爱，喜欢使用Emoji，请详细分析以下单词：

**单词**：${word}
**上下文**：${context}

## 分析内容：
1. **词义词性音标**
2. **例句**（2个）
3. **常见搭配**
4. **同义词/反义词**
5. **记忆技巧**`;

      const stream = chatService.chatStream({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        signal,
      });

      let content = '';
      let isCompleted = false;
      
      try {
        for await (const chunk of stream) {
          // 检查是否应该继续处理
          if (!isMountedRef.current || 
              requestId !== requestIdRef.current || 
              signal.aborted) {
            break;
          }
          
          if (chunk?.content) {
            content += chunk.content;
            if (isMountedRef.current && requestId === requestIdRef.current) {
              setDefinition(content);
            }
          }
        }
        isCompleted = true;
        
        // 只有完全完成且数据有效才保存缓存
        if (isCompleted && translationRef.current && content) {
          saveToCache({
            word,
            translation: translationRef.current,
            definition: content,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        if (!isMountedRef.current || 
            requestId !== requestIdRef.current || 
            signal.aborted) {
          return;
        }
        throw err;
      }
      
      if (isMountedRef.current && 
          requestId === requestIdRef.current && 
          !signal.aborted) {
        if (!content.trim()) {
          setDefinition('暂无解析内容');
        }
      }
      
    } catch (err) {
      if (isMountedRef.current && 
          requestId === requestIdRef.current && 
          !signal.aborted) {
        console.error('单词解析错误:', err);
        setError('获取AI解析失败，请检查网络连接');
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoadingDefinition(false);
      }
    }
  };

  // 处理关闭事件
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // 检查单词是否已收藏
  useEffect(() => {
    const checkFavorite = async () => {
      if (word) {
        const isFav = await database.isWordFavorite(word);
        setIsFavorite(isFav);
      }
    };
    checkFavorite();
  }, [word]);

  // 切换收藏状态
  const toggleFavorite = useCallback(async () => {
    if (!word || !translation || !definition) return;
    
    if (isFavorite) {
      await database.removeFavoriteWord(word);
    } else {
      await database.addFavoriteWord(word, translation, definition);
    }
    setIsFavorite(!isFavorite);
  }, [word, translation, definition, isFavorite]);

  // 重试获取定义
  const handleRetry = useCallback(() => {
    if (word.trim()) {
      fetchWordData();
    }
  }, [word, fetchWordData]);

  useEffect(() => {
    if (!loadingDefinition && definition) {
      // 确保内容完全渲染
      const timer = setTimeout(() => {}, 300);
      return () => clearTimeout(timer);
    }
  }, [loadingDefinition, definition]);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.wordText}>{word}</Text>
              <TouchableOpacity onPress={fetchWordData} style={styles.closeButton}>
                <Ionicons name="refresh" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                  name={isFavorite ? "star" : "star-outline"} 
                  size={24} 
                  color={isFavorite ? "#FFD700" : "#007AFF"} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.translationSection}>
                {loadingTranslation ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <View style={styles.translationCapsule}>
                    <Text style={styles.translationText}>{translation}</Text>
                  </View>
                )}
              </View>

              <View style={styles.definitionSection}>
                <View style={styles.definitionHeader}>
                  <Text style={styles.definitionTitle}>Flow老师</Text>
                  {loadingDefinition && (
                    <View style={styles.loadingStatus}>
                      <ActivityIndicator size="small" color="#007AFF" />
                      <Text style={styles.loadingStatusText}>解析中</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.definitionScrollContainer}>
                  <ScrollView 
                    ref={scrollViewRef}
                    style={styles.definitionScroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    scrollEventThrottle={16}
                    bounces={true}
                    overScrollMode="always"
                    nestedScrollEnabled={true}
                  >
                    {error ? (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={24} color="#ff3b30" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                          <Text style={styles.retryButtonText}>重试</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.markdownWrapper}>
                        <Markdown style={markdownStyles}>
                          {definition}
                        </Markdown>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  blockquote: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.7,
    maxHeight: screenHeight * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  favoriteButton: {
    padding: 4,
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  translationSection: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  translationCapsule: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  translationText: {
    fontSize: 16,
    color: '#1565c0',
  },
  definitionSection: {
    flex: 1,
    paddingVertical: 10,
  },
  definitionScrollContainer: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  definitionScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  markdownWrapper: {
    padding: 12,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  definitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  definitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  loadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingStatusText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 6,
  },
});
