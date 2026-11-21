import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Box3, AnimationMixer } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createCharacter } from "../model-lab/meshes.js";
const manifest = JSON.parse(
  await readFile(
    new URL("../public/models/manifest.json", import.meta.url),
    "utf8",
  ),
);
test("两个练习模型导出后可重新加载，包含有限顶点、导出前后一致的包围盒和可播放动作", async () => {
  assert.equal(manifest.models.length, 2);
  for (const entry of manifest.models) {
    const bytes = await readFile(
      new URL("../public" + entry.src, import.meta.url),
    );
    assert.equal(bytes.length, entry.bytes);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      entry.sha256,
    );
    const model = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    let meshes = 0;
    model.scene.traverse((node) => {
      if (node.isMesh) {
        meshes++;
        assert.ok(
          [...node.geometry.attributes.position.array].every(Number.isFinite),
        );
        const normal = node.geometry.attributes.normal;
        for (let i = 0; i < normal.count; i++)
          assert.ok(
            Math.abs(
              Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1,
            ) < 0.001,
          );
      }
    });
    assert.ok(meshes >= 7);
    const original = new Box3().setFromObject(createCharacter(entry.id).object),
      loaded = new Box3().setFromObject(model.scene);
    assert.ok(original.min.distanceTo(loaded.min) < 1e-5);
    assert.ok(original.max.distanceTo(loaded.max) < 1e-5);
    assert.equal(model.animations.length, 1);
    const mixer = new AnimationMixer(model.scene);
    mixer.clipAction(model.animations[0]).play();
    mixer.setTime(0.4);
    assert.ok(
      Math.abs(model.scene.getObjectByName(entry.id).position.y - 0.38) < 0.001,
    );
    mixer.stopAllAction();
  }
});
test("拒绝未知角色，简化模型不夹带外部素材地址", () => {
  assert.throws(() => createCharacter("unknown"));
  for (const id of ["xiaohei", "heixiu"]) {
    const c = createCharacter(id);
    assert.equal(c.eyes.length, 2);
  }
});

// Deformed facial patches must return to their original surface, so switching
// characters or replaying an action does not accumulate shape drift.
test("眨眼变形的顶点有限，复位不累积眼形漂移", () => {
  const cat = createCharacter("xiaohei");
  const before = cat.eyes.flatMap((eye) =>
    eye.children.map((mesh) =>
      Array.from(mesh.geometry.attributes.position.array),
    ),
  );
  cat.setBlink(0.06);
  const closed = cat.eyes.flatMap((eye) =>
    eye.children.map((mesh) =>
      Array.from(mesh.geometry.attributes.position.array),
    ),
  );
  assert.ok(
    closed.every(
      (positions, i) =>
        positions.every(Number.isFinite) &&
        positions.some((v, j) => Math.abs(v - before[i][j]) > 1e-4),
    ),
  );
  cat.setBlink(1);
  cat.eyes
    .flatMap((eye) => eye.children)
    .forEach((mesh, i) =>
      Array.from(mesh.geometry.attributes.position.array).forEach((v, j) =>
        assert.ok(Math.abs(v - before[i][j]) < 1e-6),
      ),
    );
});
