import {
  extractChangeItems,
  findChecksumAsset,
  findInstallerAsset,
} from "/releases/release-notes-model.js";

const copy = {
  ja: {
    beta: "ベータ版",
    stable: "正式版",
    download: "インストーラーをダウンロード",
    checksum: "SHA-256を確認",
    details: "GitHubで詳細を見る",
    empty: "公開中のリリースはありません。",
    error: "リリース情報を取得できませんでした。GitHub Releasesをご確認ください。",
    noChanges: "変更内容はGitHub Releasesで確認できます。",
  },
  en: {
    beta: "Beta",
    stable: "Stable",
    download: "Download installer",
    checksum: "Verify SHA-256",
    details: "View on GitHub",
    empty: "No releases are currently available.",
    error: "Release information is currently unavailable. Please check GitHub Releases.",
    noChanges: "See GitHub Releases for the change details.",
  },
};

const createLink = (label, url, primary = false) => {
  const link = document.createElement("a");
  link.className = primary ? "button primary" : "button";
  link.href = url;
  link.textContent = label;
  return link;
};

const renderRelease = (release, locale) => {
  const labels = copy[locale];
  const article = document.createElement("article");
  article.className = "card release-card";

  const heading = document.createElement("div");
  heading.className = "release-card-heading";
  const titleWrap = document.createElement("div");
  const badge = document.createElement("span");
  badge.className = release.prerelease ? "release-label beta" : "release-label";
  badge.textContent = release.prerelease ? labels.beta : labels.stable;
  const title = document.createElement("h2");
  title.textContent = release.name;
  titleWrap.append(badge, title);
  heading.append(titleWrap);

  if (release.publishedAt) {
    const time = document.createElement("time");
    time.className = "meta";
    time.dateTime = release.publishedAt;
    time.textContent = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
      dateStyle: "long",
    }).format(new Date(release.publishedAt));
    heading.append(time);
  }
  article.append(heading);

  const changes = extractChangeItems(release.body, locale);
  if (changes.length > 0) {
    const list = document.createElement("ul");
    list.className = "release-changes";
    for (const change of changes) {
      const item = document.createElement("li");
      item.textContent = change;
      list.append(item);
    }
    article.append(list);
  } else {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = labels.noChanges;
    article.append(message);
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  const installer = findInstallerAsset(release.assets);
  const checksum = findChecksumAsset(release.assets);
  if (installer) actions.append(createLink(labels.download, installer.downloadUrl, true));
  if (checksum) actions.append(createLink(labels.checksum, checksum.downloadUrl));
  actions.append(createLink(labels.details, release.url));
  article.append(actions);
  return article;
};

const loadReleases = async () => {
  const container = document.getElementById("release-list");
  const status = document.getElementById("release-status");
  if (!container || !status) return;

  const locale = document.documentElement.lang === "en" ? "en" : "ja";
  try {
    const response = await fetch("/api/releases", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`release_api_${response.status}`);
    const payload = await response.json();
    const releases = Array.isArray(payload?.releases) ? payload.releases : [];
    container.replaceChildren(...releases.map((release) => renderRelease(release, locale)));
    status.textContent = releases.length === 0 ? copy[locale].empty : "";
  } catch (error) {
    console.error("Failed to load release notes", error);
    status.textContent = copy[locale].error;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  void loadReleases();
});
