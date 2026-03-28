---
title: "Vibe Coding 重要概念：LLM、Agent、MCP 与 Skills"
date: 2026-03-29 05:00:00 +0800
categories: [AI, 概念解析]
tags: [llm, agent, mcp, skills, architecture, vibe-coding]
---

> **你可以跳过这篇文章，如果你：** 已经清楚 LLM、Agent、MCP、Skills 各自的定义、区别和协作关系。
>
> **这篇文章在讲什么：** Vibe Coding 生态中的四个核心概念——LLM 是大脑，Agent 是身体，MCP 是手脚，Skills 是经验。
>
> **看完你能做到：** 理解 AI 编程工具的架构层次；选择合适的工具组合；搭建自己的 AI 编程工作流。

---

## 一、概念全景图

```
┌─────────────────────────────────────────────────┐
│                  你（人类）                       │
│               描述需求、审查代码                   │
└───────────────────┬─────────────────────────────┘
                    │ 自然语言指令
                    ▼
┌─────────────────────────────────────────────────┐
│                  Agent（智能体）                  │
│         理解任务 → 制定计划 → 执行 → 反馈         │
│  ┌───────────────────────────────────────────┐  │
│  │           LLM（大语言模型）                 │  │
│  │    推理核心：理解、规划、生成               │  │
│  └───────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │   Skills     │  │   MCP (工具协议)        │   │
│  │  (领域经验)   │  │  (连接外部工具)         │   │
│  └──────────────┘  └────────────────────────┘   │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   文件系统     网络搜索     数据库/API
```

---

## 二、LLM：推理引擎

### 2.1 LLM 是什么

LLM（Large Language Model，大语言模型）是经过海量文本训练的神经网络，能理解和生成自然语言。

```python
# LLM 的本质：一个超级大的概率函数
def llm(input_tokens: list[str]) -> list[str]:
    """
    输入：一串 token（词/字）
    输出：一串 token（概率最高的下一个词）
    
    GPT-4：~1.8 万亿参数
    Claude：~数千亿参数
    Llama 3：~4050 亿参数
    """
    # 内部工作原理（极度简化）：
    # 1. 将 token 转换为向量（embedding）
    # 2. 通过 Transformer 层进行注意力计算
    # 3. 预测下一个 token 的概率分布
    # 4. 采样得到输出 token
    pass
```

### 2.2 LLM 的能力边界

```python
LLM_CAPABILITIES = {
    "擅长": {
        "自然语言理解": "理解你的需求描述",
        "代码生成": "根据描述生成代码",
        "翻译": "中英文互译、技术文档翻译",
        "总结": "提炼长文本的关键信息",
        "推理": "逻辑推理、数学计算（Chain-of-Thought）",
    },
    "不擅长": {
        "精确计算": "大数乘法、复杂公式（用计算器更好）",
        "实时信息": "不知道今天发生了什么（知识截止日期）",
        "长程一致性": "长对话中可能忘记前面的内容",
        "确定性输出": "同一个问题可能给不同答案",
    }
}
```

### 2.3 主流 LLM 对比

```python
LLM_COMPARISON = {
    "GPT-5.2 / 5.3": {
        "厂商": "OpenAI",
        "特点": "综合能力强，代码生成顶尖",
        "适合": "复杂推理、代码生成",
    },
    "Claude Opus 4": {
        "厂商": "Anthropic",
        "特点": "长上下文（200K），代码理解强",
        "适合": "大型代码库分析、长文档处理",
    },
    "Gemini 2.5 Pro": {
        "厂商": "Google",
        "特点": "原生多模态，超长上下文",
        "适合": "多模态任务、超长文档",
    },
    "MiMo V2 Pro": {
        "厂商": "小米",
        "特点": "免费可用，中文理解好",
        "适合": "日常任务、成本敏感场景",
    },
    "DeepSeek V3": {
        "厂商": "DeepSeek",
        "特点": "开源、代码能力强、便宜",
        "适合": "代码任务、本地部署",
    },
}
```

