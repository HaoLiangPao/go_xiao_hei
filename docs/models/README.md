# 猫形小黑与黑咻：第一次建模试验

入口：预览站点的 `/models/`，或游戏底部的“角色小工坊”。也可以直接打开 `web/public/models/index.html`，无需安装依赖、构建或联网。

| 练习稿 | GLB大小 | 内容 |
|---|---:|---|
| 猫形小黑 | 约185 KB | 较短的身体、宽脸、贴脸眼形、收尖耳根、小三角嘴和尾巴 |
| 黑咻 | 约28 KB | 圆形身体、眼睛与简化尾巴 |

两个模型用简单几何体手工搭建，非官方模型，也不是自动图片重建。参考首部电影官方小黑资料及既有人物图册的猫形/黑咻画面；没有把缺少的背面资料标为官方设定。人物和原作形象版权归原权利人。

可操作：鼠标拖动、手机单指旋转/双指缩放、正/斜侧/侧/背视角、键盘方向键/加减/Home、眨眼、小跳、下载GLB。模型切换时重置动作；浏览器减少动态效果设置会略过动作。WebGL不可用仍可选择和下载两份模型。

导出的GLB自带“小跳”关键帧；眨眼是网页内的曲面变形试验，未导出眨眼动画。导出文件已用GLTFLoader重新加载，并实播小跳关键帧核对位移；没有声称已经在Blender实机打开。暂未做骨骼、口型、精细拓扑、材质贴图或3D打印可制造性检查。

功能验证包括（不等于审美验收）：

- Node数据/资源检查、场景模型检查、23项jsdom交互检查和生产构建。
- GLB重新加载、有限顶点、与原模型包围盒一致、小跳关键帧位移。
- Chrome 1360×940、390×844、320×568：真实WebGL画面、鼠标/键盘、Chrome触屏模拟的旋转和双指缩放、多个动画帧确实变化、两个实际GLB下载、无横向溢出，返回游戏仍保留3/12进度。
- 直接file://打开静态页，拦截外网仍可操作；减少动态效果；禁用WebGL时的下载回退。
- Chrome使用软件WebGL渲染；未声称已经在实体iPhone/Android或移动GPU上测试性能。

开发时用 `npm --prefix web run models:build` 从 `web/model-lab/` 重新生成静态页面脚本和GLB；源文件/运行文件一起做SHA-256核验，避免源码改了却发布旧模型。`npm --prefix web run test:models` 验导出，`npm --prefix web run test:models-browser` 验真实浏览器。

Three.js固定0.181.2，保留MIT许可；运行时不访问CDN，没有模型权重和外部纹理。实现依据：[GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)、[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)。

下一步建议先试三个小玩法：拼图旁的角色陪伴；完成一关解锁一个动作；把角色摆到节气场景里。造型是否够像、是否喜欢这种手感，可以先用这个练习稿判断，再决定要不要做更复杂的角色。

## 独立审美审核状态

[审核Agent PR19](https://github.com/HaoLiangPao/go_xiao_hei/pull/19) 提供可复用的参考对照与审核流程。本模型已实际经过未参与制作的审阅者检查：

| 记录 | 结论与适用范围 |
|---|---|
| [初审](ART_REVIEW_INITIAL.md) | CHANGES_REQUESTED：初版眼脸比例、耳头连接、嘴和四肢组织需要修改 |
| [比例修订复审](ART_REVIEW_REVISION.md) | 正面眼脸占比、耳形和嘴明显改善；发现眨眼眼片截断，整体CHANGES_REQUESTED |
| [眨眼专项复核](ART_REVIEW_BLINK_FIX.md) | 已查看的正面/斜面帧中截断与参差缺口消除，仅该缺陷限定PASS；不覆盖整体验收 |

当前整体仍为 **CHANGES_REQUESTED**。前肢与躯干连接、描边/体块风格统一，以及最闭状态仍留细白缝，保留为P2改善项。缺少原作同姿态背面与连续动画的独立视觉复核，不作还原度PASS。浏览器检查证明动作有多个实际渲染状态和功能可用，不能代替这些审美判断。

`docs/screenshots/model-art-review/before-*` 与 `after-*` 是固定机位/画幅的比例对照；原有眨眼缺陷帧保留在该目录。`blink-fix/front-*` 与 `quarter-*` 是修后在真实WebGL中用测试时钟逐步推进抓取的张眼、半闭、最闭及重开状态，便于复核短暂中间帧；它们不是连续播放或实体手机的证据。修后普通运行采样也单独保留在 `blink-fix/blink-*`。

关于2D建模、Live2D和像素玩法的取舍，见 [路线说明](ART_DIRECTION.md)。
