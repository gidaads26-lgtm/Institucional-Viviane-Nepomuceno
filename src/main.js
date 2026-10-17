const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = 'cubic-bezier(.22, 1, .36, 1)';

/* Topo ganha fundo depois que a página rola */
const topbar = document.querySelector('[data-topbar]');
const floatBtn = document.querySelector('[data-float]');
const hero = document.querySelector('.hero');
const closing = document.querySelector('.closing');

let heroVisible = true;
let closingVisible = false;
const syncFloat = () => floatBtn?.classList.toggle('is-visible', !heroVisible && !closingVisible);

const onScroll = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* WhatsApp flutuante: aparece depois do hero e some no fechamento, onde já existe um botão */
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; syncFloat(); }).observe(hero);
  new IntersectionObserver(([e]) => { closingVisible = e.isIntersecting; syncFloat(); }).observe(closing);
}

/* Revelações ao entrar na tela */
const revealables = document.querySelectorAll('[data-frame], [data-reveal-group], [data-how]');
if (reduce || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  revealables.forEach((el) => io.observe(el));
}

/* Dúvidas: abre e fecha com a altura animada, e só uma fica aberta por vez */
const faqItems = [...document.querySelectorAll('[data-faq] details')];
function setOpen(details, open) {
  const panel = details.querySelector('.faq-a');
  if (reduce || !panel.animate) { details.open = open; return; }
  details._anim?.cancel();
  if (open) {
    details.open = true;
    const h = panel.scrollHeight;
    details._anim = panel.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 320, easing: ease });
  } else {
    const h = panel.scrollHeight;
    details._anim = panel.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 240, easing: ease });
    details._anim.onfinish = () => { details.open = false; };
  }
}
faqItems.forEach((d) => {
  d.querySelector('summary').addEventListener('click', (e) => {
    e.preventDefault();
    const willOpen = !d.open;
    if (willOpen) faqItems.forEach((o) => o !== d && o.open && setOpen(o, false));
    setOpen(d, willOpen);
  });
});

/* Ondulação no clique dos botões */
function ripple(e) {
  if (reduce) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const s = document.createElement('span');
  const size = Math.max(r.width, r.height) * 1.2;
  s.className = 'fx-ripple';
  s.style.width = s.style.height = size + 'px';
  s.style.left = (e.clientX - r.left - size / 2) + 'px';
  s.style.top = (e.clientY - r.top - size / 2) + 'px';
  el.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}
document.querySelectorAll('.btn, .icon-btn').forEach((b) => b.addEventListener('pointerdown', ripple));

/* Caixas: a luz segue o cursor (só em telas com mouse) */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (finePointer && !reduce) {
  document.querySelectorAll('.creds-list li, .pillar, .care-grid li, .place-card, .voice, .faq details, .timeline li').forEach((card) => {
    card.classList.add('glow');
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  });
}

/* Ano do rodapé */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
