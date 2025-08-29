import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList,
  Clipboard
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import database from '../database/database';
import BottomActionSheet from '../components/BottomActionSheet';
import WordDetailSheet from '../components/WordDetailSheet';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';

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
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWord[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [wordDetailVisible, setWordDetailVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<FavoriteWord | null>(null);

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

  // 复制所有单词到剪贴板
  const copyAllWords = async () => {
    try {
      const allWords = sections.flatMap(section => section.data);
      const wordList = allWords.map(w => w.word).join('\n');
      
      if (wordList.length === 0) {
        Alert.alert('提示', '暂无收藏的单词');
        return;
      }
      
      await Clipboard.setString(wordList);
      Alert.alert('复制成功', `已复制 ${allWords.length} 个单词到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert('复制失败', '无法复制到剪贴板');
    }
  };

  // 打开单词详情
  const openWordDetail = (word: FavoriteWord) => {
    setSelectedWord(word);
    setWordDetailVisible(true);
  };

  // 关闭单词详情
  const closeWordDetail = () => {
    setWordDetailVisible(false);
    setSelectedWord(null);
  };

  const actionItems = [
    {
      title: '复制所有单词',
      onPress: copyAllWords,
    },
  ];

  const renderWordItem = ({ item }: { item: FavoriteWord }) => (
    <TouchableOpacity 
      style={[styles.wordItem, { borderBottomColor: theme.colors.divider }]}
      onPress={() => openWordDetail(item)}
    >
      <View style={styles.wordLeft}>
        <Text style={[styles.wordText, { color: theme.colors.text }]}>{item.word}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => removeFavorite(item.word)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceVariant, borderBottomColor: theme.colors.divider }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部栏 */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={[styles.countButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.countText, { color: theme.colors.onPrimary }]}>
            {sections.reduce((total, section) => total + section.data.length, 0)}
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.text }]}>
          <Ionicons name="search" size={20} color={theme.colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="搜索单词"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={theme.colors.textTertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setBottomSheetVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.onPrimary} />
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
            <Ionicons name="bookmarks-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>暂无收藏单词</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>在阅读文章时点击单词即可添加收藏</Text>
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

      {/* 单词详情抽屉 */}
      {selectedWord && (
        <WordDetailSheet
          visible={wordDetailVisible}
          onClose={closeWordDetail}
          word={selectedWord.word}
          translation={selectedWord.translation}
          definition={selectedWord.definition}
        />
      )}

      {/* 悬浮胶囊按钮 */}
      <View style={styles.floatingButtonContainer}>
        <View style={[styles.capsuleButton, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.text }]}>
          <TouchableOpacity 
            style={styles.buttonHalf}
            onPress={() => navigation.navigate('ImmersiveReading')}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>沉浸刷词</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <TouchableOpacity 
            style={styles.buttonHalf}
            onPress={() => navigation.navigate('WordMemory')}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>单词记忆</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 8,
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 36,  
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginRight: 12,
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
    paddingVertical: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordLeft: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 17,
    fontWeight: '400',
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
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  capsuleButton: {
    flexDirection: 'row',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 4,
    width: '60%',
    maxWidth: 500,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonHalf: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '100%',
  },
});