---

## 三、Agent：有行动力的 AI

### 3.1 Agent 的定义

Agent = LLM + 工具调用 + 循环执行。它不只是回答问题，而是**主动完成任务**。

```python
# Agent 的核心循环（简化版）
class Agent:
    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = tools  # 可调用的工具列表
    
    def run(self, task: str) -> str:
        """Agent 的核心：思考-行动循环"""
        messages = [{"role": "user", "content": task}]
        
        while True:
            # 1. 思考：LLM 决定下一步
            response = self.llm.chat(messages)
            
            # 2. 如果 LLM 直接回答了，返回
            if response.is_final_answer:
                return response.content
            
            # 3. 如果 LLM 要调用工具，执行
            if response.tool_call:
                tool_name = response.tool_call.name
                tool_args = response.tool_call.arguments
                
                # 执行工具
                result = self.tools[tool_name](**tool_args)
                
                # 把结果反馈给 LLM
                messages.append({
                    "role": "tool",
                    "name": tool_name,
                    "content": result
                })
            
            # 4. 继续循环
```

### 3.2 Agent vs 纯 LLM

```python
# 纯 LLM：只能聊天
response = llm.chat("帮我查一下服务器的内存使用情况")
# → "抱歉，我无法访问您的服务器"

# Agent：能执行
response = agent.run("帮我查一下服务器的内存使用情况")
# → [调用 exec 工具运行 free -h]
# → "当前内存使用：总共 4GB，已用 2.1GB，可用 1.9GB"

# Agent 的工具示例
AGENT_TOOLS = {
    "exec": "执行 shell 命令",
    "read": "读取文件内容",
    "write": "写入文件",
    "web_search": "搜索互联网",
    "web_fetch": "获取网页内容",
}
```

### 3.3 Agent 的类型

```python
AGENT_TYPES = {
    "单次执行型（One-shot）": {
        "代表": "Codex exec, Claude Code -p",
        "流程": "任务 → 执行 → 结果，一次完成",
        "适合": "明确的、一次性的任务",
        "示例": "帮我写一个 Python 脚本来重命名文件夹里所有文件",
    },
    "对话交互型（Interactive）": {
        "代表": "Claude Code, Cursor, OpenCode",
        "流程": "持续对话，多轮交互",
        "适合": "需要逐步完善的工作",
        "示例": "开发一个完整的 Web 应用",
    },
    "自主规划型（Autonomous）": {
        "代表": "Devin, Codex (cloud)",
        "流程": "接受目标 → 自主规划 → 执行 → 汇报",
        "适合": "有明确目标的复杂任务",
        "示例": "修复这个 GitHub Issue",
    },
}
```

---

## 四、MCP：Agent 的工具协议

### 4.1 什么是 MCP

MCP（Model Context Protocol）是一个**开放标准**，定义了 AI Agent 如何发现和调用外部工具。

```
没有 MCP（传统方式）：
每个 AI 工具 ←→ 每个外部服务（N × M 连接）

有 MCP：
AI Agent ←→ MCP 协议 ←→ MCP Server ←→ 外部服务（N + M 连接）
```

```python
# MCP 的架构
MCP_ARCHITECTURE = {
    "MCP Client": "内嵌在 AI Agent 中，负责发现和调用工具",
    "MCP Server": "提供具体工具的服务器",
    "MCP Protocol": "Client 和 Server 之间的通信协议（JSON-RPC）",
}

# MCP Server 示例
class MyMCPServer:
    """一个简单的 MCP Server：提供数据库查询功能"""
    
    @tool("query_users")
    def query_users(self, name: str = None, limit: int = 10) -> list[dict]:
        """查询用户列表
        
        Args:
            name: 按名称过滤（可选）
            limit: 返回数量限制（默认 10）
        """
        # 实际查询数据库
        sql = "SELECT * FROM users"
        if name:
            sql += f" WHERE name LIKE '%{name}%'"
        sql += f" LIMIT {limit}"
        return db.query(sql)
    
    @tool("get_user_stats")
    def get_user_stats(self, user_id: int) -> dict:
        """获取用户统计信息"""
        return {
            "posts": db.count("posts", user_id=user_id),
            "comments": db.count("comments", user_id=user_id),
            "login_days": db.count_distinct("login_logs", user_id=user_id),
        }
```

