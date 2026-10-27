/* ==========================================================================
   DOORWAY V2: UI MICRO-INTERACTIONS (part 6, site layer only)
   Vanilla, no dependencies. Pairs with motion.css. Load after the revamp
   script so its markup exists; safe to load before DOMContentLoaded.

   What it does
   - Reveals: .rv and [data-dw2-reveal] get .in AND .is-in on entering the
     viewport (IntersectionObserver, threshold 0.08, same as revamp).
   - Top bar: .is-scrolled + .dw2-bar--scrolled on the first
     .topbar / .dw2-bar / header once scrollY > 8 (rAF-throttled, passive).
   - Sent tick: adds the drawn SVG tick to the revamp's disabled
     "Interest sent ✓" button after the revamp re-renders it.

   What it never does
   - Never reads or writes the engine background stack (integration.md §1).
   - Never handles revamp's [data-want] click. Revamp owns that click: it
     counts the interest, re-renders the slot view and shows the toast.
     motion.js only records the time of that click (passive, read-only) so
     the tick on the freshly rendered sent button animates once; on any
     later render the tick appears already drawn.
   - No counts, no toasts, no business logic, no copy changes.

   Opt-in paths for assembly (pick ONE per button, never both):
     1. Dispatch  document.dispatchEvent(new CustomEvent("dw2:interest-sent",
                    { detail: { button } }))  after your own send logic.
     2. Mark a button [data-dw2-want] (and NOT [data-want]); a click on it
        calls markInterestSent(button) directly. Assembly still owns the
        send logic and should listen for the same click itself.
   A [data-want] button is never touched by path 2, so the revamp flow is
   never double-handled.

   API: window.__dw2Motion = { armReveal, markInterestSent,
                                enhanceSentButtons, state }
   ========================================================================== */
(function () {
  "use strict";
  if (window.__dw2Motion) return;

  var SENT_LABEL = "Interest sent ✓";        /* revamp wording, verbatim */
  var TICK_SVG =
    '<svg class="dw2-tick" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var FRESH_MS = 1200;                        /* a re-render this soon after a want click animates */

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(mq && mq.matches);         /* read once, like revamp and the engine */
  var hasIO = "IntersectionObserver" in window;

  var observer = null;
  var bar = null;
  var barScrolled = false;
  var ticking = false;
  var lastWantClick = 0;

  /* ---------------- Reveals ---------------- */
  function reveal(el) {
    el.classList.add("in", "is-in");
  }

  function armReveal(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var els = root.querySelectorAll(".rv:not(.in), [data-dw2-reveal]:not(.is-in)");
    if (!els.length) return;
    if (reduced || !hasIO) {
      for (var i = 0; i < els.length; i++) reveal(els[i]);
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].isIntersecting) {
            reveal(entries[j].target);
            observer.unobserve(entries[j].target);
          }
        }
      }, { threshold: 0.08 });
    }
    for (var k = 0; k < els.length; k++) observer.observe(els[k]);
  }

  /* ---------------- Top bar ---------------- */
  function updateBar() {
    ticking = false;
    if (!bar) return;
    var next = (window.scrollY || window.pageYOffset || 0) > 8;
    if (next === barScrolled) return;          /* write only on change */
    barScrolled = next;
    bar.classList.toggle("is-scrolled", next);
    bar.classList.toggle("dw2-bar--scrolled", next);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateBar);
  }

  function armBar() {
    bar = document.querySelector(".topbar, .dw2-bar, header");
    if (!bar) return;
    updateBar();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Stall interest ---------------- */
  function isSentButton(btn) {
    return btn.disabled && (btn.textContent || "").trim() === SENT_LABEL;
  }

  /* Revamp-rendered sent buttons: add the tick, keep the text node as is. */
  function enhanceSentButtons(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var fresh = !reduced && Date.now() - lastWantClick < FRESH_MS;
    var btns = root.querySelectorAll("button[disabled]:not(.is-sent)");
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      if (!isSentButton(btn)) continue;
      if (!fresh) btn.classList.add("dw2-static");
      btn.classList.add("dw2-interest-btn", "is-sent");
      btn.insertAdjacentHTML("afterbegin", TICK_SVG);
    }
  }

  /* Opt-in paths only (custom event or [data-dw2-want]). */
  function markInterestSent(btn) {
    if (!btn || btn.nodeType !== 1) return;
    if (btn.classList.contains("is-sent")) return;
    btn.setAttribute("aria-live", "polite");    /* announces the revamp label, no extra copy */
    btn.disabled = true;
    if (reduced) btn.classList.add("dw2-static");
    btn.classList.add("dw2-interest-btn", "is-sent");
    btn.innerHTML = TICK_SVG;
    btn.appendChild(document.createTextNode(SENT_LABEL));
  }

  /* ---------------- Wiring ---------------- */
  function onClickCapture(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-want]")) {             /* record only; revamp handles it */
      lastWantClick = Date.now();
      return;
    }
    var opt = t.closest("[data-dw2-want]");
    if (opt && !opt.hasAttribute("data-want")) markInterestSent(opt);
  }

  function onSentEvent(e) {
    if (e && e.detail && e.detail.button) markInterestSent(e.detail.button);
  }

  /* Revamp re-renders views by innerHTML. Batch new nodes into one rAF,
     then arm reveals and enhance sent buttons inside those nodes only. */
  var pending = [];
  var mutScheduled = false;
  function flushMutations() {
    mutScheduled = false;
    var roots = pending;
    pending = [];
    for (var i = 0; i < roots.length; i++) {
      if (!roots[i].isConnected) continue;
      enhanceSentButtons(roots[i]);
      armReveal(roots[i]);
    }
  }
  function onMutations(list) {
    for (var i = 0; i < list.length; i++) {
      var t = list[i].target;
      if (list[i].addedNodes.length && t.nodeType === 1 && pending.indexOf(t) < 0) pending.push(t);
    }
    if (pending.length && !mutScheduled) {
      mutScheduled = true;
      window.requestAnimationFrame(flushMutations);
    }
  }

  function boot() {
    armBar();
    enhanceSentButtons(document);
    armReveal(document);
    document.addEventListener("click", onClickCapture, { capture: true, passive: true });
    document.addEventListener("dw2:interest-sent", onSentEvent);
    if ("MutationObserver" in window) {
      var site = document.querySelector(".dw2-site, main") || document.body;
      new MutationObserver(onMutations).observe(site, { childList: true, subtree: true });
    }
  }

  window.__dw2Motion = {
    armReveal: armReveal,
    markInterestSent: markInterestSent,
    enhanceSentButtons: enhanceSentButtons,
    state: function () {
      return {
        reducedMotion: reduced,
        hasIntersectionObserver: hasIO,
        bar: bar ? (bar.className || bar.tagName.toLowerCase()) : null,
        barScrolled: barScrolled
      };
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
