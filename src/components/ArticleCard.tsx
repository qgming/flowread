import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <View style={[styles.container, { marginHorizontal: 16, marginVertical: 8 }]}>
      <TouchableOpacity 
        style={[styles.card, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]} 
        onPress={onPress}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
            {formatDate(article.created_at)}
          </Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // margin样式移到组件属性中，以便使用主题
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 1,
  },
  date: {
    fontSize: 14,
  },
});
