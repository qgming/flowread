import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        {/* 基础设置 */}
        <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="moon-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.settingTitle}>深色模式</Text>
              </View>
              <View style={styles.settingRight}>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor={isDarkMode ? '#fff' : '#fff'}
                />
              </View>
            </View>
        </View>

        {/* 翻译与解析 */}
        <View style={styles.section}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToTranslationSettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="language-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.settingTitle}>翻译偏好</Text>
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
                <Text style={styles.settingTitle}>解析服务</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>

        {/* AI与翻译服务 */}
        <View style={styles.section}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={navigateToAISettings}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="hardware-chip-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.settingTitle}>AI设置</Text>
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
                <Text style={styles.settingTitle}>DeepL设置</Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={22} color="#c7c7cc" />
              </View>
            </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
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
    color: '#000',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
