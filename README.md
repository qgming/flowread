# ⚡️ 流畅阅读（FlowRead）

一个基于 React Native + Expo 开发的优雅的移动端阅读学习应用，支持 TXT 导入、AI 翻译、单词分析和标签管理。

## 核心功能

### 📖 阅读管理

- **TXT 文件导入**：支持从设备导入 TXT 格式文本文件
- **文本粘贴导入**：直接粘贴文本内容创建文章
- **文章管理**：标题搜索、标签筛选、编辑和删除
- **标签系统**：多标签分类管理，支持标签组合筛选

### 🌐 AI 智能服务

- **多 AI 提供商支持**：FlowAI（内置，无需配置）、DeepSeek、硅基流动等
- **智能段落翻译**：支持多种翻译引擎（DeepLX、DeepSeek、硅基流动、智谱 AI）
- **单词智能分析**：AI 驱动的单词释义和用法分析
- **文章智能分析**：AI 辅助的文章理解和总结

### 🎨 个性化体验

- **主题系统**：支持浅色/深色主题切换
- **沉浸式阅读**：专注的阅读界面设计

### 🔧 高级功能

- **单词记忆模式**：（开发中）专门的词汇学习功能
- **设置同步**：本地存储用户偏好设置

## 技术栈

### 核心技术

- **前端框架**：React Native 0.79.5 + Expo 53.0.22
- **状态管理**：React Context + useState
- **数据存储**：SQLite (expo-sqlite) + AsyncStorage
- **导航**：React Navigation 7.x

### AI 服务集成

- **翻译引擎**：DeepLX、DeepSeek API、硅基流动、智谱 AI
- **AI 模型**：支持多种大语言模型（GLM-4.5、Qwen3、DeepSeek-chat 等）
- **流式响应**：支持 Server-Sent Events 实时响应

### UI/UX

- **组件库**：React Native Elements + 自定义组件
- **图标系统**：@expo/vector-icons (Ionicons)
- **主题系统**：动态主题切换

### 开发工具

- **构建工具**：EAS Build
- **类型系统**：TypeScript 5.8.3
- **代码质量**：ESLint + Prettier

## 安装与运行

### 环境要求

- Node.js 18.x 或更高版本
- Expo CLI
- Android Studio / Xcode（模拟器）

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/qgming/flowread.git
cd flowread

# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行 Android
npm run android

# 运行 iOS
npm run ios
```

### 构建发布

```bash
# 构建 Android APK
eas build -p android

# 构建 iOS 应用
eas build -p ios
```

## 更新日志

### v1.0.0 (2025-08-30)

- 📖 优化部分 UI，提供专注阅读体验
- ⭐ 阅读时高亮显示收藏的单词
- ⚡ 支持流式 AI 分析，实时响应更流畅
- ℹ️ 新增关于页面，展示应用信息
- 📢 新增朗读设置及单词自动朗读功能

### v1.0.0 (2025-08-29)

- ✨ 新增 AI 单词分析功能
- 🎯 支持多 AI 提供商配置（DeepSeek、硅基流动、智谱 AI）
- 🌐 增强翻译功能，支持多种翻译引擎
- 🌗 新增深色/浅色主题切换功能
- 🔍 标题搜索和标签筛选功能
- ⚙️ 丰富的设置选项和配置管理
- 📱 优化的移动端体验

### v1.0.0 (2025-08-27)

- ✨ 初始版本发布
- 📖 TXT 文件导入功能
- 🌐 AI 翻译集成（基础版）
- 🏷️ 标签管理系统
- 📚 基础阅读功能

## 开发路线图

### 长期规划

- 🤖 模型供应商自定义
- 🧠 单词记忆模式（间隔重复学习）
- 📊 阅读统计和分析
- 🔖 笔记功能
- 🌐 云同步功能
- �📚 更多文件格式支持（PDF、EPUB）
- 🤖 个性化 AI 学习助手
- 🎯 学习计划和目标跟踪
- 🌟 成就系统

---

让阅读更流畅，让知识无国界
