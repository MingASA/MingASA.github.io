---
title: "Claude Code 与 OpenCode：终端里的 AI 编程搭档"
date: 2026-03-29 07:00:00 +0800
categories: [AI, 编程工具]
tags: [claude-code, opencode, terminal, ai-coding, cli]
---

> **你可以跳过这篇文章，如果你：** 已经熟练使用 Claude Code 或 OpenCode，且了解它们的区别和适用场景。
>
> **这篇文章在讲什么：** Claude Code 和 OpenCode 的功能、配置、使用技巧和对比。
>
> **看完你能做到：** 在终端中高效使用 AI 编程工具；根据场景选择合适的工具。

---

## 一、Claude Code

### 1.1 安装与配置

```bash
# 安装
npm install -g @anthropic-ai/claude-code

# 首次使用（需要 Anthropic API Key）
export ANTHROPIC_API_KEY="sk-ant-xxx"
claude

# 或者使用 OAuth 登录
claude login
```

### 1.2 核心用法

```bash
# 交互模式（默认）
claude                           # 启动交互式会话
claude -c                        # 继续上次会话

# 非交互模式（脚本/CI 用）
claude -p "解释这个函数的功能"      # 打印模式
claude -p "修复所有 lint 错误"     # 自动修复

# 指定模型
claude --model claude-sonnet-4-6   # 使用特定模型

# 附加上下文
claude -p "重构这段代码" -- src/   # 将 src/ 作为上下文
```

### 1.3 实战示例

```bash
# ===== 场景 1：代码审查 =====
cd my-project
claude -p "审查最近 3 次 commit 的代码变更，找出潜在问题"

# ===== 场景 2：自动修复 =====
claude -p "修复所有 TypeScript 类型错误，不要改其他代码"

# ===== 场景 3：生成测试 =====
claude -p "为 src/utils/ 目录下的所有函数生成单元测试"

# ===== 场景 4：文档生成 =====
claude -p "为这个项目生成 README.md，包含安装、使用、API 文档"

# ===== 场景 5：重构 =====
claude -p "将 src/api/v1/ 的代码重构为 v2，使用新的错误处理模式"
```

### 1.4 System Prompt 配置

```bash
# 项目级别的 CLAUDE.md
cat > CLAUDE.md << 'EOF'
# 项目规范

## 代码风格
- 使用 TypeScript 严格模式
- 函数使用 camelCase
- 组件使用 PascalCase
- 禁止使用 any

## 测试要求
- 所有公共函数必须有单元测试
- 测试覆盖率不低于 80%
- 使用 Jest + Testing Library

## Git 规范
- commit message 使用 Conventional Commits
- 每个 PR 必须有至少一个 reviewer
EOF
```

### 1.5 MCP 工具集成

```json
// ~/.claude/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://localhost/mydb" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  }
}
```

---

## 二、OpenCode

### 2.1 安装与配置

```bash
# 安装
npm install -g opencode-ai

# 查看可用模型
opencode models

# 配置提供商
opencode providers list

# 运行（交互模式）
opencode

# 运行（非交互模式）
opencode run -m "opencode/mimo-v2-pro-free" "解释这段代码"
```

### 2.2 核心特色：多 Agent 模式

```bash
# OpenCode 内置了多种 Agent 模式

# Plan 模式：只读，只出方案不改代码
opencode run --agent plan "分析项目架构并给出重构建议"

# Build 模式：全权限执行
opencode run --agent build "实现用户认证模块"

# Explore 模式：探索子任务
opencode run --agent explore "这个项目用了哪些依赖？"

# Summary 模式：生成摘要
opencode run --agent summary "总结最近的代码变更"

# Title 模式：生成标题
opencode run --agent title "给这个会话取个标题"
```

### 2.3 免费模型使用

```bash
# OpenCode Zen 提供免费模型
opencode run -m "opencode/mimo-v2-pro-free" "写一个 Python 爬虫"
opencode run -m "opencode/mimo-v2-flash-free" "解释这行代码"
opencode run -m "opencode/deepseek-v3-free" "优化这个算法"

# 通过 OpenRouter 使用更多模型
opencode run -m "openrouter/deepseek/deepseek-chat-v3-0324" "..."
```

### 2.4 MCP 工具集成

```bash
# 添加 MCP Server
opencode mcp add github -- npx -y @modelcontextprotocol/server-github
opencode mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /home/user

# 查看已配置的 MCP
opencode mcp list
```

### 2.5 服务模式

```bash
# 启动后台服务（供 API 调用）
opencode serve --port 4096

# Web 界面
opencode web

# 连接到远程服务
opencode attach http://server:4096
```

---

## 三、对比与选择

```python
COMPARISON = {
    "": ["Claude Code", "OpenCode"],
    "厂商": ["Anthropic", "OpenCode (独立)"],
    "开源": ["否 (但 CLI 免费)", "是"],
    "默认模型": ["Claude 系列", "多模型可选"],
    "免费使用": ["需要 API Key", "有免费模型"],
    "Plan 模式": ["无（自动规划）", "内置 plan agent"],
    "Agent 系统": ["单一", "多 agent (plan/build/explore)"],
    "MCP 支持": ["✅", "✅"],
    "ACP 支持": ["✅", "✅"],
    "非交互模式": ["claude -p", "opencode run"],
    "Web 界面": ["无", "有 (opencode web)"],
    "代码理解": ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐"],
    "代码生成": ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐"],
    "中文支持": ["⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
}
```

### 选择建议

```python
def choose_tool(scenario):
    if scenario == "需要最强代码能力":
        return "Claude Code + Claude Opus"
    elif scenario == "免费开始、快速上手":
        return "OpenCode + MiMo V2 Pro Free"
    elif scenario == "需要 plan 模式先审后做":
        return "OpenCode (plan → build 工作流)"
    elif scenario == "CI/CD 自动化":
        return "Claude Code -p 或 OpenCode run"
    elif scenario == "搭配 OpenClaw 使用":
        return "两者都可以通过 ACP 集成"
```

---

## 四、实战工作流

### 4.1 Plan → Review → Build

```bash
# Step 1: 用 OpenCode plan 出方案（免费）
opencode run --agent plan -m "opencode/mimo-v2-pro-free" \
  "分析这个项目的认证模块，给出重构方案"

# Step 2: 人工审查方案

# Step 3: 用 Claude Code 执行（能力强）
claude -p "按照以下方案重构认证模块：[方案内容]"
```

### 4.2 日常开发

```bash
# 开始开发
cd my-project
claude  # 进入交互模式

# 对话示例：
# > 查看项目结构
# > 这个 bug 是什么原因？
# > 帮我写修复代码
# > 跑一下测试看看
# > 好的，提交代码
```

---

## 参考资料

- [Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code) — Anthropic 官方文档
- [OpenCode GitHub](https://github.com/opencode-ai/opencode) — OpenCode 源代码
- [OpenCode 文档](https://docs.opencode.ai/) — OpenCode 官方文档
- [MCP 协议](https://modelcontextprotocol.io/) — Model Context Protocol
- [Claude Code 最佳实践](https://docs.anthropic.com/en/docs/claude-code/best-practices) — 使用技巧
