'use strict';

/* ── header scroll ── */
const hdr = document.getElementById('hdr');
const pagetop = document.getElementById('pagetop');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  hdr.classList.toggle('on', y > 60);
  pagetop.classList.toggle('show', y > 500);
}, { passive: true });

/* ── hamburger ── */
const burger = document.getElementById('burger');
const mnav   = document.getElementById('mnav');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mnav.classList.toggle('open');
});
mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  mnav.classList.remove('open');
}));

/* ── AOS (data-aos) ── */
const aosEls = document.querySelectorAll('[data-aos]');
const aosObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    // stagger siblings
    const parent = e.target.closest('.svc-grid, .tech-grid, .works-grid, .strength__nums, .recruit__points, .recruit__right, .tech__cards, .contact__layout') || e.target.parentElement;
    const siblings = [...parent.querySelectorAll('[data-aos]:not(.in)')];
    const idx = siblings.indexOf(e.target);
    setTimeout(() => e.target.classList.add('in'), Math.min(idx, 5) * 90);
    aosObs.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
aosEls.forEach(el => aosObs.observe(el));

/* ── count-up ── */
function countUp(el, target, dur = 1800) {
  const start = performance.now();
  const fmt = n => n >= 1000 ? n.toLocaleString('ja') : String(n);
  const tick = now => {
    const p  = Math.min((now - start) / dur, 1);
    const e  = 1 - (1 - p) ** 3; // ease-out cubic
    el.textContent = fmt(Math.round(e * target));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('[data-target]').forEach(el => {
      countUp(el, +el.dataset.target);
    });
    counterObs.unobserve(e.target);
  });
}, { threshold: 0.4 });

[document.querySelector('.hero__kpi'), document.querySelector('.strength__nums')]
  .filter(Boolean).forEach(el => counterObs.observe(el));

/* ── hero parallax (subtle) ── */
const heroScene = document.querySelector('.hero__scene');
if (heroScene) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroScene.style.transform = `translateY(${y * 0.18}px)`;
    }
  }, { passive: true });
}

/* ── contact form ── */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.cf-btn');
    btn.textContent = '送信中...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '送信完了 ✓';
      btn.style.background = '#059669';
      setTimeout(() => {
        btn.textContent = '送信する →';
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    }, 1400);
  });
}
