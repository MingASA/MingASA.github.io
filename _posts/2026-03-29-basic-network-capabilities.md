---
title: "基本网络能力：代理、TUN 模式与流量管控"
date: 2026-03-29 01:00:00 +0800
categories: [网络, 基础设施]
tags: [proxy, tun, clash, network, vpn, fingerprint-browser]
---

> **你可以跳过这篇文章，如果你：** 已经熟练使用代理工具，理解 TUN 模式、透明代理、流量分流的工作原理。
>
> **这篇文章在讲什么：** 代理的基本原理、TUN 模式与系统代理的区别、Clash 配置、网络诊断命令、指纹浏览器。
>
> **看完你能做到：** 配置和管理代理环境；用命令行诊断网络问题；理解透明代理和 TUN 模式的原理；使用指纹浏览器管理多账号。

---

## 一、代理基础：从 SOCKS5 到 HTTP 代理

### 1.1 什么是代理

代理（Proxy）是你的设备和目标服务器之间的"中间人"。你的请求先发给代理服务器，代理服务器再转发给目标。

```
有代理（以 Shadowsocks 为例，数据经过加密）：
你的电脑 ────→ 代理服务器 ────→ 目标服务器
         (加密传输)    (转发)

有代理（HTTP/SOCKS5，无额外加密）：
你的电脑 ────→ 代理服务器 ────→ 目标服务器
         (明文/HTTPS)  (转发)
```

### 1.2 代理协议对比

| 协议 | 层级 | 支持 HTTPS | 性能 | 适用场景 |
|:---:|:---:|:---:|:---:|:---|
| HTTP 代理 | 应用层 | ✅ (CONNECT) | 中 | 浏览器上网 |
| SOCKS5 | 会话层 | ✅ (原生) | 高 | 通用代理 |
| Shadowsocks | 应用层 | ✅ (加密) | 高 | 科学上网 |
| VMess/VLESS | 应用层 | ✅ (加密) | 高 | 科学上网 (Xray) |
| Hysteria2 | 应用层 | ✅ (QUIC) | 弱网优化 | 高丢包/高延迟网络 |

```bash
# 测试代理是否工作
curl -x socks5://127.0.0.1:1080 https://httpbin.org/ip
curl -x http://127.0.0.1:8080 https://httpbin.org/ip

# Python 中使用代理
import requests

# HTTP 代理
proxies = {
    'http': 'http://127.0.0.1:8080',
    'https': 'http://127.0.0.1:8080',
}
r = requests.get('https://httpbin.org/ip', proxies=proxies)

# SOCKS5 代理
proxies = {
    'http': 'socks5://127.0.0.1:1080',
    'https': 'socks5://127.0.0.1:1080',
}
r = requests.get('https://httpbin.org/ip', proxies=proxies)
```

---

## 二、系统代理 vs TUN 模式

### 2.1 系统代理（System Proxy）

系统代理是**应用层**的代理。只有主动读取系统代理设置的应用才会走代理。

```
浏览器 ──读取系统代理──→ 代理服务器 ──→ 目标
终端命令 ──不读取──→ 直连（不走代理！）──→ 目标
```

**局限：**
- 终端命令（curl, git, apt）默认不走系统代理
- 需要手动设置 `http_proxy` 环境变量
- 某些应用根本不支持代理设置

```bash
# 临时设置终端代理
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890

# 取消代理
unset http_proxy https_proxy all_proxy

# 只对单条命令使用代理
http_proxy=http://127.0.0.1:7890 curl https://google.com
```

### 2.2 TUN 模式（透明代理）

TUN 模式是**网络层**的代理。它在操作系统层面拦截所有网络流量。

```
任何应用 ──→ TUN 虚拟网卡 ──→ 代理程序 ──→ 代理服务器 ──→ 目标
          (自动拦截)      (分流判断)
```

**优势：**
- **所有应用**自动走代理，无需配置
- 终端命令、游戏、系统更新都走代理
- 可以做精细的分流规则

```yaml
# Clash TUN 模式配置示例
tun:
  enable: true
  stack: system    # 或 gvisor
  dns-hijack:
    - any:53       # 劫持 DNS 请求
  auto-route: true # 自动设置路由
  auto-detect-interface: true  # 自动检测网卡
```

### 2.3 如何选择

```python
def choose_proxy_mode(scenario):
    """根据场景选择代理模式"""
    if scenario == "只用浏览器上网":
        return "系统代理"  # 最简单
    elif scenario == "终端也要走代理":
        return "设置环境变量 或 TUN 模式"
    elif scenario == "所有流量都要代理":
        return "TUN 模式"  # 最彻底
    elif scenario == "路由器级别代理":
        return "透明代理 (iptables/nftables)"
    else:
        return "不确定，请补充场景"

# 试试不同的场景
for s in ["只用浏览器上网", "终端也要走代理", "所有流量都要代理"]:
    print(f"{s} → {choose_proxy_mode(s)}")
```
{: run="python" }

