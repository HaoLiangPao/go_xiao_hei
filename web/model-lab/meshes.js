import * as THREE from "three";

export const modelNames = { xiaohei: "猫形小黑", heixiu: "黑咻" };
export function createCharacter(id) {
  if (!Object.hasOwn(modelNames, id)) throw new Error("未知练习模型");
  const object = new THREE.Group();
  object.name = id;
  object.userData = {
    version: "study-1",
    note: "非官方简化练习模型；人物版权归原权利人，非官方三视图重建。",
  };
  const ink = new THREE.MeshStandardMaterial({
    color: 0x101c18,
    roughness: 0.85,
  });
  const pale = new THREE.MeshStandardMaterial({
    color: 0xe8ffd0,
    roughness: 0.7,
  });
  const green = new THREE.MeshStandardMaterial({
    color: 0x6f9e72,
    roughness: 0.9,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x07100c,
    roughness: 0.85,
  });
  const sphere = new THREE.SphereGeometry(1, 24, 16),
    eyes = [];
  function oval(name, position, scale, material, parent = object) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  if (id === "xiaohei") {
    oval("body", [0, 0.8, 0], [0.52, 0.67, 0.42], ink);
    oval("head", [0, 1.75, 0.05], [0.88, 0.73, 0.66], ink);
    const ear = new THREE.Shape();
    ear.moveTo(-0.3, 0);
    ear.lineTo(0, 0.67);
    ear.lineTo(0.3, 0);
    ear.closePath();
    const earGeometry = new THREE.ExtrudeGeometry(ear, {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.07,
    });
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(earGeometry, ink);
      mesh.name = `ear-${side}`;
      mesh.position.set(side * 0.55, 2.14, -0.08);
      mesh.rotation.z = -side * 0.24;
      mesh.castShadow = true;
      object.add(mesh);
      const inner = new THREE.Mesh(new THREE.ShapeGeometry(ear), green);
      inner.name = `inner-ear-${side}`;
      inner.scale.set(0.58, 0.67, 1);
      inner.position.set(0, 0.07, 0.23);
      mesh.add(inner);
      oval(
        `front-paw-${side}`,
        [side * 0.26, 0.23, 0.36],
        [0.2, 0.26, 0.23],
        ink,
      );
      oval(
        `back-paw-${side}`,
        [side * 0.46, 0.18, -0.08],
        [0.25, 0.19, 0.31],
        ink,
      );
      const eye = new THREE.Group();
      eye.name = `eye-${side}`;
      eye.position.set(side * 0.34, 1.85, 0.62);
      object.add(eye);
      eyes.push(eye);
      oval(`white-${side}`, [0, 0, 0], [0.29, 0.37, 0.1], pale, eye);
      oval(`pupil-${side}`, [0.015, 0, 0.084], [0.16, 0.25, 0.055], black, eye);
    }
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.55, -0.3),
      new THREE.Vector3(0.55, 0.4, -0.65),
      new THREE.Vector3(0.98, 0.58, -0.5),
      new THREE.Vector3(1.05, 1.08, -0.35),
    ]);
    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(tailCurve, 24, 0.1, 8, false),
      ink,
    );
    tail.name = "tail";
    tail.castShadow = true;
    object.add(tail);
    oval("tail-tip", [1.05, 1.08, -0.35], [0.1, 0.1, 0.1], ink);
  } else {
    oval("round-body", [0, 1.0, 0], [0.78, 0.74, 0.69], ink);
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.name = `eye-${side}`;
      eye.position.set(side * 0.3, 1.08, 0.63);
      object.add(eye);
      eyes.push(eye);
      oval(`white-${side}`, [0, 0, 0], [0.235, 0.29, 0.09], pale, eye);
      oval(`pupil-${side}`, [0, 0, 0.068], [0.167, 0.22, 0.055], black, eye);
    }
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.4, 0.75, -0.28),
      new THREE.Vector3(0.88, 0.8, -0.44),
      new THREE.Vector3(0.94, 1.15, -0.35),
    ]);
    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.065, 8, false),
      ink,
    );
    tail.name = "small-tail";
    tail.castShadow = true;
    object.add(tail);
    oval("tail-tip", [0.94, 1.15, -0.35], [0.065, 0.065, 0.065], ink);
  }
  return { object, eyes };
}
export function createHopClip(object) {
  return new THREE.AnimationClip("小跳", 0.8, [
    new THREE.VectorKeyframeTrack(
      `${object.name}.position`,
      [0, 0.16, 0.4, 0.64, 0.8],
      [0, 0, 0, 0, -0.06, 0, 0, 0.38, 0, 0, 0, 0, 0, 0, 0],
    ),
  ]);
}
