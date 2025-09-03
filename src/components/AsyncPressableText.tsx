import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokenizerService, Token } from '../services/tokenizer';

interface AsyncPressableTextProps {
  text: string;
  onWordPress: (word: string, context: string) => void;
  wordStyle?: (word: string, index: number) => any;
  selectedWord?: string;
  highlightColor?: string;
  favoriteWords?: Set<string>;
}

export default function AsyncPressableText({ 
  text, 
  onWordPress, 
  wordStyle,
  favoriteWords
}: AsyncPressableTextProps) {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const tokenizeText = async () => {
      if (!text) {
        setTokens([]);
        return;
      }

      setIsTokenizing(true);
      try {
        const tokenized = await tokenizerService.tokenizeAsync(text);
        if (isMounted) {
          setTokens(tokenized);
        }
      } catch (error) {
        console.error('分词失败:', error);
        if (isMounted) {
          setTokens([]);
        }
      } finally {
        if (isMounted) {
          setIsTokenizing(false);
        }
      }
    };

    tokenizeText();

    return () => {
      isMounted = false;
    };
  }, [text]);

  const handleWordPress = useCallback((word: string) => {
    onWordPress(word, text);
  }, [onWordPress, text]);

  const getFavoriteBackgroundColor = () => {
    return theme.isDark ? '#4A411C' : '#FFFDE7';
  };

  const renderTokens = () => {
    if (isTokenizing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    return tokens.map((token, index) => {
      if (token.type === 'whitespace') {
        return (
          <Text key={`space-${index}`} style={[styles.whitespace, { color: theme.colors.text }]}>
            {token.text}
          </Text>
        );
      }

      if (token.type === 'word') {
        const isFavorite = favoriteWords && favoriteWords.has(token.text.toLowerCase());
        const customStyle = wordStyle ? wordStyle(token.text, index) : null;
        const favoriteStyle = isFavorite ? [styles.favoriteWord, { backgroundColor: getFavoriteBackgroundColor() }] : null;
        
        return (
          <TouchableOpacity
            key={`word-${index}`}
            onPress={() => handleWordPress(token.text)}
            style={[styles.wordTouchable, customStyle]}
            activeOpacity={0.7}
          >
            <Text style={[styles.wordText, { color: theme.colors.text }, customStyle, favoriteStyle]}>
              {token.text}
            </Text>
          </TouchableOpacity>
        );
      }

      // 标点符号
      return (
        <Text key={`punct-${index}`} style={[styles.punctuation, { color: theme.colors.text }]}>
          {token.text}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {renderTokens()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  wordTouchable: {
    marginHorizontal: 0,
  },
  wordText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'auto',
  },
  favoriteWord: {
    borderRadius: 9,
    paddingHorizontal: 5,
    marginVertical: 2,
  },
  whitespace: {
    fontSize: 18,
    lineHeight: 32,
  },
  punctuation: {
    fontSize: 18,
    lineHeight: 32,
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});
