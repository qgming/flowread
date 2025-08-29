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
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, saveSettings, TranslationSettings } from '../utils/settingsStorage';
import { SUPPORTED_LANGUAGES } from '../services/translation';

type TranslationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TranslationSettingsScreen() {
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
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const languageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    label: `${info.name} (${info.nativeName})`,
    value: code,
  }));

  const engineOptions = [
    { label: 'DeepLX', value: 'deeplx' },
    { label: 'FlowAI', value: 'flowai' },
    { label: 'DeepSeek', value: 'deepseek' },
    { label: '硅基流动', value: 'siliconflow' },
    { label: '智谱AI', value: 'zhipu' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 目标语言设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>目标语言</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tempSettings.targetLanguage}
              onValueChange={(value: string) =>
                setTempSettings({ ...tempSettings, targetLanguage: value })
              }
              style={styles.picker}
            >
              {languageOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* 翻译引擎设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>翻译引擎</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tempSettings.translationEngine}
              onValueChange={(value: string) =>
                setTempSettings({
                  ...tempSettings,
                  translationEngine: value as TranslationSettings['translationEngine'],
                })
              }
              style={styles.picker}
            >
              {engineOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* 翻译提示词设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>翻译提示词</Text>
          <Text style={styles.sectionDescription}>
            使用 {'{targetLanguage}'} 和 {'{text}'} 作为占位符
          </Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={tempSettings.translationPrompt}
            onChangeText={(text: string) =>
              setTempSettings({ ...tempSettings, translationPrompt: text })
            }
            placeholder="请输入翻译提示词..."
            textAlignVertical="top"
          />
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存设置</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 200,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
