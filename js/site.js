(function () {
  var doc = document;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };

  // ---- cabecera: se esconde al bajar, vuelve al subir
  var hdr = $('.hdr');
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (doc.body.classList.contains('menu-open')) return;
    if (y > lastY && y > hdr.offsetHeight) hdr.classList.add('is-hidden');
    else if (y < lastY) hdr.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  // ---- menú móvil
  var burger = $('.burger');
  var menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = doc.body.classList.toggle('menu-open');
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
  }

  // ---- home: al señalar un proyecto, su imagen cubre el vídeo de fondo
  var bgs = $$('.ph-bg');
  var showBg = function (i) {
    bgs.forEach(function (b, n) { b.classList.toggle('is-active', n === i); });
  };
  $$('.ph-item').forEach(function (a) {
    var i = +a.dataset.i;
    a.addEventListener('mouseenter', function () { showBg(i); });
    a.addEventListener('focus', function () { showBg(i); });
    a.addEventListener('mouseleave', function () { showBg(-1); });
    a.addEventListener('blur', function () { showBg(-1); });
  });
  window.addEventListener('pageshow', function () { showBg(-1); });

  // ---- animación de entrada
  var anims = $$('.anim');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    anims.forEach(function (el) { io.observe(el); });
  } else {
    anims.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- vídeos propios
  $$('.vid').forEach(function (box) {
    var v = $('video', box);
    var btn = $('.vid-play', box);
    btn.addEventListener('click', function () {
      $$('.vid video').forEach(function (o) { if (o !== v) o.pause(); });
      v.controls = true;
      v.play();
    });
    v.addEventListener('play', function () { box.classList.add('is-playing'); });
    v.addEventListener('pause', function () { if (!v.seeking) box.classList.remove('is-playing'); });
    v.addEventListener('ended', function () { box.classList.remove('is-playing'); });
  });

  // ---- galería: pase de diapositivas
  $$('.gal-slideshow').forEach(function (g) {
    var slides = $$('.ss-slide', g);
    var thumbs = $$('.ss-thumb', g);
    var i = 0;
    var timer;
    var go = function (n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === i); });
    };
    $('.ss-prev', g).addEventListener('click', function () { go(i - 1); });
    $('.ss-next', g).addEventListener('click', function () { go(i + 1); });
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    if (g.dataset.autoplay === 'true') {
      timer = setInterval(function () { go(i + 1); }, +g.dataset.duration || 5000);
      g.addEventListener('pointerdown', function () { clearInterval(timer); });
    }
  });

  // ---- galería: tira horizontal sin fin (la imagen activa queda centrada)
  $$('.gal-reel').forEach(function (g) {
    var track = $('.reel-track', g);
    var orig = $$('.reel-item', g);
    if (!orig.length) return;
    var pre = doc.createDocumentFragment();
    var post = doc.createDocumentFragment();
    orig.forEach(function (el) {
      [pre, post].forEach(function (frag) {
        var copy = el.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        frag.appendChild(copy);
      });
    });
    track.insertBefore(pre, track.firstChild);
    track.appendChild(post);
    var items = $$('.reel-item', g);
    var mid = function (el) { return el.offsetLeft + el.offsetWidth / 2; };
    var center = function (el, smooth) {
      track.scrollTo({ left: mid(el) - track.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
    };
    var current = function () {
      var c = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      items.forEach(function (el, n) {
        if (Math.abs(mid(el) - c) < Math.abs(mid(items[best]) - c)) best = n;
      });
      return best;
    };
    // si nos salimos del juego central, saltamos (sin que se note) a la copia equivalente
    var rewind = function () {
      var w = orig[0].offsetLeft - items[0].offsetLeft;
      var start = items[0].offsetLeft;
      var c = track.scrollLeft + track.clientWidth / 2;
      if (c < start + w) track.scrollLeft += w;
      else if (c >= start + 2 * w) track.scrollLeft -= w;
    };
    center(orig[0], false);
    var idle;
    track.addEventListener('scroll', function () {
      clearTimeout(idle);
      idle = setTimeout(rewind, 140);
    }, { passive: true });
    window.addEventListener('resize', function () { center(items[current()], false); });

    var moved = false;
    var drag = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: track.scrollLeft };
      moved = false;
      track.style.scrollSnapType = 'none';
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) > 4) moved = true;
      track.scrollLeft = drag.left - (e.clientX - drag.x);
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      drag = null;
      track.classList.remove('is-dragging');
      center(items[current()], true);
      setTimeout(function () { track.style.scrollSnapType = ''; }, 400);
    });
    items.forEach(function (el) {
      el.addEventListener('click', function () { if (!moved) center(el, true); });
      el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
    var prev = $('.reel-prev', g);
    var next = $('.reel-next', g);
    if (prev) prev.addEventListener('click', function () { center(items[Math.max(0, current() - 1)], true); });
    if (next) next.addEventListener('click', function () { center(items[Math.min(items.length - 1, current() + 1)], true); });
  });

  // ---- galería: mosaico (reparte por la columna más corta)
  var masonry = function () {
    $$('.gal-masonry').forEach(function (g) {
      var cols = Math.max(1, +g.dataset.cols || 3);
      if (window.innerWidth < 768) cols = Math.min(cols, 2);
      if (+g.dataset.built === cols) return;
      var figs = $$('.ms-item', g);
      $$('.ms-col', g).forEach(function (c) { c.remove(); });
      var colEls = [];
      var heights = [];
      for (var c = 0; c < cols; c++) {
        var d = doc.createElement('div');
        d.className = 'ms-col';
        g.appendChild(d);
        colEls.push(d);
        heights.push(0);
      }
      figs.sort(function (a, b) { return a.dataset.n - b.dataset.n; });
      figs.forEach(function (f, n) {
        if (!f.dataset.n) f.dataset.n = n;
        var k = heights.indexOf(Math.min.apply(null, heights));
        colEls[k].appendChild(f);
        heights[k] += 1 / (+f.dataset.ar || 1);
      });
      g.dataset.built = cols;
    });
  };
  // ---- galería: filas justificadas
  var strips = function () {
    $$('.gal-strips').forEach(function (g) {
      var cs = getComputedStyle(g);
      var gut = parseFloat(cs.columnGap) || 0;
      var target = +g.dataset.rh || 300;
      var W = g.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 0.5;
      var row = [];
      var sum = 0;
      var flush = function (justify) {
        if (!row.length) return;
        var h = (W - gut * (row.length - 1)) / sum;
        if (!justify) h = Math.min(h, target);
        row.forEach(function (f) { f.style.setProperty('--h', h + 'px'); });
        row = [];
        sum = 0;
      };
      $$('.st-item', g).forEach(function (f) {
        var ar = +f.dataset.ar || 1;
        if (row.length) {
          var hNow = (W - gut * (row.length - 1)) / sum;
          var hNext = (W - gut * row.length) / (sum + ar);
          if (Math.abs(hNext - target) > Math.abs(hNow - target)) flush(true);
        }
        row.push(f);
        sum += ar;
      });
      flush(false);
    });
  };

  masonry();
  strips();
  window.addEventListener('resize', function () { masonry(); strips(); });

  // ---- carrusel
  $$('.carousel').forEach(function (c) {
    var track = $('.car-track', c);
    var step = function (dir) {
      var w = $('.car-slide', c).offsetWidth;
      track.scrollBy({ left: dir * w, behavior: 'smooth' });
    };
    var prev = $('.car-prev', c);
    var next = $('.car-next', c);
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    var sync = function () { prev.hidden = next.hidden = track.scrollWidth <= track.clientWidth + 1; };
    sync();
    window.addEventListener('resize', sync);
  });

  // ---- marquesina
  $$('.blk-marquee').forEach(function (m) {
    var track = $('.mq-track', m);
    var item = $('.mq-item', track);
    var w = item.offsetWidth;
    if (!w) return;
    var copies = Math.ceil(m.offsetWidth / w) + 1;
    for (var n = 0; n < copies; n++) track.appendChild(item.cloneNode(true));
    var speed = (+m.dataset.speed || 0.5) * 120; // px por segundo
    var dir = m.dataset.dir === 'right' ? 1 : -1;
    var x = 0;
    var last = performance.now();
    var paused = false;
    m.addEventListener('mouseenter', function () { paused = true; });
    m.addEventListener('mouseleave', function () { paused = false; });
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function tick(t) {
      var dt = (t - last) / 1000;
      last = t;
      if (!paused && !reduce) {
        x += dir * speed * dt;
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = 'translateX(' + x + 'px)';
      }
      requestAnimationFrame(tick);
    })(last);
  });
})();
