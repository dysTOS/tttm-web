const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('span').textContent = open ? '×' : '+';
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (menuToggle) menuToggle.querySelector('span').textContent = '+';
}));

const lightbox = document.querySelector('[data-lightbox]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
document.querySelectorAll('[data-gallery] .gallery-card').forEach((card) => card.addEventListener('click', () => {
  lightboxImage.src = card.dataset.full;
  lightboxImage.alt = card.querySelector('img').alt;
  lightbox.showModal();
}));
document.querySelector('[data-close]')?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });

const newsBox = document.querySelector('[data-news]');
const newsLanguage = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'de';
if (newsBox) {
  const title = newsBox.querySelector('[data-news-title]');
  const text = newsBox.querySelector('[data-news-text]');
  const link = newsBox.querySelector('[data-news-link]');
  const hideNews = () => {
    newsBox.hidden = true;
    title.textContent = '';
    text.textContent = '';
    link.hidden = true;
    link.removeAttribute('href');
    link.textContent = '';
  };

  hideNews();
  document.querySelector('.intro')?.after(newsBox);
  fetch(`/api/news?lang=${newsLanguage}`, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('News unavailable');
      return response.json();
    })
    .then(news => {
      if (typeof news?.title !== 'string' || typeof news?.text !== 'string' || !news.title.trim() || !news.text.trim()) return;
      title.textContent = news.title;
      text.textContent = news.text;
      let safeLink = false;
      try {
        const url = new URL(news.link);
        safeLink = url.protocol === 'https:' && Boolean(url.hostname);
      } catch {}
      if (safeLink && typeof news.button === 'string' && news.button.trim()) {
        link.href = news.link;
        link.textContent = news.button;
        link.hidden = false;
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      newsBox.hidden = false;
    })
    .catch(hideNews);
}
