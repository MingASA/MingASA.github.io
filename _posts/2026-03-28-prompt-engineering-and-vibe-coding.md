---
title: "提示词工程与 Vibe Coding：AI 时代的编程底线"
date: 2026-03-28 18:30:00 +0800
categories: [AI, 提示词工程]
tags: [prompt-engineering, vibe-coding, ai, llm]
pin: true
---

> **你可以跳过这篇文章，如果你：** 已经能稳定地让 AI 输出你想要的代码，且从不让未审查的 AI 代码进入生产环境。
>
> **这篇文章在讲什么：** 提示词工程的核心技巧、当前 AI 的能力边界，以及 Vibe Coding 时代必须守住的底线。
>
> **看完你能做到：** 写出让 AI 精准执行的提示词；判断什么任务该交给 AI、什么不该；建立一套不翻车的 Vibe Coding 工作流。

---

## 一、当前 AI 形势：它能做什么，不能做什么

### 1.1 AI 编程能力的分类

当前 AI 编程工具可以分为三代：

| 代际 | 代表产品 | 核心能力 | 局限 |
|:---:|:---:|:---:|:---:|
| 第一代 | GitHub Copilot | 代码补全 | 无上下文理解 |
| 第二代 | Cursor, Claude Code | 项目级理解、多文件编辑 | 复杂架构设计弱 |
| 第三代 | Codex Cloud, Devin | 自主规划+执行+测试 | 不可控、幻觉仍存在，Devin 尚处早期 |

```javascript
// 第一代：补全
function calculateTax(income) {
  // Copilot 自动补全下面这行
  return income * 0.2;
}

// 第二代：理解上下文后改写
// 你写注释 "改用累进税率"
// Cursor 自动把整个函数重写为累进税计算

// 第三代：自主执行
// 你写 "实现完整的用户认证模块，包括注册、登录、JWT、中间件"
// Codex 自己建文件、写代码、写测试
```

### 1.2 基本认识：三个事实

**事实一：AI 不理解你的业务。**

AI 知道"快速排序怎么写"，但不知道"你的电商系统为什么需要排序"。它没有你的业务上下文。

**事实二：AI 的输出是概率性的。**

同一个提示词，跑 10 次可能出 10 种方案。有的精妙，有的离谱。你不能假设它"这次一定对"。

**事实三：AI 可能加剧技能差距。**

如果你不懂原理就依赖 AI，你会越来越不会编程。如果你懂原理再用 AI，你会变得更强。工具放大了人的能力——也放大了人的懒惰。

---

## 二、提示词工程：让 AI 精准输出的技巧

### 2.1 核心原则

提示词工程的本质是**降低输出的不确定性**。有五个核心技巧：

#### 技巧一：角色设定（Role Prompting）

```python
# ❌ 差的提示词
prompt = "帮我写个登录接口"

# ✅ 好的提示词
prompt = """
你是一个有 10 年经验的后端工程师，精通 Python 和 FastAPI。
请实现一个用户登录接口，要求：
- 使用 JWT 认证
- 密码用 bcrypt 加密
- 返回标准 RESTful 格式
- 包含错误处理
"""
```

**为什么有效：** 角色设定让模型从"全知全能的百科全书"切换到"特定领域的专家"，输出的专业度显著提升。

#### 技巧二：结构化输出（Structured Output）

```python
# ❌ 模糊的输出要求
prompt = "分析这段代码的问题"

# ✅ 结构化的输出要求
prompt = """
分析以下代码，按以下格式输出：

## 发现的问题
| 序号 | 严重程度 | 位置 | 问题描述 | 修复方案 |
|:---:|:---:|:---:|:---|:---|

## 代码质量评分
- 可读性：X/10
- 性能：X/10
- 安全性：X/10

## 优先修复建议
1. ...

代码：
{code}
"""
```

**为什么有效：** 你指定了输出格式，模型就不会自由发挥——它被约束在你定义的框架内。

#### 技巧三：Few-shot 示例（给出范例）

```javascript
// 给 AI 几个输入→输出的例子，它会学会你的模式
const prompt = `
请将以下自然语言需求转换为 SQL 查询。

示例：
输入：找出所有年龄大于 18 岁的用户
输出：SELECT * FROM users WHERE age > 18

输入：统计每个部门的员工数量，按数量降序排列
输出：SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC

输入：找出最近 30 天内下过单但没有评论的用户
输出：
`;
// AI 会按照上面的模式，生成正确的 SQL
```

**为什么有效：** 模型从示例中"学会"了你的期望格式和逻辑模式，比纯文字描述更高效。

#### 技巧四：思维链（Chain-of-Thought）

