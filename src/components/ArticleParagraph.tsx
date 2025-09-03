import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncPressableText from './AsyncPressableText';
import { useTheme } from '../theme/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <View style={styles.paragraphWrapper}>
      <AsyncPressableText
        text={original}
        onWordPress={onWordPress}
        favoriteWords={favoriteWords}
      />
      
      {translated && (
        <View style={[styles.translationContainer, !showTranslation && styles.hidden]}>
          <Text style={[styles.translatedText, { color: theme.colors.textSecondary }]}>
            {translated}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}1A` }]}>
          <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {isTranslating && (
        <View style={styles.translatingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.translatingText, { color: theme.colors.primary }]}>
            翻译中...
          </Text>
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
    textAlign: 'auto',
  },
  hidden: {
    display: 'none',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorMessage: {
    fontSize: 14,
  },
  translatingContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  translatingText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
