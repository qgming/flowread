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
import { useTheme } from '../theme/ThemeContext';

type DeepLXSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DeepLXSettingsScreen() {
  const { theme } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* 介绍卡片 */}
        <View style={[styles.introCard, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.providerName, { color: theme.colors.text }]}>DeepL翻译服务</Text>
          <Text style={[styles.providerDescription, { color: theme.colors.textSecondary }]}>
            基于DeepL的翻译服务，支持多种语言的高质量翻译。当前使用DeepLX无需付费即可使用，API密钥为可选项。
          </Text>
        </View>

        {/* 配置表单 */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>基础配置</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>服务地址</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={config.url}
              onChangeText={(text) => handleInputChange('url', text)}
              placeholder="https://dplx.xi-xu.me/translate"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>API密钥（可选）</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={config.apiKey}
              onChangeText={(text) => handleInputChange('apiKey', text)}
              placeholder="留空即可使用免费服务"
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry
            />
          </View>

          {/* 测试结果 */}
          {testResult ? (
            <View style={[
              styles.testResult,
              testResult.includes('成功') 
                ? { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }
                : { backgroundColor: theme.colors.error + '1A', borderColor: theme.colors.error }
            ]}>
              <Text style={[
                styles.testResultText,
                testResult.includes('成功') 
                  ? { color: theme.colors.primary }
                  : { color: theme.colors.error }
              ]}>
                {testResult}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary
            }]} 
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.colors.primary }]}>验证</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, !hasChanges && { 
              backgroundColor: theme.colors.surfaceVariant 
            }]} 
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={[styles.buttonText, !hasChanges ? { color: theme.colors.textTertiary } : { color: theme.colors.onPrimary }]}>
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
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  providerDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  testResult: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  testResultText: {
    fontSize: 14,
    lineHeight: 20,
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
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
