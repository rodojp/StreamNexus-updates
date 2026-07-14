export const extractChangeItems = (body, locale = "ja") => {
  if (typeof body !== "string") return [];
  const lines = body.split(/\r?\n/);
  const targetHeading = locale === "en"
    ? /^#{1,6}\s+main changes\s*$/i
    : /^#{1,6}\s+主な変更\s*$/;
  let foundTargetHeading = false;
  let isTargetSection = false;
  const localizedItems = [];

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      isTargetSection = targetHeading.test(line);
      foundTargetHeading ||= isTargetSection;
      continue;
    }
    if (!isTargetSection) continue;
    const item = line.match(/^\s*-\s+(.+?)\s*$/)?.[1];
    if (item) localizedItems.push(item);
  }

  if (foundTargetHeading) return localizedItems;
  if (locale === "en") return [];
  return lines
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1] ?? "")
    .filter(Boolean);
};

export const findInstallerAsset = (assets) => (
  Array.isArray(assets)
    ? assets.find((asset) => asset?.name?.toLowerCase().endsWith(".exe")) ?? null
    : null
);

export const findChecksumAsset = (assets) => (
  Array.isArray(assets)
    ? assets.find((asset) => asset?.name?.toLowerCase() === "sha256sums.txt") ?? null
    : null
);
