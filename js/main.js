/* PulseDJ landing - v2 interactivity */
(function () {
  'use strict';

  const _dataBase = (() => {
    const s = document.currentScript && document.currentScript.src;
    return s ? new URL('../assets/data/', s).href : 'assets/data/';
  })();

  // ── NAVBAR INJECTION ────────────────────────────────────────────────────────
  // Single source of truth for the top bar. All pages carry an empty
  // <nav class="navbar" id="navbar"></nav> shell; this fills it in.
  (function buildNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav || nav.querySelector('.nav-inner')) return; // already built

    const inBlog = /\/blog\/[^/]+$/.test(window.location.pathname);
    const b = inBlog ? '../' : './';
    const isHome = !inBlog && (
      window.location.pathname.endsWith('/') ||
      window.location.pathname.endsWith('/index.html')
    );

    const a = (path, text, cls) => {
      const href = isHome && path.startsWith('index.html#')
        ? '#' + path.split('#')[1]
        : b + path;
      return `<li${cls ? ' class="' + cls + '"' : ''}><a href="${href}">${text}</a></li>`;
    };

    nav.innerHTML = `
  <div class="nav-inner">
    <a href="${isHome ? '#top' : b}" class="brand">
      <img src="${b}assets/img/logo-icon-red.svg" alt="PulseDJ" class="brand-logo" />
      <span class="brand-name">PulseDJ</span>
    </a>
    <button class="hamburger" id="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-menu" id="navMenu">
      ${a('index.html#how-it-works', 'How it works')}
      ${a('index.html#pricing', 'Pricing')}
      ${a('faq.html', 'FAQ')}
      ${a('hot100.html', 'Hot 100')}
      ${a('blog.html', 'Blog')}
      <li class="nav-menu-cta"><a href="${b}index.html" class="cta-pill">Get Pulse - Free</a></li>
    </ul>
    <div class="nav-right">
      <a href="${b}index.html" class="cta-pill">Get Pulse - Free</a>
    </div>
  </div>`;
  })();
  // ────────────────────────────────────────────────────────────────────────────

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Navbar background swap on scroll
  const navbar = document.getElementById('navbar');
  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Color theme toggle (green / red) - persisted via localStorage.
  // To add a new theme: add body.theme-X CSS block overriding only the brand
  // tokens (--brand-rgb, --brand-light, --brand-deep, --brand-text, --brand-hover).
  (function() {
    const STORAGE_KEY = 'pulse_color_theme';
    const LOGOS = { green: 'assets/img/logo-icon-green.svg', red: 'assets/img/logo-icon-red.svg' };

    const applyTheme = (theme) => {
      document.documentElement.classList.remove('theme-green-early');
      document.body.classList.toggle('theme-green', theme === 'green');
      const logoFile = LOGOS[theme] || LOGOS.red;
      // Swap all brand logo images
      document.querySelectorAll('.brand-logo, .splash-logo').forEach(img => {
        const base = img.getAttribute('src').replace(/logo-icon-(green|red)\.svg(\?.*)?$/, '');
        img.src = base + logoFile.split('/').pop();
      });
      // Swap favicon
      const fav = document.querySelector('link[rel="icon"]');
      if (fav) fav.href = fav.href.replace(/logo-icon-(green|red)\.svg/, logoFile.split('/').pop());
      // Mark active dot
      document.querySelectorAll('.color-switch-dot').forEach(d => {
        d.classList.toggle('active', d.dataset.theme === theme);
      });
    };

    // Inject switcher into .nav-right (before the CTA pill)
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
      const sw = document.createElement('div');
      sw.className = 'color-switch';
      sw.setAttribute('role', 'group');
      sw.setAttribute('aria-label', 'Color theme');
      sw.innerHTML =
        '<button class="color-switch-dot color-switch-green" data-theme="green" title="Green theme" aria-label="Green theme"></button>' +
        '<button class="color-switch-dot color-switch-red"   data-theme="red"   title="Red theme"   aria-label="Red theme"></button>';
      navRight.insertBefore(sw, navRight.firstChild);
      sw.addEventListener('click', e => {
        const dot = e.target.closest('.color-switch-dot');
        if (!dot) return;
        const theme = dot.dataset.theme;
        try { localStorage.setItem(STORAGE_KEY, theme); } catch(e) {}
        applyTheme(theme);
      });
    }

    // Restore saved theme (default: red)
    let saved = 'red';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'red'; } catch(e) {}
    applyTheme(saved);
  })();

  // Hide navbar CTA while hero is on screen; reveal once user scrolls past it
  (function() {
    const hero = document.querySelector('.v4-hero');
    if (!hero || !navbar) return;
    document.body.classList.add('has-hero');
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        navbar.classList.toggle('nav-cta-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    io.observe(hero);
  })();

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      hamburger.classList.toggle('active', open);
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
    }));
  }

  // Reusable vertical-rotator helper. Expects a track of N items where the
  // last item is a duplicate of the first, so the loop reset is invisible.
  // Optionally syncs the parent container width to the current item's width,
  // so each word hugs its own box instead of inheriting the longest item's width.
  const startVerticalRotator = (track, opts) => {
    if (!track) return;
    const items = Array.from(track.children);
    if (items.length < 2) return;
    const last = items.length - 1; // duplicate of first
    const step = (opts && opts.step) || 1.05; // matches CSS line-height
    const INTERVAL = (opts && opts.interval) || 2400;
    const DURATION = (opts && opts.duration) || 550;
    const fitWidth = !!(opts && opts.fitWidth);
    const container = track.parentElement;
    let idx = 0;
    let widths = [];

    // Measure off-DOM via a clone span: the rotator container is clipped to
    // width 0, so children inside it can't be measured directly. We render a
    // duplicate span at the same font in the document body and read its width.
    const measureOffDom = (el) => {
      if (!el) return 0;
      const cs = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.style.cssText =
        'position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;' +
        'font-family:' + cs.fontFamily + ';' +
        'font-size:' + cs.fontSize + ';' +
        'font-weight:' + cs.fontWeight + ';' +
        'font-style:' + cs.fontStyle + ';' +
        'letter-spacing:' + cs.letterSpacing + ';' +
        'text-transform:' + cs.textTransform + ';';
      probe.textContent = el.textContent;
      document.body.appendChild(probe);
      const w = probe.getBoundingClientRect().width;
      document.body.removeChild(probe);
      return Math.ceil(w);
    };

    const measure = () => {
      if (!fitWidth || !container) return;
      widths = items.map(measureOffDom);
      apply();
    };
    // Set container to the WIDEST measured item, once. This eliminates any
    // mid-rotation width change - the column scrolls vertically only, and
    // anything next to the rotator (like a closing period or full stop)
    // stays put. The longest item ("VirtualDJ.") defines the width.
    const apply = () => {
      if (!fitWidth || !container || !widths.length) return;
      const w = Math.max.apply(null, widths);
      if (w) container.style.width = w + 'px';
    };

    measure();
    if (fitWidth) {
      // Re-measure after fonts settle and on resize
      window.addEventListener('resize', measure, { passive: true });
      setTimeout(measure, 600);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});
    }

    setInterval(() => {
      idx++;
      track.style.transition = `transform ${DURATION}ms cubic-bezier(.7,0,.25,1)`;
      track.style.transform = `translateY(-${idx * step}em)`;
      apply();
      if (idx === last) {
        setTimeout(() => {
          track.style.transition = 'none';
          if (container && fitWidth) container.style.transition = 'none';
          idx = 0;
          track.style.transform = 'translateY(0em)';
          apply();
          void track.offsetWidth;
          track.style.transition = '';
          if (container && fitWidth) {
            // restore transition for next cycle
            requestAnimationFrame(() => { container.style.transition = ''; });
          }
        }, DURATION + 40);
      }
    }, INTERVAL);
  };

  // Legacy hero rotator (kept in case any page still uses it)
  startVerticalRotator(document.getElementById('rotatorTrack'), { step: 1.02 });

  // Proof-quote rotator: cycles the DJ software name in the verbatim line
  startVerticalRotator(document.getElementById('proofRotator'), { step: 1.14, interval: 2200, duration: 520, fitWidth: true });

  // Reveal on scroll (skipped on reduced motion)
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && typeof IntersectionObserver !== 'undefined') {
    const targets = document.querySelectorAll('.section, .endcta, .row, .t-card, .price-card, .video-card, .supported-item, .cap');
    targets.forEach(el => el.classList.add('reveal'));
    // threshold: 0 - fire the moment ANY pixel of the target intersects the
    // viewport. The previous 0.1 threshold failed for sections taller than
    // ~10× the viewport (e.g. the FAQ list at ~6700px on a 900px screen),
    // because 10% of the section never fits on screen at once.
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));
  }

  // Smooth-scroll with nav offset. Only intercepts when the target element
  // actually exists on the current page - cross-page hash links (like
  // index.html#pricing clicked from faq.html) are left for native navigation.
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      if (id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(id);
      if (!target) return; // element not on this page - let browser handle it
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Auto-loop videos: play muted in viewport, pause when off-screen.
  // Click on the video OR the sound button toggles audio (unmute on click).
  // Best practice: muted autoplay is allowed by browsers, audio requires
  // a user gesture; we wait for that gesture before unmuting.
  (function() {
    const cards = document.querySelectorAll('[data-autoloop]');
    if (!cards.length) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach(card => {
      const video = card.querySelector('video');
      const soundBtn = card.querySelector('[data-sound]');
      if (!video) return;

      const toggleSound = () => {
        const wantSoundOn = video.muted;
        video.muted = !wantSoundOn;
        card.classList.toggle('is-sound-on', wantSoundOn);
        // If we're turning sound on, also make sure it's playing.
        if (wantSoundOn) video.play().catch(() => {});
        // Pause any OTHER loop videos so only one plays audio at a time.
        if (wantSoundOn) {
          document.querySelectorAll('[data-autoloop] video').forEach(v => {
            if (v !== video) { v.muted = true; v.closest('[data-autoloop]')?.classList.remove('is-sound-on'); }
          });
        }
        if (soundBtn) {
          const icon = soundBtn.querySelector('i');
          if (icon) icon.className = wantSoundOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
          const label = soundBtn.querySelector('span');
          if (label) label.textContent = wantSoundOn ? 'Click to mute' : 'Click for sound';
        }
      };
      // Only bind sound-toggle on cards that actually have a visible sound
      // button (i.e. the audio loops). The decorative .row-video clips are
      // audioless - they should just play, not react to clicks.
      const hasSoundButton = soundBtn && !soundBtn.hidden;
      if (hasSoundButton) {
        soundBtn.addEventListener('click', e => { e.stopPropagation(); toggleSound(); });
        video.addEventListener('click', toggleSound);
      }

      // Play / pause based on viewport visibility (battery & CPU friendly)
      if (reduced) return; // honour reduced-motion: don't autoplay
      if (typeof IntersectionObserver === 'undefined') {
        video.play().catch(() => {});
        return;
      }
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });
      io.observe(video);
    });
  })();

  // Landing-page metrics - live API with same-origin snapshot fallback,
  // plus a one-shot count-up animation when the stats band scrolls into view.
  (function () {
    const eventsEl = document.getElementById('stat-events');
    const pairingsEl = document.getElementById('stat-pairings');
    const uniqueEl = document.getElementById('stat-unique');
    if (!eventsEl && !pairingsEl && !uniqueEl) return;

    const macDl = document.querySelector('.dl[data-os="mac"]');
    const fmt = (n) => (typeof n === 'number') ? Math.round(n).toLocaleString('en-US') : '';
    const targets = new Map(); // el -> finalValue
    let played = false;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setStatic = (el, n) => {
      if (!el || typeof n !== 'number') return;
      const formatted = fmt(n);
      el.textContent = formatted;
      // Lock the visual width to the final number's width so the count-up
      // animation doesn't push surrounding layout around.
      el.style.setProperty('--stat-w', formatted.length + 'ch');
      targets.set(el, n);
    };

    const apply = (d) => {
      if (!d) return;
      setStatic(eventsEl,   d.eventsCount);
      setStatic(pairingsEl, d.songPairings);
      setStatic(uniqueEl,   d.uniqueSongs);
      if (macDl && d.s3DMGPath) macDl.href = d.s3DMGPath;
    };

    // Reset to 0 and animate up. We arm + animate in the same frame so the
    // user never sees a static "0" - by the time they look, numbers are moving.
    const armAndPlay = () => {
      if (played) return;
      if (reduced) {
        targets.forEach((v, el) => { el.textContent = fmt(v); });
        played = true;
        return;
      }
      // Reset to 0 here (not on page load) - guarantees no `0/0/0` flash.
      targets.forEach((_, el) => { el.textContent = '0'; });
      played = true;
      const DURATION = 1400;
      const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        const f = ease(t);
        targets.forEach((finalVal, el) => { el.textContent = fmt(finalVal * f); });
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const watchBand = () => {
      const band = document.querySelector('.stats-band');
      if (!band || typeof IntersectionObserver === 'undefined') { armAndPlay(); return; }
      // Fire 200px BEFORE the band enters the viewport so by the time the
      // user looks, the animation is already running smoothly.
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { armAndPlay(); io.disconnect(); } });
      }, { threshold: 0, rootMargin: '200px 0px 200px 0px' });
      io.observe(band);
    };

    // Seed targets from the SSR'd markup so animation has something to run to
    // even if both API and snapshot fail. Numbers in the HTML are the "rest" state.
    const seedFromMarkup = (el) => {
      if (!el) return;
      const n = parseInt((el.textContent || '').replace(/[^\d]/g, ''), 10);
      if (n > 0) setStatic(el, n);
    };
    seedFromMarkup(eventsEl);
    seedFromMarkup(pairingsEl);
    seedFromMarkup(uniqueEl);

    (async () => {
      try {
        const r = await fetch('https://dj.pulseparty.io/api/v1/metrics/landing-page', { cache: 'no-store' });
        if (r.ok) { apply(await r.json()); watchBand(); return; }
      } catch { /* fall through */ }
      try {
        const r = await fetch(_dataBase + 'metrics.json', { cache: 'no-store' });
        if (r.ok) { apply(await r.json()); }
      } catch { /* keep markup defaults */ }
      watchBand();
    })();
  })();

  // Hot 100 - top 7 preview on the home page (full chart on /hot100.html).
  // Uses the same row design as /hot100.html via the fullEl renderer.
  (function () {
    const previewEl = document.getElementById('hot100-preview-list');
    if (!previewEl) return;
    const ccLabel = document.getElementById('hot100-cc');
    if (window.PulseHot100 && typeof window.PulseHot100.render === 'function') {
      window.PulseHot100.render({ fullEl: previewEl, ccLabel: ccLabel, limit: 7 });
    }
  })();

  // Splash screen - shown only on the first visit per browser session, with
  // a brief minimum dwell on first paint. Returning visitors within the same
  // tab session skip it entirely. Respects reduced motion (immediate).
  (function() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    // body:has(.splash:not(.is-gone)) applies overflow:hidden which blocks the
    // browser's native hash-scroll on page load. After the splash hides we
    // re-scroll to whatever hash is in the URL so cross-page anchor links work.
    const restoreHashScroll = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;
      // Use setTimeout so the browser has time to remove overflow:hidden
      // (applied by body:has(.splash:not(.is-gone))) before scrolling.
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 80);
    };

    // Returning visitor this session - skip the splash entirely
    try {
      if (sessionStorage.getItem('pulse_splash_shown') === '1') {
        splash.classList.add('is-gone');
        restoreHashScroll();
        return;
      }
      sessionStorage.setItem('pulse_splash_shown', '1');
    } catch (e) { /* sessionStorage blocked - fall through and show splash */ }
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN_DWELL = reduced ? 0 : 900;
    const start = performance.now();

    let pageReady = false;
    let videoReady = false;

    const tryHide = () => {
      if (!pageReady || !videoReady) return;
      const wait = Math.max(0, MIN_DWELL - (performance.now() - start));
      setTimeout(() => { splash.classList.add('is-gone'); restoreHashScroll(); }, wait);
    };

    const onPageReady = () => { pageReady = true; tryHide(); };
    const onVideoReady = () => { videoReady = true; tryHide(); };

    // Wait for page load
    if (document.readyState === 'complete') onPageReady();
    else window.addEventListener('load', onPageReady);

    // Wait for hero video to be ready to play
    const heroVideo = document.querySelector('.v4-hero-video');
    if (heroVideo) {
      if (heroVideo.readyState >= 3) { onVideoReady(); }
      else { heroVideo.addEventListener('canplay', onVideoReady, { once: true }); }
    } else {
      videoReady = true; // no hero video on this page
    }

    // Safety fallback - never hang past 10s
    setTimeout(() => {
      pageReady = true; videoReady = true;
      splash.classList.add('is-gone'); restoreHashScroll();
    }, 10000);
  })();
})();
