import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
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

export default function FavoritesScreen() {
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<FavoriteWord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // 加载收藏单词
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const words = await database.getFavoriteWords();
        setFavoriteWords(words);
        setFilteredWords(words);
      } catch (error) {
        console.error('加载收藏单词失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredWords(favoriteWords);
    } else {
      const filtered = favoriteWords.filter(word => 
        word.word.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredWords(filtered);
    }
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
    const wordList = filteredWords.map(w => w.word).join('\n');
    // 这里可以实现实际的导出逻辑
    Alert.alert('导出成功', `已导出 ${filteredWords.length} 个单词`);
  };

  const actionItems = [
    {
      title: '导出单词',
      onPress: exportWords,
    },
  ];

  const renderWordCard = ({ item }: { item: FavoriteWord }) => (
    <View style={styles.cardContainer}>
      <View style={styles.wordCard}>
        <Text style={styles.wordText}>{item.word}</Text>
        <TouchableOpacity 
          onPress={() => removeFavorite(item.word)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.countButton}>
          <Text style={styles.countText}>{filteredWords.length}</Text>
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
      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWordCard}
        contentContainerStyle={[
          styles.listContent,
          filteredWords.length === 0 && styles.emptyList
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
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
    height: 36,
    fontSize: 16,
    color: '#000',
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
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
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
