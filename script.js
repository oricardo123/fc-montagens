(() => {
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

  const closeMenu = () => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.sr-only').textContent = 'Abrir menu';
    nav.classList.remove('is-open');
    body.classList.remove('nav-open');
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Abrir menu' : 'Fechar menu';
    nav.classList.toggle('is-open', !isOpen);
    body.classList.toggle('nav-open', !isOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const updateScrollUi = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progress) progress.style.width = `${amount}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 28);
    backToTop?.classList.toggle('is-visible', window.scrollY > 700);
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
  const projects = document.querySelectorAll('[data-category]');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.filter;
      filters.forEach((item) => item.classList.toggle('is-active', item === filter));
      projects.forEach((project) => {
        const categories = project.dataset.category?.split(' ') || [];
        project.classList.toggle('is-hidden', category !== 'all' && !categories.includes(category));
      });
    });
  });

  const dialog = document.querySelector('[data-project-dialog]');
  const dialogTitle = document.querySelector('[data-dialog-title]');
  const dialogType = document.querySelector('[data-dialog-type]');
  const dialogCopy = document.querySelector('[data-dialog-copy]');
  const dialogClose = document.querySelector('[data-dialog-close]');
  const dialogContact = document.querySelector('[data-dialog-contact]');
  projects.forEach((project) => {
    project.addEventListener('click', () => {
      if (!dialog?.showModal) return;
      if (dialogTitle) dialogTitle.textContent = project.dataset.title || '';
      if (dialogType) dialogType.textContent = project.dataset.type || '';
      if (dialogCopy) dialogCopy.textContent = project.dataset.copy || '';
      dialog.showModal();
    });
  });
  dialogClose?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
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
    const subject = `Pedido de contacto — ${data.get('service')}`;
    const bodyText = [
      `Nome: ${data.get('name')}`,
      `Empresa: ${data.get('company') || '—'}`,
      `E-mail: ${data.get('email')}`,
      `Assunto: ${data.get('service')}`,
      '',
      'Mensagem:',
      data.get('message')
    ].join('\n');
    const mailto = `mailto:geral@fcmontagens.pt?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    showToast('A abrir o seu programa de e-mail…');
    window.setTimeout(() => { window.location.href = mailto; }, 250);
  });

  contactForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('is-invalid'));
    field.addEventListener('change', () => field.classList.remove('is-invalid'));
  });
})();
