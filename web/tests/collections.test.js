import test from "node:test";
import assert from "node:assert/strict";
import { characterRoute, filterCharacters } from "../src/characterModel.js";
import { movie1EmbedUrl, sectionHasEnding } from "../src/movie1Model.js";
import { validateCollections } from "../scripts/collection-resources.mjs";
test("作品直达链接与用户确认的姓名写法", () => {
  assert.deepEqual(characterRoute("#/characters/collection/movie1"), {
    kind: "collection",
    id: "movie1",
  });
  assert.deepEqual(characterRoute("#/characters/collection/%zz"), {
    kind: "missing",
  });
  assert.deepEqual(
    filterCharacters(
      [{ name: "山新", id: "shanxin", works: ["tv"], userSpellings: ["善心"] }],
      { query: "善心" },
    ).map((c) => c.id),
    ["shanxin"],
  );
});
test("播放器只接收与出处一致的YouTube ID，剧透默认折叠", () => {
  const m = {
    platform: "youtube",
    videoId: "UwZZbx9ZRNc",
    url: "https://www.youtube.com/watch?v=UwZZbx9ZRNc",
  };
  assert.equal(
    movie1EmbedUrl(m),
    "https://www.youtube-nocookie.com/embed/UwZZbx9ZRNc?rel=0",
  );
  for (const url of [
    "https://evil.com/watch?v=UwZZbx9ZRNc",
    "https://www.youtube.com/watch?v=wkmD3lLIjq4",
    "javascript:alert(1)",
  ])
    assert.equal(movie1EmbedUrl({ ...m, url }), null);
  assert.equal(sectionHasEnding({ items: [{ spoiler: true }] }), true);
  assert.equal(sectionHasEnding({ items: [{ spoiler: false }] }), false);
});
test("所有已安装作品的正文、图片和出处完整", async () => {
  await validateCollections();
});
