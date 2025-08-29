import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEnhancedTranslationService } from '../services/enhancedTranslation';
import { loadSettings } from '../utils/settingsStorage';
import database from '../database/database';
import BottomActionSheet from '../components/BottomActionSheet';
import WordDefinitionSheet from '../components/WordDefinitionSheet';
import ArticleHeader from '../components/ArticleHeader';
import ArticleParagraph from '../components/ArticleParagraph';
import TagModal from '../components/TagModal';

type RootStackParamList = {
  Main: undefined;
  ArticleReader: { articleId: number };
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
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [paragraphs, setParagraphs] = useState<ParagraphSegment[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentTranslatingIndex, setCurrentTranslatingIndex] = useState(-1);
  const [tags, setTags] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('ZH');
  const [showCopySheet, setShowCopySheet] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showWordDefinition, setShowWordDefinition] = useState(false);
 const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [favoriteWords, setFavoriteWords] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // 配置导航栏按钮
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Ionicons 
              name={showTranslation ? "eye-outline" : "eye-off-outline"} 
              size={22} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowTagModal(true)}
            disabled={!article}
          >
            <Ionicons name="pricetag-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCopySheet(true)}
            disabled={paragraphs.length === 0}
          >
            <Ionicons name="copy-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleTranslateAll}
            disabled={isTranslating || paragraphs.length === 0}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="language-outline" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isTranslating, paragraphs.length, article, showTranslation]);

  // 加载文章和翻译
  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      const articleData = await database.getArticleById(articleId);
      
      if (!articleData) {
        Alert.alert('错误', '文章不存在');
        navigation.goBack();
        return;
      }

      const settings = await loadSettings();
      const currentLang = settings.translation.targetLanguage || 'ZH';
      setTargetLanguage(currentLang);

      setArticle(articleData);
      setTags(articleData.tags || []);
      
      // 加载收藏单词
      const favoriteWordsList = await database.getFavoriteWords();
      const favoriteWordsSet = new Set(favoriteWordsList.map(word => word.word.toLowerCase()));
      setFavoriteWords(favoriteWordsSet);
      
      // 初始化段落
      const parsedParagraphs = articleData.content
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

      // 加载已有翻译
      if (articleData.translations && articleData.translation_language === currentLang) {
        parsedParagraphs.forEach((para, index) => {
          const savedTranslation = articleData.translations![index.toString()];
          if (savedTranslation) {
            para.translated = savedTranslation;
          }
        });
      }
      
      setParagraphs(parsedParagraphs);
    } catch (error) {
      Alert.alert('错误', '加载文章失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, navigation]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  // 保存翻译到数据库
  const saveTranslations = useCallback(async (translations: { [key: string]: string }) => {
    if (!article) return;
    
    try {
      await database.updateArticleTranslations(articleId, translations, targetLanguage);
    } catch (error) {
      console.error('保存翻译失败:', error);
    }
  }, [articleId, article, targetLanguage]);

  const handleTranslateAll = async () => {
    if (paragraphs.length === 0) return;
    
    // 直接清除已有翻译并开始新翻译，无需询问
    startTranslation();
  };

  const startTranslation = async () => {
    setParagraphs(prev => prev.map(p => ({ ...p, translated: '', isTranslating: false, error: undefined })));
    setIsTranslating(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const newTranslations: { [key: string]: string } = {};
      
      for (let i = 0; i < paragraphs.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;
        setCurrentTranslatingIndex(i);
        
        const translated = await translateParagraph(i, abortControllerRef.current);
        if (translated) {
          newTranslations[i.toString()] = translated;
        }
      }
      
      // 保存翻译结果
      if (Object.keys(newTranslations).length > 0) {
        await saveTranslations(newTranslations);
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

  const translateParagraph = async (index: number, abortController: AbortController): Promise<string | null> => {
    const paragraph = paragraphs[index];
    if (paragraph.isTranslating) return null;

    setParagraphs(prev => {
      const newParagraphs = [...prev];
      newParagraphs[index] = { ...newParagraphs[index], isTranslating: true, error: undefined };
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
          newParagraphs[index] = { ...newParagraphs[index], translated, isTranslating: false };
          return newParagraphs;
        });
        
        return translated;
      }
      return null;
    } catch (error) {
      if (!abortController.signal.aborted) {
        setParagraphs(prev => {
          const newParagraphs = [...prev];
          newParagraphs[index] = { 
            ...newParagraphs[index], 
            isTranslating: false, 
            error: error instanceof Error ? error.message : '翻译失败' 
          };
          return newParagraphs;
        });
      }
      return null;
    }
  };

  const handleWordPress = (word: string, context: string) => {
    setSelectedWord(word);
    setSelectedContext(context);
    setShowWordDefinition(true);
  };

  const handleClearTranslations = () => {
    Alert.alert(
      '清除翻译',
      '确定要清除所有翻译内容吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '清除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await database.clearTranslations(articleId);
              setParagraphs(prev => prev.map(p => ({ ...p, translated: '' })));
            } catch (error) {
              Alert.alert('错误', '清除翻译失败');
            }
          }
        }
      ]
    );
  };

  const validateTag = (tag: string): boolean => {
    const trimmed = tag.trim();
    if (!trimmed) {
      Alert.alert('提示', '标签不能为空');
      return false;
    }
    if (trimmed.length > 20) {
      Alert.alert('提示', '标签长度不能超过20个字符');
      return false;
    }
    if (tags.includes(trimmed)) {
      Alert.alert('提示', '该标签已存在');
      return false;
    }
    return true;
  };

  const handleAddTag = async () => {
    if (!validateTag(newTag)) return;

    const trimmedTag = newTag.trim();
    const updatedTags = [...tags, trimmedTag];
    
    setIsUpdatingTags(true);
    try {
      await database.updateArticle(articleId, article!.title, article!.content, updatedTags);
      setTags(updatedTags);
      setNewTag('');
      setShowTagModal(false);
    } catch (error) {
      Alert.alert('错误', '添加标签失败');
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    Alert.alert(
      '删除标签',
      `确定要删除标签"${tagToRemove}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setIsUpdatingTags(true);
            const updatedTags = tags.filter(tag => tag !== tagToRemove);
            
            try {
              await database.updateArticle(articleId, article!.title, article!.content, updatedTags);
              setTags(updatedTags);
            } catch (error) {
              Alert.alert('错误', '删除标签失败');
            } finally {
              setIsUpdatingTags(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyOriginal = () => {
    const originalText = paragraphs.map(p => p.original).join('\n\n');
    Clipboard.setString(originalText);
    Alert.alert('成功', '原文已复制到剪贴板');
  };

  const handleCopyTranslation = () => {
    const translatedParagraphs = paragraphs.filter(p => p.translated);
    if (translatedParagraphs.length === 0) {
      Alert.alert('提示', '暂无译文内容');
      return;
    }
    const translationText = translatedParagraphs.map(p => p.translated).join('\n\n');
    Clipboard.setString(translationText);
    Alert.alert('成功', '译文已复制到剪贴板');
  };

  const handleCopyAll = () => {
    if (paragraphs.length === 0) {
      Alert.alert('提示', '暂无内容可复制');
      return;
    }

    let allText = '';
    paragraphs.forEach((p, index) => {
      allText += `原文：${p.original}`;
      if (p.translated) {
        allText += `\n译文：${p.translated}`;
      }
      if (index < paragraphs.length - 1) {
        allText += '\n\n';
      }
    });
    
    Clipboard.setString(allText);
    Alert.alert('成功', '全部内容已复制到剪贴板');
  };

  // 处理收藏单词变化
  const handleFavoriteChange = useCallback((word: string, isFavorite: boolean) => {
    setFavoriteWords(prev => {
      const newFavoriteWords = new Set(prev);
      if (isFavorite) {
        newFavoriteWords.add(word.toLowerCase());
      } else {
        newFavoriteWords.delete(word.toLowerCase());
      }
      return newFavoriteWords;
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!article) return null;

 const allTranslated = paragraphs.every(p => p.translated);
  const translationStatus = allTranslated ? '已翻译' : 
    paragraphs.some(p => p.translated) ? '部分翻译' : '未翻译';
  
  // 计算文章单词数量
const wordCount = article.content
  .replace(/[.,!?;:'"()\[\]{}\-—–，。！？；：'""（）【】《》]/g, ' ')
  .split(/\s+/)
  .filter(word => word.trim().length > 0)
  .reduce((count, word) => {
    // 处理中英文混合
    const chineseChars = word.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = word.match(/[a-zA-Z]+/g) || [];
    const numbers = word.match(/\d+/g) || [];
    
    return count + chineseChars.length + englishWords.length + numbers.length;
  }, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
         <ArticleHeader
          title={article.title}
          createdAt={article.created_at}
          translationStatus={translationStatus}
          translationLanguage={article.translation_language}
          tags={tags}
          onRemoveTag={handleRemoveTag}
          isUpdatingTags={isUpdatingTags}
          wordCount={wordCount}
        />

        <View>
          {paragraphs.map((paragraph, index) => (
            <ArticleParagraph
              key={paragraph.id}
              original={paragraph.original}
              translated={paragraph.translated}
              isTranslating={paragraph.isTranslating}
              error={paragraph.error}
              showTranslation={showTranslation}
              onWordPress={handleWordPress}
              favoriteWords={favoriteWords}
            />
          ))}
        </View>
      </View>

      <TagModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        newTag={newTag}
        onNewTagChange={setNewTag}
        onAddTag={handleAddTag}
        isUpdatingTags={isUpdatingTags}
      />

      <BottomActionSheet
        visible={showCopySheet}
        onClose={() => setShowCopySheet(false)}
        actions={[
          { title: '复制原文', onPress: handleCopyOriginal },
          { title: '复制译文', onPress: handleCopyTranslation },
          { title: '全部复制', onPress: handleCopyAll },
        ]}
        title="复制文章"
      />

    <WordDefinitionSheet
        visible={showWordDefinition}
        onClose={() => setShowWordDefinition(false)}
        word={selectedWord}
        context={selectedContext}
        onFavoriteChange={handleFavoriteChange}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  headerButton: {
    marginLeft: 15,
    padding: 5,
  },
});
