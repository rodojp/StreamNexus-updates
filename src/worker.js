const CONTACT_CATEGORIES = new Set(["general", "bug", "privacy", "deletion", "other"]);
const MAX_JSON_BYTES = 24 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_CONTACT_RETENTION_DAYS = 180;
const MAX_CONTACT_RETENTION_DAYS = 3650;
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_TOTAL_ATTACHMENT_BYTES + 128 * 1024;
const DEFAULT_ATTACHMENT_RETENTION_DAYS = 90;
const MAX_ATTACHMENT_RETENTION_DAYS = 90;
const MAX_ATTACHMENT_STORAGE_BYTES = 8 * 1024 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".txt", ".log", ".json"];
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
const createContentSecurityPolicy = (nonce) => [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com${nonce ? ` 'nonce-${nonce}'` : ""}`,
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
  ].join("; ");
const SECURITY_HEADERS = {
  "content-security-policy": createContentSecurityPolicy(),
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
        attachments: {
          enabled: Boolean(env.CONTACT_ATTACHMENTS),
          maxFiles: MAX_ATTACHMENTS,
          maxFileBytes: MAX_ATTACHMENT_BYTES,
          maxTotalBytes: MAX_TOTAL_ATTACHMENT_BYTES,
          retentionDays: parseAttachmentRetentionDays(env.CONTACT_ATTACHMENT_RETENTION_DAYS),
          allowedExtensions: ALLOWED_ATTACHMENT_EXTENSIONS,
        },
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
    if (env.CONTACT_DB) {
      await ensureContactSchema(env.CONTACT_DB);
    }
    await deleteExpiredContactAttachments(env);
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
       AND NOT EXISTS (
         SELECT 1 FROM contact_attachments
         WHERE contact_attachments.contact_id = contact_messages.id
       )
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

async function deleteExpiredContactAttachments(env) {
  if (!env.CONTACT_DB || !env.CONTACT_ATTACHMENTS) {
    console.warn(JSON.stringify({
      event: "contact_attachment_retention_skipped",
      reason: !env.CONTACT_DB ? "database_not_configured" : "r2_not_configured",
    }));
    return;
  }

  const expiredResult = await env.CONTACT_DB.prepare(
    `SELECT id, object_key, size_bytes
     FROM contact_attachments
     WHERE datetime(expires_at) <= datetime('now')
     ORDER BY expires_at ASC
     LIMIT 500`
  ).all();
  const expired = Array.isArray(expiredResult?.results) ? expiredResult.results : [];
  if (expired.length === 0) {
    console.log(JSON.stringify({ event: "contact_attachment_retention_completed", deleted: 0, releasedBytes: 0 }));
    return;
  }

  const objectKeys = expired
    .map((item) => String(item?.object_key ?? ""))
    .filter(Boolean);
  if (objectKeys.length !== expired.length) {
    throw new Error("invalid_attachment_retention_metadata");
  }

  await env.CONTACT_ATTACHMENTS.delete(objectKeys);

  const attachmentIds = expired.map((item) => String(item.id));
  const releasedBytes = expired.reduce((total, item) => {
    const size = Number(item?.size_bytes);
    return total + (Number.isSafeInteger(size) && size > 0 ? size : 0);
  }, 0);
  const placeholders = attachmentIds.map(() => "?").join(", ");
  const deleteResults = await env.CONTACT_DB.batch([
    env.CONTACT_DB.prepare(
      `UPDATE contact_attachment_storage
       SET used_bytes = MAX(
         0,
         used_bytes - COALESCE(
           (SELECT SUM(size_bytes) FROM contact_attachments WHERE id IN (${placeholders})),
           0
         )
       )
       WHERE id = 1`
    ).bind(...attachmentIds),
    env.CONTACT_DB.prepare(
      `DELETE FROM contact_attachments WHERE id IN (${placeholders})`
    ).bind(...attachmentIds),
  ]);
  assertD1BatchSucceeded(deleteResults, "contact_attachment_retention_database_failed");

  console.log(JSON.stringify({
    event: "contact_attachment_retention_completed",
    deleted: expired.length,
    releasedBytes,
  }));
}

function parseRetentionDays(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_CONTACT_RETENTION_DAYS) {
    return DEFAULT_CONTACT_RETENTION_DAYS;
  }
  return parsed;
}

function parseAttachmentRetentionDays(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_ATTACHMENT_RETENTION_DAYS;
  }
  return Math.min(parsed, MAX_ATTACHMENT_RETENTION_DAYS);
}

function parseAttachmentStorageLimit(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? ""), 10);
  if (!Number.isSafeInteger(parsed) || parsed < MAX_TOTAL_ATTACHMENT_BYTES) {
    return MAX_ATTACHMENT_STORAGE_BYTES;
  }
  return Math.min(parsed, MAX_ATTACHMENT_STORAGE_BYTES);
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
  let payload;
  let rawAttachments = [];
  try {
    if (contentType.toLowerCase().includes("application/json")) {
      const bodyText = await readLimitedTextBody(request, MAX_JSON_BYTES);
      if (!bodyText) {
        return jsonResponse({ error: "empty_body" }, 400);
      }
      try {
        payload = JSON.parse(bodyText);
      } catch {
        return jsonResponse({ error: "invalid_json" }, 400);
      }
    } else if (contentType.toLowerCase().includes("multipart/form-data")) {
      const body = await readLimitedBodyBytes(request, MAX_MULTIPART_BYTES);
      const parsedRequest = new Request(request.url, {
        method: "POST",
        headers: { "content-type": contentType },
        body,
      });
      const form = await parsedRequest.formData();
      payload = Object.fromEntries(
        ["locale", "category", "name", "email", "message", "website", "turnstileToken"]
          .map((name) => [name, String(form.get(name) ?? "")])
      );
      rawAttachments = form
        .getAll("attachments")
        .filter((value) => isUploadedFile(value) && (value.size > 0 || value.name.length > 0));
    } else {
      return jsonResponse({ error: "unsupported_content_type" }, 415);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "payload_too_large") {
      return jsonResponse({ error: "payload_too_large" }, 413);
    }
    if (error instanceof TypeError) {
      return jsonResponse({ error: "invalid_multipart_body" }, 400);
    }
    throw error;
  }

  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return jsonResponse({ ok: true, referenceId: "accepted" });
  }

  const input = normalizeContactPayload(payload);
  if (!input.ok) {
    return jsonResponse({ error: input.error }, 400);
  }

  if (rawAttachments.length > 0 && !env.CONTACT_ATTACHMENTS) {
    return jsonResponse({ error: "contact_attachments_not_configured" }, 503);
  }

  const attachmentInputs = validateContactAttachmentMetadata(rawAttachments);
  if (!attachmentInputs.ok) {
    return jsonResponse({ error: attachmentInputs.error }, attachmentInputs.status);
  }

  const turnstile = await verifyTurnstile(payload.turnstileToken, env, request);
  if (!turnstile.ok) {
    return jsonResponse({ error: "turnstile_failed" }, 400);
  }

  const attachments = await prepareContactAttachments(attachmentInputs.value);
  if (!attachments.ok) {
    return jsonResponse({ error: attachments.error }, attachments.status);
  }

  await ensureContactSchema(env.CONTACT_DB);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const contactStatement = env.CONTACT_DB.prepare(
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
    );

  if (attachments.value.length === 0) {
    await contactStatement.run();
    return jsonResponse({ ok: true, referenceId: id, attachmentCount: 0 });
  }

  const totalBytes = attachments.value.reduce((sum, attachment) => sum + attachment.size, 0);
  const storageLimit = parseAttachmentStorageLimit(env.CONTACT_ATTACHMENT_STORAGE_LIMIT_BYTES);
  const reserved = await reserveAttachmentStorage(env.CONTACT_DB, totalBytes, storageLimit);
  if (!reserved) {
    return jsonResponse({ error: "attachment_storage_full" }, 507);
  }

  const uploadedKeys = [];
  try {
    const retentionDays = parseAttachmentRetentionDays(env.CONTACT_ATTACHMENT_RETENTION_DAYS);
    const expiresAt = new Date(Date.parse(now) + retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const attachmentStatements = [];

    for (const attachment of attachments.value) {
      const attachmentId = crypto.randomUUID();
      const objectKey = `contacts/${id}/${attachmentId}${attachment.extension}`;
      uploadedKeys.push(objectKey);
      const storedObject = await env.CONTACT_ATTACHMENTS.put(objectKey, attachment.bytes, {
        httpMetadata: {
          contentType: attachment.contentType,
          contentDisposition: `attachment; filename="${attachmentId}${attachment.extension}"`,
        },
        customMetadata: {
          contactId: id,
          attachmentId,
          sha256: attachment.sha256,
        },
      });
      if (!storedObject) {
        throw new Error("contact_attachment_r2_put_failed");
      }
      attachmentStatements.push(
        env.CONTACT_DB.prepare(
          `INSERT INTO contact_attachments (
            id, contact_id, created_at, expires_at, object_key, original_name,
            content_type, size_bytes, sha256
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          attachmentId,
          id,
          now,
          expiresAt,
          objectKey,
          attachment.originalName,
          attachment.contentType,
          attachment.size,
          attachment.sha256
        )
      );
    }

    const insertResults = await env.CONTACT_DB.batch([contactStatement, ...attachmentStatements]);
    assertD1BatchSucceeded(insertResults, "contact_attachment_database_failed");
  } catch (error) {
    await rollbackAttachmentUpload(env, uploadedKeys, totalBytes, request);
    throw error;
  }

  return jsonResponse({ ok: true, referenceId: id, attachmentCount: attachments.value.length });
}

