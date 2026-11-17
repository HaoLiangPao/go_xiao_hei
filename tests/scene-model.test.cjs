const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../prototype/scene-data.js'),'utf8'),context);
const scene = JSON.parse(JSON.stringify(context.window.SHIGUANG_SCENE));
const model = require('../prototype/scene-model.js')(scene);
const paint = (state,region,color='rain') => model.act(state,{type:'paint',region,color});
const place = (state,object,target) => model.act(state,{type:'place',object,target});

test('objects require specific colored areas and prior story actions',()=>{
  let state=model.empty();
  assert.deepEqual(place(state,'tile','roof-gap'),state);
  state=paint(state,'roof'); state=paint(state,'wall');
  assert.deepEqual(place(state,'tile','table-top'),state);
  state=place(state,'tile','roof-gap'); assert.equal(state.placed.tile,'roof-gap');
  assert.equal(place(state,'cup','table-top').placed.cup,undefined);
  let early=paint(paint(model.empty(),'table'),'window');
  assert.equal(place(early,'cup','table-top').placed.cup,undefined);
});
test('both lamp positions complete the same sequence and preserve color choices',()=>{
  for(const target of ['door-hook','window-hook']) {
    let state=model.empty();
    for(const region of scene.regions) state=paint(state,region.id,'petal');
    state=place(state,'tile','roof-gap');state=place(state,'cup','table-top');state=place(state,'lamp',target);
    assert.equal(Object.keys(state.placed).length,3);
    assert.equal(state.placed.lamp,target);
    assert.deepEqual(model.restore(JSON.parse(JSON.stringify(state))),state);
    const recolored=paint(state,'roof','sun');
    assert.equal(recolored.colors.roof,'sun');assert.equal(recolored.placed.lamp,target);
    assert.equal(state.colors.roof,'petal','actions must not mutate undo snapshots');
  }
});
test('invalid saves cannot bypass story prerequisites or inject unknown colors',()=>{
  for(const raw of [null,{},[],{version:1,colors:{roof:'rain'}}])assert.deepEqual(model.restore(raw),model.empty());
  const restored=model.restore({version:2,colors:{roof:'invalid',wall:'sun',alien:'moss'},placed:{tile:'roof-gap',cup:'table-top',lamp:'door-hook'}});
  assert.deepEqual(restored,{version:2,colors:{wall:'sun'},placed:{}});
  assert.deepEqual(model.act(model.empty(),{type:'paint',region:'alien',color:'moss'}),model.empty());
});
test('filling every region alone never advances story and duplicate placements do nothing',()=>{
  let state=model.empty();for(const region of scene.regions)state=paint(state,region.id);
  assert.equal(Object.keys(state.placed).length,0);
  state=place(state,'tile','roof-gap');assert.deepEqual(place(state,'tile','roof-gap'),state);
  assert.deepEqual(place(state,'lamp','door-hook'),state);
});
