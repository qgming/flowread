import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
  onDelete: (id: number) => void;
}

export default function ArticleCard({ article, onPress, onDelete }: ArticleCardProps) {
  const { theme } = useTheme();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这篇文章吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            onDelete(article.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.card,
          {
            backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: theme.isDark ? '#38383A' : '#E5E5EA',
          }
        ]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.tagsContainer}>
              <View style={[
                styles.capsule,
                { backgroundColor: theme.isDark ? '#38383A' : '#F2F2F7' }
              ]}>
                <Text style={[
                  styles.capsuleText,
                  { color: theme.isDark ? '#EBEBF599' : '#424242' }
                ]} numberOfLines={1}>
                  {formatDate(article.created_at)}
                </Text>
              </View>
              
              {article.tags && article.tags.length > 0 && 
                article.tags.slice(0, 2).map((tag, index) => (
                  <View 
                    key={`${tag}-${index}`} 
                    style={[
                      styles.capsule,
                      { 
                        backgroundColor: theme.isDark ? '#0A2A4A' : '#e3f2fd',
                      }
                    ]}
                  >
                    <Text style={[
                      styles.capsuleText,
                      { color: theme.isDark ? '#64b5f6' : '#1565c0' }
                    ]} numberOfLines={1}>
                      {tag.length > 6 ? tag.substring(0, 6) : tag}
                    </Text>
                  </View>
                ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: theme.isDark ? '#FF453A20' : '#FF3B3015' }
              ]}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  capsule: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 100,
  },
  capsuleText: {
    fontSize: 12,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
