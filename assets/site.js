/* Meridian — Clinical concept site interactions */
(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.querySelector('.nav-mobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      mobile.classList.toggle('open');
      var open = mobile.classList.contains('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobile.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobile.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Reveal on scroll (adds both 'in' and 'show' for cross-page compatibility)
  function showEl(el) { el.classList.add('in'); el.classList.add('show'); }
  function showAll() { document.querySelectorAll('.reveal').forEach(showEl); }

  // In iframe contexts (canvas preview, embeds) IO root is the parent frame —
  // elements never intersect. Detect and show all reveals immediately.
  var inIframe = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  if (inIframe) {
    showAll();
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { showEl(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 80px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    // Safety net: show any still-hidden reveals after 1.2 s (e.g. slow scroll contexts)
    setTimeout(showAll, 1200);
  } else {
    showAll();
  }

  // Nav active link based on path
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();
