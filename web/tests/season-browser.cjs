const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const season=process.env.SEASON;
if(!['summer','autumn','winter'].includes(season))throw Error('Set SEASON=summer, autumn, or winter');
const root=path.resolve(__dirname,'..'),port={summer:5196,autumn:5197,winter:5198}[season],origin=`http://127.0.0.1:${port}`;
const shots=process.env.SCREENSHOT_DIR || path.join(root,`../docs/screenshots/${season}-stories`);
(async()=>{
  fs.mkdirSync(shots,{recursive:true});
  const {solarTerms}=await import(path.join(root,'src/solarTerms.js'));
  const {puzzleStories}=await import(path.join(root,'src/puzzleStories.js'));
  const {regionPieces}=await import(path.join(root,'src/gameplay.js'));
  const {recordedClip,dialogueCuesForSeason}=await import(path.join(root,'src/dialogueClips.js'));
  const terms=solarTerms.filter(t=>t.season===season),prior=solarTerms.slice(0,solarTerms.indexOf(terms[0])).map(t=>t.id);
  assert.ok(terms.every(t=>puzzleStories[t.id]));
  const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
  let browser,activePage;
  try {
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('preview startup timeout')),15000);server.stdout.on('data',d=>{if(d.toString().includes('Local:')){clearTimeout(timer);resolve();}});server.stderr.on('data',d=>{clearTimeout(timer);reject(Error(d.toString()));});server.on('exit',code=>{clearTimeout(timer);reject(Error(`preview exited ${code}`));});});
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/google-chrome',args:['--no-sandbox','--no-proxy-server']});
    for(const [label,width,height,touch] of [['desktop',1360,940,false],['mobile',390,844,true],['mobile-small',375,667,true],['mobile-narrow',320,568,true]]) {
      if(process.env.SEASON_SCOPE && !process.env.SEASON_SCOPE.split(',').includes(label))continue;
      const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
      await context.addInitScript(({prior,first})=>{
        Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){}}});
        window.__clips=[];const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio(src);window.__clips.push(a);return a;};
        if(!localStorage.getItem('shiguang-mode')){
          localStorage.setItem('shiguang-mode',JSON.stringify({picture:first,board:'guided',level:'easy',shape:'classic'}));
          localStorage.setItem('shiguang-solar-journey-v1',JSON.stringify({version:1,completed:prior}));
        }
      },{prior,first:terms[0].id});
      const page=await context.newPage(),errors=[],outside=[];activePage=page;
      page.on('pageerror',e=>errors.push(e.message));
      await context.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();outside.push(route.request().url());return route.abort();});
      const activate=locator=>touch?locator.tap():locator.click();
      const count=n=>page.waitForFunction(n=>document.querySelector('#count').textContent===`${n} / 12`,n);
      await page.goto(origin);
      await activate(page.getByRole('button',{name:'游戏设置',exact:true}));
      await page.getByLabel('游戏声音',{exact:true}).check();
      await page.getByLabel('背景音乐',{exact:false}).uncheck();
      await page.getByLabel('对白朗读',{exact:false}).check();
      await activate(page.getByRole('button',{name:/^回到/}));
      for(const [index,term] of terms.entries()) {
        await page.waitForFunction(()=>!document.querySelector('[data-piece]')?.disabled);
        await count(0);
        assert.equal(await page.locator('.year-progress').getAttribute('data-current-season'),season);
        assert.equal(await page.locator('.year-dots i').count(),6);
        assert.equal(await page.locator('.year-dots .lit').count(),index);
        const story=puzzleStories[term.id],goal=story.memories.find(m=>m.id===story.goal),placedIDs=new Set();
        assert.equal(await page.locator('[data-primary-goal]').getAttribute('data-primary-goal'),goal.id);
        assert.equal(await page.locator('.memory-chip.unlocked').count(),0);
        let placed=0;
        if(touch && index===0) {
          const piece=page.locator('[data-piece]').first(),id=Number(await piece.getAttribute('data-piece')),source=await piece.boundingBox(),board=await page.locator('.board').boundingBox();
          const cdp=await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:source.x+source.width/2,y:source.y+source.height/2}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:board.x+((id%3+.5)*board.width)/3,y:board.y+((Math.floor(id/3)+.5)*board.height)/4+46}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await count(++placed);placedIDs.add(id);
        }
        async function show(id) {
          for(let attempt=0;attempt<12;attempt++){
            const piece=page.locator(`[data-piece="${id}"]`);if(await piece.count())return piece;
            const next=page.getByRole('button',{name:'下一页碎片',exact:true});
            if(await next.isEnabled())await activate(next);
            else while(await page.getByRole('button',{name:'上一页碎片',exact:true}).isEnabled())await activate(page.getByRole('button',{name:'上一页碎片',exact:true}));
          }
          throw Error(`piece not found ${id}`);
        }
        async function place(piece){
          const id=await piece.getAttribute('data-piece');
          if(touch){await piece.tap();await page.locator(`[data-slot="${id}"]`).tap();}
          else{await piece.press('Enter');await page.locator(`[data-slot="${id}"]`).press('Enter');}
          await count(++placed);placedIDs.add(Number(id));
        }
        for(const id of regionPieces(goal,3,4))if(!placedIDs.has(id))await place(await show(id));
        assert.equal(await page.locator('[data-primary-goal]').getAttribute('data-goal-complete'),'true');
        await activate(page.locator(`[data-memory="${goal.id}"]`));
        await page.waitForFunction(src=>{const a=window.__clips.at(-1);return a?.src.endsWith(src)&&a.currentTime>.1&&!a.paused;},recordedClip(goal));
        await page.waitForFunction(text=>document.querySelector('.dialogue-copy p[aria-hidden]')?.textContent.includes(text),goal.text);
        if(['desktop','mobile'].includes(label))await page.screenshot({path:path.join(shots,`${label}-${term.id}.png`),fullPage:true});
        while(placed<12)await place(page.locator('[data-piece]').first());
        assert.equal(await page.locator('.memory-chip.unlocked').count(),4);
        for(const cue of story.memories){
          await activate(page.locator(`[data-memory="${cue.id}"]`));
          await page.waitForFunction(src=>{const a=window.__clips.at(-1);return a?.src.endsWith(src)&&a.currentTime>.1&&!a.paused;},recordedClip(cue));
        }
        assert.equal(await page.locator('.year-dots .lit').count(),index+1);
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-solar-journey-v1')).completed.length),prior.length+index+1);
        if(index<5)await activate(page.getByRole('button',{name:`下一节气 · ${terms[index+1].title}`,exact:true}));
      }
      if(['desktop','mobile'].includes(label)) {
        await page.waitForFunction(()=>document.querySelector('.dialogue-copy .caret-hidden'));
        await page.screenshot({path:path.join(shots,`${label}-complete.png`),fullPage:true});
      }
      await page.reload();await count(12);
      await page.waitForFunction(()=>document.querySelector(".dialogue-copy .caret-hidden"));
      assert.equal(await page.locator('.memory-chip.unlocked').count(),4);
      assert.equal(await page.locator('.year-dots .lit').count(),6);
      const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,board:document.querySelector('.board').getBoundingClientRect().bottom<=innerHeight,tray:document.querySelector('.tray').getBoundingClientRect().bottom<=innerHeight,unclipped:document.querySelector('.board').getBoundingClientRect().bottom<=document.querySelector('.board-scroller').getBoundingClientRect().bottom+1}));
      assert.deepEqual(layout,{overflow:false,board:true,tray:true,unclipped:true});
      if(label==='desktop'){
        await activate(page.getByRole('button',{name:'开启声音',exact:true}));
        const playback=await page.evaluate(async sources=>{
          let seconds=0;
          for(const src of sources){const a=new Audio(src);await a.play();await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(src)),10000);const check=()=>{if(a.currentTime>.05){clearTimeout(timer);resolve();}};a.addEventListener('timeupdate',check);check();});seconds+=a.duration;a.pause();a.removeAttribute('src');a.load();}
          return {count:sources.length,seconds};
        },dialogueCuesForSeason(season).map(recordedClip));
        assert.equal(playback.count,36);console.log(`PASS ${season} 36/36 production MP3 native playback without Chinese OS voices, ${playback.seconds.toFixed(2)} seconds`);
      }
      assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
      console.log(`PASS ${season}/${label}: all six 12-piece puzzles, six goals/24 memories and replays, sequential unlock, season/year counts, refresh, ${touch?'CDP drag and touch taps':'keyboard'}, layout, no external requests`);
      await context.close();
    }
  } catch(error){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:`/tmp/xiaohei-${season}-failure.png`,fullPage:true});throw error;}
  finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
