import test from 'node:test';
import assert from 'node:assert/strict';
import { developmentDomainCoverage } from '../src/core/domain-coverage.js';
import { familyPlanConflicts, rescheduleCandidates } from '../src/core/family-conflicts.js';
import { searchSafeDevelopment, searchDeepLink } from '../src/core/local-search.js';
import { appendRecoveryHistory, recoveryHistory } from '../src/core/recovery-history.js';

function state(){return {version:5,children:[{id:'c1',name:'Child One',learningGoals:[{id:'g1',title:'Read',developmentDomainId:'language'},{id:'g2',title:'Math'}],skills:[{id:'s1',name:'Logic',developmentDomainId:'cognition'}],portfolio:[{id:'p1',title:'Robot',type:'Project',date:'2026-09-10',developmentDomainId:'digital-ai',note:'not indexed'}],roadmap:[{id:'r1',goal:'English',area:'Language',age:18}]}],settings:{familyPlanItems:[{id:'a',childId:'c1',date:'2026-09-10',title:'Swim',minutes:120},{id:'b',childId:'c1',date:'2026-09-10',title:'Read',minutes:90},{id:'c',childId:'c1',date:'2026-09-11',title:'Music',minutes:30}]}};}

test('coverage counts binding only and does not expose ranking fields',()=>{
  const result=developmentDomainCoverage(state());
  assert.equal(result.total,4);
  assert.equal(result.bound,3);
  assert.equal(result.unbound,1);
  assert.equal('score' in result,false);
  assert.equal('rank' in result,false);
});

test('family conflict assistant detects loaded day and suggests nearby lighter days',()=>{
  const items=state().settings.familyPlanItems;
  const conflicts=familyPlanConflicts(items,{maxMinutesPerDay:180});
  assert.equal(conflicts.length,1);
  assert.equal(conflicts[0].date,'2026-09-10');
  assert.equal(conflicts[0].totalMinutes,210);
  const candidates=rescheduleCandidates(items,'2026-09-10',{spanDays:2,maxMinutesPerDay:180});
  assert.ok(candidates.length>0);
  assert.ok(candidates[0].remainingMinutes>=candidates.at(-1).remainingMinutes);
});

test('safe search supports advanced filters and a page deep link without notes',()=>{
  const result=searchSafeDevelopment(state(),'robot',{datasets:['portfolio'],fromDate:'2026-09-01',toDate:'2026-09-30',domainId:'digital-ai'});
  assert.equal(result.length,1);
  assert.equal(result[0].pageKey,'portfolio');
  assert.equal(JSON.stringify(result).includes('not indexed'),false);
  assert.deepEqual(searchDeepLink(result[0]),{pageKey:'portfolio',childId:'c1',sourceId:'p1',dataset:'portfolio'});
});

test('recovery history stores metadata only and applies retention limit',()=>{
  let settings={};
  settings=appendRecoveryHistory(settings,{success:true,format:'fmt',schemaVersion:5},{limit:2,now:new Date('2026-09-07T01:00:00Z')});
  settings=appendRecoveryHistory(settings,{success:false,format:'fmt',schemaVersion:5},{limit:2,now:new Date('2026-09-07T02:00:00Z')});
  settings=appendRecoveryHistory(settings,{success:true,format:'fmt2',schemaVersion:5},{limit:2,now:new Date('2026-09-07T03:00:00Z')});
  const history=recoveryHistory(settings);
  assert.equal(history.length,2);
  assert.equal(history[0].status,'PASS');
  const serialized=JSON.stringify(history);
  for(const forbidden of ['passphrase','ciphertext','payload','salt','iv']) assert.equal(serialized.includes(forbidden),false);
});
