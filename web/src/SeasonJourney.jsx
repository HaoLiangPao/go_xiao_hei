import React from "react";
import { seasons, solarTerms } from "./solarTerms.js";
import { termStatus } from "./journeyModel.js";

export function YearProgress({ journey, current, onOpen }) {
  return <button className="year-progress" onClick={onOpen}
    aria-label={`选择节气，已点亮 ${journey.completed.size} / 24`}>
    <span className="year-progress-label">四时旅程 <strong>{journey.completed.size}<small> / 24</small></strong></span>
    <span className="year-segments" aria-hidden="true">
      {seasons.map((season) => <span className="year-segment" key={season.id} style={{ "--term-color": season.color }}>
        <span>{season.name}</span><span className="year-dots">
          {solarTerms.filter((term) => term.season === season.id).map((term) =>
            <i key={term.id} className={`${journey.completed.has(term.id) ? "lit" : ""} ${current === term.id ? "current" : ""}`} />)}
        </span>
      </span>)}
    </span>
    <span className="year-open" aria-hidden="true">选关 ›</span>
  </button>;
}

export function SeasonJourney({ journey, current, onSelect, saveError }) {
  return <div className="season-journey">
    <div className="journey-summary">
      <div><p>一年的光，慢慢拾起</p><h2 id="journey-title">走过四时</h2>
        <span>从立春到大寒，一关一关点亮。</span></div>
      <div className="journey-count"><strong>{journey.completed.size}</strong><span> / 24 个节气</span></div>
    </div>
    <progress className="journey-progress" max="24" value={journey.completed.size} aria-label="节气旅程完成进度" />
    {saveError && <p className="journey-save-note" role="status">暂时无法保存旅程，仍可在本页继续游玩。</p>}
    <div className="journey-legend"><span>● 已点亮</span><span>◎ 可以出发</span><span>○ 等待解锁</span></div>
    {seasons.map((season) => {
      const terms = solarTerms.filter((term) => term.season === season.id);
      return <section className="season-track" key={season.id} style={{ "--term-color": season.color }} aria-label={`${season.title}的六个节气`}>
        <header><h3>{season.name}</h3><span>{terms.filter((term) => journey.completed.has(term.id)).length} / 6</span></header>
        <div className="term-track">
          {terms.map((term) => {
            const status = termStatus(term.id, journey);
            return <button key={term.id} className={`term-node is-${status}`} disabled={status === "locked"}
              data-term={term.id} data-status={status} aria-current={term.id === current ? "step" : undefined}
              aria-label={`${term.title}，${status === "complete" ? "已点亮，可重玩" : status === "available" ? "可进入" : "未解锁"}`}
              onClick={() => onSelect(term.id)}>
              <span className="term-orb"><span>{term.title[0]}</span>
                <img src={term.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
                {status === "complete" && <b aria-hidden="true">✓</b>}</span>
              <strong>{term.title}</strong><small>{status === "complete" ? "已点亮" : status === "available" ? "继续拼图" : "等待解锁"}</small>
            </button>;
          })}
        </div>
      </section>;
    })}
    <p className="journey-footnote">完整拼好当前节气，即可点亮它并解锁下一关。已点亮的关卡可随时重玩；旧的未完成拼图也会保留。</p>
  </div>;
}
