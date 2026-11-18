(function(root) {
  'use strict';
  function createModel(scene) {
    const empty = () => ({version:scene.version, colors:{}, placed:{}});
    const ready = (state, object) => object.needs.every(id => state.colors[id]) && (!object.after || state.placed[object.after]);
    function restore(raw) {
      const state = empty();
      if (!raw || raw.version !== scene.version) return state;
      for (const region of scene.regions) {
        const color = raw.colors?.[region.id];
        if (scene.palette.some(p => p.id === color)) state.colors[region.id] = color;
      }
      // Ordered dependencies prevent malformed saves from unlocking later events.
      for (const object of scene.objects) {
        const target = raw.placed?.[object.id];
        if (object.targets.includes(target) && ready(state, object)) state.placed[object.id] = target;
      }
      return state;
    }
    function act(state, action) {
      const next = restore(state);
      if (action.type === 'paint' && scene.regions.some(r => r.id === action.region) && scene.palette.some(p => p.id === action.color)) next.colors[action.region] = action.color;
      if (action.type === 'place') {
        const object = scene.objects.find(o => o.id === action.object);
        if (object && !next.placed[object.id] && ready(next, object) && object.targets.includes(action.target)) next.placed[object.id] = action.target;
      }
      return next;
    }
    return {empty, restore, ready, act};
  }
  if (typeof module !== 'undefined') module.exports = createModel;
  else root.createShiguangModel = createModel;
})(typeof window !== 'undefined' ? window : globalThis);
