// Pure helpers shared by the reference library and its data checks.
export function characterRoute(hash = "") {
  const collection = /^#\/characters\/collection\/([a-z0-9-]+)\/?$/.exec(hash);
  if (collection) return { kind: "collection", id: collection[1] };
  const match = /^#\/characters(?:\/([^/?#]+))?\/?$/.exec(hash);
  if (!match)
    return hash.startsWith("#/characters")
      ? { kind: "missing" }
      : { kind: "game" };
  if (!match[1]) return { kind: "index" };
  try {
    return { kind: "detail", id: decodeURIComponent(match[1]) };
  } catch {
    return { kind: "missing" };
  }
}
export function filterCharacters(
  characters,
  {
    query = "",
    work = "all",
    readyOnly = false,
    status = "all",
    profiles = {},
  } = {},
) {
  const term = query.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
  return characters.filter(
    (character) =>
      (!readyOnly || Object.hasOwn(profiles, character.id)) &&
      (status === "all" ||
        (status === "official"
          ? character.status === "confirmed"
          : character.status !== "confirmed")) &&
      (work === "all" || character.works.includes(work)) &&
      (!term ||
        [
          character.name,
          ...(character.aliases || []),
          ...(character.userSpellings || []),
          character.summary,
        ]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase("zh-CN")
          .includes(term)),
  );
}
export function characterHref(id) {
  return `#/characters/${encodeURIComponent(id)}`;
}
