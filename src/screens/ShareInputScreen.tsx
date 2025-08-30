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

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }

    setLoading(true);
    
    try {
      const finalTitle = title.trim() || content.trim().substring(0, 50);
      await Database.insertArticle(finalTitle, content.trim(), []);
      
      Alert.alert('成功', '文章已保存', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

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
  }, [navigation, loading]);

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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 12,
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
