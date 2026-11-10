import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App, { QUOTES, advanceQuote, nextQuote, normalise, syllabusTopics, ymd } from "./App";

const KEY = "ca-final-companion-v1";
window.scrollTo = () => {}; // jsdom has no layout, so it does not implement scrolling
// Sidebar navigation (the phone tab bar repeats some of these labels).
const nav = (label: string) => fireEvent.click(within(document.querySelector(".sidebar") as HTMLElement).getByRole("button", { name: label }));
const type = (placeholder: string, value: string) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
const lastButton = (name: string) => screen.getAllByRole("button", { name }).at(-1)!;
const restore = (container: HTMLElement, content: string) =>
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File([content], "backup.json", { type: "application/json" })] } });
const addTopic = (chapter: string, name: string) => {
  nav("Syllabus");
  fireEvent.click(screen.getAllByRole("button", { name: "Add topic" })[0]);
  type("e.g. Chapter 1", chapter);
  type("Enter topic name", name);
  fireEvent.click(lastButton("Add topic"));
};

// Most tests start from an empty saved state (a fresh install would preload the ICAI chapters).
beforeEach(() => { localStorage.clear(); localStorage.setItem(KEY, "{}"); history.replaceState(null, "", "/"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("helpers", () => {
  it("runs in IST", () => expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-330));

  it("ymd gives the local date, even just after midnight in IST", () => {
    expect(ymd(new Date(2026, 10, 9, 0, 30))).toBe("2026-11-09");
    expect(ymd(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("has 100 distinct notes", () => {
    expect(QUOTES).toHaveLength(100);
    expect(new Set(QUOTES).size).toBe(100);
    expect(QUOTES.every(q => q.trim().length > 10)).toBe(true);
  });

  it("notes go in list order, starting at the first, and wrap round after the last", () => {
    expect(nextQuote(null, "2026-11-08")).toEqual({ i: 0, day: "2026-11-08" });
    expect(nextQuote({ i: 0, day: "2026-11-08" }, "2026-11-08").i).toBe(1);
    expect(nextQuote({ i: 99, day: "2026-11-08" }, "2026-11-09").i).toBe(0);
  });

  it("each load moves to the next note and remembers it; damaged saved state restarts the list", () => {
    localStorage.removeItem("ca-final-companion-quote");
    expect([advanceQuote().i, advanceQuote().i, advanceQuote().i]).toEqual([0, 1, 2]);
    expect(JSON.parse(localStorage.getItem("ca-final-companion-quote")!)).toEqual({ i: 2, day: ymd(new Date()) });
    for (const bad of ["{oops", '{"i":"x","day":1}', '{"i":-5,"day":"2026-11-08"}', "null"]) {
      localStorage.setItem("ca-final-companion-quote", bad);
      expect(advanceQuote().i).toBe(0);
    }
    localStorage.removeItem("ca-final-companion-quote");
    expect(advanceQuote({ i: 41, day: "2026-11-07" }).i).toBe(42); // nothing saved: continue from the one on screen
  });

  it("normalise survives garbage input", () => {
    for (const bad of [null, undefined, 42, "x", [], { topics: null, sessions: "no" }]) {
      const s = normalise(bad);
      expect(s.topics).toEqual([]);
      expect(s.sessions).toEqual([]);
      expect(s.subjects).toHaveLength(6);
    }
    const topic = { id: "a", subjectId: "fr", chapter: "C", name: "T", status: "Learning", difficulty: "Easy", notes: "", resource: "" };
    expect(normalise({ topics: [null, 3, { id: "a" }, topic] }).topics).toEqual([topic]);
    const q = { id: "q", subjectId: "fr", topicId: "", prompt: "?", answer: 0, explanation: "" };
    expect(normalise({ questions: [{ ...q, options: ["a", "b"] }, { ...q, options: [{}] }, q] }).questions).toHaveLength(1);
  });
});

describe("startup and storage", () => {
  it("opens straight on Meghna's dashboard with a love note", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Hi, Meghna/ })).toBeTruthy();
    expect(QUOTES).toContain(document.querySelector(".note-text")!.textContent);
    expect(screen.getByRole("heading", { level: 2, name: "A little love note" })).toBeTruthy();
    expect(screen.getByText("With love, Jishnu Pedengal")).toBeTruthy();
    expect(screen.getByText("Ready for today's first session?")).toBeTruthy();
  });

  it("shows the next note when the app comes back on a new day without reloading", () => {
    render(<App />);
    const shown = QUOTES.indexOf(document.querySelector(".note-text")!.textContent!);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(Date.now() + 864e5));
      act(() => { document.dispatchEvent(new Event("visibilitychange")); });
      expect(document.querySelector(".note-text")!.textContent).toBe(QUOTES[(shown + 1) % QUOTES.length]);
      act(() => { document.dispatchEvent(new Event("visibilitychange")); }); // same day again: no change
      expect(document.querySelector(".note-text")!.textContent).toBe(QUOTES[(shown + 1) % QUOTES.length]);
    } finally { vi.useRealTimers(); }
  });

  it("recovers from corrupt saved data and keeps a copy of it", () => {
    localStorage.setItem(KEY, "{not json");
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Hi, Meghna/ })).toBeTruthy();
    expect(localStorage.getItem(`${KEY}-unreadable`)).toBe("{not json");
  });

  it("drops a malformed item instead of crashing, and keeps the original aside", () => {
    const raw = JSON.stringify({ topics: [], sessions: [{ id: "bad", subjectId: "fr", minutes: 10 }] }); // no date
    localStorage.setItem(KEY, raw);
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Hi, Meghna/ })).toBeTruthy();
    expect(localStorage.getItem(`${KEY}-unreadable`)).toBe(raw);
  });

  it("greeting counts only today's sessions and drops a zero hour", () => {
    const s = (id: string, date: string, minutes: number) => ({ id, date, subjectId: "fr", topicId: "", topicName: "", minutes, note: "" });
    localStorage.setItem(KEY, JSON.stringify({ topics: [], sessions: [s("a", ymd(new Date()), 20), s("b", ymd(new Date()), 25), s("c", "2020-01-01", 300)] }));
    render(<App />);
    expect(screen.getByText("You've studied 45m today.")).toBeTruthy();
    cleanup();
    localStorage.setItem(KEY, JSON.stringify({ topics: [], sessions: [s("d", ymd(new Date()), 240)] }));
    render(<App />);
    expect(screen.getByText("You've studied 4h today.")).toBeTruthy();
  });

  it("loads old saved data (with name/welcome fields) and wrong-typed lists", () => {
    localStorage.setItem(KEY, JSON.stringify({ name: "X", welcomeDone: true, personalMessage: "hi", topics: null, sessions: [{ id: "s", date: "2026-11-01", subjectId: "fr", topicId: "", topicName: "Old session", minutes: 75, note: "" }] }));
    render(<App />);
    expect(screen.getByText("Old session")).toBeTruthy();
    expect(screen.getAllByText("1h 15m").length).toBeGreaterThan(0);
  });

  it("shows a message instead of crashing when storage is full", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    render(<App />);
    expect(await screen.findByText(/Couldn't save/)).toBeTruthy();
  });

  it("persists changes to localStorage", () => {
    render(<App />);
    addTopic("Ch 1", "Ind AS 115");
    expect(JSON.parse(localStorage.getItem(KEY)!).topics[0].name).toBe("Ind AS 115");
  });
});

