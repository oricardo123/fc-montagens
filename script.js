(() => {
  document.documentElement.classList.add('js');
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const progress = document.querySelector('.progress-bar span');
  const backToTop = document.querySelector('[data-back-to-top]');
  const year = document.querySelector('[data-year]');
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  if (year) year.textContent = new Date().getFullYear();

  const film = document.querySelector('#company-film');
  const filmAction = document.querySelector('[data-film-action]');
  const filmStatus = document.querySelector('[data-film-status]');
  filmAction.hidden = false;
  const updateFilmAction = () => {
    filmAction.textContent = film.ended ? 'Ver vídeo novamente ▶' : film.paused ? 'Ver vídeo ▶' : 'Pausar vídeo Ⅱ';
  };
  ['play', 'pause', 'ended'].forEach(event => film.addEventListener(event, updateFilmAction));
  filmAction.addEventListener('click', async () => {
    filmStatus.textContent = '';
    if (!film.paused) { film.pause(); return; }
    if (film.ended) film.currentTime = 0;
    try {
      await film.play();
      film.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    } catch {
      filmStatus.textContent = 'Não foi possível iniciar o vídeo. Tente novamente nos controlos do leitor.';
    }
  });

  const mobileMenu = window.matchMedia('(max-width: 880px)');
  const pageContent = [document.querySelector('main'), document.querySelector('footer')];
  const syncMenuAccess = () => {
    const open = mobileMenu.matches && nav?.classList.contains('is-open');
    if (nav) nav.inert = mobileMenu.matches && !open;
    pageContent.forEach(element => { if (element) element.inert = Boolean(open); });
  };
  const closeMenu = (returnFocus = false) => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.sr-only').textContent = 'Abrir menu';
    nav.classList.remove('is-open');
    body.classList.remove('nav-open');
    syncMenuAccess();
    if (returnFocus) menuToggle.focus();
  };
  syncMenuAccess();
  mobileMenu.addEventListener('change', () => closeMenu());

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Abrir menu' : 'Fechar menu';
    nav.classList.toggle('is-open', !isOpen);
    body.classList.toggle('nav-open', !isOpen);
    syncMenuAccess();
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    closeMenu();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }));
  document.addEventListener('keydown', (event) => {
    if (!mobileMenu.matches || !nav?.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeMenu(true);
    if (event.key === 'Tab') {
      const items = [menuToggle, ...nav.querySelectorAll('a')];
      const index = items.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && (index === items.length - 1 || index === -1)) { event.preventDefault(); items[0].focus(); }
    }
  });

  const updateScrollUi = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progress) progress.style.width = `${amount}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 28);
    backToTop?.classList.toggle('is-visible', window.scrollY > 700);
    if (backToTop) backToTop.tabIndex = window.scrollY > 700 ? 0 : -1;
  };
  updateScrollUi();
  window.addEventListener('scroll', updateScrollUi, { passive: true });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.classList.add('is-visible');
    }, { passive: true });
  }

  const filters = document.querySelectorAll('[data-filter]');
  const projectGrid = document.querySelector('[data-project-grid]');
  const projects = document.querySelectorAll('[data-category]');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.filter;
      filters.forEach((item) => {
        item.classList.toggle('is-active', item === filter);
        item.setAttribute('aria-pressed', String(item === filter));
      });
      projects.forEach((project) => {
        const categories = project.dataset.category?.split(' ') || [];
        project.classList.toggle('is-hidden', category !== 'all' && !categories.includes(category));
      });
      const visibleCount = [...projects].filter((project) => !project.classList.contains('is-hidden')).length;
      projectGrid?.setAttribute('data-visible-count', String(visibleCount));
    });
  });

  const dialog = document.querySelector('[data-project-dialog]');
  const dialogTitle = document.querySelector('[data-dialog-title]');
  const dialogType = document.querySelector('[data-dialog-type]');
  const dialogCopy = document.querySelector('[data-dialog-copy]');
  const dialogImage = document.querySelector('[data-dialog-image]');
  const dialogClose = document.querySelector('[data-dialog-close]');
  const dialogContact = document.querySelector('[data-dialog-contact]');
  projects.forEach((project) => {
    project.addEventListener('click', () => {
      if (!dialog?.showModal) return;
      if (dialogTitle) dialogTitle.textContent = project.dataset.title || '';
      if (dialogType) dialogType.textContent = project.dataset.type || '';
      if (dialogCopy) dialogCopy.textContent = project.dataset.copy || '';
      if (dialogImage) {
        const sourceImage = project.querySelector('img');
        dialogImage.src = sourceImage.src;
        dialogImage.alt = sourceImage.alt;
        dialogImage.hidden = false;
      }
      dialog.showModal();
    });
  });
  dialogClose?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialogContact?.addEventListener('click', () => dialog?.close());

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
  };

  const contactForm = document.querySelector('[data-contact-form]');
  contactForm.querySelector('button[type="submit"]').disabled = false;
  document.querySelectorAll('.service-card a').forEach((link, index) => {
    link.addEventListener('click', () => { contactForm.elements.service.selectedIndex = index + 1; });
  });
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const requiredFields = [...contactForm.querySelectorAll('[required]')];
    requiredFields.forEach((field) => field.classList.toggle('is-invalid', !field.checkValidity()));
    const firstInvalid = requiredFields.find((field) => !field.checkValidity());
    if (firstInvalid) {
      firstInvalid.focus();
      showToast('Verifique os campos obrigatórios antes de continuar.');
      return;
    }

    const data = new FormData(contactForm);
    const cleanLine = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
    const lineBreaks = (value) => String(value || '').replace(/\r?\n/g, '\r\n').trim();
    const company = cleanLine(data.get('company'));
    const subject = cleanLine(`Pedido de contacto — ${data.get('service')}`);
    const signature = [cleanLine(data.get('name')), company, cleanLine(data.get('email'))].filter(Boolean).join('\r\n');
    const bodyText = ['Olá,', '', lineBreaks(data.get('message')), '', 'Cumprimentos,', signature].join('\r\n');
    const mailto = `mailto:geral@fcmontagens.pt?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    document.querySelector('[data-form-status]').textContent = 'Pedido preparado. Reveja e envie no seu programa de e-mail. Se não abrir, escreva para geral@fcmontagens.pt; o texto continua neste formulário.';
    window.location.href = mailto;
  });

  contactForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('is-invalid'));
    field.addEventListener('change', () => field.classList.remove('is-invalid'));
  });
})();