---

## 三、Clash 配置实战

### 3.1 Clash 配置文件结构

```yaml
# Clash 配置文件基本结构
mixed-port: 7890          # 混合代理端口
allow-lan: false           # 是否允许局域网连接
mode: rule                 # 代理模式：rule/global/direct
log-level: info            # 日志级别

# DNS 配置
dns:
  enable: true
  listen: 0.0.0.0:53
  nameserver:
    - 223.5.5.5      # 阿里 DNS
    - 119.29.29.29   # 腾讯 DNS
  fallback:
    - 8.8.8.8        # Google DNS
    - 1.1.1.1        # Cloudflare DNS
  fake-ip-filter:
    - "*.lan"
    - "*.local"

# 代理节点
proxies:
  - name: "节点1"
    type: vmess
    server: example.com
    port: 443
    uuid: xxx-xxx-xxx
    alterId: 0
    cipher: auto
    tls: true

# 代理组（策略组）
proxy-groups:
  - name: "自动选择"
    type: url-test
    proxies:
      - "节点1"
      - "节点2"
    url: "http://www.gstatic.com/generate_204"
    interval: 300

  - name: "手动选择"
    type: select
    proxies:
      - "自动选择"
      - "节点1"
      - "节点2"
      - DIRECT

# 分流规则（从上到下匹配，第一个匹配的生效）
rules:
  # 国内直连
  - GEOIP,CN,DIRECT
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-KEYWORD,baidu,DIRECT
  # 广告拦截
  - DOMAIN-SUFFIX,ads.com,REJECT
  # 其他走代理
  - MATCH,手动选择
```

### 3.2 分流规则的逻辑

```python
# Clash 规则匹配逻辑（简化版）
def match_rule(packet, rules):
    """从上到下匹配规则，第一个匹配的生效"""
    for rule in rules:
        if rule.type == "DOMAIN-SUFFIX":
            if packet.domain.endswith(rule.value):
                return rule.action
        elif rule.type == "DOMAIN-KEYWORD":
            if rule.value in packet.domain:
                return rule.action
        elif rule.type == "IP-CIDR":
            if ip_in_cidr(packet.ip, rule.value):
                return rule.action
        elif rule.type == "GEOIP":
            if get_ip_country(packet.ip) == rule.value:
                return rule.action
        elif rule.type == "MATCH":
            return rule.action  # 兜底规则
    return "DIRECT"  # 默认直连
```

---

## 四、网络指令诊断

### 4.1 常用网络诊断命令

```bash
# ===== 连通性测试 =====
ping google.com                    # ICMP 测试
ping -c 4 google.com               # 只 ping 4 次
traceroute google.com              # 路由追踪
mtr google.com                     # 实时路由追踪（推荐）

# ===== DNS 诊断 =====
nslookup google.com                # DNS 查询
dig google.com                     # 详细 DNS 查询
dig @8.8.8.8 google.com           # 指定 DNS 服务器
host google.com                    # 简单 DNS 查询

# ===== 端口和连接 =====
ss -tlnp                           # 查看监听端口
ss -tnp                            # 查看 TCP 连接
netstat -tlnp                      # 旧版查看端口
curl -v https://google.com 2>&1 | head -20  # HTTP 连接详情

# ===== SSL/TLS 诊断 =====
openssl s_client -connect google.com:443     # SSL 连接测试
curl -I https://google.com                   # HTTP 头信息
curl -o /dev/null -s -w "%{http_code}" URL   # 只看状态码

# ===== 带宽和延迟 =====
iperf3 -s                          # 启动带宽测试服务端
iperf3 -c server-ip                # 客户端测试带宽
speedtest-cli                      # 测速
```

### 4.2 网络诊断决策树

```
网络不通？
  │
  ├─→ ping 目标 IP
  │     ├─→ 不通 → 检查防火墙/路由
  │     └─→ 通 → 继续
  │
  ├─→ ping 目标域名
  │     ├─→ 不通（IP 通） → DNS 问题
  │     └─→ 通 → 继续
  │
  ├─→ curl -v 目标 URL
  │     ├─→ Connection refused → 端口未开放
  │     ├─→ Connection timeout → 网络不通或被墙
  │     ├─→ SSL error → 证书问题
  │     └─→ 200 OK → 正常
  │
  └─→ 检查代理
        ├─→ 代理是否运行？
        ├─→ 代理规则是否正确？
        └─→ 是否需要 TUN 模式？
```

