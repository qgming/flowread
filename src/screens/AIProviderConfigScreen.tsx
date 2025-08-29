import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, updateAIProvider, AIProviderConfig } from '../utils/settingsStorage';
import { useTheme } from '../theme/ThemeContext';

type AIProviderConfigScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = { provider: string };

export default function AIProviderConfigScreen() {
  const { theme } = useTheme();
  const [config, setConfig] = useState<AIProviderConfig | null>(null);
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [isTesting, setIsTesting] = useState(false);
  
  const navigation = useNavigation<AIProviderConfigScreenNavigationProp>();
  const route = useRoute();
  const { provider } = route.params as RouteParams;

  useEffect(() => {
    loadSettings().then(settings => {
      const providerConfig = settings.aiProviders[provider as keyof typeof settings.aiProviders];
      setConfig(providerConfig);
      setUrl(providerConfig.url);
      setApiKey(providerConfig.apiKey);
      setModel(providerConfig.model);
      setTemperature(providerConfig.temperature);
    });
  }, [provider]);

  const handleTestConnection = async () => {
    if (!config) return;
    
    setIsTesting(true);
    try {
      const { createChatService, formatChatError } = await import('../services/chat');
      
      const testConfig = {
        name: config.name,
        description: config.description,
        url: url.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        isEnabled: true,
        temperature: temperature,
      };

      const chatService = createChatService(testConfig);
      const isConnected = await chatService.testConnection();
      
      if (isConnected) {
        Alert.alert('测试成功', 'API连接正常，可以开始使用');
      } else {
        Alert.alert('测试失败', '无法连接到API，请检查配置信息');
      }
    } catch (error) {
      const { formatChatError } = await import('../services/chat');
      const errorMessage = formatChatError(error);
      Alert.alert('测试失败', errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('错误', '请输入API URL');
      return;
    }
    if (!apiKey.trim()) {
      Alert.alert('错误', '请输入API密钥');
      return;
    }
    if (!model.trim()) {
      Alert.alert('错误', '请输入模型名称');
      return;
    }

    try {
      await updateAIProvider(provider as any, {
        url: url.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        isEnabled: true,
        temperature,
      });
      Alert.alert('保存成功', '配置已保存并启用');
      navigation.goBack();
    } catch (error) {
      Alert.alert('保存失败', '配置保存失败，请重试');
    }
  };

  if (!config) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* 介绍卡片 */}
        <View style={[styles.introCard, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }]}>
          <Text style={[styles.providerName, { color: theme.colors.text }]}>{config.name}</Text>
          <Text style={[styles.providerDescription, { color: theme.colors.textSecondary }]}>
            {config.description}
          </Text>
        </View>

        {/* 配置表单 */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>基础配置</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>API URL</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="输入API地址"
              value={url}
              onChangeText={setUrl}
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>API密钥</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="输入您的API密钥"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>模型名称</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="输入模型名称"
              value={model}
              onChangeText={setModel}
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>温度参数</Text>
            <Text style={[styles.temperatureDescription, { color: theme.colors.textSecondary }]}>
              控制AI回复的创造性程度：较低值更保守，较高值更有创意
            </Text>
            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>保守</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={2}
                step={0.01}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
              <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>创意</Text>
            </View>
            <Text style={[styles.temperatureValue, { color: theme.colors.primary }]}>
              当前值：{temperature.toFixed(2)}
            </Text>
          </View>
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
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
              {isTesting ? '测试中...' : '验证'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>确认</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  temperatureDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  temperatureValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    width: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
});
