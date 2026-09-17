import { isEndpoint, validate, submitRequest } from './form.mjs';
document.documentElement.classList.add('js');
const strings = JSON.parse(document.querySelector('#page-strings').textContent);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
$$('[data-language]').forEach(link => link.addEventListener('click', () => { link.hash = location.hash; }));
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
const hero=$('#hero-video');
if(hero){
  const button=$('.hero-toggle'), media=$('.hero-media'), reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let pausedByUser=false,visible=true,loaded=false;
  const load=()=>{if(!loaded){hero.src=matchMedia('(max-width:980px)').matches?hero.dataset.mobile:hero.dataset.desktop;loaded=true;hero.load();}};
  const label=()=>{const text=hero.paused?strings.play:strings.pause;button.textContent=hero.paused?'▶':'Ⅱ';button.setAttribute('aria-label',text);button.title=text;};
  const play=async()=>{load();try{await hero.play();}catch{media.classList.remove('is-playing');}label();};
  button.hidden=false;label();
  hero.addEventListener('playing',()=>{media.classList.add('is-playing');label();});hero.addEventListener('pause',label);
  hero.addEventListener('error',()=>{media.classList.remove('is-playing');loaded=false;label();});
  button.addEventListener('click',()=>{if(hero.paused){pausedByUser=false;play();}else{pausedByUser=true;hero.pause();}});
  const auto=()=>!reduce.matches&&!navigator.connection?.saveData&&!pausedByUser;
  if(auto())play();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)hero.pause();else if(auto()&&!document.hidden)play();},{threshold:.05});observer.observe(media);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hero.pause();else if(visible&&auto())play();});
  reduce.addEventListener('change',()=>{if(reduce.matches){hero.pause();media.classList.remove('is-playing');}else if(auto()&&visible)play();});
}
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
  const active=isEndpoint(endpoint);button.disabled=false;button.textContent=active?strings.send:strings.check;$('#demo-notice').hidden=active;
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