describe("every page renders", () => {
  it.each([
    ["Syllabus", "Syllabus"], ["Learn & Notes", "Learning workspace"], ["Practice", "Practice & test"],
    ["Flashcards", "Flashcards"], ["Revision", "Revision planner"], ["Study Log", "Study log"],
    ["Analytics", "Study analytics"], ["Settings", "Settings"], ["Dashboard", "Hi, Meghna"]
  ])("%s", (label, heading) => {
    render(<App />);
    nav(label);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
  });
});

describe("ICAI syllabus", () => {
  it("has the expected number of chapters per paper, with no duplicates", () => {
    const t = syllabusTopics();
    const count = (id: string) => t.filter(x => x.subjectId === id).length;
    expect([count("fr"), count("afm"), count("audit"), count("dt"), count("idt"), count("ibs")]).toEqual([17, 15, 19, 28, 32, 7]);
    expect(new Set(t.map(x => `${x.subjectId}|${x.name}`)).size).toBe(t.length);
    expect(new Set(t.map(x => x.id)).size).toBe(t.length);
    expect(t.every(x => normalise({ topics: [x] }).topics.length === 1)).toBe(true); // valid topics
  });

  it("a fresh install starts with every chapter loaded", () => {
    localStorage.clear();
    render(<App />);
    expect(JSON.parse(localStorage.getItem(KEY)!).topics).toHaveLength(118);
    nav("Syllabus");
    expect(screen.getByText("1. Introduction to Indian Accounting Standards")).toBeTruthy();
  });

  it("Load ICAI chapters adds only missing ones and keeps her own topics and progress", () => {
    render(<App />);
    addTopic("My chapter", "My own topic");
    fireEvent.click(screen.getAllByRole("button", { name: /Load ICAI chapters/ })[0]);
    expect(screen.getByText("Added 118 ICAI chapters")).toBeTruthy();
    const first = document.querySelectorAll(".topic-check")[1] as HTMLElement; // an ICAI chapter
    fireEvent.click(first);
    fireEvent.click(screen.getAllByRole("button", { name: /Load ICAI chapters/ })[0]);
    expect(screen.getByText("All ICAI chapters are already in your syllabus")).toBeTruthy();
    const topics = JSON.parse(localStorage.getItem(KEY)!).topics;
    expect(topics).toHaveLength(119);
    expect(topics.filter((t: { status: string }) => t.status === "Completed")).toHaveLength(1);
  });
});

