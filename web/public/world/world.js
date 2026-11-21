(() => {
  const M=PixelWorld,A=PixelArt,canvas=document.querySelector('#world'),ctx=canvas.getContext('2d'),frame=document.querySelector('#map-frame');
  const dialog=document.querySelector('#conversation'),visit=document.querySelector('#visit'),location=document.querySelector('#location'),destinations=document.querySelector('#destinations');
  const player={...M.spawn,dir:'down',distance:0},visited=new Set(),keys=new Set(),pointers=new Map();
  let route=[],lastTime=0,dirty=true,scale=1,camera={x:0,y:0},near=null,lastMoving=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ground=document.createElement('canvas');ground.width=M.COLS*M.TILE;ground.height=M.ROWS*M.TILE;A.ground(ground.getContext('2d'));
  const mini=document.querySelector('#overview').getContext('2d'),labels=new Map();
  for(const home of M.homes) {
    const button=document.createElement('button');button.dataset.home=home.id;
    const name=document.createElement('span'),detail=document.createElement('small');name.textContent=home.name;detail.textContent='沿路走到门前';button.append(name,detail);
    button.addEventListener('click',()=>go(home.door,`正走向${home.name}，可随时停下。`));destinations.append(button);
    const label=document.createElement('span');label.className='home-label';label.textContent=home.name;document.querySelector('#labels').append(label);labels.set(home.id,label);
  }
  function stop(){keys.clear();pointers.clear();route=[];document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));dirty=true}
  function go(tile,message) {
    stop();route=M.findPath(player,tile);
    if(!route.length)location.textContent='这里走不到，换一块空地试试。';
    else location.textContent=message||'沿着小路，慢慢走过去。';
    canvas.focus({preventScroll:true});
  }
  function resize() {
    const width=frame.clientWidth;scale=width>=640?2:1;
    canvas.width=Math.max(240,Math.floor(Math.min(width/scale,384)/16)*16);
    canvas.height=width<640?224:256;
    canvas.style.width=canvas.width*scale+'px';canvas.style.height=canvas.height*scale+'px';
    ctx.imageSmoothingEnabled=false;dirty=true;
  }
  new ResizeObserver(resize).observe(frame);resize();
  function render(moving) {
    camera.x=Math.max(0,Math.min(M.COLS*M.TILE-canvas.width,Math.floor(player.x-canvas.width/2)));
    camera.y=Math.max(0,Math.min(M.ROWS*M.TILE-canvas.height,Math.floor(player.y-canvas.height*.6)));
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.drawImage(ground,0,0);
    const objects=M.homes.map(h=>({y:(h.y+h.h)*M.TILE,draw:()=>A.home(ctx,h)}));
    M.trees.forEach(([x,y])=>objects.push({y:y*M.TILE+15,draw:()=>A.tree(ctx,x,y)}));
    const step=moving&&!reduced.matches?Math.floor(player.distance/5)%4:0;
    objects.push({y:player.y,draw:()=>A.sprite(ctx,player.x,player.y,player.dir,step)});
    objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    if(route.length){const p=route[route.length-1];ctx.fillStyle='#f7e6bb';ctx.fillRect(p.x-2,p.y-2,4,4);ctx.fillStyle='#a57e50';ctx.fillRect(p.x-1,p.y-1,2,2)}
    ctx.restore();
    const offset=(frame.clientWidth-canvas.width*scale)/2;
    for(const h of M.homes){const label=labels.get(h.id);label.style.left=offset+((h.x+h.w/2)*M.TILE-camera.x)*scale+'px';label.style.top=(h.y*M.TILE-camera.y-4)*scale+'px'}
    A.mini(mini,player,visited);
    Object.assign(canvas.dataset,{x:player.x.toFixed(2),y:player.y.toFixed(2),direction:player.dir,moving:String(moving),step:String(step),cameraX:String(camera.x),cameraY:String(camera.y),scale:String(scale)});
  }
  function updateNear() {
    const next=M.nearHome(player);
    if(next?.id!==near?.id){near=next;location.textContent=near?`${near.name}门前 · 可以敲门了`:'小路上 · 慢慢走，不赶时间'}
    visit.disabled=!near;visit.textContent=near?`敲敲${near.name}的门`:'靠近家门后敲门';
  }
  function tick(time) {
    const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;let moving=false;
    if(!dialog.open&&!document.hidden){
      let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
      if(dx||dy)route=[];
      else if(route.length){const p=route[0],distance=Math.hypot(p.x-player.x,p.y-player.y);if(distance<1){player.x=p.x;player.y=p.y;route.shift();dirty=true}else{dx=(p.x-player.x)/distance;dy=(p.y-player.y)/distance}}
      if(dx||dy){const length=Math.hypot(dx,dy),speed=Math.min(76*dt,route.length?Math.hypot(route[0].x-player.x,route[0].y-player.y):Infinity);dx=dx/length*speed;dy=dy/length*speed;
        player.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
        const oldX=player.x,oldY=player.y;moving=M.move(player,dx,dy);player.distance+=Math.hypot(player.x-oldX,player.y-oldY);dirty=true;
        if(!moving&&route.length){route=[];location.textContent='前面有东西挡着，换条路吧。'}
      }
      updateNear();
    }
    if(dirty||moving!==lastMoving){render(moving);dirty=false}lastMoving=moving;requestAnimationFrame(tick);
  }
  const keyDirs={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
  document.addEventListener('keydown',e=>{
    if(dialog.open||e.target.closest('button,a,input,textarea,select'))return;
    if(keyDirs[e.key]){e.preventDefault();keys.add(keyDirs[e.key])}
    if(e.key==='e'||e.key==='E'||e.key==='Enter'){e.preventDefault();visitHome()}
  });
  document.addEventListener('keyup',e=>{if(keyDirs[e.key])keys.delete(keyDirs[e.key])});
  for(const button of document.querySelectorAll('[data-dir]')){
    button.addEventListener('pointerdown',e=>{if(e.button!==0||dialog.open)return;e.preventDefault();route=[];button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,button.dataset.dir);keys.add(button.dataset.dir);button.classList.add('held')});
    const release=e=>{const dir=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(dir&&![...pointers.values()].includes(dir))keys.delete(dir);button.classList.remove('held')};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  canvas.addEventListener('pointerdown',e=>{
    if(dialog.open||e.button!==0)return;e.preventDefault();const box=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-box.left)/scale+camera.x)/M.TILE),y=Math.floor(((e.clientY-box.top)/scale+camera.y)/M.TILE);
    // Tapping a visible house sends Xiaohei to its door, never through its walls.
    const home=M.homes.find(h=>x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h);
    go(home?home.door:[x,y]);
  });
  function visitHome(){
    near=M.nearHome(player);if(!near||dialog.open)return;stop();visited.add(near.id);
    document.querySelector('#scene-title').textContent=near.name+'门口';document.querySelector('#scene-text').textContent=near.text;
    document.querySelector('#visits').textContent=`本次散步 · 已拜访 ${visited.size} / 3 户`;
    for(const h of M.homes)destinations.querySelector(`[data-home=${h.id}] small`).textContent=visited.has(h.id)?'已拜访 · 还可以再去':'沿路走到门前';
    dialog.showModal();document.querySelector('#close-scene').focus();dirty=true;
  }
  visit.addEventListener('click',visitHome);document.querySelector('#close-scene').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{stop();canvas.focus({preventScroll:true})});document.querySelector('#stop').addEventListener('click',()=>{stop();location.textContent='停下来，看看街边的风景。'});
  window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{stop();lastTime=0});reduced.addEventListener('change',()=>{dirty=true});
  requestAnimationFrame(tick);
})();
