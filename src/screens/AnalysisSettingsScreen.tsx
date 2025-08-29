import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, saveSettings, Settings } from '../utils/settingsStorage';
import { useTheme } from '../theme/ThemeContext';
import ModalSelector from '../components/ModalSelector';

type AnalysisSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AnalysisSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tempSettings, setTempSettings] = useState<Settings | null>(null);
  const navigation = useNavigation<AnalysisSettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      setTempSettings(loadedSettings);
    });
  }, []);

  const handleSave = async () => {
    if (!tempSettings) return;

    try {
      await saveSettings(tempSettings);
      Alert.alert('保存成功', '解析服务设置已保存');
      navigation.goBack();
    } catch (error) {
      Alert.alert('保存失败', '保存设置时发生错误，请重试');
    }
  };

  if (!settings || !tempSettings) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  const providerOptions = [
    { label: 'FlowAI', value: 'flowai' },
    { label: 'DeepSeek', value: 'deepseek' },
    { label: '硅基流动', value: 'siliconflow' },
    { label: '智谱AI', value: 'zhipu' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* 单词解析设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>单词解析</Text>
          
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.colors.text }]}>解析模型</Text>
            <ModalSelector
              options={providerOptions}
              selectedValue={tempSettings.analysis.wordAnalysisProvider}
              onValueChange={(value: string) =>
                setTempSettings({
                  ...tempSettings,
                  analysis: {
                    ...tempSettings.analysis,
                    wordAnalysisProvider: value as keyof Settings['aiProviders'],
                  },
                })
              }
              title="选择解析模型"
            />
          </View>
        </View>

        {/* 文章解析设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>文章解析</Text>
          
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.colors.text }]}>解析模型</Text>
            <ModalSelector
              options={providerOptions}
              selectedValue={tempSettings.analysis.articleAnalysisProvider}
              onValueChange={(value: string) =>
                setTempSettings({
                  ...tempSettings,
                  analysis: {
                    ...tempSettings.analysis,
                    articleAnalysisProvider: value as keyof Settings['aiProviders'],
                  },
                })
              }
              title="选择解析模型"
            />
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>保存设置</Text>
        </TouchableOpacity>
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
