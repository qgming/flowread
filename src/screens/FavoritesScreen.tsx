import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import database from '../database/database';
import BottomActionSheet from '../components/BottomActionSheet';

interface FavoriteWord {
  id: number;
  word: string;
  translation: string;
  definition: string;
  created_at: string;
}

interface SectionData {
  title: string;
  data: FavoriteWord[];
}

export default function FavoritesScreen() {
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWord[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // 加载收藏单词
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const words = await database.getFavoriteWords();
      setFavoriteWords(words);
    } catch (error) {
      console.error('加载收藏单词失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 每次进入页面时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // 按日期分组
  const groupWordsByDate = (words: FavoriteWord[]): SectionData[] => {
    const groups: { [key: string]: FavoriteWord[] } = {};
    
    words.forEach(word => {
      const date = word.created_at.split(' ')[0]; // 获取日期部分
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(word);
    });

    // 按日期降序排序
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedDates.map(date => ({
      title: date,
      data: groups[date]
    }));
  };

  // 搜索过滤和分组
  useEffect(() => {
    let filtered = favoriteWords;
    
    if (searchText.trim() !== '') {
      filtered = favoriteWords.filter(word => 
        word.word.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setSections(groupWordsByDate(filtered));
  }, [searchText, favoriteWords]);

  // 取消收藏
  const removeFavorite = async (word: string) => {
    Alert.alert(
      '确认删除',
      `确定要删除单词 "${word}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.removeFavoriteWord(word);
              const updatedWords = favoriteWords.filter(w => w.word !== word);
              setFavoriteWords(updatedWords);
            } catch (error) {
              console.error('取消收藏失败:', error);
            }
          },
        },
      ]
    );
  };

  // 导出单词
  const exportWords = () => {
    const allWords = sections.flatMap(section => section.data);
    const wordList = allWords.map(w => w.word).join('\n');
    Alert.alert('导出成功', `已导出 ${allWords.length} 个单词`);
  };

  const actionItems = [
    {
      title: '导出单词',
      onPress: exportWords,
    },
  ];

  const renderWordItem = ({ item }: { item: FavoriteWord }) => (
    <TouchableOpacity 
      style={styles.wordItem}
      onPress={() => {}}
    >
      <View style={styles.wordLeft}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.translationText} numberOfLines={1}>{item.translation}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => removeFavorite(item.word)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.countButton}>
          <Text style={styles.countText}>
            {sections.reduce((total, section) => total + section.data.length, 0)}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#8E8E93"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setBottomSheetVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 单词列表 */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWordItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmarks-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>暂无收藏单词</Text>
            <Text style={styles.emptySubtitle}>在阅读文章时点击单词即可添加收藏</Text>
          </View>
        }
      />
      
      {/* 底部操作表 */}
      <BottomActionSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        actions={actionItems}
        title="更多操作"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 36,  
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000', 
    paddingVertical: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  wordLeft: {
    flex: 1,
    marginRight: 12,
  },
  wordText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
  },
  translationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
