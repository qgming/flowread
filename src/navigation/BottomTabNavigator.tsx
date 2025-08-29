import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ReadingScreen from '../screens/ReadingScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#C6C6C8',
          height: 83,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#fff',
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
          title: '阅读',
        }}
      />
      <Tab.Screen 
        name="单词" 
        component={FavoritesScreen}
        options={{
          title: '单词',
        }}
      />
      <Tab.Screen 
        name="设置" 
        component={SettingsScreen}
        options={{
          title: '设置',
        }}
      />
    </Tab.Navigator>
  );
}
