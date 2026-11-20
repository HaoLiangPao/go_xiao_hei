const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), origin = 'http://127.0.0.1:5194';
const shots = process.env.SCREENSHOT_DIR || path.join(root, '../docs/screenshots/spring-stories');
(async () => {
  fs.mkdirSync(shots, {recursive:true});
  const { puzzleStories } = await import(path.join(root,'src/puzzleStories.js'));
  const { regionPieces } = await import(path.join(root,'src/gameplay.js'));
  const { recordedClip } = await import(path.join(root,'src/dialogueClips.js'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'resources-manifest.json')));
  const server = spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--port','5194','--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('preview startup timeout')),15000);server.stdout.on('data',d=>{if(d.toString().includes('Local:')){clearTimeout(timer);resolve();}});server.stderr.on('data',d=>{clearTimeout(timer);reject(Error(d.toString()));});});
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/google-chrome',args:['--no-sandbox','--no-proxy-server']});
    for(const [label,width,height,touch] of [['desktop',1360,940,false],['mobile',390,844,true],['mobile-small',375,667,true],['mobile-narrow',320,568,true]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
      await context.addInitScript(()=>{
        Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){}}});
        window.__clips=[];const NativeAudio=window.Audio;window.Audio=function(src){const audio=new NativeAudio(src);window.__clips.push(audio);return audio;};
        if(!localStorage.getItem('shiguang-mode')) {
          localStorage.setItem('shiguang-mode',JSON.stringify({picture:'startSpring',board:'guided',level:'easy',shape:'classic'}));
          localStorage.setItem('shiguang-solar-journey-v1',JSON.stringify({version:1,completed:['startSpring','rain','insects','equinox','pureBrightness']}));
        }
      });
      const page=await context.newPage(),errors=[],outside=[];
      page.on('pageerror',e=>errors.push(e.message));
      await context.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();outside.push(route.request().url());return route.abort();});
      const activate=locator=>touch?locator.tap():locator.click();
      const count=n=>page.waitForFunction(n=>document.querySelector('#count').textContent===`${n} / 12`,n);
      await page.goto(origin);
      await activate(page.getByRole('button',{name:'游戏设置',exact:true}));
      await page.getByLabel('游戏声音',{exact:true}).check();
      await page.getByLabel('背景音乐',{exact:false}).uncheck();
      await page.getByLabel('对白朗读',{exact:false}).check();
      await activate(page.getByRole('button',{name:'回到春天',exact:true}));
      for(const id of ['startSpring','insects','pureBrightness']) {
        if(id!=='startSpring') {
          await activate(page.getByRole('button',{name:/^选择节气，已点亮/}));
          await activate(page.locator(`[data-term="${id}"]`));
        }
        await page.waitForFunction(()=>!document.querySelector('[data-piece]')?.disabled);
        await count(0);
        const story=puzzleStories[id],goal=story.memories.find(m=>m.id===story.goal);
        assert.equal(await page.locator('[data-primary-goal]').getAttribute('data-primary-goal'),goal.id);
        assert.equal(await page.locator('.memory-chip.unlocked').count(),0);
        async function show(pieceId) {
          for(let attempt=0;attempt<12;attempt++) {
            const piece=page.locator(`[data-piece="${pieceId}"]`);
            if(await piece.count())return piece;
            const next=page.getByRole('button',{name:'下一页碎片',exact:true});
            if(await next.isEnabled())await activate(next);
            else while(await page.getByRole('button',{name:'上一页碎片',exact:true}).isEnabled())await activate(page.getByRole('button',{name:'上一页碎片',exact:true}));
          }
          throw Error(`piece not found ${pieceId}`);
        }
        let placed=0;
        async function place(piece) {
          const pieceId=await piece.getAttribute('data-piece');
          if(touch){await piece.tap();await page.locator(`[data-slot="${pieceId}"]`).tap();}
          else {await piece.press('Enter');await page.locator(`[data-slot="${pieceId}"]`).press('Enter');}
          await count(++placed);
        }
        for(const pieceId of regionPieces(goal,3,4))await place(await show(pieceId));
        assert.equal(await page.locator('[data-primary-goal]').getAttribute('data-goal-complete'),'true');
        await activate(page.locator(`[data-memory="${goal.id}"]`));
        await page.waitForFunction(src=>{const a=window.__clips.at(-1);return a?.src.endsWith(src)&&a.currentTime>.1&&!a.paused;},recordedClip(goal));
        await page.waitForFunction(text=>document.querySelector('.dialogue-copy p[aria-hidden]')?.textContent.includes(text),goal.text);
        if(['desktop','mobile'].includes(label))await page.screenshot({path:path.join(shots,`${label}-${id}.png`),fullPage:true});
        while(placed<12)await place(page.locator('[data-piece]').first());
        assert.equal(await page.locator('.memory-chip.unlocked').count(),4);
        for(const cue of story.memories) {
          await activate(page.locator(`[data-memory="${cue.id}"]`));
          await page.waitForFunction(src=>{const a=window.__clips.at(-1);return a?.src.endsWith(src)&&a.currentTime>.1&&!a.paused;},recordedClip(cue));
        }
      }
      await page.reload();await count(12);
      assert.equal(await page.locator('.memory-chip.unlocked').count(),4);
      const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,board:document.querySelector('.board').getBoundingClientRect().bottom<=innerHeight,tray:document.querySelector('.tray').getBoundingClientRect().bottom<=innerHeight}));
      assert.deepEqual(layout,{overflow:false,board:true,tray:true});
      await activate(page.getByRole('button',{name:'游戏设置',exact:true}));
      await page.getByLabel('游戏声音',{exact:true}).check();
      await activate(page.getByRole('button',{name:'试听小黑',exact:true}));
      await page.waitForFunction(()=>window.__clips.at(-1)?.currentTime>.1);
      assert.match(await page.locator('.settings-note[role=status]').innerText(),/普通中文合成配音/);
      if(['desktop','mobile'].includes(label))await page.screenshot({path:path.join(shots,`${label}-recording-ready.png`),fullPage:true});
      await activate(page.getByRole('button',{name:'停止',exact:true}));
      if(label==='desktop') {
        const result=await page.evaluate(async files=>{
          let seconds=0;
          for(const file of files) {
            const audio=new Audio(file.path);await audio.play();
            await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(file.path)),10000);const check=()=>{if(audio.currentTime>.05){clearTimeout(timer);resolve();}};audio.addEventListener('timeupdate',check);check();});
            seconds+=audio.duration;audio.pause();audio.removeAttribute('src');audio.load();
          }
          return {clips:files.length,seconds};
        },manifest.files.filter(f=>f.kind==='dialogue'));
        assert.equal(result.clips,36);console.log('PASS 36/36 production MP3 files natively played without OS Chinese voices; duration seconds',result.seconds.toFixed(2));
      }
      assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
      console.log(`PASS ${label}: built static site, three added spring stories, regional goal/full completion/four replay clips, persistence, layout, native audio without OS voices or external requests`);
      await context.close();
    }
  } finally {await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
