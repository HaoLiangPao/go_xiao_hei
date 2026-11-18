# 验证范围

使用隔离 checkout，保留用户原目录及未提交文件。所有截图由真实 Chromium 页面操作后截取；不是 AI 生成。

| 检查 | 范围 |
|---|---|
| 剧情规则 | 4 项：前置条件、两个灯位、损坏存档校验、填色本身不推进剧情 |
| jsdom 交互 | 23 项：区域选中、悬停预览不保存、取消恢复、切换选区、确认、撤销、键盘 |
| 拼图几何与存档 | 10 项：九组合邻边完全吻合、生成可复现、非法存档过滤 |
| 生产构建 | Vite build，验证可构建的静态产物，不把 dist 提交到仓库 |
| Chromium 拼图 | 九组合全部通关；错误位置、提示、原图保护、刷新/模式存档、鼠标拖放与键盘 |
| Chromium 填色 | 选区预览与取消，补瓦、摆茶、挂灯，两个结尾、撤销、刷新、预览保护 |
| 手机与存储 | 390px 无横向溢出、触控模拟放置；存储禁用时继续游玩并提示 |

## 运行

在 `web/` 中执行 `npm ci`，再运行：

```bash
npm test
npm run test:model
npm run test:dom
npm run build
npx playwright install chromium
npm run test:browser
```

浏览器测试独立启动 5174 端口，退出时关闭。运行依赖锁在 `web/package-lock.json` 中，项目源码不依赖开发者的绝对路径。旧 HTML / file:// 和 HTTP 是不同存储环境。

限制：没有真实手机硬件测试、Safari / Firefox、帧率或延迟基准。减少动态效果通过 CSS 媒体查询支持。jsdom 不用于证明真实布局或动画流畅度。
