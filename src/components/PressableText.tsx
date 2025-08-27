import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface PressableTextProps {
  text: string;
  onWordPress: (word: string, context: string) => void;
  wordStyle?: (word: string, index: number) => any;
  selectedWord?: string;
  highlightColor?: string;
}

interface Token {
  text: string;
  type: 'word' | 'punctuation' | 'whitespace';
  start: number;
  end: number;
}

export default function PressableText({ 
  text, 
  onWordPress, 
  wordStyle 
}: PressableTextProps) {
  // 使用精确的正则表达式进行英文分词
  const tokens = useMemo(() => {
    if (!text) return [];
    
    const result: Token[] = [];
    
    // 精确匹配英文单词、缩写、标点符号和空白
    // 匹配: 单词(包括缩写如don't)、标点符号、空白字符
    const regex = /(\w+(?:'\w+)*|[^\w\s]+|\s+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const isWord = /^\w+(?:'\w+)*$/.test(matchedText);
      const isWhitespace = /^\s+$/.test(matchedText);
      
      result.push({
        text: matchedText,
        type: isWord ? 'word' : isWhitespace ? 'whitespace' : 'punctuation',
        start: match.index,
        end: match.index + matchedText.length
      });
    }
    
    return result;
  }, [text]);

  const handleWordPress = useCallback((word: string) => {
    onWordPress(word, text);
  }, [onWordPress, text]);

  const renderTokens = () => {
    return tokens.map((token, index) => {
      if (token.type === 'whitespace') {
        return (
          <Text key={`space-${index}`} style={styles.whitespace}>
            {token.text}
          </Text>
        );
      }

      if (token.type === 'word') {
        const customStyle = wordStyle ? wordStyle(token.text, index) : null;
        return (
          <TouchableOpacity
            key={`word-${index}`}
            onPress={() => handleWordPress(token.text)}
            style={[styles.wordTouchable, customStyle]}
            activeOpacity={0.7}
          >
            <Text style={[styles.wordText, customStyle]}>
              {token.text}
            </Text>
          </TouchableOpacity>
        );
      }

      // 标点符号
      return (
        <Text key={`punct-${index}`} style={styles.punctuation}>
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
    color: '#000',
    textAlign: 'auto',
  },
  whitespace: {
    fontSize: 18,
    lineHeight: 32,
  },
  punctuation: {
    fontSize: 18,
    lineHeight: 32,
    color: '#000',
  },
});
