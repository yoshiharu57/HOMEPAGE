/* main.js */

// NAV scroll effect
const nav = document.getElementById('nav');
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
  backToTop.classList.toggle('visible', window.scrollY > 400);
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navList = document.getElementById('navList');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navList.classList.toggle('open');
});
navList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navList.classList.remove('open');
  });
});

// Reveal on scroll (Intersection Observer)
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
reveals.forEach(el => observer.observe(el));

// Hero particles
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const x = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 8 + Math.random() * 12;
    const size = 2 + Math.random() * 3;
    p.style.cssText = `
      left: ${x}%;
      bottom: -${size}px;
      width: ${size}px;
      height: ${size}px;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    container.appendChild(p);
  }
}
createParticles();

// Stagger reveal hero children
document.querySelectorAll('.hero__content .reveal').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.15}s`;
  setTimeout(() => el.classList.add('visible'), 100 + i * 150);
});
document.querySelectorAll('.hero__stat').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 600 + i * 150);
});

// Counter animation
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const duration = 1500;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current) + suffix;
  }, 16);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const numEl = entry.target.querySelector('.hero__stat-num');
      if (numEl) {
        const text = numEl.textContent;
        const match = text.match(/(\d+)/);
        if (match) {
          const suffix = text.replace(match[0], '');
          animateCounter(numEl, parseInt(match[0]), suffix);
        }
      }
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.hero__stat').forEach(el => statObserver.observe(el));

// Contact form (demo)
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = '送信中...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '送信しました ✓';
      btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      setTimeout(() => {
        btn.textContent = '送信する';
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    }, 1200);
  });
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 120) {
      current = section.id;
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}, { passive: true });
