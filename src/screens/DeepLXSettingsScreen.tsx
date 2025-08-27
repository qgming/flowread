import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, saveSettings, DeepLXConfig } from '../utils/settingsStorage';
import { createDeepLXService } from '../services/translation';

type DeepLXSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DeepLXSettingsScreen() {
  const [config, setConfig] = useState<DeepLXConfig>({
    url: 'https://deeplx.vercel.app/translate',
    apiKey: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const navigation = useNavigation<DeepLXSettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then(settings => {
      setConfig(settings.deeplx);
    });
  }, []);

  const handleSave = async () => {
    try {
      const settings = await loadSettings();
      settings.deeplx = config;
      await saveSettings(settings);
      setHasChanges(false);
      Alert.alert('保存成功', 'DeepLX配置已保存');
    } catch (error) {
      Alert.alert('保存失败', '无法保存配置，请重试');
    }
  };

  const handleTestConnection = async () => {
    if (!config.url.trim()) {
      Alert.alert('错误', '请输入DeepLX服务地址');
      return;
    }

    setIsTesting(true);
    setTestResult('');
    
    try {
      const service = createDeepLXService(config);
      const isConnected = await service.testConnection();
      
      if (isConnected) {
        setTestResult('连接成功！测试翻译结果：你好，世界！');
      } else {
        setTestResult('连接失败：无法连接到DeepLX服务');
      }
    } catch (error) {
      setTestResult(`连接失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field: keyof DeepLXConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setTestResult('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 介绍卡片 */}
        <View style={styles.introCard}>
          <Text style={styles.providerName}>DeepL翻译服务</Text>
          <Text style={styles.providerDescription}>
            基于DeepL的翻译服务，支持多种语言的高质量翻译。当前使用DeepLX无需付费即可使用，API密钥为可选项。
          </Text>
        </View>

        {/* 配置表单 */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>基础配置</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>服务地址</Text>
            <TextInput
              style={styles.input}
              value={config.url}
              onChangeText={(text) => handleInputChange('url', text)}
              placeholder="https://deeplx.vercel.app/translate"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>API密钥（可选）</Text>
            <TextInput
              style={styles.input}
              value={config.apiKey}
              onChangeText={(text) => handleInputChange('apiKey', text)}
              placeholder="留空即可使用免费服务"
              placeholderTextColor="#8E8E93"
              secureTextEntry
            />
          </View>

          {/* 测试结果 */}
          {testResult ? (
            <View style={[styles.testResult, testResult.includes('成功') ? styles.testResultSuccess : styles.testResultError]}>
              <Text style={[styles.testResultText, testResult.includes('成功') ? styles.testResultTextSuccess : styles.testResultTextError]}>
                {testResult}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[styles.buttonText, styles.testButtonText]}>验证</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={[styles.buttonText, styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              保存
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  providerDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  testResult: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  testResultSuccess: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  testResultError: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  testResultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  testResultTextSuccess: {
    color: '#0ea5e9',
  },
  testResultTextError: {
    color: '#ef4444',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  testButtonText: {
    color: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
});
