import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const service = source("control-service/local-control.mjs");
const gateway = source("control/local-device-gateway.js");
const runtimeEntry = source("src/runtime-entry.js");
const html = source("index.html");
const contract = JSON.parse(source("control/application-management.contract.json"));

test("GrowUP local control stays metadata-only", () => {
  assert.match(service, /deviceCode/);
  assert.match(service, /deviceClass/);
  assert.match(service, /accessAllowed/);
  assert.match(service, /editAllowed/);
  assert.match(service, /childRecordsExposed: false/);
  assert.match(service, /healthRecordsExposed: false/);
  for (const forbidden of ["nutritionRecord", "childProfile", "privateNote", "portfolioEvidence", "backupContents"]) {
    assert.doesNotMatch(service, new RegExp(forbidden, "i"));
  }
});

test("GrowUP loopback gateway uses a P-256 fingerprint without adding a second HTML entrypoint", () => {
  assert.match(gateway, /namedCurve: "P-256"/);
  assert.match(gateway, /SHA-256/);
  assert.match(gateway, /LOOPBACK_HOSTS/);
  assert.match(gateway, /127\.0\.0\.1:3007/);
  assert.doesNotMatch(html, /control\/local-device-gateway\.js/);
  assert.match(runtimeEntry, /loopbackHosts/);
  assert.match(runtimeEntry, /localControlRuntimePort = '3006'/);
  assert.match(runtimeEntry, /window\.location\.port === localControlRuntimePort/);
  assert.match(runtimeEntry, /import\('\.\.\/control\/local-device-gateway\.js'\)/);
});

test("new local control files are valid JavaScript", () => {
  for (const path of ["control-service/local-control.mjs", "control/local-device-gateway.js"]) {
    execFileSync(process.execPath, ["--check", new URL(`../${path}`, import.meta.url).pathname], { stdio: "pipe" });
  }
});

test("production contract remains pending until a real deployed backend exists", () => {
  assert.equal(contract.readiness.deviceRegistry, "missing");
  assert.equal(contract.readiness.deviceGateway, "missing");
  assert.equal(contract.readiness.adminApi, "missing");
  assert.equal(contract.policy.applicationManagementMayInventOperationsWithoutBackend, false);
  assert.equal(contract.boundary.childRecordsInControlPlane, false);
  assert.equal(contract.boundary.healthRecordsInControlPlane, false);
});


test("GrowUP local control publishes Universal automation without changing Production privacy readiness", () => {
  assert.match(server, /schema: "application-management\.contract\/v1"/);
  assert.match(server, /\/api\/application-management\/contract/);
  assert.match(server, /deviceAutoApproval: true/);
  assert.match(server, /deviceAutoBlockPending: true/);
  assert.match(server, /automationIdempotentCommands: true/);
  assert.match(server, /automationOptimisticConcurrency: true/);
  assert.match(server, /\/api\/control\/automation/);
  assert.match(server, /AUTOMATION_STATE_CONFLICT/);
  assert.match(server, /COMMAND_ID_PAYLOAD_MISMATCH/);
  assert.match(server, /AUTOMATION_READBACK_MISMATCH/);
  assert.match(server, /device_auto_approved/);
  assert.match(server, /pending_device_auto_blocked/);
});
