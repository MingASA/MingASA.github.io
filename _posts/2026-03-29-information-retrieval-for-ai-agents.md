---
title: "信息获取能力：从搜索到 Agent 的完整 SOP"
date: 2026-03-29 00:00:00 +0800
categories: [AI, 信息检索]
tags: [search, rag, agent, mcp, skill, information-retrieval]
---

> **你可以跳过这篇文章，如果你：** 已经能高效地从互联网获取任何你需要的信息，并且能把搜索能力集成到 AI 工作流中。
>
> **这篇文章在讲什么：** 信息获取的各种途径、一套可直接复用的搜索 SOP，以及如何把搜索能力写成 Skill 加入 Agent。
>
> **看完你能做到：** 系统性地找到任何技术问题的答案；用自动化流程替代手动搜索；让 AI Agent 自己具备搜索能力。

---

## 一、信息获取的途径全景

### 1.1 途径分类

信息获取能力可以分为四个层级：

```
Level 1: 被动接收 — 社交媒体、RSS、Newsletter
Level 2: 主动搜索 — 搜索引擎、站内搜索、学术搜索
Level 3: 深度获取 — 爬虫、API、数据库查询
Level 4: 自动化获取 — Agent + MCP + Skills
```

| 层级 | 工具 | 适用场景 | 信息质量 |
|:---:|:---|:---|:---:|
| L1 | Twitter/知乎/RSS | 了解趋势、发现话题 | ⭐⭐ |
| L2 | Google/百度/DuckDuckGo | 解决具体问题 | ⭐⭐⭐ |
| L3 | 爬虫/API/学术论文 | 系统性研究 | ⭐⭐⭐⭐ |
| L4 | Agent/MCP/Skill | 自动化信息管道 | ⭐⭐⭐⭐⭐ |

### 1.2 搜索引擎的底层逻辑

理解搜索引擎的工作原理，才能写出更好的搜索指令。

```python
# 搜索引擎的工作原理（简化版）
class SearchEngine:
    def __init__(self):
        self.index = {}  # 倒排索引：词 → 文档列表
        self.pagerank = {}  # 页面权重
    
    def search(self, query):
        # 1. 分词
        tokens = self.tokenize(query)
        # 2. 查索引
        candidates = self.lookup(tokens)
        # 3. 排序（相关性 + 权重 + 时效性）
        ranked = self.rank(candidates, query)
        # 4. 返回
        return ranked[:10]
    
    def rank(self, candidates, query):
        """排序算法的核心：多个信号的加权"""
        for doc in candidates:
            doc.score = (
                self.relevance(doc, query) * 0.4 +  # 关键词匹配度
                self.pagerank.get(doc.url, 0) * 0.3 +  # 页面权威度
                self.freshness(doc) * 0.2 +  # 时效性
                self.user_signals(doc) * 0.1   # 用户点击行为
            )
        return sorted(candidates, key=lambda d: d.score, reverse=True)
```

**关键洞察：** 搜索引擎按"相关性 + 权重 + 时效性"排序。你的搜索词越精准，结果越好。

---

## 二、搜索技巧实战

### 2.1 Google 高级搜索语法

```bash
# 精确匹配
"prompt engineering"         # 必须包含这个完整短语

# 站内搜索
site:github.com "fastapi"    # 只搜 GitHub
site:stackoverflow.com       # 只搜 StackOverflow

# 文件类型
filetype:pdf "机器学习"      # 只搜 PDF
filetype:py "async await"    # 只搜 Python 文件

# 排除
python -snake -animal        # 排除包含 snake 或 animal 的结果

# 通配符
"how to * in python"         # * 可以匹配任何词

# 时间范围
after:2025-01-01 "llm"       # 2025 年之后的内容

# 组合使用
site:github.com filetype:md "rag" after:2025-06-01
# 2025年6月之后 GitHub 上关于 RAG 的 Markdown 文件
```

### 2.2 学术搜索

```bash
# Google Scholar — 学术论文
scholar.google.com

# Semantic Scholar — AI 驱动的学术搜索
semanticscholar.org

# arXiv — 预印本论文（AI/ML 领域最重要）
arxiv.org

# Connected Papers — 论文关系图谱
connectedpapers.com
```

### 2.3 技术社区搜索

```python
# 高效的技术搜索策略
SEARCH_STRATEGY = {
    "报错信息": [
        "直接复制完整报错信息到 Google",
        "加上语言/框架名：'python ImportError: xxx'",
        "限定 site:stackoverflow.com",
    ],
    "API 用法": [
        "官方文档优先：'site:docs.python.org'",
        "加上版本号：'python 3.12 typing'",
        "看官方示例而不是博客",
    ],
    "架构设计": [
        "搜索 'system design xxx'",
        "GitHub 上搜同类项目的架构",
        "看技术博客的架构图",
    ],
    "最佳实践": [
        "搜索 'xxx best practices 2025'",
        "'awesome-xxx' GitHub 仓库",
        "知名公司的技术博客",
    ],
}
```

