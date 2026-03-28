---
title: "OpenClaw：把 AI Agent 接入你的日常通讯"
date: 2026-03-29 06:00:00 +0800
categories: [AI, 工具]
tags: [openclaw, agent, ai-assistant, feishu, discord, telegram]
---

> **你可以跳过这篇文章，如果你：** 已经在用 OpenClaw 或类似的 AI Agent 网关，且配置完善。
>
> **这篇文章在讲什么：** OpenClaw 是什么、它能做什么、怎么从零搭建、进阶用法。
>
> **看完你能做到：** 搭建一个 24 小时在线的 AI 助手，接入飞书/Discord/Telegram 等通讯平台。

---

## 一、OpenClaw 是什么

OpenClaw 是一个 **AI Agent 网关**。它的核心功能是：把大语言模型（LLM）接入各种通讯平台（飞书、Discord、Telegram、WhatsApp 等），让 AI 成为你 24 小时在线的助手。

```
┌─────────────────────────────────────────────┐
│              OpenClaw Gateway                │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Agent    │  │ Session  │  │  Plugin   │  │
│  │ (大脑)    │  │ (记忆)    │  │  (技能)    │  │
│  └────┬─────┘  └──────────┘  └───────────┘  │
│       │                                      │
│  ┌────┴─────────────────────────────────┐   │
│  │         Channel Adapters             │   │
│  │  飞书 │ Discord │ Telegram │ WhatsApp │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**它不是什么：**
- 不是一个新的 LLM（它调用现有的 LLM API）
- 不是一个聊天机器人框架（它是一个完整的 agent 系统）
- 不需要你写代码（配置驱动）

---

## 二、核心能力

### 2.1 多平台通讯

```python
SUPPORTED_CHANNELS = {
    "飞书 (Feishu/Lark)": "企业通讯，支持群聊和私聊",
    "Discord": "社区平台，支持频道和线程",
    "Telegram": "即时通讯，支持群组和话题",
    "WhatsApp": "个人通讯（通过 WhatsApp Web）",
    "Signal": "隐私优先的通讯",
    "Slack": "团队协作",
    "Matrix": "去中心化通讯",
    "iMessage": "Apple 生态",
    "更多": "通过插件系统扩展",
}
```

### 2.2 多模型支持

```python
SUPPORTED_MODELS = {
    "OpenAI": "GPT-4o, GPT-5.2, o1, o3",
    "Anthropic": "Claude Sonnet, Claude Opus",
    "Google": "Gemini Pro, Gemini Flash",
    "小米": "MiMo V2 Pro, MiMo V2 Flash",
    "DeepSeek": "DeepSeek V3, DeepSeek R1",
    "本地模型": "Ollama, vLLM（完全离线）",
    "OpenRouter": "一个 key 用所有模型",
}
```

### 2.3 Agent 能力

```python
AGENT_CAPABILITIES = {
    "工具调用": [
        "执行 shell 命令",
        "读写文件",
        "搜索互联网",
        "获取网页内容",
        "管理日历/邮件",
    ],
    "记忆系统": [
        "短期记忆（会话内）",
        "长期记忆（跨会话，文件持久化）",
        "语义搜索记忆",
    ],
    "子 Agent": [
        "主 Agent 可以派生子 Agent 执行任务",
        "ACP 集成：调用 Codex、Claude Code 等编程 Agent",
    ],
    "自动化": [
        "Heartbeat：定期主动检查",
        "Cron：定时任务",
        "Webhook：外部触发",
    ],
}
```

---

## 三、从零搭建

### 3.1 安装

```bash
# 前置条件：Node.js >= 20
node --version

# 安装 OpenClaw
npm install -g openclaw

# 验证
openclaw --version

# 初始化（交互式向导）
openclaw init

# 启动 Gateway
openclaw gateway start
```

### 3.2 配置模型

```bash
# 设置模型（以 OpenRouter 为例）
openclaw config set models.default "openrouter/anthropic/claude-sonnet-4"

# 设置 API Key
# 方法一：环境变量
export OPENROUTER_API_KEY="your-key"

