import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { loadSettings } from '../utils/settingsStorage';
import { ChatService } from '../services/chat';
import database from '../database/database';
import { useTheme } from '../theme/ThemeContext';

interface AIWordAnalysisProps {
  word: string;
  context: string;
  translation: string;
  hasWordData: boolean;
  onAnalysisComplete?: (definition: string) => void;
  onError?: (error: string) => void;
  onRefresh?: () => void;
}

export interface AIWordAnalysisRef {
  refreshAnalysis: () => void;
}

const AIWordAnalysis = forwardRef<AIWordAnalysisRef, AIWordAnalysisProps>(({
  word,
  context,
  translation,
  hasWordData,
  onAnalysisComplete,
  onError,
  onRefresh
}, ref) => {
  const { theme } = useTheme();
  const [definition, setDefinition] = useState<string>('');
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsed, setIsParsed] = useState(false);

  // 用于请求管理的引用
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const scrollViewRef = useRef<ScrollView>(null);

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

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refreshAnalysis: () => {
      handleRefreshAnalysis();
    }
  }));

  // 重置状态
  const resetState = useCallback(() => {
    if (isMountedRef.current) {
      setDefinition('');
      setError(null);
      setIsParsed(false);
    }
  }, []);

  // 获取AI讲解
  const fetchAIDefinition = useCallback(async () => {
    if (!word.trim() || !isMountedRef.current) return;
    
    // 强制取消之前的请求
    cleanup();
    
    setLoadingDefinition(true);
    setDefinition('');
    setError(null);
    
    try {
      const settings = await loadSettings();
      const provider = settings.aiProviders[settings.analysis.wordAnalysisProvider];
      
      if (!provider?.isEnabled || !provider.apiKey) {
        if (isMountedRef.current) {
          const errorMsg = 'AI解析服务未配置，请在设置中配置AI提供商';
          setError(errorMsg);
          onError?.(errorMsg);
          setLoadingDefinition(false);
        }
        return;
      }

      if (!provider.url || !provider.model) {
        if (isMountedRef.current) {
          const errorMsg = 'AI服务配置不完整，请检查API地址和模型名称';
          setError(errorMsg);
          onError?.(errorMsg);
          setLoadingDefinition(false);
        }
        return;
      }

      const chatService = new ChatService(provider);
      
      const prompt = `你是一名全国知名英语老师Flow老师，通熟易懂，知识渊博，风趣幽默，深受学生喜爱，请给学生讲解以下单词：

**单词**：${word}
**上下文**：${context}

## 分析内容：
1. **释义**
2. **例句**（2个）
3. **常见搭配**
4. **记忆技巧**
5. **在本文中的用处**`;

      // 递增请求ID，确保旧请求被忽略
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const stream = chatService.chatStream({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        signal,
      });

      let content = '';
      
      try {
        for await (const chunk of stream) {
          if (!isMountedRef.current || 
              currentRequestId !== requestIdRef.current || 
              signal.aborted) {
            break;
          }
          
          if (chunk?.content) {
            content += chunk.content;
            if (isMountedRef.current) {
              setDefinition(content);
            }
          }
        }
        
        // 保存完整数据到数据库
        if (isMountedRef.current && 
            currentRequestId === requestIdRef.current && 
            !signal.aborted && 
            translation && content) {
          database.updateWordData(word, translation, content);
          
          setIsParsed(true);
          onAnalysisComplete?.(content);
        }
      } catch (err) {
        if (!isMountedRef.current || 
            currentRequestId !== requestIdRef.current || 
            signal.aborted) {
          return;
        }
        throw err;
      }
      
      if (isMountedRef.current && 
          currentRequestId === requestIdRef.current && 
          !signal.aborted && 
          !content.trim()) {
        setDefinition('暂无解析内容');
      }
      
    } catch (err) {
      if (isMountedRef.current) {
        console.error('单词解析错误:', err);
        const errorMsg = '获取AI解析失败，请检查网络连接';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingDefinition(false);
      }
    }
  }, [word, context, translation, cleanup, onAnalysisComplete, onError]);

  // 重试获取定义
  const handleRetry = useCallback(() => {
    if (word.trim()) {
      fetchAIDefinition();
    }
  }, [word, fetchAIDefinition]);

  // 开始AI解析
  const handleStartParsing = useCallback(() => {
    if (word.trim()) {
      fetchAIDefinition();
    }
  }, [word, fetchAIDefinition]);

  // 刷新分析
  const handleRefreshAnalysis = useCallback(() => {
    if (word.trim()) {
      resetState();
      fetchAIDefinition();
    }
  }, [word, resetState, fetchAIDefinition]);

  // 处理刷新按钮点击
  const handleRefreshClick = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      handleRefreshAnalysis();
    }
  }, [onRefresh, handleRefreshAnalysis]);

  // 当word或context变化时重置状态
  useEffect(() => {
    resetState();
    
    // 如果数据库有数据，直接显示
    if (hasWordData && word.trim()) {
      const loadDefinitionFromDB = async () => {
        try {
          const wordData = await database.getWordData(word);
          if (wordData && wordData.definition && isMountedRef.current) {
            setDefinition(wordData.definition);
            setIsParsed(true);
            onAnalysisComplete?.(wordData.definition);
          }
        } catch (error) {
          console.error('从数据库加载定义失败:', error);
        }
      };
      
      loadDefinitionFromDB();
    }
  }, [word, context, hasWordData, resetState, onAnalysisComplete]);

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text,
    },
    heading1: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 14,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 12,
      marginBottom: 4,
    },
    paragraph: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text,
      marginBottom: 8,
    },
    list_item: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text,
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 8,
    },
    ordered_list: {
      marginBottom: 8,
    },
    blockquote: {
      backgroundColor: theme.colors.surfaceVariant,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    code_inline: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: theme.colors.text,
    },
    code_block: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: theme.colors.text,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.modalBackground }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.modalBackground }]}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Flow老师</Text>
        <View style={styles.headerRight}>
          {loadingDefinition ? (
            <View style={styles.loadingStatus}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingStatusText, { color: theme.colors.primary }]}>解析中</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshClick}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={[styles.contentContainer, { borderColor: theme.colors.border }]}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
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
              <Ionicons name="alert-circle-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
                onPress={handleRetry}
              >
                <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : definition ? (
            <View style={styles.markdownWrapper}>
              <Markdown style={markdownStyles}>
                {definition}
              </Markdown>
            </View>
          ) : (
            <View style={styles.startParsingContainer}>
              <Ionicons name="school-outline" size={48} color={theme.colors.primary} />
              <Text style={[styles.startParsingTitle, { color: theme.colors.text }]}>开始AI解析</Text>
              <Text style={[styles.startParsingDescription, { color: theme.colors.textSecondary }]}>
                点击"开始解析"按钮，让Flow老师为您详细分析这个单词
              </Text>
              <TouchableOpacity 
                style={[styles.startParsingButton, { backgroundColor: theme.colors.primary }]} 
                onPress={handleStartParsing}
                disabled={loadingDefinition}
              >
                {loadingDefinition ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[styles.startParsingButtonText, { color: theme.colors.onPrimary }]}>开始解析</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingStatusText: {
    fontSize: 16,
    marginLeft: 6,
  },
  refreshButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
  },
  scrollView: {
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
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startParsingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  startParsingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  startParsingDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startParsingButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startParsingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIWordAnalysis;
