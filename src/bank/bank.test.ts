// Quality gate for the built-in question banks: every paper file must pass before it ships.
// Run one paper: npx vitest run src/bank -t fr
import { describe, expect, it } from "vitest";
import { SYLLABUS } from "../syllabus";
import type { Bank } from "./types";
import fr from "./fr";
import afm from "./afm";
import audit from "./audit";
import dt from "./dt";
import idt from "./idt";
import ibs from "./ibs";

const BANKS: Record<string, Bank> = { fr, afm, audit, dt, idt, ibs };
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

describe.each(Object.keys(BANKS))("%s", paper => {
  const bank = BANKS[paper];
  const qs = bank.questions;
  const chapters = new Set(SYLLABUS[paper].flatMap(([, names]) => names));
  if (paper === "ibs") chapters.add("Strategic Management");

  it("has at least 100 questions", () => expect(qs.length).toBeGreaterThanOrEqual(100));

  it("ids are unique and look like <paper>-NNN", () => {
    expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
    for (const q of qs) expect(q.id, q.id).toMatch(new RegExp(`^${paper}-\\d{3}$`));
  });

  it("every question is well formed", () => {
    for (const q of qs) {
      expect(chapters.has(q.chapter), `${q.id}: unknown chapter "${q.chapter}"`).toBe(true);
      expect(q.prompt.trim().length, `${q.id}: prompt too short`).toBeGreaterThan(20);
      expect(q.options, q.id).toHaveLength(4);
      expect(q.options.every(o => o.trim().length > 0), `${q.id}: empty option`).toBe(true);
      expect(new Set(q.options.map(norm)).size, `${q.id}: duplicate options`).toBe(4);
      expect([0, 1, 2, 3], `${q.id}: bad answer index`).toContain(q.answer);
      expect(q.explanation.trim().length, `${q.id}: missing explanation`).toBeGreaterThan(15);
      expect(q.explanation.length, `${q.id}: explanation should be one line (<= 220 chars)`).toBeLessThanOrEqual(220);
      expect(q.explanation.includes("\n"), `${q.id}: explanation has a line break`).toBe(false);
    }
  });

  it("no repeated questions", () => {
    expect(new Set(qs.map(q => norm(q.prompt))).size).toBe(qs.length);
  });

  it("correct answers are spread across A-D (no letter under 15% or over 35%)", () => {
    for (const k of [0, 1, 2, 3]) {
      const share = qs.filter(q => q.answer === k).length / qs.length;
      expect(share, `answer ${"ABCD"[k]} is ${(share * 100).toFixed(0)}%`).toBeGreaterThanOrEqual(0.15);
      expect(share, `answer ${"ABCD"[k]} is ${(share * 100).toFixed(0)}%`).toBeLessThanOrEqual(0.35);
    }
  });

  it("the correct option isn't a giveaway by being clearly the longest (max 20% of questions)", () => {
    const giveaways = qs.filter(q => q.options[q.answer].length > 1.15 * Math.max(...q.options.filter((_, i) => i !== q.answer).map(o => o.length)));
    expect(giveaways.length / qs.length, `clearly-longest keys: ${giveaways.map(q => q.id).join(", ")}`).toBeLessThanOrEqual(0.2);
  });

  it("covers the syllabus (IBS: every question belongs to a case study)", () => {
    if (paper === "ibs") {
      const ids = new Set((bank.cases ?? []).map(c => c.id));
      expect(ids.size, "at least 15 case studies").toBeGreaterThanOrEqual(15);
      for (const q of qs) expect(ids.has(q.caseId ?? ""), `${q.id}: unknown caseId ${q.caseId}`).toBe(true);
      for (const c of bank.cases ?? []) {
        expect(c.text.length, `${c.id}: case text too short`).toBeGreaterThan(400);
        expect(qs.filter(q => q.caseId === c.id).length, `${c.id}: needs 4+ questions`).toBeGreaterThanOrEqual(4);
      }
    } else {
      const used = new Set(qs.map(q => q.chapter));
      const missing = [...chapters].filter(c => !used.has(c));
      expect(missing, "chapters with no questions").toEqual([]);
      for (const q of qs) expect(q.caseId, `${q.id}: caseId is for IBS only`).toBeUndefined();
    }
  });
});