### 4.2 常用 MCP Server

```python
COMMON_MCP_SERVERS = {
    "文件系统": {
        "工具": "@modelcontextprotocol/server-filesystem",
        "功能": "读写本地文件",
    },
    "数据库": {
        "工具": "@modelcontextprotocol/server-postgres",
        "功能": "查询 PostgreSQL 数据库",
    },
    "搜索": {
        "工具": "@modelcontextprotocol/server-brave-search",
        "功能": "搜索互联网",
    },
    "浏览器": {
        "工具": "@anthropic-ai/mcp-server-puppeteer",
        "功能": "浏览器自动化",
    },
    "GitHub": {
        "工具": "@modelcontextprotocol/server-github",
        "功能": "操作 GitHub（Issues, PRs 等）",
    },
    "Slack": {
        "工具": "@modelcontextprotocol/server-slack",
        "功能": "发送 Slack 消息",
    },
}
```

### 4.3 配置 MCP Server

```json
// Claude Code 的 MCP 配置（~/.claude/mcp.json）
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

---

## 五、Skills：可复用的领域知识

### 5.1 什么是 Skill

Skill 是打包好的**领域知识 + 操作流程**，告诉 Agent 在特定场景下应该怎么做。

```markdown
# 一个 Skill 的结构
SKILL.md        → 定义：什么时候用、怎么做
scripts/        → 辅助脚本（可选）
references/     → 参考文档（可选）
```

```yaml
# SKILL.md 示例：Git 工作流 Skill
---
name: git-workflow
description: 规范的 Git 操作流程
triggers:
  - "提交代码"
  - "创建分支"
  - "合并 PR"
---

## 工作流程

### 提交代码
1. `git status` 查看变更
2. `git diff` 审查每个改动
3. `git add -p` 逐块暂存（不要用 `git add .`）
4. 按 Conventional Commits 规范写 commit message
5. `git push`

### Commit Message 规范
- `feat: 新功能`
- `fix: 修复 bug`
- `docs: 文档更新`
- `refactor: 重构`
- `test: 测试`
- `chore: 构建/工具变更
```

### 5.2 Skills vs MCP

```python
SKILL_VS_MCP = {
    "Skill（知识）": {
        "本质": "告诉 Agent 怎么做某件事",
        "形式": "文档 + 流程 + 规范",
        "例子": "Git 工作流、代码审查流程、部署流程",
        "类比": "一个有经验的老员工写的工作手册",
    },
    "MCP（工具）": {
        "本质": "给 Agent 提供可以调用的能力",
        "形式": "可执行的工具函数",
        "例子": "搜索、数据库查询、文件操作",
        "类比": "一个配备了各种工具的工具箱",
    },
    "两者结合": {
        "例子": "一个 '代码审查' Skill 告诉 Agent：先用 MCP 工具读代码，再用 MCP 工具查 git blame，最后按规范输出审查报告",
    }
}
```

### 5.3 自定义 Skill 示例

