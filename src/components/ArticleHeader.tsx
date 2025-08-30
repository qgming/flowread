import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ArticleHeaderProps {
  title: string;
  createdAt: string;
  translationStatus: string;
  translationLanguage?: string;
  tags: string[];
  onRemoveTag: (tag: string) => void;
  isUpdatingTags: boolean;
  wordCount: number;
}

export default function ArticleHeader({
  title,
  createdAt,
  translationStatus,
  translationLanguage,
  tags,
  onRemoveTag,
  isUpdatingTags,
  wordCount,
}: ArticleHeaderProps) {
  const { theme } = useTheme();

  return (
    <View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.capsulesContainer}>
          <View style={[styles.dateCapsule, { backgroundColor: theme.isDark ? '#38383A' : '#F2F2F7' }]}>
            <Text style={[styles.dateText, { color: theme.isDark ? '#EBEBF599' : '#424242' }]}>
              {new Date(createdAt).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          
          <View style={[styles.wordCountCapsule, { backgroundColor: theme.isDark ? '#3E2723' : '#fff3e0' }]}>
            <Text style={[styles.wordCountText, { color: theme.isDark ? '#FFAB91' : '#e65100' }]}>
              {wordCount} 词
            </Text>
          </View>
          
          {translationLanguage && (
            <View style={[styles.translationCapsule, { backgroundColor: theme.isDark ? '#1B5E20' : '#e8f5e8' }]}>
              <Text style={[styles.translationText, { color: theme.isDark ? '#81C784' : '#2e7d32' }]}>
                {translationStatus} ({translationLanguage})
              </Text>
            </View>
          )}
          {tags.map((tag, index) => (
            <TouchableOpacity
              key={`${tag}-${index}`}
              style={[styles.tagCapsule, { backgroundColor: theme.isDark ? '#0A2A4A' : '#e3f2fd' }]}
              onPress={() => onRemoveTag(tag)}
              disabled={isUpdatingTags}
            >
              <Text style={[styles.tagText, { color: theme.isDark ? '#64b5f6' : '#1565c0' }]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 36,
  },
  metaContainer: {
    marginBottom: 10,
  },
  capsulesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateText: {
    fontSize: 12,
  },
  wordCountCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wordCountText: {
    fontSize: 12,
  },
  translationCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  translationText: {
    fontSize: 12,
  },
  tagCapsule: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
  },
});
