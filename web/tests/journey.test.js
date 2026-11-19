import test from "node:test";
import assert from "node:assert/strict";
import { solarTerms, seasons } from "../src/solarTerms.js";
import { completeTerm, JOURNEY_KEY, nextTerm, persistJourney, puzzleSaveKey, readJourney, termStatus } from "../src/journeyModel.js";

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test("24 terms follow the seasonal order, with six unique assets per season", () => {
  assert.equal(solarTerms.map((term) => term.title).join(" "),
    "立春 雨水 惊蛰 春分 清明 谷雨 立夏 小满 芒种 夏至 小暑 大暑 立秋 处暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至 小寒 大寒");
  assert.equal(new Set(solarTerms.map((term) => term.id)).size, 24);
  assert.equal(new Set(solarTerms.map((term) => term.asset.catalogId)).size, 24);
  assert.ok(seasons.every((season) => solarTerms.filter((term) => term.season === season.id).length === 6));
});
test("completion lights one node and unlocks only its immediate successor", () => {
  let journey = readJourney(storage());
  assert.equal(solarTerms.filter((term) => termStatus(term.id, journey) === "available").length, 1);
  for (let i = 0; i < 24; i++) {
    assert.equal(termStatus(solarTerms[i].id, journey), "available");
    journey = completeTerm(journey, solarTerms[i].id);
    assert.equal(journey.completed.size, i + 1);
    assert.equal(solarTerms.filter((term) => termStatus(term.id, journey) === "locked").length, Math.max(0, 22 - i));
  }
  assert.equal(nextTerm("majorCold"), null);
  assert.equal(nextTerm("unknown"), null);
});
test("replaying or resetting an already completed puzzle keeps the historical light", () => {
  const local = storage(), journey = completeTerm(readJourney(local), "startSpring");
  assert.equal(completeTerm(journey, "startSpring"), journey);
  assert.equal(completeTerm(journey, "unknown"), journey);
  persistJourney(local, journey);
  assert.equal(termStatus("rain", readJourney(local)), "available");
  assert.equal(termStatus("startSpring", readJourney(local)), "complete");
});
test("legacy rain completion and partly played spring equinox stay distinct", () => {
  const local = storage();
  local.setItem("shiguang-react-v1-easy-classic", JSON.stringify(Array.from({ length: 12 }, (_, i) => i)));
  local.setItem("shiguang-puzzle-equinox-blank-medium-organic", "[0,1]");
  const journey = readJourney(local);
  assert.deepEqual([...journey.completed], ["rain"]);
  assert.equal(termStatus("startSpring", journey), "available");
  assert.equal(termStatus("insects", journey), "available");
  assert.equal(termStatus("equinox", journey), "available");
  assert.equal(termStatus("pureBrightness", journey), "locked");
  assert.equal(puzzleSaveKey("rain", "guided", "easy", "classic"), "shiguang-react-v1-easy-classic");
});
test("all difficulty, shape and blank-board saves can record a real completion", () => {
  const local = storage();
  local.setItem(puzzleSaveKey("startSummer", "blank", "hard", "organic"), JSON.stringify(Array.from({ length: 48 }, (_, i) => i)));
  local.setItem(puzzleSaveKey("minorHeat", "guided", "easy", "classic"), JSON.stringify([0, 0, -1, 30, "1"]));
  const journey = readJourney(local);
  assert.deepEqual([...journey.completed], ["startSummer"]);
  assert.equal(termStatus("grainFull", journey), "available");
  assert.equal(journey.started.has("minorHeat"), true);
});
test("damaged journal cannot erase valid legacy saves or accept unknown IDs", () => {
  const local = storage();
  local.setItem(JOURNEY_KEY, "broken");
  local.setItem("shiguang-react-v1-easy-classic", "[0]");
  assert.equal(readJourney(local).started.has("rain"), true);
  local.setItem(JOURNEY_KEY, JSON.stringify({ version: 1, completed: ["bogus", null, "startSpring", "startSpring"] }));
  assert.deepEqual([...readJourney(local).completed], ["startSpring"]);
});
test("blocked storage degrades to the first level without fabricating completion", () => {
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("quota"); } };
  const journey = readJourney(blocked);
  assert.equal(journey.completed.size, 0);
  assert.equal(termStatus("startSpring", journey), "available");
  assert.throws(() => persistJourney(blocked, journey), /quota/);
});