```python
# 一个实用的 Skill：代码质量检查
# skills/code-quality/SKILL.md

SKILL_DEFINITION = """
---
name: code-quality
description: 检查代码质量并生成报告
---

## 触发条件
当用户要求检查代码质量、代码审查、code review 时触发。

## 工作流程
1. 读取目标文件/目录
2. 运行 linter（ESLint, Pylint, 等）
3. 运行类型检查（TypeScript, mypy）
4. 分析测试覆盖率
5. 检查复杂度（圈复杂度）
6. 生成质量报告

## 输出格式
### 代码质量报告
- 总评分：X/100
- Lint 问题：X 个（X 错误, X 警告）
- 类型错误：X 个
- 测试覆盖率：X%
- 高复杂度函数：X 个

### 优先修复建议
1. [严重] ...
2. [警告] ...
3. [建议] ...
"""

# 对应的脚本
# skills/code-quality/scripts/check.sh
CHECK_SCRIPT = """#!/bin/bash
echo "=== Lint ==="
npx eslint src/ --format json 2>/dev/null | jq '.[] | {filePath, errorCount, warningCount}'

echo "=== Type Check ==="
npx tsc --noEmit 2>&1 | head -20

echo "=== Coverage ==="
npx jest --coverage --silent 2>/dev/null | tail -5

echo "=== Complexity ==="
npx cr src/ --format json 2>/dev/null | jq '.[] | select(.complexity > 10) | {name, complexity}'
"""
```

---

## 六、四个概念的协作关系

```python
# 一个完整的 Vibe Coding 工作流示例

WORKFLOW_EXAMPLE = {
    "场景": "你让 AI 帮你实现一个用户认证模块",
    
    "Step 1 - LLM 推理": """
        你：'帮我实现 JWT 用户认证'
        LLM：分析需求，规划实现方案
    """,
    
    "Step 2 - Skill 指导": """
        Agent 加载 'auth-module' Skill：
        - 文件结构规范（models/, routes/, middleware/）
        - 密码必须用 bcrypt
        - JWT 有效期和刷新机制
        - 必须包含测试
    """,
    
    "Step 3 - MCP 工具执行": """
        Agent 调用 MCP 工具：
        - read: 读取现有项目结构
        - write: 创建认证相关文件
        - exec: 运行测试
        - database: 查询用户表结构
    """,
    
    "Step 4 - 持续迭代": """
        Agent 循环：
        写代码 → 跑测试 → 发现问题 → 修复 → 再测试
        直到所有测试通过
    """
}
```

```
人类（你）
  │
  │ "帮我实现用户认证"
  ▼
Agent（编排者）
  │
  ├──→ LLM（推理）"需要：注册、登录、JWT、中间件"
  │
  ├──→ Skill（知识）"auth 规范：bcrypt、JWT、测试"
  │
  └──→ MCP（工具）
         ├── read → 读项目文件
         ├── write → 写代码文件
         ├── exec → 跑 npm test
         └── db → 查用户表
  │
  ▼
结果（完整的认证模块 + 测试）
```

---

## 七、如何搭建你自己的 Vibe Coding 工作流

```python
# 推荐的技术栈组合
RECOMMENDED_STACK = {
    "LLM 选择": {
        "日常编码": "MiMo V2 Pro / DeepSeek V3（便宜）",
        "复杂任务": "GPT-5.2 / Claude Opus（能力强）",
        "本地部署": "Llama 3 / Qwen（离线可用）",
    },
    "Agent 工具": {
        "终端用户": "Claude Code / OpenCode（交互式）",
        "CI/CD 集成": "Codex exec（非交互式）",
        "IDE 集成": "Cursor / Windsurf（编辑器内）",
    },
    "MCP Server": {
        "必备": "filesystem, github, brave-search",
        "按需": "postgres, puppeteer, slack",
    },
    "自定义 Skills": {
        "团队规范": "代码风格、commit 规范、部署流程",
        "项目特定": "数据模型、API 约定、测试策略",
    }
}
```

---

## 参考资料

- [What Is an AI Agent? — IBM](https://www.ibm.com/think/topics/ai-agents) — AI Agent 概念解释
- [Model Context Protocol](https://modelcontextprotocol.io/) — MCP 协议官方文档
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — OpenAI Agent 框架
- [LangChain Agents](https://python.langchain.com/docs/modules/agents/) — LangChain Agent 教程
- [Anthropic: Building Effective Agents](https://docs.anthropic.com/en/docs/build-with-claude/agent) — Anthropic Agent 最佳实践
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) — Claude Code Skill 文档
