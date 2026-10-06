import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = p => fs.readFileSync(p,"utf8");
const json = p => JSON.parse(read(p));

test("Constitution 1.2 keeps GrowUP child data local-first and provider-optional", () => {
  const adoption=json(".blueprint/constitution-adoption.json");
  const budget=json("docs/DEPENDENCY_BUDGET.json");
  const architecture=read("docs/ARCHITECTURE.md");

  assert.equal(adoption.policyVersion,"1.2.0");
  assert.ok(adoption.inheritedPillars.includes("operational-sovereignty-dependency-minimization"));
  assert.deepEqual(adoption.disabledPillars,[]);
  assert.deepEqual(adoption.constitutionalWaivers,[]);

  assert.equal(budget.constitutionPolicy,"blueprint-os:universal-century-grade@1.2.0");
  assert.equal(budget.defaultPrinciple,"LOCAL_CHILD_STATE_OFFLINE_FIRST_PRIVATE_OPTIONAL_SYNC");

  const byId=new Map(budget.dependencies.map(item=>[item.id,item]));
  assert.equal(byId.get("static-pwa")?.runtimeClass,"LOCAL_CORE");
  assert.equal(byId.get("chatgpt-ai")?.runtimeClass,"OPTIONAL_INTELLIGENCE");
  assert.equal(byId.get("google-drive-backup")?.runtimeClass,"OPTIONAL_SYNC");
  assert.equal(byId.get("google-sheets")?.runtimeClass,"OPTIONAL_SYNC");
  assert.equal(byId.get("google-apps-script")?.runtimeClass,"OPTIONAL_SYNC");
  assert.match(byId.get("google-drive-backup")?.dataBoundary ?? "",/encrypted backup package/i);
  assert.match(byId.get("google-sheets")?.canonicalState ?? "",/forbidden/i);
  assert.match(byId.get("google-apps-script")?.canonicalState ?? "",/forbidden/i);

  for (const required of [
    "raw child profiles in Google Sheets",
    "raw health or nutrition logs in Google Sheets",
    "private free-text notes in Google Sheets",
    "portfolio evidence in Google Sheets",
    "unencrypted child backup artifacts in Drive",
    "child ranking or inferred sensitive labels sent automatically to AI"
  ]) assert.ok(budget.forbiddenRemoteData.includes(required),required);

  assert.match(architecture,/Google Drive may store only encrypted backup packages/);
  assert.match(architecture,/Google Sheets must not receive raw child profiles/);
  assert.match(architecture,/Google Apps Script is optional coordination only/);
  assert.match(architecture,/external AI is optional intelligence/);
});
