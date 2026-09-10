/**
 * Decides whether the browser should run heavy visual effects
 * (WebGL, continuous animation loops).
 *
 * Returns false for headless browsers, bots/validators, low-power devices,
 * reduced-motion users, and any environment without a working WebGL context,
 * so those clients get a lightweight static page instead.
 */

const BOT_UA =
  /headless|bot|crawler|spider|lighthouse|validator|http|curl|python|axios|node/i;

let cached: boolean | null = null;

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as unknown) ||
      (canvas.getContext("webgl") as unknown);
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function shouldRunHeavyEffects(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (cached !== null) return cached;

  const nav = navigator as Navigator & {
    webdriver?: boolean;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  let ok = true;

  if (nav.webdriver === true) ok = false;
  else if (BOT_UA.test(nav.userAgent ?? "")) ok = false;
  else if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    ok = false;
  else if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2)
    ok = false;
  else if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) ok = false;
  else if (!webglAvailable()) ok = false;

  cached = ok;
  return ok;
}
