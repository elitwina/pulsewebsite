/* PulseDJ Hot 100 - shared loader for the home preview and /hot100 page.
   Talks to the real Pulse backend at dj.pulseparty.io. Falls back to a
   same-origin snapshot if the API is unreachable. */
(function () {
  'use strict';

  const LIVE_BASE = 'https://dj.pulseparty.io/api/v1/song/hot100-web?countryCode=';
  const _dataBase = (() => {
    const s = document.currentScript && document.currentScript.src;
    return s ? new URL('../assets/data/', s).href : 'assets/data/';
  })();
  const SNAPSHOT_BASE = _dataBase + 'hot100-';
  const SNAPSHOT_FALLBACK = _dataBase + 'hot100-il.json';

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));

  // Placeholder BPM + Camelot Key generator (deterministic by track id, so
  // the same song always shows the same value until the API returns real
  // bpm/camelotKey fields). Remove once the API includes these.
  const stableHash = (str) => {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const placeholderBpm = (id) => 92 + (stableHash(id + 'b') % 46);   // 92-137
  const placeholderKey = (id) => {
    const n = 1 + (stableHash(id + 'k') % 12);
    const ab = (stableHash(id + 'ab') % 2) ? 'A' : 'B';
    return { num: n, label: n + ab };
  };

  const renderChange = (change) => {
    if (!change || change === '+0' || change === '0') {
      return '<span class="pw-badge pw-badge--flat">=</span>';
    }
    if (change.startsWith('+')) {
      return '<span class="pw-badge pw-badge--up">▲ ' + escapeHtml(change.slice(1)) + '</span>';
    }
    if (change.startsWith('-')) {
      return '<span class="pw-badge pw-badge--down">▼ ' + escapeHtml(change.slice(1)) + '</span>';
    }
    return '';
  };

  async function detectCountry() {
    try {
      const r = await fetch('https://ipapi.co/country/', { cache: 'no-store' });
      if (!r.ok) throw 0;
      const cc = (await r.text()).trim().toUpperCase();
      return /^[A-Z]{2}$/.test(cc) ? cc : 'IL';
    } catch { return 'IL'; }
  }

  async function loadChart(cc) {
    // Try live API first
    try {
      const r = await fetch(LIVE_BASE + cc, { cache: 'no-store' });
      if (r.ok) {
        const json = await r.json();
        if (json && Array.isArray(json.data)) return { source: 'live', cc: cc, createdAt: json.createdAt, data: json.data };
      }
    } catch { /* CORS / network - fall through to snapshot */ }

    // Same-origin snapshot fallback
    try {
      const r = await fetch(SNAPSHOT_BASE + cc.toLowerCase() + '.json', { cache: 'no-store' });
      if (r.ok) {
        const json = await r.json();
        if (json && Array.isArray(json.data)) return { source: 'snapshot', cc: cc, createdAt: json.createdAt, data: json.data };
      }
    } catch { /* try IL fallback */ }

    try {
      const r = await fetch(SNAPSHOT_FALLBACK, { cache: 'no-store' });
      const json = await r.json();
      return { source: 'snapshot', cc: 'IL', createdAt: json.createdAt, data: json.data || [] };
    } catch { return { source: 'error', cc: cc, data: [] }; }
  }

  function renderCompact(listEl, tracks) {
    listEl.innerHTML = tracks.map((t, i) => (
      '<li class="pw-track">' +
        '<span class="pw-rank">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="pw-track-name" title="' + escapeHtml(t.artist || '') + '">' + escapeHtml(t.track || '(untitled)') + '</span>' +
        renderChange(t.change) +
        '<span class="pw-key">' + escapeHtml(String(t.playedCount || '') + '×') + '</span>' +
      '</li>'
    )).join('');
  }

  function renderFull(containerEl, tracks) {
    containerEl.innerHTML = tracks.map((t, i) => {
      const bpm = t.bpm != null ? t.bpm : placeholderBpm(t.id || t.track || i);
      const keyStr = t.camelotKey || t.key;
      let keyLabel, keyNum;
      if (keyStr && /^\d{1,2}[AB]$/i.test(keyStr)) {
        keyLabel = String(keyStr).toUpperCase();
        keyNum = parseInt(keyLabel, 10);
      } else {
        const k = placeholderKey(t.id || t.track || i);
        keyLabel = k.label;
        keyNum = k.num;
      }
      return (
        '<li class="h100-row">' +
          '<span class="h100-rank">' + (i + 1) + '</span>' +
          '<div class="h100-meta">' +
            '<span class="h100-track">' + escapeHtml(t.track || '(untitled)') + '</span>' +
            '<span class="h100-artist">' + escapeHtml(t.artist || '') + '</span>' +
          '</div>' +
          '<span class="h100-bpm">' + bpm + '</span>' +
          '<span class="h100-key h100-key--' + keyNum + '">' + escapeHtml(keyLabel) + '</span>' +
          '<span class="h100-change">' + renderChange(t.change) + '</span>' +
          '<span class="h100-count">' + escapeHtml(String(t.playedCount || '0')) + '</span>' +
        '</li>'
      );
    }).join('');
  }

  async function render(opts) {
    const o = opts || {};
    const cc = (o.cc && /^[A-Z]{2}$/.test(o.cc)) ? o.cc : await detectCountry();
    const result = await loadChart(cc);
    const labelCc = result.cc || cc;
    if (o.ccLabel) o.ccLabel.textContent = labelCc;
    if (o.onCountry) o.onCountry(labelCc);

    const tracks = (o.limit ? result.data.slice(0, o.limit) : result.data);

    if (o.listEl) {
      if (!tracks.length) {
        o.listEl.innerHTML = '<li class="pw-track hot100-loading"><span class="pw-rank">--</span><span class="pw-track-name">Chart unavailable</span></li>';
      } else {
        renderCompact(o.listEl, tracks);
      }
    }
    if (o.fullEl) {
      if (!tracks.length) {
        o.fullEl.innerHTML = '<li class="h100-row h100-row--empty">Chart unavailable</li>';
      } else {
        renderFull(o.fullEl, tracks);
      }
    }
    return result;
  }

  window.PulseHot100 = {
    render: render,
    detectCountry: detectCountry,
  };
})();
