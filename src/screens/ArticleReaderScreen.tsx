import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEnhancedTranslationService } from '../services/enhancedTranslation';
import { loadSettings } from '../utils/settingsStorage';

type RootStackParamList = {
  Main: undefined;
  ArticleReader: { article: Article };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

interface ParagraphSegment {
  id: string;
  original: string;
  translated: string;
  isTranslating: boolean;
  error?: string;
}

export default function ArticleReaderScreen({ route, navigation }: Props) {
  const { article } = route.params;
  const [paragraphs, setParagraphs] = useState<ParagraphSegment[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentTranslatingIndex, setCurrentTranslatingIndex] = useState<number>(-1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化段落
  useEffect(() => {
   const parsedParagraphs = article.content
      .split(/\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map((p, index) => ({
        id: `para-${index}`,
        original: p,
        translated: '',
        isTranslating: false,
        error: undefined,
      }));
    
    setParagraphs(parsedParagraphs);
  }, [article.content]);

  useEffect(() => {
    navigation.setOptions({
      title: article.title,
      headerStyle: {
        backgroundColor: '#f5f5f5',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
      headerShadowVisible: false,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleTranslateAll}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons 
              name={hasAnyTranslation() ? "refresh" : "language-outline"} 
              size={24} 
              color="#007AFF" 
            />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, article, isTranslating, paragraphs]);

  const hasAnyTranslation = () => {
    return paragraphs.some(p => p.translated);
  };

  const handleTranslateAll = async () => {
    // 如果有翻译，清除并重新开始
    if (hasAnyTranslation()) {
      setParagraphs(prev => prev.map(p => ({
        ...p,
        translated: '',
        isTranslating: false,
        error: undefined,
      })));
    }

    setIsTranslating(true);
    abortControllerRef.current = new AbortController();
    
    try {
      // 顺序翻译所有段落
      for (let i = 0; i < paragraphs.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        setCurrentTranslatingIndex(i);
        await translateParagraph(i, abortControllerRef.current);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        Alert.alert('翻译失败', error.message);
      }
    } finally {
      setIsTranslating(false);
      setCurrentTranslatingIndex(-1);
    }
  };

  const translateParagraph = async (index: number, abortController: AbortController) => {
    const paragraph = paragraphs[index];
    if (paragraph.translated || paragraph.isTranslating) return;

    setParagraphs(prev => {
      const newParagraphs = [...prev];
      newParagraphs[index] = {
        ...newParagraphs[index],
        isTranslating: true,
        error: undefined,
      };
      return newParagraphs;
    });

    try {
      const settings = await loadSettings();
      const translationService = createEnhancedTranslationService();
      
      const translated = await translationService.translate({
        text: paragraph.original,
        target_lang: settings.translation.targetLanguage as any,
      });

      if (!abortController.signal.aborted) {
        setParagraphs(prev => {
          const newParagraphs = [...prev];
          newParagraphs[index] = {
            ...newParagraphs[index],
            translated,
            isTranslating: false,
          };
          return newParagraphs;
        });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        setParagraphs(prev => {
          const newParagraphs = [...prev];
          newParagraphs[index] = {
            ...newParagraphs[index],
            isTranslating: false,
            error: error instanceof Error ? error.message : '翻译失败',
          };
          return newParagraphs;
        });
      }
    }
  };

  const handleTranslateSingle = async (index: number) => {
    if (paragraphs[index].translated) {
      // 如果已有翻译，清除并重新翻译
      setParagraphs(prev => {
        const newParagraphs = [...prev];
        newParagraphs[index] = {
          ...newParagraphs[index],
          translated: '',
          isTranslating: false,
          error: undefined,
        };
        return newParagraphs;
      });
    }
    
    const controller = new AbortController();
    await translateParagraph(index, controller);
  };

  const retryTranslation = (index: number) => {
    setParagraphs(prev => {
      const newParagraphs = [...prev];
      newParagraphs[index] = {
        ...newParagraphs[index],
        error: undefined,
      };
      return newParagraphs;
    });
    
    const controller = new AbortController();
    translateParagraph(index, controller);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{article.title}</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.date}>
            {new Date(article.created_at).toLocaleDateString('zh-CN')}
          </Text>
          {article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          {paragraphs.map((paragraph, index) => (
            <View key={paragraph.id} style={styles.paragraphContainer}>
              <Text style={styles.originalText}>{paragraph.original}</Text>
              
              <TouchableOpacity
                style={[
                  styles.translateButton,
                  paragraph.isTranslating && styles.translateButtonDisabled
                ]}
                onPress={() => handleTranslateSingle(index)}
                disabled={paragraph.isTranslating}
              >
                {paragraph.isTranslating ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.translateButtonText}>
                      {currentTranslatingIndex === index ? `翻译中...` : '翻译中...'}
                    </Text>
                  </View>
                ) : paragraph.translated ? (
                  <View style={styles.buttonContent}>
                    <Ionicons name="refresh" size={16} color="#007AFF" />
                    <Text style={styles.translateButtonText}>重新翻译</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="language" size={16} color="#007AFF" />
                    <Text style={styles.translateButtonText}>翻译</Text>
                  </View>
                )}
              </TouchableOpacity>

              {paragraph.translated && (
                <View style={styles.translatedContainer}>
                  <Text style={styles.translatedText}>{paragraph.translated}</Text>
                </View>
              )}

              {paragraph.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{paragraph.error}</Text>
                  <TouchableOpacity onPress={() => retryTranslation(index)}>
                    <Text style={styles.retryText}>重试</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 20,
    // padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 36,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#03a9f4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
  },
  originalText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#333',
    textAlign: 'justify',
    marginBottom: 8,
  },
   translatedText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#999',
    textAlign: 'justify',
    marginBottom: 8,
  },
  paragraphContainer: {
    marginBottom: 12,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    marginTop: 8,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translateButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  translatedContainer: {
    marginTop: 12,
  },
  errorContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
  },
  headerButton: {
    padding: 6,
    marginRight: 8,
  },
});
