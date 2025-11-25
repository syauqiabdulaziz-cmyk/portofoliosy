/**
 * script.js (updated: theme switch UI + preserved behaviors)
 *
 * - Theme switch: #theme-sun and #theme-moon (grouped). Active button gets aria-pressed="true".
 * - Preference persisted to localStorage ('portfolio_theme' = 'light' | 'dark').
 * - All other behaviors unchanged:
 *   - mobile nav toggle
 *   - smooth anchors
 *   - intersection observer reveal
 *   - active nav highlight
 *   - print & focus-cv
 *
 * No changes required to contact logic — layout fixed in styles.css & index.html.
 */

(function () {
  const STATE = { themeKey: 'portfolio_theme' };

  const SEL = {
    root: document.documentElement,
    body: document.body,
    themeSwitch: '#theme-switch',
    themeSun: '#theme-sun',
    themeMoon: '#theme-moon',
    navToggle: '#nav-toggle',
    navList: '#nav-list',
    navLinks: '.nav__link',
    reveal: '.reveal',
    sections: 'main section[id]',
    printBtn: '#print-btn',
    focusCvToggle: '#focus-cv-toggle',
    year: '#year'
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* THEME */
  function applyTheme(theme) {
    const sun = $(SEL.themeSun);
    const moon = $(SEL.themeMoon);

    if (theme === 'dark') {
      SEL.root.setAttribute('data-theme', 'dark');
      if (moon) moon.setAttribute('aria-pressed', 'true');
      if (sun) sun.setAttribute('aria-pressed', 'false');
    } else {
      SEL.root.removeAttribute('data-theme');
      if (sun) sun.setAttribute('aria-pressed', 'true');
      if (moon) moon.setAttribute('aria-pressed', 'false');
    }
  }

  function loadTheme() {
    try { return localStorage.getItem(STATE.themeKey); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(STATE.themeKey, t); } catch (e) {}
  }

  function setupThemeSwitch() {
    const sun = $(SEL.themeSun);
    const moon = $(SEL.themeMoon);
    if (!sun || !moon) return;

    sun.addEventListener('click', () => { applyTheme('light'); saveTheme('light'); });
    moon.addEventListener('click', () => { applyTheme('dark'); saveTheme('dark'); });

    // arrow keyboard navigation between the two
    [sun, moon].forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (btn.id === 'theme-sun') ? $(SEL.themeMoon) : $(SEL.themeSun);
          next.focus();
        }
      });
    });
  }

  /* MOBILE NAV */
  function toggleMobileNav(open) {
    const toggle = $(SEL.navToggle);
    const list = $(SEL.navList);
    if (!toggle || !list) return;
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    const willOpen = (open === undefined) ? !isOpen : !!open;
    toggle.setAttribute('aria-expanded', String(willOpen));
    list.setAttribute('aria-hidden', String(!willOpen));
    const ham = toggle.querySelector('.hamburger');
    if (ham) {
      if (willOpen) { ham.style.transform = 'rotate(45deg)'; ham.style.background = 'transparent'; }
      else { ham.style.transform = ''; ham.style.background = ''; }
    }
  }

  function setupNavToggle() {
    const toggle = $(SEL.navToggle);
    const list = $(SEL.navList);
    if (!toggle || !list) return;
    list.setAttribute('aria-hidden', 'true');
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggleMobileNav(!expanded);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMobileNav(false); });
  }

  /* SMOOTH ANCHORS */
  function enableSmoothAnchors() {
    const links = $$(SEL.navLinks);
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const toggle = $(SEL.navToggle);
          if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggleMobileNav(false);
        }
      });
    });
  }

  /* ACTIVE NAV ON SCROLL */
  function observeActiveSection() {
    const sections = $$(SEL.sections);
    const navLinks = $$(SEL.navLinks);
    if (!sections.length || !navLinks.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(a => a.classList.remove('active'));
          const current = navLinks.find(a => a.getAttribute('href') === `#${id}`);
          if (current) { current.classList.add('active'); current.setAttribute('aria-current', 'page'); }
        }
      });
    }, { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0 });

    sections.forEach(s => io.observe(s));
  }

  /* REVEAL */
  function initReveal() {
    const elems = $$(SEL.reveal);
    if (!elems.length) return;
    const ro = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    elems.forEach(el => ro.observe(el));
  }

  /* PRINT & FOCUS */
  function setupExtras() {
    const printBtn = $(SEL.printBtn);
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    const focusBtn = $(SEL.focusCvToggle);
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        const is = document.body.classList.toggle('focus-cv');
        focusBtn.setAttribute('aria-pressed', String(is));
      });
    }
  }

  function updateYear() {
    const el = $(SEL.year);
    if (el) el.textContent = new Date().getFullYear();
  }

  /* INIT */
  function init() {
    const saved = loadTheme();
    if (saved) applyTheme(saved);
    else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    setupThemeSwitch();
    setupNavToggle();
    enableSmoothAnchors();
    observeActiveSection();
    initReveal();
    setupExtras();
    updateYear();

    function onFirstTab(e) {
      if (e.key === 'Tab') {
        document.documentElement.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', onFirstTab);
      }
    }
    window.addEventListener('keydown', onFirstTab, { once: true });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.portfolio = { init, applyTheme };
})();