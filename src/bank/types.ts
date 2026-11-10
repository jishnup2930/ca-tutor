// Built-in practice questions. Each paper has its own file (fr.ts, afm.ts, ...) exporting a Bank as default.
export type BankQuestion = {
  id: string;            // "<paper>-<3 digits>", e.g. "fr-001"; never reuse or renumber (progress is saved by id)
  chapter: string;       // exact chapter title from src/syllabus.ts (IBS: a subject it draws on, or "Strategic Management")
  prompt: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3; // index of the correct option
  explanation: string;   // one line, shown after the right answer
  caseId?: string;       // IBS only: the case study this question belongs to
};
export type BankCase = { id: string; title: string; text: string };
export type Bank = { questions: BankQuestion[]; cases?: BankCase[] };
