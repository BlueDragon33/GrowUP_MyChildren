import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("local control deletes registrations, persists absence, and protects approved devices", async () => {
  const root = await mkdtemp(join(tmpdir(), "growup-delete-test-"));
  await mkdir(join(root, "control-service"));
  await copyFile(new URL("../control-service/local-control.mjs", import.meta.url), join(root, "control-service/local-control.mjs"));
  const secret = "test-only-deletion-secret-123456789";
  const { createServer } = await import("node:net");
  const socket = createServer(); await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const server = spawn(process.execPath, [join(root, "control-service/local-control.mjs")], { env: { ...process.env, PORT: String(port), GROWUP_CONTROL_SERVICE_SECRET: secret }, stdio: ["ignore", "pipe", "pipe"] });
  try {
    await Promise.race([once(server.stdout, "data"), once(server, "exit").then(() => { throw new Error("server exited"); })]);
    const base = `http://127.0.0.1:${port}`;
    const call = (path, body, authorized = true) => fetch(`${base}${path}`, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", origin: "http://127.0.0.1:3006", ...(authorized ? { authorization: `Bearer ${secret}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const registry = await (await call("/api/control/status")).json();
    const id = "a".repeat(64), approved = "b".repeat(64);
    for (const deviceId of [id, approved]) assert.equal((await call("/api/device/register", { deviceId, publicKeyFingerprint: deviceId, deviceClass: "desktop" })).status, 200);
    const payload = { deviceId: id, confirmDeviceCode: `GU-${id.slice(0, 12).toUpperCase()}`, expectedStatus: "pending", registryInstanceId: registry.registryInstanceId };
    assert.equal((await call("/api/control/device-deletions", payload, false)).status, 401);
    assert.equal((await call("/api/control/device-deletions", { ...payload, registryInstanceId: "stale" })).status, 409);
    assert.equal((await call("/api/control/device-deletions", payload)).status, 200);
    const list = await (await call("/api/control/devices")).json();
    assert.deepEqual(list.devices.map(d => d.deviceId), [approved]);
    assert.equal((await call("/api/control/device-commands", { commandId: "12345678-1234-1234-1234-123456789012", deviceId: approved, expectedStatus: "pending", operation: "approve" })).status, 200);
    assert.equal((await call("/api/control/device-deletions", { ...payload, deviceId: approved, confirmDeviceCode: `GU-${approved.slice(0, 12).toUpperCase()}` })).status, 409);
    const { readFile } = await import("node:fs/promises");
    const stored = JSON.parse(await readFile(join(root, ".growup-local/device-registry.json"), "utf8"));
    assert.deepEqual(stored.devices.map(d => d.deviceId), [approved]);
    assert.equal(stored.devices[0].status, "approved");
    assert.ok(stored.audit.some(event => event.action === "pending_device_deleted"));
  } finally {
    server.kill(); await once(server, "exit"); await rm(root, { recursive: true, force: true });
  }
});
