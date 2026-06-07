/* ChildBloom — tester onboarding flow (/join)
 * Self-contained, no dependencies. Served from 'self' so it runs under the
 * production CSP (script-src 'self'). Drives a 3-step guided sequence:
 *   1) join the Google testers group
 *   2) opt in via the Play testing link
 *   3) install from the Play Store
 * Progress persists in localStorage; steps unlock in order; a lightweight,
 * PII-free PostHog funnel reports how far each visitor gets.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cb_join_progress_v1';
  var ID_KEY = 'cb_join_distinct_id';
  var TOTAL_STEPS = 3;

  // ── PostHog funnel (public project key — write-only, safe to ship) ──────────
  var PH_KEY = 'phc_q7mHihnpqtTvCP9XQdRBVhjAzDKMcBoaWYuEVWM9WiuX';
  var PH_URL = 'https://us.i.posthog.com/capture/';

  function distinctId() {
    var id = '';
    try { id = localStorage.getItem(ID_KEY) || ''; } catch (e) {}
    if (!id) {
      id = 'tester_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(ID_KEY, id); } catch (e) {}
    }
    return id;
  }

  function track(event, props) {
    try {
      var body = JSON.stringify({
        api_key: PH_KEY,
        event: event,
        distinct_id: distinctId(),
        properties: Object.assign({ source: 'join_page', device: deviceType() }, props || {})
      });
      // keepalive so the event still sends if the tap navigates away
      fetch(PH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true })
        .catch(function () {});
    } catch (e) { /* analytics must never break the page */ }
  }

  // ── Device detection ────────────────────────────────────────────────────────
  function deviceType() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios';
    if (/Mobi/i.test(ua)) return 'mobile-other';
    return 'desktop';
  }

  // ── Persistence ──────────────────────────────────────────────────────────────
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { 1: !!s[1], 2: !!s[2], 3: !!s[3] };
    } catch (e) { return { 1: false, 2: false, 3: false }; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  var state = loadState();

  function completedCount() {
    return (state[1] ? 1 : 0) + (state[2] ? 1 : 0) + (state[3] ? 1 : 0);
  }

  function render() {
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var card = $('step-' + i);
      var chk = $('chk-' + i);
      if (!card) continue;
      var unlocked = (i === 1) || state[i - 1];
      card.classList.toggle('locked', !unlocked);
      card.classList.toggle('done', !!state[i]);
      if (chk) { chk.checked = !!state[i]; chk.disabled = !unlocked; }
    }

    var done = completedCount();
    var pct = Math.round((done / TOTAL_STEPS) * 100);
    var fill = $('bar-fill');
    if (fill) fill.style.width = pct + '%';
    var lbl = $('progress-label');
    if (lbl) lbl.textContent = 'Step ' + done + ' of ' + TOTAL_STEPS;
    var pctEl = $('progress-pct');
    if (pctEl) pctEl.textContent = pct + '%';

    var allDone = done === TOTAL_STEPS;
    var celebrate = $('celebrate');
    if (celebrate) celebrate.style.display = allDone ? 'block' : 'none';

    // Auto-scroll to the next actionable step (only when newly unlocked)
  }

  function setStep(i, value, viaUser) {
    state[i] = value;
    // Toggling a step off clears later steps to keep the chain honest.
    if (!value) {
      for (var j = i + 1; j <= TOTAL_STEPS; j++) state[j] = false;
    }
    saveState(state);
    render();

    if (value && viaUser) {
      var events = { 1: 'tester_step_group_joined', 2: 'tester_step_opted_in', 3: 'tester_step_installed' };
      track(events[i], { step: i });
      if (i < TOTAL_STEPS) {
        var next = $('step-' + (i + 1));
        if (next) setTimeout(function () { next.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 180);
      } else {
        track('tester_completed', {});
      }
    }
  }

  // ── Device banner ────────────────────────────────────────────────────────────
  function renderDeviceBanner() {
    var d = deviceType();
    var banner = $('device-banner');
    var desktopCard = $('desktop-card');
    if (!banner) return;

    if (d === 'android') {
      banner.className = 'banner ok';
      banner.innerHTML = icon('check') +
        "<div>You're on Android — perfect. Just follow the three steps below.</div>";
    } else if (d === 'ios') {
      // Hide the Android-only step flow and show a direct web CTA instead.
      var stepsArea = document.querySelector('.progress-head');
      var barArea = document.querySelector('.bar');
      ['step-1','step-2','step-3','celebrate'].forEach(function(id) {
        var el = $(id); if (el) el.style.display = 'none';
      });
      if (stepsArea) stepsArea.style.display = 'none';
      if (barArea) barArea.style.display = 'none';
      var resetBtn = $('reset-btn'); if (resetBtn) resetBtn.style.display = 'none';

      banner.className = 'banner warn';
      banner.innerHTML = icon('alert') +
        "<div><b>The app is Android-only right now.</b> On iPhone, use ChildBloom free in Safari — " +
        "it works just as well as the native app.<br><br>" +
        "<a class='btn btn-primary' href='https://childbloom.in' style='display:inline-flex;margin-top:4px;text-decoration:none;" +
        "padding:12px 20px;border-radius:12px;background:linear-gradient(180deg,#40916C,#2D6A4F);color:#fff;" +
        "font-weight:600;font-size:15px;gap:8px;align-items:center;'>" +
        icon('check') + "Open ChildBloom</a>" +
        "<br><br><span style='font-size:13px;'>Have an Android phone? <a href='https://childbloom.in/join' " +
        "style='font-weight:600;'>Open this page there</a> to install the app.</span></div>";
    } else {
      // desktop / other — surface the QR card to move onto a phone
      banner.className = 'banner info';
      banner.innerHTML = icon('phone') +
        "<div>The app installs from the Google Play Store, so the steps work on an <b>Android phone</b>. " +
        "Scan the code below to continue there — or read on to see what's involved.</div>";
      if (desktopCard) desktopCard.style.display = 'block';
    }
  }

  function icon(name) {
    var paths = {
      check: '<path d="m20 6-11 11-5-5"/>',
      alert: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
      phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
    };
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || '') + '</svg>';
  }

  // ── Copy / share ─────────────────────────────────────────────────────────────
  var SHARE_URL = 'https://childbloom.in/join';
  function copyLink() {
    var done = function () { toast('Link copied'); track('tester_link_copied', {}); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SHARE_URL).then(done).catch(fallbackCopy);
    } else { fallbackCopy(); }
  }
  function fallbackCopy() {
    var input = $('share-url');
    if (input) { input.focus(); input.select(); try { document.execCommand('copy'); toast('Link copied'); } catch (e) {} }
  }

  // ── Wire up ──────────────────────────────────────────────────────────────────
  function init() {
    renderDeviceBanner();
    render();

    for (var i = 1; i <= TOTAL_STEPS; i++) {
      (function (n) {
        var chk = $('chk-' + n);
        if (chk) chk.addEventListener('change', function () { setStep(n, chk.checked, true); });
      })(i);
    }

    var bg = $('btn-group');   if (bg) bg.addEventListener('click', function () { track('tester_clicked_group', {}); });
    var bo = $('btn-optin');   if (bo) bo.addEventListener('click', function () { track('tester_clicked_optin', {}); });
    var bi = $('btn-install'); if (bi) bi.addEventListener('click', function () { track('tester_clicked_install', {}); });

    var copy = $('copy-link'); if (copy) copy.addEventListener('click', copyLink);

    var reset = $('reset-btn');
    if (reset) reset.addEventListener('click', function () {
      state = { 1: false, 2: false, 3: false };
      saveState(state);
      render();
      toast('Progress reset');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    track('tester_join_page_view', { returning: completedCount() > 0, progress: completedCount() });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
