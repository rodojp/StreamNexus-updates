import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/worker.js";

test("GET /api/releases returns normalized published releases and caches the response", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const cachedResponses = [];

  globalThis.fetch = async () => new Response(JSON.stringify([
    {
      id: 123,
      tag_name: "v0.1.20-beta.3",
      name: "StreamNexus 0.1.20-beta.3",
      draft: false,
      prerelease: true,
      published_at: "2026-07-14T14:16:12Z",
      html_url: "https://github.com/rodojp/StreamNexus-updates/releases/tag/v0.1.20-beta.3",
      body: "## 主な変更\n\n- 黒画面を抑制しました。",
      assets: [
        {
          name: "StreamNexus-Setup-0.1.20-beta.3.exe",
          browser_download_url: "https://example.com/StreamNexus-Setup-0.1.20-beta.3.exe",
          size: 91066849,
        },
      ],
    },
    {
      id: 999,
      tag_name: "draft",
      name: "Draft",
      draft: true,
      prerelease: false,
      assets: [],
    },
  ]), { status: 200 });
  globalThis.caches = {
    default: {
      async match() {
        return undefined;
      },
      async put(request, response) {
        cachedResponses.push({ request, response });
      },
    },
  };

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/releases"),
      {},
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /max-age=600/);
    assert.equal(body.releases.length, 1);
    assert.deepEqual(body.releases[0], {
      id: 123,
      tagName: "v0.1.20-beta.3",
      name: "StreamNexus 0.1.20-beta.3",
      prerelease: true,
      publishedAt: "2026-07-14T14:16:12Z",
      url: "https://github.com/rodojp/StreamNexus-updates/releases/tag/v0.1.20-beta.3",
      body: "## 主な変更\n\n- 黒画面を抑制しました。",
      assets: [
        {
          name: "StreamNexus-Setup-0.1.20-beta.3.exe",
          downloadUrl: "https://example.com/StreamNexus-Setup-0.1.20-beta.3.exe",
          size: 91066849,
        },
      ],
    });
    assert.equal(cachedResponses.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  }
});

test("GET /api/releases returns a cached response without calling GitHub", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const cachedResponse = new Response(JSON.stringify({ releases: [{ tagName: "v0.1.20-beta.3" }] }), {
    headers: { "content-type": "application/json" },
  });

  globalThis.fetch = async () => {
    throw new Error("GitHub must not be called when the response is cached");
  };
  globalThis.caches = {
    default: {
      async match() {
        return cachedResponse;
      },
    },
  };

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/releases"),
      {},
    );

    assert.equal(response, cachedResponse);
    assert.deepEqual(await response.json(), {
      releases: [{ tagName: "v0.1.20-beta.3" }],
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  }
});

test("GET /api/releases fails closed when GitHub is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const originalConsoleError = console.error;
  const errors = [];

  globalThis.fetch = async () => new Response("rate limited", { status: 429 });
  globalThis.caches = {
    default: {
      async match() {
        return undefined;
      },
      async put() {
        throw new Error("An error response must not be cached");
      },
    },
  };
  console.error = (...values) => errors.push(values);

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/releases"),
      {},
    );

    assert.equal(response.status, 502);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "release_list_unavailable" });
    assert.equal(errors.length, 1);
    assert.match(String(errors[0][0]), /"status":429/);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  }
});

test("GET /api/releases rejects a malformed GitHub response", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;

  globalThis.fetch = async () => Response.json({ message: "unexpected response" });
  globalThis.caches = {
    default: {
      async match() {
        return undefined;
      },
    },
  };

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/releases"),
      {},
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "invalid_release_list" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  }
});

test("scheduled retention deletes only closed contact messages older than the configured period", async () => {
  const calls = [];
  const database = {
    prepare(query) {
      const call = { query, bindings: [] };
      calls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async run() {
          return { success: true, meta: { changes: 2 } };
        },
      };
    },
  };

  await worker.scheduled({}, {
    CONTACT_DB: database,
    CONTACT_RETENTION_DAYS: "180",
  });

  const deleteCall = calls.find(({ query }) => query.includes("DELETE FROM contact_messages"));
  assert.ok(deleteCall);
  assert.match(deleteCall.query, /status = 'closed'/);
  assert.deepEqual(deleteCall.bindings, ["-180 days"]);
});

