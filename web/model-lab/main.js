import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCharacter, modelNames } from "./meshes.js";
const canvas = document.querySelector("canvas"),
  stage = document.querySelector("#stage"),
  status = document.querySelector("#status");
let selected = "xiaohei",
  renderer,
  camera,
  controls,
  scene,
  active,
  action = null;
const models = {};
const descriptions = {
  xiaohei: "短短的身体、大大的眼睛和一张小三角嘴。",
  heixiu: "圆滚滚的小黑团子。用最简单的形状，试试眼睛和动作能带来多少表情。",
};
function resetPose() {
  for (const model of Object.values(models)) {
    model.object.position.y = 0;
    for (const eye of model.eyes) eye.scale.y = 1;
  }
  action = null;
  canvas.dataset.action = "idle";
}
function viewpoint(view = "front") {
  if (!camera) return;
  const target = selected === "xiaohei" ? 1.3 : 1.0;
  controls.target.set(0, target, 0);
  const distance = selected === "xiaohei" ? 5.5 : 4.0;
  camera.position.set(
    view === "side"
      ? distance
      : view === "quarter"
        ? distance * Math.SQRT1_2
        : 0,
    target + 0.7,
    view === "side"
      ? 0
      : view === "quarter"
        ? distance * Math.SQRT1_2
        : view === "back"
          ? -distance
          : distance,
  );
  controls.update();
  canvas.dataset.view = view;
}
function select(id) {
  if (!Object.hasOwn(modelNames, id)) return;
  selected = id;
  resetPose();
  document.querySelector("#name").textContent = modelNames[id];
  document.querySelector("#description").textContent = descriptions[id];
  const download = document.querySelector("#download");
  download.href = `./${id}.glb`;
  download.download = `${id}-study.glb`;
  download.textContent = `下载${modelNames[id]}模型`;
  document.querySelector("#size").textContent = "本地生成 · 含小跳关键帧";
  for (const button of document.querySelectorAll("[data-character]"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.character === id),
    );
  for (const [key, model] of Object.entries(models))
    model.object.visible = key === id;
  active = models[id];
  stage.dataset.character = id;
  viewpoint();
  status.textContent =
    canvas.dataset.ready === "false"
      ? "当前设备暂时不能显示3D，模型仍可下载。"
      : renderer
        ? "可以转动看看，也可以试个小动作。"
        : "模型准备中";
}
for (const button of document.querySelectorAll("[data-character]"))
  button.addEventListener("click", () => select(button.dataset.character));
function fail(message) {
  document.querySelector("#fallback").hidden = false;
  canvas.hidden = true;
  canvas.dataset.ready = "false";
  for (const button of document.querySelectorAll("[data-action]"))
    button.disabled = true;
  renderer?.setAnimationLoop(null);
  status.textContent = message;
}
select("xiaohei");
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.minDistance = 2.8;
  controls.maxDistance = 9;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.enableDamping = false;
  scene.add(new THREE.HemisphereLight(0xf4ffe9, 0x668776, 2.2));
  const sun = new THREE.DirectionalLight(0xfff5d8, 3.2);
  sun.position.set(-3, 6, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -4;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xb5e8dd, 2.3);
  rim.position.set(3, 4, -3);
  scene.add(rim);
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.55, 0.17, 64),
    new THREE.MeshStandardMaterial({ color: 0xbac4ac, roughness: 1 }),
  );
  plinth.position.y = -0.12;
  plinth.receiveShadow = true;
  scene.add(plinth);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.22;
  floor.receiveShadow = true;
  scene.add(floor);
  for (const id of Object.keys(modelNames)) {
    models[id] = createCharacter(id);
    scene.add(models[id].object);
  }
  select("xiaohei");
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  function animate(time) {
    if (action) {
      const elapsed = (time - action.start) / 1000;
      if (action.kind === "blink")
        for (const eye of active.eyes)
          eye.scale.y = Math.max(
            0.08,
            Math.abs(Math.cos(Math.PI * Math.min(elapsed / 0.35, 1))),
          );
      if (action.kind === "hop")
        active.object.position.y =
          0.4 * Math.sin(Math.PI * Math.min(elapsed / 0.8, 1));
      if (elapsed >= (action.kind === "blink" ? 0.35 : 0.8)) {
        resetPose();
        status.textContent = "动作完成。还可以拖动看看。";
      }
    }
    renderer.render(scene, camera);
    canvas.dataset.ready = "true";
  }
  renderer.setAnimationLoop(animate);
  document.addEventListener("visibilitychange", () =>
    renderer.setAnimationLoop(document.hidden ? null : animate),
  );
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail("3D显示已中断，刷新页面可重试；模型仍可下载。");
  });
  function perform(kind) {
    if (["front", "quarter", "side", "back"].includes(kind)) {
      viewpoint(kind);
      status.textContent = `${modelNames[selected]} · ${{ front: "正面", quarter: "斜侧", side: "侧面", back: "背面" }[kind]}`;
      return;
    }
    if (kind === "near" || kind === "far") {
      const offset = camera.position.clone().sub(controls.target),
        length = THREE.MathUtils.clamp(
          offset.length() * (kind === "near" ? 0.85 : 1.18),
          controls.minDistance,
          controls.maxDistance,
        );
      camera.position.copy(controls.target).add(offset.setLength(length));
      controls.update();
      return;
    }
    resetPose();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      status.textContent = "已按减少动态效果设置略过动作。";
      return;
    }
    action = { kind, start: performance.now() };
    canvas.dataset.action = kind;
    status.textContent = kind === "blink" ? "眨眨眼。" : "轻轻跳一下。";
  }
  for (const button of document.querySelectorAll("[data-action]"))
    button.addEventListener("click", () => perform(button.dataset.action));
  canvas.addEventListener("keydown", (event) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "-",
        "Home",
      ].includes(event.key)
    )
      event.preventDefault();
    else return;
    if (event.key === "Home") return perform("front");
    if (event.key === "+") return perform("near");
    if (event.key === "-") return perform("far");
    const offset = camera.position.clone().sub(controls.target),
      spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta +=
      event.key === "ArrowLeft" ? 0.15 : event.key === "ArrowRight" ? -0.15 : 0;
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi +
        (event.key === "ArrowUp"
          ? -0.12
          : event.key === "ArrowDown"
            ? 0.12
            : 0),
      0.2,
      Math.PI * 0.55,
    );
    camera.position
      .copy(controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  });
} catch (error) {
  fail("当前设备暂时不能显示3D，下载模型的功能仍可使用。");
}
