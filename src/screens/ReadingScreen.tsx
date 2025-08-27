import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
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

export default function ReadingScreen({ navigation }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
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
    if (selectedTags.size === 0) {
      return articles;
    }
    return articles.filter(article => 
      Array.from(selectedTags).every(tag => article.tags.includes(tag))
    );
  }, [articles, selectedTags]);

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

  const handlePasteImport = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('提示', '请输入标题和内容');
      return;
    }

    try {
      await Database.insertArticle(title.trim(), content.trim(), []);
      await loadArticles();
      
      setTitle('');
      setContent('');
      setPasteModalVisible(false);
      
      Alert.alert('成功', '文章保存成功');
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('错误', '保存失败');
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
      <Text style={styles.emptyText}>暂无文章</Text>
      <Text style={styles.emptySubtext}>点击右下角"+"按钮添加文章</Text>
    </View>
  );

  const actionItems = [
    {
      title: '导入TXT文件',
      onPress: handleImportFile,
    },
    {
      title: '粘贴文本',
      onPress: () => setPasteModalVisible(true),
    },
  ];

  return (
    <View style={styles.container}>
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
                selectedTags.size === 0 && styles.tagSelected
              ]}
              onPress={clearAllTags}
            >
              <Text style={[
                styles.tagText,
                selectedTags.size === 0 && styles.tagTextSelected
              ]}>
                全部
              </Text>
            </TouchableOpacity>
            
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.has(tag) && styles.tagSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  selectedTags.has(tag) && styles.tagTextSelected
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
        style={styles.fab}
        onPress={() => setBottomSheetVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 底部操作表 */}
      <BottomActionSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        actions={actionItems}
        title="添加文章"
      />

      {/* 粘贴文本模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pasteModalVisible}
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>添加文章</Text>
            
            <TextInput
              style={styles.input}
              placeholder="标题"
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="内容"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPasteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handlePasteImport}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tagsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
