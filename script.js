import { isEndpoint, validate, submitRequest } from './form.mjs?v=20260920-23';
document.documentElement.classList.add('js');
const strings = JSON.parse(document.querySelector('#page-strings').textContent);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
// Keep the opening film behind the header; use a solid header after scrolling.
const header = $('.site-header');
if (header && document.body.classList.contains('header-overlay')) {
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 16);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('pageshow', syncHeader);
}
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
// A URL fragment can be stale after manual scrolling. Translate the section
// currently being read instead, keeping the opening explicitly at the top.
const languageSections = $$('main > section[id]');
function currentLanguageSection() {
  const headerBottom = header?.getBoundingClientRect().bottom || 0;
  const readingLine = headerBottom + Math.max(0, innerHeight - headerBottom) / 3;
  let current = languageSections[0];
  for (const section of languageSections) {
    if (section.getBoundingClientRect().top > readingLine) break;
    current = section;
  }
  return current ? '#' + current.id : '';
}
$$('[data-language]').forEach(link => {
  const keepSection = () => { link.hash = currentLanguageSection(); };
  link.addEventListener('click', keepSection);
  link.addEventListener('auxclick', keepSection);
});
const menu = $('.menu-toggle'), nav = $('#site-nav'), mq = matchMedia('(max-width:980px)');
function closeMenu(focus = false) {
  menu.setAttribute('aria-expanded','false'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open');
  $$('main, footer').forEach(el => el.inert = false); nav.inert = mq.matches;
  menu.setAttribute('aria-label', strings.menu); if (focus) menu.focus();
}
closeMenu();
menu.addEventListener('click', () => {
  if (menu.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
  menu.setAttribute('aria-expanded','true'); menu.setAttribute('aria-label',strings.close);
  nav.classList.add('is-open'); nav.inert=false; document.body.classList.add('menu-open');
  $$('main, footer').forEach(el=>el.inert=true);
});
mq.addEventListener('change',()=>closeMenu());
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') { if(menu.getAttribute('aria-expanded')==='true')closeMenu(true); const languages=$('.languages'); if(languages.open){languages.open=false;languages.querySelector('summary').focus();} }
  if(menu.getAttribute('aria-expanded')!=='true'||e.key!=='Tab')return;
  const items=[menu,...nav.querySelectorAll('a')]; const i=items.indexOf(document.activeElement);
  e.preventDefault(); const next=i<0?0:(i+(e.shiftKey?-1:1)+items.length)%items.length; items[next].focus();
});
// Ambient films retain a still when motion is reduced or autoplay is unavailable.
$$('[data-ambient-video]').forEach(video=>{
  const media=video.parentElement, reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let visible=false,loaded=false,starting=false;
  const auto=()=>!reduce.matches&&!navigator.connection?.saveData&&!document.hidden;
  const play=async()=>{
    if(starting||!auto()||!visible)return;
    starting=true;
    if(!loaded){video.src=matchMedia('(max-width:980px)').matches?video.dataset.mobile:video.dataset.desktop;loaded=true;video.load();}
    try{await video.play();if(!auto()||!visible)video.pause();}catch{media.classList.remove('is-playing');}
    finally{starting=false;}
  };
  video.addEventListener('playing',()=>media.classList.add('is-playing'));
  video.addEventListener('error',()=>{media.classList.remove('is-playing');});
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible)play();else video.pause();
  },{threshold:.05});observer.observe(media);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else play();});
  reduce.addEventListener('change',()=>{if(reduce.matches){video.pause();media.classList.remove('is-playing');}else play();});
});
$$('.film video').forEach(video=>{
  video.addEventListener('play',()=>$$('.film video').filter(v=>v!==video).forEach(v=>v.pause()));
  video.addEventListener('error',()=>video.closest('.film').querySelector('.video-status').textContent=strings.videoerror);
});
const dialog=$('#lightbox');
$$('[data-lightbox]').forEach(link=>link.addEventListener('click',event=>{
  if(!dialog.showModal)return;event.preventDefault();const im=link.querySelector('img');dialog.querySelector('img').src=link.href;dialog.querySelector('img').alt=im.alt;dialog.querySelector('p').textContent=im.alt;dialog.setAttribute('aria-label',im.alt);dialog.showModal();
}));
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
const form=$('#contact-form');
if(form){
  const button=form.querySelector('[type=submit]'),status=$('#form-status'),endpoint=window.FC_CONFIG?.formspreeEndpoint||'';let pending=false;
  const active=isEndpoint(endpoint);button.disabled=false;button.querySelector('[data-submit-label]').textContent=active?strings.send:strings.check;$('#demo-notice').hidden=active;
  $$('[data-service]').forEach(link=>link.addEventListener('click',()=>{form.elements.service.value=link.dataset.service;form.elements.service.dispatchEvent(new Event('change'));}));
  const fields=['name','company','email','service','message'];
  function clearError(field){field.removeAttribute('aria-invalid');$('#'+field.name+'-error').textContent='';}
  fields.forEach(name=>['input','change'].forEach(type=>form.elements[name].addEventListener(type,()=>clearError(form.elements[name]))));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;
    const values=Object.fromEntries(new FormData(form));const errors=validate(values);fields.forEach(name=>clearError(form.elements[name]));
    for(const[name,key]of Object.entries(errors)){form.elements[name].setAttribute('aria-invalid','true');$('#'+name+'-error').textContent=strings.form[key];}
    if(Object.keys(errors).length){status.textContent=strings.form.invalid;status.dataset.kind='invalid';form.elements[Object.keys(errors)[0]].focus();return;}
    if(values._gotcha){status.textContent=strings.form.failed;status.dataset.kind='failed';return;}
    if(!active){status.textContent=strings.form.demo;status.dataset.kind='demo';return;}
    const data=new FormData(form);data.set('service',form.elements.service.selectedOptions[0].textContent);data.set('_language',document.documentElement.lang);data.set('_subject','FC Montagens — '+form.elements.service.selectedOptions[0].textContent);
    pending=true;button.disabled=true;status.textContent=strings.form.sending;status.dataset.kind='sending';
    const kind=await submitRequest(endpoint,data);status.textContent=strings.form[kind];status.dataset.kind=kind;pending=false;button.disabled=false;
  });
}
