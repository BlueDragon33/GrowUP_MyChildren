import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = JSON.parse(fs.readFileSync(new URL("../control/application-management.contract.json", import.meta.url), "utf8"));

test("GrowUP contract self-classifies without exposing child or health data", () => {
  assert.equal(contract.schema, "application-management.contract/v1");
  assert.equal(contract.application.id, "growup-mychildren");
  assert.equal(contract.application.category, "Gia đình");
  assert.equal(contract.application.repository, "BlueDragon33/GrowUP_MyChildren");
  assert.equal(contract.policy.remoteAdminReady, false);
  assert.equal(contract.boundary.childRecordsInControlPlane, false);
  assert.equal(contract.boundary.healthRecordsInControlPlane, false);
  assert.equal(contract.capabilities.deviceRegistry, false);
  assert.equal(contract.capabilities.webLaunch, true);
});


test("Production static contract does not overclaim local-only automation", () => {
  assert.equal(contract.capabilities.deviceAutoApproval, false);
  assert.equal(contract.capabilities.deviceAutoBlockPending, false);
  assert.equal(contract.capabilities.automationIdempotentCommands, false);
  assert.equal(contract.capabilities.automationOptimisticConcurrency, false);
  assert.equal(contract.readiness.automationPolicy, "local-control-only");
  assert.equal(contract.policy.remoteAdminReady, false);
});
