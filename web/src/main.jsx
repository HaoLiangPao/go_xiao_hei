import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  WIDTH,
  HEIGHT,
  levels,
  makePieces,
  readProgress,
  shuffle,
} from "./geometry.js";
import { completedMemories, regionPieces } from "./gameplay.js";
import { Fragment, PieceWell, Icon } from "./Artwork.jsx";
import { pictures } from "./pictureCatalog.js";
import { puzzleStories } from "./puzzleStories.js";
import { MemoryEffect } from "./MemoryEffect.jsx";
import { voiceProfiles } from "./voiceProfiles.js";
import {
  colorGroups,
  readPieceColors,
  shapeGroup,
  shapeGroups,
} from "./pieceGroups.js";
import { useFloatingPiece } from "./useFloatingPiece.js";
import { useSound } from "./useSound.js";
import { useDialogue } from "./useDialogue.js";
import { seasons, solarTerms } from "./solarTerms.js";
import { completeTerm, nextTerm, persistJourney, puzzleSaveKey, readJourney, termStatus } from "./journeyModel.js";
import { SeasonJourney, YearProgress } from "./SeasonJourney.jsx";
import "./style.css";
import { SiteRouter } from "./SiteRouter.jsx";
const shapes = { flat: "方形碎片", classic: "经典拼图", organic: "不规则拼图" };
function loadJourney() {
  try { return readJourney(localStorage); }
  catch { return { completed: new Set(), started: new Set() }; }
}
function genericStory(art) {
  return { goal: null, memories: [],
    opening: { id: "opening", speaker: "四时旁白", voice: "adultFemale", text: `把${art.title}的画面慢慢拼回来，点亮这一站。` },
    ending: { id: "complete", speaker: "四时旁白", voice: "adultFemale", text: `${art.title}拼好了。这一处光，留在四时旅程里。` },
  };
}
function getMode() {
  try {
    const saved = JSON.parse(localStorage.getItem("shiguang-mode"));
    if (
      Object.hasOwn(levels, saved?.level) &&
      Object.hasOwn(shapes, saved?.shape)
    ) {
      return {
        level: saved.level,
        shape: saved.shape,
        picture: Object.hasOwn(pictures, saved.picture) && termStatus(saved.picture, loadJourney()) !== "locked"
          ? saved.picture
          : "startSpring",
        board: saved.board === "blank" ? "blank" : "guided",
        magnet: saved.magnet !== false,
      };
    }
  } catch {}
  return {
    level: "easy",
    shape: "classic",
    picture: "startSpring",
    board: "guided",
    magnet: true,
  };
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
function Tool({ icon, children, onClick, ...props }) {
  // Handle touch release directly: a rapid tap after a drag may have no native
  // compatibility click. Mouse and keyboard keep their normal click behavior.
  function touchUp(event) {
    if (props.disabled || event.pointerType !== "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) onClick?.(event);
  }
  return (
    <button className="tool" {...props} onPointerUp={touchUp}
      onClick={(event) => {
        if (event.detail === 0 || event.nativeEvent.pointerType !== "touch") onClick?.(event);
      }}>
      <Icon name={icon} />
      {children && <span>{children}</span>}
    </button>
  );
}
function Puzzle({ mode, sound, paused, gameRef, onComplete, onNext, material }) {
  const { level, shape, picture, board, magnet } = mode,
    { cols, rows } = levels[level],
    total = cols * rows;
  const art = pictures[picture];
  const isRain = picture === "rain";
  const guide = board === "guided";
  const story = puzzleStories[picture] ?? genericStory(art);
  const storyMemories = story.memories;
  const primaryGoal = storyMemories.find((memory) => memory.id === story.goal);
  // Preserve all existing mode saves, including the original v1 React format.
  const saveKey = puzzleSaveKey(picture, board, level, shape);
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
    [sort, setSort] = useState("random"),
    [group, setGroup] = useState("all"),
    [colors, setColors] = useState(null),
    [colorError, setColorError] = useState(false),
    [zoom, setZoom] = useState(false),
    [page, setPage] = useState(0),
    [lastPlaced, setLastPlaced] = useState(null),
    [placementKind, setPlacementKind] = useState("direct"),
    [celebrations, setCelebrations] = useState([]),
    [saveError, setSaveError] = useState(false),
    [imageError, setImageError] = useState(false),
    [imageReady, setImageReady] = useState(false),
    [message, setMessage] = useState("");
  const mobile = useMedia("(max-width: 740px)"),
    pageSize = mobile ? 4 : 6;
  const referenceBlocksBoard = preview && mobile;
  const boardRef = useRef(null),
    viewportRef = useRef(null),
    trayRef = useRef(null),
    referenceButton = useRef(null),
    referenceCloseButton = useRef(null),
    seen = useRef(
      new Set(
        completedMemories(placed, cols, rows, storyMemories).map(
          (memory) => memory.id,
        ),
      ),
    );
  const [boardHeight, setBoardHeight] = useState(400);
  useEffect(() => {
    if (referenceBlocksBoard) referenceCloseButton.current?.focus();
  }, [referenceBlocksBoard]);
  const dialogue = useDialogue(sound, story.opening, paused);
  const completed = completedMemories(placed, cols, rows, storyMemories);
  const goalComplete = completed.some((memory) => memory.id === story.goal);
  const grassCelebrating = celebrations.some((memory) => memory.id === "grass");
  const remaining = order.filter((id) => !placed.has(id));
  const groups = sort === "shape" ? shapeGroups : colorGroups;
  const categoryOf = (id) =>
    sort === "shape" ? shapeGroup(pieces[id], cols, rows) : colors?.[id];
  const organized =
    sort === "random" || (sort === "color" && !colors)
      ? remaining
      : Object.keys(groups).flatMap((category) =>
          remaining.filter((id) => categoryOf(id) === category),
        );
  const shown =
    group === "all"
      ? organized
      : organized.filter((id) => categoryOf(id) === group);
  const pages = Math.max(1, Math.ceil(shown.length / pageSize)),
    currentPage = Math.min(page, pages - 1),
    visible = shown.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  useEffect(() => {
    if (sort !== "color" || colors) return;
    let canceled = false;
    setColorError(false);
    readPieceColors(art.image, pieces).then(
      (result) => {
        if (!canceled) setColors(result);
      },
      () => {
        if (!canceled) setColorError(true);
      },
    );
    return () => {
      canceled = true;
    };
  }, [art.image, pieces, sort, colors]);
  const umbrellaComplete = completed.some((memory) => memory.id === "umbrella");
  useEffect(() => setMessage(""), [magnet]);
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
          72,
          Math.min(height - 20, ((width - 28) * HEIGHT) / WIDTH, 720),
        ),
      );
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);
  function commit(id, keyboard = false, fromDrag = false) {
    if (paused || referenceBlocksBoard || !imageReady || placedRef.current.has(id)) return;
    const next = new Set(placedRef.current).add(id);
    placedRef.current = next;
    setPlaced(next);
    setSelected(null);
    setHint(null);
    setLastPlaced(id);
    setPlacementKind(fromDrag ? "drag" : "direct");
    sound.play("place");
    const unlocked = completedMemories(next, cols, rows, storyMemories).filter(
      (memory) => !seen.current.has(memory.id),
    );
    unlocked.forEach((memory) => seen.current.add(memory.id));
    if (unlocked.length) {
      dialogue.enqueue(unlocked);
      setCelebrations(unlocked);
      sound.play("memory");
    }
    if (next.size === total) {
      onComplete(picture);
      dialogue.enqueue([story.ending]);
      setMessage("拼好了。点亮的片段可以再听一遍。");
    } else
      setMessage(
        unlocked.length
          ? `你找回了${unlocked.map((item) => item.name).join("、")}的记忆。`
          : "咔哒，颜色回来了。",
      );
    if (keyboard) {
      const previousFocus = document.activeElement;
      requestAnimationFrame(() => {
        // A new user focus choice takes priority over deferred convenience.
        if (document.activeElement === previousFocus)
          trayRef.current?.querySelector("[data-piece]")?.focus({ preventScroll: true });
      });
    }
  }
  const floating = useFloatingPiece({
    boardRef,
    pieces,
    cols,
    rows,
    placedRef,
    magnet,
    disabled: paused || referenceBlocksBoard || !imageReady,
    material,
    onPlace: (id) => commit(id, false, true),
    onSelect: setSelected,
    onPick: () => {
      sound.play("pick");
      setHint(null);
      setMessage(
        magnet
          ? "拿好了。靠近正确的位置，碎片会自己落下。"
          : "拿好了。在正确位置松手。",
      );
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
    setCelebrations([]);
    seen.current = new Set();
    dialogue.reset();
    setGroup("all");
    setMessage("新的一局开始了。没有倒计时，慢慢来。");
  }
  gameRef.current = { reset, cancel };
  function closeReference() {
    setPreview(false);
    referenceButton.current?.focus();
  }
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") {
        cancel();
        if (referenceCloseButton.current === document.activeElement)
          closeReference();
        else setPreview(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (paused) {
      setSelected(null);
      sound.stopDialogue();
    }
  }, [paused]);
  useEffect(() => {
    if (!celebrations.length) return;
    const timer = setTimeout(() => setCelebrations([]), 2400);
    return () => clearTimeout(timer);
  }, [celebrations]);
  function select(id) {
    if (paused || referenceBlocksBoard || !imageReady || floating.busy || placed.has(id))
      return;
    setSelected(id);
    setHint(null);
    sound.play("pick");
    setMessage("碎片拿好了。也可以直接点它在画板上的位置。");
  }
  function placeAt(id, keyboard = false) {
    if (paused || referenceBlocksBoard || !imageReady || floating.busy || placed.has(id))
      return;
    if (selected === id) commit(id, keyboard);
    else
      setMessage(
        selected === null
          ? "先在碎片栏里拿起一片。"
          : "这片属于别的地方，再试一次。",
      );
  }
  function showHint() {
    if (!remaining.length) return;
    cancel();
    setPreview(false);
    const id =
      selected !== null && !placed.has(selected)
        ? selected
        : (shown[0] ?? remaining[0]);
    if (!shown.includes(id)) setGroup("all");
    setSelected(id);
    setHint(id);
    setPage(
      Math.floor(
        (shown.includes(id) ? shown : organized).indexOf(id) / pageSize,
      ),
    );
    setMessage("金色轮廓就是它的位置。拖过去，或者点一下那里。");
  }
  useEffect(() => {
    if (imageReady && placed.size === total) onComplete(picture);
  }, [imageReady, placed.size, total, picture, onComplete]);
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
            <span
              data-primary-goal={story.goal}
              data-goal-complete={goalComplete}
            >
              {primaryGoal ? (goalComplete ? `${primaryGoal.name}已拼好` : `先拼出${primaryGoal.name}`) : `把${art.title}拼回来`}
            </span>
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
        <div className={preview ? "board-area has-reference" : "board-area"}>
          <div
            className={`board-scroller ${zoom ? "is-zoomed" : ""}`}
            ref={viewportRef}
            aria-label="画板视窗"
            tabIndex={zoom ? 0 : -1}
            inert={referenceBlocksBoard}
          >
            <div
              className="board-frame"
              style={{
                width: (artHeight * WIDTH) / HEIGHT + 12,
                height: artHeight + 12,
              }}
            >
              <svg
                className={guide ? "board" : "board blank-board"}
                ref={boardRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                role="group"
                aria-label={`${total} 片${shapes[shape]}画板`}
              >
                <defs>
                  <linearGradient
                    id="grass-feather"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0" stopColor="white" stopOpacity="0" />
                    <stop offset=".35" stopColor="white" />
                  </linearGradient>
                  <mask id="grass-mask">
                    <path
                      d={`M0 ${HEIGHT * 0.81}H${WIDTH}V${HEIGHT}H0Z`}
                      fill="url(#grass-feather)"
                    />
                  </mask>
                  {!guide && grassCelebrating && (
                    <clipPath id="placed-grass-clip">
                      {pieces
                        .filter((piece) => placed.has(piece.id))
                        .map((piece) => (
                          <path key={piece.id} d={piece.path} />
                        ))}
                    </clipPath>
                  )}
                </defs>
                <image
                  href={art.image}
                  width={WIDTH}
                  height={HEIGHT}
                  className="underlay"
                  visibility={guide ? "visible" : "hidden"}
                  onLoad={() => setImageReady(true)}
                onError={() => { setImageError(true); setImageReady(false); }}
                />
                {pieces.map((piece) => (
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
                      <Fragment piece={piece} prefix="board" image={art.image} material={material} raised={false} />
                    )}
                    <path d={piece.path} className="seam" />
                  </g>
                ))}
                {grassCelebrating && (
                  <g
                    clipPath={guide ? undefined : "url(#placed-grass-clip)"}
                    pointerEvents="none"
                  >
                    <g className="grass-sway">
                      <image
                        href={art.image}
                        width={WIDTH}
                        height={HEIGHT}
                        mask="url(#grass-mask)"
                      />
                    </g>
                  </g>
                )}
                {celebrations.map((memory) => (
                  <MemoryEffect key={memory.id} memory={memory} />
                ))}
              </svg>
            </div>
          </div>
          {preview && (
            <aside className="picture-reference" aria-label="独立原图参考">
              <div className="reference-heading">
                <span>原图参考</span>
                <Tool
                  icon="close"
                  ref={referenceCloseButton}
                  aria-label="关闭原图参考"
                  onClick={closeReference}
                />
              </div>
              <img src={art.image} alt={art.credit} />
            </aside>
          )}
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
            aria-label="参考"
            ref={referenceButton}
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
            <h2>散落的画面</h2>
          </div>
          <span className="remaining-count">
            {remaining.length}
            <small>片待归位</small>
          </span>
        </div>
        <div className="tray-filters">
          <select
            aria-label="碎片排列"
            value={sort}
            disabled={paused || floating.busy}
            onChange={(event) => {
              cancel();
              setSort(event.target.value);
              setGroup("all");
              setPage(0);
            }}
          >
            <option value="random">随机排列</option>
            <option value="color">按颜色</option>
            <option value="shape">按形状</option>
          </select>
          {sort !== "random" && (
            <select
              aria-label="筛选碎片"
              value={group}
              disabled={
                paused || floating.busy || (sort === "color" && !colors)
              }
              onChange={(event) => {
                cancel();
                setGroup(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">全部分类</option>
              {Object.entries(groups).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}（
                  {
                    remaining.filter((pieceId) => categoryOf(pieceId) === id)
                      .length
                  }
                  ）
                </option>
              ))}
            </select>
          )}
          {sort === "color" && !colors && (
            <span role="status">
              {colorError ? "颜色分类不可用" : "正在识别颜色…"}
            </span>
          )}
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
              data-piece-group={sort === "random" ? undefined : categoryOf(id)}
              aria-label={`碎片 ${id + 1}`}
              aria-pressed={selected === id}
              disabled={referenceBlocksBoard || paused || !imageReady}
              onPointerDown={(event) => floating.begin(event, id)}
              onClick={(event) => {
                if (event.detail === 0) select(id);
              }}
            >
              <svg viewBox={pieces[id].viewBox} aria-hidden="true">
                <Fragment piece={pieces[id]} prefix="tray" image={art.image} material={material} />
                <path d={pieces[id].path} className="piece-edge" />
              </svg>
              <span className="piece-shadow" />
            </button>
          ))}
          {!remaining.length && (
            <div className="tray-complete">
              <Icon name="leaf" />
              <strong>{art.title}拼好了</strong>
              <p>{storyMemories.length ? "画面与记忆，都留在这一站。" : "这一处光，已收进四时旅程。"}</p>
              {nextTerm(picture) ? <button className="next-term-button" onClick={onNext} disabled={!imageReady}>
                下一节气 · {nextTerm(picture).title}
              </button> : <p>走到大寒了，可以回头重温每一处光。</p>}
              <button className="text-button" onClick={reset}>
                再拼一次
              </button>
            </div>
          )}
          {!!remaining.length && !shown.length && (
            <div className="tray-complete empty-group">
              <p>这类没有待拼碎片。</p>
              <button
                className="text-button"
                onClick={() => {
                  setGroup("all");
                  setPage(0);
                }}
              >
                查看全部碎片
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
          {saveError
            ? "浏览器无法保存进度，仍可继续游玩。"
            : message ||
              (magnet
                ? "拿起一片，靠近正确位置就会吸住。"
                : "拿起一片，在正确位置松手。")}
        </p>
        <div className="memory-section">
          <p className="memory-title">
            {storyMemories.length ? "找回的记忆" : "这一站的光"}{" "}
            <span>
              {storyMemories.length ? `${completed.length} / ${storyMemories.length}` : "拼好整幅画面即可点亮"}
            </span>
          </p>
          <div className="memory-list">
            {storyMemories.map((memory) => {
              const ids = regionPieces(memory, cols, rows),
                count = ids.filter((id) => placed.has(id)).length,
                done = count === ids.length;
              return (
                <button
                  key={memory.id}
                  className={`memory-chip ${done ? "unlocked" : ""} ${!done && memory.id === story.goal ? "primary-memory" : ""}`}
                  data-memory={memory.id}
                  disabled={!done || floating.busy}
                  aria-label={`${memory.name}，${done ? "已解锁，点击回听" : `${count} / ${ids.length} 片`}`}
                  onClick={() => {
                    sound.play("memory");
                    dialogue.replay(memory);
                    setCelebrations([memory]);
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
        className={`dialogue ${celebrations.length ? "new-memory" : ""}`}
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
            <Fragment piece={pieces[floating.visual.id]} prefix="floating" image={art.image} material={material} />
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
    [journeyOpen, setJourneyOpen] = useState(false),
    [journey, setJourney] = useState(loadJourney),
    [journeySaveError, setJourneySaveError] = useState(false),
    [material, setMaterial] = useState(() => {
      try { return localStorage.getItem("shiguang-material-v1") === "cardboard" ? "cardboard" : "light"; }
      catch { return "light"; }
    });
  const art = pictures[mode.picture];
  const season = seasons.find((item) => item.id === art.season);
  const gameRef = useRef(null),
    dialogRef = useRef(null),
    journeyRef = useRef(null),
    sound = useSound(["rain", "grainRain"].includes(mode.picture));
  useEffect(() => {
    try {
      localStorage.setItem("shiguang-mode", JSON.stringify(mode));
    } catch {}
  }, [mode]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (settings && !dialog.open) dialog.showModal();
    else if (!settings && dialog.open) dialog.close();
  }, [settings]);
  useEffect(() => {
    try { localStorage.setItem("shiguang-material-v1", material); } catch {}
  }, [material]);
  useEffect(() => {
    const dialog = journeyRef.current;
    if (journeyOpen && !dialog.open) dialog.showModal();
    else if (!journeyOpen && dialog.open) dialog.close();
  }, [journeyOpen]);
  useEffect(() => {
    try { persistJourney(localStorage, journey); setJourneySaveError(false); }
    catch { setJourneySaveError(true); }
  }, [journey]);
  const markComplete = useCallback((id) => setJourney((previous) => completeTerm(previous, id)), []);
  function openJourney() {
    gameRef.current?.cancel();
    setSettings(false);
    setJourney((previous) => {
      const saved = loadJourney();
      return { completed: new Set([...previous.completed, ...saved.completed]), started: new Set([...previous.started, ...saved.started]) };
    });
    setJourneyOpen(true);
  }
  function selectTerm(id) {
    if (termStatus(id, journey) === "locked") return;
    gameRef.current?.cancel();
    setMode((previous) => ({ ...previous, picture: id }));
    setJourneyOpen(false);
  }
  return (
    <div className={`game-shell season-${art.season} material-${material}`} data-material={material} style={{ "--season-color": season.color }}>
      <header className="game-header">
        <a className="brand" href="/" aria-label="小黑的四时拾光首页">
          <Icon name="leaf" />
          <span>
            四时拾光<small>小黑的四时拼图</small>
          </span>
        </a>
        <div className="game-title">
          <span>{art.title}</span>
          <h1>拾回{season.title}</h1>
        </div>
        <div className="header-actions">
          <a className="tool character-entry" href="#/characters" aria-label="打开人物资料库"><Icon name="cat" /></a>
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
      <YearProgress journey={journey} current={mode.picture} onOpen={openJourney} />
      <Puzzle
        key={`${mode.picture}-${mode.board}-${mode.level}-${mode.shape}`}
        mode={mode}
        sound={sound}
        paused={settings || journeyOpen}
        onComplete={markComplete}
        onNext={() => { const next = nextTerm(mode.picture); if (next) selectTerm(next.id); }}
        material={material}
        gameRef={gameRef}
      />
      <footer className="game-footer">
        <span>没有倒计时，慢慢来。</span>
        <span>非官方二创 · <a className="world-entry" href="/world/">去像素街区散步</a></span>
      </footer>
      <dialog
        ref={dialogRef}
        className="settings-dialog"
        aria-labelledby="settings-title"
        onCancel={(event) => {
          event.preventDefault();
          setSettings(false);
        }}
        onClose={(event) => { if (!event.currentTarget.open) setSettings(false); }}
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
          <button className="choose-season-button" onClick={openJourney}>
            <span>选择节气 <strong>{art.title}</strong></span><span>{journey.completed.size} / 24 已点亮 ›</span>
          </button>
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
            <span>
              拼板提示<small>空白拼板可单独看原图</small>
            </span>
            <select
              aria-label="拼板提示"
              value={mode.board}
              onChange={(event) =>
                setMode({ ...mode, board: event.target.value })
              }
            >
              <option value="guided">灰色底图</option>
              <option value="blank">空白拼板</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              磁吸归位<small>关闭后须在正确位置松手</small>
            </span>
            <input
              type="checkbox"
              aria-label="磁吸归位"
              checked={mode.magnet}
              onChange={(event) =>
                setMode({ ...mode, magnet: event.target.checked })
              }
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
                {sound.enabled ? "录音优先，缺失时使用设备中文语音" : "先开启游戏声音"}
              </small>
            </span>
            <input
              type="checkbox"
              disabled={!sound.enabled}
              checked={sound.voice}
              onChange={(event) => sound.setVoice(event.target.checked)}
            />
          </label>
          {sound.enabled && sound.voice && sound.voices.length > 0 && (
            <fieldset className="voice-cast">
              <legend>角色音色</legend>
              {Object.entries(voiceProfiles).map(([role, profile]) => (
                <label className="setting-row" key={role}>
                  {profile.label}
                  <select
                    value={sound.voiceCast[role] || ""}
                    onChange={(event) =>
                      sound.chooseVoice(role, event.target.value)
                    }
                  >
                    <option value="">自动选择</option>
                    {sound.voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </fieldset>
          )}
          <div className="voice-preview" aria-label="普通中文配音试听">
            <p>普通中文合成配音 · 试听</p>
            <div className="voice-preview-buttons">
              <button className="secondary-button" disabled={!sound.enabled}
                onClick={() => sound.preview(puzzleStories.rain.memories[0])}>试听无限</button>
              <button className="secondary-button" disabled={!sound.enabled}
                onClick={() => sound.preview(puzzleStories.rain.memories[2])}>试听小黑</button>
              <button className="secondary-button" disabled={!sound.speaking}
                onClick={sound.stop}>停止</button>
            </div>
            <p className="voice-preview-caption">录音优先播放；上方音色选择用于系统朗读兜底。</p>
          </div>
          {sound.note && (
            <p className="settings-note" role="status">
              {sound.note}
            </p>
          )}
          <p className="settings-note">
            也可以先选碎片，再点画板位置。每张图、片数、形状和拼板提示各有独立进度。
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
            href={art.source}
            target="_blank"
            rel="noreferrer"
          >
            {art.credit} · 素材出处
          </a>
        </div>
      </dialog>
      <dialog ref={journeyRef} className="journey-dialog" aria-labelledby="journey-title"
        onCancel={(event) => { event.preventDefault(); setJourneyOpen(false); }}
        onClose={(event) => { if (!event.currentTarget.open) setJourneyOpen(false); }}
        onClick={(event) => { if (event.target === event.currentTarget) setJourneyOpen(false); }}>
        <button className="journey-close tool" aria-label="关闭节气旅程" onClick={() => setJourneyOpen(false)}><Icon name="close" /></button>
        {journeyOpen && <SeasonJourney journey={journey} current={mode.picture} onSelect={selectTerm} saveError={journeySaveError} />}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<SiteRouter Game={App} />);
