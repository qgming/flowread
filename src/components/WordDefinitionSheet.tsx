import React, { useState, useEffect, useRef } from 'react';
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
import { loadSettings } from '../utils/settingsStorage';
import { DeepLXTranslationService } from '../services/translation';
import { ChatService } from '../services/chat';

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
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && word) {
      // 添加防抖，避免频繁请求
      const timer = setTimeout(() => {
        fetchWordData();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible, word, context]);

  const fetchWordData = async () => {
    if (!word.trim()) return;

    setTranslation('');
    setDefinition('');
    setError(null);

    // 立即获取翻译
    fetchTranslation();
    
    // 使用流式获取AI解析
    fetchDefinitionContent();
  };

  const fetchTranslation = async () => {
    setLoadingTranslation(true);
    try {
      const settings = await loadSettings();
      const translationService = new DeepLXTranslationService(settings.deeplx);
      const deeplTranslation = await translationService.translate({
        text: word,
        target_lang: 'ZH',
      });
      setTranslation(deeplTranslation);
    } catch (err) {
      console.error('翻译获取失败:', err);
      setTranslation('翻译失败，请检查网络连接');
    } finally {
      setLoadingTranslation(false);
    }
  };

  const fetchDefinitionContent = async () => {
    setLoadingDefinition(true);
    setDefinition('');
    setError(null);
    
    try {
      const settings = await loadSettings();
      const provider = settings.aiProviders[settings.analysis.wordAnalysisProvider];
      
      if (!provider?.isEnabled || !provider.apiKey) {
        setDefinition('AI解析服务未配置，请在设置中配置AI提供商');
        setLoadingDefinition(false);
        return;
      }

      const chatService = new ChatService(provider);
      
      // 使用本地配置的提示词
      const prompt = settings.analysis.wordAnalysisPrompt
        .replace('{word}', word)
        .replace('{context}', context);

      // 使用流式获取AI响应
      const stream = chatService.chatStream({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4000,
      });

      // 处理流式响应 - 立即开始显示内容
      let content = '';
      let isFirstChunk = true;
      
      for await (const chunk of stream) {
        if (isFirstChunk && chunk.content) {
          isFirstChunk = false;
          setLoadingDefinition(false); // 收到第一个chunk后立即隐藏加载指示器
        }
        
        content += chunk.content;
        setDefinition(content);
        
        // 使用更平滑的滚动
        if (chunk.content) {
          requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          });
        }

        if (chunk.isComplete) {
          break;
        }
      }
      
      // 如果没有任何内容返回
      if (!content.trim()) {
        setDefinition('未能获取到有效的解析内容，请稍后重试');
      }
      
    } catch (err) {
      console.error('单词解析错误:', err);
      const errorMessage = err instanceof Error ? err.message : '获取AI解析失败';
      
      // 提供更友好的错误提示
      if (errorMessage.includes('网络')) {
        setError('网络连接失败，请检查网络后重试');
      } else if (errorMessage.includes('API密钥')) {
        setError('API配置错误，请检查AI提供商设置');
      } else if (errorMessage.includes('模型')) {
        setError('AI模型配置错误，请检查模型名称');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoadingDefinition(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              {/* 顶部标题栏 */}
              <View style={styles.header}>
                <Text style={styles.wordText}>{word}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* 内容区域 */}
              <View style={styles.content}>
                {/* DeepL翻译部分 */}
                <View style={styles.translationSection}>
                  <Text style={styles.sectionTitle}>翻译</Text>
                  {loadingTranslation ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.translationText}>{translation}</Text>
                  )}
                </View>

              {/* AI解析部分 */}
              <View style={styles.definitionSection}>
                <Text style={styles.sectionTitle}>AI解析</Text>
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.definitionScroll}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  overScrollMode="auto"
                >
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle-outline" size={24} color="#ff3b30" style={styles.errorIcon} />
                      <Text style={styles.errorText}>{error}</Text>
                      <TouchableOpacity style={styles.retryButton} onPress={fetchDefinitionContent}>
                        <Text style={styles.retryButtonText}>重试</Text>
                      </TouchableOpacity>
                    </View>
                  ) : loadingDefinition && !definition ? (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
                  ) : (
                    <Text style={styles.definitionText}>{definition || '正在生成解析...'}</Text>
                  )}
                </ScrollView>
              </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'transparent',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: screenHeight * 0.5,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  translationSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    lineHeight: 24,
  },
  definitionSection: {
    flex: 1,
    paddingVertical: 16,
  },
  definitionScroll: {
    flex: 1,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  loadingIndicator: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 10,
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
});
