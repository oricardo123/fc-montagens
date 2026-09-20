// Centered gallery: one foreground player; decorative motion follows it.
const section = document.querySelector('#trabalho-em-detalhe');
const config = JSON.parse(section.querySelector('#gallery-config').textContent);
const labels = config.labels;
const rail = section.querySelector('.gallery-rail');
const viewport = section.querySelector('.gallery-viewport');
const previousButton = section.querySelector('[data-action=previous]');
const nextButton = section.querySelector('[data-action=next]');
const playButton = section.querySelector('[data-action=play]');
const soundButton = section.querySelector('[data-action=sound]');
const fullscreenButton = section.querySelector('[data-action=fullscreen]');
const retry = section.querySelector('[data-action=retry]');
const status = section.querySelector('.gallery-status');
const direct = section.querySelector('.gallery-direct');
const position = section.querySelector('.gallery-position');
const captionTitle = section.querySelector('#gallery-active-title');
const captionDescription = section.querySelector('#gallery-description');
const background = section.querySelector('[data-factory-video]');
const backdrop = section.querySelector('.gallery-backdrop');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const mobile = matchMedia('(max-width:760px)');
const states = config.films.map((film,index) => {
  const card = section.querySelector(`[data-film="${film.id}"]`);
  return {film,index,card,video:card.querySelector('video'),screen:card.querySelector('.gallery-screen'),
    button:card.querySelector('[data-select]'),loaded:false,starting:false,playing:false,request:0,
    manuallyPaused:false,manualSession:false,autoplayBlocked:false,ignoredPauseEvents:0,
    playIntent:null,nativeFallback:false,
    error:false,visible:false};
});
let selected = 0, visible = false, transitioning = false, muted = true;
let transitionTimer = 0, transitionSerial = 0, fullscreenWasActive = false, swallowClickUntil = 0;
let touchStart = null;
let wheelDelta = 0, wheelLastAt = 0, wheelConsumed = false;
const bg = {near:false,loaded:false,starting:false,playing:false,blocked:false,error:false,request:0};
const current = () => states[selected];
const normalize = index => ((index % states.length) + states.length) % states.length;
const reduce = () => reducedMotion.matches;
const saveData = () => Boolean(navigator.connection?.saveData);
const inFullscreen = () => document.fullscreenElement === rail || Boolean(current().video.webkitDisplayingFullscreen);
const canResume = state => state.film.ready && state.index===selected && visible && !transitioning && !document.hidden
  && !state.manuallyPaused && !state.autoplayBlocked && (state.manualSession || (!reduce() && !saveData()));
const ringPosition = index => index===selected ? 'center' : index===normalize(selected-1) ? 'left' : 'right';

function layout() {
  const width = viewport.clientWidth;
  if (!width) return;
  const full = inFullscreen();
  const ratio = current().film.width/current().film.height;
  const availableHeight = full ? innerHeight-104 : mobile.matches ? Math.max(160,innerHeight*.53) : Math.min(500,innerHeight*.60);
  const availableWidth = width * (full ? .98 : mobile.matches ? .82 : .69);
  const height = Math.min(availableHeight,availableWidth/ratio);
  section.style.setProperty('--stage-height',`${Math.round(height+16)}px`);
  section.dataset.reduced = String(reduce());
  states.forEach(state => {
    const role = ringPosition(state.index);
    const x = role==='center' ? 0 : width*(mobile.matches ? .40 : .33)*(role==='left' ? -1 : 1);
    state.card.style.setProperty('--card-width',`${height*state.film.width/state.film.height}px`);
    state.card.style.setProperty('--card-x',`${x}px`);
    state.card.dataset.ring = role;
  });
}
function controlLabel(button,text,title) {
  button.setAttribute('aria-label',`${text}: ${title}`);
  button.setAttribute('title',text);
  button.querySelector('.gallery-control-label').textContent=text;
}
function sync() {
  const state=current(),video=state.video;
  states.forEach(item => {
    const active=item.index===selected;
    item.card.dataset.selected=String(active);
    item.button.setAttribute('aria-pressed',String(active));
    item.button.setAttribute('aria-label',`${active ? labels.play : labels.choose}: ${item.film.title}`);
    item.button.hidden=active&&(item.starting||item.card.dataset.frame==='true');
    if(item.button.hidden&&document.activeElement===item.button)playButton.focus({preventScroll:true});
    // Selection remains possible even while a media set is awaiting integration.
    item.button.disabled=active&&!item.film.ready;
    if(!active){item.video.tabIndex=-1;item.video.setAttribute('aria-hidden','true');}
  });
  previousButton.disabled=nextButton.disabled=false;
  playButton.disabled=fullscreenButton.disabled=!state.film.ready;
  soundButton.hidden=!state.film.hasAudio;soundButton.disabled=!state.film.ready;
  controlLabel(playButton,video.paused ? labels.playAll : labels.pauseAll,state.film.title);
  playButton.querySelector('[data-icon=play]').toggleAttribute('hidden',!video.paused);
  playButton.querySelector('[data-icon=pause]').toggleAttribute('hidden',video.paused);
  controlLabel(soundButton,muted ? labels.soundOn : labels.soundOff,state.film.title);
  soundButton.setAttribute('aria-pressed',String(!muted));
  soundButton.querySelector('[data-icon=mute]').toggleAttribute('hidden',!muted);
  soundButton.querySelector('[data-icon=sound]').toggleAttribute('hidden',muted);
  const full=inFullscreen();
  controlLabel(fullscreenButton,full ? labels.exitFullscreen : labels.fullscreen,state.film.title);
  fullscreenButton.querySelector('[data-icon=fullscreen]').toggleAttribute('hidden',full);
  fullscreenButton.querySelector('[data-icon=exitFullscreen]').toggleAttribute('hidden',!full);
  const positionText=labels.position.replace('{current}',selected+1).replace('{total}',states.length);
  if(position.textContent!==positionText)position.textContent=positionText;
  position.setAttribute('aria-label',`${positionText}: ${state.film.title}`);
  if(captionTitle.textContent!==state.film.title)captionTitle.textContent=state.film.title;
  if(captionDescription.textContent!==state.film.description)captionDescription.textContent=state.film.description;
  direct.hidden=!state.film.ready;direct.href=state.film.desktopUrl;
  direct.setAttribute('aria-label',`${labels.direct}: ${state.film.title}`);
  retry.hidden=!state.error;
  if(state.error)status.textContent=labels.error;
  rail.dataset.selected=state.film.id;rail.dataset.transitioning=String(transitioning);
  layout();syncBackground();
}

