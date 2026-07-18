(function () {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  const submitButton = form?.querySelector("button[type='submit']");
  const turnstileContainer = document.getElementById("turnstile-container");
  const attachmentInput = document.getElementById("contact-attachments");
  const attachmentHelp = document.getElementById("attachment-help");
  const locale = form?.dataset.locale === "en" ? "en" : "ja";

  const text = {
    ja: {
      unavailable: "問い合わせフォームは現在準備中です。support@stream-nexus.com へメールで連絡してください。",
      ready: "入力後、送信できます。",
      sending: "送信しています。",
      successPrefix: "問い合わせを受け付けました。参照ID: ",
      successSuffix: " この参照IDを控えてください。返信が必要な場合は support@stream-nexus.com から連絡します。",
      failure: "送信できませんでした。時間を置いて再試行するか、support@stream-nexus.com へ連絡してください。",
      turnstile: "Turnstile の確認が完了していません。",
      attachmentsUnavailable: "添付ファイルは現在利用できません。本文のみ送信できます。",
      tooManyAttachments: "添付ファイルは3件までです。",
      attachmentTooLarge: "1ファイルの上限は5MBです。",
      attachmentsTooLarge: "添付ファイルの合計上限は10MBです。",
      unsupportedAttachment: "利用できる添付形式は PNG、JPEG、WebP、TXT、LOG、JSON です。",
      storageFull: "添付ファイルの保存容量が上限に達しています。添付を外して送信してください。",
    },
    en: {
      unavailable: "The contact form is not ready yet. Email support@stream-nexus.com instead.",
      ready: "Fill in the form to submit.",
      sending: "Submitting.",
      successPrefix: "Your message was received. Reference ID: ",
      successSuffix: " Please keep this reference ID. If a reply is needed, StreamNexus support will contact you from support@stream-nexus.com.",
      failure: "The message could not be submitted. Try again later or email support@stream-nexus.com.",
      turnstile: "Turnstile verification is not complete.",
      attachmentsUnavailable: "Attachments are currently unavailable. You can still submit the message without files.",
      tooManyAttachments: "You can attach up to three files.",
      attachmentTooLarge: "Each file must be 5 MB or smaller.",
      attachmentsTooLarge: "The combined attachment limit is 10 MB.",
      unsupportedAttachment: "Allowed attachment types are PNG, JPEG, WebP, TXT, LOG, and JSON.",
      storageFull: "Attachment storage is full. Remove the attachments and submit the message again.",
    },
  }[locale];

  let turnstileToken = "";
  let attachmentConfig = null;

  if (!form || !status || !submitButton || !turnstileContainer) return;

  init();

  async function init() {
    try {
      const response = await fetch("/api/contact/config", { headers: { accept: "application/json" } });
      const config = await response.json();
      if (!config.enabled || !config.siteKey) {
        disableForm(text.unavailable);
        return;
      }

      attachmentConfig = config.attachments ?? null;
      if (attachmentInput && !attachmentConfig?.enabled) {
        attachmentInput.disabled = true;
        if (attachmentHelp) attachmentHelp.textContent = text.attachmentsUnavailable;
      }

      await waitForTurnstile();
      window.turnstile.render(turnstileContainer, {
        sitekey: config.siteKey,
        action: "contact",
        callback(token) {
          turnstileToken = token;
          submitButton.disabled = false;
          status.textContent = text.ready;
        },
        "expired-callback"() {
          turnstileToken = "";
          submitButton.disabled = true;
          status.textContent = text.turnstile;
        },
        "error-callback"() {
          turnstileToken = "";
          submitButton.disabled = true;
          status.textContent = text.turnstile;
        },
      });
    } catch {
      disableForm(text.unavailable);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!turnstileToken) {
      status.textContent = text.turnstile;
      return;
    }

    submitButton.disabled = true;
    status.textContent = text.sending;

    const data = new FormData(form);
    const attachmentError = validateSelectedAttachments();
    if (attachmentError) {
      status.textContent = attachmentError;
      submitButton.disabled = false;
      return;
    }
    data.append("locale", locale);
    data.append("turnstileToken", turnstileToken);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { accept: "application/json" },
        body: data,
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "submit_failed");

      form.reset();
      status.textContent = text.successPrefix + result.referenceId + text.successSuffix;
      turnstileToken = "";
      if (window.turnstile) window.turnstile.reset(turnstileContainer);
    } catch (error) {
      status.textContent = errorMessage(error);
    } finally {
      submitButton.disabled = !turnstileToken;
    }
  });

  function disableForm(message) {
    submitButton.disabled = true;
    status.textContent = message;
  }

  function validateSelectedAttachments() {
    if (!attachmentInput || attachmentInput.disabled) return "";
    const files = Array.from(attachmentInput.files ?? []);
    const maxFiles = attachmentConfig?.maxFiles ?? 3;
    const maxFileBytes = attachmentConfig?.maxFileBytes ?? 5 * 1024 * 1024;
    const maxTotalBytes = attachmentConfig?.maxTotalBytes ?? 10 * 1024 * 1024;
    const allowedExtensions = attachmentConfig?.allowedExtensions ?? [
      ".png", ".jpg", ".jpeg", ".webp", ".txt", ".log", ".json",
    ];
    if (files.length > maxFiles) return text.tooManyAttachments;
    if (files.some((file) => file.size > maxFileBytes)) return text.attachmentTooLarge;
    if (files.reduce((total, file) => total + file.size, 0) > maxTotalBytes) return text.attachmentsTooLarge;
    if (files.some((file) => !allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension)))) {
      return text.unsupportedAttachment;
    }
    return "";
  }

  function errorMessage(error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "too_many_attachments") return text.tooManyAttachments;
    if (code === "attachment_too_large") return text.attachmentTooLarge;
    if (code === "attachments_too_large" || code === "payload_too_large") return text.attachmentsTooLarge;
    if (code === "unsupported_attachment_type" || code === "invalid_attachment_content") {
      return text.unsupportedAttachment;
    }
    if (code === "attachment_storage_full") return text.storageFull;
    if (code === "contact_attachments_not_configured") return text.attachmentsUnavailable;
    return text.failure;
  }

  function waitForTurnstile() {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - started > 10000) {
          clearInterval(timer);
          reject(new Error("turnstile_timeout"));
        }
      }, 100);
    });
  }
})();
