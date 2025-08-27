# ⚡️ 流畅阅读 (FlowRead)

一个优雅的移动端阅读应用，专为沉浸式阅读学习而设计。支持 TXT 文件导入、AI 智能翻译、标签管理等功能，让您的阅读更加流畅高效。

## ✨ 主要特性

### 📖 文章管理

- **多种导入方式**：支持 TXT 文件导入和文本粘贴
- **标签系统**：为文章添加自定义标签，便于分类管理
- **智能筛选**：按标签快速筛选文章
- **本地存储**：使用 SQLite 数据库，数据安全可靠

### 🌐 AI 智能翻译

- **段落级翻译**：支持逐段精准翻译
- **多语言支持**：集成多种 AI 翻译服务
- **翻译缓存**：翻译结果本地保存，避免重复请求
- **双语显示**：原文译文可切换显示

### 📱 优化阅读体验

- **沉浸式界面**：简洁优雅的设计风格
- **字体优化**：舒适的阅读字体和间距
- **手势操作**：直观的手势交互
- **夜间模式**：保护视力的阅读模式

### 🔧 个性化设置

- **翻译服务配置**：支持多种 AI 翻译 API
- **目标语言设置**：自定义翻译目标语言
- **阅读偏好**：个性化阅读设置

## 🏗️ 项目结构

```
flowread/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── ArticleCard.tsx     # 文章卡片组件
│   │   └── BottomActionSheet.tsx # 底部操作面板
│   ├── screens/            # 应用页面
│   │   ├── ReadingScreen.tsx   # 主阅读页面
│   │   ├── ArticleReaderScreen.tsx # 文章阅读器
│   │   ├── SettingsScreen.tsx  # 设置页面
│   │   └── AISettingsScreen.tsx # AI配置页面
│   ├── services/           # 业务逻辑服务
│   │   ├── translation.ts      # 翻译服务
│   │   └── enhancedTranslation.ts # 增强翻译服务
│   ├── database/           # 数据库相关
│   │   └── database.ts         # SQLite数据库操作
│   ├── navigation/         # 导航配置
│   │   ├── RootNavigator.tsx   # 根导航器
│   │   └── BottomTabNavigator.tsx # 底部标签导航
│   └── utils/              # 工具函数
│       └── settingsStorage.ts  # 设置存储
├── assets/                 # 静态资源
├── .github/workflows/      # GitHub Actions
├── app.json               # Expo配置文件
├── eas.json               # EAS构建配置
└── package.json           # 项目依赖
```

## 👥 作者

- **qgming** - 初始工作 - [qgming](https://github.com/qgming)

## 🙏 致谢

- [Expo](https://expo.dev) - 优秀的 React Native 开发平台
- [React Native](https://reactnative.dev) - 跨平台开发框架
- 所有为开源社区贡献的开发者们

---

**让阅读更流畅，让知识更通达** ✨
