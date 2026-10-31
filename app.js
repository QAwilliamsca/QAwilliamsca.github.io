(function () {
  var reduce = window.REDUCE;

  // Scroll reveals
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Case-study overlays, addressed as #/name so each one has its own link
  var overlays = {};
  document.querySelectorAll(".overlay").forEach(function (o) { overlays[o.id] = o; });
  var lastFocus = null;
  var current = null;

  function openOverlay(id) {
    var o = overlays[id];
    if (!o) return;
    if (current && current !== o) closeOverlay(true);
    lastFocus = document.activeElement;
    o.classList.add("open");
    o.setAttribute("aria-hidden", "false");
    o.scrollTop = 0;
    document.body.classList.add("locked");
    current = o;
    var btn = o.querySelector("[data-close]");
    if (btn) btn.focus();
  }

  function closeOverlay(silent) {
    if (!current) return;
    current.classList.remove("open");
    current.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    current = null;
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function route() {
    var m = location.hash.match(/^#\/([\w-]+)$/);
    if (m && overlays[m[1]]) openOverlay(m[1]); else closeOverlay();
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) {
      e.preventDefault();
      history.pushState("", document.title, location.pathname + location.search + "#work");
      route();
      return;
    }
    var copy = e.target.closest("[data-copy]");
    if (copy) {
      var done = function () { var t = copy.textContent; copy.textContent = "Copied"; setTimeout(function () { copy.textContent = t; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () {});
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && current) {
      history.pushState("", document.title, location.pathname + location.search + "#work");
      route();
    }
    // Keep Tab inside the open overlay
    if (e.key === "Tab" && current) {
      var f = current.querySelectorAll("a[href], button");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Fly-through: scroll position drives the depth of each project card.
  // Only on wide screens with motion allowed; otherwise the plain list stays.
  var fly = document.getElementById("fly");
  if (fly) {
    var root = document.documentElement;
    var track = fly.querySelector(".fly-track");
    var stage = fly.querySelector(".fly-stage");
    var cards = Array.prototype.slice.call(fly.querySelectorAll(".fcard"));
    var now = document.getElementById("fly-now");
    var N = cards.length;
    var DEPTH = 1100;
    var STICKY = 100; // matches .fly-stage top in the CSS, under the fixed header
    var wide = window.matchMedia("(min-width: 900px)");
    var ticking = false;

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function enabled() { return wide.matches && !window.REDUCE; }
    function scrollable() { return Math.max(1, track.offsetHeight - stage.offsetHeight); }

    function render() {
      ticking = false;
      if (!enabled()) return;
      var top = track.getBoundingClientRect().top;
      var p = clamp((STICKY - top) / scrollable(), 0, 1) * (N - 1); 
      cards.forEach(function (c, i) {
        var d = i - p;
        var side = i % 2 ? 1 : -1;
        var x = d >= 0 ? side * 300 * clamp(d, 0, 1.5) : side * -d * 900;
        var y = 24 * clamp(d, 0, 2);
        var op = d >= 0 ? Math.max(0, 1 - d * 0.6) : Math.max(0, 1 + d * 2.2);
        c.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + (-d * DEPTH).toFixed(1) + "px)";
        c.style.opacity = op.toFixed(3);
        c.style.pointerEvents = Math.abs(d) < 0.5 ? "auto" : "none";
        c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      });
      now.textContent = "0" + (Math.round(p) + 1);
    }

    function request() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

    function apply() {
      root.classList.toggle("fly-on", enabled());
      if (!enabled()) cards.forEach(function (c) { c.style.transform = c.style.opacity = c.style.pointerEvents = c.style.zIndex = ""; });
      request();
    }

    // Keyboard users: focusing a card scrolls the page so that card is in front.
    cards.forEach(function (c, i) {
      c.addEventListener("focus", function () {
        if (!enabled()) return;
        var y = track.getBoundingClientRect().top + window.pageYOffset - STICKY + (i / (N - 1)) * scrollable();
        window.scrollTo(0, y);
      });
    });

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", apply);
    wide.addEventListener ? wide.addEventListener("change", apply) : wide.addListener(apply);
    apply();
  }

  window.addEventListener("hashchange", route);
  route();
})();
