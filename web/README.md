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

拼图各模式分别保存进度，刷新默认显示轻松方形，重新选择原模式可继续。旧 HTML 拼图存档不自动迁移到 React。支持鼠标拖放，触控与键盘采用先选碎片再选目标位置。

不规则模式使用可复现的扰动网格和共用凹凸边界，仍有大致行列结构。暂未加入旋转、自由散放、碎片成组合并、声音生成或视频。

## 检查

```bash
npm test
npm run test:model
npm run test:dom
npm run build
npx playwright install chromium
npm run test:browser
```

浏览器脚本会启动本地 5174 服务，在隔离的浏览器上下文中重置测试进度，结束后停止服务。截图写入 `docs/screenshots/`。`CHROMIUM_PATH` 可指定已有 Chromium，`PLAYWRIGHT_MODULE` 可指定已有 Playwright 包，仅为测试环境兼容项。

图片来自收藏中的 A0243，来源与范围说明见 [素材说明](../docs/ART_SOURCE.md)。
