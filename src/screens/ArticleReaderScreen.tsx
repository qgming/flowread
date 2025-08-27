import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../database/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEnhancedTranslationService } from '../services/enhancedTranslation';
import { loadSettings } from '../utils/settingsStorage';
import database from '../database/database';
import BottomActionSheet from '../components/BottomActionSheet';

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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // 设置导航栏
  useEffect(() => {
    if (!article) return;

    navigation.setOptions({
      title: article.title,
      headerStyle: { backgroundColor: '#f5f5f5' },
      headerTintColor: '#007AFF',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      headerShadowVisible: false,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Ionicons 
              name={showTranslation ? "eye-outline" : "eye-off-outline"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowTagModal(true)}
            disabled={isUpdatingTags}
          >
            {isUpdatingTags ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="pricetag-outline" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleTranslateAll}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons 
                name="language-outline" 
                size={24} 
                color="#007AFF" 
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCopySheet(true)}
          >
            <Ionicons name="copy-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, article, isTranslating, paragraphs, tags, isUpdatingTags, targetLanguage, showTranslation]);

  const handleTranslateAll = async () => {
    if (paragraphs.length === 0) return;

    // 检查是否已有翻译
    const hasTranslations = paragraphs.some(p => p.translated);
    if (hasTranslations) {
      Alert.alert(
        '重新翻译',
        '已有翻译内容，是否重新翻译？',
        [
          { text: '取消', style: 'cancel' },
          { text: '重新翻译', onPress: () => startTranslation() }
        ]
      );
    } else {
      startTranslation();
    }
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{article.title}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.capsulesContainer}>
            <View style={styles.dateCapsule}>
              <Text style={styles.dateText}>
                {new Date(article.created_at).toLocaleDateString('zh-CN')}
              </Text>
            </View>
            {article.translation_language && (
              <View style={[styles.dateCapsule, styles.translationCapsule]}>
                <Text style={styles.translationText}>
                  {translationStatus} ({article.translation_language})
                </Text>
              </View>
            )}
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={`${tag}-${index}`}
                style={styles.tagCapsule}
                onPress={() => handleRemoveTag(tag)}
                disabled={isUpdatingTags}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          {paragraphs.map((paragraph, index) => (
            <View key={paragraph.id} style={styles.paragraphWrapper}>
              <Text style={styles.originalText}>{paragraph.original}</Text>
              
              {paragraph.translated && showTranslation && (
                <View>
                  <Text style={styles.translatedText}>{paragraph.translated}</Text>
                </View>
              )}

              {paragraph.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorMessage}>{paragraph.error}</Text>
                </View>
              )}

              {paragraph.isTranslating && (
                <View style={styles.translatingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.translatingText}>翻译中...</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={showTagModal}
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>添加标签</Text>
            <TextInput
              style={styles.tagInput}
              placeholder="请输入标签"
              value={newTag}
              onChangeText={setNewTag}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddTag}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTagModal(false);
                  setNewTag('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Text style={styles.confirmButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop:6,
    paddingBottom:20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 36,
  },
  metaContainer: {
    marginBottom: 10,
  },
  capsulesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateCapsule: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#555555',
  },
  translationCapsule: {
    backgroundColor: '#e8f5e8',
  },
  translationText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  tagCapsule: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1565c0',
  },
  paragraphWrapper: {
    marginBottom: 10,
  },
  originalText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#000',
    textAlign:'auto',
  },
  translatedText: {
     marginTop: 10,
    fontSize: 18,
    lineHeight: 32,
    color: '#777',
    textAlign:'auto',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ff3b30',
  },
  translatingContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  translatingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 6,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
