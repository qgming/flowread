import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, updateSetting } from '../utils/settingsStorage';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AISettings' | 'DeepLXSettings' | 'TranslationSettings' | 'AnalysisSettings'>;

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then(settings => {
      setIsDarkMode(settings.isDarkMode);
    });
  }, []);

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await updateSetting('isDarkMode', value);
  };

  const navigateToAISettings = () => {
    navigation.navigate('AISettings');
  };

  const navigateToDeepLXSettings = () => {
    navigation.navigate('DeepLXSettings');
  };

  const navigateToTranslationSettings = () => {
    navigation.navigate('TranslationSettings');
  };

  const navigateToAnalysisSettings = () => {
    navigation.navigate('AnalysisSettings' as any);
  };

  return (
    <View style={styles.container}>    
      <View style={styles.content}>
        {/* 深色模式开关卡片 */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>深色模式</Text>
              <Text style={styles.cardDescription}>切换应用主题颜色</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor={isDarkMode ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* 翻译服务设置卡片 */}
        <TouchableOpacity style={styles.card} onPress={navigateToTranslationSettings}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>翻译偏好</Text>
              <Text style={styles.cardDescription}>配置翻译引擎、目标语言和提示词</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* 解析服务设置卡片 */}
        <TouchableOpacity style={styles.card} onPress={navigateToAnalysisSettings}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>解析服务</Text>
              <Text style={styles.cardDescription}>配置单词和文章解析的AI模型</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* AI设置卡片 */}
        <TouchableOpacity style={styles.card} onPress={navigateToAISettings}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>AI设置</Text>
              <Text style={styles.cardDescription}>自定义大模型地址与密钥</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* DeepLX设置卡片 */}
        <TouchableOpacity style={styles.card} onPress={navigateToDeepLXSettings}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>DeepL设置</Text>
              <Text style={styles.cardDescription}>配置DeepL、DeepLX翻译接口</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  arrow: {
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: '300',
  },
});
