import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, updateAIProvider, AIProviderConfig } from '../utils/settingsStorage';

type AIProviderConfigScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = { provider: 'deepseek' | 'siliconflow' | 'zhipu' };

export default function AIProviderConfigScreen() {
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
      const providerConfig = settings.aiProviders[provider];
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
      await updateAIProvider(provider, {
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
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 介绍卡片 */}
        <View style={styles.introCard}>
          <Text style={styles.providerName}>{config.name}</Text>
          <Text style={styles.providerDescription}>{config.description}</Text>
        </View>

        {/* 配置表单 */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>基础配置</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>API URL</Text>
            <TextInput
              style={styles.input}
              placeholder="输入API地址"
              value={url}
              onChangeText={setUrl}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>API密钥</Text>
            <TextInput
              style={styles.input}
              placeholder="输入您的API密钥"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>模型名称</Text>
            <TextInput
              style={styles.input}
              placeholder="输入模型名称"
              value={model}
              onChangeText={setModel}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>温度参数</Text>
            <Text style={styles.temperatureDescription}>
              控制AI回复的创造性程度：较低值更保守，较高值更有创意
            </Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>保守</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={2}
                step={0.01}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#007AFF"
              />
              <Text style={styles.sliderLabel}>创意</Text>
            </View>
            <Text style={styles.temperatureValue}>当前值：{temperature.toFixed(2)}</Text>
          </View>
        </View>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            <Text style={[styles.buttonText, styles.testButtonText]}>
              {isTesting ? '测试中...' : '验证'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>确认</Text>
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
  temperatureDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  temperatureValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
    color: '#8E8E93',
    width: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
});
