import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const collectHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(entryPath));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(entryPath);
  }
  return files;
};

test("every public HTML page declares the StreamNexus favicon", async () => {
  const siteDirectory = path.resolve(import.meta.dirname, "../site");
  const htmlFiles = await collectHtmlFiles(siteDirectory);
  const missing = [];

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    if (!html.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml">')) {
      missing.push(path.relative(siteDirectory, htmlFile));
    }
  }

  assert.deepEqual(missing, []);
});
