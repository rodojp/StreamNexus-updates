const CONTACT_CATEGORIES = new Set(["general", "bug", "privacy", "deletion", "other"]);
const MAX_JSON_BYTES = 24 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_CONTACT_RETENTION_DAYS = 180;
const MAX_CONTACT_RETENTION_DAYS = 3650;
const RELEASE_CACHE_SECONDS = 600;
const RELEASES_API_URL = "https://api.github.com/repos/rodojp/StreamNexus-updates/releases?per_page=20";
const CANONICAL_TRAILING_SLASH_PATHS = new Set([
  "/contact",
  "/contact/en",
  "/en",
  "/privacy",
  "/privacy/en",
  "/privacy/ja",
  "/releases",
  "/releases/en",
  "/support",
  "/support/en",
  "/terms",
  "/terms/en",
  "/terms/ja",
]);
const SECURITY_HEADERS = {
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
  ].join("; "),
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/security.txt") {
      return permanentRedirect(url, "/.well-known/security.txt");
    }

    if (CANONICAL_TRAILING_SLASH_PATHS.has(url.pathname)) {
      return permanentRedirect(url, `${url.pathname}/`);
    }

    if (url.pathname === "/api/contact/config" && request.method === "GET") {
      return jsonResponse({
        enabled: isContactConfigured(env),
        siteKey: isContactConfigured(env) ? env.TURNSTILE_SITE_KEY : null,
      });
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        return await handleContactSubmit(request, env);
      } catch (error) {
        logContactError("contact_submit_unhandled", request, error);
        return jsonResponse({ error: "internal_error" }, 500);
      }
    }

    if (url.pathname === "/api/releases" && request.method === "GET") {
      return handleReleaseList(request);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "not_found" }, 404);
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },

  async scheduled(_controller, env) {
    await deleteExpiredClosedContacts(env);
  },
};

