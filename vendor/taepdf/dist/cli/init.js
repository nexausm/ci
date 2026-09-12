#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const TEMPLATE = `import { escapeHtml } from 'taepdf'

export interface DocumentData {
  title: string
  body:  string
}

export function buildDocumentHTML(data: DocumentData): string {
  return \`
    <style>
      .page {
        box-sizing: border-box;
        font-family: sans-serif;
        color: #111;
        padding: 56pt 62pt;
      }
      .page *, .page *::before, .page *::after {
        box-sizing: inherit;
        margin: 0;
        padding: 0;
      }
    </style>
    <div class="page">
      <h1>\${escapeHtml(data.title)}</h1>
      <p>\${escapeHtml(data.body)}</p>
    </div>
  \`
}

// Usage:
//
// import pdf from 'taepdf'
// const html = buildDocumentHTML({ title: 'Hello, PDF', body: 'This is my first document.' })
// await pdf.download(html, 'A4', 'hello.pdf')
//
// See the taepdf README's "The download utility pattern" section for a
// production-ready export wrapper (double-click guard, loading state, error
// handling) to call buildDocumentHTML from a real button click.
`;
const targetDir = path.resolve(process.cwd(), process.argv[2] ?? "src/pdf");
const targetFile = path.join(targetDir, "documentTemplate.ts");
mkdirSync(targetDir, { recursive: true });
if (existsSync(targetFile)) {
  console.log(
    `[taepdf] Skipped ${path.relative(process.cwd(), targetFile)} \u2014 already exists.`,
  );
} else {
  writeFileSync(targetFile, TEMPLATE);
  console.log(`[taepdf] Created ${path.relative(process.cwd(), targetFile)}`);
  console.log("");
  console.log("Next steps:");
  console.log(
    "  1. Edit documentTemplate.ts \u2014 adapt DocumentData and buildDocumentHTML to your own document.",
  );
  console.log(
    "  2. Call pdf.download(buildDocumentHTML(data), 'A4', 'file.pdf') from a button click.",
  );
  console.log(
    "  3. For a production-ready export wrapper (double-click guard, loading state, error handling),",
  );
  console.log(`     see the README's "The download utility pattern" section.`);
}