test("scheduled retention uses 180 days when the configured period is invalid", async () => {
  const calls = [];
  const database = {
    prepare(query) {
      const call = { query, bindings: [] };
      calls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async run() {
          return { success: true, meta: { changes: 0 } };
        },
      };
    },
  };

  await worker.scheduled({}, {
    CONTACT_DB: database,
    CONTACT_RETENTION_DAYS: "0",
  });

  const deleteCall = calls.find(({ query }) => query.includes("DELETE FROM contact_messages"));
  assert.ok(deleteCall);
  assert.deepEqual(deleteCall.bindings, ["-180 days"]);
});

test("HTML assets receive a per-response CSP nonce for Cloudflare JavaScript Detections", async () => {
  const env = {
    ASSETS: {
      async fetch() {
        return new Response("<!doctype html><title>StreamNexus</title>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  };

  const response = await worker.fetch(new Request("https://stream-nexus.com/"), env);
  const policy = response.headers.get("content-security-policy") ?? "";
  const scriptDirective = policy.split(";").find((directive) => directive.trim().startsWith("script-src")) ?? "";

  assert.match(scriptDirective, /'nonce-[^']+'/);
  assert.match(scriptDirective, /https:\/\/static\.cloudflareinsights\.com/);
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
  assert.match(policy, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
});

test("contact configuration, redirects, and API rejection paths remain available", async () => {
  const configuredEnv = {
    CONTACT_DB: {},
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET_KEY: "secret-key",
  };

  const configResponse = await worker.fetch(
    new Request("https://stream-nexus.com/api/contact/config"),
    configuredEnv,
  );
  assert.deepEqual(await configResponse.json(), {
    enabled: true,
    siteKey: "site-key",
    attachments: {
      enabled: false,
      maxFiles: 3,
      maxFileBytes: 5 * 1024 * 1024,
      maxTotalBytes: 10 * 1024 * 1024,
      retentionDays: 90,
      allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".txt", ".log", ".json"],
    },
  });

  const redirectResponse = await worker.fetch(
    new Request("https://stream-nexus.com/releases?source=test"),
    configuredEnv,
  );
  assert.equal(redirectResponse.status, 308);
  assert.equal(redirectResponse.headers.get("location"), "https://stream-nexus.com/releases/?source=test");

  const unknownResponse = await worker.fetch(
    new Request("https://stream-nexus.com/api/unknown"),
    configuredEnv,
  );
  assert.equal(unknownResponse.status, 404);

  const unsupportedResponse = await worker.fetch(
    new Request("https://stream-nexus.com/api/contact", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "not json",
    }),
    configuredEnv,
  );
  assert.equal(unsupportedResponse.status, 415);
});

test("a valid contact submission passes Turnstile and is stored in D1", async () => {
  const originalFetch = globalThis.fetch;
  const databaseCalls = [];
  const database = {
    prepare(query) {
      const call = { query, bindings: [] };
      databaseCalls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async run() {
          return { success: true, meta: { changes: 1 } };
        },
      };
    },
  };
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, action: "contact" });
  };

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "192.0.2.1",
          "user-agent": "StreamNexus test",
        },
        body: JSON.stringify({
          locale: "ja",
          category: "general",
          name: "Tester",
          email: "tester@example.com",
          message: "This is a valid contact message.",
          turnstileToken: "valid-turnstile-token",
        }),
      }),
      {
        CONTACT_DB: database,
        TURNSTILE_SITE_KEY: "site-key",
        TURNSTILE_SECRET_KEY: "secret-key",
      },
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.match(body.referenceId, /^[0-9a-f-]{36}$/i);
    assert.equal(databaseCalls.filter(({ query }) => query.includes("CREATE TABLE")).length, 3);
    assert.equal(databaseCalls.filter(({ query }) => query.includes("CREATE INDEX")).length, 4);
    const insertCall = databaseCalls.find(({ query }) => query.includes("INSERT INTO contact_messages"));
    assert.ok(insertCall);
    assert.equal(insertCall.bindings[5], "tester@example.com");
    assert.equal(insertCall.bindings.at(-1), "new");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a multipart contact submission stores validated attachments in private R2 storage", async () => {
  const originalFetch = globalThis.fetch;
  const { database, calls } = createContactDatabaseMock();
  const storage = createAttachmentStorageMock();
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, action: "contact" });
  };

  const form = createContactFormData();
  form.append("attachments", new File([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
  ], "screenshot.png", { type: "image/png" }));
  form.append("attachments", new File([
    "StreamNexus diagnostic log\nNo credentials included.\n",
  ], "diagnostic.log", { type: "text/plain" }));

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      createContactEnv(database, storage),
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.attachmentCount, 2);
    assert.equal(storage.puts.length, 2);
    assert.deepEqual(storage.puts.map(({ options }) => options.httpMetadata.contentType), [
      "image/png",
      "text/plain; charset=utf-8",
    ]);
    assert.ok(calls.some(({ query }) => query.includes("contact_attachment_storage") && query.includes("used_bytes")));
    assert.equal(calls.filter(({ query }) => query.includes("INSERT INTO contact_attachments")).length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact attachments reject unsupported file content before writing to R2", async () => {
  const originalFetch = globalThis.fetch;
  const { database } = createContactDatabaseMock();
  const storage = createAttachmentStorageMock();
  globalThis.fetch = async () => Response.json({ success: true, action: "contact" });

  const form = createContactFormData();
  form.append("attachments", new File(["<script>alert(1)</script>"], "report.html", { type: "text/html" }));

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      createContactEnv(database, storage),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "unsupported_attachment_type" });
    assert.equal(storage.puts.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact attachments enforce the five MiB per-file limit", async () => {
  const originalFetch = globalThis.fetch;
  const { database } = createContactDatabaseMock();
  const storage = createAttachmentStorageMock();
  globalThis.fetch = async () => Response.json({ success: true, action: "contact" });

  const oversizedPng = new Uint8Array(5 * 1024 * 1024 + 1);
  oversizedPng.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = createContactFormData();
  form.append("attachments", new File([oversizedPng], "oversized.png", { type: "image/png" }));

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      createContactEnv(database, storage),
    );

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "attachment_too_large" });
    assert.equal(storage.puts.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact attachments reject more than three files before Turnstile or R2", async () => {
  const originalFetch = globalThis.fetch;
  const { database } = createContactDatabaseMock();
  const storage = createAttachmentStorageMock();
  globalThis.fetch = async () => {
    throw new Error("Turnstile must not run for an invalid attachment request");
  };

  const form = createContactFormData();
  for (let index = 0; index < 4; index += 1) {
    form.append("attachments", new File([`log ${index}`], `diagnostic-${index}.log`, { type: "text/plain" }));
  }

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      createContactEnv(database, storage),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "too_many_attachments" });
    assert.equal(storage.puts.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the global attachment quota is reserved before R2 writes", async () => {
  const originalFetch = globalThis.fetch;
  const { database, calls } = createContactDatabaseMock({ reservationChanges: 0 });
  const storage = createAttachmentStorageMock();
  globalThis.fetch = async () => Response.json({ success: true, action: "contact" });

  const form = createContactFormData();
  form.append("attachments", new File(["diagnostic log"], "diagnostic.txt", { type: "text/plain" }));

  try {
    const env = createContactEnv(database, storage);
    env.CONTACT_ATTACHMENT_STORAGE_LIMIT_BYTES = String(64 * 1024 * 1024 * 1024);
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      env,
    );

    assert.equal(response.status, 507);
    assert.deepEqual(await response.json(), { error: "attachment_storage_full" });
    assert.equal(storage.puts.length, 0);
    const reservationCall = calls.find(({ query }) => query.includes("used_bytes = used_bytes +"));
    assert.ok(reservationCall);
    assert.equal(reservationCall.bindings[1], 8 * 1024 * 1024 * 1024);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a partial R2 upload failure deletes uploaded objects and releases the reservation", async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const { database, calls } = createContactDatabaseMock();
  const storage = createAttachmentStorageMock({ failAtPut: 2 });
  globalThis.fetch = async () => Response.json({ success: true, action: "contact" });
  console.error = () => {};

  const form = createContactFormData();
  form.append("attachments", new File(["first diagnostic log"], "first.log", { type: "text/plain" }));
  form.append("attachments", new File(["second diagnostic log"], "second.log", { type: "text/plain" }));

  try {
    const response = await worker.fetch(
      new Request("https://stream-nexus.com/api/contact", { method: "POST", body: form }),
      createContactEnv(database, storage),
    );

    assert.equal(response.status, 500);
    assert.equal(storage.puts.length, 1);
    assert.equal(storage.deletes.length, 2);
    assert.ok(storage.deletes.includes(storage.puts[0].key));
    assert.ok(calls.some(({ query, bindings }) => (
      query.includes("contact_attachment_storage")
      && query.includes("used_bytes -")
      && bindings.includes("first diagnostic log".length + "second diagnostic log".length)
    )));
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test("scheduled retention deletes expired R2 attachments and releases reserved bytes", async () => {
  const expiredAttachments = [
    { id: "attachment-1", object_key: "contacts/contact-1/attachment-1.png", size_bytes: 1024 },
    { id: "attachment-2", object_key: "contacts/contact-2/attachment-2.log", size_bytes: 2048 },
  ];
  const { database, calls } = createContactDatabaseMock({ expiredAttachments });
  const storage = createAttachmentStorageMock();

  await worker.scheduled({}, {
    CONTACT_DB: database,
    CONTACT_ATTACHMENTS: storage,
    CONTACT_ATTACHMENT_RETENTION_DAYS: "90",
    CONTACT_RETENTION_DAYS: "180",
  });

  assert.deepEqual(storage.deletes, expiredAttachments.map(({ object_key }) => object_key));
  assert.ok(calls.some(({ query, bindings }) => (
    query.includes("DELETE FROM contact_attachments")
    && bindings.includes("attachment-1")
    && bindings.includes("attachment-2")
  )));
  assert.ok(calls.some(({ query, bindings }) => (
    query.includes("contact_attachment_storage")
    && query.includes("SUM(size_bytes)")
    && bindings.includes("attachment-1")
    && bindings.includes("attachment-2")
  )));
});

test("the contact pages expose optional bounded attachments and submit multipart data", async () => {
  const fs = await import("node:fs/promises");
  const japanesePage = await fs.readFile(new URL("../site/contact/index.html", import.meta.url), "utf8");
  const englishPage = await fs.readFile(new URL("../site/contact/en/index.html", import.meta.url), "utf8");
  const formScript = await fs.readFile(new URL("../site/contact/contact-form.js", import.meta.url), "utf8");

  for (const page of [japanesePage, englishPage]) {
    assert.match(page, /type="file"/);
    assert.match(page, /name="attachments"/);
    assert.match(page, /multiple/);
    assert.match(page, /accept="\.png,\.jpg,\.jpeg,\.webp,\.txt,\.log,\.json"/);
  }
  assert.match(formScript, /data\.append\("turnstileToken", turnstileToken\)/);
  assert.match(formScript, /body: data/);
  assert.doesNotMatch(formScript, /content-type["']:\s*["']application\/json/);
});

function createContactFormData() {
  const form = new FormData();
  form.append("locale", "ja");
  form.append("category", "bug");
  form.append("name", "Tester");
  form.append("email", "tester@example.com");
  form.append("message", "This is a valid contact message with diagnostic details.");
  form.append("website", "");
  form.append("turnstileToken", "valid-turnstile-token");
  return form;
}

function createContactEnv(database, storage) {
  return {
    CONTACT_DB: database,
    CONTACT_ATTACHMENTS: storage,
    CONTACT_ATTACHMENT_RETENTION_DAYS: "90",
    CONTACT_ATTACHMENT_STORAGE_LIMIT_BYTES: String(8 * 1024 * 1024 * 1024),
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET_KEY: "secret-key",
  };
}

function createAttachmentStorageMock({ failAtPut = 0 } = {}) {
  const puts = [];
  const deletes = [];
  return {
    puts,
    deletes,
    async put(key, value, options) {
      if (failAtPut > 0 && puts.length + 1 === failAtPut) {
        throw new Error("simulated R2 failure");
      }
      puts.push({ key, value, options });
      return { key, size: value.byteLength ?? value.size ?? 0 };
    },
    async delete(keys) {
      deletes.push(...(Array.isArray(keys) ? keys : [keys]));
    },
  };
}

function createContactDatabaseMock({ reservationChanges = 1, expiredAttachments = [] } = {}) {
  const calls = [];
  const database = {
    prepare(query) {
      const call = { query, bindings: [] };
      calls.push(call);
      const statement = {
        call,
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async run() {
          if (query.includes("UPDATE contact_attachment_storage") && query.includes("used_bytes +")) {
            return { success: true, meta: { changes: reservationChanges } };
          }
          return { success: true, meta: { changes: 1 } };
        },
        async all() {
          if (query.includes("FROM contact_attachments") && query.includes("expires_at")) {
            return { success: true, results: expiredAttachments };
          }
          return { success: true, results: [] };
        },
      };
      return statement;
    },
    async batch(statements) {
      return Promise.all(statements.map((statement) => statement.run()));
    },
  };
  return { database, calls };
}
