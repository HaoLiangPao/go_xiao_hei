import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/world/world-model.js');
const M=globalThis.PixelWorld;
test('三户家门均可连通，路径绕开房屋与河流，去爷爷家必须过桥',()=>{
  let start={...M.spawn};
  for(const home of M.homes){
    const path=M.findPath(start,home.door);assert.ok(path.length>1);
    for(let i=0;i<path.length;i++){
      const p=path[i],x=Math.floor(p.x/M.TILE),y=Math.floor(p.y/M.TILE);
      assert.ok(M.canStand(p.x,p.y));assert.ok(!M.blocked(x,y));
      if(i)assert.equal(Math.abs(p.x-path[i-1].x)+Math.abs(p.y-path[i-1].y),M.TILE);
      if(x>=28&&x<=30)assert.ok(y===20||y===21);
    }
    if(home.id==='grandpa')assert.ok(path.some(p=>Math.floor(p.x/M.TILE)===29));
    const end=path.at(-1);assert.equal(M.nearHome(end)?.id,home.id);start=end;
  }
});
test('连续移动与大步长仍不能穿墙、入水或出界，桥面可以通过',()=>{
  const wall={x:136,y:200};M.move(wall,0,-100);assert.ok(wall.y>=195);assert.ok(M.canStand(wall.x,wall.y));
  const water={x:440,y:200};M.move(water,200,0);assert.ok(water.x<448);assert.ok(M.canStand(water.x,water.y));
  const bridge={x:440,y:328};M.move(bridge,80,0);assert.ok(Math.abs(bridge.x-520)<1e-6);
  const edge={x:24,y:24};M.move(edge,-100,-100);assert.ok(edge.x>=20&&edge.y>=19);
});
test('不为阻挡区生成路线，远处不能拜访；路线可用真实步进完成',()=>{
  assert.equal(M.findPath(M.spawn,[29,10]).length,0);assert.equal(M.findPath(M.spawn,[8,9]).length,0);assert.equal(M.nearHome(M.spawn),undefined);
  const player={...M.spawn};
  for(const p of M.findPath(player,M.homes[2].door)){
    for(let i=0;i<50&&Math.hypot(p.x-player.x,p.y-player.y)>.01;i++){
      const d=Math.hypot(p.x-player.x,p.y-player.y),step=Math.min(1,d);
      assert.ok(M.move(player,(p.x-player.x)/d*step,(p.y-player.y)/d*step));
    }
    assert.ok(Math.hypot(p.x-player.x,p.y-player.y)<.01);
  }
  assert.equal(M.nearHome(player)?.id,'grandpa');
});