async function handleReleaseList(request) {
  const cache = globalThis.caches?.default;
  const cachedResponse = await cache?.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const upstreamResponse = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "StreamNexus-release-notes",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!upstreamResponse.ok) {
    console.error(JSON.stringify({
      event: "release_list_fetch_failed",
      status: upstreamResponse.status,
    }));
    return jsonResponse({ error: "release_list_unavailable" }, 502);
  }

  const upstreamReleases = await upstreamResponse.json();
  if (!Array.isArray(upstreamReleases)) {
    return jsonResponse({ error: "invalid_release_list" }, 502);
  }

  const releases = upstreamReleases
    .filter((release) => release && typeof release === "object" && release.draft !== true)
    .map(normalizeRelease)
    .filter(Boolean);
  const response = new Response(JSON.stringify({ releases }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${RELEASE_CACHE_SECONDS}, stale-while-revalidate=3600`,
      ...SECURITY_HEADERS,
    },
  });

  await cache?.put(request, response.clone());
  return response;
}

function normalizeRelease(release) {
  const id = Number(release.id);
  const tagName = typeof release.tag_name === "string" ? release.tag_name : "";
  const name = typeof release.name === "string" && release.name.trim()
    ? release.name.trim()
    : tagName;
  const url = typeof release.html_url === "string" ? release.html_url : "";
  if (!Number.isFinite(id) || !tagName || !name || !url) {
    return null;
  }

  const assets = Array.isArray(release.assets)
    ? release.assets
      .map((asset) => {
        const assetName = typeof asset?.name === "string" ? asset.name : "";
        const downloadUrl = typeof asset?.browser_download_url === "string"
          ? asset.browser_download_url
          : "";
        if (!assetName || !downloadUrl) return null;
        return {
          name: assetName,
          downloadUrl,
          size: Number.isFinite(Number(asset.size)) ? Number(asset.size) : 0,
        };
      })
      .filter(Boolean)
    : [];

  return {
    id,
    tagName,
    name,
    prerelease: release.prerelease === true,
    publishedAt: typeof release.published_at === "string" ? release.published_at : "",
    url,
    body: typeof release.body === "string" ? release.body : "",
    assets,
  };
}

async function deleteExpiredClosedContacts(env) {
  if (!env.CONTACT_DB) {
    console.warn(JSON.stringify({ event: "contact_retention_skipped", reason: "database_not_configured" }));
    return;
  }

  const retentionDays = parseRetentionDays(env.CONTACT_RETENTION_DAYS);
  const result = await env.CONTACT_DB.prepare(
    `DELETE FROM contact_messages
     WHERE status = 'closed'
       AND datetime(created_at) < datetime('now', ?)`
  )
    .bind(`-${retentionDays} days`)
    .run();

  console.log(JSON.stringify({
    event: "contact_retention_completed",
    retentionDays,
    deleted: Number(result?.meta?.changes ?? 0),
  }));
}

function parseRetentionDays(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_CONTACT_RETENTION_DAYS) {
    return DEFAULT_CONTACT_RETENTION_DAYS;
  }
  return parsed;
}

function permanentRedirect(url, pathname) {
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathname;
  return new Response(null, {
    status: 308,
    headers: {
      location: redirectUrl.toString(),
      ...SECURITY_HEADERS,
    },
  });
}

function isContactConfigured(env) {
  return Boolean(env.CONTACT_DB && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
}

async function handleContactSubmit(request, env) {
  if (!isContactConfigured(env)) {
    return jsonResponse({ error: "contact_form_not_configured" }, 503);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ error: "unsupported_content_type" }, 415);
  }

  let bodyText;
  try {
    bodyText = await readLimitedBody(request);
  } catch (error) {
    if (error instanceof Error && error.message === "payload_too_large") {
      return jsonResponse({ error: "payload_too_large" }, 413);
    }
    throw error;
  }
  if (!bodyText) {
    return jsonResponse({ error: "empty_body" }, 400);
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return jsonResponse({ ok: true, referenceId: "accepted" });
  }

  const input = normalizeContactPayload(payload);
  if (!input.ok) {
    return jsonResponse({ error: input.error }, 400);
  }

  const turnstile = await verifyTurnstile(payload.turnstileToken, env, request);
  if (!turnstile.ok) {
    return jsonResponse({ error: "turnstile_failed" }, 400);
  }

  await ensureContactSchema(env.CONTACT_DB);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.CONTACT_DB.prepare(
    `INSERT INTO contact_messages (
      id, created_at, locale, category, name, email, message, user_agent, cf_ray, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      now,
      input.value.locale,
      input.value.category,
      input.value.name,
      input.value.email,
      input.value.message,
      request.headers.get("user-agent") || "",
      request.headers.get("cf-ray") || "",
      "new"
    )
    .run();

  return jsonResponse({ ok: true, referenceId: id });
}

async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_JSON_BYTES) {
      throw new Error("payload_too_large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function normalizeContactPayload(payload) {
  const locale = payload.locale === "en" ? "en" : "ja";
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!CONTACT_CATEGORIES.has(category)) return { ok: false, error: "invalid_category" };
  if (!isValidEmail(email)) return { ok: false, error: "invalid_email" };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: "name_too_long" };
  if (email.length > MAX_EMAIL_LENGTH) return { ok: false, error: "email_too_long" };
  if (message.length < 10) return { ok: false, error: "message_too_short" };
  if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, error: "message_too_long" };

  return {
    ok: true,
    value: { locale, category, name, email, message },
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function verifyTurnstile(token, env, request) {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false };
  }

  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) form.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  if (!response.ok) return { ok: false };
  const result = await response.json();
  if (!result.success) return { ok: false };
  if (result.action && result.action !== "contact") return { ok: false };
  return { ok: true };
}

function logContactError(event, request, error) {
  const url = new URL(request.url);
  console.error(
    JSON.stringify({
      event,
      path: url.pathname,
      method: request.method,
      cfRay: request.headers.get("cf-ray") || null,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  );
}

async function ensureContactSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        locale TEXT NOT NULL,
        category TEXT NOT NULL,
        name TEXT,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        user_agent TEXT,
        cf_ray TEXT,
        status TEXT NOT NULL DEFAULT 'new'
      )`
    )
    .run();

  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)")
    .run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status)")
    .run();
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...SECURITY_HEADERS,
    },
  });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
