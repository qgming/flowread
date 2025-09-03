import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import database from '../database/database';
import { dictionaryService, WordDetails } from '../services/dictionary';
import { BingTranslationService } from '../services/translation';
import { loadSettings } from '../utils/settingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');
const STORAGE_KEY = 'immersive_reading_index';

interface CurrentWordData {
  word: string;
  details?: WordDetails;
  translation?: string;
  isLoading: boolean;
}

export default function ImmersiveReadingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [allWords, setAllWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWordData, setCurrentWordData] = useState<CurrentWordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [panY] = useState(new Animated.Value(0));
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 获取收藏单词列表
  const loadFavoriteWords = useCallback(async () => {
    try {
      setLoading(true);
      const favorites = await database.getFavoriteWords();
      
      if (favorites.length === 0) {
        setAllWords([]);
        return;
      }

      // 按创建时间升序排列
      const sortedFavorites = favorites.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setAllWords(sortedFavorites.map(fav => fav.word));
    } catch (error) {
      console.error('加载收藏单词失败:', error);
      Alert.alert('错误', '加载收藏单词失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载当前单词的详细信息
  const loadCurrentWordDetails = useCallback(async (index: number) => {
    if (allWords.length === 0) return;
    
    const word = allWords[index];
    if (!word) return;

    setCurrentWordData({ word, isLoading: true });
    
    try {
      const details = await dictionaryService.getWordDetails(word);
      
      // 获取翻译
      let translation = '';
      if (details?.translation) {
        translation = details.translation;
      } else {
        try {
          const settings = await loadSettings();
          const translationService = new BingTranslationService();
          translation = await translationService.translate({
            text: word,
            target_lang: (settings.translation.targetLanguage as any) || 'ZH',
          });
        } catch (error) {
          console.error('翻译失败:', error);
        }
      }

      setCurrentWordData({
        word,
        details: details || undefined,
        translation,
        isLoading: false,
      });
    } catch (error) {
      console.error(`加载单词 ${word} 详情失败:`, error);
      setCurrentWordData({
        word,
        isLoading: false,
      });
    }
  }, [allWords]);

  // 加载保存的索引
  const loadSavedIndex = useCallback(async () => {
    try {
      const savedIndex = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        const validIndex = Math.max(0, Math.min(index, allWords.length - 1));
        setCurrentIndex(validIndex);
        loadCurrentWordDetails(validIndex);
      } else if (allWords.length > 0) {
        loadCurrentWordDetails(0);
      }
    } catch (error) {
      console.error('加载保存的索引失败:', error);
    }
  }, [allWords.length, loadCurrentWordDetails]);

  // 保存当前索引
  const saveCurrentIndex = useCallback(async (index: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, index.toString());
    } catch (error) {
      console.error('保存索引失败:', error);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      await loadFavoriteWords();
    };
    loadData();
  }, [loadFavoriteWords]);

  // 当单词列表加载完成后加载索引
  useEffect(() => {
    if (allWords.length > 0) {
      loadSavedIndex();
    }
  }, [allWords.length, loadSavedIndex]);

  // 页面卸载时保存索引
  useEffect(() => {
    return () => {
      saveCurrentIndex(currentIndex);
    };
  }, [currentIndex, saveCurrentIndex]);

  // 手势识别
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isTransitioning,
    onMoveShouldSetPanResponder: () => !isTransitioning,
    
    onPanResponderMove: (event, gestureState) => {
      if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        panY.setValue(gestureState.dy);
      }
    },
    
    onPanResponderRelease: (event, gestureState) => {
      if (Math.abs(gestureState.dy) > 100) {
        if (gestureState.dy > 0) {
          handlePreviousWord();
        } else if (gestureState.dy < 0) {
          handleNextWord();
        }
      }
      
      // 重置位置
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    },
  });

  const handlePreviousWord = () => {
    if (!isTransitioning && allWords.length > 0) {
      setIsTransitioning(true);
      const newIndex = currentIndex === 0 ? allWords.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
      
      Animated.timing(panY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        panY.setValue(0);
        setIsTransitioning(false);
        loadCurrentWordDetails(newIndex);
      });
    }
  };

  const handleNextWord = () => {
    if (!isTransitioning && allWords.length > 0) {
      setIsTransitioning(true);
      const newIndex = currentIndex === allWords.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      
      Animated.timing(panY, {
        toValue: -screenHeight,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        panY.setValue(0);
        setIsTransitioning(false);
        loadCurrentWordDetails(newIndex);
      });
    }
  };

  // 渲染单词卡片
  const renderWordCard = () => {
    if (!currentWordData || currentWordData.isLoading) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    const { word, details, translation } = currentWordData;

    // 处理词形变化
    const renderExchange = () => {
      if (!details?.exchange) return null;

      const exchangeMap: { [key: string]: string } = {
        '0': '原形',
        '1': '变形',
        'p': '过去式',
        'd': '过去分词',
        'i': '现在分词',
        '3': '第三人称单数',
        'r': '比较级',
        't': '最高级',
        's': '复数形式',
      };

      const exchanges = details.exchange.split('/')
        .filter(ex => ex.trim())
        .map(ex => {
          const [type, word] = ex.split(':');
          return { type: exchangeMap[type] || type, word };
        });

      return (
        <View style={styles.exchangeContainer}>
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
      );
    };

    return (
      <ScrollView 
        style={[styles.content, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wordContainer}>
          {/* 单词 */}
          <Text style={[styles.wordText, { color: theme.colors.text }]}>
            {word}
          </Text>

          {/* 音标 */}
          {details?.phonetic && (
            <Text style={[styles.phoneticText, { color: theme.colors.textSecondary }]}>
              {details.phonetic}
            </Text>
          )}

          {/* 翻译 */}
          {translation && (
            <View style={styles.translationContainer}>
              {(() => {
                // 处理转义字符，将\\n替换为\n，然后按换行符分割
                const normalizedTranslation = translation.replace(/\\n/g, '\n');
                const translations = normalizedTranslation
                  .split('\n')
                  .map(t => t.trim())
                  .filter(t => t.length > 0);
                
                return translations.map((trans, index) => (
                  <Text 
                    key={index} 
                    style={[styles.translationText, { color: theme.colors.primary }]}
                  >
                    {trans}
                  </Text>
                ));
              })()}
            </View>
          )}

          {/* 词汇变化 */}
          {renderExchange()}

          {/* 进度指示 */}
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {currentIndex + 1} / {allWords.length}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (allWords.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          暂无收藏的单词
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: panY }],
          },
        ]}
      >
        {renderWordCard()}
      </Animated.View>
      
      {/* 滑动提示 */}
      <View style={styles.swipeHint}>
        <Text style={[styles.swipeHintText, { color: theme.colors.textSecondary }]}>
          上下滑动切换单词
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordContainer: {
    padding: 20,
    paddingBottom: 40,
    flex: 1,
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  phoneticText: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  translationText: {
    fontSize: 32,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: '#007AFF',
  },
  translationContainer: {
    marginBottom: 32,
  },
  exchangeContainer: {
    marginBottom: 40,
  },
  exchangeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exchangeType: {
    fontSize: 14,
  },
  exchangeWord: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 14,
  },
});
