import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import BottomTabNavigator from './BottomTabNavigator';
import ArticleReaderScreen from '../screens/ArticleReaderScreen';
import AISettingsScreen from '../screens/AISettingsScreen';
import AIProviderConfigScreen from '../screens/AIProviderConfigScreen';
import TranslationSettingsScreen from '../screens/TranslationSettingsScreen';
import AnalysisSettingsScreen from '../screens/AnalysisSettingsScreen';
import ImmersiveReadingScreen from '../screens/ImmersiveReadingScreen';
import WordMemoryScreen from '../screens/WordMemoryScreen';
import AboutScreen from '../screens/AboutScreen';
import SpeechSettingsScreen from '../screens/SpeechSettingsScreen';
import ShareInputScreen from '../screens/ShareInputScreen';
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
  SpeechSettings: undefined;
  ImmersiveReading: undefined;
  WordMemory: undefined;
  About: undefined;
  ShareInput: { sharedText?: string; sharedFileUri?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const HeaderTitle = ({ title }: { title: string }) => {
  const { theme } = useTheme();
  return (
    <Text style={{ 
      fontSize: 18, 
      fontWeight: '600', 
      color: theme.colors.primary,
      marginLeft: -25 
    }}>
      {title}
    </Text>
  );
};

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
            headerTitle: () => <HeaderTitle title="AI设置" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AIProviderConfig" 
          component={AIProviderConfigScreen}
          options={{
            headerTitle: () => <HeaderTitle title="提供商配置" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="TranslationSettings" 
          component={TranslationSettingsScreen}
          options={{
            headerTitle: () => <HeaderTitle title="翻译偏好" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="AnalysisSettings" 
          component={AnalysisSettingsScreen}
          options={{
            headerTitle: () => <HeaderTitle title="解析服务" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="SpeechSettings" 
          component={SpeechSettingsScreen}
          options={{
            headerTitle: () => <HeaderTitle title="朗读设置" />,
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
            headerTitle: () => <HeaderTitle title="关于我们" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="ShareInput" 
          component={ShareInputScreen}
          options={{
            headerTitle: () => <HeaderTitle title="新增文章" />,
            headerBackTitle: '返回',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