```python
# ❌ 直接要答案
prompt = "这个算法的时间复杂度是多少？"

# ✅ 要求展示推理过程
prompt = """
分析以下算法的时间复杂度。请按以下步骤推理：

1. 识别外层循环的执行次数
2. 识别内层循环的执行次数
3. 分析最好情况和最坏情况
4. 用大 O 表示法给出最终结论
5. 如果有优化空间，给出优化方案

代码：
{code}
"""
```

**为什么有效：** 要求模型"先想再说"，显著提升了复杂推理任务的准确率。研究表明，CoT 在数学和逻辑推理上能提升 20-40% 的正确率。

#### 技巧五：迭代反馈（Iterative Refinement）

```python
# 第一轮：给任务
response_1 = ask("实现一个 LRU Cache")

# 第二轮：指出问题
response_2 = ask(f"""
上一轮的实现有以下问题：
1. 没有处理并发场景
2. 缺少 TTL 过期机制
3. 没有类型标注

请基于上一轮代码修复这些问题。
上一轮代码：
{response_1}
""")

# 第三轮：继续精化
response_3 = ask(f"""
很好，但还需要：
- 添加完整的单元测试
- 支持泛型（TypeScript）
- 性能基准测试

基于当前代码继续改进：
{response_2}
""")
```

**为什么有效：** 一次性给太多要求，模型容易遗漏。分轮迭代，每轮聚焦几个点，质量显著提升。

### 2.2 System Prompt 的力量

System Prompt 是你对 AI 的"全局设定"，它在对话开始前就定义了 AI 的行为方式：

```python
# 一个实用的 System Prompt 模板
SYSTEM_PROMPT = """
## 身份
你是一个严谨的代码助手。

## 行为规则
1. 不确定的事情说"不确定"，不要编造
2. 给出代码时必须包含错误处理
3. 如果需求有歧义，先问清楚再动手
4. 每段代码都要有简短的注释
5. 涉及安全的操作（数据库写入、文件操作等）必须提醒

## 输出偏好
- 代码用对应语言的 markdown 代码块
- 复杂逻辑先给伪代码，再给实现
- 优先使用标准库，第三方库要说明理由

## 禁止行为
- 不要省略错误处理
- 不要使用已废弃的 API
- 不要假设环境配置
"""
```

---

## 三、Vibe Coding：一种新的编程方式

### 3.1 什么是 Vibe Coding

Vibe Coding 这个概念由 Andrej Karpathy（前 Tesla AI 总监、OpenAI 创始成员）在 2025 年提出。核心理念是：

> **"你不是在写代码，你是在描述你想要什么。"**

简单说，Vibe Coding 是一种**以自然语言为编程接口**的开发方式：你用大白话告诉 AI 你要什么，AI 生成代码，你负责审查和调整。它降低了"动手写"的门槛，但提高了"想清楚"的要求。

传统编程：你写每一行代码，精确控制每个细节。
Vibe Coding：你描述需求，AI 生成代码，你审查和调整。

```python
# 传统编程思维
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# Vibe Coding 思维
"""
帮我实现一个高效的斐波那契数列计算器，
要求：
- 支持大数（n > 1000）
- 使用迭代而非递归（避免栈溢出）
- 添加缓存机制
- 包含类型标注和文档字符串
"""
# AI 生成完整的实现
```

### 3.2 Vibe Coding 的边界

Vibe Coding 不是什么都能做的。它的能力边界可以用一张表来描述：

| 任务类型 | Vibe Coding 适用度 | 原因 |
|:---|:---:|:---|
| CRUD 接口 | ⭐⭐⭐⭐⭐ | 模式固定，AI 极擅长 |
| 算法题 | ⭐⭐⭐⭐ | 标准算法 AI 很熟 |
| 前端页面 | ⭐⭐⭐⭐ | 布局和组件 AI 做得不错 |
| 系统架构设计 | ⭐⭐ | 需要业务理解和权衡判断 |
| 性能优化 | ⭐⭐ | 需要 profiling 数据和经验 |
| 安全审计 | ⭐ | AI 可能遗漏攻击面 |
| 底层系统编程 | ⭐ | 需要精确的内存和并发控制 |

---

## 四、Vibe Coding 的底线原则

这是本文最重要的部分。以下是使用 AI 编程时**绝对不能突破**的底线。

### 底线一：你必须理解你让 AI 做了什么

```javascript
// ❌ 致命错误：不理解就用
// AI 给了你一段加密代码，你直接复制粘贴
const encrypted = aiGeneratedCryptoFunction(data);

// ✅ 正确做法：理解每一步
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';  // 我知道这是 AES-256-GCM 加密
const key = crypto.scryptSync(password, salt, 32);  // 我知道这是从密码派生密钥
const iv = crypto.randomBytes(16);  // 我知道这是随机初始化向量
const cipher = crypto.createCipheriv(algorithm, key, iv);  // 我知道这创建加密器
// ... 每一行我都能解释它在做什么
```

