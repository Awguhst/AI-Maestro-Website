/* =========================================================================
   AI MAESTRO : site behaviour
   Progressive enhancement only: every section is readable and usable with
   this file removed. No dependencies, no build step.
   ========================================================================= */
(function () {
  'use strict';

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motion.matches;
  motion.addEventListener('change', function (e) { reduced = e.matches; });
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
    motion.addEventListener('change', function () {
      if (!reduced) return;
      items.forEach(function (el) { el.classList.add('is-in'); });
      io.disconnect();
    });
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

  /* Full size images, with native modal focus management and Escape. */
  function initPreviews() {
    if (!('HTMLDialogElement' in window)) return;
    var modal = document.createElement('dialog');
    modal.className = 'preview';
    modal.setAttribute('aria-label', 'App screenshot');
    modal.innerHTML = '<form method="dialog"><button class="preview__close" autofocus>Close <span aria-hidden="true">×</span></button></form><div class="preview__scroll"><img alt=""></div><p class="preview__caption"></p>';
    document.body.appendChild(modal);
    var full = $('img', modal);
    var caption = $('.preview__caption', modal);
    var previousOverflow = '';
    $$('[data-preview]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (link.closest('.is-missing')) return;
        e.preventDefault();
        var thumbnail = $('img', link);
        full.src = link.href;
        full.alt = thumbnail.alt;
        caption.textContent = thumbnail.alt;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modal.showModal();
        $('.preview__scroll', modal).scrollTo(0, 0);
      });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.close();
    });
    modal.addEventListener('close', function () {
      document.body.style.overflow = previousOverflow;
    });
  }

  /* ---- accordion -------------------------------------------------------
     Enhances native <details>. Without JS they still open and close.
     Markup contract: [data-accordion] > details > summary + [data-panel]
     ---------------------------------------------------------------------- */
  function initAccordion() {
    $$('[data-accordion]').forEach(function (group) {
      var items = $$('details', group);
      items.forEach(function (d) {
        var summary = $('summary', d);
        var panel = $('[data-panel]', d);
        if (!summary || !panel) return;
        var desired = d.open;
        var animation = null;
        d.dataset.expanded = String(desired);
        summary.setAttribute('aria-expanded', String(desired));

        var settle = function () {
          if (animation) {
            animation.onfinish = null;
            animation.cancel();
            animation = null;
          }
          d.open = desired;
        };

        // Read the current rendered height before canceling an interrupted tween.
        // Closed details can still report the hidden panel's natural height.
        var setOpen = function (open) {
          if (desired === open && (animation || d.open === open)) return;
          var from = d.open ? panel.getBoundingClientRect().height : 0;
          desired = open;
          d.dataset.expanded = String(open);
          summary.setAttribute('aria-expanded', String(open));
          if (animation) {
            animation.onfinish = null;
            animation.cancel();
            animation = null;
          }
          if (reduced || !panel.animate) { settle(); return; }
          d.open = true;
          animation = panel.animate([
            { height: from + 'px' },
            { height: (open ? panel.scrollHeight : 0) + 'px' }
          ], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          animation.onfinish = function () { d.open = desired; animation = null; };
        };
        d._setExpanded = setOpen;
        summary.addEventListener('click', function (e) {
          e.preventDefault();
          var opening = !desired;
          if (opening && group.getAttribute('data-accordion') === 'single') {
            items.forEach(function (other) {
              if (other !== d && other.open && other._setExpanded) other._setExpanded(false);
            });
          }
          setOpen(opening);
        });
        motion.addEventListener('change', function () {
          if (reduced) settle();
        });
        // A width change reflows answer text; release any old pixel-height tween.
        window.addEventListener('resize', settle, { passive: true });
      });
    });
  }

  /* A fixed glow texture moves on its own layer. Keep each card's position
     while it fades so crossing an edge never teleports a visible light. */
  function initSpotlight() {
    var pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var lights = new WeakMap();
    var active = null;
    var frame = 0;
    var previous = 0;
    var clientX = null, clientY = null;
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (active) active.classList.remove('is-lit');
      active = null;
    }
    function leave() { stop(); clientX = clientY = null; }
    function paint(light) {
      light.el.style.transform = 'translate3d(' + light.x.toFixed(2) + 'px,' + light.y.toFixed(2) + 'px,0)';
    }
    function tick(now) {
      frame = 0;
      if (!active || reduced || document.hidden) return;
      var light = lights.get(active);
      var rect = active.getBoundingClientRect();
      var targetX = clientX - rect.left, targetY = clientY - rect.top;
      var dt = previous ? Math.min(now - previous, 32) : 16;
      previous = now;
      var blend = 1 - Math.exp(-dt / 110);
      light.x += (targetX - light.x) * blend;
      light.y += (targetY - light.y) * blend;
      paint(light);
      if (!active.classList.contains('is-lit')) active.classList.add('is-lit');
      if (Math.abs(targetX - light.x) + Math.abs(targetY - light.y) > 0.1) {
        frame = requestAnimationFrame(tick);
      } else { previous = 0; }
    }
    function track(card) {
      if (!card) { stop(); return; }
      if (card !== active) {
        stop();
        active = card;
        if (!lights.has(card)) {
          var clip = document.createElement('span');
          clip.className = 'card__glow';
          clip.setAttribute('aria-hidden', 'true');
          var el = document.createElement('span');
          el.className = 'card__glow-light';
          clip.appendChild(el);
          card.appendChild(clip);
          var rect = card.getBoundingClientRect();
          var light = { el: el, x: clientX - rect.left, y: clientY - rect.top };
          lights.set(card, light);
          paint(light);
        }
      }
      if (!frame) frame = requestAnimationFrame(tick);
    }
    document.addEventListener('pointermove', function (e) {
      if (reduced || !pointer.matches || e.pointerType === 'touch') return;
      clientX = e.clientX;
      clientY = e.clientY;
      track(e.target.closest ? e.target.closest('.card') : null);
    }, { passive: true });
    function refresh() {
      if (clientX === null || reduced || !pointer.matches || document.hidden) return;
      var target = document.elementFromPoint(clientX, clientY);
      track(target && target.closest('.card'));
    }
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', refresh, { passive: true, capture: true });
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', leave);
    pointer.addEventListener('change', leave);
    motion.addEventListener('change', leave);
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
    initPreviews();
    initAccordion();
    initSpotlight();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
