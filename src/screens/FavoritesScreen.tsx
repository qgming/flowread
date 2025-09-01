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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import database from '../database/database';
import BottomActionSheet from '../components/BottomActionSheet';
import WordDefinitionSheet from '../components/WordDefinitionSheet';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { eventBus, EVENTS } from '../utils/eventBus';

interface FavoriteWord {
  id: number;
  word: string;
  ai_explanation: string;
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
  const [wordDefinitionVisible, setWordDefinitionVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

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

  // 初始加载 - 只在组件挂载时加载一次
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 监听收藏变化事件
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.FAVORITES_CHANGED, loadFavorites);
    return unsubscribe;
  }, [loadFavorites]);

  // 监听导航参数变化，处理底部操作表
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      try {
        const state = navigation.getState();
        const currentRoute = state.routes[state.index];
        const params = currentRoute.params as any;
        if (params?.showBottomSheet) {
          setBottomSheetVisible(true);
          // 清除参数
          navigation.setParams({ showBottomSheet: undefined } as any);
        }
      } catch (error) {
        // 忽略类型错误
      }
    });

    return unsubscribe;
  }, [navigation]);

  // 切换展开收起状态
  const toggleSection = (date: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

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
              // 发送事件通知收藏已变化
              eventBus.emit(EVENTS.FAVORITES_CHANGED);
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

   // 打开单词定义
  const openWordDefinition = (word: string) => {
    setSelectedWord(word);
    setWordDefinitionVisible(true);
  };

  // 关闭单词定义
  const closeWordDefinition = () => {
    setWordDefinitionVisible(false);
    setSelectedWord('');
  };

  const actionItems = [
    {
      title: '复制所有单词',
      onPress: copyAllWords,
    },
  ];

  const renderWordItem = ({ item }: { item: FavoriteWord }) => (
    <TouchableOpacity 
      style={[styles.wordItem, { borderColor: theme.colors.divider }]}
      onPress={() => openWordDefinition(item.word)}
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

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
    const isExpanded = expandedSections[title] !== false; // 默认展开
    const wordCount = sections.find(s => s.title === title)?.data.length || 0;
    
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background}]}>
        <View style={styles.tagsContainer}>
          <View style={[
            styles.capsule,
            { backgroundColor: theme.isDark ? '#38383A' : '#F2F2F7' }
          ]}>
            <Text style={[
              styles.capsuleText,
              { color: theme.isDark ? '#EBEBF599' : '#424242' }
            ]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          <View style={[
            styles.capsule,
            { backgroundColor: theme.isDark ? '#0A2A4A' : '#e3f2fd' }
          ]}>
            <Text style={[
              styles.capsuleText,
              { color: theme.isDark ? '#64b5f6' : '#1565c0' }
            ]} numberOfLines={1}>
              {wordCount}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleSection(title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // 根据展开状态过滤数据
  const getFilteredSections = () => {
    return sections.map(section => ({
      ...section,
      data: expandedSections[section.title] !== false ? section.data : []
    }));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部栏 - 只保留搜索框 */}  
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name="search" size={20} color={theme.colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="搜索单词"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={theme.colors.textTertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 单词列表 */}
      <SectionList
        sections={getFilteredSections()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWordItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[
          styles.listContent,
          getFilteredSections().length === 0 && styles.emptyList
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

      {/* 单词定义抽屉 */}
      <WordDefinitionSheet
        visible={wordDefinitionVisible}
        onClose={closeWordDefinition}
        word={selectedWord}
        context=""
        onFavoriteChange={(word, isFavorite) => {
          // 收藏状态变化时，事件总线会处理数据刷新
          console.log(`单词 ${word} 收藏状态: ${isFavorite}`);
        }}
      />

      {/* 悬浮胶囊按钮 */}
      <View style={styles.floatingButtonContainer}>
        <View style={[styles.capsuleButton, { backgroundColor: theme.colors.surface,borderColor: theme.isDark ? '#38383A' : '#E5E5EA', shadowColor: theme.colors.text }]}>
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
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
  listContent: {
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
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
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    borderWidth: 1,
    shadowOffset: {
      width: 0,
    height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