**原则：** 如果你不能向别人解释这段代码在做什么，就不应该把它放进你的项目。

### 底线二：AI 生成的代码必须经过人工审查

```python
# AI 可能犯的典型错误示例

# 错误 1：SQL 注入漏洞
query = f"SELECT * FROM users WHERE name = '{user_input}'"  # AI 有时会这样写

# 错误 2：资源泄露
file = open("data.txt", "r")
data = file.read()
# AI 忘记 file.close() 或用 with 语句

# 错误 3：逻辑错误
def is_leap_year(year):
    return year % 4 == 0  # AI 遗漏了百年和四百年的判断

# 错误 4：安全隐患
password = "admin123"  # AI 在示例中硬编码密码
```

**审查清单：**
1. ✅ 输入验证：所有外部输入都验证了吗？
2. ✅ 错误处理：异常情况都处理了吗？
3. ✅ 资源管理：文件/连接/锁都正确释放了吗？
4. ✅ 安全性：有没有注入、硬编码密钥、权限过大？
5. ✅ 边界条件：空值、超大值、并发情况考虑了吗？

### 底线三：学习不能停

```python
# 场景：AI 帮你实现了一个复杂功能
# 你应该做的不只是"能跑就行"

# 第一步：让 AI 解释原理
explain_prompt = """
请详细解释这段代码的实现原理：
1. 为什么选择这种数据结构？
2. 时间和空间复杂度各是多少？
3. 有没有更优的方案？
4. 在什么场景下这种方案会失效？
"""

# 第二步：自己尝试修改
# 改一个参数，加一个功能，看看你是否真的理解了

# 第三步：对比学习
# 查阅官方文档，看看 AI 的实现和最佳实践是否一致
```

**原则：** AI 应该是你的学习加速器，而不是学习替代品。

### 底线四：版本控制是生命线

```bash
# Vibe Coding 的正确工作流
git checkout -b feature/user-auth    # 1. 建分支
# ... 让 AI 生成代码 ...
git diff                             # 2. 仔细审查 AI 的每一个改动
git add -p                           # 3. 逐块确认要提交的改动
git commit -m "feat: add user auth"  # 4. 提交
# 测试通过后
git checkout main && git merge       # 5. 合并

# ❌ 绝对不要这样做
# 直接在 main 分支上让 AI 改代码，改完就推
```

### 底线五：测试不是可选项

```javascript
// AI 生成的代码，必须有测试覆盖
// 最低要求：核心逻辑的单元测试

// 被测函数（AI 生成）
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 你必须写的测试
describe('validateEmail', () => {
  test('正确邮箱返回 true', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  test('无@符号返回 false', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });
  test('空字符串返回 false', () => {
    expect(validateEmail('')).toBe(false);
  });
  test('特殊字符处理', () => {
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });
  // 边界条件
  test('超长邮箱', () => {
    expect(validateEmail('a'.repeat(256) + '@example.com')).toBe(true);
  });
});
```

---

## 五、一个完整的 Vibe Coding 工作流

把上面的原则串起来，一个安全高效的 Vibe Coding 工作流是这样的：

```python
WORKFLOW = {
    "1_需求阶段": {
        "操作": "用自然语言清晰描述需求",
        "工具": "System Prompt + 结构化提示词",
        "底线": "你自己必须理解需求"
    },
    "2_生成阶段": {
        "操作": "让 AI 生成代码",
        "工具": "Claude Code / Cursor / Codex",
        "底线": "不要一次给太多需求，分模块来"
    },
    "3_审查阶段": {
        "操作": "逐行审查 AI 生成的代码",
        "工具": "git diff + 人工 review",
        "底线": "不理解的代码不合并"
    },
    "4_测试阶段": {
        "操作": "写测试、跑测试",
        "工具": "Jest / PyTest / 单元测试框架",
        "底线": "核心逻辑必须有测试覆盖"
    },
    "5_学习阶段": {
        "操作": "理解 AI 的实现原理",
        "工具": "让 AI 解释 + 查文档",
        "底线": "每个功能你都能讲清楚原理"
    }
}
```

---

## 参考资料

- [Prompt Engineering Guide](https://www.promptingguide.ai/zh) — DAIR.AI 出品的提示工程指南
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering) — OpenAI 官方最佳实践
- [Anthropic Prompt Library](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — Anthropic 提示词库
- [Vibe Coding — Andrej Karpathy](https://x.com/karpathy/status/1886192184518887457) — Vibe Coding 概念起源
- [Google Engineering Practices](https://google.github.io/pr-eng-practices/) — Google 代码审查实践
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Web 安全十大风险
