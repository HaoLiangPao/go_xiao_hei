import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
export async function validateCharacterResources({
  directory = new URL("src/characters/", root),
  publicDirectory = new URL("public/", root),
} = {}) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
  let count = 0,
    size = 0;
  for (const name of names) {
    const profile = JSON.parse(
      await readFile(new URL(name, directory), "utf8"),
    );
    if (
      !/^[a-z0-9-]+$/.test(profile.id) ||
      name !== `${profile.id}.json` ||
      !profile.name ||
      !profile.summary ||
      !profile.checkedAt ||
      !Array.isArray(profile.sections) ||
      !profile.sections.length ||
      !Array.isArray(profile.basics) ||
      !profile.basics.length ||
      !Array.isArray(profile.uncertainties)
    )
      throw new Error(`人物档案无效：${name}`);
    const references = profile.references;
    if (
      !Array.isArray(references) ||
      references.length < 5 ||
      references.length > 10 ||
      new Set(references.map((ref) => ref.src)).size !== references.length ||
      new Set(references.map((ref) => ref.sha256)).size !== references.length ||
      !Number.isInteger(profile.heroRef) ||
      profile.heroRef < 0 ||
      profile.heroRef >= references.length
    )
      throw new Error(`人物参考图需要 5–10 张独立图像：${name}`);
    const sourced = [
      ...profile.sections.flatMap((section) =>
        section.items.flatMap((item) => item.sources || []),
      ),
      ...references.map((ref) => ref.sourceUrl),
    ];
    if (
      profile.sections.some(
        (section) =>
          !section.items.length ||
          section.items.some((item) => !item.text || !item.sources?.length),
      ) ||
      sourced.some((url) => {
        try {
          return new URL(url).protocol !== "https:";
        } catch {
          return true;
        }
      })
    )
      throw new Error(`人物资料缺少可追溯 HTTPS 出处：${name}`);
    for (const reference of references) {
      if (
        !/^\/art\/[A-Za-z0-9_/-]+\.(png|jpg|jpeg|webp)$/.test(reference.src) ||
        reference.src.includes("..") ||
        !reference.description ||
        !reference.modelingUse ||
        !reference.credit ||
        !reference.licenseStatus
      )
        throw new Error(`人物参考图路径或资料无效：${name}`);
      const bytes = await readFile(
        new URL(reference.src.slice(1), publicDirectory),
      );
      if (
        bytes.length !== reference.bytes ||
        createHash("sha256").update(bytes).digest("hex") !== reference.sha256
      )
        throw new Error(`人物参考图校验失败：${reference.src}`);
      count++;
      size += bytes.length;
    }
  }
  console.log(
    `人物资源核验通过：${names.length} 份档案、${count} 张参考，共 ${size} bytes（共享图按引用计）。`,
  );
  return { profiles: names.length, references: count, bytes: size };
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await validateCharacterResources();
