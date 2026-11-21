import { build } from "vite";
import { writeFile, copyFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  createCharacter,
  createHopClip,
  modelNames,
} from "../model-lab/meshes.js";
// GLTFExporter reads Blob data in the same way in the browser. No images/textures are used.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  root,
  configFile: false,
  publicDir: false,
  build: {
    outDir: "public/models",
    emptyOutDir: false,
    lib: {
      entry: root + "model-lab/main.js",
      name: "CharacterModelLab",
      formats: ["iife"],
      fileName: () => "lab.js",
    },
  },
});
const models = [];
for (const id of Object.keys(modelNames)) {
  const { object } = createCharacter(id);
  const buffer = Buffer.from(
    await new GLTFExporter().parseAsync(object, {
      binary: true,
      animations: [createHopClip(object)],
    }),
  );
  await writeFile(root + `public/models/${id}.glb`, buffer);
  models.push({
    id,
    name: modelNames[id],
    src: `/models/${id}.glb`,
    bytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  });
}

await copyFile(
  root + "node_modules/three/LICENSE",
  root + "public/models/THREE-LICENSE.txt",
);
async function record(path) {
  const b = await readFile(root + path);
  return {
    path,
    bytes: b.length,
    sha256: createHash("sha256").update(b).digest("hex"),
  };
}
const files = await Promise.all(
  [
    "index.html",
    "lab.css",
    "lab.js",
    "THREE-LICENSE.txt",
    "xiaohei.glb",
    "heixiu.glb",
  ].map((p) => record("public/models/" + p)),
);
const sources = await Promise.all(
  [
    "model-lab/main.js",
    "model-lab/meshes.js",
    "scripts/build-model-lab.mjs",
  ].map(record),
);
await writeFile(
  root + "public/models/manifest.json",
  JSON.stringify(
    {
      version: 1,
      kind: "non-official-procedural-study",
      models,
      files,
      sources,
    },
    null,
    2,
  ) + "\n",
);
console.log(models.map((m) => `${m.name}: ${m.bytes} bytes`).join("\n"));
