import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadSettings, Settings } from '../utils/settingsStorage';

type AISettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProviderCard {
  key: keyof Settings['aiProviders'];
  name: string;
  description: string;
  isEnabled: boolean;
}

export default function AISettingsScreen() {
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

  const handleProviderPress = (provider: keyof Settings['aiProviders']) => {
    navigation.navigate('AIProviderConfig', { provider });
  };

  if (!settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>    
        <View style={styles.providersContainer}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.key}
              style={[styles.providerCard, provider.isEnabled && styles.providerCardEnabled]}
              onPress={() => handleProviderPress(provider.key)}
            >
              <View style={styles.providerHeader}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {provider.isEnabled && (
                  <View style={styles.enabledBadge}>
                    <Text style={styles.enabledText}>已启用</Text>
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
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 16,
  },
  providersContainer: {
    gap: 16,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  providerCardEnabled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  enabledBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enabledText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});
