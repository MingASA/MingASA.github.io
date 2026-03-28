---
title: "OpenAI Codex：云端自主编程 Agent"
date: 2026-03-29 08:00:00 +0800
categories: [AI, 编程工具]
tags: [codex, openai, agent, autonomous-coding, cli]
---

> **你可以跳过这篇文章，如果你：** 已经使用过 Codex CLI 或 Codex Cloud，了解它的能力边界。
>
> **这篇文章在讲什么：** OpenAI Codex 的两种形态（CLI 和 Cloud）、配置方法、使用技巧。
>
> **看完你能做到：** 配置和使用 Codex CLI；理解 Codex 与其他编程 Agent 的差异。

---

## 一、Codex 是什么

OpenAI Codex 是 OpenAI 推出的**自主编程 Agent**。它不只是补全代码或回答问题，而是能**独立理解任务、制定计划、编写代码、运行测试**。

### 两种形态

```python
CODEX_FORMS = {
    "Codex CLI": {
        "形态": "本地命令行工具",
        "运行环境": "你的电脑",
        "适合": "本地开发、快速任务",
        "安装": "npm install -g @openai/codex",
    },
    "Codex Cloud": {
        "形态": "云端服务（ChatGPT 内）",
        "运行环境": "OpenAI 的沙箱",
        "适合": "GitHub Issue 修复、PR 审查",
        "访问": "chatgpt.com/codex",
    }
}
```

---

## 二、Codex CLI 配置

### 2.1 安装

```bash
# 安装
npm install -g @openai/codex

# 验证
codex --version

# 使用 OpenAI 官方 API
export OPENAI_API_KEY="sk-xxx"

# 或使用中转站
# 创建 ~/.codex/config.toml
```

### 2.2 配置文件

```toml
# ~/.codex/config.toml
model_provider = "apigate"
model = "gpt-5.2-codex"
model_reasoning_effort = "high"
network_access = "enabled"
disable_response_storage = true

[model_providers.apigate]
name = "apigate"
base_url = "https://your-proxy.com/v1"
wire_api = "responses"
requires_openai_auth = true
```

```json
// ~/.codex/auth.json
{
  "OPENAI_API_KEY": "sk-xxx"
}
```

### 2.3 验证配置

```bash
# 测试连通性
codex exec --skip-git-repo-check "Reply with exactly: OK"
# 应该输出: OK
```

---

## 三、Codex CLI 使用

### 3.1 核心命令

```bash
# 交互模式
codex                           # 启动交互式 TUI
codex "帮我实现用户认证"          # 带初始 prompt 的交互模式

# 非交互模式（自动化用）
codex exec "修复所有 lint 错误"   # 执行任务并退出

# 代码审查
codex review                    # 审查当前分支的变更

# 恢复会话
codex resume                    # 继续上次的会话
codex resume --last             # 直接恢复最近会话
```

### 3.2 沙箱模式

```bash
# 只读模式（安全，只允许读文件）
codex exec --sandbox read-only "分析这个项目的架构"

# 工作区写入（允许改项目文件，不允许执行危险命令）
codex exec --sandbox workspace-write "重构这个模块"

# 完全访问（危险，服务器环境用）
codex exec --sandbox danger-full-access "修复并测试"

# 跳过所有确认（极度危险，仅限沙箱环境）
codex exec --dangerously-bypass-approvals-and-sandbox "..."
```

### 3.3 实战示例

```bash
# ===== 场景 1：实现功能 =====
codex exec -C ~/my-project --skip-git-repo-check \
  "实现一个 REST API 用户注册接口，使用 Express + TypeScript + Prisma"

# ===== 场景 2：修复 Bug =====
codex exec --skip-git-repo-check \
  "修复 npm test 报出的所有失败测试"

# ===== 场景 3：代码审查 =====
codex review

# ===== 场景 4：生成文档 =====
codex exec --skip-git-repo-check \
  "为这个项目生成完整的 API 文档，输出为 markdown"

# ===== 场景 5：数据处理 =====
codex exec --skip-git-repo-check \
  "写一个脚本：读取 data.csv，清洗数据，输出统计报告"
```

### 3.4 高级配置

```toml
# ~/.codex/config.toml — 完整配置
model_provider = "openai"
model = "gpt-5.2-codex"
model_reasoning_effort = "high"
network_access = "enabled"

# 自定义 shell 环境策略
[shell_environment_policy]
inherit = "all"  # 继承所有环境变量

# 自定义沙箱权限
sandbox_permissions = [
    "disk-full-read-access",  # 完整磁盘读取
]
```

---

## 四、Codex vs 其他工具

```python
CODEX_COMPARISON = {
    "特性": ["Codex CLI", "Claude Code", "OpenCode"],
    "厂商": ["OpenAI", "Anthropic", "独立开源"],
    "核心模型": ["GPT-5.2-codex", "Claude Sonnet/Opus", "多模型可选"],
    "自主程度": ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐"],
    "Plan 模式": ["无（全自主）", "无", "内置"],
    "沙箱支持": ["✅ 内置", "❌", "❌"],
    "代码审查": ["✅ codex review", "❌", "❌"],
    "会话恢复": ["✅", "✅", "✅"],
    "MCP 支持": ["✅", "✅", "✅"],
    "ACP 集成": ["✅", "✅", "✅"],
    "价格": ["按 token 计费", "按 token 计费", "有免费模型"],
}
```

### 选择建议

```python
def choose_coding_agent(task):
    if task == "自主完成明确的编程任务":
        return "Codex（最自主，设好目标就放手）"
    elif task == "需要精确控制每一步":
        return "Claude Code（交互式，可控性强）"
    elif task == "先规划后执行":
        return "OpenCode（plan → build 工作流）"
    elif task == "成本敏感":
        return "OpenCode + 免费模型"
    elif task == "CI/CD 集成":
        return "Codex exec 或 Claude Code -p"
```

---

## 五、通过 OpenClaw ACP 调用 Codex

```bash
# 配置好后，从飞书直接让 AI 用 Codex 编程
# 你在飞书说："帮我用 Codex 修复这个 bug"
# OpenClaw → ACP → Codex → 执行 → 返回结果

# 也可以通过 /acp 命令
/acp spawn codex --mode persistent
```

---

## 参考资料

- [OpenAI Codex 官方文档](https://platform.openai.com/docs/guides/codex) — 官方文档
- [Codex CLI GitHub](https://github.com/openai/codex) — CLI 源代码
- [Codex Best Practices](https://platform.openai.com/docs/guides/codex/codex-best-practices) — 最佳实践
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference) — API 参考
