import { describe, expect, it } from "vitest";
import { isInstagramBrowser } from "@/app/ui/inAppBrowser";

const IOS_INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.29.110";
const ANDROID_INSTAGRAM =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 Instagram 300.0.0.0.0";
const IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("isInstagramBrowser", () => {
  it("gerçek Instagram iOS User-Agent'ını tanır", () => {
    expect(isInstagramBrowser(IOS_INSTAGRAM)).toBe(true);
  });

  it("gerçek Instagram Android User-Agent'ını tanır", () => {
    expect(isInstagramBrowser(ANDROID_INSTAGRAM)).toBe(true);
  });

  it("normal Safari/Chrome için yanlış pozitif vermez", () => {
    expect(isInstagramBrowser(IOS_SAFARI)).toBe(false);
    expect(isInstagramBrowser(ANDROID_CHROME)).toBe(false);
  });

  it("null/undefined için false döner, patlamaz", () => {
    expect(isInstagramBrowser(null)).toBe(false);
    expect(isInstagramBrowser(undefined)).toBe(false);
  });
});
