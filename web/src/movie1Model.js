// Official video links stay external until the reader chooses to open a player.
export function movie1EmbedUrl(media) {
  if (
    media.platform !== "youtube" ||
    !/^[A-Za-z0-9_-]{11}$/.test(media.videoId || "")
  )
    return null;
  try {
    const source = new URL(media.url);
    const isYouTube =
      ["www.youtube.com", "youtube.com"].includes(source.hostname) &&
      source.pathname === "/watch";
    if (
      source.protocol !== "https:" ||
      !isYouTube ||
      source.searchParams.get("v") !== media.videoId
    )
      return null;
    return `https://www.youtube-nocookie.com/embed/${media.videoId}?rel=0`;
  } catch {
    return null;
  }
}
export function sectionHasEnding(section) {
  return (
    Boolean(section.spoiler) ||
    section.items.some(
      (item) =>
        item.spoiler === true ||
        /中度|重大|结尾/.test(String(item.spoiler || "")),
    )
  );
}
export function isReading(text) {
  return /interpretation|解读/.test(text || "");
}
