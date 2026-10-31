// Small touches that make the page feel alive. Everything here is skipped when motion is reduced.
(function () {
  var reduce = window.REDUCE;
  // If the device asks for reduced motion, let the visitor choose to play the animations anyway.
  var pill = document.getElementById("motion-pill");
  if (pill && window.OS_REDUCE) {
    pill.hidden = false;
    pill.textContent = reduce ? "Animations paused · Play animations" : "Pause animations";
    pill.addEventListener("click", function () {
      try { if (reduce) localStorage.setItem("motion", "on"); else localStorage.removeItem("motion"); } catch (e) {}
      location.reload();
    });
  }
  var root = document.documentElement;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Scroll progress bar
  var bar = document.querySelector(".progress");
  function progress() {
    if (!bar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")";
  }
  window.addEventListener("scroll", progress, { passive: true });
  progress();

  // Split section headings into words so they rise in one by one
  document.querySelectorAll("h2.reveal").forEach(function (h) {
    var i = 0;
    var nodes = Array.prototype.slice.call(h.childNodes);
    h.textContent = "";
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
          var s = document.createElement("span");
          s.className = "w"; s.style.setProperty("--i", i++); s.textContent = w;
          h.appendChild(s); h.appendChild(document.createTextNode(" "));
        });
      } else {
        n.classList.add("w"); n.style.setProperty("--i", i++);
        h.appendChild(n); h.appendChild(document.createTextNode(" "));
      }
    });
  });

  // Count-up numbers
  var counters = document.querySelectorAll("[data-count]");
  function setNum(el, v) { el.textContent = Math.round(v) + (el.getAttribute("data-suffix") || ""); }
  if (reduce || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) { setNum(el, +el.getAttribute("data-count")); });
  } else {
    counters.forEach(function (el) { setNum(el, 0); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), t0 = performance.now(), dur = 1400;
        (function step(now) {
          var t = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - t, 3);
          setNum(el, to * k);
          if (t < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Tool marquee: duplicate the strip so it loops without a gap
  var mt = document.querySelector(".mtrack");
  if (mt) {
    var clone = mt.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("class"); clone.className = "mtrack";
    mt.parentNode.appendChild(clone);
  }

  if (reduce) return;

  // Cursor spotlight, card glow and magnetic buttons (mouse only)
  if (fine) {
    var spot = document.querySelector(".spot");
    var mx = 0, my = 0, pending = false;
    document.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        if (spot) { spot.style.setProperty("--mx", mx + "px"); spot.style.setProperty("--my", my + "px"); spot.classList.add("on"); }
        var g = document.elementFromPoint(mx, my);
        var card = g && g.closest && g.closest(".stat, .card, .fcard");
        if (card) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--x", (mx - r.left) + "px");
          card.style.setProperty("--y", (my - r.top) + "px");
        }
        document.querySelectorAll(".btn, .explore, .mark").forEach(function (b) {
          var r = b.getBoundingClientRect();
          var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
          var near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
          b.style.transform = near ? "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.25).toFixed(1) + "px)" : "";
        });
      });
    });
    document.addEventListener("pointerleave", function () { if (spot) spot.classList.remove("on"); });
  }
})();
