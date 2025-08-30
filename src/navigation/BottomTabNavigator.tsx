import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ReadingScreen from '../screens/ReadingScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';
import database from '../database/database';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { theme } = useTheme();
  const [favoriteCount, setFavoriteCount] = useState(0);

  // 加载收藏单词数量
  useEffect(() => {
    const loadFavoriteCount = async () => {
      try {
        const words = await database.getFavoriteWords();
        setFavoriteCount(words.length);
      } catch (error) {
        console.error('加载收藏数量失败:', error);
      }
    };

    loadFavoriteCount();
    
    // 设置定时器定期更新数量
    const interval = setInterval(loadFavoriteCount, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0.5,
          borderTopColor: theme.colors.border,
          height: 83,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: theme.colors.textSecondary,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowRadius: 0,
          height: 80,
        },
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: '900',
          color: theme.colors.text,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === '阅读') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === '单词') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === '设置') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="阅读" 
        component={ReadingScreen}
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Image 
                source={require('../../assets/images/splash-icon.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
                流畅阅读
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="单词" 
        component={FavoritesScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              {/* <Image 
                source={require('../../assets/images/flow-small.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              /> */}
              <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
                单词
              </Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.countButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.countText, { color: theme.colors.onPrimary }]}>
                  {favoriteCount}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  // 触发 FavoritesScreen 中的底部操作表
                  navigation.setParams({ showBottomSheet: true });
                }}
              >
                <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Tab.Screen 
        name="设置" 
        component={SettingsScreen}
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              {/* <Image 
                source={require('../../assets/images/flow-small.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              /> */}
              <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
                设置
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 12,
    padding: 4,
  },
  countButton: {
    width: 30,
    height: 30,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 1,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 2,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
