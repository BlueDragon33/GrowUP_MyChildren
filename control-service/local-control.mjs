import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const stateDir = resolve(repoRoot, ".growup-local");
const stateFile = resolve(stateDir, "device-registry.json");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 3007);
const secret = String(process.env.GROWUP_CONTROL_SERVICE_SECRET || "");
const allowedOrigins = new Set([
  "http://127.0.0.1:3006",
  "http://localhost:3006",
]);

if (secret.length < 24) {
  console.error("[GROWUP-CONTROL] GROWUP_CONTROL_SERVICE_SECRET phải có ít nhất 24 ký tự.");
  process.exit(1);
}

function freshState() {
  return {
    schemaVersion: 1,
    registryInstanceId: `growup-local-${randomUUID()}`,
    devices: [],
    commands: {},
    audit: [],
  };
}

function loadState() {
  if (!existsSync(stateFile)) return freshState();
  try {
    const parsed = JSON.parse(readFileSync(stateFile, "utf8"));
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.devices)) return freshState();
    parsed.commands ||= {};
    parsed.audit ||= [];
    parsed.registryInstanceId ||= `growup-local-${randomUUID()}`;
    return parsed;
  } catch {
    return freshState();
  }
}

let state = loadState();

function saveState() {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function json(response, status, data, extraHeaders = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  });
  response.end(JSON.stringify(data));
}

function corsHeaders(request) {
  const origin = String(request.headers.origin || "");
  return allowedOrigins.has(origin)
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" }
    : {};
}

function adminAuthorized(request) {
  return request.headers.authorization === `Bearer ${secret}`;
}

