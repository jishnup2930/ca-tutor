import type { Bank } from "./types";

// Each paper's questions are a separate download, fetched the first time that paper is opened.
const loaders: Record<string, () => Promise<{ default: Bank }>> = {
  fr: () => import("./fr"),
  afm: () => import("./afm"),
  audit: () => import("./audit"),
  dt: () => import("./dt"),
  idt: () => import("./idt"),
  ibs: () => import("./ibs"),
};
export const loadBank = async (paper: string): Promise<Bank> => (loaders[paper] ? (await loaders[paper]()).default : { questions: [] });
