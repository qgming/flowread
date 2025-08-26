import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import ArticleCard from '../components/ArticleCard';
import Database, { Article } from '../database/database';

export default function ReadingScreen({ navigation }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const allArticles = await Database.getAllArticles();
      setArticles(allArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

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

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    try {
      await Database.insertArticle(title.trim(), content.trim(), tagArray);
      await loadArticles();
      
      setTitle('');
      setContent('');
      setTags('');
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

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleCard
      article={item}
      onPress={() => {
        navigation.navigate('ArticleReader', { article: item });
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

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={articles.length === 0 ? styles.emptyList : null}
      />

      {/* 悬浮按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 选择菜单 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                handleImportFile();
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.modalButtonText}>导入TXT文件</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                setPasteModalVisible(true);
              }}
            >
              <Ionicons name="clipboard-outline" size={24} color="#333" />
              <Text style={styles.modalButtonText}>粘贴文本</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
            
            <TextInput
              style={styles.input}
              placeholder="标签（用逗号分隔）"
              value={tags}
              onChangeText={setTags}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
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
    height: 120,
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
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
