import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ArticleHeaderProps {
  title: string;
  createdAt: string;
  translationStatus: string;
  translationLanguage?: string;
  tags: string[];
  onRemoveTag: (tag: string) => void;
  isUpdatingTags: boolean;
}

export default function ArticleHeader({
  title,
  createdAt,
  translationStatus,
  translationLanguage,
  tags,
  onRemoveTag,
  isUpdatingTags,
}: ArticleHeaderProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.capsulesContainer}>
          <View style={styles.dateCapsule}>
            <Text style={styles.dateText}>
              {new Date(createdAt).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          {translationLanguage && (
            <View style={[styles.dateCapsule, styles.translationCapsule]}>
              <Text style={styles.translationText}>
                {translationStatus} ({translationLanguage})
              </Text>
            </View>
          )}
          {tags.map((tag, index) => (
            <TouchableOpacity
              key={`${tag}-${index}`}
              style={styles.tagCapsule}
              onPress={() => onRemoveTag(tag)}
              disabled={isUpdatingTags}
            >
              <Text style={styles.tagText}>{tag}</Text>
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
    color: '#1a1a1a',
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
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#555555',
  },
  translationCapsule: {
    backgroundColor: '#e8f5e8',
  },
  translationText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  tagCapsule: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1565c0',
  },
});
