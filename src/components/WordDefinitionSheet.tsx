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
import AIWordAnalysis from './AIWordAnalysis';
import WordDictionaryInfo from './WordDictionaryInfo';
import { useTheme } from '../theme/ThemeContext';
import { speakWord } from '../services/speech';
import { eventBus, EVENTS } from '../utils/eventBus';
import { dictionaryService } from '../services/dictionary';

const { height: screenHeight } = Dimensions.get('window');

interface WordDefinitionSheetProps {
  visible: boolean;
  onClose: () => void;
  word: string;
  context: string;
  onFavoriteChange?: (word: string, isFavorite: boolean) => void;
}

interface HeaderActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  isActive?: boolean;
}

interface WordDictionaryInfoRef {
  getTranslation: () => string;
  getWordDetails: () => any;
}

const HeaderActionButton: React.FC<HeaderActionButtonProps> = ({ 
  iconName, 
  onPress, 
  color, 
  size = 28,
  isActive = false 
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={styles.headerActionButton} 
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons 
        name={iconName} 
        size={size} 
        color={isActive ? '#FFD700' : (color || theme.colors.primary)} 
      />
    </TouchableOpacity>
  );
};

export default function WordDefinitionSheet({ visible, onClose, word, context, onFavoriteChange }: WordDefinitionSheetProps) {
  const { theme } = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [hasWordData, setHasWordData] = useState(false);
  const [definition, setDefinition] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [wordDetails, setWordDetails] = useState<any>(null);
  
  // 用于请求管理的引用
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // AIWordAnalysis的引用
  const aiWordAnalysisRef = useRef<any>(null);

  // WordDictionaryInfo的引用
  const wordDictionaryInfoRef = useRef<any>(null);

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

  // 自动朗读功能
  useEffect(() => {
    const autoSpeakWord = async () => {
      if (visible && word) {
        try {
          const settings = await loadSettings();
          if (settings.speech.autoSpeak) {
            await speakWord(word);
          }
        } catch (error) {
          console.error('自动朗读失败:', error);
        }
      }
    };

    autoSpeakWord();
  }, [visible, word]);

  // 当组件可见时，检查数据库并获取数据
  useEffect(() => {
    if (visible && word.trim()) {
      loadWordData();
    } else if (!visible) {
      cleanup();
      if (isMountedRef.current) {
        setIsParsed(false);
        setHasWordData(false);
        setTranslation('');
        setWordDetails(null);
      }
    }
  }, [visible, word, context, cleanup]);

  // 加载单词数据
  const loadWordData = useCallback(async () => {
    if (!word.trim() || !isMountedRef.current) return;
    
    try {
      // 先从数据库获取数据
      const wordData = await database.getWordData(word);
      
      if (isMountedRef.current) {
        if (wordData) {
          // 数据库有数据，直接显示
          setIsParsed(!!wordData.definition && wordData.definition.trim() !== '');
          setHasWordData(true);
          if (wordData.translation) {
            setTranslation(wordData.translation);
          }
        } else {
          // 数据库没有数据
          setHasWordData(false);
        }
      }
    } catch (error) {
      console.error('加载单词数据失败:', error);
      if (isMountedRef.current) {
        setHasWordData(false);
      }
    }
  }, [word]);

  // 处理AI分析完成
  const handleAnalysisComplete = useCallback((newDefinition: string) => {
    setDefinition(newDefinition);
    setIsParsed(true);
  }, []);

  // 处理AI分析错误
  const handleAnalysisError = useCallback((error: string) => {
    console.error('AI分析错误:', error);
  }, []);

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

  // 处理翻译和单词详情的更新
  const handleWordDataUpdate = useCallback((data: { translation: string; wordDetails: any }) => {
    setTranslation(data.translation);
    setWordDetails(data.wordDetails);
  }, []);

  // 切换收藏状态
  const toggleFavorite = useCallback(async () => {
    if (!word) return;
    
    if (isFavorite) {
      await database.removeFavoriteWord(word);
    } else {
      // 保存到数据库，包含翻译和AI解析
      const currentTranslation = translation || wordDetails?.translation || '';
      const currentDefinition = definition || '';
      await database.updateWordData(word, currentTranslation, currentDefinition);
    }
    setIsFavorite(!isFavorite);
    
    // 发送事件通知收藏已变化
    eventBus.emit(EVENTS.FAVORITES_CHANGED);
    
    // 通知父组件收藏状态变化
    if (onFavoriteChange) {
      onFavoriteChange(word, !isFavorite);
    }
  }, [word, definition, translation, wordDetails, isFavorite, onFavoriteChange]);

  // 处理朗读
  const handleSpeak = async () => {
    try {
      await speakWord(word);
    } catch (error) {
      console.error('朗读失败:', error);
    }
  };

  // 处理音频播放
  const handleAudioPress = async (audioUrl: string) => {
    try {
      console.log('播放音频:', audioUrl);
      // 这里可以播放网络音频，现在由WordDictionaryInfo处理
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  // 刷新AI解析
  const handleRefresh = useCallback(async () => {
    if (!word.trim()) return;
    
    // 重置AI解析状态
    setDefinition('');
    setIsParsed(false);
    
    // 调用AIWordAnalysis的刷新方法
    if (aiWordAnalysisRef.current?.refreshAnalysis) {
      aiWordAnalysisRef.current.refreshAnalysis();
    }
  }, [word]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.modalBackground }]}>
          <View style={styles.contentContainer}>
            <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
              <View style={styles.headerButtonsContainer}>
                <HeaderActionButton 
                  iconName="volume-high-outline" 
                  onPress={handleSpeak}
                  color={theme.colors.primary}
                />
                <HeaderActionButton 
                  iconName={isFavorite ? "star" : "star-outline"} 
                  onPress={toggleFavorite}
                  isActive={isFavorite}
                  color={theme.colors.primary}
                />
                <HeaderActionButton 
                  iconName="close-outline" 
                  onPress={handleClose} 
                  size={32}
                />
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
              <WordDictionaryInfo 
                word={word} 
                onAudioPress={handleAudioPress}
                onDataUpdate={handleWordDataUpdate}
              />

              <View style={styles.definitionSection}>
                <AIWordAnalysis
                  ref={aiWordAnalysisRef}
                  word={word}
                  context={context}
                  translation={translation} // 传递翻译给AI分析
                  hasWordData={hasWordData}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={handleAnalysisError}
                  onRefresh={handleRefresh}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical:6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  definitionSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
