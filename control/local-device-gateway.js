const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const CONTROL_ORIGIN = "http://127.0.0.1:3007";
const STORAGE_KEY = "growup:local-control:p256-jwk";

function deviceClass() {
  const width = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function stableKey() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed?.publicJwk?.kty === "EC" && parsed?.publicJwk?.crv === "P-256") return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const value = { publicJwk, privateJwk };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}

async function fingerprint(publicJwk) {
  const canonical = JSON.stringify({ crv: publicJwk.crv, kty: publicJwk.kty, x: publicJwk.x, y: publicJwk.y });
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))));
}

function safeLabel() {
  const platform = navigator.userAgentData?.platform || navigator.platform || "Thiết bị";
  return `GrowUP ${deviceClass()} · ${String(platform).slice(0, 36)}`;
}

async function register() {
  if (!LOOPBACK_HOSTS.has(window.location.hostname)) return;
  const { publicJwk } = await stableKey();
  const deviceId = await fingerprint(publicJwk);
  const response = await fetch(`${CONTROL_ORIGIN}/api/device/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deviceId,
      publicKeyFingerprint: deviceId,
      publicKeyHint: base64Url(new TextEncoder().encode(`${publicJwk.x}.${publicJwk.y}`)).slice(0, 24),
      deviceClass: deviceClass(),
      label: safeLabel(),
      appVersion: "local",
    }),
  });
  if (!response.ok) throw new Error(`GrowUP local device registration failed: ${response.status}`);
  const payload = await response.json();
  if (payload?.device?.deviceCode) localStorage.setItem("growup:local-control:device-code", payload.device.deviceCode);
}

register().catch((error) => console.warn("[GrowUP local control]", error));
window.setInterval(() => register().catch(() => {}), 60_000);
