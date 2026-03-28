---
title: "进阶网络能力：服务器、内网穿透与爬虫"
date: 2026-03-29 02:00:00 +0800
categories: [网络, 进阶]
tags: [server, frp, crawler, captcha, reverse-proxy, nat-traversal]
---

> **你可以跳过这篇文章，如果你：** 已经会部署服务器、配置反向代理、做内网穿透，且有爬虫和反爬的实战经验。
>
> **这篇文章在讲什么：** 服务器部署、Nginx 反向代理、内网穿透方案、爬虫技术、人机验证（CAPTCHA）的攻防。
>
> **看完你能做到：** 从零部署一台服务器并配置反向代理；用 frp 实现内网穿透；写出能应对基本反爬的爬虫；理解 CAPTCHA 的原理和应对策略。

---

## 一、服务器部署

### 1.1 服务器基础操作

```bash
# ===== 系统信息 =====
uname -a                    # 系统版本
cat /etc/os-release         # 发行版信息
free -h                     # 内存使用
df -h                       # 磁盘使用
htop                        # 实时资源监控

# ===== 用户和权限 =====
adduser myuser              # 创建用户
usermod -aG sudo myuser     # 给 sudo 权限
passwd myuser               # 设置密码

# ===== SSH 安全加固 =====
# /etc/ssh/sshd_config
PermitRootLogin no          # 禁止 root 登录
PasswordAuthentication no   # 禁止密码登录（只用密钥）
Port 2222                   # 改默认端口
MaxAuthTries 3              # 最大尝试次数
```

### 1.2 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/myapp.conf

