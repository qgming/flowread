import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import ArticleReaderScreen from '../screens/ArticleReaderScreen';
import AISettingsScreen from '../screens/AISettingsScreen';
import AIProviderConfigScreen from '../screens/AIProviderConfigScreen';
import DeepLXSettingsScreen from '../screens/DeepLXSettingsScreen';
import TranslationSettingsScreen from '../screens/TranslationSettingsScreen';
import { Article } from '../database/database';

export type RootStackParamList = {
  Main: undefined;
  ArticleReader: { article: Article };
  AISettings: undefined;
  AIProviderConfig: { provider: 'deepseek' | 'siliconflow' | 'zhipu' };
  DeepLXSettings: undefined;
  TranslationSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#007AFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={BottomTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ArticleReader" 
          component={ArticleReaderScreen as any}
          options={{
            headerTitle: '',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AISettings" 
          component={AISettingsScreen}
          options={{
            headerTitle: 'AI设置',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AIProviderConfig" 
          component={AIProviderConfigScreen}
          options={{
            headerTitle: 'AI提供商配置',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="DeepLXSettings" 
          component={DeepLXSettingsScreen}
          options={{
            headerTitle: 'DeepLX设置',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="TranslationSettings" 
          component={TranslationSettingsScreen}
          options={{
            headerTitle: '翻译服务设置',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
