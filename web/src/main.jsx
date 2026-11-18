import React, { useState, useMemo, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  WIDTH,
  HEIGHT,
  levels,
  makePieces,
  shuffle,
  readProgress,
} from "./geometry.js";
import "./style.css";
const IMAGE = "/art/rain-2020.jpg";
const shapes = { flat: "方形碎片", classic: "经典拼图", organic: "不规则拼图" };
const story = [
  [
    "一片安静的灰色",
    "春雨落在叶尖。小黑停下脚步，觉得这个春天似乎还少了一点颜色。把散落的画面放回去，听听雨会带来什么。",
  ],
  [
    "叶子先醒了",
    "最先回来的，是叶子上的青绿。小黑蹲下来，把一颗摇摇欲坠的水珠看了好久。原来小小的东西，也能装下整个天空。",
  ],
  [
    "伞下有两个人",
    "“师父，你看。”他把声音放得很轻。伞向小黑那边挪了一点。雨还在下，可是这一小块地方，已经慢慢暖起来了。",
  ],
  [
    "春天已经在这里了",
    "最后一片颜色落回叶间。小黑决定再看一会儿水珠，师父便陪他等了一会儿。有些旅程不用赶路，也会走进心里。",
  ],
];
function Fragment({ piece, prefix }) {
  const id = `${prefix}-${piece.id}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={piece.path} />
        </clipPath>
      </defs>
      <image
        href={IMAGE}
        width={WIDTH}
        height={HEIGHT}
        clipPath={`url(#${id})`}
        pointerEvents="none"
      />
    </>
  );
}
function Puzzle({ level, shape }) {
  const { cols, rows } = levels[level],
    total = cols * rows,
    key = `shiguang-react-v1-${level}-${shape}`;
  const pieces = useMemo(
    () => makePieces(cols, rows, shape),
    [cols, rows, shape],
  );
  const [placed, setPlaced] = useState(() => {
      try {
        return readProgress(window.localStorage, key, total);
      } catch {
        return new Set();
      }
    }),
    [order, setOrder] = useState(() => shuffle(total)),
    [selected, setSelected] = useState(null),
    [hint, setHint] = useState(null),
    [wrong, setWrong] = useState(null),
    [preview, setPreview] = useState(false),
    [guide, setGuide] = useState(true),
    [loadError, setLoadError] = useState(false),
    [saveError, setSaveError] = useState(false),
    [message, setMessage] = useState(
      "选一片画面，再点它原来的位置。也可以用鼠标拖放。",
    );
  const piecesRef = useRef({});
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...placed]));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [placed, key]);
  useEffect(() => {
    const exit = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setHint(null);
        setPreview(false);
      }
    };
    window.addEventListener("keydown", exit);
    return () => window.removeEventListener("keydown", exit);
  }, []);
  function select(id) {
    if (preview || placed.has(id)) return;
    setSelected(id);
    setHint(null);
    setWrong(null);
    setMessage("拿好了。看看画面里的线条，把它放回去。");
  }
  function place(target, source = selected) {
    if (preview || placed.has(target)) return;
    if (source === null) {
      setMessage("先在右侧选一片画面。");
      return;
    }
    if (source !== target) {
      setWrong(target);
      setMessage("这片属于别的地方，再看看颜色和线条。");
      return;
    }
    const next = new Set(placed).add(target);
    setPlaced(next);
    setSelected(null);
    setHint(null);
    setWrong(null);
    setMessage(
      next.size === total
        ? "春天完整了。谢谢你陪小黑走完这一场雨。"
        : "颜色回来了。慢慢来，还有一些记忆等着你。",
    );
    const nextId = order.find((id) => !next.has(id));
    requestAnimationFrame(() =>
      piecesRef.current[nextId]?.focus({ preventScroll: true }),
    );
  }
  function reset() {
    setPlaced(new Set());
    setOrder(shuffle(total));
    setSelected(null);
    setHint(null);
    setWrong(null);
    setPreview(false);
    setMessage("又一场春雨开始了。");
  }
  function showHint() {
    const id = selected ?? order.find((n) => !placed.has(n));
    if (id === undefined) return;
    setPreview(false);
    setSelected(id);
    setHint(id);
    setMessage("金色边框标出了位置。把选中的碎片放回去吧。");
  }
  const stage = Math.min(3, Math.floor((placed.size * 3) / total));
  return (
    <>
      <div className="intro">
        <div>
          <p className="season">春日的一场雨</p>
          <h1>雨水 · 拾回春天</h1>
        </div>
        <p>
          把散落的颜色，放回记忆里。
          <br />
          <small>没有倒计时，慢慢来。</small>
        </p>
      </div>
      <div className="layout">
        <section className="art-col" aria-label="拼图画板">
          <div className="board-frame">
            <svg
              className="board"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="group"
              aria-label={`${total} 片${shapes[shape]}画板`}
            >
              <image
                href={IMAGE}
                width={WIDTH}
                height={HEIGHT}
                className={preview ? "reference" : "underlay"}
                opacity={preview || guide ? 1 : 0.08}
                onError={() => setLoadError(true)}
              />
              {!preview &&
                pieces.map((p) => (
                  <g
                    key={p.id}
                    className={`slot ${placed.has(p.id) ? "placed" : ""} ${hint === p.id ? "hint" : ""} ${wrong === p.id ? "wrong" : ""}`}
                    data-slot={p.id}
                    role="button"
                    tabIndex={placed.has(p.id) ? -1 : 0}
                    aria-disabled={placed.has(p.id)}
                    aria-label={`第 ${p.y + 1} 行第 ${p.x + 1} 列${placed.has(p.id) ? "，已放回" : ""}`}
                    onClick={() => place(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        place(p.id);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const raw = e.dataTransfer.getData(
                        "application/x-shiguang-piece",
                      );
                      if (/^\d+$/.test(raw)) {
                        const id = Number(raw);
                        if (id < total && !placed.has(id)) place(p.id, id);
                      }
                    }}
                  >
                    {placed.has(p.id) && <Fragment piece={p} prefix="board" />}
                    <path d={p.path} className="seam" />
                  </g>
                ))}
            </svg>
          </div>
          {loadError && (
            <p role="alert">图片未加载，请检查 public/art/rain-2020.jpg。</p>
          )}
          <p className="caption">
            2020 年雨水节气图 · A0243{" "}
            <a
              href="https://luoxiaohei.cockerel.com.cn/artwork/huiji:solar/2020/%E9%9B%A8%E6%B0%B4"
              target="_blank"
              rel="noreferrer"
            >
              素材出处
            </a>
          </p>
        </section>
        <section className="panel" aria-label="故事和碎片">
          <div className="progress-label">
            <span>正在拾回春天</span>
            <output id="count">
              {placed.size} / {total}
            </output>
          </div>
          <progress max={total} value={placed.size} aria-label="拼图完成进度" />
          <div className="story" aria-live="polite">
            <p className="season">
              {
                [
                  "原创片段 · 序",
                  "原创片段 · 一",
                  "原创片段 · 二",
                  "原创片段 · 终",
                ][stage]
              }
            </p>
            <h2>{story[stage][0]}</h2>
            <p>{story[stage][1]}</p>
          </div>
          <div className="controls">
            <button onClick={showHint} disabled={placed.size === total}>
              给我一点提示
            </button>
            <button
              onClick={() => {
                setPreview(!preview);
                setMessage(
                  preview
                    ? "回到拼图了。"
                    : "先看看完整的春天。收起原图后继续。",
                );
              }}
              aria-pressed={preview}
            >
              {preview ? "收起原图" : "看看原图"}
            </button>
            <button onClick={reset}>重新开始</button>
          </div>
          <label className="guide">
            <input
              type="checkbox"
              checked={guide}
              onChange={(e) => setGuide(e.target.checked)}
            />
            显示灰色底图
          </label>
          <p className="message" role="status">
            {message}
            {saveError ? " 当前浏览器无法保存进度，仍可继续游玩。" : ""}
          </p>
          <div className="tray-header">
            <h3>散落的画面</h3>
            <span>还剩 {total - placed.size} 片</span>
          </div>
          <div className="tray" role="group" aria-label="彩色拼图碎片">
            {order.map((id) => {
              const p = pieces[id],
                done = placed.has(id);
              return (
                <button
                  key={id}
                  ref={(el) => {
                    piecesRef.current[id] = el;
                  }}
                  className={`piece ${done ? "used" : ""}`}
                  data-piece={id}
                  aria-label={`碎片 ${id + 1}${done ? "，已放回" : ""}`}
                  aria-pressed={selected === id}
                  disabled={done || preview}
                  onClick={() => select(id)}
                  draggable={!done && !preview}
                  onDragStart={(e) => {
                    select(id);
                    e.dataTransfer.setData(
                      "application/x-shiguang-piece",
                      String(id),
                    );
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  {done ? (
                    <span aria-hidden="true">✓</span>
                  ) : (
                    <svg viewBox={p.viewBox} aria-hidden="true">
                      <Fragment piece={p} prefix="tray" />
                      <path d={p.path} className="piece-edge" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <p className="note">
            每完成三分之一，解锁一段原创故事。
            <br />
            每个难度和形状分别保存进度；切换后可以回来继续。
          </p>
        </section>
      </div>
    </>
  );
}
function App() {
  const [level, setLevel] = useState("easy"),
    [shape, setShape] = useState("flat");
  return (
    <>
      <header>
        <a className="brand" href="/">
          小黑的四时拾光
        </a>
        <nav>
          <span aria-current="page">拾回春天</span>
          <a href="/prototype/index.html">借一盏灯</a>
        </nav>
      </header>
      <main>
        <div className="settings">
          <label>
            难度
            <select
              aria-label="难度"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {Object.entries(levels).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            形状
            <select
              aria-label="形状"
              value={shape}
              onChange={(e) => setShape(e.target.value)}
            >
              {Object.entries(shapes).map(([id, v]) => (
                <option key={id} value={id}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <span>随时切换，进度会留在这里。</span>
        </div>
        <Puzzle key={`${level}-${shape}`} level={level} shape={shape} />
      </main>
      <footer>非官方二创练习 · 原画版权归原权利人，新增故事为原创。</footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
