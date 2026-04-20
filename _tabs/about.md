---
title: 关于
icon: icon-info
order: 5
---

## 个人状态

目前就读于北京大学信息科学技术学院，24级本科生。兴趣方向为 *agent memory* 与 *自动化算子合成*。
精通使用Enter键进行代码接受，擅长软件的安装和卸载，使用物理手段进行笔记本电脑的快速开关机。

热爱打羽毛球、台球，喜欢电子音乐!

*QQ:3200593143* Welcome!

## 好像有个小按钮？

<div class="heart-runner" markdown="1">
```javascript
const box = runContext.mount({ background: '#fff', height: '300px', once: false });
const ns = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(ns, 'svg');
const path = document.createElementNS(ns, 'path');

function mix(stops, p) {
  const i = Math.min(Math.floor(p * (stops.length - 1)), stops.length - 2), t = p * (stops.length - 1) - i;
  const a = stops[i], b = stops[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

svg.setAttribute('viewBox', '6 2 88 92');
svg.setAttribute('width', '100%');
svg.setAttribute('height', '100%');
svg.style.display = 'block';
svg.style.overflow = 'visible';

path.setAttribute('d', 'M50 90C27 74 12 56 12 34C12 18 23 10 34 10C43 10 48 16 50 23C52 16 57 10 66 10C77 10 88 18 88 34C88 56 73 74 50 90Z');
path.setAttribute('fill', '#ffffff');
path.setAttribute('stroke', '#d11a2a');
path.setAttribute('stroke-width', '3.2');
path.setAttribute('stroke-linecap', 'round');
path.setAttribute('stroke-linejoin', 'round');

svg.appendChild(path);
box.appendChild(svg);

const length = path.getTotalLength();
const start = performance.now(), outlineDuration = 2400, fillDelay = outlineDuration + 120, fillDuration = 2200;
const stops = [[255, 255, 255], [255, 242, 245], [255, 220, 228], [255, 190, 203], [244, 121, 144], [209, 26, 42]];
path.style.strokeDasharray = `${length}`;
path.style.strokeDashoffset = `${length}`;

function ease(t) {
  return 1 - (1 - t) ** 3;
}

requestAnimationFrame(function draw(now) {
  const outline = Math.min((now - start) / outlineDuration, 1);
  const fill = Math.min(Math.max((now - start - fillDelay) / fillDuration, 0), 1);
  path.style.strokeDashoffset = `${length * (1 - ease(outline))}`;
  path.setAttribute('fill', mix(stops, ease(fill)));
  if (outline < 1 || fill < 1) requestAnimationFrame(draw);
});
```
{: run="javascript" }
</div>
