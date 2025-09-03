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
import { loadSettings } from '../utils/settingsStorage';
import AIWordAnalysis from './AIWordAnalysis';
import WordDictionaryInfo from './WordDictionaryInfo';
import { useTheme } from '../theme/ThemeContext';
import { speakWord } from '../services/speech';
import { eventBus, EVENTS } from '../utils/eventBus';

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
  const [savedAIContent, setSavedAIContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const aiWordAnalysisRef = useRef<any>(null);

  // 加载初始数据
  const loadInitialData = useCallback(async () => {
    if (!word.trim()) return;
    
    setLoading(true);
    try {
      const isFav = await database.isWordFavorite(word);
      setIsFavorite(isFav);
      
      if (isFav) {
        const favorite = await database.getFavoriteWord(word);
        setSavedAIContent(favorite?.ai_explanation || '');
      } else {
        setSavedAIContent('');
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [word]);

  // 自动朗读
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

  // 组件显示/隐藏时重置状态
  useEffect(() => {
    if (visible && word) {
      loadInitialData();
    } else if (!visible) {
      // 清理状态
      setIsFavorite(false);
      setSavedAIContent('');
    }
  }, [visible, word, loadInitialData]);

  // 处理收藏切换
  const handleFavoriteToggle = useCallback(async () => {
    if (!word) return;
    
    const newFavoriteState = !isFavorite;
    
    try {
      if (newFavoriteState) {
        // 新增收藏
        const aiContent = aiWordAnalysisRef.current?.getCurrentContent() || '';
        await database.addFavoriteWord(word, aiContent);
      } else {
        // 取消收藏
        await database.removeFavoriteWord(word);
      }
      
      setIsFavorite(newFavoriteState);
      setSavedAIContent(newFavoriteState ? (aiWordAnalysisRef.current?.getCurrentContent() || '') : '');
      
      // 通知外部
      eventBus.emit(EVENTS.FAVORITES_CHANGED);
      onFavoriteChange?.(word, newFavoriteState);
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  }, [word, isFavorite, onFavoriteChange]);

  // 处理朗读
  const handleSpeak = async () => {
    try {
      await speakWord(word);
    } catch (error) {
      console.error('朗读失败:', error);
    }
  };

  // 处理关闭
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 处理AI内容保存
  const handleSaveAIContent = useCallback(async (content: string) => {
    if (isFavorite && word) {
      try {
        await database.addFavoriteWord(word, content);
        setSavedAIContent(content);
        eventBus.emit(EVENTS.FAVORITES_CHANGED);
      } catch (error) {
        console.error('保存AI内容失败:', error);
      }
    }
  }, [isFavorite, word]);

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
            {/* 顶部标题栏 */}
            <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
              <View style={styles.headerButtonsContainer}>
                <HeaderActionButton 
                  iconName="volume-high-outline" 
                  onPress={handleSpeak}
                  color={theme.colors.primary}
                />
                <HeaderActionButton 
                  iconName={isFavorite ? "star" : "star-outline"} 
                  onPress={handleFavoriteToggle}
                  isActive={isFavorite}
                  color={theme.colors.primary}
                />
                <HeaderActionButton 
                  iconName="close-outline" 
                  onPress={handleClose} 
                  size={40}
                />
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    加载中...
                  </Text>
                </View>
              ) : (
                <>
                  {/* 单词基本信息 */}
                  <WordDictionaryInfo word={word} />

                  {/* AI分析区域 */}
                  <AIWordAnalysis
                    ref={aiWordAnalysisRef}
                    word={word}
                    context={context}
                    isFavorite={isFavorite}
                    savedAIContent={savedAIContent}
                    onSaveToFavorites={handleSaveAIContent}
                  />
                </>
              )}
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
    height: screenHeight * 0.8,
    maxHeight: screenHeight * 0.8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  contentContainer: {
    flex: 1,
  },
   header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
