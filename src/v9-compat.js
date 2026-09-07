import { APP_VERSION } from './core/release.js';

function syncReleaseLabel(){
  const button=document.querySelector('#v8MarkSeen');
  if(button?.disabled) button.textContent=`Đã xem v${APP_VERSION}`;
}

const app=document.querySelector('#app');
if(app){
  new MutationObserver(()=>queueMicrotask(syncReleaseLabel)).observe(app,{childList:true,subtree:true});
  syncReleaseLabel();
}