describe("navigation and back button", () => {
  const h1 = (name: string | RegExp) => screen.findByRole("heading", { level: 1, name });

  it("in-app Back button returns to the previous page", async () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull(); // none on the dashboard
    nav("Syllabus");
    nav("Practice");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await h1("Syllabus")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await h1(/Hi, Meghna/)).toBeTruthy();
  });

  it("browser/phone back button moves between pages", async () => {
    render(<App />);
    nav("Flashcards");
    expect(location.hash).toBe("#Flashcards");
    history.back();
    expect(await h1(/Hi, Meghna/)).toBeTruthy();
  });

  it("opening a page link directly works, and Back then goes to the dashboard", async () => {
    history.replaceState(null, "", "/#Study%20Log");
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Study log" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await h1(/Hi, Meghna/)).toBeTruthy();
  });

  it.each(["#%E0", "#Nonsense"])("a bad link (%s) opens the dashboard", hash => {
    history.replaceState(null, "", `/${hash}`);
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /Hi, Meghna/ })).toBeTruthy();
  });
});

describe("user flows", () => {
  it("syllabus: add, complete, search and delete a topic", () => {
    const { container } = render(<App />);
    addTopic("Ch 1", "Ind AS 115");
    expect(screen.getByText("Topic added")).toBeTruthy();
    fireEvent.click(container.querySelector(".topic-check")!);
    expect(screen.getByText("1/1 completed")).toBeTruthy();
    type("Search chapters or topics", "zzz");
    expect(screen.queryByText("Ind AS 115")).toBeNull();
    type("Search chapters or topics", "");
    fireEvent.click(screen.getByTitle("Delete topic"));
    expect(screen.queryByText("Ind AS 115")).toBeNull();
  });

  it("topic modal will not add a blank topic", () => {
    render(<App />);
    nav("Syllabus");
    fireEvent.click(screen.getAllByRole("button", { name: "Add topic" })[0]);
    expect((lastButton("Add topic") as HTMLButtonElement).disabled).toBe(true);
  });

  it("study log: log, list and delete a session; invalid durations are blocked", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Log study time" })[0]);
    const [h, m] = screen.getAllByRole("spinbutton");
    fireEvent.change(h, { target: { value: "0" } });
    expect((screen.getByRole("button", { name: "Save session" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(m, { target: { value: "75" } });
    expect((screen.getByRole("button", { name: "Save session" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(h, { target: { value: "2" } });
    fireEvent.change(m, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    expect(screen.getAllByText("2h 30m").length).toBeGreaterThan(0);
    expect(screen.getByText("You've studied 2h 30m today.")).toBeTruthy();
    nav("Study Log");
    expect(JSON.parse(localStorage.getItem(KEY)!).sessions[0].date).toBe(ymd(new Date()));
    fireEvent.click(document.querySelector(".session-row .icon-btn")!);
    expect(screen.getByText(/No study sessions recorded/)).toBeTruthy();
  });

  it("notes: save and delete a note", () => {
    render(<App />);
    addTopic("Ch 1", "Leases");
    nav("Learn & Notes");
    type("Note title", "My note");
    type("Write your notes...", "Lessee accounting");
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(screen.getByText("Lessee accounting")).toBeTruthy();
    fireEvent.click(document.querySelector(".saved-note .icon-btn")!);
    expect(screen.queryByText("Lessee accounting")).toBeNull();
  });

  it("practice: add a question and answer it", () => {
    render(<App />);
    nav("Practice");
    fireEvent.click(screen.getByRole("button", { name: "Add question" }));
    type("Enter the question...", "2+2?");
    ["3", "4", "5", "6"].forEach((v, i) => type(`Option ${i + 1}`, v));
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));
    expect(screen.getByText("Question 1 of 1")).toBeTruthy();
    fireEvent.click(screen.getByText("4").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct!")).toBeTruthy();
  });

  it("flashcards: add, flip and delete", () => {
    render(<App />);
    nav("Flashcards");
    type("What do you want to remember?", "Front text");
    type("Write the answer or explanation...", "Back text");
    fireEvent.click(screen.getByRole("button", { name: "Save flashcard" }));
    fireEvent.click(screen.getByRole("button", { name: /Tap to flip/ }));
    expect(screen.getByText("Back text")).toBeTruthy();
    fireEvent.click(document.querySelector(".flash-controls .icon-btn")!);
    expect(screen.getByText(/No flashcards yet/)).toBeTruthy();
  });

  it("revision: schedule and mark done", () => {
    render(<App />);
    addTopic("Ch 1", "Leases");
    nav("Revision");
    const topicSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(topicSelect, { target: { value: topicSelect.options[1].value } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule revision" }));
    const row = document.querySelector(".topic-row") as HTMLElement;
    expect(within(row).getByText("Planned")).toBeTruthy();
    fireEvent.click(row.querySelector(".topic-check")!);
    expect(within(row).getByText("Completed")).toBeTruthy();
  });
});

describe("install app", () => {
  const sidebar = () => within(document.querySelector(".sidebar") as HTMLElement);
  const fakePrompt = () => Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(() => Promise.resolve()) });

  it("Chrome/Android: button appears when the browser offers install, opens its prompt, then hides", async () => {
    render(<App />);
    expect(sidebar().queryByRole("button", { name: /Install app/ })).toBeNull(); // nothing to offer yet
    const e = fakePrompt();
    act(() => { window.dispatchEvent(e); });
    expect(e.defaultPrevented).toBe(true); // we keep the prompt for our own button
    fireEvent.click(sidebar().getByRole("button", { name: /Install app/ }));
    expect(e.prompt).toHaveBeenCalledOnce();
    await act(async () => {});
    expect(sidebar().queryByRole("button", { name: /Install app/ })).toBeNull();
  });

  it("hides the button and confirms once the app is installed", () => {
    render(<App />);
    act(() => { window.dispatchEvent(fakePrompt()); });
    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    expect(sidebar().queryByRole("button", { name: /Install app/ })).toBeNull();
    expect(screen.getByText("App installed")).toBeTruthy();
  });

  it("iPhone: the button shows Safari's Add to Home Screen steps", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1");
    render(<App />);
    fireEvent.click(sidebar().getByRole("button", { name: /Install app/ }));
    expect(screen.getByRole("heading", { name: "Install on iPhone" })).toBeTruthy();
    expect(screen.getByText("Add to Home Screen")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("heading", { name: "Install on iPhone" })).toBeNull();
  });

  it("already installed: no button, and Settings says so", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
    try {
      render(<App />);
      expect(sidebar().queryByRole("button", { name: /Install app/ })).toBeNull();
      nav("Settings");
      expect(screen.getByText(/You're using the installed app/)).toBeTruthy();
    } finally { delete (window as { matchMedia?: unknown }).matchMedia; }
  });

  it("browser that can't install: Settings explains where to open it", () => {
    render(<App />);
    nav("Settings");
    expect(screen.getByText(/open this site in Chrome or Edge/)).toBeTruthy();
  });
});

describe("backup, restore and reset", () => {
  it("exports a JSON file", () => {
    const create = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);
    nav("Settings");
    fireEvent.click(screen.getByRole("button", { name: /Export backup/ }));
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it("restores a valid backup, including an old one with extra fields", async () => {
    const { container } = render(<App />);
    restore(container, JSON.stringify({ name: "Old", personalMessage: "x", topics: [{ id: "t", subjectId: "fr", chapter: "C", name: "Restored topic", status: "Completed", difficulty: "Easy", notes: "", resource: "" }], sessions: [] }));
    expect(await screen.findByText("Backup restored")).toBeTruthy();
    nav("Syllabus");
    expect(screen.getByText("Restored topic")).toBeTruthy();
  });

  it.each([["not JSON", "hello"], ["wrong shape", '{"foo":1}'], ["null", "null"]])("rejects %s without changing data", async (_, content) => {
    const { container } = render(<App />);
    addTopic("Ch 1", "Keep me");
    restore(container, content);
    expect(await screen.findByText("That file is not a valid app backup")).toBeTruthy();
    expect(screen.getByText("Keep me")).toBeTruthy();
  });

  it("clears the file picker so the same file can be restored again", () => {
    // Browsers skip onChange when the same file is picked twice unless the value was cleared.
    const setValue = vi.spyOn(HTMLInputElement.prototype, "value", "set");
    const { container } = render(<App />);
    restore(container, "{}");
    expect(setValue).toHaveBeenCalledWith("");
  });

  it("reset clears data only after confirmation", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    addTopic("Ch 1", "Leases");
    nav("Settings");
    fireEvent.click(screen.getByRole("button", { name: /Reset this browser's data/ }));
    expect(JSON.parse(localStorage.getItem(KEY)!).topics).toHaveLength(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Reset this browser's data/ }));
    expect(JSON.parse(localStorage.getItem(KEY)!).topics).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeTruthy();
  });
});
