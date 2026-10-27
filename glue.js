/* Doorway v2 — ASSEMBLY GLUE, not a worker part.
   Loaded after engine.js. Two jobs:
   1. Home-view sync. The home view is section#view-home: it is the .view that
      carries .on at boot, and the app's go('home') toggles .on onto
      'view-' + 'home'. When it loses .on, #dw2-bg gets .dw2-off (display:none,
      dw2-glue.css); when it regains .on, .dw2-off is removed and
      ScrollTrigger is refreshed.
   2. Toran fade. The app scrolls the window (window.scrollTo), so progress is
      scrollY / (scrollHeight - innerHeight). Opacity/transform only.
   Every lookup is guarded: a missing element never throws. */
(function () {
  'use strict';

  var bg = document.getElementById('dw2-bg');
  var home = document.getElementById('view-home');
  var toran = bg ? bg.querySelector('.dw2-toran') : null;

  /* ---- 1. home-view sync ---- */
  function syncHome() {
    if (!bg || !home) return;
    var onHome = home.classList.contains('on');
    var wasOff = bg.classList.contains('dw2-off');
    bg.classList.toggle('dw2-off', !onHome);
    if (onHome && wasOff) {
      try {
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
          window.ScrollTrigger.refresh();
        }
      } catch (e) { /* refresh is best-effort */ }
      requestFrame();
    }
  }

  if (bg && home && typeof MutationObserver === 'function') {
    var views = document.querySelectorAll('.view');
    var mo = new MutationObserver(syncHome);
    for (var i = 0; i < views.length; i++) {
      mo.observe(views[i], { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ---- 2. toran fade ---- */
  var FADE_END = 0.12;
  var LIFT_PX = -8;
  var ticking = false;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function renderToran() {
    ticking = false;
    if (!toran) return;
    var doc = document.documentElement;
    var max = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
    var p = max > 0 ? clamp01((window.scrollY || window.pageYOffset || 0) / max) : 0;
    var t = clamp01(p / FADE_END);
    toran.style.opacity = String(1 - t);
    toran.style.transform = 'translateX(-50%) translateY(' + (LIFT_PX * t).toFixed(2) + 'px)';
  }

  function requestFrame() {
    if (ticking || !toran) return;
    ticking = true;
    window.requestAnimationFrame(renderToran);
  }

  if (toran) {
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame, { passive: true });
  }

  syncHome();
  requestFrame();
})();
