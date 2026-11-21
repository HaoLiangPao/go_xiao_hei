/* Shared pure movement/map rules; no network, storage or DOM dependencies. */
((root) => {
  const TILE = 16, COLS = 40, ROWS = 30;
  const homes = [
    { id: 'shanxin', name: '山新家', x: 4, y: 5, w: 8, h: 7, door: [8, 12], color: 'teal', text: '小黑在门口停了停，把刚捡到的叶子放在台阶上。今天先留一份小小的问候。' },
    { id: 'xiaobai', name: '小白家', x: 17, y: 5, w: 8, h: 7, door: [21, 12], color: 'plum', text: '窗边晒着一床被子。小黑把爪子收好，乖乖坐在门前，等小白一起出门。' },
    { id: 'grandpa', name: '小白爷爷家', x: 32, y: 11, w: 7, h: 7, door: [35, 18], color: 'clay', text: '走过小桥，院子里安安静静。小黑绕着花盆看了一圈，最后挑了块暖和的地方歇脚。' },
  ];
  const trees = [[2,3],[15,3],[29,3],[37,3],[2,15],[13,14],[25,15],[30,9],[38,24],[31,26],[25,27],[17,26],[9,26],[3,25],[12,3],[26,4],[2,21],[14,27],[37,8]];
  const river = (x, y) => x >= 28 && x <= 30 && !(y >= 20 && y <= 21);
  function blocked(x, y) {
    if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1 || river(x, y)) return true;
    return homes.some(h => x >= h.x && x < h.x + h.w && y >= h.y + 2 && y < h.y + h.h) || trees.some(([tx, ty]) => x === tx && y === ty);
  }
  function canStand(x, y) {
    return [[-4,-3],[4,-3],[-4,1],[4,1]].every(([dx,dy]) => !blocked(Math.floor((x+dx)/TILE), Math.floor((y+dy)/TILE)));
  }
  function move(player, dx, dy) {
    // Substeps keep collision valid even for a delayed or large update.
    const count = Math.max(1, Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));
    let moved = false;
    for(let i=0;i<count;i++) {
      if(canStand(player.x+dx/count,player.y)) { player.x+=dx/count; moved ||= dx!==0; }
      if(canStand(player.x,player.y+dy/count)) { player.y+=dy/count; moved ||= dy!==0; }
    }
    return moved;
  }
  function findPath(start, target) {
    const sx=Math.floor(start.x/TILE), sy=Math.floor(start.y/TILE), [tx,ty]=target;
    if(blocked(sx,sy)||blocked(tx,ty)) return [];
    const key=(x,y)=>y*COLS+x, queue=[[sx,sy]], prev=new Map([[key(sx,sy),null]]);
    for(let i=0;i<queue.length;i++) {
      const [x,y]=queue[i];
      if(x===tx&&y===ty) {
        const path=[]; let k=key(x,y);
        while(k!==null) { path.push({x:(k%COLS+.5)*TILE,y:(Math.floor(k/COLS)+.5)*TILE}); k=prev.get(k); }
        return path.reverse();
      }
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
        const nx=x+dx,ny=y+dy,k=key(nx,ny);
        if(!blocked(nx,ny)&&!prev.has(k)) { prev.set(k,key(x,y)); queue.push([nx,ny]); }
      }
    }
    return [];
  }
  function nearHome(player) {
    return homes.find(h=>Math.hypot(player.x-(h.door[0]+.5)*TILE, player.y-(h.door[1]+.5)*TILE)<25);
  }
  root.PixelWorld = { TILE, COLS, ROWS, homes, trees, river, blocked, canStand, move, findPath, nearHome, spawn: {x:232,y:200} };
})(globalThis);
