# 电影2：官方声音与角色资料入口

## 可回看的原版资料

### Takeaway
以B站版权节目条目里的预告/特辑为主，正片只给合法平台入口。平台明确的中文配音资料与实际听辨分开：本次没有可支持逐句核听的音频工具。

### Cited Findings
- [声音是这样炼成的！](https://www.bilibili.com/bangumi/play/ep2703577)，发布者：哔哩哔哩电影，类型：voice-featurette。B站公开节目目录season_id=90209列为制作特辑，无会员标签。 1905发行宣传报道对应标题“有‘声’之年”，时长5分17秒，介绍山新、刘明月、朱婧等演员。演员采访与角色台词要分开标记。
- [并肩作战！超燃一夏！](https://www.bilibili.com/bangumi/play/ep2703574)，发布者：哔哩哔哩电影，类型：trailer。正版平台电影条目的终极预告，无会员标签。不是标题中带日语配音版的日本预告。
- [罗小黑战记2 正片](https://www.bilibili.com/bangumi/play/ep2243434)，发布者：哔哩哔哩电影，类型：feature。官方目录badge=会员；只作正版回看入口，不承诺免费或全地区可看。
- [《罗小黑战记2》马来西亚官方预告](https://www.youtube.com/watch?v=Ge8dkfgh34g)，发布者：Encore Films Malaysia，类型：trailer。公开视频元数据：channel_id UCQfl2wCGnVco8O3N3X5-FiA，80秒，public，playable_in_embed=true。 GKIDS发行声明确认Encore持有东南亚等地区发行权；频道名对应发行方马来西亚频道，但本轮没有获得官网到该马来频道的直接账号链接。 官网嵌入的另一个视频xsW3MzvtfT8实际发布者是Catsuka，不应称Catsuka为版权方官方频道；本研究不将它用作演员原声验证。

### Inferences
- 公开预告适合作为人物页的回看资料，但不能等同于某个角色的独立试听；演员采访也不等于角色表演声线。

### Gaps
- 本环境原生音频输入明确返回 audio content omitted because you do not support audio input，因而没有实际听辨任何台词。
- 不把中文标题、中文配音表、Mandarin发行信息当作已经实听音轨的证明。所有记录verifiedListening=false，不填写臆测的角色台词、起止时间。
- 只链接正版平台/公开宣传，不下载整部电影或正片，不绕登录、地区与会员限制，不安装新增音频模型。

## 角色目录与设定从哪里核对

### Takeaway
官方人物设定页和实际出场名单不是同一件事；社区目录先作发现线索，再按对应篇章核对。

### Cited Findings
- [电影2日本官方人物总页](https://luoxiaohei-movie.com/2nd/character/)：官方人物设定；范围：仅电影2。12个人物：小黑、无限、鹿野、哪吒、雨笛、灵遥、西木子、池年、鸠老、潘靖、甲、乙。CV为日语版，不能抄作中文配音。
- [电影2正版平台中文演员/剧情条目](https://www.bilibili.com/bangumi/play/ep2703577)：官方平台节目元数据；范围：电影2。公开条目列中文演员，人物映射仍需宣传特辑/片尾逐个核对。
- [电影2声音特辑报道](https://www.1905.com/news/20250716/1734967.shtml)：电影频道平台宣传资料；范围：电影2。可支持朱婧配鹿野、刘明月讲无限的表演、山新声线工作；不要复制宣传语代替人物剧情。

### Inferences
- 对人物的关系、能力和具体事件只用同一版本支持；日语官网角色文字可支持设定，日语CV姓名不能换成中文原声证据。

### Gaps
- 未实听，不提供凭记忆或社区抄本凑出的台词时间码。
- 全角色名单需另一个研究员综合分集、片尾及正式角色页，本文件只给可追溯的入口。

## 本次核验怎么做

### Takeaway
已读取平台公开页面和公开节目目录，没有取正片媒体，也没有绕访问限制。

### Cited Findings
- [B站公开目录API](https://api.bilibili.com/pgc/web/season/section?season_id=90209)返回code=0，所列标题、集数、会员标签见media.json。
- [证据入口](https://api.bilibili.com/pgc/web/season/section?season_id=90209)
- [证据入口](https://www.bilibili.com/bangumi/play/ep2703577)
- [证据入口](https://www.1905.com/news/20250716/1734967.shtml)
- [证据入口](https://gkids.com/2025/08/11/gkids-secures-north-american-rights-to-chinese-smash-hit-the-legend-of-hei-2/)
- [证据入口](https://www.encorefilms.com/movie/the-legend-of-hei-2/)
- 发行方官网嵌入xsW3MzvtfT8，但实际上传者是Catsuka。这是“官网所选预告”和“版权方自有频道”应区分的例子。Ge8dkfgh34g的公开元数据确认80秒、public、可嵌入，实际音轨未核听。

### Inferences
- B站会员/限免标签会随时间变动；页面显示无会员标识也不保证海外能播。

### Gaps
- 音频输入在前一轮有界尝试中明确不支持；本轮没有重复下载短片或安装模型。