---

## 三、完整 SOP：从问题到答案

以下是一个**可直接复用**的搜索 SOP，适用于技术问题的解决：

### 3.1 SOP 流程图

```
遇到问题
  │
  ├─→ 1. 精确描述问题（写下来）
  │
  ├─→ 2. 第一轮搜索：直接搜报错信息/问题描述
  │     ├─→ 找到答案 → 验证 → 解决 ✅
  │     └─→ 没找到 → 继续
  │
  ├─→ 3. 第二轮搜索：加上上下文（语言/版本/框架）
  │     ├─→ 找到答案 → 验证 → 解决 ✅
  │     └─→ 没找到 → 继续
  │
  ├─→ 4. 第三轮搜索：去专业社区提问
  │     ├─→ StackOverflow / GitHub Issues / Reddit
  │     └─→ 按规范写问题（见下文）
  │
  ├─→ 5. 第四轮：问 AI
  │     ├─→ 把搜索到的相关信息喂给 AI
  │     └─→ AI 综合分析给方案
  │
  └─→ 6. 验证方案 → 记录到笔记
```

### 3.2 实操示例：解决一个 Python 异步编程问题

```python
# 场景：你在 FastAPI 中使用 async/await，遇到以下报错
# RuntimeError: This event loop is already running

# ===== Step 1: 精确描述问题 =====
# ❌ 模糊描述："Python 异步出错了"
# ✅ 精确描述：
"""
RuntimeError: This event loop is already running
环境：Python 3.12, FastAPI 0.115, uvicorn
场景：在 FastAPI 路由中调用了一个同步函数，该函数内部使用了 asyncio.run()
代码：
@app.get("/test")
async def test():
    result = sync_function_that_uses_asyncio_run()  # 这里报错
    return {"result": result}
"""

# ===== Step 2: 第一轮搜索 =====
# Google: "RuntimeError: This event loop is already running" FastAPI
# → 找到 StackOverflow，确认原因是嵌套事件循环

# ===== Step 3: 验证方案 =====
# 方案 A：改用 asyncio.create_task() 或 await
# 方案 B：使用 nest_asyncio（不推荐，治标不治本）
# 方案 C：把同步函数改为异步

# ✅ 最佳实践：改用 await
@app.get("/test")
async def test():
    result = await async_function()  # 正确：直接 await
    return {"result": result}

# 如果同步函数无法改为异步，使用 run_in_executor
import asyncio
from functools import partial

@app.get("/test")
async def test():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, sync_function)
    return {"result": result}
```

### 3.3 提问的正确姿势

当你需要去社区提问时，一个好的问题应该包含：

```markdown
## 环境
- OS: Ubuntu 22.04
- Python: 3.12.1
- FastAPI: 0.115.0
- uvicorn: 0.34.0

## 问题描述
在 FastAPI 路由中调用包含 asyncio.run() 的同步函数时，
抛出 RuntimeError: This event loop is already running

## 复现步骤
1. 创建 FastAPI 路由
2. 在路由中调用 sync_function_that_uses_asyncio_run()
3. 访问该路由

## 已尝试的方案
- 方案 A：使用 nest_asyncio → 能用但不推荐
- 方案 B：改为 await → 但同步函数中有第三方库调用

## 期望
如何在异步环境中正确调用使用了 asyncio.run() 的同步函数？
```

---

## 四、进阶：把搜索能力加入 Agent

### 4.1 为什么需要 Agent 搜索

手动搜索的痛点：
1. 每次都要打开浏览器、输入关键词、筛选结果
2. 多个搜索源的结果需要人工整合
3. 搜索结果无法被 AI 直接利用

解决方案：**让 AI Agent 自己搜索**。

### 4.2 MCP：Agent 的工具协议

MCP（Model Context Protocol）是一个让 AI 模型调用外部工具的标准协议。通过 MCP，Agent 可以搜索网页、查询数据库、调用 API。

```json
// MCP Server 配置示例（添加一个搜索工具）
{
  "mcpServers": {
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

### 4.3 实战：写一个搜索 Skill

以 OpenClaw 为例，我们可以写一个搜索 Skill，让 Agent 在回答问题前自动搜索最新信息：

```yaml
# SKILL.md — 搜索增强 Skill
---
name: web-search
description: 搜索互联网获取最新信息
---

## 使用场景
当用户的问题涉及：
- 最新的技术文档
- 实时信息（新闻、价格等）
- 你需要验证的事实