server {
    listen 80;
    server_name example.com;
    
    # HTTP → HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # 反向代理到后端应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态文件
    location /static/ {
        alias /var/www/myapp/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/
sudo nginx -t   # 检查配置
sudo systemctl reload nginx

# Let's Encrypt 免费 SSL 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

### 1.3 Docker 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    restart: unless-stopped
    
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 二、内网穿透

### 2.1 为什么需要内网穿透

```
没有内网穿透：
你的电脑 (192.168.1.100) ←── 局域网 ──→ 无法从外网访问

有内网穿透：
你的电脑 ──→ 公网服务器 ──→ 外网用户
         (frp client)  (frp server)
```

应用场景：
- 在家访问办公室电脑
- 给本地开发环境提供公网访问
- 暴露本地服务给 webhook 回调

### 2.2 frp 配置

```toml
# frps.toml — 服务器端配置
bindPort = 7000
auth.method = "token"
auth.token = "your-secret-token"

# Web 管理面板
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "admin"

# Dashboard
enablePrometheus = true
```

```toml
# frpc.toml — 客户端配置
serverAddr = "your-server.com"
serverPort = 7000
auth.method = "token"
auth.token = "your-secret-token"

# 穿透 SSH
[[proxies]]
name = "ssh"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000

# 穿透 Web 服务
[[proxies]]
name = "web"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
customDomains = ["app.example.com"]

# 穿透 HTTPS
[[proxies]]
name = "web-https"
type = "https"
localIP = "127.0.0.1"
localPort = 443
customDomains = ["app.example.com"]
```

```bash
# 启动
# 服务器端
frps -c frps.toml

# 客户端
frpc -c frpc.toml

# 通过穿透的 SSH 连接
ssh -p 6000 user@your-server.com
```

### 2.3 其他穿透方案

```python
# 方案对比
NAT_TRAVERSAL = {
    "frp": {
        "优点": "功能全面，支持 TCP/UDP/HTTP/HTTPS/STCP",
        "缺点": "需要公网服务器",
        "适用": "最通用的选择"
    },
    "ngrok": {
        "优点": "开箱即用，无需服务器",
        "缺点": "免费版限制多，域名随机",
        "适用": "临时测试、webhook 回调"
    },
    "cloudflare tunnel": {
        "优点": "免费，安全，无需开端口",
        "缺点": "需要域名托管在 CF",
        "适用": "对外暴露 Web 服务"
    },
    "tailscale": {
        "优点": "零配置，WireGuard 加密",
        "缺点": "不是传统端口映射",
        "适用": "设备互联、远程访问"
    },
    "zerotier": {
        "优点": "免费，虚拟局域网",
        "缺点": "打洞成功率不稳定",
        "适用": "游戏联机、虚拟组网"
    }
}
```

---

## 三、爬虫技术

### 3.1 爬虫的基本流程

```python
import httpx
from selectolax.parser import HTMLParser

class SimpleCrawler:
    """基本爬虫流程"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                              "AppleWebKit/537.36 (KHTML, like Gecko) "
                              "Chrome/120.0.0.0 Safari/537.36",
            },
            follow_redirects=True,
            timeout=10.0,
        )
    
    async def fetch(self, url: str) -> str:
        """1. 获取页面"""
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text
    
    def parse(self, html: str) -> list[dict]:
        """2. 解析页面"""
        tree = HTMLParser(html)
        results = []
        for item in tree.css("div.item"):
            results.append({
                "title": item.css_first("h2").text(),
                "link": item.css_first("a").attributes["href"],
                "description": item.css_first("p").text(),
            })
        return results
    
    async def save(self, data: list[dict]):
        """3. 存储数据"""
        # 写入 JSON
        import json
        with open("results.json", "a") as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    async def run(self, start_url: str, max_pages: int = 10):
        """运行爬虫"""
        url = start_url
        for page in range(max_pages):
            html = await self.fetch(url)
            data = self.parse(html)
            await self.save(data)
            print(f"Page {page + 1}: {len(data)} items")
            
            # 找下一页
            tree = HTMLParser(html)
            next_page = tree.css_first("a.next")
            if not next_page:
                break
            url = next_page.attributes["href"]
```

### 3.2 反爬与反反爬

```python
# ===== 常见反爬手段和应对 =====

# 1. User-Agent 检测
# 应对：使用真实 UA 池
import random
UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ...",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...",
]

# 2. 频率限制
# 应对：随机延迟
import asyncio
async def polite_fetch(url):
    await asyncio.sleep(random.uniform(1, 3))  # 随机 1-3 秒延迟
    return await client.get(url)

# 3. IP 封禁
# 应对：使用代理池
class ProxyPool:
    def __init__(self, proxies: list[str]):
        self.proxies = proxies
        self.current = 0
    
    def next(self) -> str:
        proxy = self.proxies[self.current]
        self.current = (self.current + 1) % len(self.proxies)
        return proxy

# 4. Cookie/Session 要求
# 应对：先访问首页获取 Cookie
async def get_session_cookies(base_url: str) -> dict:
    response = await client.get(base_url)
    return dict(response.cookies)

# 5. JavaScript 渲染
# 应对：使用 Playwright/Selenium
from playwright.async_api import async_playwright

async def fetch_with_js(url: str) -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        await page.wait_for_load_state("networkidle")
        content = await page.content()
        await browser.close()
        return content

# 6. 字体加密/图片验证码
# 应对：OCR 或手动处理（见下一节）
```

### 3.3 现代爬虫框架

```python
# Scrapy — 最成熟的爬虫框架
# scrapy.cfg + spiders/my_spider.py

import scrapy

class MySpider(scrapy.Spider):
    name = "my_spider"
    start_urls = ["https://example.com/items"]
    
    custom_settings = {
        "CONCURRENT_REQUESTS": 8,        # 并发数
        "DOWNLOAD_DELAY": 1,             # 下载延迟
        "ROBOTSTXT_OBEY": True,          # 遵守 robots.txt
        "USER_AGENT": "MyBot/1.0",       # UA
        "ITEM_PIPELINES": {
            "myproject.pipelines.JsonWriterPipeline": 300,
        },
    }
    
    def parse(self, response):
        for item in response.css("div.item"):
            yield {
                "title": item.css("h2::text").get(),
                "link": item.css("a::attr(href)").get(),
            }
        
        # 翻页
        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)
```

---

## 四、人机验证（CAPTCHA）

### 4.1 CAPTCHA 的类型

```python
CAPTCHA_TYPES = {
    "文字验证码": {
        "原理": "扭曲的文字，让人辨认",
        "难度": "低",
        "应对": "OCR (Tesseract/EasyOCR)",
    },
    "滑块验证码": {
        "原理": "拖动滑块到正确位置",
        "难度": "中",
        "应对": "模拟拖动 + 图像识别缺口位置",
    },
    "点选验证码": {
        "原理": "按顺序点击图中的文字/物体",
        "难度": "中",
        "应对": "目标检测模型 (YOLO)",
    },
    "reCAPTCHA v2": {
        "原理": "点击'我不是机器人'，可能弹出图片选择",
        "难度": "高",
        "应对": "打码平台 / 2Captcha",
    },
    "reCAPTCHA v3": {
        "原理": "无感评分，根据行为判断",
        "难度": "极高",
        "应对": "模拟正常用户行为 / 指纹浏览器",
    },
    "Cloudflare Turnstile": {
        "原理": "类似 reCAPTCHA v3 的无感验证",
        "难度": "极高",
        "应对": "难度很大，建议绕过而不是破解",
    }
}
```

### 4.2 应对策略

```python
# ===== 策略一：OCR 识别简单验证码 =====
import easyocr

reader = easyocr.Reader(['en', 'ch_sim'])

def solve_text_captcha(image_path: str) -> str:
    """用 OCR 识别文字验证码"""
    results = reader.readtext(image_path)
    text = "".join([r[1] for r in results])
    return text

# ===== 策略二：打码平台 =====
import httpx

async def solve_via_platform(image_bytes: bytes, api_key: str) -> str:
    """通过打码平台解决验证码"""
    async with httpx.AsyncClient() as client:
        # 上传图片
        upload = await client.post(
            "https://2captcha.com/in.php",
            data={"key": api_key, "method": "base64"},
            files={"file": image_bytes},
        )
        captcha_id = upload.text.split("|")[1]
        
        # 等待结果
        import asyncio
        for _ in range(30):
            await asyncio.sleep(5)
            result = await client.get(
                "https://2captcha.com/res.php",
                params={"key": api_key, "action": "get", "id": captcha_id},
            )
            if result.text != "CAPCHA_NOT_READY":
                return result.text.split("|")[1]
    
    return None

# ===== 策略三：绕过而不是破解 =====
# 很多时候，最好的策略是避免触发验证码：
# 1. 降低请求频率
# 2. 使用真实浏览器指纹
# 3. 携带正确的 Cookie 和 Header
# 4. 使用 Selenium/Playwright 模拟真人操作
```

### 4.3 道德与法律边界

```python
# ⚠️ 重要提醒
ETHICS = {
    "可以做": [
        "爬取公开数据用于个人学习",
        "遵守 robots.txt 的爬取",
        "合理频率，不给对方服务器造成压力",
        "使用公开 API",
    ],
    "不要做": [
        "绕过付费墙爬取付费内容",
        "爬取个人隐私数据",
        "恶意刷接口",
        "破解验证码用于批量注册",
        "任何违法行为",
    ],
}
```

---

## 参考资料

- [Nginx 官方文档](https://nginx.org/en/docs/) — Nginx 配置参考
- [frp 项目](https://github.com/fatedier/frp) — 内网穿透工具
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — CF 穿透
- [Scrapy 官方文档](https://docs.scrapy.org/) — 爬虫框架
- [Playwright 文档](https://playwright.dev/) — 浏览器自动化
- [Tailscale 文档](https://tailscale.com/kb/) — 零配置 VPN
- [Let's Encrypt](https://letsencrypt.org/) — 免费 SSL 证书
