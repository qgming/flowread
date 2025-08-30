import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../utils/settingsStorage';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AISettings' | 'DeepLXSettings' | 'TranslationSettings' | 'AnalysisSettings' | 'About'>

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const themeOptions = [
    { label: '跟随系统', value: 'system' },
    { label: '浅色模式', value: 'light' },
    { label: '深色模式', value: 'dark' },
  ];

  const handleThemeChange = (value: string) => {
    setThemeMode(value as ThemeMode);
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

  const navigateToAbout = () => {
    navigation.navigate('About');
  };

  const navigateToSpeechSettings = () => {
    navigation.navigate('SpeechSettings' as any);
  };

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'system':
        return '跟随系统';
      case 'light':
        return '浅色模式';
      case 'dark':
        return '深色模式';
      default:
        return '跟随系统';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* 基础设置 */}
        <View style={[styles.section, { borderBottomColor: theme.colors.divider }]}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setShowThemeModal(true)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="moon-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>主题模式</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                  {getThemeLabel(themeMode)}
                </Text>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>

        {/* 翻译与解析 */}
       <View style={[styles.section, { borderBottomColor: theme.colors.divider }]}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToTranslationSettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="language-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>翻译偏好</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToAnalysisSettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="search-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>解析服务</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToSpeechSettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="volume-high-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>朗读设置</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>

        {/* AI与翻译服务 */}
    <View style={[styles.section, { borderBottomColor: theme.colors.divider }]}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToAISettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="hardware-chip-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>AI设置</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToDeepLXSettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="settings-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>DeepL设置</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>

        {/* 关于应用 */}
        <View style={[styles.section, { borderBottomColor: theme.colors.divider }]}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToAbout}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>关于我们</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>

        {showThemeModal && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>选择主题模式</Text>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.colors.divider },
                    themeMode === option.value && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                  onPress={() => {
                    handleThemeChange(option.value);
                    setShowThemeModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  {themeMode === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.primary }]}>
                  取消
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    marginRight: 8,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 10,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: {
    fontSize: 17,
  },
  modalCancel: {
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
