/* Europass Academy – Landingpage-Interaktionen (ohne Abhängigkeiten) */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Header: transparent über dem Hero, danach weiß ---------- */
  var header = $('[data-header]');
  var hero = $('.hero');
  function updateHeader() {
    if (!header) return;
    var limit = hero ? Math.max(40, hero.offsetHeight * 0.12) : 40;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }

  /* ---------- Mobile Navigation ---------- */
  var toggle = $('[data-nav-toggle]');
  var nav = $('[data-nav]');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-menu', open);
    $('.nav-toggle__label', toggle).textContent = open ? 'Schließen' : 'Menü';
    if (open) { var first = $('a', nav); if (first) first.focus(); }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ---------- Aktiver Navigationspunkt ---------- */
  var navLinks = $$('.site-nav__list a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = byId[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = doc.getElementById(id); if (s) navObs.observe(s); });
  }

  /* ---------- Reveal (nur Bewegung, Inhalte bleiben sichtbar) ---------- */
  var reveals = $$('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Videoplayer: eigener Startbildschirm, kein Autoplay ---------- */
  var players = $$('[data-player]');
  function pauseOthers(current) {
    players.forEach(function (p) {
      var v = $('video', p);
      if (v && v !== current && !v.paused) v.pause();
    });
  }
  players.forEach(function (player) {
    var video = $('video', player);
    var cover = $('[data-play]', player);
    if (!video || !cover) return;
    cover.addEventListener('click', function () {
      player.classList.add('is-playing');
      video.setAttribute('controls', '');
      if (video.preload === 'none') video.preload = 'auto';
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () { /* Wiedergabe blockiert: Steuerelemente bleiben sichtbar */ }); }
      try { video.focus({ preventScroll: true }); } catch (err) { video.focus(); }
    });
    video.addEventListener('play', function () { pauseOthers(video); player.classList.add('is-playing'); video.setAttribute('controls', ''); });
    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
      video.removeAttribute('controls');
      try { video.currentTime = 0; } catch (err) {}
      cover.focus();
    });
  });

  /* ---------- Leistungen: Desktop = Register, Mobil = Akkordeon ---------- */
  var services = $('[data-services]');
  if (services) {
    var tabs = $$('.service__tab', services);
    var mq = window.matchMedia('(max-width: 960px)');
    function show(tab, single) {
      tabs.forEach(function (t) {
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        var open = t === tab ? true : (single ? false : t.getAttribute('aria-expanded') === 'true');
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
      });
    }
    function init() {
      var current = tabs.filter(function (t) { return t.getAttribute('aria-expanded') === 'true'; })[0] || tabs[0];
      show(current, true);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        if (mq.matches) {
          var isOpen = tab.getAttribute('aria-expanded') === 'true';
          var panel = doc.getElementById(tab.getAttribute('aria-controls'));
          tab.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          panel.hidden = isOpen;
        } else {
          show(tab, true);
        }
      });
      tab.addEventListener('keydown', function (e) {
        if (mq.matches) return;
        var next = null;
        if (e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); next.focus(); show(next, true); }
      });
    });
    init();
    var onChange = function () { init(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- Ablauf: Fortschrittslinie folgt dem Scrollen ---------- */
  var timeline = $('[data-timeline]');
  var fill = $('[data-timeline-fill]');
  var steps = $$('[data-step]');
  function updateTimeline() {
    if (!timeline || !fill) return;
    var rect = timeline.getBoundingClientRect();
    var mark = window.innerHeight * 0.55;
    var progress = (mark - rect.top) / Math.max(1, rect.height);
    progress = Math.max(0, Math.min(1, progress));
    fill.style.setProperty('--progress', (progress * 100).toFixed(1) + '%');
    steps.forEach(function (s) {
      var r = s.getBoundingClientRect();
      s.classList.toggle('is-active', r.top + 28 < mark);
    });
  }

  /* ---------- Mobile CTA ---------- */
  var mobileCta = $('[data-mobile-cta]');
  var contact = doc.getElementById('kontakt');
  function updateMobileCta() {
    if (!mobileCta || !hero) return;
    var past = hero.getBoundingClientRect().bottom < 0;
    var atContact = contact && contact.getBoundingClientRect().top < window.innerHeight;
    mobileCta.classList.toggle('is-visible', past && !atContact);
  }

  /* ---------- Scroll-Handler (gebündelt) ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHeader(); updateTimeline(); updateMobileCta();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateHeader(); updateTimeline(); updateMobileCta();

  /* ---------- Kooperationsbausteine → Anfrage ---------- */
  var modules = $('[data-modules]');
  var modulesCta = $('[data-modules-cta]');
  var modulesCount = $('[data-modules-count]');
  var message = doc.getElementById('f-nachricht');
  function selectedModules() {
    return $$('input:checked', modules).map(function (i) { return i.value; });
  }
  if (modules) {
    modules.addEventListener('change', function () {
      var n = selectedModules().length;
      modulesCount.textContent = n === 0 ? '' : (n === 1 ? '1 Baustein ausgewählt' : n + ' Bausteine ausgewählt');
    });
  }
  if (modulesCta && message) {
    modulesCta.addEventListener('click', function () {
      var sel = selectedModules();
      if (!sel.length) return;
      var intro = 'Interesse an folgenden Bausteinen:\n';
      var block = intro + sel.map(function (s) { return '– ' + s; }).join('\n');
      var current = message.value;
      var idx = current.indexOf(intro);
      if (idx !== -1) {
        var rest = current.slice(idx).split('\n\n');
        rest.shift();
        current = (current.slice(0, idx) + rest.join('\n\n')).trim();
      }
      message.value = block + (current ? '\n\n' + current : '\n\n');
      setTimeout(function () { try { message.focus({ preventScroll: true }); } catch (e) {} }, reduceMotion ? 0 : 600);
    });
  }

  /* ---------- Kontaktformular ---------- */
  var form = $('[data-form]');
  if (form) {
    var status = $('[data-status]', form);
    var submit = $('[data-submit]', form);
    var fields = $$('input[required], select[required], textarea[required]', form);
    var MAIL = 'hello@europassacademy.com';

    function validateField(el) {
      var wrap = el.closest('.field');
      var ok = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
      if (wrap) wrap.classList.toggle('is-invalid', !ok);
      var err = doc.getElementById(el.id + '-err');
      if (!ok) { el.setAttribute('aria-invalid', 'true'); if (err) el.setAttribute('aria-describedby', err.id); }
      else { el.removeAttribute('aria-invalid'); }
      return ok;
    }
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { if (el.closest('.field').classList.contains('is-invalid') || el.value) validateField(el); });
      el.addEventListener('change', function () { if (el.closest('.field').classList.contains('is-invalid')) validateField(el); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-invalid')) validateField(el); });
    });

    function collect() {
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
      return data;
    }
    function mailtoHref(d) {
      var body = [
        'Unternehmen: ' + (d.unternehmen || ''),
        'Ansprechpartner: ' + (d.ansprechpartner || ''),
        'E-Mail: ' + (d.email || ''),
        'Art des Unternehmens: ' + (d.unternehmensart || ''),
        'Berufsfeld: ' + (d.berufsfeld || ''),
        '',
        d.nachricht || ''
      ].join('\n');
      return 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Kooperationsanfrage – ' + (d.unternehmen || '')) + '&body=' + encodeURIComponent(body);
    }
    function setStatus(type, html) {
      status.hidden = false;
      status.className = 'form__status' + (type ? ' is-' + type : '');
      status.innerHTML = html;
    }
    function fallback(d, reason) {
      setStatus('error',
        '<strong>' + reason + '</strong>' +
        'Ihre Angaben sind nicht verloren. Bitte senden Sie Ihre Anfrage direkt per E-Mail an ' +
        '<a href="mailto:' + MAIL + '">' + MAIL + '</a> oder rufen Sie uns an: +212 694 236 609.' +
        '<br><a class="btn btn--blue" href="' + mailtoHref(d) + '">E-Mail mit Ihren Angaben öffnen</a>');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (el) { if (!validateField(el) && !firstBad) firstBad = el; });
      if (firstBad) {
        setStatus('error', '<strong>Bitte prüfen Sie die markierten Felder.</strong>Alle mit * gekennzeichneten Angaben werden benötigt.');
        firstBad.focus();
        return;
      }
      var data = collect();
      if (data.website) { form.reset(); return; } /* Spam-Schutz (Honeypot) */

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) { fallback(data, 'Das Formular ist noch nicht mit einem Server verbunden.'); return; }

      submit.disabled = true;
      var label = submit.textContent;
      submit.textContent = 'Wird gesendet …';
      status.hidden = true;

      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) { return { res: res, json: json }; });
      }).then(function (r) {
        if (r.res.ok && r.json && r.json.ok === true) {
          form.reset();
          $$('.field.is-invalid', form).forEach(function (f) { f.classList.remove('is-invalid'); });
          setStatus('success', '<strong>Vielen Dank, Ihre Anfrage ist bei uns eingegangen.</strong>Wir melden uns in der Regel innerhalb von zwei Werktagen, um einen Termin für ein Online-Erstgespräch abzustimmen.');
        } else {
          fallback(data, (r.json && r.json.error) ? r.json.error : 'Ihre Anfrage konnte gerade nicht gesendet werden.');
        }
      }).catch(function () {
        fallback(data, 'Ihre Anfrage konnte gerade nicht gesendet werden.');
      }).then(function () {
        clearTimeout(timer);
        submit.disabled = false;
        submit.textContent = label;
        status.focus && status.setAttribute('tabindex', '-1');
        try { status.focus({ preventScroll: false }); } catch (err) {}
      });
    });
  }
})();