async function readLimitedTextBody(request, maxBytes) {
  const body = await readLimitedBodyBytes(request, maxBytes);
  return new TextDecoder().decode(body);
}

async function readLimitedBodyBytes(request, maxBytes) {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("payload_too_large");
  }

  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
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
  return body;
}

function isUploadedFile(value) {
  return Boolean(
    value
    && typeof value === "object"
    && typeof value.name === "string"
    && Number.isFinite(value.size)
    && typeof value.arrayBuffer === "function"
  );
}

function validateContactAttachmentMetadata(files) {
  if (files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: "too_many_attachments", status: 400 };
  }

  let totalBytes = 0;
  const validated = [];
  for (const file of files) {
    if (file.size <= 0) {
      return { ok: false, error: "empty_attachment", status: 400 };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: "attachment_too_large", status: 413 };
    }
    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return { ok: false, error: "attachments_too_large", status: 413 };
    }

    const originalName = sanitizeAttachmentName(file.name);
    const extension = getAttachmentExtension(originalName);
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      return { ok: false, error: "unsupported_attachment_type", status: 400 };
    }

    validated.push({ file, extension, originalName });
  }

  return { ok: true, value: validated };
}

async function prepareContactAttachments(attachments) {
  const validated = [];
  for (const attachment of attachments) {
    const bytes = new Uint8Array(await attachment.file.arrayBuffer());
    const { extension, originalName } = attachment;
    const contentType = validateAttachmentContent(extension, bytes);
    if (!contentType) {
      return { ok: false, error: "invalid_attachment_content", status: 400 };
    }

    const digest = await crypto.subtle.digest("SHA-256", bytes);
    validated.push({
      bytes,
      contentType,
      extension,
      originalName,
      size: bytes.byteLength,
      sha256: toHex(digest),
    });
  }

  return { ok: true, value: validated };
}

