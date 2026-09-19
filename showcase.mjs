// One on-demand player; film metadata is supplied by the page generator.
export function initShowcase(strings) {
  const section = document.querySelector('#videos');
  if (!section) return;
  const films = JSON.parse(section.querySelector('#showcase-data').textContent);
  const video = section.querySelector('video');
  const preview = section.querySelector('.showcase-preview');
  const poster = preview.querySelector('img');
  const start = section.querySelector('.showcase-start');
  const retry = section.querySelector('.showcase-retry');
  const status = section.querySelector('.video-status');
  const choices = [...section.querySelectorAll('[data-film]')];
  const direct = section.querySelector('.showcase-direct');
  let selected = films[0], request = 0;

  function showError() {
    status.textContent = strings.videoerror;
    retry.hidden = false;
  }

  function select(film) {
    video.pause();
    selected = film;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.film === film.id)));
    section.querySelector('[data-film-title]').textContent = film.title;
    section.querySelector('[data-film-description]').textContent = film.description;
    direct.href = film.src;
    direct.setAttribute('aria-label', `${strings.showcase.open}: ${film.title}`);
    start.setAttribute('aria-label', `${strings.showcase.play}: ${film.title}`);
    video.setAttribute('aria-label', film.title);
    video.width = poster.width = film.width;
    video.height = poster.height = film.height;
    poster.srcset = film.srcset;
    poster.src = film.poster;
    section.dataset.format = film.height > film.width ? 'portrait' : 'landscape';
  }

  async function play(film, reload = false) {
    const currentRequest = ++request;
    const changed = selected.id !== film.id;
    if (changed) select(film);
    status.textContent = '';
    retry.hidden = true;
    preview.hidden = true;
    video.hidden = false;
    if (!video.getAttribute('src') || changed || reload) {
      video.poster = film.poster;
      video.src = film.src;
      video.load();
    }
    try {
      await video.play();
    } catch (error) {
      if (currentRequest !== request || error.name === 'AbortError') return;
      // If a browser requires another gesture, its native Play control remains available.
      if (error.name !== 'NotAllowedError') showError();
    }
  }

  start.addEventListener('click', () => {
    play(selected);
    video.focus();
  });
  retry.addEventListener('click', () => play(selected, true));
  choices.forEach(button => button.addEventListener('click', () => {
    const film = films.find(item => item.id === button.dataset.film);
    if (film) play(film);
  }));
  video.addEventListener('error', () => { if (video.error) showError(); });
  video.addEventListener('playing', () => { status.textContent = ''; retry.hidden = true; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });

  section.dataset.format = 'landscape';
  video.tabIndex = 0;
  start.hidden = false;
  section.querySelector('.showcase-choices').hidden = false;
  section.querySelector('.showcase-fallback').hidden = true;
}
