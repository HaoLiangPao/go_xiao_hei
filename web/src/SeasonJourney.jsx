import React, { useState } from "react";
import { seasons, solarTerms } from "./solarTerms.js";
import { termStatus } from "./journeyModel.js";

export function YearProgress({ journey, current, onOpen }) {
  const term = solarTerms.find((item) => item.id === current) ?? solarTerms[0];
  const season = seasons.find((item) => item.id === term.season);
  const terms = solarTerms.filter((item) => item.season === season.id);
  const count = terms.filter((item) => journey.completed.has(item.id)).length;
  return <button className="year-progress" onClick={onOpen} data-current-season={season.id}
    style={{ "--term-color": season.color }}
    aria-label={`选择节气，已点亮 ${journey.completed.size} / 24，${season.title} ${count} / 6`}>
    <span className="year-progress-label">2020 · {season.title}<small>本季 {count} / 6</small></span>
    <span className="year-dots" aria-hidden="true">
      {terms.map((item) => <i key={item.id} title={item.title} data-progress-term={item.id}
        className={`${journey.completed.has(item.id) ? "lit" : ""} ${current === item.id ? "current" : ""}`} />)}
    </span>
    <span className="year-open">全年 {journey.completed.size} / 24<small>四季选关 ›</small></span>
  </button>;
}

function TermArtwork({ term }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="term-image-missing">图片未载入</span> :
    <img src={term.image} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function SeasonJourney({ journey, current, onSelect, saveError }) {
  return <div className="season-journey">
    <div className="journey-summary">
      <div><p>2020 年节气图集</p><h2 id="journey-title">走过四时</h2>
        <span>从立春到大寒，一关一关点亮。</span></div>
      <div className="journey-count"><strong>{journey.completed.size}</strong><span> / 24 个节气</span></div>
    </div>
    <progress className="journey-progress" max="24" value={journey.completed.size} aria-label="节气旅程完成进度" />
    {saveError && <p className="journey-save-note" role="status">暂时无法保存旅程，仍可在本页继续游玩。</p>}
    <div className="journey-legend"><span>● 已点亮</span><span>◎ 可以出发</span><span>○ 等待解锁</span></div>
    <p className="journey-series-note">本图集包含全部 24 个节气；灰色图片表示尚未解锁。</p>
    {seasons.map((season, seasonIndex) => {
      const terms = solarTerms.filter((term) => term.season === season.id);
      return <section className="season-track" key={season.id} style={{ "--term-color": season.color }} aria-label={`${season.title}的六个节气`}>
        <header><h3>{season.name}</h3><span>{terms.filter((term) => journey.completed.has(term.id)).length} / 6</span></header>
        <div className="term-track">
          {terms.map((term, index) => {
            const status = termStatus(term.id, journey);
            return <button key={term.id} className={`term-node is-${status}`} disabled={status === "locked"}
              data-term={term.id} data-status={status} aria-current={term.id === current ? "step" : undefined}
              aria-label={`${term.title}，${status === "complete" ? "已点亮，可重玩" : status === "available" ? "可进入" : "未解锁"}`}
              onClick={() => onSelect(term.id)}>
              <span className="term-orb"><TermArtwork term={term} />
                {status === "complete" && <b aria-hidden="true">✓</b>}</span>
              {index < 5 && <span aria-hidden="true" className={`term-link ${index === 2 ? "term-link-turn" : index > 2 ? "term-link-back" : ""}`} />}
              <strong>{term.title}</strong><small>{status === "complete" ? "已点亮" : status === "available" ? "继续拼图" : "等待解锁"}</small>
            </button>;
          })}
        </div>
        {seasonIndex < 3 && <span className="season-next" aria-hidden="true">下一季 · {seasons[seasonIndex + 1].title} ↓</span>}
      </section>;
    })}
    <p className="journey-footnote">完整拼好当前节气，即可点亮它并解锁下一关。已点亮的关卡可随时重玩；旧的未完成拼图也会保留。</p>
  </div>;
}
