import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
export async function validateModelResources() {
  const root = new URL("../", import.meta.url),
    manifest = JSON.parse(
      await readFile(new URL("public/models/manifest.json", root), "utf8"),
    );
  if (
    manifest.models.length !== 2 ||
    !manifest.files?.length ||
    !manifest.sources?.length
  )
    throw Error("练习模型清单不完整");
  for (const file of [...manifest.files, ...manifest.sources]) {
    if (!/^[A-Za-z0-9_./-]+$/.test(file.path) || file.path.includes(".."))
      throw Error("模型文件路径无效");
    const b = await readFile(new URL(file.path, root));
    if (
      b.length !== file.bytes ||
      createHash("sha256").update(b).digest("hex") !== file.sha256
    )
      throw Error("模型文件缺失、损坏或未重新生成：" + file.path);
  }
  console.log("练习模型、静态页面和生成源文件校验通过");
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await validateModelResources();
