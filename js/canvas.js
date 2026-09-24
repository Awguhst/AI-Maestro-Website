/* =========================================================================
   AI MAESTRO — the canvas section
   Two moving parts: a signal that travels the pipeline wires, and the
   refusal inspector that cycles through its examples. Both are progressive
   enhancement; the section reads correctly with this file removed.
   ========================================================================= */
(function () {
  'use strict';

  var sec = document.getElementById('workflow');
  if (!sec) return;

  var one = function (sel) { return sec.querySelector(sel); };
  var all = function (sel) {
    return Array.prototype.slice.call(sec.querySelectorAll(sel));
  };

  var pulse = one('[data-wf-pulse]');
  var items = all('[data-refusal]');
  var dots  = all('[data-refusal-dot]');
  var idx   = one('[data-refusal-idx]');

  if (!pulse && !items.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The pulse rides one continuous path from the data node's output to the
     results node's input (182 -> 1018 in viewBox units). It runs behind the
     node boxes, so the signal disappears into each stage and comes out the
     far side. A dash pattern per wire segment would restart at every subpath
     and make all five gaps blink in unison instead. */
  var WIRE = 836;
  var SWEEP = 3400;   /* ms — data to results                               */
  var HOLD = 5600;    /* ms — how long one refusal example stays up         */

  /* ---- the refusal inspector -------------------------------------------- */
  var current = 0;
  var taken = false;  /* once the viewer picks an example, stop rotating     */

  function show(n) {
    if (!items.length) return;
    current = ((n % items.length) + items.length) % items.length;
    items.forEach(function (el, i) { el.classList.toggle('is-active', i === current); });
    dots.forEach(function (d, i) { d.setAttribute('aria-pressed', String(i === current)); });
    if (idx) idx.textContent = ('0' + (current + 1)).slice(-2);
  }

  show(0);

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      taken = true;
      show(i);
    });
  });

  /* The controls only do something once this file is running. */
  var panel = one('.s-canvas__panel');
  if (panel) panel.classList.add('is-live');

  /* Reading an example should not have it swapped out mid-sentence. */
  var held = false;
  if (panel) {
    ['mouseenter', 'focusin'].forEach(function (ev) {
      panel.addEventListener(ev, function () { held = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      panel.addEventListener(ev, function () { held = false; });
    });
  }

  /* Reduced motion: first example stays put, diagram stays drawn. */
  if (reduced) return;

  /* ---- one loop drives both --------------------------------------------- */
  var running = false;
  var frame = 0;
  var t0 = 0;
  var tSwap = 0;

  function tick(now) {
    if (!running) return;

    if (pulse) {
      var p = ((now - t0) % SWEEP) / SWEEP;
      pulse.style.strokeDashoffset = (-p * WIRE).toFixed(2) + 'px';
    }

    if (held) { tSwap = now; }

    if (!taken && !held && items.length > 1 && now - tSwap >= HOLD) {
      tSwap = now;
      show(current + 1);
    }

    frame = window.requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    t0 = tSwap = window.performance ? performance.now() : 0;
    frame = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  /* ---- run only while the section is on screen and the tab is in front --- */
  var onScreen = false;
  var sync = function () {
    if (onScreen && !document.hidden) start(); else stop();
  };

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { onScreen = e.isIntersecting; });
      sync();
    }, { threshold: 0.12 });
    io.observe(sec);
  } else {
    onScreen = true;
    sync();
  }

  document.addEventListener('visibilitychange', sync);
})();
