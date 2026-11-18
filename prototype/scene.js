(() => {
  'use strict';
  const data = window.SHIGUANG_SCENE, model = window.createShiguangModel(data);
  const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
  const key = 'xiaohei-shiguang-borrow-a-light-v2';
  let state = model.empty(), selected = null, preview = false, history = [], storageOK = true;
  let activeRegion = null, hoverColor = null, positionFrame = null;
  try { state = model.restore(JSON.parse(localStorage.getItem(key))); }
  catch (_) { storageOK = false; }
  const say = message => { $('message').textContent = message + (storageOK ? '' : '（当前无法保存进度，仍可继续游玩。）'); };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); storageOK = true; }
    catch (_) { storageOK = false; }
  };
  const svg = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    parent.append(el); return el;
  };
  const clearHints = () => document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));
  function change(action) {
    const next = model.act(state, action);
    if (JSON.stringify(next) === JSON.stringify(state)) return false;
    history.push(JSON.stringify(state)); if (history.length > 40) history.shift();
    state = next; clearHints(); save(); render(); return true;
  }
  function positionPalette() {
    if (!activeRegion) return;
    const panel = $('color-popover');
    const region = document.querySelector(`[data-region="${activeRegion}"]`);
    const box = region.getBoundingClientRect();
    const width = panel.offsetWidth, height = panel.offsetHeight, margin = 12;
    const centerX = box.left + box.width / 2;
    const left = Math.max(margin, Math.min(innerWidth - width - margin, centerX - width / 2));
    let top = box.bottom + margin;
    if (top + height > innerHeight - margin) top = box.top - height - margin;
    top = Math.max(margin, Math.min(innerHeight - height - margin, top));
    panel.style.left = `${left}px`; panel.style.top = `${top}px`;
    panel.style.transformOrigin = `${Math.max(24,Math.min(width-24,centerX-left))}px ${top > box.top ? '0' : '100%'}`;
  }
  function schedulePosition() {
    if (positionFrame !== null || !activeRegion) return;
    positionFrame = requestAnimationFrame(() => { positionFrame = null; positionPalette(); });
  }
  function drawColors() {
    for (const r of data.regions) {
      const el = document.querySelector(`[data-region="${r.id}"]`);
      const colorId = preview ? r.suggested : activeRegion === r.id && hoverColor ? hoverColor : state.colors[r.id];
      const p = data.palette.find(p => p.id === colorId);
      el.style.fill = p ? p.value : 'var(--blank)';
      el.classList.toggle('region-active', activeRegion === r.id);
      el.setAttribute('aria-label', `${r.name}${state.colors[r.id] ? `，${data.palette.find(p=>p.id===state.colors[r.id]).name}` : '，等待填色'}`);
      el.setAttribute('aria-disabled', String(preview));
      el.setAttribute('tabindex', preview ? '-1' : '0');
      el.setAttribute('aria-expanded', String(activeRegion === r.id));
      const shortcut = document.querySelector(`[data-control="region-${r.id}"]`);
      shortcut?.setAttribute('aria-expanded', String(activeRegion === r.id));
      shortcut?.classList.toggle('region-active', activeRegion === r.id);
    }
  }
  function updatePalette() {
    $('palette').querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed',String(!!activeRegion && state.colors[activeRegion] === button.dataset.color));
      button.classList.toggle('color-hovered', hoverColor === button.dataset.color);
    });
    const p = data.palette.find(p => p.id === hoverColor);
    $('color-feedback').textContent = p ? `${p.name} · 只是预览，点击确认` : '选一个喜欢的颜色';
  }
  function closePalette(restoreFocus = false) {
    const previous = activeRegion;
    activeRegion = null; hoverColor = null;
    const panel = $('color-popover');
    panel.classList.remove('is-open'); panel.setAttribute('aria-hidden','true'); panel.inert = true;
    drawColors(); updatePalette();
    if (restoreFocus && previous) document.querySelector(`[data-region="${previous}"]`).focus({preventScroll:true});
  }
  function openPalette(id, keyboard = false) {
    if (preview) { say('先收起配色参考，再继续填色。'); return; }
    selected = null;
    activeRegion = id; hoverColor = null; clearHints();
    const region = data.regions.find(r => r.id === id);
    $('color-title').textContent = `给${region.name}添色`;
    const panel = $('color-popover'); panel.inert = false; panel.setAttribute('aria-hidden','false');
    drawScene(); updatePalette(); positionPalette();
    void panel.offsetWidth;
    panel.classList.add('is-open');
    if (keyboard) ($('palette').querySelector('[aria-pressed="true"]') || $('palette').querySelector('button')).focus({preventScroll:true});
    say(`已选中${region.name}。悬停色块预览，点击确认；按 Esc 或点空白处取消。`);
  }
  function chooseColor(color) {
    if (!activeRegion || preview) return;
    const id = activeRegion, name = data.regions.find(r=>r.id===id).name;
    const keyboard = $('color-popover').contains(document.activeElement);
    closePalette(keyboard);
    const changed = change({type:'paint',region:id,color});
    if (!changed) render();
    const el = document.querySelector(`[data-region="${id}"]`);
    el.classList.remove('color-settled');
    requestAnimationFrame(()=>el.classList.add('color-settled'));
    say(`${name}添上了${data.palette.find(p=>p.id===color).name}。随时可以再点它换色。`);
  }
  function place(target) {
    if (preview) return;
    const spot = data.targets.find(t => t.id === target);
    if (!selected || selected !== spot.object) { say('这个位置放不下手里的物件，试试虚线圈出的对应位置。'); return; }
    const object = selected;
    if (change({type:'place',object,target})) {
      selected = null; render();
      say(object === 'lamp' ? '灯亮了。有人沿着你照亮的小路回家了。可以重读故事，或撤销一步试试另一处灯光。' : object === 'tile' ? '瓦片补好了，屋檐不再漏雨。接着给木桌和窗框添色，留一杯热茶。' : '茶还热着。接着给石阶和叶子添色，再挑一处地方挂灯。');
    }
  }
  function activate(el, action) {
    el.addEventListener('click', e => action(e.detail === 0));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(true); } });
  }
  function drawObject(object, targetId, parent) {
    const t = data.targets.find(t => t.id === targetId);
    const group = svg('g', {'data-placed':object.id}, parent);
    if (object.id === 'lamp') svg('circle',{cx:t.x,cy:t.y+8,r:91,fill:'url(#glow)'},group);
    if (object.id === 'tile') svg('path',{d:'M394 146H427L438 184H400Z',fill:'#71939b',stroke:'#425c63','stroke-width':2},group);
    else svg('use',{href:`#icon-${object.icon}`,x:t.x-26,y:t.y-26,width:52,height:52},group);
    if (object.id === 'cup') svg('path',{d:`M${t.x-8} ${t.y-22}q-6-7 0-14m12 15q-6-7 0-14`,class:'steam'},group);
  }
  function drawScene() {
    drawColors();
    const fixed = preview ? {tile:'roof-gap',cup:'table-top',lamp:'door-hook'} : state.placed;
    $('leak').toggleAttribute('hidden', !!fixed.tile);
    $('cat').setAttribute('transform',fixed.tile ? 'translate(343 409)' : 'translate(285 398)');
    $('arrival').toggleAttribute('hidden', !fixed.lamp);
    $('placed-objects').replaceChildren();
    data.objects.forEach(o => { if (fixed[o.id]) drawObject(o,fixed[o.id],$('placed-objects')); });
    $('targets').replaceChildren();
    const object = data.objects.find(o => o.id === selected);
    if (object && !preview && !state.placed[object.id] && model.ready(state,object)) {
      data.targets.filter(t => t.object === object.id).forEach(t => {
        const g = svg('g', {'data-target':t.id,role:'button',tabindex:'0','aria-label':`放到${t.name}`},$('targets'));
        svg('circle',{cx:t.x,cy:t.y,r:48,fill:'transparent','pointer-events':'all'},g);
        svg('circle',{cx:t.x,cy:t.y,r:27,class:'target-ring'},g);
        const text = svg('text',{x:t.x,y:t.y+47,'text-anchor':'middle',class:'target-label'},g); text.textContent = t.name;
        activate(g,()=>place(t.id));
        g.addEventListener('dragover',e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        g.addEventListener('drop',e => {
          e.preventDefault();
          if (e.dataTransfer.getData('application/x-shiguang-object') === selected) place(t.id);
        });
      });
    }
  }
  function render() {
    const focus = document.activeElement;
    const focusKey = focus?.dataset?.control;
    const done = Object.keys(state.placed).length, painted = Object.keys(state.colors).length;
    $('count').textContent = `${painted + done} / 9`;
    $('progress').value = painted + done;
    $('task').textContent = ['先修好漏雨的屋檐','为赶路的人留杯茶','给回家的人留盏灯','这一晚，刚刚好'][done];
    const event = done ? data.events[done-1] : data.opening;
    $('chapter').textContent = ['雨来时','第一幕 · 避雨','第二幕 · 等候','终幕 · 归来'][done];
    $('story-title').textContent = event.title; $('story-text').textContent = event.text;
    $('choice-text').hidden = done < 3; $('choice-text').textContent = done === 3 ? event.choices[state.placed.lamp] : '';
    $('region-list').replaceChildren();
    data.regions.forEach(r => {
      const button = document.createElement('button');button.type='button';button.dataset.control=`region-${r.id}`;
      button.textContent = `${state.colors[r.id] ? '✓ ' : ''}${r.name}`;button.classList.toggle('done',!!state.colors[r.id]);
      button.setAttribute('aria-label',`选择区域：${r.name}`);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','color-popover');button.disabled=preview;button.onclick=e=>openPalette(r.id,e.detail===0);$('region-list').append(button);
    });
    $('inventory').replaceChildren();
    data.objects.forEach(o => {
      const button = document.createElement('button');button.type='button';button.className='object';button.dataset.control=`object-${o.id}`;
      const placed = !!state.placed[o.id], ready=model.ready(state,o);
      button.disabled = preview || placed || !ready;button.draggable = !button.disabled;
      button.setAttribute('aria-pressed',String(selected===o.id));button.classList.toggle('placed',placed);
      const icon = document.createElementNS(NS,'svg');icon.setAttribute('viewBox','-30 -30 60 60');icon.setAttribute('aria-hidden','true');
      svg('use',{href:`#icon-${o.icon}`,x:-30,y:-30,width:60,height:60},icon);
      const label=document.createElement('span'), title=document.createElement('strong'), note=document.createElement('small');
      title.textContent=`${placed ? '✓ ' : ''}${o.name}`;
      const missing=o.needs.filter(id=>!state.colors[id]).map(id=>data.regions.find(r=>r.id===id).name);
      note.textContent=placed ? `已放在${data.targets.find(t=>t.id===state.placed[o.id]).name}` : o.after && !state.placed[o.after] ? `先放好${data.objects.find(item=>item.id===o.after).name}` : missing.length ? `先给${missing.join('、')}填色` : o.instruction;
      label.append(title,note);button.append(icon,label);button.onclick=()=>{closePalette();selected=o.id;clearHints();render();say(o.instruction+' 可以点击放置，也可以拖到标记处。');};
      button.addEventListener('dragstart',e=>{closePalette();selected=o.id;clearHints();drawScene();e.dataTransfer.setData('application/x-shiguang-object',o.id);e.dataTransfer.effectAllowed='move';say(o.instruction);});
      $('inventory').append(button);
    });
    $('memories').replaceChildren();
    data.events.filter(e=>state.placed[e.object]).forEach(e=>{
      const li=document.createElement('li'),title=document.createElement('strong'),body=document.createElement('p');
      title.textContent=e.title;body.textContent=e.text+(e.choices ? ' '+e.choices[state.placed.lamp] : '');li.append(title,body);$('memories').append(li);
    });
    $('memory-count').textContent=`${done} 段记忆`;
    $('undo').disabled = preview || !history.length;$('hint').disabled=preview || done===3;
    $('preview').textContent=preview ? '收起配色参考' : '看看配色参考';$('preview').setAttribute('aria-pressed',String(preview));
    $('preview-banner').hidden=!preview;drawScene();
    if (focusKey) document.querySelector(`[data-control="${focusKey}"]`)?.focus({preventScroll:true});
  }
  data.regions.forEach(r=>{const el=document.querySelector(`[data-region="${r.id}"]`);el.setAttribute('role','button');el.setAttribute('aria-haspopup','dialog');el.setAttribute('aria-controls','color-popover');activate(el,keyboard=>openPalette(r.id,keyboard));el.addEventListener('animationend',()=>el.classList.remove('color-settled'));});
  data.palette.forEach(p=>{
    const button=document.createElement('button');button.type='button';button.dataset.control=`color-${p.id}`;button.dataset.color=p.id;
    button.setAttribute('aria-label',`选择${p.name}`);button.setAttribute('aria-pressed','false');
    const dot=document.createElement('i');dot.style.setProperty('--color',p.value);button.append(dot,document.createTextNode(p.name));
    const peek=()=>{if(!activeRegion)return;hoverColor=p.id;drawColors();updatePalette();};
    button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')peek();});
    button.addEventListener('pointerleave',()=>{hoverColor=null;drawColors();updatePalette();});
    button.addEventListener('focus',peek);
    button.addEventListener('blur',()=>{hoverColor=null;drawColors();updatePalette();});
    button.onclick=()=>chooseColor(p.id);
    button.addEventListener('keydown',e=>{
      const index=data.palette.findIndex(item=>item.id===p.id);
      let next;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%data.palette.length;
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index+data.palette.length-1)%data.palette.length;
      if(e.key==='Home')next=0;if(e.key==='End')next=data.palette.length-1;
      if(next!==undefined){e.preventDefault();$('palette').children[next].focus();}
    });
    $('palette').append(button);
  });
  $('close-colors').onclick=()=>closePalette(true);
  document.addEventListener('pointerdown',e=>{if(activeRegion&&!$('color-popover').contains(e.target)&&!e.target.closest('[data-region],[data-control^="region-"]'))closePalette();});
  document.addEventListener('focusin',e=>{if(activeRegion&&!$('color-popover').contains(e.target)&&!e.target.closest('[data-region],[data-control^="region-"]'))closePalette();});
  addEventListener('resize',schedulePosition);addEventListener('scroll',schedulePosition,{passive:true});
  $('preview').onclick=()=>{closePalette();preview=!preview;clearHints();render();say(preview?'参考只展示一种搭配。收起后，你的颜色和摆放都还在。':'回到你自己的小屋了。');};
  $('undo').onclick=()=>{if(!history.length||preview)return;closePalette();state=model.restore(JSON.parse(history.pop()));selected=null;clearHints();save();render();say('退回上一步了。可以换一种颜色，或换个位置挂灯。');};
  $('reset').onclick=()=>{closePalette();history.push(JSON.stringify(state));state=model.empty();selected=null;preview=false;clearHints();save();render();say('雨又落下来了。点一下区域，重新给小屋添色吧；也可以撤销这次重新开始。');};
  $('hint').onclick=()=>{
    const object=data.objects.find(o=>!state.placed[o.id]);if(!object)return;
    closePalette();clearHints();const missing=object.needs.find(id=>!state.colors[id]);
    if(missing){selected=null;render();openPalette(missing);document.querySelector(`[data-region="${missing}"]`).classList.add('hint');say(`已选中${data.regions.find(r=>r.id===missing).name}，在浮出的色盘中选一种颜色吧。`);}
    else{selected=object.id;render();document.querySelectorAll('[data-target]').forEach(el=>el.classList.add('hint'));say(object.instruction);}
  };
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(activeRegion){closePalette(true);say('已收起色盘，预览的颜色没有保存。');return;}selected=null;preview=false;clearHints();render();say('已放下手里的物件。');}});
  render();
  if(Object.keys(state.colors).length||Object.keys(state.placed).length)say('小屋还记得你上次留下的颜色。继续吧。');
  else say('点一下屋檐或屋墙，给它挑个颜色，再试着放回瓦片。');
})();
