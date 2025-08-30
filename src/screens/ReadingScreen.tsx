import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import ArticleCard from '../components/ArticleCard';
import BottomActionSheet from '../components/BottomActionSheet';
import Database, { Article } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

export default function ReadingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [])
  );

  const loadArticles = async () => {
    try {
      const allArticles = await Database.getAllArticles();
      setArticles(allArticles);
      
      // 清理无效的选中标签
      const currentTags = new Set<string>();
      allArticles.forEach(article => {
        article.tags.forEach(tag => currentTags.add(tag));
      });
      
      setSelectedTags(prevSelectedTags => {
        const validSelectedTags = new Set<string>();
        prevSelectedTags.forEach(tag => {
          if (currentTags.has(tag)) {
            validSelectedTags.add(tag);
          }
        });
        return validSelectedTags;
      });
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  // 提取所有唯一标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach(article => {
      article.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [articles]);

  // 筛选文章
  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    // 搜索标题
    if (searchQuery.trim()) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 标签筛选
    if (selectedTags.size > 0) {
      filtered = filtered.filter(article => 
        Array.from(selectedTags).every(tag => article.tags.includes(tag))
      );
    }
    
    return filtered;
  }, [articles, selectedTags, searchQuery]);

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      
      const fileTitle = file.name.replace('.txt', '');
      await Database.insertArticle(fileTitle, text);
      await loadArticles();
      
      Alert.alert('成功', '文件导入成功');
    } catch (error) {
      console.error('Error importing file:', error);
      Alert.alert('错误', '文件导入失败');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      await Database.deleteArticle(id);
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      Alert.alert('错误', '删除文章失败');
    }
  };

  const handleUpdateArticle = async (id: number, title: string, tags: string[]) => {
    try {
      const article = articles.find(a => a.id === id);
      if (article) {
        await Database.updateArticle(id, title, article.content, tags);
        await loadArticles();
      }
    } catch (error) {
      console.error('Error updating article:', error);
      Alert.alert('错误', '更新文章失败');
    }
  };

  const toggleTag = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }
    setSelectedTags(newSelectedTags);
  };

  const clearAllTags = () => {
    setSelectedTags(new Set());
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleCard
      article={item}
      onPress={() => {
        navigation.navigate('ArticleReader', { articleId: item.id });
      }}
      onDelete={handleDeleteArticle}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>暂无文章</Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>点击右下角"+"按钮添加文章</Text>
    </View>
  );

  const actionItems = [ 
    {
      title: '新增文章',
      onPress: () => {
        setBottomSheetVisible(false);
        navigation.navigate('ShareInput');
      },
    },
       {
      title: '导入TXT文件',
      onPress: handleImportFile,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 搜索框 */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="search" size={20} color={theme.colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="搜索文章标题..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 标签筛选区域 */}
      {allTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
          >
            <TouchableOpacity
              style={[
                styles.tag,
                { backgroundColor: selectedTags.size === 0 ? theme.colors.primary : theme.colors.surfaceVariant },
                selectedTags.size === 0 && { borderColor: theme.colors.primary }
              ]}
              onPress={clearAllTags}
            >
              <Text style={[
                styles.tagText,
                { color: selectedTags.size === 0 ? theme.colors.onPrimary : theme.colors.textSecondary }
              ]}>
                全部
              </Text>
            </TouchableOpacity>
            
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: selectedTags.has(tag) ? theme.colors.primary : theme.colors.surfaceVariant },
                  selectedTags.has(tag) && { borderColor: theme.colors.primary }
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  { color: selectedTags.has(tag) ? theme.colors.onPrimary : theme.colors.textSecondary }
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredArticles.length === 0 ? styles.emptyList : null}
      />

      {/* 悬浮按钮 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setBottomSheetVisible(true)}
      >
        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
      </TouchableOpacity>

      {/* 底部操作表 */}
      <BottomActionSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        actions={actionItems}
        title="添加文章"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 5,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  tagsContainer: {
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
});
