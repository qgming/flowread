import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Database from '../database/database';
import { RootStackParamList } from '../navigation/RootNavigator';

type ShareInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShareInput'>;

export default function ShareInputScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<ShareInputScreenNavigationProp>();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = React.useCallback(async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent || trimmedContent.length === 0) {
      Alert.alert('提示', '请输入内容');
      return;
    }
    
    if (trimmedContent.replace(/\s/g, '').length === 0) {
      Alert.alert('提示', '请输入有效内容，不能只输入空格');
      return;
    }

    setLoading(true);
    
    try {
      const finalTitle = title.trim() || trimmedContent.substring(0, 20);
      await Database.insertArticle(finalTitle, trimmedContent, []);
      
      Alert.alert('成功', '文章已保存', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('保存失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存失败，请重试';
      Alert.alert('错误', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [content, title, navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text 
            style={[
              styles.saveButtonText, 
              { 
                color: loading ? theme.colors.textTertiary : theme.colors.primary,
                fontWeight: '600'
              }
            ]}
            onPress={!loading ? handleSave : undefined}
          >
            保存
          </Text>
        </View>
      ),
    });
  }, [navigation, loading, handleSave]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <TextInput
            style={[
              styles.titleInput,
              { color: theme.colors.text }
            ]}
            placeholder="请输入标题"
            placeholderTextColor={theme.colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
          />
          
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          
          <TextInput
            style={[
              styles.contentInput,
              { color: theme.colors.text }
            ]}
            placeholder="开始写作..."
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
            scrollEnabled={true}
            keyboardType="default"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 12,
    paddingHorizontal: 0,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  headerRight: {
    paddingRight: 16,
  },
  saveButtonText: {
    fontSize: 16,
  },
});
