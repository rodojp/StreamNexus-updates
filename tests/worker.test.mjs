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

  assert.deepEqual(calls[0].bindings, ["-180 days"]);
});
