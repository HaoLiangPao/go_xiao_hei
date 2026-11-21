/* Original code-drawn pixel tiles and sprites. No imported game artwork. */
((root) => {
  const M=root.PixelWorld, T=M.TILE;
  const P={grass:'#9bad6b',light:'#b0bd7c',dark:'#8a9e60',ink:'#28352b',tree:'#52734d',leaf:'#6e8c54',sun:'#90a365',path:'#d7bd87',edge:'#b99b6c',water:'#6ca7a2',deep:'#568e8c',foam:'#a6cbc0',wood:'#a57e50',cream:'#f7e6bb',line:'#4d3528',cat:'#202b27',catLight:'#303c31',ear:'#79a578'};
  const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
  function ground(c) {
    for(let y=0;y<M.ROWS;y++) for(let x=0;x<M.COLS;x++) {
      rect(c,x*T,y*T,T,T,P.grass);
      const seed=(x*97+y*53)%19;
      if(seed<7){rect(c,x*T+seed+3,y*T+5,2,2,P.dark);rect(c,x*T+seed+4,y*T+3,1,2,P.light)}
      if(seed===9) {rect(c,x*T+9,y*T+10,2,2,'#d9d391');rect(c,x*T+10,y*T+9,1,1,'#f4e6b7')}
    }
    const road=(x,y,w,h)=>{
      rect(c,x*T,y*T,w*T,h*T,P.edge);rect(c,x*T+1,y*T+1,w*T-2,h*T-2,P.path);
      for(let i=0;i<w*T;i+=17) rect(c,x*T+i+3,y*T+8,2,1,'#c4a977');
    };
    road(6,19,32,3);road(7,12,3,9);road(20,12,3,9);road(7,12,16,2);road(34,18,3,3);
    // A narrow river with an actual walkable bridge. Banks stay consistent.
    rect(c,28*T-2,0,3*T+4,M.ROWS*T,P.edge);
    rect(c,28*T,0,3*T,M.ROWS*T,P.water);
    for(let y=0;y<M.ROWS*T;y+=16) {
      rect(c,28*T+3,y+3,11,1,P.foam);rect(c,29*T+4,y+10,15,1,P.deep);rect(c,30*T+4,y+5,8,1,P.foam);
      rect(c,28*T-2,y,2,8,'#7b9361');rect(c,31*T,y+7,2,9,'#7b9361');
    }
    rect(c,27*T,20*T,5*T,2*T,P.ink);
    for(let x=27*T+1;x<32*T;x+=5) {rect(c,x,20*T+2,4,2*T-4,'#c6a474');rect(c,x+1,20*T+5,1,18,'#d6b484')}
    rect(c,27*T,20*T,5*T,3,'#765d41');rect(c,27*T,22*T-3,5*T,3,'#765d41');
    // Flower beds, drying clothes and garden details, all on the same grid.
    for(const [bx,by] of [[13,8],[25,8],[32,23],[7,24]]) {
      rect(c,bx*T,by*T,27,17,'#837c50');rect(c,bx*T+1,by*T+1,25,15,'#a98f61');
      for(let i=0;i<4;i++){rect(c,bx*T+3+i*6,by*T+6,2,6,P.tree);rect(c,bx*T+2+i*6,by*T+4,4,3,i%2?'#dfc985':'#c28272')}
    }
    // The perimeter is a visible boundary; no invisible exits.
    for(let x=0;x<M.COLS;x++) if(x<28||x>30){rect(c,x*T,8,T,3,'#7b8151');rect(c,x*T+3,3,3,12,'#73794b');rect(c,x*T,(M.ROWS-1)*T+5,T,3,'#7b8151');rect(c,x*T+3,(M.ROWS-1)*T,3,13,'#73794b')}
    for(let y=0;y<M.ROWS;y++){rect(c,6,y*T,3,T,'#73794b');rect(c,(M.COLS-1)*T+5,y*T,3,T,'#73794b')}
    rect(c,11*T,15*T,13,6,'#738260');rect(c,11*T+2,15*T-2,9,6,'#a3ab87');
    rect(c,24*T,24*T,18,7,'#738260');rect(c,24*T+2,24*T-3,13,7,'#a3ab87');
  }
  function home(c,h) {
    const x=h.x*T,y=h.y*T,w=h.w*T,height=h.h*T;
    const roof={teal:['#427a70','#63958a','#31574e'],plum:['#827182','#a2929e','#5a535e'],clay:['#a26f4a','#bb8c5a','#75543c']}[h.color];
    rect(c,x-3,y+height-2,w+6,5,'#78915c');
    rect(c,x,y+29,w,height-29,P.ink);rect(c,x+3,y+32,w-6,height-35,'#e5d3a3');
    rect(c,x+3,y+height-10,w-6,7,'#b5a57c');
    for(let yy=y+40;yy<y+height-10;yy+=12) rect(c,x+4,yy,w-8,1,'#d2c095');
    for(const wx of [x+14,x+w-36]) {
      rect(c,wx,y+55,22,25,P.ink);rect(c,wx+2,y+57,18,20,'#8cae9e');
      rect(c,wx+4,y+58,5,7,'#c4d1ac');rect(c,wx+10,y+57,2,21,'#6c7861');rect(c,wx+2,y+66,18,2,'#6c7861');rect(c,wx-2,y+79,26,3,roof[2]);
    }
    const dx=(h.door[0]+.5)*T-10;
    rect(c,dx,y+height-34,21,34,P.ink);rect(c,dx+2,y+height-32,17,30,'#9c7e51');rect(c,dx+4,y+height-29,13,8,'#b39a67');rect(c,dx+15,y+height-16,2,2,'#e1c57d');
    rect(c,dx-4,y+height,29,4,'#b1ad87');rect(c,dx-2,y+height,25,1,'#dad0a8');
    // Stepped roof silhouette and tile courses replace smooth vector triangles.
    for(let row=0;row<9;row++) {
      const inset=Math.max(0,28-row*4);
      rect(c,x-7+inset,y+row*4,w+14-inset*2,5,roof[2]);
      rect(c,x-5+inset,y+row*4,w+10-inset*2,3,row%2?roof[0]:roof[1]);
      for(let tx=x+inset;tx<x+w-inset;tx+=13) rect(c,tx,y+row*4,1,3,roof[0]);
    }
    rect(c,x-7,y+36,w+14,5,roof[2]);rect(c,x-5,y+36,w+10,2,roof[0]);
    if(h.id==='shanxin') {rect(c,x+10,y-1,10,17,roof[2]);rect(c,x+8,y-3,14,4,roof[0]);rect(c,x+w-7,y+height-12,8,12,'#a77753');rect(c,x+w-10,y+height-18,14,9,P.tree)}
    if(h.id==='xiaobai') {rect(c,x+3,y+height-21,8,21,'#88694a');rect(c,x+2,y+height-20,10,3,'#cfb781');rect(c,x+4,y+height-27,6,7,'#cf9d70')}
    if(h.id==='grandpa') {rect(c,x-9,y+height-17,9,17,'#a77753');rect(c,x-12,y+height-26,15,12,P.tree);rect(c,x-8,y+height-31,8,10,P.leaf)}
  }
  function tree(c,tx,ty) {
    const x=tx*T+8,y=ty*T+15;
    rect(c,x-13,y-2,26,4,'#82965e');rect(c,x-4,y-21,8,22,'#695c3e');rect(c,x-2,y-17,3,15,'#9a8051');
    const widths=[10,18,26,32,38,42,42,38,34,26,16];
    widths.forEach((w,i)=>rect(c,x-w/2,y-45+i*3,w,4,P.ink));
    widths.forEach((w,i)=>{if(i&&i<widths.length-1)rect(c,x-w/2+2,y-44+i*3,w-4,3,P.tree)});
    rect(c,x-5,y-40,10,3,P.leaf);rect(c,x-11,y-34,18,4,P.leaf);rect(c,x-15,y-28,12,4,P.leaf);rect(c,x-9,y-25,8,3,P.sun);rect(c,x+6,y-28,9,4,P.leaf);rect(c,x+3,y-19,8,3,P.leaf);
  }
  function sprite(c,x,y,dir='down',frame=0) {
    c.save();c.translate(Math.round(x)-16,Math.round(y)-31);
    if(dir==='left'){c.translate(32,0);c.scale(-1,1);dir='right'}
    const r=(x,y,w,h,color)=>rect(c,x,y,w,h,color);
    const phase=[0,1,0,-1][frame%4];
    // Feet retain a fixed ground anchor. Leg phase changes, not overall volume.
    r(9,27,15,3,'#627b4b');
    r(10,20,13,9,P.line);r(11,21,11,7,P.cat);
    if(dir==='up'){r(8,22,4,6,P.cat);r(7,23,2,4,P.catLight)}
    else {r(7,23,4,5,P.line);r(6,22,3,4,P.cat);r(6,21,2,2,P.catLight)}
    r(11,27+phase,4,4-phase,P.line);r(18,27-phase,4,4+phase,P.line);
    r(12,27+phase,2,3-phase,P.cat);r(19,27-phase,2,3+phase,P.cat);
    if(dir==='right') {
      r(7,6,18,15,P.line);r(5,8,22,11,P.line);r(6,8,20,11,P.cat);r(8,6,16,15,P.cat);
      r(8,1,2,8,P.line);r(10,3,2,6,P.line);r(10,5,2,3,P.ear);r(22,2,2,6,P.line);r(21,4,2,3,P.ear);
      r(18,9,8,10,P.line);r(18,10,8,8,P.cream);r(20,10,6,7,'#101c19');r(26,18,2,2,'#6ba6a0');
      r(14,27+phase,3,4-phase,P.line);
    } else {
      r(3,1,2,8,P.line);r(5,3,2,7,P.line);r(7,5,2,4,P.line);
      r(27,1,2,8,P.line);r(25,3,2,7,P.line);r(23,5,2,4,P.line);
      r(4,7,24,14,P.line);r(2,9,28,10,P.line);r(3,9,26,10,P.cat);r(5,7,22,14,P.cat);
      if(dir==='down') {
        r(5,5,2,4,P.ear);r(25,5,2,4,P.ear);
        for(const ex of [5,18]) {
          r(ex+2,9,6,11,P.line);r(ex+1,10,8,9,P.line);r(ex,12,10,5,P.line);
          r(ex+2,10,6,9,P.cream);r(ex+1,12,8,5,P.cream);r(ex+4,10,3,9,'#101c19');r(ex+3,11,5,7,'#101c19');r(ex+2,13,6,3,'#101c19');
        }
        r(15,20,3,1,'#6ba6a0');r(16,21,1,1,'#6ba6a0');
      } else {r(5,8,20,2,P.catLight);r(6,10,3,5,P.catLight)}
    }
    c.restore();
  }
  function mini(c,player,visited) {
    const s=4;c.clearRect(0,0,160,120);
    rect(c,0,0,160,120,P.grass);rect(c,6*s,19*s,32*s,3*s,P.path);rect(c,7*s,12*s,3*s,9*s,P.path);rect(c,20*s,12*s,3*s,9*s,P.path);rect(c,7*s,12*s,16*s,2*s,P.path);rect(c,34*s,18*s,3*s,3*s,P.path);rect(c,28*s,0,3*s,120,P.water);rect(c,27*s,20*s,5*s,2*s,P.wood);
    for(const h of M.homes){rect(c,h.x*s,h.y*s,h.w*s,h.h*s,h.color==='teal'?'#427a70':h.color==='plum'?'#827182':'#a26f4a');rect(c,h.door[0]*s,h.door[1]*s,4,3,visited.has(h.id)?'#f7e6bb':'#28352b')}
    rect(c,Math.floor(player.x/T*s)-2,Math.floor(player.y/T*s)-2,5,5,P.cream);rect(c,Math.floor(player.x/T*s)-1,Math.floor(player.y/T*s)-1,3,3,'#ac613d');
  }
  root.PixelArt={P,ground,home,tree,sprite,mini};
})(globalThis);
