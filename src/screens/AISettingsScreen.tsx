import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, Settings } from '../utils/settingsStorage';
import { useTheme } from '../theme/ThemeContext';

type AISettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProviderCard {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export default function AISettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const navigation = useNavigation<AISettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const providers: ProviderCard[] = settings ? [
    {
      key: 'deepseek',
      name: settings.aiProviders.deepseek.name,
      description: settings.aiProviders.deepseek.description,
      isEnabled: settings.aiProviders.deepseek.isEnabled,
    },
    {
      key: 'siliconflow',
      name: settings.aiProviders.siliconflow.name,
      description: settings.aiProviders.siliconflow.description,
      isEnabled: settings.aiProviders.siliconflow.isEnabled,
    },
    {
      key: 'zhipu',
      name: settings.aiProviders.zhipu.name,
      description: settings.aiProviders.zhipu.description,
      isEnabled: settings.aiProviders.zhipu.isEnabled,
    },
  ] : [];

  const handleProviderPress = (provider: string) => {
    navigation.navigate('AIProviderConfig', { provider: provider as any });
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>    
        <View style={styles.providersContainer}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.key}
              style={[
                styles.providerCard,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: provider.isEnabled ? theme.colors.primary : theme.colors.border
                },
                provider.isEnabled && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => handleProviderPress(provider.key)}
            >
              <View style={styles.providerHeader}>
                <Text style={[styles.providerName, { color: theme.colors.text }]}>
                  {provider.name}
                </Text>
                {provider.isEnabled && (
                  <View style={[styles.enabledBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.enabledText, { color: theme.colors.onPrimary }]}>
                      已启用
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
  providersContainer: {
    gap: 16,
  },
  providerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  enabledBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enabledText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
