import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export interface DiffChunk {
  file: string;
  chunk: string;
}

export async function chunkDiffs(entries: Array<{ file: string; patch: string }>): Promise<DiffChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 3000, chunkOverlap: 200 });

  const output: DiffChunk[] = [];

  for (const entry of entries) {
    const parts = await splitter.splitText(entry.patch);
    for (const part of parts) {
      output.push({ file: entry.file, chunk: part });
    }
  }

  return output;
}