function sanitizeAttachmentName(rawName) {
  const basename = String(rawName).split(/[\\/]/).at(-1) ?? "attachment";
  const sanitized = basename
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["<>:|?*]/g, "_")
    .trim()
    .slice(0, 180);
  return sanitized || "attachment";
}

function getAttachmentExtension(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function validateAttachmentContent(extension, bytes) {
  if (extension === ".png") {
    return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? "image/png" : "";
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return hasBytes(bytes, [0xff, 0xd8, 0xff]) ? "image/jpeg" : "";
  }
  if (extension === ".webp") {
    const isWebp = hasBytes(bytes, [0x52, 0x49, 0x46, 0x46])
      && hasBytes(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50]);
    return isWebp ? "image/webp" : "";
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return "";
  }
  if (text.includes("\u0000")) return "";
  if (extension === ".json") {
    try {
      JSON.parse(text);
    } catch {
      return "";
    }
    return "application/json; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

function hasBytes(bytes, expected) {
  return expected.every((value, index) => bytes[index] === value);
}

function toHex(value) {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reserveAttachmentStorage(db, bytes, storageLimit) {
  const result = await db.prepare(
    `UPDATE contact_attachment_storage
     SET used_bytes = used_bytes + ?
     WHERE id = 1
       AND used_bytes <= ? - ?`
  ).bind(bytes, storageLimit, bytes).run();
  return Number(result?.meta?.changes ?? 0) === 1;
}

async function releaseAttachmentStorage(db, bytes) {
  await db.prepare(
    `UPDATE contact_attachment_storage
     SET used_bytes = MAX(0, used_bytes - ?)
     WHERE id = 1`
  ).bind(bytes).run();
}

async function rollbackAttachmentUpload(env, uploadedKeys, reservedBytes, request) {
  try {
    if (uploadedKeys.length > 0) {
      await env.CONTACT_ATTACHMENTS.delete(uploadedKeys);
    }
  } catch (error) {
    logContactError("contact_attachment_rollback_delete_failed", request, error);
    return;
  }

  try {
    await releaseAttachmentStorage(env.CONTACT_DB, reservedBytes);
  } catch (error) {
    logContactError("contact_attachment_rollback_release_failed", request, error);
  }
}

function assertD1BatchSucceeded(results, errorCode) {
  if (!Array.isArray(results) || results.some((result) => result?.success !== true)) {
    throw new Error(errorCode);
  }
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

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS contact_attachments (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        object_key TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
        sha256 TEXT NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES contact_messages(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_contact_attachments_contact_id ON contact_attachments(contact_id)")
    .run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_contact_attachments_expires_at ON contact_attachments(expires_at)")
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS contact_attachment_storage (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        used_bytes INTEGER NOT NULL DEFAULT 0 CHECK (used_bytes >= 0)
      )`
    )
    .run();
  await db
    .prepare("INSERT OR IGNORE INTO contact_attachment_storage (id, used_bytes) VALUES (1, 0)")
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
  if (headers.get("content-type")?.toLowerCase().includes("text/html")) {
    const nonce = crypto.randomUUID().replaceAll("-", "");
    headers.set("content-security-policy", createContentSecurityPolicy(nonce));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
