/* Doorway v2 — ASSEMBLY GLUE, not a worker part.
   Decorates the app's real rendered cards to the specimen contract in
   parts/listing-design/cards.html, styled by dw2-cards.css. Loaded after
   glue.js and before motion.js.

   The app builds cards as strings (cardHTML / slotCardHTML) and re-renders
   views by innerHTML (home rails, Discover grid + filters/search, detail
   "Similar" rail, Stalls grid). So this file decorates on first load and
   after every re-render: a MutationObserver on main.wrap, batched into one
   rAF. Each card is marked data-dw2-done and never decorated twice.

   Per card it only ADDS elements (and .is-ended on Ended cards). No existing
   text node or element is changed or removed:
     - breakout   svg.ooru-sym.dw2-card-breakout, first child of the article
                  (events: diya / marigold-cluster cycling by index within
                  the rail or grid; stalls: always the stall awning)
     - cut/photo  div.dw2-card-cut > img.dw2-card-photo inside .card-scene,
                  placed after the app's own disc + sky so it covers them and
                  sits under the chips (z 2) and the signage (z 1)
     - signage    div.dw2-card-signage with the signage-board symbol and the
                  festival name as HTML text, last in .card-scene
   Every lookup is guarded: a missing element never throws. */
(function () {
  'use strict';

  var SPRITE = 'symbols.svg';
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* Stand-in scenes, as in the specimen (pandal-far for events, the two
     stall rows for stalls). Event focus points cycle the specimen's four. */
  var EVENT_PHOTO = 'pandal-far.jpg';
  var EVENT_FOCUS = ['50% 46%', '28% 50%', '72% 44%', '50% 62%'];
  var STALL_PHOTOS = ['stalls-left.jpg', 'stalls-right.jpg'];
  var STALL_FOCUS = '50% 58%';

  var EVENT_BREAKOUTS = ['diya', 'marigold-cluster'];

  function symbol(name, viewBox, extraClass) {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'ooru-sym ooru-sym--' + name + (extraClass ? ' ' + extraClass : ''));
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', SPRITE + '#ooru-' + name);
    svg.appendChild(use);
    return svg;
  }

  /* Event cards: the festival is the text of the card's own .card-fest line,
     minus the rating span. */
  function eventFestival(card) {
    var fest = card.querySelector('.card-fest');
    if (!fest) return '';
    var text = '';
    for (var n = fest.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) text += n.nodeValue;
    }
    return text.trim();
  }

  /* Stall cards: their .card-fest line is the stall type ("Food stall ·
     Canopy"), not a festival. The festival comes from the slot's event in
     the app's own data (SLOTS / LISTINGS, top-level consts of the app
     script), exactly as the specimen's stall boards read "Diwali". */
  function stallFestival(card) {
    var id = card.getAttribute('data-slot');
    try {
      if (typeof SLOTS === 'undefined' || typeof LISTINGS === 'undefined') return '';
      var slot = null, ev = null, i;
      for (i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) { slot = SLOTS[i]; break; }
      if (!slot) return '';
      for (i = 0; i < LISTINGS.length; i++) if (LISTINGS[i].id === slot.eventId) { ev = LISTINGS[i]; break; }
      return ev && ev.festival ? String(ev.festival) : '';
    } catch (e) {
      return '';
    }
  }

  /* Position among siblings of the same kind, so every rail/grid restarts
     its breakout cycle at the diya. */
  function indexOfKind(card, attr) {
    var idx = 0;
    for (var s = card.previousElementSibling; s; s = s.previousElementSibling) {
      if (s.classList && s.classList.contains('card') && s.hasAttribute(attr)) idx++;
    }
    return idx;
  }

  function decorate(card) {
    card.setAttribute('data-dw2-done', '');
    var scene = card.querySelector('.card-scene');
    if (!scene) return;

    var isStall = card.hasAttribute('data-slot');
    var idx = indexOfKind(card, isStall ? 'data-slot' : 'data-open');

    /* Ended: the greyed scene exactly as dw2-cards.css defines it. */
    if (!isStall && card.querySelector('.chip-status.ended')) card.classList.add('is-ended');

    /* Breakout: one per card, first child of the article. */
    var bName = isStall ? 'stall-awning' : EVENT_BREAKOUTS[idx % EVENT_BREAKOUTS.length];
    var breakout = symbol(bName, isStall ? '0 0 72 48' : '0 0 48 48', 'dw2-card-breakout');
    breakout.setAttribute('aria-hidden', 'true');
    card.insertBefore(breakout, card.firstChild);

    /* Cut photo layer: after the app's disc + sky, before the chips. */
    var cut = document.createElement('div');
    cut.className = 'dw2-card-cut';
    var img = document.createElement('img');
    img.className = 'dw2-card-photo';
    img.src = isStall ? STALL_PHOTOS[idx % STALL_PHOTOS.length] : EVENT_PHOTO;
    img.alt = '';
    img.setAttribute('style', '--dw2-card-focus: ' + (isStall ? STALL_FOCUS : EVENT_FOCUS[idx % EVENT_FOCUS.length]));
    cut.appendChild(img);
    var firstChip = scene.querySelector('.chip-date, .chip-status, .tag-sample');
    scene.insertBefore(cut, firstChip && firstChip.parentNode === scene ? firstChip : null);

    /* Signage: board + festival name, last in the scene. */
    var name = isStall ? stallFestival(card) : eventFestival(card);
    if (name) {
      var sign = document.createElement('div');
      sign.className = 'dw2-card-signage';
      sign.setAttribute('aria-hidden', 'true');
      sign.appendChild(symbol('signage-board', '0 0 56 48'));
      var text = document.createElement('span');
      text.className = 'dw2-card-signage-text';
      text.textContent = name;
      sign.appendChild(text);
      scene.appendChild(sign);
    }
  }

  function decorateAll(root) {
    if (!root || !root.querySelectorAll) return;
    var cards = root.querySelectorAll('article.card[data-open]:not([data-dw2-done]), article.card[data-slot]:not([data-dw2-done])');
    for (var i = 0; i < cards.length; i++) decorate(cards[i]);
  }

  var main = document.querySelector('main.wrap') || document.querySelector('main') || document.body;
  var scheduled = false;
  function flush() {
    scheduled = false;
    decorateAll(main);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(flush);
  }

  function boot() {
    decorateAll(main);
    if (typeof MutationObserver === 'function') {
      new MutationObserver(schedule).observe(main, { childList: true, subtree: true });
    }
  }

  window.__dw2Decorate = { decorateAll: decorateAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
