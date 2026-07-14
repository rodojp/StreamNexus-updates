import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("static assets run through the Worker so security headers are applied", async () => {
  const configText = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const config = JSON.parse(configText);

  assert.equal(config.assets?.run_worker_first, true);
});