function backgroundCanRun() {
  const state=current();
  return config.background.ready&&bg.near&&visible&&!document.hidden&&!transitioning&&!reduce()&&!saveData()
    &&!inFullscreen()&&!state.video.paused&&state.playing&&!state.manuallyPaused&&!state.error&&!bg.blocked&&!bg.error;
}
function pauseBackground() {
  ++bg.request;bg.starting=false;bg.playing=false;
  if(!background.paused)background.pause();
  backdrop.dataset.playing='false';
}
function loadBackground() {
  if(bg.loaded||!config.background.ready||!bg.near||reduce()||saveData())return;
  background.src=matchMedia('(max-width:980px)').matches ? config.background.mobileUrl : config.background.desktopUrl;
  background.poster=config.background.posterUrl;
  bg.loaded=true;background.load();
}
async function syncBackground() {
  if(!backgroundCanRun()){pauseBackground();return;}
  if(bg.starting||(!background.paused&&bg.playing))return;
  loadBackground();const attempt=++bg.request;bg.starting=true;
  try{
    await background.play();
    if(attempt===bg.request&&!backgroundCanRun())pauseBackground();
  }catch(error){
    if(attempt!==bg.request||error.name==='AbortError')return;
    bg.blocked=error.name==='NotAllowedError';bg.error=!bg.blocked;pauseBackground();
  }finally{if(attempt===bg.request)bg.starting=false;}
}
background.muted=true;background.loop=true;background.controls=false;
background.addEventListener('playing',()=>{
  if(!backgroundCanRun()){pauseBackground();return;}
  bg.playing=true;backdrop.dataset.playing='true';
});
background.addEventListener('pause',()=>{bg.playing=false;backdrop.dataset.playing='false';});
background.addEventListener('error',()=>{if(background.error){bg.error=true;pauseBackground();}});
background.addEventListener('waiting',()=>{bg.playing=false;backdrop.dataset.playing='false';});

