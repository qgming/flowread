import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, saveSettings, Settings } from '../utils/settingsStorage';

type AnalysisSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AnalysisSettingsScreen() {
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
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 单词解析设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>单词解析</Text>
          
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>解析模型</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempSettings.analysis.wordAnalysisProvider}
                onValueChange={(value: keyof Settings['aiProviders']) =>
                  setTempSettings({
                    ...tempSettings,
                    analysis: {
                      ...tempSettings.analysis,
                      wordAnalysisProvider: value,
                    },
                  })
                }
                style={styles.picker}
              >
                {providerOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* 文章解析设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>文章解析</Text>
          
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>解析模型</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempSettings.analysis.articleAnalysisProvider}
                onValueChange={(value: keyof Settings['aiProviders']) =>
                  setTempSettings({
                    ...tempSettings,
                    analysis: {
                      ...tempSettings.analysis,
                      articleAnalysisProvider: value,
                    },
                  })
                }
                style={styles.picker}
              >
                {providerOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
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
