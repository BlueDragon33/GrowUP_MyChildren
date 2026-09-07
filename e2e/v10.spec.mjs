import { test, expect } from '@playwright/test';

async function createChild(page,name='V10 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v10="coverage"]')).toBeVisible();
}

test('coverage and conflict panels summarize data without scores',async({page})=>{
  await createChild(page,'Planning Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const id=state.children[0].id;
    state.children[0].learningGoals=[{id:'g1',title:'Read',subject:'Language',developmentDomainId:'language'},{id:'g2',title:'Math',subject:'Math'}];
    state.settings={...(state.settings||{}),familyPlanItems:[{id:'a',childId:id,date:'2026-09-10',title:'Activity A',minutes:120},{id:'b',childId:id,date:'2026-09-10',title:'Activity B',minutes:90}]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-v10="coverage"]')).toContainText('1/2');
  await expect(page.locator('[data-v10="conflicts"]')).toContainText('210 phút');
  const rankingFields=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    return state.children[0].learningGoals.flatMap(goal=>['score','rank','rating','percentile'].filter(key=>Object.prototype.hasOwnProperty.call(goal,key)));
  });
  expect(rankingFields).toEqual([]);
});

test('advanced safe search opens source page and highlights matching record',async({page})=>{
  await createChild(page,'Search Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.children[0].portfolio=[{id:'p-v10',title:'Deep link project',type:'Project',date:'2026-09-10',developmentDomainId:'digital-ai',note:'not indexed'}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const form=page.locator('#v9SearchForm');
  await expect(form.locator('select[name="domainId"]')).toBeVisible();
  await form.locator('input[name="query"]').fill('Deep link');
  await form.locator('select[name="domainId"]').selectOption('digital-ai');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#v9SearchResults [data-v10-search-link]')).toBeVisible();
  await page.locator('#v9SearchResults [data-v10-search-link]').click();
  await expect(page.locator('.topbar h1')).toHaveText('Portfolio');
  await expect(page.locator('.v10-search-target')).toContainText('Deep link project');
});

test('recovery history panel renders sanitized stored metadata',async({page})=>{
  await createChild(page,'Recovery History Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings={...(state.settings||{}),recoveryDrillHistory:[{at:'2026-09-07T01:00:00.000Z',status:'PASS',format:'growup-encrypted-backup-v1',schemaVersion:5}]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const panel=page.locator('[data-v10="recovery-history"]');
  await expect(panel).toContainText('PASS');
  await expect(panel).toContainText('schema 5');
  const historyKeys=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    return Object.keys(state.settings.recoveryDrillHistory[0]).sort();
  });
  expect(historyKeys).toEqual(['at','format','schemaVersion','status']);
});

test('consolidated entrypoint remains usable at 390px without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await createChild(page,'Mobile V10');
  await expect(page.locator('[data-v10="runtime"]')).toBeVisible();
  await expect(page.locator('#mobileNav')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
