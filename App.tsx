import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import database from './src/database/database';
import { ecdictService } from './src/services/ecdictService';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 并行初始化所有数据库
        await Promise.all([
          database.init(),
          ecdictService.init()
        ]);
        
        // 可以在这里添加其他初始化任务
        // 如：加载字体、获取用户设置等
        
        // 模拟额外加载时间，确保启动画面显示足够长
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        console.warn('应用初始化失败:', e);
      } finally {
        // 告诉应用已经准备好
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // 应用准备好后，隐藏启动画面
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
