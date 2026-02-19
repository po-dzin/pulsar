import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type LoadedMarkdownArticle = {
  data: Record<string, unknown>;
  content: string;
};

export const loadArticleContent = async (relativePath: string): Promise<LoadedMarkdownArticle> => {
  const absolutePath = path.join(process.cwd(), relativePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = matter(raw);
  return {
    data: parsed.data,
    content: parsed.content,
  };
};
