// Header scroll
const header = document.getElementById('header');
const pageTop = document.getElementById('pageTop');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 60);
  pageTop.classList.toggle('visible', y > 400);
}, { passive: true });

// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open');
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
}));

// Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-in');
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      // stagger siblings
      const siblings = [...e.target.parentElement.querySelectorAll('.fade-in:not(.visible)')];
      const idx = siblings.indexOf(e.target);
      setTimeout(() => e.target.classList.add('visible'), idx * 80);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
fadeEls.forEach(el => io.observe(el));

// KPI counter
function countUp(el, target, duration = 1600) {
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}
const kpiObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const nums = document.querySelectorAll('.hero__kpi-num');
      nums.forEach(n => countUp(n, +n.dataset.target));
      kpiObserver.disconnect();
    }
  });
}, { threshold: 0.5 });
const kpiSection = document.querySelector('.hero__kpi');
if (kpiSection) kpiObserver.observe(kpiSection);

// Contact form demo
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn--submit');
    btn.textContent = '送信中...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '送信完了 ✓';
      btn.style.background = '#059669';
      setTimeout(() => {
        btn.textContent = '送信する';
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    }, 1400);
  });
}
