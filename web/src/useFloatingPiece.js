import { useEffect, useRef, useState } from "react";
import {
  floatingSize,
  snapRadius,
  targetPoint,
  withinSnap,
} from "./gameplay.js";

export function useFloatingPiece(options) {
  const latest = useRef(options);
  latest.current = options;
  const active = useRef(null),
    timer = useRef(null),
    frame = useRef(null);
  const [visual, setVisual] = useState(null),
    [near, setNear] = useState(null);
  function clearJobs() {
    clearTimeout(timer.current);
    cancelAnimationFrame(frame.current);
    timer.current = frame.current = null;
  }
  function release(item) {
    try {
      if (item?.element.hasPointerCapture(item.pointerId))
        item.element.releasePointerCapture(item.pointerId);
    } catch {
      /* Detached source after a completed piece. */
    }
  }
  function cancel() {
    const item = active.current;
    active.current = null;
    clearJobs();
    release(item);
    setVisual(null);
    setNear(null);
    latest.current.onSelect(null);
  }
  function settle(item, success) {
    if (active.current !== item || item.phase !== "held") return;
    clearJobs();
    item.phase = success ? "snap" : "return";
    const config = latest.current,
      rect = config.boardRef.current.getBoundingClientRect();
    const target = success
      ? targetPoint(config.pieces[item.id], config.cols, config.rows, rect)
      : item.source;
    const size = success
      ? floatingSize(config.pieces[item.id], rect)
      : item.size;
    setVisual({ id: item.id, ...target, ...size, angle: 0, phase: item.phase });
    setNear(null);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : success
        ? 230
        : 210;
    timer.current = setTimeout(() => {
      if (active.current !== item) return;
      active.current = null;
      release(item);
      setVisual(null);
      if (success) latest.current.onPlace(item.id);
      else {
        latest.current.onSelect(null);
        latest.current.onMiss();
      }
    }, duration);
  }
  function begin(event, id) {
    const config = latest.current;
    if (
      config.disabled ||
      config.placedRef.current.has(id) ||
      active.current ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    event.preventDefault();
    const element = event.currentTarget,
      rect = config.boardRef.current.getBoundingClientRect(),
      sourceRect = element.getBoundingClientRect();
    const size = floatingSize(config.pieces[id], rect),
      source = {
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
      };
    const item = {
      id,
      element,
      pointerId: event.pointerId,
      phase: "held",
      size,
      source,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      moved: false,
      lift: event.pointerType === "touch" ? 46 : 0,
    };
    active.current = item;
    config.onSelect(id);
    config.onPick();
    element.focus({ preventScroll: true });
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      /* Window listeners remain a fallback. */
    }
    setVisual({
      id,
      x: source.x,
      y: source.y - 10,
      ...size,
      angle: -3,
      phase: "held",
    });
  }
  useEffect(() => {
    function move(event) {
      const item = active.current;
      if (!item || item.pointerId !== event.pointerId || item.phase !== "held")
        return;
      if (
        Math.hypot(event.clientX - item.startX, event.clientY - item.startY) > 5
      )
        item.moved = true;
      if (!item.moved) return;
      if (event.cancelable) event.preventDefault();
      const config = latest.current,
        rect = config.boardRef.current.getBoundingClientRect();
      const point = { x: event.clientX, y: event.clientY - item.lift },
        target = targetPoint(
          config.pieces[item.id],
          config.cols,
          config.rows,
          rect,
        ),
        radius = snapRadius(config.cols, config.rows, rect);
      const viewport = config.boardRef.current
        .closest(".board-scroller")
        .getBoundingClientRect();
      const targetVisible =
        target.x >= viewport.left &&
        target.x <= viewport.right &&
        target.y >= viewport.top &&
        target.y <= viewport.bottom;
      if (config.magnet && targetVisible && withinSnap(point, target, radius)) {
        settle(item, true);
        return;
      }
      setNear(
        config.magnet && targetVisible && withinSnap(point, target, radius * 2)
          ? item.id
          : null,
      );
      const angle = Math.max(
        -9,
        Math.min(9, (event.clientX - item.lastX) * 0.55),
      );
      item.lastX = event.clientX;
      item.pending = {
        id: item.id,
        ...point,
        ...item.size,
        angle,
        phase: "held",
      };
      if (frame.current === null)
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          if (active.current === item && item.phase === "held")
            setVisual(item.pending);
        });
    }
    function up(event) {
      const item = active.current;
      if (!item || item.pointerId !== event.pointerId || item.phase !== "held")
        return;
      if (
        !item.moved &&
        Math.hypot(event.clientX - item.startX, event.clientY - item.startY) <=
          5
      ) {
        cancel();
        latest.current.onSelect(item.id);
        return;
      }
      // Test the final pointer as well: browsers may coalesce the last move.
      move(event);
      if (item.phase !== "held") return;
      const config = latest.current;
      const x = event.clientX,
        y = event.clientY - item.lift;
      const slot = document.elementFromPoint(x, y)?.closest("[data-slot]");
      settle(item, !config.magnet && slot?.dataset.slot === String(item.id));
    }
    function abort(event) {
      if (!event.pointerId || active.current?.pointerId === event.pointerId)
        cancel();
    }
    function lost(event) {
      if (
        active.current?.phase === "held" &&
        active.current.pointerId === event.pointerId
      )
        cancel();
    }
    function hidden() {
      if (document.hidden) cancel();
    }
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("lostpointercapture", lost);
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("lostpointercapture", lost);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
      clearJobs();
      release(active.current);
      active.current = null;
    };
  }, []);
  useEffect(() => {
    if (options.disabled) cancel();
  }, [options.disabled]);
  return { begin, visual, near, cancel, busy: visual !== null };
}
