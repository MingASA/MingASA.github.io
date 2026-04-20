---
title: "生成图片素材"
date: 2026-04-16 10:00:00 +0800
description: AI 生图流程与基本知识。
categories: [AI, 图像生成]
tags: [nanobanana, ai绘图, 素材生成, frontend, 入门]
likes: 2
---

现在大家几乎都在用AI生图。国内豆包点击即出图，非常好用。但对于特定生产环境需要快速出大量图片的情况，人使用手工去点击、等待就非常低效。所以以nanobanana为例记录一个使用API和自动程序生图的方式。

## 一、接入nanobanana

当前主流大模型已经具备图像生成和图像编辑能力。只要你给出文字描述，它就可以生成一张对应的图；如果你额外提供参考图，它也可以在原图基础上继续变化。
（nanobanana）

![](/assets/images/easy-vibe-lovart-assets/image1.png)

从能力逻辑上说，它和你熟悉的其他图像模型并没有本质差别，核心都是“描述输入，结果输出”。

<div class="d-flex flex-column flex-md-row gap-3">
  <img src="/assets/images/easy-vibe-lovart-assets/image2.png" alt="" class="w-100">
  <img src="/assets/images/easy-vibe-lovart-assets/image3.png" alt="" class="w-100">
  <img src="/assets/images/easy-vibe-lovart-assets/image4.png" alt="" class="w-100">
</div>


## 二、Hello World 级别的第一张图

### 1. 新建一个工作目录

先在 Trae 里创建一个新的文件夹，作为这次实验的工作目录。

![](/assets/images/easy-vibe-lovart-assets/image5.png)

### 2. 新建一个 Python 文件

在这个目录里新建一个 Python 文件，后面的最小示例代码就放在这里。

![](/assets/images/easy-vibe-lovart-assets/image6.png)

![](/assets/images/easy-vibe-lovart-assets/image7.png)

![](/assets/images/easy-vibe-lovart-assets/image8.png)

### 3. 粘贴一个最小可运行示例

这一步的目标不是理解所有细节，而是先把流程跑通。

如果你在 Trae 中直接执行，很多基础依赖会自动安装。你需要自己准备的是图像模型的 API 地址与 API Key。只要这两个参数可用，就可以开始第一次生成。

下面是一份最小思路版本的示例代码。它做的事情很简单：

- 接收提示词
- 调用图像生成接口
- 从响应里取回图片数据
- 把结果显示或保存出来

```python
import base64
import io
import os
import requests
from PIL import Image

API_URL = "YOUR_API_URL"
API_KEY = "YOUR_API_KEY"
OUTPUT_DIR = "outputs"

os.makedirs(OUTPUT_DIR, exist_ok=True)


def save_base64_image(data: str, filename: str) -> str:
    image_bytes = base64.b64decode(data)
    image = Image.open(io.BytesIO(image_bytes))
    path = os.path.join(OUTPUT_DIR, filename)
    image.save(path)
    return path


def generate_image(prompt: str) -> str:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    payload = {
        "model": "gemini-2.5-flash-image",
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "stream": False,
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    response.raise_for_status()

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    if isinstance(content, list):
        for part in content:
            image_url = part.get("image_url", {})
            url = image_url.get("url", "")
            if url.startswith("data:image/") and "," in url:
                return save_base64_image(url.split(",", 1)[1], "first-image.png")

    raise RuntimeError("没有从返回结果中提取到图片数据")


if __name__ == "__main__":
    path = generate_image("A red apple")
    print("图片已生成：", path)
```

如果你希望做成一个可交互的小界面，也可以再往外包一层 Gradio。

## 三、运行成功后，你会看到什么

当环境、密钥和接口都正常时，执行完代码后，你会拿到一个本地访问地址，或者直接在本地目录里看到结果文件。

如果你做的是界面形式，通常会看到一个简单的输入区和展示区：

![](/assets/images/easy-vibe-lovart-assets/image9.png)

这个界面虽然简单，但已经有了最重要的两种生图能力：

- **文生图**：只输入文字描述，不上传参考图
- **图生图**：上传一张参考图，再通过描述让模型改写或延展

![](/assets/images/easy-vibe-lovart-assets/image10.png)

一个典型界面通常分成两部分：

- 左侧是输入区：提示词、可选参考图、提交按钮
- 右侧是输出区：模型生成的图片

这已经是一个完整的闭环了。

## 四、验证

验证一下可行性：

```text
A red apple
```

我们要验证下面几件事：

- 请求是否真正发到了模型
- 模型是否返回了图像结果
- 程序是否成功解析并保存了图片


图像生成通常带有随机性，提示词完全一样的情况下，多跑几次的结果也可能不同。

<div class="d-flex flex-column flex-md-row gap-3">
  <img src="/assets/images/easy-vibe-lovart-assets/image11.png" alt="" class="w-100">
  <img src="/assets/images/easy-vibe-lovart-assets/image12.png" alt="" class="w-100">
</div>

## 五、试试提示词

确认跑通之后，看看丰富提示词的效果：


```text
A hyper-realistic close-up of a fresh red apple with water droplets on its skin, sitting on a dark rustic wooden table. Cinematic dramatic lighting, rim light, shallow depth of field, bokeh background, 8k resolution, macro photography.
```

我们比 `A red apple` 多加了主体、画面距离、材质细节、光照、背景效果、风格倾向等信息，效果明显变好了：

![](/assets/images/easy-vibe-lovart-assets/image13.png)

生成完成后，在输出区里下载结果，就能把图片保存到本地：

![](/assets/images/easy-vibe-lovart-assets/image14.png)
