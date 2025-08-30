import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { loadSettings, saveSettings, SpeechSettings } from '../utils/settingsStorage';
import { isTTSAvailable } from '../services/speech';
import ModalSelector from '../components/ModalSelector';

type SpeechSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SpeechSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<SpeechSettings | null>(null);
  const [tempSettings, setTempSettings] = useState<SpeechSettings | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const navigation = useNavigation<SpeechSettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings.speech);
      setTempSettings(loadedSettings.speech);
    });
    
    isTTSAvailable().then(available => {
      setIsAvailable(available);
    });
  }, []);

  const handleSave = async () => {
    if (!tempSettings) return;

    try {
      const currentSettings = await loadSettings();
      const newSettings = {
        ...currentSettings,
        speech: tempSettings,
      };
      await saveSettings(newSettings);
      setSettings(tempSettings);
      Alert.alert('保存成功', '朗读设置已保存');
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

  const languageOptions = [
    { label: '英语 (美式)', value: 'en-US' },
    { label: '英语 (英式)', value: 'en-GB' },
    { label: '中文 (简体)', value: 'zh-CN' },
    { label: '中文 (繁体)', value: 'zh-TW' },
  ];

  const rateOptions = [
    { label: '很慢', value: '0.5' },
    { label: '慢', value: '0.6' },
    { label: '正常', value: '0.7' },
    { label: '快', value: '0.8' },
    { label: '很快', value: '0.9' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {!isAvailable && (
          <View style={[styles.warning, { backgroundColor: theme.colors.error + '1A' }]}>
            <Text style={[styles.warningText, { color: theme.colors.error }]}>
              ⚠️ 系统TTS不可用，请检查设备设置
            </Text>
          </View>
        )}

        {/* 自动朗读设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                自动朗读
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                显示单词详情时自动朗读
              </Text>
            </View>
            <Switch
              value={tempSettings.autoSpeak}
              onValueChange={(value) => setTempSettings({ ...tempSettings, autoSpeak: value })}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
              thumbColor={tempSettings.autoSpeak ? theme.colors.onPrimary : theme.colors.surface}
            />
          </View>
        </View>

        {/* 朗读语言设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>朗读语言</Text>
          <ModalSelector
            options={languageOptions}
            selectedValue={tempSettings.language}
            onValueChange={(value: string) =>
              setTempSettings({ ...tempSettings, language: value })
            }
            title="选择朗读语言"
          />
        </View>

        {/* 朗读速度设置 */}
        <View style={[styles.section, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>朗读速度</Text>
          <ModalSelector
            options={rateOptions}
            selectedValue={tempSettings.rate.toString()}
            onValueChange={(value: string) =>
              setTempSettings({ ...tempSettings, rate: parseFloat(value) })
            }
            title="选择朗读速度"
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
  warning: {
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
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
