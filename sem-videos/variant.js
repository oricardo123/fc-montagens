document.documentElement.classList.add('js');
const strings = JSON.parse(document.querySelector('#page-strings').textContent);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
// Keep the header clear at the opening and solid while scrolling.
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
const dialog=$('#lightbox');
$$('[data-lightbox]').forEach(link=>link.addEventListener('click',event=>{
  if(!dialog.showModal)return;event.preventDefault();const im=link.querySelector('img');dialog.querySelector('img').src=link.href;dialog.querySelector('img').alt=im.alt;dialog.querySelector('p').textContent=im.alt;dialog.setAttribute('aria-label',im.alt);dialog.showModal();
}));
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});

// Independent decorative animation: silent, lazy-loaded, with a still fallback.
const factory = $('[data-factory-animation]');
if (factory) {
  const frame = factory.parentElement;
  const toggle = $('.factory-toggle');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const connection = navigator.connection;
  let visible = false, loaded = false, starting = false;
  let manuallyPaused = false, blocked = false, failed = false;
  const stillPreferred = () => reduced.matches || connection?.saveData;
  const canRun = () => visible && !document.hidden && !stillPreferred() && !manuallyPaused && !failed;
  const updateControl = () => {
    toggle.hidden = Boolean(stillPreferred() || failed);
    toggle.textContent = manuallyPaused || blocked ? toggle.dataset.play : toggle.dataset.pause;
  };
  const syncFactory = async () => {
    updateControl();
    if (!canRun()) {
      factory.pause();
      if (stillPreferred() || failed) frame.classList.remove('is-playing');
      return;
    }
    if (starting || !factory.paused || blocked) return;
    starting = true;
    if (!loaded) {
      factory.src = matchMedia('(max-width:980px)').matches ? factory.dataset.mobile : factory.dataset.desktop;
      loaded = true;
      factory.load();
    }
    try {
      await factory.play();
      if (!canRun()) factory.pause();
    } catch {
      // A blocked autoplay request leaves the original photograph visible.
      if (canRun()) blocked = true;
    } finally {
      starting = false;
      updateControl();
    }
  };
  factory.muted = true;
  factory.addEventListener('playing', () => {
    if (!canRun()) { factory.pause(); return; }
    frame.classList.add('is-playing');
  });
  factory.addEventListener('error', () => { failed = true; syncFactory(); });
  toggle.addEventListener('click', () => {
    manuallyPaused = blocked ? false : !manuallyPaused;
    blocked = false;
    syncFactory();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncFactory();
  }, { threshold: 0.05 }).observe(frame);
  document.addEventListener('visibilitychange', syncFactory);
  reduced.addEventListener('change', syncFactory);
  connection?.addEventListener('change', syncFactory);
  updateControl();
}
