(function () {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  const submitButton = form?.querySelector("button[type='submit']");
  const turnstileContainer = document.getElementById("turnstile-container");
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
    },
    en: {
      unavailable: "The contact form is not ready yet. Email support@stream-nexus.com instead.",
      ready: "Fill in the form to submit.",
      sending: "Submitting.",
      successPrefix: "Your message was received. Reference ID: ",
      successSuffix: " Please keep this reference ID. If a reply is needed, StreamNexus support will contact you from support@stream-nexus.com.",
      failure: "The message could not be submitted. Try again later or email support@stream-nexus.com.",
      turnstile: "Turnstile verification is not complete.",
    },
  }[locale];

  let turnstileToken = "";

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
    const payload = {
      locale,
      category: String(data.get("category") || ""),
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      message: String(data.get("message") || ""),
      website: String(data.get("website") || ""),
      turnstileToken,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("submit_failed");

      form.reset();
      status.textContent = text.successPrefix + result.referenceId + text.successSuffix;
      turnstileToken = "";
      if (window.turnstile) window.turnstile.reset(turnstileContainer);
    } catch {
      status.textContent = text.failure;
    } finally {
      submitButton.disabled = !turnstileToken;
    }
  });

  function disableForm(message) {
    submitButton.disabled = true;
    status.textContent = message;
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
