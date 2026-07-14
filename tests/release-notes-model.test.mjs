import assert from "node:assert/strict";
import test from "node:test";

import {
  extractChangeItems,
  findChecksumAsset,
  findInstallerAsset,
} from "../site/releases/release-notes-model.js";

test("extractChangeItems returns user-facing bullet items", () => {
  assert.deepEqual(
    extractChangeItems("## 主な変更\n\n- 黒画面を抑制しました。\n- サムネイルを復旧しました。"),
    ["黒画面を抑制しました。", "サムネイルを復旧しました。"],
  );
});

test("extractChangeItems selects the matching language section", () => {
  const body = [
    "## 主な変更",
    "",
    "- 黒画面を抑制しました。",
    "",
    "## Main changes",
    "",
    "- Reduced black screens.",
  ].join("\n");

  assert.deepEqual(extractChangeItems(body, "ja"), ["黒画面を抑制しました。"]);
  assert.deepEqual(extractChangeItems(body, "en"), ["Reduced black screens."]);
});

test("findInstallerAsset excludes blockmaps and finds the Windows installer", () => {
  const assets = [
    { name: "StreamNexus-Setup.exe.blockmap", downloadUrl: "https://example.com/blockmap" },
    { name: "StreamNexus-Setup.exe", downloadUrl: "https://example.com/installer" },
  ];

  assert.equal(findInstallerAsset(assets)?.downloadUrl, "https://example.com/installer");
});

test("findChecksumAsset finds SHA256SUMS.txt", () => {
  const assets = [
    { name: "beta.yml", downloadUrl: "https://example.com/beta" },
    { name: "SHA256SUMS.txt", downloadUrl: "https://example.com/checksums" },
  ];

  assert.equal(findChecksumAsset(assets)?.downloadUrl, "https://example.com/checksums");
});