function pauseForEnvironment(state) {
  ++state.request;state.starting=false;state.playing=false;state.playIntent=null;
  if(!state.video.paused){++state.ignoredPauseEvents;state.video.pause();}
  if(state.index===selected)pauseBackground();
}
function showError(state) {
  pauseForEnvironment(state);state.autoplayBlocked=true;state.error=true;
  state.card.dataset.frame='false';if(state.index===selected)sync();
}
function loadSource(state,force=false) {
  if(state.loaded&&!force)return;
  const url=matchMedia('(max-width:980px)').matches ? state.film.mobileUrl : state.film.desktopUrl;
  state.video.poster=state.film.posterUrl;state.video.src=url;state.loaded=true;state.video.load();
}
async function play(state=current(),manual=false,reload=false) {
  if(manual){state.manualSession=true;state.manuallyPaused=false;state.autoplayBlocked=false;}
  if(!canResume(state)||state.starting){sync();return;}
  states.filter(other=>other!==state).forEach(pauseForEnvironment);
  const attempt=++state.request;
  state.starting=true;state.playIntent=manual?'manual':'auto';state.error=false;
  status.textContent='';retry.hidden=true;
  state.video.muted=state.film.hasAudio?muted:true;
  loadSource(state,reload);state.video.removeAttribute('aria-hidden');state.video.tabIndex=0;sync();
  try{
    await state.video.play();
    if(attempt===state.request&&!canResume(state))pauseForEnvironment(state);
  }catch(error){
    if(attempt!==state.request||error.name==='AbortError')return;
    if(error.name==='NotAllowedError'){state.autoplayBlocked=true;state.card.dataset.frame='false';pauseBackground();}
    else showError(state);
  }finally{if(attempt===state.request){state.starting=false;state.playIntent=null;sync();}}
}
function manualPause() {
  current().manuallyPaused=true;pauseForEnvironment(current());sync();
}
function togglePlay() {
  const state=current();
  if(!state.video.paused||state.starting)manualPause();
  else play(state,true,Boolean(state.video.error));
}
function select(index,manualPlay=false) {
  index=normalize(index);
  if(index===selected){if(manualPlay)play(current(),true,Boolean(current().video.error));return;}
  const serial=++transitionSerial;clearTimeout(transitionTimer);
  pauseForEnvironment(current());current().card.dataset.frame='false';
  selected=index;visible=current().visible||inFullscreen();status.textContent='';
  transitioning=!reduce()&&!inFullscreen();sync();
  const finish=()=>{
    if(serial!==transitionSerial)return;
    transitioning=false;visible=current().visible||inFullscreen();sync();
    play(current(),manualPlay,Boolean(current().video.error));
  };
  if(transitioning)transitionTimer=setTimeout(finish,320);else finish();
}
function fullscreenFallback() {
  const state=current();state.nativeFallback=true;state.video.controls=true;
  if(state.loaded&&!state.video.error)state.card.dataset.frame='true';
  if(typeof state.video.webkitEnterFullscreen==='function'){
    try{state.video.webkitEnterFullscreen();return;}catch{/* Keep native controls and direct link. */}
  }
  status.textContent=labels.fullscreenUnavailable;state.video.focus({preventScroll:true});
}
async function toggleFullscreen() {
  const state=current();
  if(document.fullscreenElement===rail){try{await document.exitFullscreen();}catch{fullscreenFallback();}return;}
  if(state.video.webkitDisplayingFullscreen&&typeof state.video.webkitExitFullscreen==='function'){state.video.webkitExitFullscreen();return;}
  if(!state.loaded)play(state,true);
  if(typeof rail.requestFullscreen!=='function'){fullscreenFallback();return;}
  try{await rail.requestFullscreen();}catch{fullscreenFallback();}
}