## 工作流程
1. 从用户问题中提取搜索关键词
2. 使用 web_search 工具搜索
3. 从 top 3 结果中提取关键信息
4. 综合信息回答用户问题
5. 标注信息来源

## 搜索词优化规则
- 去掉停用词（的、了、吗、吧）
- 加上年份以获取最新信息
- 英文技术术语保持英文
- 使用引号锁定精确匹配
```

```python
# 对应的 Python 实现（MCP Server 示例）
from mcp.server import Server
import httpx

server = Server("web-search")

@server.tool()
async def web_search(query: str, count: int = 5) -> str:
    """搜索互联网获取信息"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": count},
            headers={"X-Subscription-Token": BRAVE_API_KEY}
        )
        results = response.json()["web"]["results"]
    
    # 格式化搜索结果
    output = []
    for r in results:
        output.append(f"### {r['title']}\n{r['url']}\n{r['description']}\n")
    
    return "\n".join(output)
```

### 4.4 RAG：让 AI 搜索你的知识库

除了搜索互联网，你还可以让 AI 搜索你自己的知识库：

```python
# RAG（检索增强生成）的核心流程
import openai
from sentence_transformers import SentenceTransformer
import numpy as np

class RAGSystem:
    def __init__(self):
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.embeddings = []
    
    def add_document(self, text: str, source: str):
        """将文档加入知识库"""
        embedding = self.embedder.encode(text)
        self.documents.append({"text": text, "source": source})
        self.embeddings.append(embedding)
    
    def search(self, query: str, top_k: int = 3):
        """搜索最相关的文档"""
        query_embedding = self.embedder.encode(query)
        scores = [
            np.dot(query_embedding, doc_emb) 
            for doc_emb in self.embeddings
        ]
        top_indices = np.argsort(scores)[-top_k:][::-1]
        return [self.documents[i] for i in top_indices]
    
    def answer(self, question: str) -> str:
        """基于知识库回答问题"""
        # 1. 检索相关文档
        relevant_docs = self.search(question)
        context = "\n".join([d["text"] for d in relevant_docs])
        
        # 2. 将文档和问题一起发给 LLM
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "基于以下参考资料回答问题，标注来源。"},
                {"role": "user", "content": f"参考资料：\n{context}\n\n问题：{question}"}
            ]
        )
        return response.choices[0].message.content

# 使用示例
rag = RAGSystem()
rag.add_document("Python 3.12 新增了...", source="Python 官方文档")
rag.add_document("FastAPI 最佳实践...", source="FastAPI 文档")
answer = rag.answer("Python 3.12 有什么新特性？")
```

---

## 五、信息获取的自动化管道

把以上所有能力组合起来，构建一个完整的信息获取管道：

```python
# 信息获取管道
class InformationPipeline:
    """四层信息获取管道"""
    
    def level1_passive(self, topics: list[str]) -> list[dict]:
        """被动接收：RSS + 社交媒体"""
        # 订阅技术博客的 RSS
        feeds = [
            "https://blog.python.org/feeds/posts/default",
            "https://github.blog/feed/",
            "https://hnrss.org/newest?q=AI",
        ]
        return self.parse_feeds(feeds, topics)
    
    def level2_search(self, question: str) -> list[dict]:
        """主动搜索：多引擎搜索"""
        results = []
        # Google 搜索
        results.extend(self.google_search(question))
        # GitHub 搜索
        results.extend(self.github_search(question))
        # StackOverflow 搜索
        results.extend(self.stackoverflow_search(question))
        return self.deduplicate(results)
    
    def level3_deep(self, url: str) -> str:
        """深度获取：爬取和解析"""
        # 获取网页内容
        content = self.fetch(url)
        # 提取正文（去掉广告、导航等）
        clean_text = self.extract_main_content(content)
        return clean_text
    
    def level4_agent(self, question: str) -> str:
        """自动化获取：Agent 综合处理"""
        # 1. 搜索
        search_results = self.level2_search(question)
        # 2. 深度获取 top 3 的内容
        deep_contents = [
            self.level3_deep(r["url"]) 
            for r in search_results[:3]
        ]
        # 3. 交给 AI 综合分析
        answer = self.llm_analyze(question, deep_contents)
        return answer
```

---

## 参考资料

- [Google Search Operators 完整列表](https://ahrefs.com/blog/google-advanced-search-operators/) — Google 搜索语法大全
- [Brave Search API](https://brave.com/search/api/) — 搜索 API 文档
- [Model Context Protocol](https://modelcontextprotocol.io/) — MCP 协议规范
- [RAG 论文原文](https://arxiv.org/abs/2005.11401) — Lewis et al., 2020
- [LangChain RAG 教程](https://python.langchain.com/docs/use_cases/question_answering/quickstart) — RAG 快速入门
- [Sentence Transformers](https://www.sbert.net/) — 文本向量化库
