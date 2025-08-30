import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: theme.colors.text }]}>流畅阅读</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>版本 1.0.0</Text>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: theme.colors.divider }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>关于应用</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          流畅阅读是一款专为英语学习者设计的智能阅读应用。我们致力于通过AI技术，
          让英语阅读变得更加轻松和高效。无论是新闻、文章还是学习材料，流畅阅读都能
          为您提供智能翻译、词汇分析和个性化学习体验。
        </Text>
      </View>

      <View style={[styles.section, { borderTopColor: theme.colors.divider }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>核心功能</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              AI智能翻译与解析
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              沉浸式阅读体验
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              生词本与词汇记忆
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="color-palette-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              个性化主题设置
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: theme.colors.divider }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>开发者信息</Text>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>开发团队</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
            QGMING
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>联系邮箱</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
            qgming@qq.com
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>官方网站</Text>
          <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
            www.qgming.com
          </Text>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: theme.colors.divider }]}>
        <Text style={[styles.copyright, { color: theme.colors.textSecondary }]}>
          © 2025 QGMING. 保留所有权利。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  copyright: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
