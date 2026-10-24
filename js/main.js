/* ============================================================
   main.js — navigation, scroll reveal, 3D tilt, counters
   ============================================================ */
(function () {

  /* ---------- smooth scroll for data-scroll buttons ---------- */
  document.querySelectorAll('[data-scroll]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.querySelector(b.getAttribute('data-scroll'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- sticky nav + active link ---------- */
  var nav = document.getElementById('nav');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function onScroll() {
    nav.classList.toggle('solid', window.scrollY > 40);
    var y = window.scrollY + window.innerHeight * 0.35;
    var active = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) active = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === active); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  if (burger) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el, i) {
    var p = el.parentElement;
    if (p && (p.classList.contains('grid') || p.classList.contains('stack-grid') || p.classList.contains('pipeline'))) {
      el.style.setProperty('--d', Array.prototype.indexOf.call(p.children, el));
    }
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3D tilt on the overview cards ---------- */
  document.querySelectorAll('.tilt-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      card.style.transform = 'perspective(1000px) rotateY(' + (x - 0.5) * 11 + 'deg) rotateX(' +
                             (0.5 - y) * 11 + 'deg) translateZ(14px)';
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  });

  /* ---------- chat window straightens as it enters view ---------- */
  var chat = document.getElementById('chatWindow');
  if (chat && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { chat.classList.toggle('flat', en.intersectionRatio > 0.55); });
    }, { threshold: [0, 0.55, 1] }).observe(chat);
  }

  /* ---------- counters ---------- */
  var counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-count'), 10), n = 0;
      var step = Math.max(1, Math.round(to / 32));
      var id = setInterval(function () {
        n += step;
        if (n >= to) { n = to; clearInterval(id); }
        el.textContent = n;
      }, 34);
    });
  }
  var stats = document.querySelector('.hero-stats');
  if (stats && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) runCounters();
    }, { threshold: 0.4 }).observe(stats);
  } else { runCounters(); }

  /* ---------- year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
