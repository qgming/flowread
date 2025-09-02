import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, saveSettings, TranslationSettings } from '../utils/settingsStorage';
import { SUPPORTED_LANGUAGES } from '../services/translation/types';
import { useTheme } from '../theme/ThemeContext';
import ModalSelector from '../components/ModalSelector';

type TranslationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TranslationSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<TranslationSettings | null>(null);
  const [tempSettings, setTempSettings] = useState<TranslationSettings | null>(null);
  const navigation = useNavigation<TranslationSettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings.translation);
      setTempSettings(loadedSettings.translation);
    });
  }, []);

  const handleSave = async () => {
    if (!tempSettings) return;

    try {
      const currentSettings = await loadSettings();
      const newSettings = {
        ...currentSettings,
        translation: tempSettings,
      };
      await saveSettings(newSettings);
      setSettings(tempSettings);
      Alert.alert('保存成功', '翻译设置已保存');
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

  const languageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    label: `${info.name} (${info.nativeName})`,
    value: code,
  }));

  const engineOptions = [
    { label: 'Bing翻译', value: 'bing' },
    { label: '谷歌翻译', value: 'google' },
    { label: 'FlowGlm（免费）', value: 'flowglm' },
    { label: 'FlowQwen（免费）', value: 'flowqwen' },
    { label: 'DeepSeek', value: 'deepseek' },
    { label: '硅基流动', value: 'siliconflow' },
    { label: '智谱AI', value: 'zhipu' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* 目标语言设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>目标语言</Text>
          <ModalSelector
            options={languageOptions}
            selectedValue={tempSettings.targetLanguage}
            onValueChange={(value: string) =>
              setTempSettings({ ...tempSettings, targetLanguage: value })
            }
            title="选择目标语言"
          />
        </View>

        {/* 翻译引擎设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>翻译引擎</Text>
          <ModalSelector
            options={engineOptions}
            selectedValue={tempSettings.translationEngine}
            onValueChange={(value: string) =>
              setTempSettings({
                ...tempSettings,
                translationEngine: value as TranslationSettings['translationEngine'],
              })
            }
            title="选择翻译引擎"
          />
        </View>

        {/* 翻译提示词设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>翻译提示词</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            使用 {'{targetLanguage}'} 和 {'{text}'} 作为占位符
          </Text>
          <TextInput
            style={[styles.textInput, { 
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceVariant
            }]}
            multiline
            numberOfLines={4}
            value={tempSettings.translationPrompt}
            onChangeText={(text: string) =>
              setTempSettings({ ...tempSettings, translationPrompt: text })
            }
            placeholder="请输入翻译提示词..."
            placeholderTextColor={theme.colors.textTertiary}
            textAlignVertical="top"
          />
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
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
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
