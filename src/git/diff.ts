import path from "node:path";
import { simpleGit } from "simple-git";

const ALLOWED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

export interface DiffOptions {
  cwd?: string;
  staged?: boolean;
  branch?: string;
}

export interface FileDiff {
  file: string;
  patch: string;
}

export async function getDiff(options: DiffOptions = {}): Promise<FileDiff[]> {
  const cwd = options.cwd ?? process.cwd();
  const git = simpleGit({ baseDir: cwd });
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    return [];
  }

  const args: string[] = ["--patch", "--no-color"];
  if (options.staged) {
    args.push("--staged");
  }

  if (options.branch) {
    args.push(options.branch);
  } else {
    args.push("HEAD");
  }

  const raw = await git.diff(args);
  return splitDiff(raw).filter((entry) => ALLOWED_EXTENSIONS.has(path.extname(entry.file)));
}

export function splitDiff(diffText: string): FileDiff[] {
  const chunks = diffText.split(/^diff --git /gm).filter(Boolean);
  return chunks
    .map((chunk) => {
      const content = `diff --git ${chunk}`;
      const match = content.match(/\+\+\+ b\/(.+)/);
      const file = match?.[1]?.trim();
      if (!file) {
        return null;
      }
      return { file, patch: content };
    })
    .filter((entry): entry is FileDiff => entry !== null);
}
