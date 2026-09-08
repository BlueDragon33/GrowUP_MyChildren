import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIntegrityWorkloadPresetPackage, applyIntegrityWorkloadPresetImport } from '../src/core/workload-preset-package-integrity.js';
import { buildCompatibilityEvidencePackage, previewCompatibilityEvidenceImport } from '../src/core/compatibility-evidence-package.js';

test('preset conflict resolution persists only id name config',()=>{
  const settings={customWorkloadPresets:[{id:'same',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}}]};
  const pkg=buildIntegrityWorkloadPresetPackage(settings);
  const applied=applyIntegrityWorkloadPresetImport(settings,pkg,{conflictStrategy:'rename'});
  assert.equal(applied.added,1);
  assert.deepEqual(Object.keys(applied.settings.customWorkloadPresets[1]).sort(),['config','id','name']);
});

test('imported compatibility package never restores Axe evidence without local rerun',()=>{
  const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[{module:'legacy.js',flow:'axe',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'},{module:'legacy.js',flow:'overview',observed:true,active:false,at:'2026-09-08T01:01:00.000Z'}]});
  const preview=previewCompatibilityEvidenceImport(pkg,{});
  assert.equal(preview.valid,true);
  assert.equal(preview.axeRecheckRequired,1);
  assert.deepEqual(preview.accepted.map((item)=>item.flow),['overview']);
});
