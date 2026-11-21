const { chromium }=require('playwright');
const { spawn }=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),origin='http://127.0.0.1:5231',shots=path.resolve(root,'../docs/screenshots/pixel-world');
(async()=>{
  fs.mkdirSync(shots,{recursive:true});
  const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','5231','--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('preview timeout')),15000);server.stdout.on('data',d=>{if(d.toString().includes('Local:')){clearTimeout(timer);resolve()}});server.stderr.on('data',d=>{clearTimeout(timer);reject(Error(d))});server.on('exit',()=>reject(Error('preview exited')))});
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--no-proxy-server']});
    const {puzzleSaveKey}=await import(path.join(root,'src/journeyModel.js'));
    const saveKey=puzzleSaveKey('rain','guided','easy','classic');
    for(const [name,width,height,touch] of [['desktop',1360,940,false],['mobile',390,844,true],['small',320,568,true]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[],outside=[];
      page.on('pageerror',e=>errors.push(e.message));
      await context.route('**/*',r=>{if(r.request().url().startsWith(origin+'/'))return r.continue();outside.push(r.request().url());return r.abort()});
      await page.goto(origin);
      await page.evaluate(({saveKey})=>{localStorage.setItem('shiguang-mode',JSON.stringify({picture:'rain',board:'guided',level:'easy',shape:'classic',magnet:true}));localStorage.setItem(saveKey,'[0,2,4]')},{saveKey});
      await page.reload();
      const entry=page.getByRole('link',{name:'去像素街区散步'});await entry.click();
      await page.waitForFunction(()=>!!document.querySelector('#world')?.dataset.x);
      await page.clock.install({time:new Date('2026-11-21T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-21T12:01:00Z'));
      const canvas=page.locator('#world'),state=()=>canvas.evaluate(el=>({...el.dataset}));
      const shot=async(label)=>{await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(shots,`${name}-${label}.png`),fullPage:true})};
      await shot('street');
      const start=await state();await canvas.focus();await page.keyboard.down('ArrowRight');await page.clock.runFor(320);
      const moving=await state();assert.ok(+moving.x>+start.x+10);assert.equal(moving.direction,'right');assert.equal(moving.moving,'true');
      const images=new Set();for(let i=0;i<4;i++){await page.clock.runFor(64);images.add(await canvas.evaluate(el=>el.toDataURL()))}assert.ok(images.size>=3,'walking should paint multiple actual frames');
      await shot('walking');await page.keyboard.up('ArrowRight');await page.clock.runFor(48);
      const stopped=await state();assert.equal(stopped.moving,'false');await page.clock.runFor(300);assert.equal((await state()).x,stopped.x);
      // Touch stays down across actual animation frames; this is Chrome touch emulation.
      if(touch){
        const cdp=await context.newCDPSession(page);await page.locator('[data-dir=down]').scrollIntoViewIfNeeded();
        const box=await page.locator('[data-dir=down]').boundingBox(),point={x:box.x+box.width/2,y:box.y+box.height/2};
        const before=await state();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await page.clock.runFor(300);assert.ok(+(await state()).y>+before.y);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.clock.runFor(64);const after=await state();assert.equal(after.moving,'false');await page.clock.runFor(300);assert.equal((await state()).y,after.y);await cdp.detach();
      }
      // Simulated blur exercises the input-release handler; not an OS focus claim.
      await canvas.focus();await page.keyboard.down('ArrowLeft');await page.clock.runFor(80);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.clock.runFor(64);assert.equal((await state()).moving,'false');await page.keyboard.up('ArrowLeft');
      for(const [i,id] of ['shanxin','xiaobai','grandpa'].entries()){
        await page.locator(`[data-home=${id}]`).click();
        const before=await state();let arrived=false;
        for(let j=0;j<45;j++){
          await page.clock.runFor(400);
          const current=await state();
          if(id==='grandpa'&&+current.x>448&&+current.x<496&&name!=='small')await shot('bridge');
          if(await page.locator('#visit').isEnabled()){const text=await page.locator('#visit').innerText();if(text.includes(i===0?'山新':i===1?'小白家':'爷爷')){arrived=true;break}}
        }
        assert.ok(arrived,`${name} should walk to ${id}`);assert.notEqual((await state()).x,before.x);
        await shot(id);await page.locator('#visit').click();await shot(`${id}-dialog`);
        assert.equal(await page.locator('#conversation').evaluate(el=>el.open),true);
        const atDialog=await state();await page.keyboard.down('ArrowDown');await page.clock.runFor(300);assert.equal((await state()).y,atDialog.y);await page.keyboard.up('ArrowDown');
        assert.ok((await page.locator('#visits').innerText()).includes(`${i+1} / 3`));
        await page.locator('#close-scene').click();await page.clock.runFor(32);
      }
      assert.ok((await page.locator('#visits').innerText()).includes('3 / 3'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      // Real canvas click -> walk a short distance on a nearby open path.
      const clickStart=await state();await page.evaluate(()=>scrollTo(0,0));
      await canvas.click({position:{x:(+clickStart.x-32-+clickStart.cameraX)*+clickStart.scale,y:(+clickStart.y-+clickStart.cameraY)*+clickStart.scale}});
      await page.clock.runFor(600);assert.ok(+(await state()).x<+clickStart.x-10);
      await page.locator('#stop').click();await page.clock.runFor(32);assert.equal((await state()).moving,'false');
      if(name==='desktop'){
        const data=await page.evaluate(()=>{const a=document.createElement('canvas');a.width=128;a.height=128;const c=a.getContext('2d');c.fillStyle='#e1e4c6';c.fillRect(0,0,128,128);['down','right','up','left'].forEach((dir,row)=>{for(let f=0;f<4;f++)PixelArt.sprite(c,16+f*32,31+row*32,dir,f)});return a.toDataURL()});
        fs.writeFileSync(path.join(shots,'xiaohei-atlas.png'),Buffer.from(data.split(',')[1],'base64'));
        const enlarged=await page.evaluate(data=>new Promise(resolve=>{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,512,512);resolve(c.toDataURL())};image.src=data}),data);
        fs.writeFileSync(path.join(shots,'xiaohei-atlas-4x.png'),Buffer.from(enlarged.split(',')[1],'base64'));
      }
      await page.getByRole('link',{name:'回到拼图'}).click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),saveKey),'[0,2,4]');
      assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);console.log(`PASS ${name}: keyboard, actual painted walking frames, ${touch?'held touch/cancel, ':''}routes to all 3 homes, bridge, visits/dialog pause, ground click, stop, layout, puzzle save`);
      await context.close();
    }
    const offline=await browser.newContext(),p=await offline.newPage();let remote=0;await offline.route(/^https?:/,r=>{remote++;return r.abort()});await p.goto(pathToFileURL(path.join(root,'public/world/index.html')).href);await p.waitForFunction(()=>!!document.querySelector('#world')?.dataset.x);
    await p.locator('#world').focus();const x=await p.locator('#world').getAttribute('data-x');await p.keyboard.down('ArrowRight');await p.waitForFunction(v=>+document.querySelector('#world').dataset.x>+v+10,x);await p.keyboard.up('ArrowRight');await p.screenshot({path:path.join(shots,'offline-file.png'),fullPage:true});assert.equal(remote,0);await offline.close();console.log('PASS file:// offline without build/network');
    const reduced=await browser.newContext({reducedMotion:'reduce'}),r=await reduced.newPage();await r.goto(origin+'/world/');await r.waitForFunction(()=>!!document.querySelector('#world')?.dataset.x);await r.locator('#world').focus();await r.keyboard.down('ArrowRight');await r.waitForFunction(()=>document.querySelector('#world').dataset.moving==='true');assert.equal(await r.locator('#world').getAttribute('data-step'),'0');await r.keyboard.up('ArrowRight');await reduced.close();console.log('PASS reduced-motion: walking works without step cycling');
  } finally {await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
