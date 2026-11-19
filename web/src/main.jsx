import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  WIDTH,
  HEIGHT,
  levels,
  makePieces,
  readProgress,
  shuffle,
} from "./geometry.js";
import { completedMemories, memories, regionPieces } from "./gameplay.js";
import { Fragment, PieceWell, Icon, IMAGE } from "./Artwork.jsx";
import { useFloatingPiece } from "./useFloatingPiece.js";
import { useSound } from "./useSound.js";
import { useDialogue } from "./useDialogue.js";
import "./style.css";
const shapes = { flat: "方形碎片", classic: "经典拼图", organic: "不规则拼图" };
function getMode() {
  try {
    const saved = JSON.parse(localStorage.getItem("shiguang-mode"));
    if (levels[saved?.level] && shapes[saved?.shape]) return saved;
  } catch {}
  return { level: "easy", shape: "classic" };
}
function useMedia(query) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query),
      update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
function Tool({ icon, children, ...props }) {
  return (
    <button className="tool" {...props}>
      <Icon name={icon} />
      {children && <span>{children}</span>}
    </button>
  );
}
function Puzzle({ mode, sound, paused, gameRef, material }) {
  const { level, shape } = mode,
    { cols, rows } = levels[level],
    total = cols * rows;
  // Preserve all existing mode saves, including the original v1 React format.
  const saveKey = `shiguang-react-v1-${level}-${shape}`;
  const pieces = useMemo(
    () => makePieces(cols, rows, shape),
    [cols, rows, shape],
  );
  const [placed, setPlaced] = useState(() => {
    try {
      return readProgress(localStorage, saveKey, total);
    } catch {
      return new Set();
    }
  });
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [order, setOrder] = useState(() => shuffle(total)),
    [selected, setSelected] = useState(null),
    [hint, setHint] = useState(null),
    [preview, setPreview] = useState(false),
    [guide, setGuide] = useState(true),
    [zoom, setZoom] = useState(false),
    [page, setPage] = useState(0),
    [lastPlaced, setLastPlaced] = useState(null),
    [placementKind, setPlacementKind] = useState("direct"),
    [celebration, setCelebration] = useState(null),
    [saveError, setSaveError] = useState(false),
    [imageError, setImageError] = useState(false),
    [message, setMessage] = useState("拿起一片，靠近它的位置，就会轻轻吸住。");
  const mobile = useMedia("(max-width: 740px)"),
    pageSize = mobile ? 4 : 6;
  const boardRef = useRef(null),
    viewportRef = useRef(null),
    trayRef = useRef(null),
    seen = useRef(
      new Set(completedMemories(placed, cols, rows).map((memory) => memory.id)),
    );
  const [boardHeight, setBoardHeight] = useState(400);
  const dialogue = useDialogue(sound);
  const completed = completedMemories(placed, cols, rows),
    remaining = order.filter((id) => !placed.has(id)),
    pages = Math.max(1, Math.ceil(remaining.length / pageSize)),
    currentPage = Math.min(page, pages - 1),
    visible = remaining.slice(
      currentPage * pageSize,
      (currentPage + 1) * pageSize,
    );
  const umbrellaComplete = completed.some((memory) => memory.id === "umbrella");
  useEffect(() => {
    sound.setSheltered(umbrellaComplete);
  }, [umbrellaComplete, sound.setSheltered]);
  useEffect(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify([...placed]));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [placed, saveKey]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoardHeight(
        Math.max(
          120,
          Math.min(height - 20, ((width - 28) * HEIGHT) / WIDTH, 720),
        ),
      );
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);
  function commit(id, keyboard = false, fromDrag = false) {
    if (paused || preview || placedRef.current.has(id)) return;
    const next = new Set(placedRef.current).add(id);
    placedRef.current = next;
    setPlaced(next);
    setSelected(null);
    setHint(null);
    setLastPlaced(id);
    setPlacementKind(fromDrag ? "drag" : "direct");
    sound.play("place");
    const unlocked = completedMemories(next, cols, rows).filter(
      (memory) => !seen.current.has(memory.id),
    );
    unlocked.forEach((memory) => seen.current.add(memory.id));
    if (unlocked.length) {
      dialogue.enqueue(unlocked);
      setCelebration(unlocked.at(-1).id);
      sound.play("memory");
    }
    if (next.size === total) {
      dialogue.enqueue([
        {
          id: "complete",
          speaker: "春日来信",
          text: "春天完整了。谢谢你，陪他们慢慢走完这一场雨。",
        },
      ]);
      setMessage("春天完整了。点亮的记忆，可以再听一遍。");
    } else
      setMessage(
        unlocked.length
          ? `你找回了${unlocked.map((item) => item.name).join("、")}的记忆。`
          : "咔哒，颜色回来了。",
      );
    if (keyboard)
      requestAnimationFrame(() =>
        trayRef.current
          ?.querySelector("[data-piece]")
          ?.focus({ preventScroll: true }),
      );
  }
  const floating = useFloatingPiece({
    boardRef,
    pieces,
    cols,
    rows,
    placedRef,
    disabled: paused || preview,
    material,
    onPlace: (id) => commit(id, false, true),
    onSelect: setSelected,
    onPick: () => {
      sound.play("pick");
      setHint(null);
      setMessage("拿好了。靠近正确的位置，碎片会自己落下。");
    },
    onMiss: () => setMessage("还差一点点。碎片回到这里，再试一次吧。"),
  });
  function cancel() {
    floating.cancel();
    setSelected(null);
    setHint(null);
  }
  function reset() {
    cancel();
    placedRef.current = new Set();
    setPlaced(new Set());
    setOrder(shuffle(total));
    setPage(0);
    setPreview(false);
    setZoom(false);
    setLastPlaced(null);
    setCelebration(null);
    seen.current = new Set();
    dialogue.reset();
    setMessage("又一场春雨开始了。没有倒计时，慢慢来。");
  }
  gameRef.current = { reset, cancel, guide, setGuide };
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") {
        cancel();
        setPreview(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (paused) {
      setSelected(null);
      sound.stop();
    }
  }, [paused]);
  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(null), 2400);
    return () => clearTimeout(timer);
  }, [celebration]);
  function select(id) {
    if (paused || preview || floating.busy || placed.has(id)) return;
    setSelected(id);
    setHint(null);
    sound.play("pick");
    setMessage("碎片拿好了。也可以直接点它在画板上的位置。");
  }
  function placeAt(id, keyboard = false) {
    if (paused || preview || floating.busy || placed.has(id)) return;
    if (selected === id) commit(id, keyboard);
    else
      setMessage(
        selected === null
          ? "先在碎片栏里拿起一片。"
          : "这片属于别的地方。试试靠近时的吸附提示。",
      );
  }
  function showHint() {
    if (!remaining.length) return;
    cancel();
    setPreview(false);
    const id =
      selected !== null && !placed.has(selected) ? selected : remaining[0];
    setSelected(id);
    setHint(id);
    setPage(Math.floor(remaining.indexOf(id) / pageSize));
    setMessage("金色轮廓就是它的位置。拖过去，或者点一下那里。");
  }
  const artHeight = boardHeight * (zoom ? 1.7 : 1);
  return (
    <main className="game-main" data-game="puzzle">
      <section
        className={`stage ${placed.size === total ? "is-complete" : ""}`}
        aria-label="拼图画板"
      >
        <div className="stage-top">
          <span className="chapter">
            <i />
            春日的一场雨
          </span>
          <div className="progress-group">
            <progress
              max={total}
              value={placed.size}
              aria-label="拼图完成进度"
            />
            <output id="count">
              {placed.size} / {total}
            </output>
          </div>
        </div>
        <div
          className={`board-scroller ${zoom ? "is-zoomed" : ""}`}
          ref={viewportRef}
          aria-label="画板视窗"
          tabIndex={zoom ? 0 : -1}
        >
          <div
            className="board-frame"
            style={{
              width: (artHeight * WIDTH) / HEIGHT + 12,
              height: artHeight + 12,
            }}
          >
            <svg
              className="board"
              ref={boardRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="group"
              aria-label={`${total} 片${shapes[shape]}画板`}
            >
              <defs>
                <linearGradient id="grass-feather" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="white" stopOpacity="0" />
                  <stop offset=".35" stopColor="white" />
                </linearGradient>
                <mask id="grass-mask">
                  <path
                    d={`M0 ${HEIGHT * 0.81}H${WIDTH}V${HEIGHT}H0Z`}
                    fill="url(#grass-feather)"
                  />
                </mask>
              </defs>
              <image
                href={IMAGE}
                width={WIDTH}
                height={HEIGHT}
                className={preview ? "reference" : "underlay"}
                opacity={preview || guide ? 1 : 0.06}
                onError={() => setImageError(true)}
              />
              {!preview &&
                pieces.map((piece) => (
                  <g
                    key={piece.id}
                    className={`slot ${placed.has(piece.id) ? "placed" : ""} ${hint === piece.id ? "hint" : ""} ${floating.near === piece.id ? "magnet-near" : ""} ${lastPlaced === piece.id ? "just-placed" : ""} ${lastPlaced === piece.id && placementKind === "direct" ? "press-in" : ""} ${floating.visual?.id === piece.id && ["snap", "press"].includes(floating.visual.phase) ? "receiving" : ""}`}
                    data-slot={piece.id}
                    role="button"
                    tabIndex={placed.has(piece.id) ? -1 : 0}
                    aria-disabled={placed.has(piece.id)}
                    aria-label={`第 ${piece.y + 1} 行第 ${piece.x + 1} 列${placed.has(piece.id) ? "，已放回" : ""}`}
                    onClick={(event) => placeAt(piece.id, event.detail === 0)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        placeAt(piece.id, true);
                      }
                      const step = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -cols,
                        ArrowDown: cols,
                      }[event.key];
                      if (step) {
                        event.preventDefault();
                        boardRef.current
                          .querySelector(
                            `[data-slot="${Math.max(0, Math.min(total - 1, piece.id + step))}"]`,
                          )
                          ?.focus();
                      }
                    }}
                    onAnimationEnd={() => {
                      if (lastPlaced === piece.id) setLastPlaced(null);
                    }}
                  >
                    {material === "cardboard" && !placed.has(piece.id) && <PieceWell piece={piece} />}
                    {placed.has(piece.id) && (
                      <Fragment piece={piece} prefix="board" material={material} raised={false} />
                    )}
                    <path d={piece.path} className="seam" />
                  </g>
                ))}
              {!preview && celebration === "grass" && (
                <g className="grass-sway" pointerEvents="none">
                  <image
                    href={IMAGE}
                    width={WIDTH}
                    height={HEIGHT}
                    mask="url(#grass-mask)"
                  />
                </g>
              )}
              {!preview && celebration && (
                <g
                  className="memory-sparkles"
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <circle
                      key={i}
                      cx={WIDTH * (0.2 + i * 0.15)}
                      cy={
                        HEIGHT *
                          (celebration === "grass"
                            ? 0.86
                            : celebration === "umbrella"
                              ? 0.13
                              : 0.48) +
                        (i % 2) * 70
                      }
                      r={9 - i}
                      style={{ animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </g>
              )}
            </svg>
            {preview && (
              <span className="reference-tag">原图参考 · 进度不会改变</span>
            )}
          </div>
        </div>
        <div className="stage-tools">
          <Tool
            icon="hint"
            onClick={showHint}
            disabled={placed.size === total || floating.busy}
          >
            提示
          </Tool>
          <Tool
            icon="eye"
            aria-pressed={preview}
            onClick={() => {
              cancel();
              setPreview(!preview);
            }}
          >
            参考
          </Tool>
          <Tool
            icon="zoom"
            aria-pressed={zoom}
            onClick={() => {
              cancel();
              setZoom(!zoom);
            }}
          >
            {zoom ? "缩小" : "放大"}
          </Tool>
        </div>
        {imageError && (
          <p className="image-error" role="alert">
            画面未能加载，请刷新后再试。
          </p>
        )}
      </section>
      <aside className="tray-panel" aria-label="碎片与记忆">
        <div className="tray-heading">
          <div>
            <p>把春天放回去</p>
            <h2>散落的画面</h2>
          </div>
          <span className="remaining-count">
            {remaining.length}
            <small>片待归位</small>
          </span>
        </div>
        <div
          className="tray"
          ref={trayRef}
          role="group"
          aria-label="彩色拼图碎片"
          data-page={currentPage}
        >
          {visible.map((id) => (
            <button
              key={id}
              className={`piece ${selected === id ? "is-selected" : ""} ${floating.visual?.id === id ? "is-lifted" : ""}`}
              data-piece={id}
              aria-label={`碎片 ${id + 1}`}
              aria-pressed={selected === id}
              disabled={preview || paused}
              onPointerDown={(event) => floating.begin(event, id)}
              onClick={(event) => {
                if (event.detail === 0) select(id);
              }}
            >
              <svg viewBox={pieces[id].viewBox} aria-hidden="true">
                <Fragment piece={pieces[id]} prefix="tray" material={material} />
                <path d={pieces[id].path} className="piece-edge" />
              </svg>
              <span className="piece-shadow" />
            </button>
          ))}
          {!remaining.length && (
            <div className="tray-complete">
              <Icon name="leaf" />
              <strong>春天完整了</strong>
              <p>一场雨，四段小小的记忆。</p>
              <button className="text-button" onClick={reset}>
                再走一遍春天
              </button>
            </div>
          )}
        </div>
        <div className="tray-pagination">
          <button
            aria-label="上一页碎片"
            disabled={currentPage === 0 || floating.busy}
            onClick={() => setPage(currentPage - 1)}
          >
            <Icon name="left" />
          </button>
          <span>
            {currentPage + 1} / {pages}
          </span>
          <button
            aria-label="下一页碎片"
            disabled={currentPage >= pages - 1 || floating.busy}
            onClick={() => setPage(currentPage + 1)}
          >
            <Icon name="right" />
          </button>
        </div>
        <p className="interaction-message" role="status">
          {saveError ? "浏览器无法保存进度，仍可继续游玩。" : message}
        </p>
        <div className="memory-section">
          <p className="memory-title">
            找回的记忆{" "}
            <span>
              {completed.length} / {memories.length}
            </span>
          </p>
          <div className="memory-list">
            {memories.map((memory) => {
              const ids = regionPieces(memory, cols, rows),
                count = ids.filter((id) => placed.has(id)).length,
                done = count === ids.length;
              return (
                <button
                  key={memory.id}
                  className={`memory-chip ${done ? "unlocked" : ""}`}
                  data-memory={memory.id}
                  disabled={!done || floating.busy}
                  aria-label={`${memory.name}，${done ? "已解锁，点击回听" : `${count} / ${ids.length} 片`}`}
                  onClick={() => {
                    sound.play("memory");
                    dialogue.replay(memory);
                  }}
                >
                  <Icon name={memory.icon} />
                  <span>{memory.name}</span>
                  {done && (
                    <i>
                      <Icon name="check" />
                    </i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
      <section
        className={`dialogue ${celebration ? "new-memory" : ""}`}
        aria-label="故事字幕"
        data-cue={dialogue.cue.id}
      >
        <div className="speaker-seal">
          <Icon
            name={
              dialogue.cue.speaker === "小黑"
                ? "cat"
                : dialogue.cue.speaker === "无限"
                  ? "mountain"
                  : "leaf"
            }
          />
        </div>
        <div className="dialogue-copy">
          <span className="speaker-name">
            {dialogue.cue.speaker}
            <small>原创小片段</small>
          </span>
          <p aria-hidden="true">
            {dialogue.text}
            <span
              className={dialogue.typing ? "typing-caret" : "caret-hidden"}
            />
          </p>
          <p className="sr-only" aria-live="polite">
            {dialogue.cue.speaker}：{dialogue.cue.text}
          </p>
        </div>
        <button
          className="dialogue-next"
          aria-label="下一句字幕"
          disabled={!dialogue.pending}
          onClick={dialogue.next}
        >
          <Icon name="right" />
        </button>
      </section>
      {floating.visual && (
        <div
          className={`floating-piece phase-${floating.visual.phase}`}
          data-floating={floating.visual.id}
          style={{
            width: floating.visual.width,
            height: floating.visual.height,
            transform: `translate3d(${floating.visual.x - floating.visual.width / 2}px, ${floating.visual.y - floating.visual.height / 2}px, 0) rotate(${floating.visual.angle}deg) scale(${floating.visual.phase === "held" ? 1.08 : 1})`,
          }}
          aria-hidden="true"
        >
          <div className="floating-surface">
            <svg viewBox={pieces[floating.visual.id].viewBox}>
            <Fragment piece={pieces[floating.visual.id]} prefix="floating" material={material} />
            <path
              d={pieces[floating.visual.id].path}
              className="floating-edge"
            />
            </svg>
          </div>
        </div>
      )}
    </main>
  );
}
function App() {
  const [mode, setMode] = useState(getMode),
    [settings, setSettings] = useState(false),
    [showGuide, setShowGuide] = useState(true),
    [material, setMaterial] = useState(() => {
      try { return localStorage.getItem("shiguang-material-v1") === "cardboard" ? "cardboard" : "light"; }
      catch { return "light"; }
    });
  const gameRef = useRef(null),
    dialogRef = useRef(null),
    sound = useSound();
  useEffect(() => {
    try {
      localStorage.setItem("shiguang-mode", JSON.stringify(mode));
    } catch {}
    setShowGuide(true);
  }, [mode]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (settings && !dialog.open) dialog.showModal();
    else if (!settings && dialog.open) dialog.close();
  }, [settings]);
  useEffect(() => {
    try { localStorage.setItem("shiguang-material-v1", material); } catch {}
  }, [material]);
  return (
    <div className={`game-shell material-${material}`} data-material={material}>
      <header className="game-header">
        <a className="brand" href="/" aria-label="小黑的四时拾光首页">
          <Icon name="leaf" />
          <span>
            四时拾光<small>小黑的春日拼图</small>
          </span>
        </a>
        <div className="game-title">
          <span>雨水</span>
          <h1>拾回春天</h1>
        </div>
        <div className="header-actions">
          <Tool
            icon={sound.enabled ? "sound" : "mute"}
            aria-label={sound.enabled ? "关闭声音" : "开启声音"}
            aria-pressed={sound.enabled}
            onClick={sound.toggle}
          />
          <Tool
            icon="settings"
            aria-label="游戏设置"
            onClick={() => {
              gameRef.current?.cancel();
              setSettings(true);
            }}
          />
        </div>
      </header>
      <Puzzle
        key={`${mode.level}-${mode.shape}`}
        mode={mode}
        sound={sound}
        paused={settings}
        material={material}
        gameRef={gameRef}
      />
      <footer className="game-footer">
        <span>没有倒计时，慢慢来。</span>
        <span>非官方二创 · 原创小片段</span>
      </footer>
      <dialog
        ref={dialogRef}
        className="settings-dialog"
        aria-labelledby="settings-title"
        onCancel={(event) => {
          event.preventDefault();
          setSettings(false);
        }}
        onClose={() => setSettings(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSettings(false);
        }}
      >
        <div className="settings-content">
          <div className="settings-heading">
            <div>
              <p>让春天，按你的节奏来</p>
              <h2 id="settings-title">游戏设置</h2>
            </div>
            <Tool
              icon="close"
              aria-label="关闭设置"
              onClick={() => setSettings(false)}
            />
          </div>
          <label className="setting-row">
            拼图难度
            <select
              aria-label="难度"
              value={mode.level}
              onChange={(event) =>
                setMode({ ...mode, level: event.target.value })
              }
            >
              {Object.entries(levels).map(([id, value]) => (
                <option value={id} key={id}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <label className="setting-row">
            碎片形状
            <select
              aria-label="形状"
              value={mode.shape}
              onChange={(event) =>
                setMode({ ...mode, shape: event.target.value })
              }
            >
              {Object.entries(shapes).map(([id, value]) => (
                <option value={id} key={id}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="setting-row">
            <span>拼图质感<small>纸板有厚度，放下时轻轻嵌入</small></span>
            <select aria-label="拼图质感" value={material} onChange={(event) => setMaterial(event.target.value)}>
              <option value="light">轻盈 · 当前效果</option>
              <option value="cardboard">纸板拼图 · 立体手感</option>
            </select>
          </label>
          <label className="setting-row">
            显示灰色底图
            <input
              type="checkbox"
              aria-label="设置灰色底图"
              checked={showGuide}
              onChange={(event) => {
                setShowGuide(event.target.checked);
                gameRef.current?.setGuide(event.target.checked);
              }}
            />
          </label>
          <label className="setting-row">
            游戏声音
            <input
              type="checkbox"
              checked={sound.enabled}
              onChange={sound.toggle}
            />
          </label>
          <label className="setting-row">
            <span>
              背景音乐<small>关闭后仍可听见雨声</small>
            </span>
            <input
              type="checkbox"
              disabled={!sound.enabled}
              checked={sound.music}
              onChange={(event) => sound.setMusic(event.target.checked)}
            />
          </label>
          <label className="setting-row">
            <span>
              对白朗读
              <small>
                {sound.enabled ? "使用设备的中文系统语音" : "先开启游戏声音"}
              </small>
            </span>
            <input
              type="checkbox"
              disabled={!sound.enabled}
              checked={sound.voice}
              onChange={(event) => sound.setVoice(event.target.checked)}
            />
          </label>
          {sound.note && (
            <p className="settings-note" role="status">
              {sound.note}
            </p>
          )}
          <p className="settings-note">
            拖动时靠近正确位置，会自动吸附。也可以先选碎片，再点画板位置。触屏碎片会抬到指尖上方；按
            Esc 可取消。切换难度和形状，各自的进度都会保留。
          </p>
          <div className="settings-bottom">
            <button
              className="secondary-button"
              onClick={() => {
                gameRef.current?.reset();
                setSettings(false);
              }}
            >
              重新开始这一局
            </button>
            <button
              className="primary-button"
              onClick={() => setSettings(false)}
            >
              回到春天
            </button>
          </div>
          <a
            className="source-link"
            href="https://luoxiaohei.cockerel.com.cn/artwork/huiji:solar/2020/%E9%9B%A8%E6%B0%B4"
            target="_blank"
            rel="noreferrer"
          >
            2020 年雨水节气图 · A0243 · 素材出处
          </a>
        </div>
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