```python
# 自动化网络诊断脚本
import subprocess
import sys

def diagnose(target: str):
    """自动诊断网络问题"""
    print(f"=== 诊断目标: {target} ===\n")
    
    # 1. DNS 解析
    print("[1] DNS 解析...")
    result = run(f"dig +short {target}")
    if result:
        print(f"    ✅ 解析到: {result}")
    else:
        print("    ❌ DNS 解析失败")
        return "DNS 问题：检查 DNS 配置或域名是否正确"
    
    # 2. ICMP 连通性
    print("[2] Ping 测试...")
    result = run(f"ping -c 2 -W 3 {target}")
    if "0% packet loss" in result:
        print("    ✅ Ping 通")
    else:
        print("    ❌ Ping 不通或丢包")
    
    # 3. TCP 连接
    print("[3] TCP 连接测试...")
    result = run(f"timeout 5 bash -c 'echo > /dev/tcp/{target}/443' 2>&1")
    if not result:
        print("    ✅ TCP 443 端口可达")
    else:
        print("    ❌ TCP 443 端口不可达")
    
    # 4. HTTPS 握手
    print("[4] HTTPS 握手...")
    result = run(f"curl -sI --max-time 5 https://{target} | head -1")
    if "200" in result or "301" in result or "302" in result:
        print(f"    ✅ HTTPS 正常: {result}")
    else:
        print(f"    ❌ HTTPS 异常: {result}")

def run(cmd):
    try:
        return subprocess.check_output(
            cmd, shell=True, stderr=subprocess.STDOUT
        ).decode().strip()
    except:
        return ""

if __name__ == "__main__":
    diagnose(sys.argv[1] if len(sys.argv) > 1 else "google.com")
```

---

## 五、指纹浏览器

### 5.1 什么是浏览器指纹

网站可以通过收集你的浏览器特征来"指纹识别"你，即使你清除了 Cookie：

```javascript
// 网站可以收集的浏览器特征
const fingerprint = {
  userAgent: navigator.userAgent,        // 浏览器标识
  screenResolution: `${screen.width}x${screen.height}`,  // 屏幕分辨率
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,  // 时区
  language: navigator.language,          // 语言
  platform: navigator.platform,          // 操作系统
  plugins: navigator.plugins.length,     // 插件数量
  canvas: getCanvasFingerprint(),        // Canvas 渲染特征
  webgl: getWebGLFingerprint(),         // WebGL 特征
  fonts: getInstalledFonts(),            // 已安装字体
  audio: getAudioContextFingerprint(),   // 音频上下文特征
};

// 试试看你自己的浏览器指纹（去掉上面那些未定义的函数调用）
console.log("UA:", navigator.userAgent);
console.log("屏幕:", screen.width + "x" + screen.height);
console.log("时区:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("语言:", navigator.language);
console.log("平台:", navigator.platform);
```
{: run="javascript" }

### 5.2 指纹浏览器的作用

指纹浏览器为每个账号创建独立的浏览器环境，每个环境有不同的指纹：

```python
# 指纹浏览器的核心原理
class FingerprintBrowser:
    def __init__(self, profile_id):
        self.profile = {
            "userAgent": random_ua(),           # 随机 UA
            "screenResolution": random_res(),   # 随机分辨率
            "timezone": random_tz(),            # 随机时区
            "language": random_lang(),          # 随机语言
            "webgl": random_webgl(),            # 随机 WebGL 渲染
            "canvas": random_canvas_noise(),    # Canvas 噪声
            "proxy": assign_proxy(profile_id),  # 独立代理 IP
        }
    
    def launch(self):
        """启动一个独立指纹的浏览器实例"""
        # 每个 profile 有独立的：
        # - Cookie/LocalStorage
        # - 浏览器指纹
        # - 代理 IP
        # - 缓存和历史
        pass
```

### 5.3 常用指纹浏览器

| 工具 | 价格 | 特点 |
|:---|:---:|:---|
| Multilogin | 付费 | 业界标杆，指纹隔离最彻底 |
| AdsPower | 免费/付费 | 国产，性价比高 |
| GoLogin | 付费 | 云端同步，API 友好 |
| 海豚浏览器 | 免费/付费 | 适合社交媒体管理 |
| Firefox + 插件 | 免费 | 手动配置，学习用 |

---

## 参考资料

- [Clash 配置文档](https://github.com/Dreamacro/clash/wiki/Configuration) — Clash 官方配置指南
- [Xray 配置指南](https://xtls.github.io/) — Xray 官方文档
- [浏览器指纹检测](https://coveryourtracks.eff.org/) — EFF 的指纹检测工具
- [MDN Web API: Navigator](https://developer.mozilla.org/en-US/docs/Web/API/Navigator) — 浏览器 API 文档
- [网络诊断工具 ss](https://man7.org/linux/man-pages/man8/ss.8.html) — ss 命令手册
- [iptables 指南](https://wiki.archlinux.org/title/Iptables) — Arch Linux 防火墙指南
