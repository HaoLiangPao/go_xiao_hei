import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
export async function validateCollections({
  directory = new URL("../src/collections/", import.meta.url),
  publicDirectory = new URL("../public/", import.meta.url),
} = {}) {
  let count = 0;
  const https = (url) => {
    try {
      return new URL(url).protocol === "https:";
    } catch {
      return false;
    }
  };
  for (const name of (await readdir(directory)).filter((n) =>
    n.endsWith(".json"),
  )) {
    const pack = JSON.parse(await readFile(new URL(name, directory), "utf8"));
    if (
      name !== `${pack.id}.json` ||
      !/^[a-z0-9-]+$/.test(pack.id) ||
      !pack.title ||
      !pack.scope ||
      !pack.checkedAt ||
      !pack.sources?.length ||
      !pack.sources.every(https) ||
      !Array.isArray(pack.limitations) ||
      !pack.characters?.length ||
      new Set(pack.characters.map((c) => c.id)).size !== pack.characters.length
    )
      throw new Error(`作品资料无效：${name}`);
    for (const c of [...pack.characters, ...(pack.candidates || [])]) {
      if (
        !/^[a-z0-9-]+$/.test(c.id) ||
        !c.name ||
        !c.summary ||
        !c.sources?.length ||
        !c.sources.every(https)
      )
        throw new Error(`人物出处无效：${name}/${c.id}`);
      for (const section of c.sections || [])
        if (
          !section.title ||
          !section.items?.length ||
          section.items.some(
            (i) => !i.text || !i.sources?.length || !i.sources.every(https),
          )
        )
          throw new Error(`人物正文无效：${c.id}`);
      for (const ref of c.references || []) {
        if (
          !/^\/art\/[A-Za-z0-9_/-]+\.(png|jpe?g|webp)$/.test(ref.src) ||
          ref.src.includes("..") ||
          !ref.title ||
          !ref.description ||
          !https(ref.sourceUrl) ||
          !ref.credit ||
          !ref.licenseStatus
        )
          throw new Error(`作品图片资料无效：${c.id}`);
        const bytes = await readFile(
          new URL(ref.src.slice(1), publicDirectory),
        );
        if (
          bytes.length !== ref.bytes ||
          createHash("sha256").update(bytes).digest("hex") !== ref.sha256
        )
          throw new Error(`作品图片校验失败：${ref.src}`);
      }
    }
    for (const media of pack.media || [])
      if (
        !media.id ||
        !https(media.url) ||
        !media.title ||
        !media.publisher ||
        !media.description ||
        (media.platform === "youtube" &&
          !/^[A-Za-z0-9_-]{11}$/.test(media.videoId || ""))
      )
        throw new Error(`原声资料无效：${name}`);
    count++;
  }
  console.log(`作品资料核验通过：${count} 篇。`);
  return count;
}
