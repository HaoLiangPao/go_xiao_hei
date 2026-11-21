# 角色审美审核Agent首次试用

仓库提供的是可复用Skill和独立审阅指令，不是新安装的美术模型，也不保证每次打分绝对一致。

调用：使用 `$character-art-review`，提供候选版本、选定形态的原作参考、电脑/手机画面及动作画面。能使用独立Agent时，由未参与制作的审阅者审阅；修改者随后按结论修订，再提交可比对的下一版。

第一次独立试用针对建模PR18初版d856794：审阅者实际查看3张参考与5张候选，校验候选截图Git blob；结论为CHANGES_REQUESTED。优先项是眼脸占比、耳头连接、爪与躯干连续性，另发现小三角嘴缺失、眼片凸起和线条/材质不一致。动作、原作背面与黑咻细部证据不足，保留INCOMPLETE，没有因构建成功而判美术通过。

依据试用反馈，Skill增加“每轮一张主参考”、固定机位与单独的等高轮廓对照、缺证据逐项列出的说明。Skill结构校验通过；真实独立试用证明能产生具体可复核意见，不能由此推断模型已经通过。

初版候选：[电脑](https://raw.githubusercontent.com/HaoLiangPao/go_xiao_hei/d856794592831084685e55340bd88af7229950d6/docs/screenshots/model-lab/desktop-xiaohei.png)、[手机](https://raw.githubusercontent.com/HaoLiangPao/go_xiao_hei/d856794592831084685e55340bd88af7229950d6/docs/screenshots/model-lab/mobile-xiaohei.png)。原作参考在既有人物图册。完整模型审核与修订记录随PR18维护。
