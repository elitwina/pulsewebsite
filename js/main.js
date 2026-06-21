/* PulseDJ landing - v2 interactivity */
(function () {
  'use strict';

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

  // Rotating word (Serato → Rekordbox → Traktor → VirtualDJ → djay Pro)
  const track = document.getElementById('rotatorTrack');
  if (track) {
    const items = track.querySelectorAll('.rotator-item');
    let idx = 0;
    const last = items.length - 1; // duplicate of the first item at the end
    const step = 1.02;
    const INTERVAL = 2400;
    const DURATION = 550;

    setInterval(() => {
      idx++;
      track.style.transition = `transform ${DURATION}ms cubic-bezier(.7,0,.25,1)`;
      track.style.transform = `translateY(-${idx * step}em)`;
      if (idx === last) {
        setTimeout(() => {
          track.style.transition = 'none';
          idx = 0;
          track.style.transform = 'translateY(0em)';
          void track.offsetWidth;
        }, DURATION + 40);
      }
    }, INTERVAL);
  }

  // Reveal on scroll (skipped on reduced motion)
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && typeof IntersectionObserver !== 'undefined') {
    const targets = document.querySelectorAll('.section, .endcta, .row, .t-card, .price-card, .video-card, .supported-item, .cap');
    targets.forEach(el => el.classList.add('reveal'));
    // threshold: 0 — fire the moment ANY pixel of the target intersects the
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

  // Smooth-scroll with nav offset (real hrefs in HTML handle downloads/externals)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      // #top means jump to very top (whole hero visible)
      if (id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(id);
      if (!target) return;
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

  // Landing-page metrics — live API with same-origin snapshot fallback,
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

    // After numbers are set, reset to 0 once so the animation can run on view.
    const armCountUp = () => {
      if (reduced) return;
      targets.forEach((_, el) => { el.textContent = '0'; });
    };

    const countUp = () => {
      if (played) return;
      played = true;
      if (reduced) {
        targets.forEach((v, el) => { el.textContent = fmt(v); });
        return;
      }
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
      if (!band || typeof IntersectionObserver === 'undefined') { countUp(); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { countUp(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(band);
    };

    (async () => {
      try {
        const r = await fetch('https://pulsedj.com/api/v1/metrics/landing-page', { cache: 'no-store' });
        if (r.ok) { apply(await r.json()); armCountUp(); watchBand(); return; }
      } catch { /* fall through */ }
      try {
        const r = await fetch('/assets/data/metrics.json', { cache: 'no-store' });
        if (r.ok) { apply(await r.json()); }
      } catch { /* keep markup defaults */ }
      armCountUp();
      watchBand();
    })();
  })();

  // Hot 100 — top 7 preview on the home page (full chart on /hot100.html).
  // Uses the same row design as /hot100.html via the fullEl renderer.
  (function () {
    const previewEl = document.getElementById('hot100-preview-list');
    if (!previewEl) return;
    const ccLabel = document.getElementById('hot100-cc');
    if (window.PulseHot100 && typeof window.PulseHot100.render === 'function') {
      window.PulseHot100.render({ fullEl: previewEl, ccLabel: ccLabel, limit: 7 });
    }
  })();

  // Splash screen - fade out once the page has loaded, with a minimum dwell
  // so the animation is actually visible. Respects reduced motion (immediate).
  (function() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN_DWELL = reduced ? 0 : 1500;
    const start = performance.now();
    const hide = () => {
      const wait = Math.max(0, MIN_DWELL - (performance.now() - start));
      setTimeout(() => splash.classList.add('is-gone'), wait);
    };
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    // Safety fallback - never let splash hang past 4s
    setTimeout(() => splash.classList.add('is-gone'), 4000);
  })();
})();
