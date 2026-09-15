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
if (newsBox) document.querySelector('.intro')?.after(newsBox);
if (newsBox) fetch('/api/news', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(news => {
  if (!news?.title || !news?.text) return;
  newsBox.querySelector('[data-news-title]').textContent = news.title;
  newsBox.querySelector('[data-news-text]').textContent = news.text;
  const link = newsBox.querySelector('[data-news-link]');
  let safeLink = false; try { safeLink = new URL(news.link).protocol === 'https:'; } catch {}
  if (safeLink && news.button) { link.href = news.link; link.textContent = news.button; link.hidden = false; link.target = '_blank'; link.rel = 'noreferrer'; }
  newsBox.hidden = false;
}).catch(() => {});
