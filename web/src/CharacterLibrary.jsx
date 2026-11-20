import React, { useEffect, useMemo, useRef, useState } from "react";
import cast from "./character-cast.json";
import { characterHref, filterCharacters } from "./characterModel.js";
import { Icon } from "./Artwork.jsx";
import "./characters.css";

const packs = import.meta.glob("./characters/*.json", {
  eager: true,
  import: "default",
});
const profiles = Object.fromEntries(
  Object.values(packs).map((profile) => [profile.id, profile]),
);
const workLabels = {
  tv: "TV 动画",
  movie1: "电影一",
  movie2: "电影二",
  other: "番外与漫画",
  unverified: "作品归属待核",
};
function ReferenceImage({ reference, ...props }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="reference-unavailable">
      图片暂未载入，请查看下方原始出处。
    </div>
  ) : (
    <img
      src={reference.src}
      alt={reference.description || reference.title}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
function SourceLinks({ urls = [] }) {
  const link = (url, index) => (
    <a href={url} key={url} target="_blank" rel="noreferrer">
      来源 {index + 1}
      <span className="sr-only">：{new URL(url).hostname}</span>
    </a>
  );
  return (
    <div className="character-sources">
      {urls.slice(0, 2).map(link)}
      {urls.length > 2 && (
        <details>
          <summary>其余 {urls.length - 2} 个出处</summary>
          {urls.slice(2).map((url, i) => link(url, i + 2))}
        </details>
      )}
    </div>
  );
}
function LibraryHeader() {
  return (
    <header className="library-header">
      <a className="brand" href="#">
        <Icon name="leaf" />
        <span>
          四时拾光<small>画里的人，一起记住</small>
        </span>
      </a>
      <nav aria-label="资料库导航">
        <a href="#/characters">人物索引</a>
        <a href="#">回到拼图</a>
      </nav>
    </header>
  );
}
function CastIndex() {
  const [query, setQuery] = useState(""),
    [work, setWork] = useState("all"),
    [readyOnly, setReadyOnly] = useState(false),
    [status, setStatus] = useState("all");
  const characters = useMemo(
    () =>
      filterCharacters(cast.characters, {
        query,
        work,
        readyOnly,
        status,
        profiles,
      }),
    [query, work, readyOnly, status],
  );
  const featured = Object.values(profiles).sort(
    (a, b) =>
      ["wuxian", "xiaohei", "nezha"].indexOf(a.id) -
      ["wuxian", "xiaohei", "nezha"].indexOf(b.id),
  );
  return (
    <>
      <section className="library-intro">
        <div>
          <p className="library-eyebrow">罗小黑战记 · 人物资料库</p>
          <h1>画中同行</h1>
          <p>从四时里的相遇，认一认每张熟悉的面孔。</p>
          <p className="library-intro-note">
            人物背景、性格与造型参考，按出处慢慢整理。
          </p>
        </div>
        <div className="library-count">
          <strong>{cast.characters.length}</strong>
          <span>条角色索引</span>
          <small>
            {cast.characters.filter((c) => c.status === "confirmed").length}{" "}
            条官方来源核对
          </small>
          <small>
            {featured.length} 份详情 ·{" "}
            {featured.reduce((n, p) => n + p.references.length, 0)} 张参考图
          </small>
        </div>
      </section>
      <section aria-labelledby="featured-title" className="featured-characters">
        <div className="library-section-heading">
          <h2 id="featured-title">先从四时里的他们开始</h2>
          <span>2020 节气图集</span>
        </div>
        <div className="featured-grid">
          {featured.map((profile) => (
            <a
              className="featured-character"
              key={profile.id}
              href={characterHref(profile.id)}
              style={{ "--character-accent": profile.accent }}
            >
              <div className="featured-art">
                <ReferenceImage
                  reference={profile.references[profile.heroRef || 0]}
                />
              </div>
              <div className="featured-copy">
                <h3>{profile.name}</h3>
                <p>{profile.subtitle}</p>
                <span>{profile.references.length} 张参考图 · 查看人物档案</span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="cast-index" aria-labelledby="cast-title">
        <div className="library-section-heading">
          <h2 id="cast-title">角色索引</h2>
          <span>可按名字、别名或作品查找</span>
        </div>
        <p className="cast-scope">{cast.scope}</p>
        <form className="cast-filters" onSubmit={(e) => e.preventDefault()}>
          <label>
            找一位角色
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名字或别名"
            />
          </label>
          <label>
            出现作品
            <select
              aria-label="出现作品"
              value={work}
              onChange={(e) => setWork(e.target.value)}
            >
              <option value="all">全部作品</option>
              {Object.entries(workLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            核对状态
            <select
              aria-label="核对状态"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">全部条目</option>
              <option value="official">有官方来源</option>
              <option value="catalog">目录收录待核</option>
            </select>
          </label>
          <label className="cast-ready">
            <input
              type="checkbox"
              checked={readyOnly}
              onChange={(e) => setReadyOnly(e.target.checked)}
            />
            只看已有详情
          </label>
        </form>
        <p className="cast-result" role="status">
          找到 {characters.length} 位角色
        </p>
        <div className="cast-table-scroll">
          <table className="cast-table">
            <thead>
              <tr>
                <th scope="col">人物</th>
                <th scope="col">出场与设定简记</th>
                <th scope="col">出处</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id}>
                  <th scope="row">
                    {profiles[character.id] ? (
                      <a href={characterHref(character.id)}>{character.name}</a>
                    ) : (
                      character.name
                    )}
                    <small>{character.aliases?.join("、")}</small>
                    {!profiles[character.id] && (
                      <span className="cast-pending">详情待整理</span>
                    )}
                  </th>
                  <td>
                    <span className="cast-works">
                      {(
                        character.workDetails ||
                        character.works.map((id) => workLabels[id] || id)
                      ).join(" / ")}
                    </span>
                    <p>{character.summary}</p>
                    {character.status !== "confirmed" && (
                      <span className="cast-pending">待进一步核实</span>
                    )}
                  </td>
                  <td>
                    <SourceLinks urls={character.sources} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!characters.length && (
          <p className="cast-empty">
            暂时没有匹配人物。试试别名，或把作品选回“全部作品”。
          </p>
        )}
        <details className="library-research">
          <summary>收录范围与待核对的名字</summary>
          <p>
            核对日期：{cast.checkedAt}
            。角色索引与完整人物档案分开维护，未整理详情不表示该角色不存在。
          </p>
          {cast.limitations?.map((item) => (
            <p key={item}>{item}</p>
          ))}
          {cast.unresolvedNames?.map((item, i) => (
            <p key={i}>
              {typeof item === "string"
                ? item
                : `${item.input || item.name}：${item.note || item.reason}`}
            </p>
          ))}
          <SourceLinks
            urls={cast.sourceCatalogs.map((s) =>
              typeof s === "string" ? s : s.url,
            )}
          />
        </details>
      </section>
    </>
  );
}
function Detail({ profile }) {
  const [selected, setSelected] = useState(null),
    dialog = useRef(null),
    returnFocus = useRef(null);
  const image = selected === null ? null : profile.references[selected];
  useEffect(() => {
    if (selected !== null && !dialog.current.open) dialog.current.showModal();
  }, [selected]);
  const close = () => {
    dialog.current?.close();
    setSelected(null);
    returnFocus.current?.focus();
  };
  const open = (index, event) => {
    returnFocus.current = event.currentTarget;
    setSelected(index);
  };
  const hero = profile.references[profile.heroRef || 0];
  return (
    <article
      className="character-detail"
      style={{ "--character-accent": profile.accent }}
    >
      <a className="character-back" href="#/characters">
        ‹ 人物索引
      </a>
      <section className="character-hero">
        <div className="character-hero-art">
          <ReferenceImage reference={hero} />
          <span>造型参考 · {hero.kind}</span>
        </div>
        <div className="character-hero-copy">
          <p className="library-eyebrow">人物档案 · {profile.eraLabel}</p>
          <h1>{profile.name}</h1>
          <p className="character-subtitle">{profile.subtitle}</p>
          <p>{profile.summary}</p>
          <dl className="character-at-a-glance">
            {profile.basics.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="character-2020">
            <span>在四时里遇见</span>
            {profile.appearance2020}
          </p>
          <a
            className="character-gallery-jump"
            href="#references"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("references")
                .scrollIntoView({ behavior: "instant" });
            }}
          >
            看 {profile.references.length} 张参考图
          </a>
        </div>
      </section>
      <div className="character-notes-grid">
        {profile.sections.map((section) => (
          <section className="character-notes" key={section.title}>
            <h2>{section.title}</h2>
            {section.items.map((item, i) => (
              <div key={i}>
                <p>{item.text}</p>
                <SourceLinks urls={item.sources} />
              </div>
            ))}
          </section>
        ))}
      </div>
      <section className="character-reference-section" id="references">
        <div className="library-section-heading">
          <h2>造型参考图册</h2>
          <span>{profile.references.length} 张 · 点开看完整图</span>
        </div>
        <p className="reference-guidance">
          保留完整画面与出处。作品画面可辅助观察比例、服装和表情；没有提供的角度不能当作已核实的三视图。
        </p>
        <div className="character-reference-grid">
          {profile.references.map((reference, index) => (
            <figure key={reference.src} className="character-reference">
              <button
                className="reference-open"
                onClick={(e) => open(index, e)}
                aria-label={`放大参考图：${reference.title}`}
              >
                <ReferenceImage reference={reference} loading="lazy" />
                <span aria-hidden="true">查看完整图</span>
              </button>
              <figcaption>
                <span className="reference-kind">{reference.kind}</span>
                <h3>{reference.title}</h3>
                <p>{reference.description}</p>
                <p className="reference-modeling">
                  <b>造型观察</b>
                  {reference.modelingUse}
                </p>
                <a href={reference.sourceUrl} target="_blank" rel="noreferrer">
                  原始出处
                </a>
                <small>{reference.credit}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="character-boundaries">
        <h2>资料边界</h2>
        {profile.uncertainties.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <p>{profile.rights}</p>
        <p>核对日期：{profile.checkedAt}。含人物设定与部分剧情信息。</p>
      </section>
      <dialog
        ref={dialog}
        className="reference-dialog"
        aria-labelledby="reference-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onClose={() => {
          if (selected !== null) {
            setSelected(null);
            returnFocus.current?.focus();
          }
        }}
      >
        {image && (
          <div className="reference-dialog-content">
            <header>
              <h2 id="reference-dialog-title">{image.title}</h2>
              <button onClick={close} aria-label="关闭参考图">
                ×
              </button>
            </header>
            <ReferenceImage key={image.src} reference={image} />
            <p>{image.description}</p>
            <div className="reference-dialog-navigation">
              <button
                disabled={selected === 0}
                onClick={() => setSelected(selected - 1)}
              >
                上一张
              </button>
              <span>
                {selected + 1} / {profile.references.length}
              </span>
              <button
                disabled={selected === profile.references.length - 1}
                onClick={() => setSelected(selected + 1)}
              >
                下一张
              </button>
            </div>
            <a href={image.sourceUrl} target="_blank" rel="noreferrer">
              查看原始出处
            </a>
          </div>
        )}
      </dialog>
    </article>
  );
}
export function CharacterLibrary({ route }) {
  const profile = route.kind === "detail" ? profiles[route.id] : null;
  useEffect(() => {
    document.title = `${profile?.name || "人物资料库"} · 四时拾光`;
    return () => {
      document.title = "小黑的四时拾光";
    };
  }, [profile?.name]);
  return (
    <div className="character-library">
      <LibraryHeader />
      <main id="character-main">
        {route.kind === "index" ? (
          <CastIndex />
        ) : profile ? (
          <Detail key={profile.id} profile={profile} />
        ) : (
          <section className="character-missing">
            <h1>这份人物档案还没整理好</h1>
            <p>先到角色索引看看，已有资料的人物可以直接打开。</p>
            <a href="#/characters">回到人物索引</a>
          </section>
        )}
      </main>
      <footer className="library-footer">
        <span>非官方资料整理 · 原图与人物版权归原权利人</span>
        <a href="#">回到四时拼图</a>
      </footer>
    </div>
  );
}
