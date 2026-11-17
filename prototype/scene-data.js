/* Plain script keeps double-click / file:// play working without fetch or modules. */
window.SHIGUANG_SCENE = {
  id: 'borrow-a-light', version: 2,
  palette: [
    {id:'moss', name:'苔青', value:'#658c72'},
    {id:'rain', name:'雨蓝', value:'#789eae'},
    {id:'wood', name:'木棕', value:'#b98b61'},
    {id:'sun', name:'灯黄', value:'#e7bc68'},
    {id:'petal', name:'花粉', value:'#cf9290'}
  ],
  regions: [
    {id:'roof', name:'屋檐', suggested:'rain'},
    {id:'wall', name:'屋墙', suggested:'sun'},
    {id:'window', name:'窗框', suggested:'moss'},
    {id:'table', name:'木桌', suggested:'wood'},
    {id:'ground', name:'石阶', suggested:'rain'},
    {id:'plant', name:'门边的叶子', suggested:'moss'}
  ],
  objects: [
    {id:'tile', name:'一片瓦', icon:'tile', needs:['roof','wall'], after:null, targets:['roof-gap'], instruction:'把瓦片放回屋檐上的缺口。'},
    {id:'cup', name:'一杯热茶', icon:'cup', needs:['table','window'], after:'tile', targets:['table-top'], instruction:'把热茶放在木桌上的杯垫处。'},
    {id:'lamp', name:'一盏灯', icon:'lamp', needs:['ground','plant'], after:'cup', targets:['door-hook','window-hook'], instruction:'把灯挂在门边或窗边，选一个喜欢的位置。'}
  ],
  targets: [
    {id:'roof-gap', object:'tile', name:'屋檐缺口', x:416, y:166},
    {id:'table-top', object:'cup', name:'桌上杯垫', x:403, y:358},
    {id:'door-hook', object:'lamp', name:'门边灯钩', x:529, y:251},
    {id:'window-hook', object:'lamp', name:'窗边灯钩', x:230, y:251}
  ],
  opening: {title:'借一盏灯', text:'雨追着小黑跑到旧屋前。屋里的人正望着山路：“他还没回来。先替我补一片瓦，好吗？”'},
  events: [
    {object:'tile', title:'屋檐下的一小块晴天', text:'瓦片咔哒一声合上，檐下的水线断了。小黑从湿漉漉的角落挪出来：“这里不下雨了。”主人笑着搬来一张小桌。'},
    {object:'cup', title:'留一口热的', text:'热茶放稳，白汽轻轻升起来。小黑伸手想碰杯沿，又缩回爪子。“这杯留给赶路的人。”主人说，“他总说自己不怕冷。”'},
    {object:'lamp', title:'原来是在等我', text:'山路上传来脚步声。归人收起伞，双手捧住你留下的茶。小黑把位置让出来：“还有热的。”屋里的人说：“嗯，刚刚好。”', choices:{'door-hook':'灯挂在门边，把最后一级石阶照得亮亮的。小黑说：“这样就不会踩空了。”','window-hook':'灯挂在窗边，暖光越过雨帘。小黑说：“远远就能看见家了。”'}}
  ]
};