previousButton.addEventListener('click',()=>select(selected-1));
nextButton.addEventListener('click',()=>select(selected+1));
playButton.addEventListener('click',togglePlay);
soundButton.addEventListener('click',()=>{
  muted=!muted;current().video.muted=muted;
  if(!muted&&!current().video.paused)current().manualSession=true;sync();
});
fullscreenButton.addEventListener('click',toggleFullscreen);
retry.addEventListener('click',()=>{pauseForEnvironment(current());play(current(),true,true);playButton.focus({preventScroll:true});});
viewport.addEventListener('keydown',event=>{
  if(event.target instanceof HTMLVideoElement||event.altKey||event.ctrlKey||event.metaKey)return;
  const next=event.key==='ArrowRight'?selected+1:event.key==='ArrowLeft'?selected-1:event.key==='Home'?0:event.key==='End'?states.length-1:null;
  if(next===null)return;event.preventDefault();select(next);
});
viewport.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||event.button!==0||inFullscreen())return;
  touchStart={id:event.pointerId,x:event.clientX,y:event.clientY};
});
viewport.addEventListener('pointerup',event=>{
  if(!touchStart||touchStart.id!==event.pointerId)return;
  const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;
  if(Math.abs(dx)<42||Math.abs(dx)<Math.abs(dy)*1.3)return;
  swallowClickUntil=performance.now()+400;select(selected+(dx<0?1:-1));
});
viewport.addEventListener('pointercancel',()=>{touchStart=null;});
viewport.addEventListener('click',event=>{if(performance.now()<swallowClickUntil){event.preventDefault();event.stopPropagation();}},true);
viewport.addEventListener('wheel',event=>{
  // Deliberate horizontal trackpad gestures rotate once; vertical page scroll
  // and zoom gestures retain their native behavior, including while animating.
  if(event.ctrlKey||inFullscreen()||Math.abs(event.deltaX)<3||Math.abs(event.deltaX)<=Math.abs(event.deltaY)*1.3)return;
  const now=performance.now();
  if(now-wheelLastAt>180){wheelDelta=0;wheelConsumed=false;}
  wheelLastAt=now;event.preventDefault();
  if(transitioning){wheelConsumed=true;return;}
  if(wheelConsumed)return;
  const unit=event.deltaMode===1?16:event.deltaMode===2?viewport.clientWidth:1;
  wheelDelta+=event.deltaX*unit;
  if(Math.abs(wheelDelta)<64)return;
  wheelConsumed=true;select(selected+(wheelDelta>0?1:-1));
},{passive:false});
states.forEach(state=>{
  const video=state.video;
  state.button.addEventListener('click',()=>{
    const wasActive=state.index===selected;select(state.index,wasActive);
    if(wasActive)playButton.focus({preventScroll:true});
  });
  video.muted=true;video.loop=true;video.controls=false;
  video.addEventListener('play',()=>{
    if(video.paused||state.index!==selected||!visible||transitioning||document.hidden){if(!video.paused)pauseForEnvironment(state);sync();return;}
    if(state.playIntent!=='auto'){state.manualSession=true;state.manuallyPaused=false;}
    states.filter(other=>other!==state).forEach(pauseForEnvironment);sync();
  });
  video.addEventListener('playing',()=>{
    if(state.index!==selected||!visible||transitioning||document.hidden){pauseForEnvironment(state);return;}
    state.playing=true;state.card.dataset.frame='true';state.autoplayBlocked=false;state.error=false;status.textContent='';sync();
  });
  video.addEventListener('pause',()=>{
    state.playing=false;
    if(state.ignoredPauseEvents)--state.ignoredPauseEvents;
    else if(state.index===selected&&visible&&!transitioning&&!document.hidden&&!state.starting&&!video.ended&&!video.error&&!state.autoplayBlocked)state.manuallyPaused=true;
    sync();
  });
  video.addEventListener('waiting',()=>{state.playing=false;if(state.index===selected)pauseBackground();});
  video.addEventListener('ended',()=>{state.playing=false;state.manuallyPaused=true;sync();});
  video.addEventListener('error',()=>{if(video.error)showError(state);});
  video.addEventListener('volumechange',()=>{if(state.index===selected&&state.film.hasAudio)muted=video.muted;sync();});
  video.addEventListener('keydown',event=>{if(event.key===' '&&!video.controls){event.preventDefault();togglePlay();}});
  video.addEventListener('webkitbeginfullscreen',()=>{pauseBackground();sync();});
  video.addEventListener('webkitendfullscreen',()=>{video.controls=state.nativeFallback;sync();});
});
document.addEventListener('fullscreenchange',()=>{
  const full=inFullscreen();
  if(full){visible=true;transitioning=false;++transitionSerial;clearTimeout(transitionTimer);pauseBackground();}
  else if(fullscreenWasActive)visible=current().visible;
  fullscreenWasActive=full;layout();sync();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){states.forEach(pauseForEnvironment);pauseBackground();sync();}else play();});
const preferenceChange=()=>{
  const state=current();
  if((reduce()||saveData())&&!state.manualSession){pauseForEnvironment(state);state.card.dataset.frame='false';sync();}
  else play();
  if(reduce()||saveData())pauseBackground();else{loadBackground();syncBackground();}
  layout();
};
reducedMotion.addEventListener('change',preferenceChange);
navigator.connection?.addEventListener?.('change',preferenceChange);
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{const state=states.find(item=>item.screen===entry.target);state.visible=entry.isIntersecting&&entry.intersectionRatio>=.25;});
  visible=inFullscreen()||current().visible;
  if(visible)play();else{states.forEach(pauseForEnvironment);pauseBackground();sync();}
},{threshold:[0,.25]});
states.forEach(state=>observer.observe(state.screen));
const nearObserver=new IntersectionObserver(entries=>{
  bg.near=entries[0].isIntersecting;if(bg.near){loadBackground();syncBackground();}else pauseBackground();
},{rootMargin:'300px 0px'});
nearObserver.observe(section);
const resizeObserver=new ResizeObserver(layout);resizeObserver.observe(viewport);
mobile.addEventListener('change',layout);window.addEventListener('resize',layout,{passive:true});
section.classList.add('is-enhanced');
previousButton.hidden=nextButton.hidden=section.querySelector('.gallery-toolbar').hidden=section.querySelector('.gallery-caption').hidden=false;
sync();
