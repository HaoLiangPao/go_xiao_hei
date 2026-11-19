import { solarTerms } from "./solarTerms.js";
import { levels, readProgress } from "./geometry.js";

export const JOURNEY_KEY = "shiguang-solar-journey-v1";
const termIds = new Set(solarTerms.map((term) => term.id));

export function puzzleSaveKey(picture, board, level, shape) {
  return picture === "rain" && board === "guided"
    ? `shiguang-react-v1-${level}-${shape}`
    : `shiguang-puzzle-${picture}-${board}-${level}-${shape}`;
}

export function readJourney(storage) {
  const completed = new Set(), started = new Set();
  try {
    const saved = JSON.parse(storage.getItem(JOURNEY_KEY));
    if (saved?.version === 1 && Array.isArray(saved.completed))
      saved.completed.filter((id) => termIds.has(id)).forEach((id) => completed.add(id));
  } catch { /* A damaged journal must not hide valid older puzzle saves. */ }
  try {
    for (const term of solarTerms) for (const board of ["guided", "blank"])
      for (const [level, { cols, rows }] of Object.entries(levels))
        for (const shape of ["flat", "classic", "organic"]) {
          const progress = readProgress(storage, puzzleSaveKey(term.id, board, level, shape), cols * rows);
          if (progress.size) started.add(term.id);
          if (progress.size === cols * rows) completed.add(term.id);
        }
  } catch { /* Blocked storage still allows the current session to play. */ }
  return { completed, started };
}

export function termStatus(id, journey) {
  const index = solarTerms.findIndex((term) => term.id === id);
  if (index < 0) return "locked";
  if (journey.completed.has(id)) return "complete";
  if (index === 0 || journey.completed.has(solarTerms[index - 1].id) || journey.started.has(id))
    return "available";
  return "locked";
}

export function completeTerm(journey, id) {
  if (!termIds.has(id) || journey.completed.has(id)) return journey;
  return { completed: new Set([...journey.completed, id]), started: new Set([...journey.started, id]) };
}

export function persistJourney(storage, journey) {
  storage.setItem(JOURNEY_KEY, JSON.stringify({ version: 1,
    completed: solarTerms.filter((term) => journey.completed.has(term.id)).map((term) => term.id) }));
}

export function nextTerm(id) {
  const index = solarTerms.findIndex((term) => term.id === id);
  return index < 0 ? null : solarTerms[index + 1] ?? null;
}
