import React, { useState } from "react";
import { movie1EmbedUrl, sectionHasEnding, isReading } from "./movie1Model.js";
import { characterHref } from "./characterModel.js";
const packs = import.meta.glob("./collections/*.json", {
  eager: true,
  import: "default",
});
export const collections = Object.fromEntries(
  Object.values(packs).map((pack) => [pack.id, pack]),
);
export function CollectionCards() {
  return (
    <section className="collection-picker" aria-label="按作品看人物">
      <h2>一部一部，慢慢认识</h2>
      <div className="collection-links">
        {Object.values(collections)
          .sort((a, b) => a.order - b.order)
          .map((pack) => (
            <a key={pack.id} href={`#/characters/collection/${pack.id}`}>
              <small>{pack.year || "TV 动画"}</small>
              <strong>{pack.title}</strong>
              <span>{pack.characters.length} 条人物记录 · 查看这一篇</span>
            </a>
          ))}
      </div>
    </section>
  );
}
export function CollectionDetail({ collection, profiles, Sources }) {
  const [query, setQuery] = useState("");
  const characters = collection.characters.filter((c) =>
    [c.name, ...(c.aliases || [])].join(" ").includes(query.trim()),
  );
  const candidates = (collection.candidates || []).filter((c) =>
    [c.name, ...(c.aliases || [])].join(" ").includes(query.trim()),
  );
  return (
    <article className="work-detail">
      <a className="character-back" href="#/characters">
        ‹ 人物索引
      </a>
      <header className="library-intro">
        <div>
          <p className="library-eyebrow">按作品认识人物 · {collection.year}</p>
          <h1>{collection.title}</h1>
          <p>{collection.intro}</p>
        </div>
        <div className="library-count">
          <strong>{collection.characters.length}</strong>
          <span>条有出处的人物记录</span>
        </div>
      </header>
      <nav className="collection-links" aria-label="切换作品">
        {Object.values(collections)
          .sort((a, b) => a.order - b.order)
          .map((c) => (
            <a
              href={`#/characters/collection/${c.id}`}
              key={c.id}
              aria-current={c.id === collection.id ? "page" : undefined}
            >
              {c.title}
            </a>
          ))}
      </nav>
      <p className="cast-scope">{collection.scope}</p>
      <Sources urls={collection.sources} />
      <label className="collection-search">
        在这一篇找人物
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名字或别名"
        />
      </label>
      <p role="status">
        找到 {characters.length} 条人物记录
        {candidates.length > 0 && `，另有 ${candidates.length} 条待核目录线索`}
      </p>
      <div className="work-characters">
        {characters.map((c) => (
          <section key={c.id} className="work-character" id={`role-${c.id}`}>
            <div className="library-section-heading">
              <h2>{c.name}</h2>
              <span>{c.role || "出场人物"}</span>
            </div>
            <p>{c.summary}</p>
            {c.voiceActor && <p>中文配音：{c.voiceActor}</p>}
            <Sources urls={c.sources} />
            {c.sections?.map((section) => (
              <CharacterStorySection
                key={section.title}
                section={section}
                Sources={Sources}
              />
            ))}
            {c.references?.length > 0 && (
              <div className="collection-images">
                {c.references.map((ref) => (
                  <figure key={ref.src}>
                    <a href={ref.src} target="_blank" rel="noreferrer">
                      <img
                        loading="lazy"
                        src={ref.src}
                        alt={ref.description || ref.title}
                      />
                    </a>
                    <figcaption>
                      {ref.title}
                      <p>{ref.description}</p>
                      <a href={ref.sourceUrl} target="_blank" rel="noreferrer">
                        图片出处
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {profiles[c.id] && (
              <a className="character-gallery-jump" href={characterHref(c.id)}>
                打开{c.name}的完整图册
              </a>
            )}
          </section>
        ))}
      </div>
      {candidates.length > 0 && (
        <details
          className="collection-candidates"
          open={query.trim() ? true : undefined}
        >
          <summary>
            关联目录中还有这些名字 · 出场待核（{candidates.length}）
          </summary>
          <p>
            下面来自社区关联目录，尚未逐集核对，不能作为本篇已出场的完整名单。
          </p>
          <ul>
            {candidates.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                <span>{c.summary}</span>
                <Sources urls={c.sources} />
              </li>
            ))}
          </ul>
        </details>
      )}
      {!characters.length && !candidates.length && (
        <p>这一篇里没有匹配的名字，试试其他写法。</p>
      )}
      <CharacterFilmVoices collection={collection} />
      <section className="character-boundaries">
        <h2>这一篇的资料说明</h2>
        {collection.limitations.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p>
          核对日期：{collection.checkedAt}
          。非官方整理，人物、原图和影片版权归原权利人。
        </p>
      </section>
    </article>
  );
}
export function CharacterStorySection({ section, Sources }) {
  const body = section.items.map((item, index) => (
    <div key={index}>
      {isReading(item.evidence) && (
        <span className="character-reading-label">观影解读</span>
      )}
      <p>{item.text}</p>
      <Sources urls={item.sources} />
    </div>
  ));
  return sectionHasEnding(section) ? (
    <details className="character-notes character-ending">
      <summary>
        <h2>{section.title}</h2>
        <small>包含剧情进展 · 点开阅读</small>
      </summary>
      {body}
    </details>
  ) : (
    <section className="character-notes">
      <h2>{section.title}</h2>
      {body}
    </section>
  );
}
export function CharacterFilmVoices({ profile, collection }) {
  const film = collection || collections[profile?.collectionId];
  const [opened, setOpened] = useState(null);
  if (!film) return null;
  const media = film.media || [];
  const actor = profile?.chineseVoiceActor;
  return (
    <section
      className="character-film-voices"
      aria-labelledby="film-voices-title"
    >
      <div className="library-section-heading">
        <h2 id="film-voices-title">配音和原片资料</h2>
        <span>{film.title}</span>
      </div>
      {actor && (
        <p className="film-voice-actor">
          中文配音：<strong>{actor}</strong>
          <a href={profile.voiceSources[0]} target="_blank" rel="noreferrer">
            演职员出处
          </a>
        </p>
      )}
      <p className="film-voice-note">
        这里收录官方特辑、预告或正版剧集入口，包含多位角色。点开后可在原平台回看；逐句台词还没有校听。
      </p>
      <div className="film-media-list">
        {media.map((entry) => {
          const embed = movie1EmbedUrl(entry);
          return (
            <article key={entry.id} className="film-media-card">
              <div>
                <p className="film-media-kind">
                  {entry.kind} · {entry.publisher}
                </p>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </div>
              <div className="film-media-actions">
                {embed && (
                  <button
                    type="button"
                    aria-expanded={opened === entry.id}
                    aria-controls={`player-${entry.id}`}
                    onClick={() =>
                      setOpened(opened === entry.id ? null : entry.id)
                    }
                  >
                    {opened === entry.id ? "收起播放器" : "展开官方播放器"}
                    <span className="sr-only">：{entry.title}</span>
                  </button>
                )}
                <a href={entry.url} target="_blank" rel="noreferrer">
                  在原平台打开<span className="sr-only">：{entry.title}</span>
                </a>
                {entry.alternativeUrl && (
                  <a
                    href={entry.alternativeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    B站正版入口<span className="sr-only">：{entry.title}</span>
                  </a>
                )}
              </div>
              {opened === entry.id && embed && (
                <div id={`player-${entry.id}`} className="film-player">
                  <iframe
                    src={embed}
                    title={entry.title}
                    allow="encrypted-media; fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                  <p>
                    播放器需要联网。加载不出来时，可以使用上面的原平台或B站入口。
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