# 方法二：配置文件
openclaw auth add openrouter --key "your-key"
```

### 3.3 接入通讯平台

```bash
# 以飞书为例
openclaw config set channels.feishu.enabled true
openclaw config set channels.feishu.appId "your-app-id"
openclaw config set channels.feishu.appSecret "your-app-secret"

# 重启 Gateway 生效
openclaw gateway restart
```

### 3.4 配置文件结构

```json5
// ~/.openclaw/openclaw.json
{
  // 默认模型
  models: {
    default: "openrouter/xiaomi/mimo-v2-pro",
    fallback: "openrouter/deepseek/deepseek-chat-v3-0324"
  },
  
  // 通讯渠道
  channels: {
    feishu: {
      enabled: true,
      appId: "cli_xxx",
      appSecret: "xxx"
    }
  },
  
  // 插件
  plugins: {
    entries: {
      // 内存搜索
      "memory-core": { enabled: true },
      // 网络搜索
      "duckduckgo": { enabled: true },
      // ACP 编程 Agent
      "acpx": { enabled: true }
    }
  },
  
  // ACP 配置
  acp: {
    enabled: true,
    allowedAgents: ["codex", "claude", "opencode"]
  }
}
```

---

## 四、进阶用法

### 4.1 自定义 Skills

```bash
# Skills 目录结构
~/.openclaw/workspace/skills/
└── my-skill/
    ├── SKILL.md      # 技能定义
    ├── scripts/      # 辅助脚本
    └── references/   # 参考文档
```

```markdown
# SKILL.md 示例
---
name: deploy-check
description: 部署前检查清单
---

## 触发条件
当用户说"部署"、"发布"、"上线"时触发。

## 检查清单
1. 所有测试是否通过？
2. 是否有未提交的代码？
3. 数据库迁移是否准备好？
4. 环境变量是否配置？
5. 回滚方案是否就绪？
```

### 4.2 Heartbeat 定期检查

```markdown
# HEARTBEAT.md
# OpenClaw 会定期执行这些检查

- 检查 GitHub 通知
- 检查邮箱
- 检查服务器状态
- 检查 CI/CD 流水线
```

### 4.3 ACP 编程 Agent

```bash
# 从飞书直接调用 Codex 帮你编程
# 你在飞书说："帮我修复这个 bug"
# OpenClaw → spawn Codex ACP session → 执行 → 结果返回飞书

# 配置
openclaw config set acp.enabled true
openclaw config set acp.defaultAgent "codex"
```

### 4.4 记忆系统

```markdown
# MEMORY.md — Agent 的长期记忆
## 关于用户
- 用户是北大计算机系学生
- 偏好中文交流
- 技术栈：Python, TypeScript

## 重要决策
- 2026-03-28: 搭建了博客写作工作流
- 2026-03-28: 配置了 Codex + OpenCode ACP 集成

## 经验教训
- 用户对安全问题很敏感
- 先问再做对外操作
```

---

## 五、常见场景

```python
USE_CASES = {
    "个人助手": {
        "场景": "24 小时在线，随时提问",
        "配置": "飞书/Telegram + GPT-4o",
        "能力": "问答、搜索、记忆、日程管理",
    },
    "编程助手": {
        "场景": "通过通讯工具让 AI 写代码",
        "配置": "Discord 线程 + ACP (Codex/Claude Code)",
        "能力": "代码生成、bug 修复、代码审查",
    },
    "团队 Bot": {
        "场景": "团队群里的智能助手",
        "配置": "飞书群 + 自定义 Skills",
        "能力": "回答技术问题、管理知识库",
    },
    "自动化运维": {
        "场景": "服务器监控和自动处理",
        "配置": "Heartbeat + Cron + exec 工具",
        "能力": "检查日志、自动重启服务、发告警",
    },
}
```

---

## 参考资料

- [OpenClaw 官方文档](https://docs.openclaw.ai/) — 完整文档
- [GitHub: openclaw/openclaw](https://github.com/openclaw/openclaw) — 源代码
- [OpenClaw Discord](https://discord.com/invite/clawd) — 社区交流
- [ClawHub](https://clawhub.ai/) — Skills 市场
