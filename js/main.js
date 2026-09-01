/* =============================================================
   Ліцей №25 — інтерактив лендінга
   Без залежностей. Усі анімації поважають prefers-reduced-motion.
   ============================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     НАЛАШТУВАННЯ ФОРМИ

     Порожнє значення → заявка формується як лист у поштовому
     клієнті батьків (mailto) на адресу нижче. Працює одразу.

     Щоб заявки приходили на пошту автоматично, без відкриття
     поштового клієнта: зареєструйте безкоштовну форму на
     https://formspree.io (вкажіть 25.kyiv.school@gmail.com),
     скопіюйте виданий рядок і вставте його у FORM_ENDPOINT.
     ----------------------------------------------------------- */
  var FORM_ENDPOINT = '';                              // напр. 'https://formspree.io/f/abcdwxyz'
  var SCHOOL_EMAIL  = '25.kyiv.school@gmail.com';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isReduced = function () { return reduced.matches; };

  /* ============================ Рік у футері ============================ */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================ Шапка ============================ */
  var hdr = $('#hdr');
  var lastStuck = null;
  function syncHeader() {
    var stuck = window.scrollY > 24;
    if (stuck !== lastStuck) {
      hdr.classList.toggle('is-stuck', stuck);
      lastStuck = stuck;
    }
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  /* ============================ Мобільне меню ============================ */
  var burger = $('#burger');
  var mnav = $('#mnav');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    mnav.classList.toggle('is-open', open);
    mnav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);

    var links = $$('.mnav__link, .mnav__cta', mnav);
    links.forEach(function (el, i) {
      el.style.transitionDelay = open && !isReduced() ? (60 + i * 40) + 'ms' : '0ms';
    });
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('.mnav__link', mnav).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  $('.mnav__cta', mnav).addEventListener('click', function () { setMenu(false); });

  /* ============================ Паралакс hero ============================ */
  var layers = $$('[data-parallax]');
  if (layers.length) {
    var ticking = false;
    var basis = layers.map(function (el) {
      return parseFloat(el.getAttribute('data-parallax')) || 0;
    });

    function paint() {
      ticking = false;
      if (isReduced()) return;
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;   // hero вже за межами екрана
      layers.forEach(function (el, i) {
        var shift = y * basis[i];
        var extra = el.classList.contains('hero__layer--back') ? ' scale(1.1)' : '';
        el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)' + extra;
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
  }

  /* ============================ Поява при скролі ============================ */
  var revealables = $$('.reveal');
  if (!('IntersectionObserver' in window) || isReduced()) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(function (el) { el.dataset.counted = '1'; });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        $$('[data-count]', e.target).forEach(countUp);
        revObs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { revObs.observe(el); });
  }

  function countUp(el) {
    if (el.dataset.counted) return;
    var target = parseInt(el.getAttribute('data-count'), 10);
    var label = el.textContent.trim();
    // Не чіпаємо нечислові підписи (напр. римське «XII»).
    if (isNaN(target) || !/^\d+$/.test(label)) { el.dataset.counted = '1'; return; }
    el.dataset.counted = '1';

    var dur = 1100;
    var from = target > 1000 ? Math.round(target * 0.72) : 0;
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ============================ Before / After ============================ */
  var ba = $('#ba');
  if (ba) {
    var baClip = $('#baClip');
    var baHandle = $('#baHandle');
    var dragging = false;

    function setBA(pct) {
      pct = Math.max(0, Math.min(100, pct));
      baClip.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      baHandle.style.left = pct + '%';
      ba.setAttribute('aria-valuenow', Math.round(pct));
      ba.setAttribute('aria-valuetext', Math.round(pct) + '% архівного знімка');
    }

    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setBA((x / r.width) * 100);
    }

    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture && ba.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    ba.addEventListener('pointermove', function (e) {
      if (dragging) fromEvent(e);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      ba.addEventListener(ev, function () { dragging = false; });
    });

    ba.addEventListener('keydown', function (e) {
      var cur = parseFloat(ba.getAttribute('aria-valuenow')) || 50;
      var step = e.shiftKey ? 10 : 4;
      if (e.key === 'ArrowLeft')       { setBA(cur - step); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setBA(cur + step); e.preventDefault(); }
      else if (e.key === 'Home')       { setBA(0); e.preventDefault(); }
      else if (e.key === 'End')        { setBA(100); e.preventDefault(); }
    });

    setBA(50);
  }

  /* ============================ Segmented control ============================ */
  function initSeg(seg, onChange) {
    if (!seg) return null;
    var pill = $('.seg__pill', seg);
    var btns = $$('.seg__btn', seg);

    function movePill() {
      var active = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0];
      if (!active || !pill) return;
      pill.style.width = active.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    }

    function select(btn, focusIt) {
      btns.forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
        b.tabIndex = b === btn ? 0 : -1;
      });
      movePill();
      if (focusIt) btn.focus();
      if (onChange) onChange(btn, btns.indexOf(btn));
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { select(b, false); });
      b.addEventListener('keydown', function (e) {
        var i = btns.indexOf(b);
        if (e.key === 'ArrowRight') { select(btns[(i + 1) % btns.length], true); e.preventDefault(); }
        if (e.key === 'ArrowLeft')  { select(btns[(i - 1 + btns.length) % btns.length], true); e.preventDefault(); }
      });
    });

    btns.forEach(function (b) { b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    movePill();
    window.addEventListener('resize', movePill);
    // Шрифти вантажаться асинхронно — переміряти після їх готовності.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

    return { move: movePill, select: select, btns: btns };
  }

  /* --- День із життя --- */
  var dayPanels = $$('.day__panel');
  var daySeg = initSeg($('#daySeg'), function (btn, i) {
    dayPanels.forEach(function (p, pi) {
      p.hidden = pi !== i;
      p.classList.remove('is-entering');
    });
    var shown = dayPanels[i];
    if (shown && !isReduced()) {
      void shown.offsetWidth;
      shown.classList.add('is-entering');
    }
  });

  /* ============================ FAQ ============================ */
  $$('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      // Одночасно розкрите лише одне питання — як у списках iOS.
      $$('.faq__q').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      q.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ============================ Пошук по педагогах ============================ */
  var search = $('#staffSearch');
  if (search) {
    var rows = $$('.glist__row');
    var groups = $$('.glist__group');
    var countEl = $('#staffCount');
    var emptyEl = $('#staffEmpty');
    var total = rows.length;

    function plural(n) {
      var d10 = n % 10, d100 = n % 100;
      if (d10 === 1 && d100 !== 11) return 'педагог';
      if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'педагоги';
      return 'педагогів';
    }

    function applyFilter() {
      var q = search.value.trim().toLowerCase().replace(/['’ʼ`]/g, "'");
      var shown = 0;

      rows.forEach(function (r) {
        var hit = !q || (r.getAttribute('data-s') || '').indexOf(q) !== -1;
        r.hidden = !hit;
        if (hit) shown++;
      });

      groups.forEach(function (g) {
        var any = $$('.glist__row', g).some(function (r) { return !r.hidden; });
        g.hidden = !any;
      });

      countEl.textContent = q
        ? 'Знайдено ' + shown + ' ' + plural(shown)
        : total + ' ' + plural(total);
      emptyEl.hidden = shown !== 0;
    }

    search.addEventListener('input', applyFilter);
    applyFilter();
  }

  /* ============================ Bottom sheet ============================ */
  var sheet = $('#sheet');
  var panel = $('#sheetPanel');
  var sheetBody = $('#sheetBody');
  var sheetDone = $('#sheetDone');
  var sheetTitle = $('#sheetTitle');
  var sheetSub = $('.sheet__sub', sheet);
  var formType = $('#formType');
  var form = $('#applyForm');
  var lastFocused = null;

  var TYPES = {
    tour:  { label: 'Екскурсія школою', title: 'Записатися на екскурсію', sub: 'Покажемо класи, лабораторії, їдальню та укриття. Оберіть зручний час — ми передзвонимо для підтвердження.' },
    apply: { label: 'Заявка на вступ',  title: 'Подати заявку на вступ',  sub: 'Заповніть коротку форму — адміністрація зв\'яжеться з вами й підкаже перелік документів.' }
  };

  var typeSeg = initSeg($('#typeSeg'), function (btn) {
    applyType(btn.getAttribute('data-type'));
  });

  function applyType(key) {
    var t = TYPES[key] || TYPES.tour;
    formType.value = t.label;
    sheetTitle.textContent = t.title;
    sheetSub.textContent = t.sub;
    if (typeSeg) {
      typeSeg.btns.forEach(function (b) {
        b.setAttribute('aria-selected', String(b.getAttribute('data-type') === key));
        b.tabIndex = b.getAttribute('data-type') === key ? 0 : -1;
      });
      typeSeg.move();
    }
  }

  function focusables() {
    return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function openSheet(key) {
    lastFocused = document.activeElement;
    // Спершу згорнути меню — воно теж керує блокуванням скролу тіла.
    if (mnav.classList.contains('is-open')) setMenu(false);
    resetForm();
    applyType(key);
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked', 'sheet-open');
    // Дати панелі стати видимою, лише потім переміщати фокус і пігулку.
    requestAnimationFrame(function () {
      if (typeSeg) typeSeg.move();
      var f = focusables();
      if (f.length) f[0].focus();
    });
  }

  function closeSheet() {
    // Вивести фокус назовні ДО aria-hidden, інакше фокус лишиться у прихованому піддереві.
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked', 'sheet-open');
    panel.style.transform = '';
  }

  function resetForm() {
    form.reset();
    $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); });
    sheetBody.hidden = false;
    sheetDone.hidden = true;
  }

  $$('[data-sheet-open]').forEach(function (b) {
    b.addEventListener('click', function () { openSheet(b.getAttribute('data-sheet-open')); });
  });
  $$('[data-sheet-close]').forEach(function (b) {
    b.addEventListener('click', closeSheet);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (sheet.classList.contains('is-open')) { closeSheet(); return; }
      if (mnav.classList.contains('is-open')) setMenu(false);
      return;
    }
    if (e.key !== 'Tab' || !sheet.classList.contains('is-open')) return;

    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  /* --- Закриття свайпом вниз (мобільна розкладка) --- */
  (function () {
    var grab = $('#sheetGrab');
    if (!grab) return;
    var startY = 0, dy = 0, active = false;

    grab.addEventListener('pointerdown', function (e) {
      if (window.innerWidth >= 640) return;
      active = true; startY = e.clientY; dy = 0;
      panel.classList.add('is-dragging');
      grab.setPointerCapture && grab.setPointerCapture(e.pointerId);
    });
    grab.addEventListener('pointermove', function (e) {
      if (!active) return;
      dy = Math.max(0, e.clientY - startY);
      panel.style.transform = 'translateY(' + dy + 'px)';
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      grab.addEventListener(ev, function () {
        if (!active) return;
        active = false;
        panel.classList.remove('is-dragging');
        panel.style.transform = '';
        if (dy > 110) closeSheet();
      });
    });
  })();

  /* ============================ Валідація та надсилання ============================ */
  function fieldOf(input) { return input.closest('.field'); }

  function validate(input) {
    var v = (input.value || '').trim();
    var ok = true;

    if (input.id === 'f-name')  ok = v.length >= 2;
    if (input.id === 'f-phone') ok = (v.replace(/\D/g, '').length >= 9);
    if (input.id === 'f-grade') ok = v !== '';
    if (input.id === 'f-email') ok = (v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));

    fieldOf(input).classList.toggle('is-invalid', !ok);
    return ok;
  }

  ['f-name', 'f-phone', 'f-email', 'f-grade'].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('blur', function () { if (el.value.trim()) validate(el); });
    el.addEventListener('input', function () {
      if (fieldOf(el).classList.contains('is-invalid')) validate(el);
    });
  });

  function showDone(text) {
    sheetBody.hidden = true;
    sheetDone.hidden = false;
    $('#doneText').textContent = text;
    var btn = $('.btn', sheetDone);
    if (btn) btn.focus();
  }

  function buildMailto(data) {
    var subject = data.type + ' — ' + data.name;
    var lines = [
      'Тип заявки: ' + data.type,
      'Ім\'я батьків: ' + data.name,
      'Телефон: ' + data.phone,
      'E-mail: ' + (data.email || '—'),
      'Клас дитини: ' + data.grade,
      '',
      'Коментар:',
      data.message || '—',
      '',
      '— Надіслано з сайту ліцею №25'
    ];
    return 'mailto:' + SCHOOL_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var inputs = ['f-name', 'f-phone', 'f-email', 'f-grade'].map(function (id) {
      return document.getElementById(id);
    });
    var bad = inputs.filter(function (el) { return !validate(el); });
    if (bad.length) { bad[0].focus(); return; }

    var data = {
      type:    formType.value,
      name:    $('#f-name').value.trim(),
      phone:   $('#f-phone').value.trim(),
      email:   $('#f-email').value.trim(),
      grade:   $('#f-grade').value,
      message: $('#f-msg').value.trim()
    };

    var submitBtn = $('#formSubmit');

    if (FORM_ENDPOINT) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Надсилаємо…';
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('bad response');
        showDone('Дякуємо, ' + data.name.split(' ')[0] + '! Заявку надіслано на пошту ліцею. Ми зв\'яжемося з вами найближчим робочим днем.');
      }).catch(function () {
        window.location.href = buildMailto(data);
        showDone('Не вдалося надіслати автоматично, тому ми відкрили ваш поштовий клієнт із готовим листом. Залишилось натиснути «Надіслати».');
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Надіслати заявку';
      });
    } else {
      window.location.href = buildMailto(data);
      showDone('Ми відкрили ваш поштовий клієнт із готовим листом на ' + SCHOOL_EMAIL + '. Залишилось натиснути «Надіслати».');
    }
  });

})();