async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function safeText(value, max = 80) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validDeviceId(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validDeviceClass(value) {
  return value === "desktop" || value === "tablet" || value === "phone";
}

function deviceCode(deviceId) {
  return `GU-${deviceId.slice(0, 12).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addAudit(action, target, detail = {}) {
  state.audit.unshift({
    id: randomUUID(),
    action,
    target,
    createdAt: nowIso(),
    detail,
  });
  state.audit = state.audit.slice(0, 200);
}

function publicDevice(device) {
  const lastSeen = Date.parse(device.lastSeenAt || "");
  return {
    deviceId: device.deviceId,
    deviceCode: device.deviceCode,
    deviceClass: device.deviceClass,
    label: device.label,
    status: device.status,
    accessAllowed: device.accessAllowed,
    editAllowed: device.editAllowed,
    active: Number.isFinite(lastSeen) && Date.now() - lastSeen <= 5 * 60_000,
    createdAt: device.createdAt,
    lastSeenAt: device.lastSeenAt,
    appVersion: device.appVersion || null,
  };
}

function registerDevice(payload) {
  const deviceId = safeText(payload.deviceId, 64).toLowerCase();
  const fingerprint = safeText(payload.publicKeyFingerprint, 64).toLowerCase();
  const deviceClass = safeText(payload.deviceClass, 16);
  if (!validDeviceId(deviceId) || fingerprint !== deviceId || !validDeviceClass(deviceClass)) {
    return { error: "INVALID_DEVICE_REGISTRATION" };
  }
  const timestamp = nowIso();
  let device = state.devices.find((item) => item.deviceId === deviceId);
  if (!device) {
    device = {
      deviceId,
      deviceCode: deviceCode(deviceId),
      deviceClass,
      label: safeText(payload.label, 80) || `GrowUP ${deviceClass}`,
      status: "pending",
      accessAllowed: false,
      editAllowed: false,
      createdAt: timestamp,
      lastSeenAt: timestamp,
      appVersion: safeText(payload.appVersion, 32) || "local",
    };
    state.devices.push(device);
    addAudit("device_registered", device.deviceCode, { deviceClass });
  } else {
    device.deviceClass = deviceClass;
    device.label = safeText(payload.label, 80) || device.label;
    device.lastSeenAt = timestamp;
    device.appVersion = safeText(payload.appVersion, 32) || device.appVersion;
  }
  saveState();
  return publicDevice(device);
}

function validCommandId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function commandResult(payload) {
  const commandId = safeText(payload.commandId, 36).toLowerCase();
  if (!validCommandId(commandId)) return { status: 400, payload: { error: "INVALID_COMMAND_ID" } };
  if (state.commands[commandId]) return { status: 200, payload: { ...state.commands[commandId], replayed: true } };

  const deviceId = safeText(payload.deviceId, 64).toLowerCase();
  const operation = safeText(payload.operation, 16);
  const expectedStatus = safeText(payload.expectedStatus, 16);
  const device = state.devices.find((item) => item.deviceId === deviceId);
  if (!device) return { status: 404, payload: { error: "DEVICE_NOT_FOUND" } };
  if (expectedStatus && expectedStatus !== device.status) {
    return { status: 409, payload: { error: "DEVICE_STATE_CONFLICT", currentStatus: device.status } };
  }
  if (operation !== "approve" && operation !== "block") return { status: 400, payload: { error: "INVALID_OPERATION" } };

  if (operation === "approve") {
    if (device.status !== "pending") return { status: 409, payload: { error: "DEVICE_STATE_CONFLICT", currentStatus: device.status } };
    device.status = "approved";
    device.accessAllowed = true;
    device.editAllowed = false;
  } else {
    if (device.status !== "pending" && device.status !== "approved") return { status: 409, payload: { error: "DEVICE_STATE_CONFLICT", currentStatus: device.status } };
    device.status = "blocked";
    device.accessAllowed = false;
    device.editAllowed = false;
  }

  const result = {
    ok: true,
    commandId,
    deviceId,
    deviceCode: device.deviceCode,
    status: device.status,
    replayed: false,
  };
  state.commands[commandId] = result;
  if (Object.keys(state.commands).length > 500) {
    const keep = Object.entries(state.commands).slice(-300);
    state.commands = Object.fromEntries(keep);
  }
  addAudit(operation === "approve" ? "device_approved" : "device_blocked", device.deviceCode);
  saveState();
  return { status: 200, payload: result };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const cors = corsHeaders(request);

  if (request.method === "OPTIONS") {
    response.writeHead(204, cors);
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { ok: true, service: "growup-local-control", registryInstanceId: state.registryInstanceId });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device/register") {
    const origin = String(request.headers.origin || "");
    if (!allowedOrigins.has(origin)) {
      json(response, 403, { error: "ORIGIN_NOT_ALLOWED" }, cors);
      return;
    }
    try {
      const result = registerDevice(await body(request));
      if (result.error) json(response, 400, result, cors);
      else json(response, 200, { ok: true, device: result }, cors);
    } catch (error) {
      json(response, 400, { error: error instanceof Error ? error.message : "INVALID_PAYLOAD" }, cors);
    }
    return;
  }

  if (!adminAuthorized(request)) {
    json(response, 401, { error: "UNAUTHORIZED" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/control/status") {
    json(response, 200, {
      ok: true,
      applicationId: "growup-mychildren",
      registryInstanceId: state.registryInstanceId,
      endpoints: {
        devices: "/api/control/devices",
        deviceCommands: "/api/control/device-commands",
        audit: "/api/control/audit",
      },
      capabilities: {
        deviceRegistry: true,
        deviceApproval: true,
        deviceIdempotentCommands: true,
        optimisticConcurrency: true,
        privacySafeAudit: true,
        childRecordsExposed: false,
        healthRecordsExposed: false,
      },
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/control/devices") {
    json(response, 200, { registryInstanceId: state.registryInstanceId, devices: state.devices.map(publicDevice) });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/control/audit") {
    json(response, 200, { registryInstanceId: state.registryInstanceId, audit: state.audit });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/control/device-commands") {
    try {
      const result = commandResult(await body(request));
      json(response, result.status, result.payload);
    } catch (error) {
      json(response, 400, { error: error instanceof Error ? error.message : "INVALID_PAYLOAD" });
    }
    return;
  }

  json(response, 404, { error: "NOT_FOUND" });
});

server.listen(port, host, () => {
  const fingerprint = createHash("sha256").update(secret).digest("hex").slice(0, 12);
  console.log(`[GROWUP-CONTROL] local service · http://${host}:${port} · registry=${state.registryInstanceId} · secret#${fingerprint}`);
});
