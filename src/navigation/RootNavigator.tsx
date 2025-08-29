import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import BottomTabNavigator from './BottomTabNavigator';
import ArticleReaderScreen from '../screens/ArticleReaderScreen';
import AISettingsScreen from '../screens/AISettingsScreen';
import AIProviderConfigScreen from '../screens/AIProviderConfigScreen';
import DeepLXSettingsScreen from '../screens/DeepLXSettingsScreen';
import TranslationSettingsScreen from '../screens/TranslationSettingsScreen';
import AnalysisSettingsScreen from '../screens/AnalysisSettingsScreen';
import ImmersiveReadingScreen from '../screens/ImmersiveReadingScreen';
import WordMemoryScreen from '../screens/WordMemoryScreen';
import AboutScreen from '../screens/AboutScreen';
import { Article } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

export type RootStackParamList = {
  Main: undefined;
  ArticleReader: { article: Article };
  AISettings: undefined;
  AIProviderConfig: { provider: 'deepseek' | 'siliconflow' | 'zhipu' };
  DeepLXSettings: undefined;
  TranslationSettings: undefined;
  AnalysisSettings: undefined;
  ImmersiveReading: undefined;
  WordMemory: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: theme.colors.text,
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
            headerTitle: () => (
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25 
              }}>AI设置</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AIProviderConfig" 
          component={AIProviderConfigScreen}
          options={{
            headerTitle: () => (
              <Text style={{ 
                 fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25
              }}>提供商配置</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="DeepLXSettings" 
          component={DeepLXSettingsScreen}
          options={{
            headerTitle: () => (
              <Text style={{ 
                 fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25
              }}>DeepL设置</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="TranslationSettings" 
          component={TranslationSettingsScreen}
          options={{
            headerTitle: () => (
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25 
              }}>翻译偏好</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AnalysisSettings" 
          component={AnalysisSettingsScreen}
          options={{
            headerTitle: () => (
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25 
              }}>解析服务</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="ImmersiveReading" 
          component={ImmersiveReadingScreen as any}
          options={{
            headerTitle: '',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="WordMemory" 
          component={WordMemoryScreen as any}
          options={{
            headerTitle: '',
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{
            headerTitle: () => (
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: theme.colors.primary,
                marginLeft: -25 
              }}>关于我们</Text>
            ),
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
