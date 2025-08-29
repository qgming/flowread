import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import PressableText from './PressableText';

interface ArticleParagraphProps {
  original: string;
  translated?: string;
  isTranslating?: boolean;
  error?: string;
  showTranslation: boolean;
  onWordPress: (word: string, context: string) => void;
  favoriteWords?: Set<string>;
}

export default function ArticleParagraph({
  original,
  translated,
  isTranslating,
  error,
  showTranslation,
  onWordPress,
  favoriteWords,
}: ArticleParagraphProps) {
  return (
    <View style={styles.paragraphWrapper}>
      <PressableText
        text={original}
        onWordPress={onWordPress}
        favoriteWords={favoriteWords}
      />
      
      {translated && (
        <View style={[styles.translationContainer, !showTranslation && styles.hidden]}>
          <Text style={styles.translatedText}>{translated}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      {isTranslating && (
        <View style={styles.translatingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.translatingText}>翻译中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paragraphWrapper: {
    marginBottom: 10,
  },
  translationContainer: {
    marginTop: 10,
  },
  translatedText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#777',
    textAlign: 'auto',
  },
  hidden: {
    display: 'none',
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
});
