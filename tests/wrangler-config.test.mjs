import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("static assets run through the Worker so security headers are applied", async () => {
  const configText = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const config = JSON.parse(configText);

  assert.equal(config.assets?.run_worker_first, true);
});

test("contact attachments use the bounded private R2 binding", async () => {
  const configText = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const config = JSON.parse(configText);
  const attachmentBucket = config.r2_buckets?.find(({ binding }) => binding === "CONTACT_ATTACHMENTS");

  assert.deepEqual(attachmentBucket, {
    binding: "CONTACT_ATTACHMENTS",
    bucket_name: "stream-nexus-contact-attachments",
  });
  assert.equal(config.vars?.CONTACT_ATTACHMENT_RETENTION_DAYS, "90");
  assert.equal(config.vars?.CONTACT_ATTACHMENT_STORAGE_LIMIT_BYTES, String(8 * 1024 * 1024 * 1024));
});
