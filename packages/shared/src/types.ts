import type { Genre } from "./config";

export interface ExpenseItem {
  name: string;
  amount: number;
}

export interface Expenses {
  items: ExpenseItem[];
  total: number;
}

export interface SubmitRequest {
  genre: Genre;
  date: string;
  titleDraft: string;
  text: string;
  expenses: Expenses;
  images: SubmitImage[];
}

export interface SubmitImage {
  filename: string;
  contentType: string;
  data: ArrayBuffer;
}

export interface GeneratedArticle {
  markdown: string;
  slug: string;
}

export interface PublishResult {
  commitSha: string;
  articleUrl: string;
  repo: string;
}

export interface SubmitResponse {
  success: boolean;
  articleUrl?: string;
  error?: string;
}
