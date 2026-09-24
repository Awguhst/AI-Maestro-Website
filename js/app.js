/* =========================================================================
   AI MAESTRO — site behaviour
   Progressive enhancement only: every section is readable and usable with
   this file removed. No dependencies, no build step.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ---- header: solid once the page has moved ---------------------------- */
  function initHeader() {
    var hdr = $('.hdr');
    if (!hdr) return;
    var tick = function () { hdr.classList.toggle('is-stuck', window.scrollY > 24); };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }

  /* ---- mobile navigation ------------------------------------------------ */
  function initNav() {
    var burger = $('.burger');
    var nav = $('#site-nav');
    if (!burger || !nav) return;

    var setOpen = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open && window.innerWidth <= 860 ? 'hidden' : '';
      /* The drawer precedes the burger in the DOM, so without this Tab would
         skip straight past it into the page behind. The reflow matters: the
         drawer is still computed visibility:hidden until the class toggle is
         flushed, and focus() on a hidden subtree is silently dropped. */
      if (open) {
        var first = nav.querySelector('a');
        if (first) {
          void nav.offsetHeight;
          first.focus();
        }
      }
    };

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---- scroll spy ------------------------------------------------------- */
  function initSpy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) { map[id] = link; targets.push(el); }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-current'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---- reveal on scroll ------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    /* auto-stagger direct children of a [data-stagger] container */
    $$('[data-stagger]').forEach(function (group) {
      var step = parseFloat(group.getAttribute('data-stagger')) || 0.07;
      $$('.reveal', group).forEach(function (child, i) {
        if (!child.style.getPropertyValue('--d')) {
          child.style.setProperty('--d', (i * step).toFixed(3) + 's');
        }
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- screenshot placeholders -----------------------------------------
     A .shot whose image has not been supplied yet falls back to the
     technical placeholder instead of a broken-image icon.
     ---------------------------------------------------------------------- */
  function initShots() {
    $$('.shot').forEach(function (fig) {
      var img = $('img', fig);
      if (!img) { fig.classList.add('is-missing'); return; }
      var miss = function () { fig.classList.add('is-missing'); };
      var check = function () { if (!img.naturalWidth) miss(); };
      if (img.complete) { check(); }
      else {
        img.addEventListener('error', miss, { once: true });
        img.addEventListener('load', check, { once: true });
      }
    });
  }

  /* ---- accordion -------------------------------------------------------
     Enhances native <details>. Without JS they still open and close.
     Markup contract: [data-accordion] > details > summary + [data-panel]
     ---------------------------------------------------------------------- */
  function initAccordion() {
    /* Animate height from -> to, then hand back to CSS. The forced reflow is
       load-bearing: without it both style writes land in one frame and the
       browser interpolates from `auto`, which is not animatable, so no
       transition starts and transitionend never fires. The timeout is the
       safety net for an interrupted or suppressed transition. */
    var animate = function (panel, from, to, after) {
      if (panel._settle) panel._settle();

      panel.style.height = from + 'px';
      void panel.offsetHeight;
      panel.style.height = to + 'px';

      var timer = 0;
      var settle = function (e) {
        if (e && e.target !== panel) return;
        panel.removeEventListener('transitionend', settle);
        clearTimeout(timer);
        panel._settle = null;
        if (after) after();
        panel.style.height = '';
      };

      panel._settle = settle;
      timer = setTimeout(settle, 600);
      panel.addEventListener('transitionend', settle);
    };

    $$('[data-accordion]').forEach(function (group) {
      var single = group.getAttribute('data-accordion') === 'single';
      var items = $$('details', group);

      var shut = function (d) {
        var panel = $('[data-panel]', d);
        if (!panel || reduced) { d.open = false; return; }
        animate(panel, panel.scrollHeight, 0, function () { d.open = false; });
      };

      items.forEach(function (d) {
        var summary = $('summary', d);
        var panel = $('[data-panel]', d);
        if (!summary || !panel) return;

        summary.addEventListener('click', function (e) {
          e.preventDefault();

          if (d.open) { shut(d); return; }

          if (single) {
            items.forEach(function (other) { if (other !== d && other.open) shut(other); });
          }

          d.open = true;
          if (reduced) return;
          animate(panel, 0, panel.scrollHeight, null);
        });
      });
    });
  }

  /* ---- footer year ------------------------------------------------------ */
  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function boot() {
    initHeader();
    initNav();
    initSpy();
    initReveal();
    initShots();
    initAccordion();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
