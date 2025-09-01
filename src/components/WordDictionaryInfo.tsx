import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { dictionaryService, WordDetails } from '../services/dictionary';
import { DeepLXTranslationService } from '../services/translation';
import { loadSettings } from '../utils/settingsStorage';

interface WordDictionaryInfoProps {
  word: string;
}

export default function WordDictionaryInfo({ word }: WordDictionaryInfoProps) {
 const { theme } = useTheme();
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [translation, setTranslation] = useState<string>('');
  const [translationError, setTranslationError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  // 标签中文映射表
  const tagMapping: { [key: string]: string } = {
    'zk': '中考',
    'gk': '高考',
    'cet4': '四级',
    'cet6': '六级',
    'ky': '考研',
    'toefl': '托福',
    'ielts': '雅思',
    'gre': 'GRE',
    'oxford': '牛津3000',
    'collins': '柯林斯'
  };

  // 加载单词数据
  const loadWordData = async () => {
    if (!word.trim()) return;

    setLoading(true);
    setIsTranslating(false);
    setTranslationError('');
    try {
      // 从wordsdb获取完整单词信息
      const details = await dictionaryService.getWordDetails(word);
      setWordDetails(details);
      
      // 获取翻译
      let currentTranslation = '';
      if (details?.translation) {
        currentTranslation = details.translation;
      } else {
        // 如果没有翻译，使用DeepLX获取
        setIsTranslating(true);
        const settings = await loadSettings();
        const translationService = new DeepLXTranslationService(settings.deeplx);
        try {
          currentTranslation = await translationService.translate({
            text: word,
            target_lang: 'ZH',
          });
          setTranslationError('');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '翻译失败';
          setTranslationError(errorMessage);
          console.error('翻译失败:', error);
        }
        setIsTranslating(false);
      }
      setTranslation(currentTranslation);
      
    } catch (error) {
      console.error('加载单词数据失败:', error);
      setIsTranslating(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWordData();
  }, [word]);

  const renderWordHeader = () => {
    if (!word) return null;

    return (
      <View style={styles.headerContainer}>
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
          
          {isTranslating && (
            <View style={[styles.translatingCapsule, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={[styles.translatingText, { color: theme.colors.primary }]}>
                翻译中...
              </Text>
            </View>
          )}
          
          {translationError && !isTranslating && (
            <TouchableOpacity 
              style={[styles.errorCapsule, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => loadWordData()}
            >
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                翻译失败: {translationError}
              </Text>
            </TouchableOpacity>
          )}
          
          {translation && !isTranslating && !translationError && (
            <>
              {renderTranslationCapsules()}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderTranslationCapsules = () => {
    if (!translation) return null;
    
    // 处理转义字符，将\\n替换为\n，然后按换行符分割
    const normalizedTranslation = translation.replace(/\\n/g, '\n');
    
    // 按换行符分割翻译，并确保每个部分都显示为独立胶囊
    const translations = normalizedTranslation
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (translations.length === 0) return null;
    
    return (
      <>
        {translations.map((trans, index) => (
          <View 
            key={index} 
            style={[styles.translationCapsule, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <Text style={[styles.translationText, { color: theme.colors.primary }]}>
              {trans}
            </Text>
          </View>
        ))}
      </>
    );
  };

  const renderTags = () => {
    if (!wordDetails?.tags || wordDetails.tags.length === 0) {
      return null;
    }

    // 转换标签为中文
    const chineseTags = wordDetails.tags.map(tag => tagMapping[tag] || tag);

    return (
      <View style={styles.tagsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          考试信息
        </Text>
        <View style={styles.tagsRow}>
          {chineseTags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFrequency = () => {
    const hasFrequencyData = wordDetails?.bnc || wordDetails?.frq || wordDetails?.collins || (wordDetails?.oxford && wordDetails.oxford !== '0');

    if (!hasFrequencyData) {
      return null;
    }

    // 生成星级显示
    const renderStars = (level: string) => {
      const starCount = parseInt(level) || 0;
      return '⭐'.repeat(starCount);
    };

    return (
      <View style={styles.frequencyContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          词汇信息
        </Text>
        <View style={styles.frequencyRow}>
          {wordDetails?.collins && (
            <View style={[styles.frequencyItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                柯林斯星级
              </Text>
              <Text style={[styles.frequencyValue, { color: theme.colors.text }]}>
                {renderStars(wordDetails.collins)}
              </Text>
            </View>
          )}
          {wordDetails?.oxford && wordDetails.oxford !== '0' && (
            <View style={[styles.frequencyItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                牛津3000
              </Text>
              <Text style={[styles.frequencyValue, { color: theme.colors.text }]}>
                ✓
              </Text>
            </View>
          )}
          {wordDetails?.bnc && (
            <View style={[styles.frequencyItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                BNC词频
              </Text>
              <Text style={[styles.frequencyValue, { color: theme.colors.text }]}>
                #{wordDetails.bnc}
              </Text>
            </View>
          )}
          {wordDetails?.frq && (
            <View style={[styles.frequencyItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                当代词频
              </Text>
              <Text style={[styles.frequencyValue, { color: theme.colors.text }]}>
                #{wordDetails.frq}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderExchange = () => {
    if (!wordDetails?.exchange) {
      return null;
    }

    const exchangeMap: { [key: string]: string } = {
      'p': '过去式',
      'd': '过去分词',
      'i': '现在分词',
      '3': '第三人称单数',
      'r': '比较级',
      't': '最高级',
      's': '复数形式',
      '0': '原形',
      '1': '变形'
    };

    const exchanges = wordDetails.exchange.split('/')
      .filter(ex => ex.trim())
      .map(ex => {
        const [type, word] = ex.split(':');
        return { type: exchangeMap[type] || type, word };
      });

    if (exchanges.length === 0) {
      return null;
    }

    return (
      <View style={styles.exchangeContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          词形变化
        </Text>
        <View style={styles.exchangeRow}>
          {exchanges.map((item, index) => (
            <View key={index} style={[styles.exchangeItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.exchangeType, { color: theme.colors.textSecondary }]}>
                {item.type}
              </Text>
              <Text style={[styles.exchangeWord, { color: theme.colors.text }]}>
                {item.word}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.modalBackground }]}>
      <View style={styles.content}>
        {renderWordHeader()}
        {renderTags()}
        {renderFrequency()}
        {renderExchange()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContainer: {
    marginBottom: 20,
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
    flexWrap: 'wrap',
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
  translatingCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
 translatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  translationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  translationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
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
  tagsContainer: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  frequencyItem: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  frequencyLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  frequencyValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  exchangeContainer: {
    marginBottom: 16,
  },
  exchangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exchangeItem: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  exchangeType: {
    fontSize: 12,
    marginBottom: 2,
  },
  exchangeWord: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
