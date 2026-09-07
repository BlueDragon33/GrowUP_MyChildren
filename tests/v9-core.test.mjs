import test from 'node:test';
import assert from 'node:assert/strict';
import { bindDevelopmentDomain, domainBindingOf } from '../src/core/domain-binding.js';
import { familyPlanItemsToIcs } from '../src/core/calendar.js';
import { buildSafeSearchIndex, searchSafeDevelopment } from '../src/core/local-search.js';
import { evaluateReleaseCandidate } from '../src/core/rc-gate.js';

function sampleState(){
  return {
    version:5,
    children:[{
      id:'c1',name:'Child One',dateOfBirth:'2018-01-01',
      learningGoals:[{id:'g1',title:'Read 20 minutes',subject:'Language',dueDate:'2026-10-01'}],
      skills:[{id:'s1',name:'Logic',level:6,date:'2026-09-01'}],
      portfolio:[{id:'p1',title:'Robot project',type:'Project',date:'2026-09-02',note:'portfolio note omitted from index'}],
      roadmap:[{id:'r1',goal:'Academic English',area:'Language',age:18}],
      healthRecords:[{id:'h1',date:'2026-09-01',height:123.4,weight:24.5,note:'health note omitted'}],
      nutritionLogs:[{id:'n1',date:'2026-09-01',note:'nutrition note omitted'}]
    }],
    settings:{familyPlanItems:[
      {id:'fp1',childId:'c1',date:'2026-09-10',title:'Swimming',minutes:75,note:'plan note omitted'},
      {id:'fp2',childId:'c1',date:'2026-09-11',title:'Family reading',minutes:30}
    ]}
  };
}

test('domain binding stores versioned snapshot without historical rewrite',()=>{
  const record=bindDevelopmentDomain({id:'g',title:'Read'},'language',{taxonomyVersion:'2026.1',labels:{language:'Language original'}});
  assert.equal(record.developmentDomainId,'language');
  assert.equal(record.developmentDomainLabelSnapshot,'Language original');
  const binding=domainBindingOf(record,{taxonomyVersion:'2026.1',labels:{language:'Language current'}});
  assert.equal(binding.label,'Language original');
  assert.equal(binding.currentLabel,'Language current');
  assert.equal(binding.taxonomyChanged,true);
  assert.equal(domainBindingOf({id:'old',subject:'Language'},{}).legacy,true);
});

test('family-plan ICS exports only selected metadata',()=>{
  const state=sampleState();
  const ics=familyPlanItemsToIcs(state.settings.familyPlanItems,{itemIds:['fp1']});
  assert.match(ics,/SUMMARY:Swimming/);
  assert.match(ics,/DTSTART;VALUE=DATE:20260910/);
  assert.match(ics,/X-GROWUP-PLANNED-MINUTES:75/);
  assert.doesNotMatch(ics,/Family reading/);
  assert.doesNotMatch(ics,/Child One/);
  assert.doesNotMatch(ics,/plan note omitted/);
});

test('safe search omits health nutrition and portfolio notes',()=>{
  const state=sampleState();
  const serialized=JSON.stringify(buildSafeSearchIndex(state));
  for(const value of ['123.4','24.5','health note omitted','nutrition note omitted','portfolio note omitted from index']) assert.equal(serialized.includes(value),false);
  const result=searchSafeDevelopment(state,'robot');
  assert.equal(result.length,1);
  assert.equal(result[0].dataset,'portfolio');
  assert.equal('score' in result[0],false);
  assert.equal(searchSafeDevelopment(state,'health note omitted').length,0);
});

test('RC consistency profile passes only matching configuration',()=>{
  const pass=evaluateReleaseCandidate({appVersion:'0.9.0',dataSchemaVersion:5,serviceWorkerCache:'growup-mychildren-v9',nodeMajor:22,playwrightVersion:'1.55.0',axePlaywrightVersion:'4.10.2',rollbackCommit:'241653d6fb12f021ebd20704144e47a5a12cc8fd'});
  assert.equal(pass.ready,true);
  const fail=evaluateReleaseCandidate({appVersion:'0.9.0',dataSchemaVersion:5,serviceWorkerCache:'wrong',nodeMajor:20,playwrightVersion:'1.55.0',axePlaywrightVersion:'4.10.2',rollbackCommit:'wrong'});
  assert.equal(fail.ready,false);
  assert.ok(fail.failed.includes('nodeMajor'));
  assert.ok(fail.failed.includes('serviceWorkerCache'));
});
