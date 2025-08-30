import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../theme/ThemeContext';
import { speakWord } from '../services/speech';
import { loadSettings } from '../utils/settingsStorage';

const { height: screenHeight } = Dimensions.get('window');

interface WordDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  word: string;
  translation: string;
  definition: string;
}

export default function WordDetailSheet({ 
  visible, 
  onClose, 
  word, 
  translation, 
  definition 
}: WordDetailSheetProps) {
  const { theme } = useTheme();

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

  const handleSpeak = async () => {
    try {
      await speakWord(word);
    } catch (error) {
      console.error('朗读失败:', error);
    }
  };

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text,
    },
    heading1: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 12,
      marginBottom: 6,
    },
    heading2: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 10,
      marginBottom: 4,
    },
    heading3: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 2,
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
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.modalBackground }]}>
          <View style={styles.contentContainer}>
            {/* 顶部标题栏 */}
            <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[styles.wordText, { color: theme.colors.text }]}>{word}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleSpeak}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="volume-high-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-outline" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 内容区域 */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {/* 翻译区域 */}
              <View style={styles.translationSection}>
                <View style={[styles.translationCapsule, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.translationText, { color: theme.colors.primary }]}>{translation}</Text>
                </View>
              </View>

              {/* 详细解析区域 */}
              {definition && (
                <View style={styles.definitionSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>详细解析</Text>
                  <View style={[styles.definitionContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Markdown style={markdownStyles}>
                      {definition}
                    </Markdown>
                  </View>
                </View>
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
    height: screenHeight * 0.7,
    maxHeight: screenHeight * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordText: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  translationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  translationCapsule: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  translationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  definitionSection: {
    marginBottom: 20,
  },
  definitionContainer: {
    borderRadius: 12,
    padding: 16,
  },
});
