import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { dictionaryService, WordDetails } from '../services/dictionary';
import { DeepLXTranslationService } from '../services/translation';
import { loadSettings } from '../utils/settingsStorage';
import database from '../database/database';

interface WordDictionaryInfoProps {
  word: string;
  onAudioPress?: (audioUrl: string) => void;
  onDataUpdate?: (data: { translation: string; wordDetails: any }) => void;
}

export default function WordDictionaryInfo({ word, onAudioPress, onDataUpdate }: WordDictionaryInfoProps) {
  const { theme } = useTheme();
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [translation, setTranslation] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (word.trim()) {
      fetchAllWordData();
    }
  }, [word]);

  useEffect(() => {
    if (onDataUpdate && (translation || wordDetails)) {
      onDataUpdate({
        translation,
        wordDetails
      });
    }
  }, [translation, wordDetails, onDataUpdate]);

  const fetchAllWordData = async () => {
    setError(null);
    
    // 分别设置加载状态，实现谁先加载谁先显示
    setLoadingDetails(true);
    setLoadingTranslation(true);
    
    try {
      // 并行获取但不等待全部完成
      Promise.allSettled([
        fetchWordDetails(word),
        fetchTranslation(word)
      ]);
    } catch (err) {
      setError('获取单词信息失败');
      console.error('获取单词信息失败:', err);
    }
  };

  const fetchWordDetails = async (text: string) => {
    try {
      const details = await dictionaryService.getWordDetails(text);
      if (details) {
        setWordDetails(details);
      }
    } catch (err) {
      console.error('获取单词详情失败:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchTranslation = async (text: string): Promise<void> => {
    try {
      // 优先检查本地数据库
      const wordData = await database.getWordData(text);
      
      if (wordData && wordData.translation && wordData.translation.trim() !== '') {
        // 本地数据库有翻译，直接使用
        setTranslation(wordData.translation);
        setLoadingTranslation(false);
        return;
      }
      
      // 本地没有翻译，调用API获取
      const settings = await loadSettings();
      const translationService = new DeepLXTranslationService(settings.deeplx);
      const result = await translationService.translate({
        text: text,
        target_lang: 'ZH',
      });
      setTranslation(result);
    } catch (err) {
      console.error('翻译获取失败:', err);
      setTranslation('翻译失败');
    } finally {
      setLoadingTranslation(false);
    }
  };

  const renderWordHeader = () => {
    if (!word) return null;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.leftSection}>
          <Text style={[styles.wordText, { color: theme.colors.text }]}>
            {word}
          </Text>
          <View style={styles.capsulesRow}>
            {wordDetails?.phonetic && (
              <View style={[styles.phoneticCapsule, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.phoneticText, { color: theme.colors.textSecondary }]}>
                  {wordDetails.phonetic}
                </Text>
              </View>
            )}
            {loadingDetails && !wordDetails?.phonetic && (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            )}
            
            {loadingTranslation && !translation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : translation ? (
              <View style={[styles.translationCapsule, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.translationText, { color: theme.colors.primary }]}>
                  {translation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderMeanings = () => {
    if (!wordDetails?.meanings || wordDetails.meanings.length === 0) {
      return null;
    }

    return (
      <View style={styles.meaningsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          释义
        </Text>
        {wordDetails.meanings.map((meaning, index) => (
          <View key={index} style={styles.meaningItem}>
            <Text style={[styles.partOfSpeech, { color: theme.colors.primary }]}>
              {meaning.partOfSpeech}
            </Text>
            {meaning.definitions.map((def, defIndex) => (
              <View key={defIndex} style={styles.definitionItem}>
                <Text style={[styles.definitionText, { color: theme.colors.text }]}>
                  {defIndex + 1}. {def.definition}
                </Text>
                {def.example && (
                  <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
                    例: {def.example}
                  </Text>
                )}
                {def.synonyms && def.synonyms.length > 0 && (
                  <Text style={[styles.synonymsText, { color: theme.colors.textSecondary }]}>
                    同义词: {def.synonyms.join(', ')}
                  </Text>
                )}
                {def.antonyms && def.antonyms.length > 0 && (
                  <Text style={[styles.antonymsText, { color: theme.colors.textSecondary }]}>
                    反义词: {def.antonyms.join(', ')}
                  </Text>
                )}
              </View>
            ))}
            {meaning.synonyms && meaning.synonyms.length > 0 && (
              <Text style={[styles.synonymsText, { color: theme.colors.textSecondary }]}>
                同义词: {meaning.synonyms.join(', ')}
              </Text>
            )}
            {meaning.antonyms && meaning.antonyms.length > 0 && (
              <Text style={[styles.antonymsText, { color: theme.colors.textSecondary }]}>
                反义词: {meaning.antonyms.join(', ')}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  if ((loadingDetails || loadingTranslation) && !wordDetails && !translation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          加载单词信息...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {renderWordHeader()}
        {renderMeanings()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  headerContainer: {
    marginBottom: 20,
  },
  leftSection: {
    alignItems: 'flex-start',
  },
  wordText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  capsulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneticCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  phoneticText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  translationCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  translationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  meaningsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  meaningItem: {
    marginBottom: 16,
  },
  partOfSpeech: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  definitionItem: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  definitionText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  synonymsText: {
    fontSize: 14,
    marginBottom: 2,
  },
  antonymsText: {
    fontSize: 14,
    marginBottom: 2,
  },
});
