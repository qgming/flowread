# ⚡️ 流畅阅读（FlowRead）

一个基于 React Native + Expo 开发的优雅的移动端阅读学习应用，支持 TXT 导入、AI 翻译和标签管理。

## 核心功能

- 📖 TXT 文件导入与文本粘贴
- 🌐 AI 智能段落翻译
- 🏷️ 标签分类管理
- 📱 沉浸式阅读体验

## 技术栈

- **前端框架**: React Native + Expo
- **状态管理**: React Context + useState
- **数据存储**: SQLite (expo-sqlite)
- **AI 翻译**: 支持 OpenAI、DeepLX、Gemini 等多种 AI 服务
- **UI 组件**: React Native Elements + 自定义组件
- **导航**: React Navigation
- **构建工具**: EAS Build

## 项目结构

```
flowread/
├── src/
│   ├── components/          # 可复用组件
│   ├── screens/            # 页面组件
│   ├── navigation/         # 导航配置
│   ├── services/           # API 服务
│   ├── database/           # 数据库操作
│   └── utils/              # 工具函数
├── assets/                 # 静态资源
├── app.json               # Expo 配置文件
└── eas.json              # EAS 构建配置
```

## 更新日志

### v1.0.0 (2025-08-27)

- ✨ 初始版本发布
- 📖 TXT 文件导入功能
- 🌐 AI 翻译集成
- 🏷️ 标签管理系统
- 📱 基础阅读功能

---

让阅读更流畅，让知识无国界
