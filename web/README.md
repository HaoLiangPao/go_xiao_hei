# 小黑的四时拾光 · React 本地版

React 拼图与原生 SVG 填色故事共用一个本地服务。使用 Node.js 22.12 或更新版本。

```bash
cd web
npm ci
npm run dev
```

浏览器打开 http://127.0.0.1:5173/ 。停止服务按 Ctrl+C；换端口用 `npm run dev -- --port 5175`。

| 路由 | 内容 |
|---|---|
| `/` | 12 / 24 / 48 片拼图，方形、经典凹凸、不规则凹凸 |
| `/prototype/index.html` | 区域填色、补瓦、放茶、挂灯与两个结尾 |

`prototype/` 是填色页的唯一源码。`predev` / `prebuild` 从仓库根目录的 `prototype/` 生成 `web/public/prototype/`，不应手改生成副本。Vite 的构建输出 `dist/` 不提交。

拼图各模式分别保存进度，刷新记住上次模式，首次打开默认轻松经典拼图。旧 HTML 拼图存档不自动迁移到 React。鼠标与触控均支持浮动拖拽和磁吸，也保留先选碎片再选目标位置的点击 / 键盘方式。

不规则模式使用可复现的扰动网格和共用凹凸边界，仍有大致行列结构。本轮增加手机单屏布局、指针悬浮拖动、磁吸、区域字幕和雨声与伞面雨滴声、可单独关闭的背景音乐、可选系统中文朗读。仍未加入旋转、自由散放、碎片成组合并、AI 配音或视频。详见 [2D 拼图说明](../docs/PUZZLE_2D.md)。

## 检查

```bash
npm test
npm run test:model
npm run test:dom
npm run build
npx playwright install chromium
npm run test:browser
```

浏览器脚本会启动本地 5174 服务，在隔离的浏览器上下文中重置测试进度，结束后停止服务。本轮浏览器脚本专注拼图；截图写入 `docs/screenshots/puzzle-2d/`。原生填色测试另见仓库根目录的测试脚本。`CHROMIUM_PATH` 可指定已有 Chromium，`PLAYWRIGHT_MODULE` 可指定已有 Playwright 包，仅为测试环境兼容项。

《雨水》《春分》《谷雨》图像来自已有收藏，来源见 [素材说明](../docs/ART_SOURCE.md)。

普通中文配音试听及本地音频准备见 [中文配音说明](../docs/CHINESE_VOICE.md)。
