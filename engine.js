/* DW2 ASSEMBLY COPY of parts/engine-code/engine.js. Exactly two tunings, marked inline:
 *   VEIL_MAX_OPACITY    0.52 -> 0.60
 *   SOFTEN_MAX_BLUR_PX  3.5  -> 5.5
 * Both resolve the CONFLICT notes in parts/design-system/tokens.css (design law).
 * parts/engine-code/engine.js remains the verbatim GPT original.
 */
/* Doorway v2 production engine for ooru.
 * DOM: #dw2-bg contains fixed background layers, edge strips, door leaves, and veil.
 * API: window.__dw2 = { setProgress(p), open(), state() }.
 * Progress map: p [0, .12] passes through doors; p [0, 1] walks far/mid/edges;
 * p [.35, .75] settles the shared blur and cream veil.
 */
(function () {
  'use strict';

  if (
    window.__dw2 &&
    typeof window.__dw2.setProgress === 'function' &&
    typeof window.__dw2.open === 'function' &&
    typeof window.__dw2.state === 'function'
  ) {
    return;
  }

  /* Tunable scene constants. All scales stay within the modest 1 -> 1.30 walk law. */
  var DOOR_WAIT_MS = 550;
  var DOOR_DURATION_MS = 1600;
  var DOOR_PASS_START = 0;
  var DOOR_PASS_END = 0.12;
  var DOOR_FADE_START = 0.055;
  var SOFTEN_START = 0.35;
  var SOFTEN_END = 0.75;
  var FAR_MAX_SCALE = 1.08;
  var MID_MAX_SCALE = 1.20;
  var EDGE_MAX_SCALE = 1.30;
  var MID_OUTWARD_PX = 44;
  var EDGE_OUTWARD_PX = 112;
  var DOOR_PASS_OUTWARD_PX = 118;
  var DOOR_PASS_SCALE = 1.06;
  var SOFTEN_MAX_BLUR_PX = 5.5; /* DW2 ASSEMBLY TUNING: design-system tokens.css is design law (CONFLICT resolved for the recipe) */
  var VEIL_MAX_OPACITY = 0.60; /* DW2 ASSEMBLY TUNING: design-system tokens.css is design law (CONFLICT resolved for the recipe) */
  var REDUCED_LAYER_OPACITY = 0.34;
  var REDUCED_VEIL_OPACITY = 0.24;
  var SCRUB_SECONDS = 0.4;

  var queryMode = new URLSearchParams(window.location.search).get('dw2');
  var testMode = queryMode === 'shut' ? 'shut' : queryMode === 'open' ? 'open' : '';
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var isHidden = document.hidden;
  var state = {
    progress: testMode === 'shut' || reducedMotion ? 0 : 0,
    door: testMode === 'shut' ? 0 : (testMode === 'open' || reducedMotion ? 1 : 0)
  };

  var bg;
  var els;
  var doorTween = null;
  var walkTween = null;
  var walkTrigger = null;
  var doorRaf = 0;
  var scrollRaf = 0;
  var refreshTimer = 0;
  var doorElapsed = 0;
  var doorLastTime = 0;
  var scrollListening = false;
  var destroyed = false;

  function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  function range(value, start, end) {
    return clamp01((value - start) / (end - start));
  }

  /* Same exponential curve used by the vanilla door clock and progress segments. */
  function expoOut(value) {
    return value >= 1 ? 1 : 1 - Math.pow(2, -10 * value);
  }

  function gentleWalk(value) {
    return 1 - Math.pow(1 - clamp01(value), 1.45);
  }

  function maxScroll() {
    var root = document.documentElement;
    return Math.max(1, root.scrollHeight - window.innerHeight);
  }

  function currentScrollProgress() {
    return clamp01((window.pageYOffset || window.scrollY || 0) / maxScroll());
  }

  function edgeTravelFactor() {
    /* Narrow screens need less lateral travel so the strips do not dominate the view. */
    return window.innerWidth < 640 ? 0.72 : 1;
  }

  function setStyle(element, transform, opacity, filter, visibility) {
    if (!element) return;
    element.style.transform = transform;
    element.style.opacity = String(opacity);
    element.style.filter = filter;
    element.style.visibility = visibility;
  }

  function render() {
    if (!els) return;

    var p = state.progress;
    var narrowFactor = edgeTravelFactor();

    if (reducedMotion) {
      setStyle(els.far, 'scale(1)', REDUCED_LAYER_OPACITY, 'blur(0px)', 'visible');
      setStyle(els.mid, 'translateX(0px) scale(1)', REDUCED_LAYER_OPACITY, 'blur(0px)', 'visible');
      setStyle(els.edgeLeft, 'translateX(0px) scale(1)', REDUCED_LAYER_OPACITY, 'blur(0px)', 'visible');
      setStyle(els.edgeRight, 'translateX(0px) scale(1)', REDUCED_LAYER_OPACITY, 'blur(0px)', 'visible');
      if (els.veil) els.veil.style.opacity = String(REDUCED_VEIL_OPACITY);
    } else {
      var walk = gentleWalk(p);
      var soften = expoOut(range(p, SOFTEN_START, SOFTEN_END));
      var blur = SOFTEN_MAX_BLUR_PX * soften;
      var filter = 'blur(' + blur.toFixed(2) + 'px)';
      var lateStreetOpacity = 1 - 0.08 * expoOut(range(p, 0.78, 1));

      setStyle(
        els.far,
        'translate3d(0,' + (walk * -5).toFixed(2) + 'px,0) scale(' +
          (1 + (FAR_MAX_SCALE - 1) * walk).toFixed(4) + ')',
        lateStreetOpacity,
        filter,
        'visible'
      );
      setStyle(
        els.mid,
        'translate3d(' + (MID_OUTWARD_PX * walk * narrowFactor).toFixed(2) +
          'px,' + (walk * -9).toFixed(2) + 'px,0) scale(' +
          (1 + (MID_MAX_SCALE - 1) * walk).toFixed(4) + ')',
        lateStreetOpacity,
        filter,
        'visible'
      );
      setStyle(
        els.edgeLeft,
        'translate3d(' + (-EDGE_OUTWARD_PX * walk * narrowFactor).toFixed(2) +
          'px,0,0) scale(' + (1 + (EDGE_MAX_SCALE - 1) * walk).toFixed(4) + ')',
        lateStreetOpacity,
        filter,
        'visible'
      );
      setStyle(
        els.edgeRight,
        'translate3d(' + (EDGE_OUTWARD_PX * walk * narrowFactor).toFixed(2) +
          'px,0,0) scale(' + (1 + (EDGE_MAX_SCALE - 1) * walk).toFixed(4) + ')',
        lateStreetOpacity,
        filter,
        'visible'
      );
      if (els.veil) els.veil.style.opacity = String(VEIL_MAX_OPACITY * soften);
    }

    /*
     * Fix: opening and pass-through are separate motions. Door progress swings each
     * leaf open; the first scroll segment then carries that already-open pose outward.
     */
    var pass = reducedMotion ? 0 : expoOut(range(p, DOOR_PASS_START, DOOR_PASS_END));
    var fade = reducedMotion ? 0 : expoOut(range(p, DOOR_FADE_START, DOOR_PASS_END));
    var doorOpacity = 1 - fade;
    var doorVisible = doorOpacity <= 0.001 ? 'hidden' : 'visible';
    var openAngle = 82 * state.door;
    var outward = DOOR_PASS_OUTWARD_PX * pass * narrowFactor;
    var doorScale = 1 + (DOOR_PASS_SCALE - 1) * pass;

    /*
     * Hinged door mechanism: rotation exposes the street; the later translation is
     * only the viewer passing through the opened doorway, never a container mega-zoom.
     */
    setStyle(
      els.doorLeft,
      'translate3d(' + (-outward).toFixed(2) + 'px,0,0) rotateY(' +
        (-openAngle).toFixed(2) + 'deg) scale(' + doorScale.toFixed(4) + ')',
      doorOpacity,
      'none',
      doorVisible
    );
    setStyle(
      els.doorRight,
      'translate3d(' + outward.toFixed(2) + 'px,0,0) rotateY(' +
        openAngle.toFixed(2) + 'deg) scale(' + doorScale.toFixed(4) + ')',
      doorOpacity,
      'none',
      doorVisible
    );
  }

  function cancelDoorAnimation() {
    if (doorTween) {
      doorTween.kill();
      doorTween = null;
    }
    if (doorRaf) {
      cancelAnimationFrame(doorRaf);
      doorRaf = 0;
    }
    doorLastTime = 0;
  }

  function stopScrollDriver() {
    if (walkTrigger) {
      walkTrigger.kill();
      walkTrigger = null;
    }
    if (walkTween) {
      walkTween.kill();
      walkTween = null;
    }
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    }
    if (scrollListening) {
      window.removeEventListener('scroll', scheduleVanillaScroll);
      scrollListening = false;
    }
  }

  function teardown() {
    destroyed = true;
    cancelDoorAnimation();
    stopScrollDriver();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('load', onLoad);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (refreshTimer) window.clearTimeout(refreshTimer);
  }

  function startVanillaDoor() {
    if (isHidden || state.door >= 1 || destroyed) return;

    function tick(now) {
      if (destroyed || isHidden) {
        doorRaf = 0;
        return;
      }

      if (!doorLastTime) doorLastTime = now;
      doorElapsed += now - doorLastTime;
      doorLastTime = now;

      if (doorElapsed >= DOOR_WAIT_MS) {
        state.door = expoOut((doorElapsed - DOOR_WAIT_MS) / DOOR_DURATION_MS);
        render();
      }

      if (state.door < 1) {
        doorRaf = requestAnimationFrame(tick);
      } else {
        doorRaf = 0;
      }
    }

    doorRaf = requestAnimationFrame(tick);
  }

  function startDoorAnimation() {
    if (reducedMotion || testMode || isHidden || destroyed) return;

    if (hasGsap) {
      doorTween = window.gsap.to(state, {
        door: 1,
        duration: DOOR_DURATION_MS / 1000,
        delay: DOOR_WAIT_MS / 1000,
        ease: 'expo.out',
        onUpdate: render
      });
    } else {
      startVanillaDoor();
    }
  }

  function scheduleVanillaScroll() {
    if (isHidden || scrollRaf || destroyed) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      if (isHidden || destroyed) return;
      state.progress = currentScrollProgress();
      render();
    });
  }

  function startScrollDriver() {
    if (reducedMotion || testMode === 'shut' || destroyed) return;

    if (hasGsap) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      var proxy = { progress: state.progress };

      walkTween = window.gsap.to(proxy, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: function () {
            return '+=' + maxScroll();
          },
          scrub: SCRUB_SECONDS,
          invalidateOnRefresh: true,
          onUpdate: function (trigger) {
            if (isHidden) return;
            state.progress = clamp01(trigger.progress);
            render();
          }
        }
      });
      walkTrigger = walkTween.scrollTrigger;
    } else {
      scrollListening = true;
      window.addEventListener('scroll', scheduleVanillaScroll, { passive: true });
      scheduleVanillaScroll();
    }
  }

  function syncToScroll() {
    if (reducedMotion || testMode === 'shut') return;
    state.progress = currentScrollProgress();
    render();
  }

  function onResize() {
    if (destroyed) return;

    if (hasGsap && walkTrigger) {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(function () {
        refreshTimer = 0;
        if (!isHidden && walkTrigger) window.ScrollTrigger.refresh();
      }, 120);
    } else {
      scheduleVanillaScroll();
    }

    render();
  }

  function onLoad() {
    if (hasGsap && walkTrigger && !isHidden) {
      window.ScrollTrigger.refresh();
    }
    syncToScroll();
  }

  function onVisibilityChange() {
    isHidden = document.hidden;

    if (isHidden) {
      if (doorTween) doorTween.pause();
      if (doorRaf) {
        cancelAnimationFrame(doorRaf);
        doorRaf = 0;
      }
      if (scrollRaf) {
        cancelAnimationFrame(scrollRaf);
        scrollRaf = 0;
      }
      if (walkTrigger) walkTrigger.disable(false, false);
      return;
    }

    if (walkTrigger) {
      walkTrigger.enable(false, false);
      window.ScrollTrigger.refresh();
    }

    syncToScroll();

    if (doorTween && state.door < 1) {
      doorTween.resume();
    } else if (!hasGsap && !reducedMotion && !testMode && state.door < 1) {
      startVanillaDoor();
    }

    if (!hasGsap && scrollListening) scheduleVanillaScroll();
  }

  function ensureDom() {
    bg = document.getElementById('dw2-bg');

    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'dw2-bg';
      bg.setAttribute('aria-hidden', 'true');

      [
        'dw2-layer-far',
        'dw2-layer-mid',
        'dw2-edge-left',
        'dw2-edge-right',
        'dw2-door-left',
        'dw2-door-right',
        'dw2-veil'
      ].forEach(function (className) {
        var child = document.createElement('div');
        child.className = className;
        bg.appendChild(child);
      });

      document.body.insertBefore(bg, document.body.firstChild);
    } else {
      bg.setAttribute('aria-hidden', 'true');
    }

    els = {
      far: bg.querySelector('.dw2-layer-far'),
      mid: bg.querySelector('.dw2-layer-mid'),
      edgeLeft: bg.querySelector('.dw2-edge-left'),
      edgeRight: bg.querySelector('.dw2-edge-right'),
      doorLeft: bg.querySelector('.dw2-door-left'),
      doorRight: bg.querySelector('.dw2-door-right'),
      veil: bg.querySelector('.dw2-veil')
    };

    /* Far and mid layers scale around the street's central vanishing point. */
    if (els.far) els.far.style.transformOrigin = '50% 48%';
    if (els.mid) els.mid.style.transformOrigin = '50% 50%';

    /* Edge strips grow outward from the outer perimeter, preserving the corridor. */
    if (els.edgeLeft) els.edgeLeft.style.transformOrigin = '0% 50%';
    if (els.edgeRight) els.edgeRight.style.transformOrigin = '100% 50%';

    /* Each leaf rotates around its exterior hinged edge, away from the street centre. */
    if (els.doorLeft) els.doorLeft.style.transformOrigin = '0% 50%';
    if (els.doorRight) els.doorRight.style.transformOrigin = '100% 50%';
  }

  ensureDom();

  /*
   * Fix: reduced motion is a real static mode. The preference is read at boot so no
   * scrub, door tween, or rAF driver is ever created for that mode.
   */
  render();

  if (!reducedMotion && testMode !== 'shut') {
    startDoorAnimation();
    startScrollDriver();
  }

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', onLoad);
  document.addEventListener('visibilitychange', onVisibilityChange);

  window.__dw2 = {
    setProgress: function (progress) {
      state.progress = clamp01(Number(progress) || 0);
      render();
    },
    open: function () {
      cancelDoorAnimation();
      state.door = 1;
      render();
    },
    state: function () {
      return {
        progress: state.progress,
        door: state.door,
        hasGsap: hasGsap,
        reducedMotion: reducedMotion,
        hidden: isHidden,
        mode: reducedMotion ? 'reduced' : testMode === 'shut' ? 'shut' :
          state.door >= 1 ? 'open' : (hasGsap ? 'gsap' : 'vanilla')
      };
    }
  };

  /* Kept internal for lifecycle-safe embedding; intentionally not part of the public API. */
  void teardown;
})();
