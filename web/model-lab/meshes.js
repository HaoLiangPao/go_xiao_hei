import * as THREE from "three";

export const modelNames = { xiaohei: "猫形小黑", heixiu: "黑咻" };
export function createCharacter(id) {
  if (!Object.hasOwn(modelNames, id)) throw new Error("未知练习模型");
  const object = new THREE.Group();
  object.name = id;
  object.userData = {
    version: "study-2",
    note: "非官方简化练习模型；人物版权归原权利人，非官方三视图重建。",
  };
  const ink = new THREE.MeshStandardMaterial({
    color: 0x101c18,
    roughness: 1.0,
  });
  const pale = new THREE.MeshStandardMaterial({
    color: 0xfff2ce,
    roughness: 0.7,
  });
  const green = new THREE.MeshStandardMaterial({
    color: 0x6f9e72,
    roughness: 0.9,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x07100c,
    roughness: 1.0,
  });
  const sphere = new THREE.SphereGeometry(1, 24, 16),
    eyes = [];
  function oval(
    name,
    position,
    scale,
    material,
    parent = object,
    geometry = sphere,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  let setBlink = (openness) => {
    for (const eye of eyes) eye.scale.y = openness;
  };
  if (id === "xiaohei") {
    // Proportion study: a broad head above a short seated body. These are
    // design choices from the selected front reference, not official measurements.
    oval("body", [0, 0.36, 0], [0.38, 0.37, 0.33], ink);
    const headGeometry = new THREE.SphereGeometry(1, 40, 28);
    const positions = headGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const power = (n, exponent) => Math.sign(n) * Math.abs(n) ** exponent;
      positions.setXYZ(
        i,
        power(positions.getX(i), 0.75),
        power(positions.getY(i), 0.75),
        power(positions.getZ(i), 0.9),
      );
    }
    headGeometry.computeVertexNormals();
    oval("head", [0, 1.36, 0.03], [0.92, 0.7, 0.53], ink, object, headGeometry);
    const cream = new THREE.MeshBasicMaterial({ color: 0xfff2ce });
    const line = new THREE.MeshBasicMaterial({ color: 0x4a3025 });
    const pupil = new THREE.MeshBasicMaterial({ color: 0x080d0a });
    const earMaterial = ink.clone();
    earMaterial.side = THREE.DoubleSide;
    function faceZ(x, y, lift = 0) {
      const remaining =
        1 -
        Math.abs(x / 0.92) ** (2 / 0.75) -
        Math.abs((y - 1.36) / 0.7) ** (2 / 0.75);
      return 0.03 + 0.53 * Math.max(0, remaining) ** (0.9 / 2) + lift;
    }
    const blinkPatches = [];
    function patch(name, parent, cx, cy, rx, ry, lift, material) {
      const vertices = [],
        indices = [],
        rings = 8,
        segments = 48;
      for (let r = 0; r <= rings; r++)
        for (let t = 0; t <= segments; t++) {
          const x = ((rx * r) / rings) * Math.cos((t / segments) * Math.PI * 2),
            y = ((ry * r) / rings) * Math.sin((t / segments) * Math.PI * 2);
          vertices.push(x, y, faceZ(cx + x, cy + y, lift));
        }
      for (let r = 0; r < rings; r++)
        for (let t = 0; t < segments; t++) {
          const a = r * (segments + 1) + t,
            b = (r + 1) * (segments + 1) + t;
          indices.push(a, b, b + 1, a, b + 1, a + 1);
        }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      parent.add(mesh);
      blinkPatches.push({
        geometry,
        original: geometry.attributes.position.array.slice(),
        cx,
        cy,
        lift,
      });
    }
    setBlink = (openness) => {
      for (const { geometry, original, cx, cy, lift } of blinkPatches) {
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          const x = original[i * 3],
            y = original[i * 3 + 1] * openness;
          position.setXYZ(i, x, y, faceZ(cx + x, cy + y, lift));
        }
        position.needsUpdate = true;
      }
    };
    for (const side of [-1, 1]) {
      // A tapered wedge grows from the head corner; it is not an extruded slab.
      const front = [
        [side * 0.52, 1.83, 0.22],
        [side * 0.98, 2.24, 0.05],
        [side * 0.91, 1.6, 0.22],
      ];
      const rearBase = [side * 0.72, 1.73, -0.22];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([...front.flat(), ...rearBase], 3),
      );
      const faces = [
        [0, 2, 1],
        [0, 1, 3],
        [1, 2, 3],
        [2, 0, 3],
      ];
      geometry.setIndex(
        faces.flatMap((face) => (side > 0 ? face : [...face].reverse())),
      );
      geometry.computeVertexNormals();
      const ear = new THREE.Mesh(geometry, earMaterial);
      ear.name = `ear-${side}`;
      ear.castShadow = true;
      object.add(ear);
      const center = front.reduce(
        (out, v) => out.map((n, i) => n + v[i] / 3),
        [0, 0, 0],
      );
      const inner = front.map((v) =>
        v.map(
          (n, i) => center[i] + (n - center[i]) * 0.6 + (i === 2 ? 0.008 : 0),
        ),
      );
      const innerGeo = new THREE.BufferGeometry();
      innerGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(inner.flat(), 3),
      );
      innerGeo.setIndex(side > 0 ? [0, 2, 1] : [0, 1, 2]);
      innerGeo.computeVertexNormals();
      const innerMesh = new THREE.Mesh(
        innerGeo,
        new THREE.MeshBasicMaterial({
          color: 0x81a77d,
          side: THREE.DoubleSide,
        }),
      );
      innerMesh.name = `inner-ear-${side}`;
      object.add(innerMesh);
      oval(
        `front-paw-${side}`,
        [side * 0.17, 0.24, 0.22],
        [0.13, 0.25, 0.15],
        ink,
      );
      oval(
        `back-paw-${side}`,
        [side * 0.34, 0.13, -0.07],
        [0.17, 0.13, 0.23],
        ink,
      );
      const eye = new THREE.Group();
      eye.name = `eye-${side}`;
      eye.position.set(side * 0.405, 1.43, 0);
      object.add(eye);
      eyes.push(eye);
      patch(
        `eye-line-${side}`,
        eye,
        side * 0.405,
        1.43,
        0.385,
        0.495,
        0.008,
        line,
      );
      patch(
        `white-${side}`,
        eye,
        side * 0.405,
        1.43,
        0.352,
        0.462,
        0.012,
        cream,
      );
      patch(
        `pupil-${side}`,
        eye,
        side * 0.405,
        1.43,
        0.236,
        0.322,
        0.016,
        pupil,
      );
    }
    const noseGeometry = new THREE.BufferGeometry();
    const nose = [
      [-0.065, 0.87],
      [0.065, 0.87],
      [0, 0.77],
    ];
    noseGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        nose.flatMap(([x, y]) => [x, y, faceZ(x, y, 0.014)]),
        3,
      ),
    );
    noseGeometry.setIndex([0, 2, 1]);
    noseGeometry.computeVertexNormals();
    const noseMesh = new THREE.Mesh(
      noseGeometry,
      new THREE.MeshBasicMaterial({ color: 0x4f9993, side: THREE.DoubleSide }),
    );
    noseMesh.name = "mouth-mark";
    object.add(noseMesh);
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.26, -0.28),
      new THREE.Vector3(-0.4, 0.12, -0.48),
      new THREE.Vector3(-0.66, 0.14, -0.24),
      new THREE.Vector3(-0.54, 0.27, -0.12),
    ]);
    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(tailCurve, 24, 0.075, 8, false),
      ink,
    );
    tail.name = "tail";
    tail.castShadow = true;
    object.add(tail);
    oval("tail-tip", [-0.54, 0.27, -0.12], [0.075, 0.075, 0.075], ink);
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
  object.traverse((node) => {
    if (!node.isMesh) return;
    const normal = node.geometry.attributes.normal;
    for (let i = 0; i < normal.count; i++) {
      if (Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) < 1e-8) {
        const position = node.geometry.attributes.position;
        const v = new THREE.Vector3(
          position.getX(i),
          position.getY(i),
          position.getZ(i),
        );
        if (v.lengthSq() < 1e-8) v.set(0, 0, 1);
        v.normalize();
        normal.setXYZ(i, v.x, v.y, v.z);
      }
    }
    node.geometry.normalizeNormals();
  });
  return { object, eyes, setBlink };
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
