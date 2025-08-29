import React from 'react';
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
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.contentContainer}>
            {/* 顶部标题栏 */}
            <View style={styles.header}>
              <Text style={styles.wordText}>{word}</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* 内容区域 */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {/* 翻译区域 */}
              <View style={styles.translationSection}>
                <Text style={styles.sectionTitle}>翻译</Text>
                <View style={styles.translationCapsule}>
                  <Text style={styles.translationText}>{translation}</Text>
                </View>
              </View>

              {/* 详细解析区域 */}
              {definition && (
                <View style={styles.definitionSection}>
                  <Text style={styles.sectionTitle}>详细解析</Text>
                  <View style={styles.definitionContainer}>
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

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 10,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  blockquote: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E5E5EA',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  closeButton: {
    padding: 8,
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
    color: '#000',
    marginBottom: 8,
  },
  translationCapsule: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  translationText: {
    fontSize: 16,
    color: '#1565c0',
    fontWeight: '500',
  },
  definitionSection: {
    marginBottom: 20,
  },
  definitionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
});
